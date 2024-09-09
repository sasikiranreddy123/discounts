// @ts-check
import { join } from "path";
import { readFileSync } from "fs";
import express from "express";
import serveStatic from "serve-static";

import shopify from "./shopify.js";
import productCreator from "./product-creator.js";
import PrivacyWebhookHandlers from "./privacy.js";

const PORT = parseInt(
  process.env.BACKEND_PORT || process.env.PORT || "3000",
  10
);

const STATIC_PATH =
  process.env.NODE_ENV === "production"
    ? `${process.cwd()}/frontend/dist`
    : `${process.cwd()}/frontend/`;

const app = express();

// Set up Shopify authentication and webhook handling
app.get(shopify.config.auth.path, shopify.auth.begin());
app.get(
  shopify.config.auth.callbackPath,
  shopify.auth.callback(),
  shopify.redirectToShopifyOrAppRoot()
);
app.post(
  shopify.config.webhooks.path,
  shopify.processWebhooks({ webhookHandlers: PrivacyWebhookHandlers })
);

// If you are adding routes outside of the /api path, remember to
// also add a proxy rule for them in web/frontend/vite.config.js

app.use("/api/*", shopify.validateAuthenticatedSession());

app.use(express.json());

app.post("/api/discounts/automatic", async (req, res) => {


  const client = new shopify.api.clients.Graphql({
    session: res.locals.shopify.session,
  });

  const {
    discountTitle,
    discountMethod,
    startTime,
    endTime,
    combinedWith,
    json
  } = req.body.discount

    console.log(req.body);
  try {
  

  const data = await client.query({
    data: {
      "query": `mutation discountAutomaticAppCreate($automaticAppDiscount: DiscountAutomaticAppInput!) {
        discountAutomaticAppCreate(automaticAppDiscount: $automaticAppDiscount) {
          userErrors {
            field
            message
          }
          automaticAppDiscount {
            discountId
            title
            startsAt
            endsAt
            status
            appDiscountType {
              appKey
              functionId
            }
            combinesWith {
              orderDiscounts
              productDiscounts
              shippingDiscounts
            }
          }
        }
      }`,
      "variables": {
        "automaticAppDiscount": {
          "title": discountTitle,
          "functionId": "843769cd-38f8-45f7-9297-f2e74ecef69a",
          "combinesWith": {
            "orderDiscounts": combinedWith.orderDiscounts,
            "productDiscounts": combinedWith.productDiscounts,
            "shippingDiscounts": combinedWith.shippingDiscounts
          },
          "startsAt": startTime,
          "endsAt": endTime ? `${endTime}`: null ,
          "metafields": [
            {
              "namespace": "order-discount",
              "key": "function-configuration",
              "type": "json",
              "value": json               
            }
          ]
        }
      },
    },
  });
  res.status(200).send(data);
}catch(e){


  res.status(201).send(e);

}

});



app.use(shopify.cspHeaders());
app.use(serveStatic(STATIC_PATH, { index: false }));

app.use("/*", shopify.ensureInstalledOnShop(), async (_req, res, _next) => {
  return res
    .status(200)
    .set("Content-Type", "text/html")
    .send(
      readFileSync(join(STATIC_PATH, "index.html"))
        .toString()
        .replace("%VITE_SHOPIFY_API_KEY%", process.env.SHOPIFY_API_KEY || "")
    );
});

app.listen(PORT);

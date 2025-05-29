// @ts-check
import { join } from "path";
import { readFileSync } from "fs";
import express from "express";
import serveStatic from "serve-static";

import shopify from "./shopify.js";
import productCreator from "./product-creator.js";
import PrivacyWebhookHandlers from "./privacy.js";
import {createAdminApiClient} from '@shopify/admin-api-client';


const shopifyreq = createAdminApiClient({
  storeDomain: 'testextcheckout.myshopify.com',
  apiVersion: '2023-04',
  accessToken: 'shpua_c544f28e51dd545d1920a3d10a96f511',
});
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
//app.use("/proxy/*", userauthenticate);

async function userauthenticate(req,res,next){
  console.log(req.query);
  next();
};

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

 app.get("/api/sasi", async (req, res) => {

       res.status(200).send('hiii');
   }  )

app.get("/proxy/test", async (req, res) => {

console.log('hiii');

res.status(200).send('test done');
});



// webhook

app.post("/webhook/test", async (req, res) => {

  console.log('webhook received');

  console.log(req.body);
  console.log(req.headers)
  
  });









app.post("/proxy/cart", async (req, res) => {

console.log(req.body);

res.status(200).send('post call successful');
});



// CREATE METAFIELD USING GQL WITH DEFINITION
app.post("/api/metafield/createGQL", async(req, res) => {
 
 
  const client = new shopify.api.clients.Graphql({
    session: res.locals.shopify.session,
  });

  try {
  const data = await client.query({
    data: {
      "query": `mutation CreateMetafieldDefinition($definition: MetafieldDefinitionInput!) {
        metafieldDefinitionCreate(definition: $definition) {
          createdDefinition {
            id
            name
          }
          userErrors {
            field
            message
            code
          }
        }
      }`,
      "variables": {
        "definition": {
          "name": "cart",
          "namespace": "custom",
          "key": "cart",
          "type": "json",
          "description": "cart json",
          "ownerType": "CUSTOMER",
          "pin": true,
          "visibleToStorefrontApi": true,
        }
      },
    },
  });
  res.status(200).send(data);
} catch(e){
res.status(201).send(e);
}
});



// UPDATE CUSTOMER  METAFIELDS 
app.post("/proxy/update", async(req, res) => {
 
 console.log('done bro !');
 
  const customer_id = req.query.logged_in_customer_id


  
  
  const cartData = JSON.stringify({items:req.body})
  
  console.log(cartData);
  if(!customer_id) res.send('please login to proceed');

 // res.status(200).send(cartData);

 
 const operation =`mutation customerUpdate($input: CustomerInput!) {
  customerUpdate(input: $input) {
    userErrors {
      field
      message
    }
    customer {
      id
      firstName
      lastName
      metafield(namespace:"pers",key:"cart"){
        id
        value
        namespace
        key
      }
      
    }
  }
}`;

const {data, errors, extensions} = await shopifyreq.request(operation, {
  variables: {
    input:{
      id: `gid://shopify/Customer/${customer_id}`,
      metafields:[
        {     
            id:"gid://shopify/Metafield/38993683120431",
            namespace: "pers",
            key: "cart",
            type: "json",
            value: cartData
        }
      ]
    }
  },
});
    if(errors) res.json(errors);
     res.json(data);
});

app.post("/api/products", async (_req, res) => {
  let status = 200;
  let error = null;

  try {
    await productCreator(res.locals.shopify.session);
  } catch (e) {
    console.log(`Failed to process products/create: ${e.message}`);
    status = 500;
    error = e.message;
  }
  res.status(status).send({ success: status === 200, error });
});

app.use(shopify.cspHeaders());
app.use(serveStatic(STATIC_PATH, { index: false }));

app.use("/*", shopify.ensureInstalledOnShop(), async (_req, res, _next) => {
  return res
    .status(200)
    .set("Content-Type", "text/html")
    .send(readFileSync(join(STATIC_PATH, "index.html")));
});

app.listen(PORT);

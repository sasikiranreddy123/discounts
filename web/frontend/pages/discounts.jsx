import React, {useState,useEffect, useCallback} from "react";


import {
  ActiveDatesCard,
  CombinationCard,
  DiscountClass,
  DiscountMethod,
  MethodCard
} from "@shopify/discount-app-components";

import {
  Page,
  TextField,
} from "@shopify/polaris";

import { useAppBridge } from "@shopify/app-bridge-react";
import { useAuthenticatedFetch } from "../hooks";


export default function PageName() {
  const app = useAppBridge();
  
  const authenticatedFetch = useAuthenticatedFetch();
    const [startTime, setStartTime] = useState("2024-08-13T04:30:00.000Z");
  const [endTime, setEndTime] = useState("");
  const [combinedWith, setCombinedWith] = useState({
    orderDiscounts: false,
    productDiscounts: false,
    shippingDiscounts: false,
  });
  const [discountMethod, setDiscountMethod] = useState(
    DiscountMethod.Automatic
  );
  const [discountTitle, setDiscountTitle] = useState("");
  const [discountCode, setDiscountCode] = useState("");

  const [json, setJson] = useState(`{"discount":[{"customer_order":n,"percentage":n},{"min_total_spent":150,"percentage":40}]}`);

  const handleChange = useCallback(

    
    (newValue) => setJson(newValue),
    [],
  );

 async function submitform() {

  let discount = {
    discountTitle,
    discountMethod,
    startTime,
    endTime,
    combinedWith,
    json
  }
  let   response = await authenticatedFetch("/api/discounts/automatic", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        discount: {
          ...discount  
        },
      }),
    });
  }

  
    

  return (
    <Page
       title="Create Custom Discounts"
       
       primaryAction={{
        content: "Save",
       onAction: submitform
       }}
      >

<MethodCard
      title="Custom"
      discountClass={DiscountClass.Order}
      discountMethod={{
        value: discountMethod,
        onChange: setDiscountMethod,
      }}
      discountTitle={{
        value: discountTitle,
        onChange: setDiscountTitle,
      }}
      discountCode={{
        value: discountCode,
        onChange: setDiscountCode,
      }}
    />

        <ActiveDatesCard
      startDate={{
        value: startTime,
        onChange: setStartTime,
      }}
      endDate={{
        value: endTime,
        onChange: setEndTime,
      }}
      timezoneAbbreviation="EST"
    />

<CombinationCard
      combinableDiscountTypes={{
        value: combinedWith,
        onChange: setCombinedWith,
      }}
      combinableDiscountCounts={{
        orderDiscountsCount: 0,
        productDiscountsCount: 0,
        shippingDiscountsCount: 0,
      }}
      discountClass={DiscountClass.Order}
      discountDescriptor=" Discount"
    />

     <TextField
      label="Input json for conditional discounts"
      value={json}
      onChange={handleChange}
      multiline={6}
      autoComplete="off"
    />


    </Page>
  );
}

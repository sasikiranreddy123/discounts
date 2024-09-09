// @ts-check
import { DiscountApplicationStrategy } from "../generated/api";

/**
 * @typedef {import("../generated/api").RunInput} RunInput
 * @typedef {import("../generated/api").FunctionRunResult} FunctionRunResult
 */

/**
 * @type {FunctionRunResult}
 */
const EMPTY_DISCOUNT = {
  discountApplicationStrategy: DiscountApplicationStrategy.First,
  discounts: [],
};

/**
 * @param {RunInput} input
 * @returns {FunctionRunResult}
 */
export function run(input) {
 
  const total_orders =  input.cart?.buyerIdentity?.customer?.numberOfOrders ;
  
  const total_amount_spent =  input.cart?.buyerIdentity?.customer?.amountSpent?.amount ;
  
  const discount_configurations = JSON.parse(input?.discountNode?.metafield?.value);


const  min_amount_purchased =  discount_configurations?.discount[1]?.min_total_spent ;
const  min_amount_purchased_disc =  discount_configurations?.discount[1]?.percentage ;

const discountable_nth_order = discount_configurations?.discount[0]?.customer_order ;

const discountable_nth_order_percent = discount_configurations?.discount[0]?.percentage ;

  if(total_orders == discountable_nth_order-1) return {
     discountApplicationStrategy: DiscountApplicationStrategy.First,
     discounts: [
      {
        message:`discount applied on order:${discountable_nth_order}  as ${total_orders} orders are already placed by you`,
        value:{
          percentage:{
            value: discountable_nth_order_percent
          }
        },
        targets:[
          {
            orderSubtotal:{
              excludedVariantIds:[]
            }

            
          }
        ]
      }
               ]
    }

    if(min_amount_purchased) {
    if(total_amount_spent > min_amount_purchased) return {
      discountApplicationStrategy: DiscountApplicationStrategy.First,
      discounts: [
       {
         message:`custom discount based on past purchase history`,
         value:{
           percentage:{
             value: min_amount_purchased_disc
           }
         },
         targets:[
           {
             orderSubtotal:{
               excludedVariantIds:[]
             }
 
             
           }
         ]
       }
                ]
     }
    }

  return EMPTY_DISCOUNT;
};
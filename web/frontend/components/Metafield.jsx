import { useAppQuery, useAuthenticatedFetch } from "../hooks";
import { useEffect } from "react";


export function Metafield() {

const fetch =  useAuthenticatedFetch();

useEffect(() => {
    fetch("/api/metafield/createGQL", {
      method: "POST"
    })
    .then(response => response.json())
    .then(result => console.log(result))
    .catch(error => console.log(error));
  })
     return (
        <>
        <div>hiiiiii sasi</div>
        </>
     )
};
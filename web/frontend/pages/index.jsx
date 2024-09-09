import {
  Card,
  Page,
  Layout,
  TextContainer,
  Image,
  Link,
  Text,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { useTranslation, Trans } from "react-i18next";

import { trophyImage } from "../assets";

import { ProductsCard } from "../components";



export default function HomePage() {
  const { t } = useTranslation();
  return (
    <Page narrowWidth>
      <h1>hiii sasi </h1>
    </Page>
  );
}

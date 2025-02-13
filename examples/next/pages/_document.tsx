import * as React from "react";
import { Head, Html, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <script
          src="/_next/static/react-render-tracker.js"
          data-config="inpage:true"
          defer
        />
      </Head>
      <Main />
      <NextScript />
    </Html>
  );
}

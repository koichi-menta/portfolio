import "src/styles/global.css";
import type { AppProps } from "next/app";
import { DopamineModeProvider } from "src/contexts/DopamineMode";
import { StyleSheetManager } from "styled-components";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <StyleSheetManager enableVendorPrefixes>
      <DopamineModeProvider>
        <Component {...pageProps} />
      </DopamineModeProvider>
    </StyleSheetManager>
  );
}

export default MyApp;

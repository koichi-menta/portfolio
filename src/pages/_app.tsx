import "src/styles/global.css";
import type { AppProps } from "next/app";
import { DopamineModeProvider } from "src/contexts/DopamineMode";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <DopamineModeProvider>
      <Component {...pageProps} />
    </DopamineModeProvider>
  );
}

export default MyApp;

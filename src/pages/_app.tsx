import "src/styles/global.css";
import type { AppProps } from "next/app";
import { DopagakiModeProvider } from "src/contexts/DopagakiMode";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <DopagakiModeProvider>
      <Component {...pageProps} />
    </DopagakiModeProvider>
  );
}

export default MyApp;

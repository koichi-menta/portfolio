import type { NextPage } from "next";
import Head from "next/head";
import { Top } from "src/components/container/Top";

const Home: NextPage = () => {
  return (
    <>
      <Head>
        <title>Koichi&apos;s portfolio</title>
        <meta name="description" content="Koichi's portfolio" />
      </Head>
      <Top />
    </>
  );
};

export default Home;

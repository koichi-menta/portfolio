import type { NextPage } from "next";
import Head from "next/head";
import { FaqContainer } from "src/components/container/Fap";
import { Layout } from "src/components/template/Layout";

const Faq: NextPage = () => {
  return (
    <>
      <Head>
        <title>Koichi's portfolio | faq</title>
        <meta name="description" content="Koichi's portfolio" />
      </Head>
      <Layout>
        <FaqContainer />
      </Layout>
    </>
  );
};

export default Faq;

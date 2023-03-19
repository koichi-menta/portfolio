import type { NextPage } from "next";
import Head from "next/head";
import { TimelineContainer } from "src/components/container/Timeline";
import { Layout } from "src/components/template/Layout";

const Timeline: NextPage = () => {
  return (
    <>
      <Head>
        <title>Koichi's portfolio | timeline</title>
        <meta name="description" content="Koichi's portfolio" />
      </Head>
      <Layout>
        <TimelineContainer />
      </Layout>
    </>
  );
};

export default Timeline;

import type { NextPage } from "next";
import Head from "next/head";
import { WorksContainer } from "src/components/container/Works";
import { Layout } from "src/components/template/Layout";

const Profile: NextPage = () => {
  return (
    <>
      <Head>
        <title>Koichi&apos;s portfolio | works</title>
        <meta name="description" content="Koichi's portfolio" />
      </Head>
      <Layout>
        <WorksContainer />
      </Layout>
    </>
  );
};

export default Profile;

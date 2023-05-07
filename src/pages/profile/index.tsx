import type { NextPage } from "next";
import Head from "next/head";
import { ProfileContainer } from "src/components/container/Profile";
import { Layout } from "src/components/template/Layout";

const Profile: NextPage = () => {
  return (
    <>
      <Head>
        <title>Koichi&apos;s portfolio | profile</title>
        <meta name="description" content="Koichi's portfolio" />
      </Head>
      <Layout>
        <ProfileContainer />
      </Layout>
    </>
  );
};

export default Profile;

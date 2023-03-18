import type { NextPage } from "next";
import Head from "next/head";
import { ProfileContainer } from "src/components/container/Profile";

const Profile: NextPage = () => {
  return (
    <>
      <Head>
        <title>Koichi's portfolio | profile</title>
        <meta name="description" content="Koichi's portfolio" />
      </Head>
      <ProfileContainer />
    </>
  );
};

export default Profile;

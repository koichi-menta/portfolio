import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import {
  WorkDetailContainer,
  ContainerProps,
} from "src/components/container/WorkDetail";
import { Layout } from "src/components/template/Layout";
import worksData from "src/works";

const WorkDetail: NextPage<ContainerProps> = ({ work }) => {
  return (
    <>
      <Head>
        <title>{`Koichi's portfolio | ${work.title}`}</title>
        <meta name="description" content={work.description} />
      </Head>
      <Layout>
        <WorkDetailContainer work={work} />
      </Layout>
    </>
  );
};

export const getStaticPaths: GetStaticPaths = () => {
  return {
    paths: worksData
      .filter((work) => work.detail)
      .map((work) => ({ params: { slug: work.slug } })),
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps<ContainerProps> = ({ params }) => {
  const work = worksData.find((work) => work.slug === params?.slug);
  if (!work?.detail) {
    return { notFound: true };
  }
  return { props: { work: { ...work, detail: work.detail } } };
};

export default WorkDetail;

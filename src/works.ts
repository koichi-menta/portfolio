import { ContainerProps as GenreProps } from "src/components/parts/GenreLabel";
type WorksData = {
  title: string;
  src: string;
  genre: GenreProps[];
  description: string;
  href: string;
};

const works: WorksData[] = [
  {
    title: "ポートフォリオサイト",
    src: "/images/work_portfolio.png",
    genre: [
      { type: "platform", label: "Web App" },
      { type: "default", label: "Next.js" },
      { type: "default", label: "TypeScript" },
      { type: "default", label: "Styled Components" },
      { type: "default", label: "Storybook" },
    ],
    description: `このサイトです。トップページには遊び心を追加して、メインコンテンツは余計なギミックを無くしてシンプルに表示しています。`,
    href: "",
  },
];

export default works;

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
  {
    title: "ドットキャラクターメーカー",
    src: "/images/work_dot_char_maker.png",
    genre: [
      { type: "platform", label: "Web App" },
      { type: "default", label: "React" },
      { type: "default", label: "TypeScript" },
      { type: "default", label: "Claude Code" },
    ],
    description: `ドットキャラクターをランダムな組み合わせで作成しダウンロードできるアプリです。`,
    href: "https://koichi-menta.github.io/dot-character-maker/",
  },
];

export default works;

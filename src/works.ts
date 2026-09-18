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
    title: "ロールプレイ型英語学習ゲーム「NarikiEigo」",
    src: "/images/work_nariki_eigo.png",
    genre: [
      { type: "platform", label: "Web App" },
      { type: "default", label: "Tauri" },
      { type: "default", label: "React" },
      { type: "default", label: "TypeScript" },
      { type: "default", label: "Rust" },
      { type: "default", label: "Cloudflare" },
      { type: "default", label: "Supabase" },
      { type: "default", label: "Claude Code" },
    ],
    description: `いろんな役になりきって英語を使う、ロールプレイ型英語学習ゲーム「NarikiEigo」を開発。カフェ接客やホラー実況、推しとの会話など、好きなシチュエーションで遊べます。`,
    href: "https://narikieigo.com/",
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

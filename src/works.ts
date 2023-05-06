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
      { type: "default", label: "Desktop App" },
    ],
    description: `詳細が入ります`,
    href: "#",
  },
];

export default works;

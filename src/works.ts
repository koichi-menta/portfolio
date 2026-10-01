import { ContainerProps as GenreProps } from "src/components/parts/GenreLabel";

export type TechStack = {
  category: string;
  items: string[];
};

export type Challenge = {
  title: string;
  body: string;
};

export type WorkDetail = {
  overview: string;
  background?: string;
  techStack: TechStack[];
  challenges: Challenge[];
};

export type WorksData = {
  slug: string;
  title: string;
  src: string;
  genre: GenreProps[];
  description: string;
  href: string;
  detail?: WorkDetail;
};

const works: WorksData[] = [
  {
    slug: "post-cue-studio",
    title: "X運用アプリ「post-cue-studio」",
    src: "/images/work_post_cue_studio.png",
    genre: [
      { type: "platform", label: "Web App" },
      { type: "default", label: "React Router" },
      { type: "default", label: "TypeScript" },
      { type: "default", label: "NestJS" },
      { type: "default", label: "PostgreSQL" },
      { type: "default", label: "OpenAI API" },
      { type: "default", label: "X API" },
      { type: "default", label: "AWS" },
      { type: "default", label: "Cloudflare" },
      { type: "default", label: "Claude Code" },
    ],
    description: `リポジトリのPRやdocフォルダを一次情報にして、AIにポスト内容を考えてもらうX運用アプリ。予約投稿へのリプライも予約投稿できます。`,
    href: "",
    detail: {
      overview: `リポジトリのPRやdocフォルダを読み取り、それを一次情報としてAIにポスト内容を考えてもらうアプリです。
考えてもらったポストは、その場で投稿することも、予約投稿することもできます。
最大の特徴は、予約投稿のリプライに予約投稿できることです。
長文のポストをスレッドに分けて一気に投稿したい時や、アンケートポストをしてアンケート締切時間にリプでメッセージしたい時などに、自動でポストすることができます。
自分用に作成した専用アプリのため、一般公開はしていません。`,
      background: `自分が運営しているNarikiEigoのSNSで使えないかと思い、自分用に作成した。`,
      techStack: [
        {
          category: "フロントエンド",
          items: ["React", "React Router", "TypeScript"],
        },
        { category: "バックエンド", items: ["NestJS", "Prisma", "PostgreSQL"] },
        { category: "外部API", items: ["X API", "GitHub API", "OpenAI API"] },
        { category: "認証", items: ["Amazon Cognito"] },
        {
          category: "インフラ",
          items: [
            "AWS Lightsail",
            "AWS CDK",
            "Docker Compose",
            "Cloudflare Workers",
            "Cloudflare Tunnel",
          ],
        },
        {
          category: "開発支援",
          items: ["Claude Code", "Cursor", "Codex", "Remotion"],
        },
      ],
      challenges: [
        {
          title: "初めてのAWSへのデプロイ",
          body: "AWSにデプロイするのは初めての試みだったので、AWS IAM Identity CenterとIAMの違いや、その他のサービスの役割を理解するのが大変だった。",
        },
        {
          title: "インフラをコードで管理する",
          body: "Cloudflareは利用したことがあったが、設定はすべてUIで行っていた。今回はAWS CDKを使ってインフラをコードで管理し、デプロイもコマンドで行ったので新鮮だった。",
        },
      ],
    },
  },
  {
    slug: "nariki-eigo",
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
    detail: {
      overview: `NarikiEigoは、ストリーマー好きな社会人で初級〜中級の英語学習者向けの、役になりきって英語を使うゲームです。
たとえば「カフェで接客」のゲームでは、カウンター越しにお客さんの英語の注文を聞き取り、確認して、正しく商品を作ります。
「推しと握手会」のゲームでは推しとのオンライングリーティングで推しの質問に答えて会話をしていきます。
大事なのは「英語を話せるようになる」ことではなく「特定の場面で使える英語を、遊びとして口にできる」ことです。`,
      background: `今まで使ってきた英語アプリは、知ってる単語や穴埋め形式かつ順番に沿ってに学ぶものばかりで、楽しいと感じたことはなかったです。
でもそうしないと身につかないことは頭で分かってるんだけど継続できませんでした。
でも、ふと思ったことがあります。
アニメの決め台詞なら覚えているし、日常会話のネタとして口にすることがあるなと！
ジョジョの「Exactly!」コードギアスの「オールハイル ブリターニア」Fateの「Unlimited Blade Works」などなど。
しかもこれらは勉強しようとしてないし、復習や継続も意識してません(多分)
他にも、ゲームやってたりストリーマーの配信を見てても同じようなことがあります。
韓国語はわからないのに「アーマーを割った」は「かっぱけっそ」と言うし、「いいね・好き」は「チョワヨ」と言うことは知っています。
これをテーマにした英語ゲームがあったら面白いのではないかと思ったのがきっかけです。`,
      techStack: [
        { category: "フロントエンド", items: ["React", "TypeScript"] },
        { category: "デスクトップアプリ", items: ["Tauri", "Rust"] },
        { category: "インフラ・BaaS", items: ["Cloudflare", "Supabase"] },
        { category: "開発支援", items: ["Claude Code","Cursor","Codex","Fgima"] },
      ],
      challenges: [
        {
          title: "音声認識の仕様と表記揺れの対応。",
          body: "実装で使っているウェブ標準の音声認識だと、相槌型や短い一単語の認識をしてくれないことが多い。また、1(one)、can't(can not)とか表記揺れや短縮形でミスになることがあった。認識しない単語は使わないルールを設けて、一旦の回避策を取っている。表記例は、短縮形は、それを網羅する。元データを作って比較するようにした。",
        },
      ],
    },
  },
  {
    slug: "dot-character-maker",
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
    detail: {
      overview: `ランダムでドット絵のキャラクターを生成できるアプリ`,
      background: `作りたかったサービス(NarikiEigo)でドット絵が必要だった。それならジェネレーターを作った方が使い勝手がいいかもと思った。`,
      techStack: [
        { category: "フロントエンド", items: ["React", "TypeScript"] },
        { category: "開発支援", items: ["Claude Code"] },
        { category: "インフラ", items: ["GitHub Pages"] },
      ],
      challenges: [
        {
          title: "ドット絵の違和感を伝える難しさ",
          body: "AIに依頼しても、どこかドットが抜けていたり、繋がりがおかしいところがあったけど、それをおかしいと伝えるのが難しかった。自分でドット絵を編集し、その編集した画像をAIに見せて「こうなるようにして」と指示し、解決した。",
        },
      ],
    },
  },
  {
    slug: "portfolio",
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
    detail: {
      overview: `トップページには遊び心を追加して、メインコンテンツは余計なギミックを無くしてシンプルに表示しています。`,
      background: `自分がフリーランスになったタイミングで、ポートフォリオを載せる場所が必要だと思って作成した。`,
      techStack: [
        {
          category: "フロントエンド",
          items: ["Next.js", "TypeScript", "Styled Components"],
        },
        { category: "開発環境", items: ["Storybook"] },
        { category: "インフラ", items: ["Amplify Hosting"] },
      ],
      challenges: [],
    },
  },
];

export default works;

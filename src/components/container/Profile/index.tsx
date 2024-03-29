import React from "react";
import styled from "styled-components";
import Link from "next/link";
import { TbBrandGithub, TbBrandTwitter, TbBrandYoutube } from "react-icons/tb";
import { Title } from "src/components/parts/Title";
import { ProfileImage } from "src/components/parts/ProfileImage";
import { colors } from "src/constants/colors";

export type ContainerProps = {};
type Props = {
  className?: string;
} & ContainerProps;

const Component = ({ className }: Props): JSX.Element => (
  <div className={className}>
    <div className="title">
      <Title>Profile</Title>
    </div>
    <div className="profileImage">
      <ProfileImage />
    </div>
    <div className="snsList">
      <a
        href="https://github.com/koichi-menta"
        target="_blank"
        rel="noopener noreferrer"
      >
        <TbBrandGithub size={30} color="#333" title="github" />
      </a>
      <a
        href="https://twitter.com/tukivirtualcoin"
        target="_blank"
        rel="noopener noreferrer"
      >
        <TbBrandTwitter size={30} color="#333" title="twitter" />
      </a>
      <a
        href="https://www.youtube.com/@multipotential_playwork"
        target="_blank"
        rel="noopener noreferrer"
      >
        <TbBrandYoutube size={30} color="#333" title="youtube" />
      </a>
    </div>
    <div className="adoptionNotice">
      <strong>
        採用関係の方は
        <Link href="/faq" className="link">
          &nbsp;よくある質問&nbsp;
        </Link>
        をご覧いただけると嬉しいです。
      </strong>
    </div>
    <p className="description">
      フリーランスのフロントエンドエンジニア。チームファーストで仕事をすることを心がけています。元プログラミングスクール講師。MENTAでフロントエンドの学習相談を受付中。
    </p>
    <p className="skills">React/TypeScript/Next.js/GraphQL</p>
  </div>
);

const StyledComponent = styled(Component)`
  max-width: 550px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 16px;
  > .title {
    margin-top: 16px;
  }
  > .profileImage {
    margin-top: 16px;
    width: 150px;
    height: 150px;
  }
  > .snsList {
    margin-top: 16px;
    display: flex;
    gap: 16px;
  }
  > .adoptionNotice {
    margin-top: 16px;
    color: ${colors.mainText};
    .link {
      color: ${colors.mainText};
    }
  }
  > .description {
    margin-top: 16px;
    font-size: 14px;
    color: ${colors.mainText};
  }
  > .skills {
    margin-top: 16px;
    font-size: 14px;
    color: ${colors.mainText};
  }
`;

export const ProfileContainer = (props: ContainerProps): JSX.Element => {
  return <StyledComponent {...props} />;
};

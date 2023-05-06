import React from "react";
import styled from "styled-components";
import { GenreLabel } from "src/components/parts/GenreLabel";

export type ContainerProps = {
  title: string;
  description: string;
  link: string;
};
type Props = {
  className?: string;
} & ContainerProps;

const Component = ({
  className,
  title,
  description,
  link,
}: Props): JSX.Element => (
  <div className={className}>
    <h3 className="title">{title}</h3>
    <div className="item">
      <div className="image">
        <img
          src="https://placehold.jp/500x300.png"
          width={500}
          height={300}
          alt=""
        />
      </div>
      <div className="detail">
        <div className="contents">
          <h4>ポートフォリオサイト</h4>
          <div className="genre">
            <GenreLabel type="platform" label="Web App" />
            <GenreLabel label="Desktop App" />
          </div>
          <p className="description">{description}</p>
        </div>
        <a className="link" href={link}>
          サイトを見る
        </a>
      </div>
    </div>
  </div>
);

const StyledComponent = styled(Component)`
  width: 100%;
  > .title {
    font-size: 18px;
    font-weight: normal;
    color: #333;
    border-bottom: 1px solid #333;
    width: 120px;
    text-align: center;
    padding-bottom: 8px;
  }
  > .item {
    margin-top: 16px;
    display: flex;
    gap: 16px;
    > .image {
      width: 50%;
      flex-grow: 1;
      max-width: 500px;
      > img {
        width: 100%;
        vertical-align: bottom;
      }
    }
    > .detail {
      width: 50%;
      flex-grow: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      > .contents {
        .genre {
          display: flex;
          gap: 8px;
        }
      }
      > .link {
        width: 100%;
        display: block;
        text-align: center;
        color: #333;
        text-decoration: none;
        border: 1px solid #333;
        padding: 8px;
        :hover {
          background-color: #fafafa;
        }
      }
    }
  }
`;

export const WorkSection = (props: ContainerProps): JSX.Element => {
  return <StyledComponent {...props} />;
};

import React from "react";
import styled from "styled-components";
import { GenreLabel } from "src/components/parts/GenreLabel";
import worksData from "src/works";

export type ContainerProps = {};
type Props = {
  className?: string;
} & ContainerProps;

const Component = ({ className }: Props): JSX.Element => (
  <div className={className}>
    <h3 className="title">開発</h3>
    <div className="works">
      {worksData.map((item) => {
        return (
          <div className="item">
            <div className="image">
              <img src={item.src} width={500} height={300} alt="" />
            </div>
            <div className="detail">
              <div className="contents">
                <h4>{item.title}</h4>
                <div className="genre">
                  {item.genre.map((genre) => (
                    <GenreLabel type={genre.type} label={genre.label} />
                  ))}
                </div>
                <p className="description">{item.description}</p>
              </div>
              <a className="link" href={item.href}>
                サイトを見る
              </a>
            </div>
          </div>
        );
      })}
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
  > .works {
    > .item {
      margin-top: 16px;
      display: flex;
      border: 1px solid #666;
      border-radius: 10px;
      padding: 16px 0;
      > .image {
        width: 50%;
        flex-grow: 1;
        padding: 0 16px;
        max-width: 500px;
        > img {
          width: 100%;
          vertical-align: bottom;
          object-fit: cover;
        }
      }
      > .detail {
        width: 50%;
        flex-grow: 1;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        padding: 0 16px;
        border-left: 1px solid #666;
        > .contents {
          display: flex;
          flex-direction: column;
          gap: 12px;
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
          border-radius: 5px;
          :hover {
            background-color: #fafafa;
          }
        }
      }
    }
  }
`;

export const DevelopWorkSection = (props: ContainerProps): JSX.Element => {
  return <StyledComponent {...props} />;
};

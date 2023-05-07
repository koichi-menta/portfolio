import React from "react";
import styled from "styled-components";
import { GenreLabel } from "src/components/parts/GenreLabel";
import worksData from "src/works";
import { device } from "src/constants/breakpoints";
import Image from "next/image";

export type ContainerProps = {};
type Props = {
  className?: string;
} & ContainerProps;

const Component = ({ className }: Props): JSX.Element => (
  <div className={className}>
    <h3 className="title">開発</h3>
    <div className="works">
      {worksData.map((item, index) => {
        return (
          <div className="item" key={index}>
            <div className="image">
              <Image src={item.src} width={500} height={300} alt="" />
            </div>
            <div className="detail">
              <div className="contents">
                <h4>{item.title}</h4>
                <div className="genre">
                  {item.genre.map((genre, index) => (
                    <GenreLabel
                      type={genre.type}
                      label={genre.label}
                      key={index}
                    />
                  ))}
                </div>
                <p className="description">{item.description}</p>
              </div>
              {item.href && (
                <a className="link" href={item.href}>
                  サイトを見る
                </a>
              )}
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
      flex-direction: column;
      border: 1px solid #666;
      border-radius: 10px;
      padding: 0 16px;
      @media (${device.tablet}) {
        padding: 16px 0;
        flex-direction: row;
      }
      > .image {
        flex-grow: 1;
        padding: 0 16px;
        max-width: 500px;
        @media (${device.tablet}) {
          width: 50%;
        }
        > img {
          width: 100%;
          vertical-align: bottom;
          object-fit: cover;
        }
      }
      > .detail {
        flex-grow: 1;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        padding: 16px 0;
        border-top: 1px solid #666;
        @media (${device.tablet}) {
          border-top: none;
          border-left: 1px solid #666;
          padding: 0 16px;
          width: 50%;
        }

        > .contents {
          display: flex;
          flex-direction: column;
          gap: 12px;
          .genre {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
          }
          > .description {
            font-size: 14px;
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
          margin-top: 12px;
          @media (${device.tablet}) {
            margin: 0;
          }
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

import React from "react";
import styled, { css } from "styled-components";
import Image from "next/image";
import Link from "next/link";
import { TbChevronLeft } from "react-icons/tb";
import { Title } from "src/components/parts/Title";
import { GenreLabel } from "src/components/parts/GenreLabel";
import { WorksData, WorkDetail } from "src/works";
import { device } from "src/constants/breakpoints";

export type ContainerProps = {
  work: WorksData & { detail: WorkDetail };
  onBack?: () => void;
};
type Props = {
  className?: string;
} & ContainerProps;

const Component = ({ className, work, onBack }: Props): JSX.Element => (
  <div className={className}>
    <div className="title">
      {onBack ? <button className="back" onClick={onBack} aria-label="作品一覧に戻る"><TbChevronLeft size={28} /></button> : <Link className="back" href="/works" aria-label="作品一覧に戻る">
        <TbChevronLeft size={28} />
      </Link>}
      <Title>{work.title}</Title>
    </div>
    <div className="image">
      <Image src={work.src} width={800} height={480} alt="" />
    </div>
    <div className="genre">
      {work.genre.map((genre, index) => (
        <GenreLabel type={genre.type} label={genre.label} key={index} />
      ))}
    </div>

    <section className="section">
      <h3 className="heading">概要</h3>
      <p className="text">{work.detail.overview}</p>
    </section>

    {work.detail.background && (
      <section className="section">
        <h3 className="heading">開発の経緯</h3>
        <p className="text">{work.detail.background}</p>
      </section>
    )}

    <section className="section">
      <h3 className="heading">技術スタック</h3>
      <dl className="stack">
        {work.detail.techStack.map((stack, index) => (
          <div className="row" key={index}>
            <dt>{stack.category}</dt>
            <dd>{stack.items.join(" / ")}</dd>
          </div>
        ))}
      </dl>
    </section>

    {work.detail.challenges.length > 0 && (
      <section className="section">
        <h3 className="heading">大変だったところ</h3>
        <div className="challenges">
          {work.detail.challenges.map((challenge, index) => (
            <div className="challenge" key={index}>
              <h4>{challenge.title}</h4>
              <p className="text">{challenge.body}</p>
            </div>
          ))}
        </div>
      </section>
    )}

    <div className="actions">
      {work.href && (
        <a className="link" target="_blank" rel="noreferrer" href={work.href}>
          サイトを見る
        </a>
      )}
      {onBack ? <button className="link" onClick={onBack}>作品一覧に戻る</button> : <Link className="link" href="/works">
        作品一覧に戻る
      </Link>}
    </div>
  </div>
);

const StyledComponent = styled(Component)`
  max-width: 800px;
  margin: 0 auto;
  padding: 0 16px;
  display: flex;
  flex-direction: column;
  > .title {
    margin-top: 16px;
    display: grid;
    grid-template-columns: 40px 1fr 40px;
    align-items: center;
    text-align: center;
    > .back {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      color: #444;
      border-radius: 50%;
      :hover {
        background-color: #f0f0ea;
      }
    }
  }
  > .image {
    margin-top: 16px;
    > img {
      width: 100%;
      height: auto;
      aspect-ratio: 5 / 3;
      vertical-align: bottom;
      object-fit: contain;
      background-color: #e8e8e4;
      border-radius: 10px;
    }
  }
  > .genre {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-top: 16px;
  }
  > .section {
    margin-top: 32px;
    > .heading {
      font-size: 18px;
      font-weight: normal;
      color: #333;
      border-bottom: 1px solid #333;
      padding-bottom: 8px;
      margin: 0 0 16px;
    }
    .text {
      font-size: 14px;
      line-height: 1.8;
      white-space: pre-wrap;
      margin: 0;
    }
    > .stack {
      margin: 0;
      font-size: 14px;
      > .row {
        display: flex;
        flex-direction: column;
        padding: 8px 0;
        border-bottom: 1px dashed #ccc;
        @media (${device.tablet}) {
          flex-direction: row;
        }
        > dt {
          font-weight: bold;
          @media (${device.tablet}) {
            width: 180px;
            flex-shrink: 0;
          }
        }
        > dd {
          margin: 0;
        }
      }
    }
    > .challenges {
      display: flex;
      flex-direction: column;
      gap: 16px;
      > .challenge {
        border: 1px solid #666;
        border-radius: 10px;
        padding: 16px;
        > h4 {
          margin: 0 0 8px;
        }
      }
    }
  }
  > .actions {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin: 32px 0 16px;
    @media (${device.tablet}) {
      flex-direction: row;
      justify-content: center;
    }
    > .link {
      display: block;
      text-align: center;
      color: #333;
      text-decoration: none;
      border: 1px solid #333;
      padding: 8px;
      border-radius: 5px;
      @media (${device.tablet}) {
        width: 240px;
      }
      :hover {
        background-color: #fafafa;
      }
    }
  }
  ${({ onBack }) => onBack && css`
    color: #e9e1f2;
    overflow-wrap: anywhere;
    > .title { grid-template-columns: 40px minmax(0, 1fr) 40px; }
    > .title h2 { color: #ffe4ad; font-size: clamp(20px, 3vw, 28px); }
    > .title > .back { color: #ffe4ad; background: transparent; border: 1px solid #ffffff40; }
    > .title > .back:hover { background: #ffffff10; }
    > .section > .heading { color: #ffe4ad; border-color: #9b7b53; }
    > .section > .stack > .row { border-color: #ffffff35; }
    > .section > .challenges > .challenge { border-color: #9b7b53; background: #ffffff06; }
    > .actions > .link { color: #ffe4ad; border-color: #9b7b53; background: transparent; font: inherit; }
    > .actions > .link:hover { background: #ffffff10; }
  `}
`;

export const WorkDetailContainer = (props: ContainerProps): JSX.Element => {
  return <StyledComponent {...props} />;
};

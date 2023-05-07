import React from "react";
import styled from "styled-components";
import Link from "next/link";
import { device } from "src/constants/breakpoints";

export type ContainerProps = {};
type Props = {
  className?: string;
} & ContainerProps;

const Component = ({ className }: Props): JSX.Element => (
  <nav className={className}>
    <h1 className="title">
      <Link href="/">Koichi&apos;s portfolio</Link>
    </h1>
    <ul className="nemu">
      <li>
        <Link href="/profile">プロフィール</Link>
      </li>
      <li>
        <Link href="/timeline">タイムライン</Link>
      </li>
      <li>
        <Link href="/works">作品</Link>
      </li>
      <li>
        <Link href="/faq">よくある質問</Link>
      </li>
    </ul>
  </nav>
);

const StyledComponent = styled(Component)`
  display: flex;
  padding: 0 12px;
  height: 60px;
  align-items: center;
  justify-content: space-between;
  > .title {
    user-select: none;
    display: none;
    @media (${device.tablet}) {
      display: flex;
    }
  }
  > .nemu {
    list-style-type: none;
    display: flex;
    gap: 12px;
    font-size: 14px;
    width: 100%;
    justify-content: space-between;
    @media (${device.tablet}) {
      width: auto;
    }
    > li {
      > a {
        &:hover {
          text-decoration: underline;
        }
      }
    }
  }
  a {
    color: #333;
    text-decoration: none;
  }
`;

export const Header = (props: ContainerProps): JSX.Element => {
  return <StyledComponent {...props} />;
};

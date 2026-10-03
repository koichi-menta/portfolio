import React, { ReactNode } from "react";
import styled from "styled-components";
import { Header } from "src/components/blocks/Header";
import Link from "next/link";
import {
  DOPAMINE_CONTROLS_SAFE_AREA,
  useDopamineMode,
} from "src/contexts/DopamineMode";

export type ContainerProps = {
  children: ReactNode;
};
type Props = {
  className?: string;
  isDopamine: boolean;
} & ContainerProps;

const Component = ({ className, children }: Props): JSX.Element => (
  <div className={className}>
    <div className="header">
      <div className="inner">
        <Header />
      </div>
    </div>
    <div className="main">{children}</div>
    <div className="footer">
      <Link href="/" className="link">
        トップページに戻る
      </Link>
      <small className="copyright">&copy; 2023 Koichi</small>
    </div>
  </div>
);

const StyledComponent = styled(Component)`
  height: 100svh;
  display: flex;
  flex-direction: column;
  > .header {
    border-bottom: 1px solid #aaa;
    > .inner {
      max-width: 1000px;
      margin: 0 auto;
    }
  }
  > .main {
    flex-grow: 1;
  }
  > .footer {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: 16px;
    text-align: center;
    font-size: 12px;
    /* ドーパミンモード中は画面下に操作ボタンが常に出るので、その分フッターを持ち上げる */
    padding-bottom: ${({ isDopamine }) =>
      isDopamine ? DOPAMINE_CONTROLS_SAFE_AREA : 8}px;
    > .link {
      color: #444;
      text-decoration: underline;
      display: inline-block;
    }
    > .copyright {
      font-size: 10px;
      margin-top: 8px;
    }
  }
`;

export const Layout = (props: ContainerProps): JSX.Element => {
  const { isDopamine } = useDopamineMode();
  return <StyledComponent {...props} isDopamine={isDopamine} />;
};

import React, { ReactNode } from "react";
import styled from "styled-components";
import { Header } from "src/components/blocks/Header";

export type ContainerProps = {
  children: ReactNode;
};
type Props = {
  className?: string;
} & ContainerProps;

const Component = ({ className, children }: Props): JSX.Element => (
  <div className={className}>
    <div className="header">
      <div className="inner">
        <Header />
      </div>
    </div>
    <div className="main">{children}</div>
  </div>
);

const StyledComponent = styled(Component)`
  .header {
    border-bottom: 1px solid #aaa;
    > .inner {
      max-width: 1000px;
      margin: 0 auto;
    }
  }
`;

export const Layout = (props: ContainerProps): JSX.Element => {
  return <StyledComponent {...props} />;
};

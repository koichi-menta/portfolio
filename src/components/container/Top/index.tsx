import React from "react";
import styled from "styled-components";
import { Menu } from "src/components/blocks/Menu";

export type ContainerProps = {};
type Props = {
  className?: string;
} & ContainerProps;

const Component = ({ className }: Props): JSX.Element => (
  <div className={className}>
    <div className="menu">
      <Menu />
    </div>
  </div>
);

const StyledComponent = styled(Component)`
  width: 100vw;
  height: 100svh;
  overflow: hidden;
  position: relative;
  .menu {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
`;

export const Top = (props: ContainerProps): JSX.Element => {
  return <StyledComponent {...props} />;
};

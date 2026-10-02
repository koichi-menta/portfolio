import React from "react";
import styled from "styled-components";
import { Menu } from "src/components/blocks/Menu";
import { DOPAMINE_BURST_Z_INDEX } from "src/contexts/DopamineMode";

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
    z-index: ${DOPAMINE_BURST_Z_INDEX + 1};
  }
`;

export const Top = (props: ContainerProps): JSX.Element => {
  return <StyledComponent {...props} />;
};

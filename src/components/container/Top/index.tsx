import React from "react";
import styled from "styled-components";
import { Menu } from "src/components/blocks/Menu";

export type ContainerProps = {};
type Props = {
  className?: string;
} & ContainerProps;

const Component = ({ className }: Props): JSX.Element => (
  <div className={className}>
    <Menu />
  </div>
);

const StyledComponent = styled(Component)`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
`;

export const Top = (props: ContainerProps): JSX.Element => {
  return <StyledComponent {...props} />;
};

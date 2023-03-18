import React, { ReactNode } from "react";
import styled from "styled-components";

export type ContainerProps = {
  children: ReactNode;
};
type Props = {
  className?: string;
} & ContainerProps;

const Component = ({ className, children }: Props): JSX.Element => (
  <div className={className}>
    <span>{children}</span>
  </div>
);

const StyledComponent = styled(Component)`
  width: 150px;
  height: 150px;
  border: 2px solid #333;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
  border-radius: 10px;
`;

export const MenuItem = (props: ContainerProps): JSX.Element => {
  return <StyledComponent {...props} />;
};

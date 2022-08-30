import React, { ReactNode } from "react";
import styled from "styled-components";

export type ContainerProps = {
  children: ReactNode;
};

type Props = {
  className?: string;
} & ContainerProps;

const Component = ({ className, children }: Props): JSX.Element => (
  <button className={className}>{children}</button>
);

const StyledComponent = styled(Component)``;

export const Button = (props: ContainerProps): JSX.Element => {
  return <StyledComponent {...props} />;
};

import React, { ReactNode } from "react";
import styled from "styled-components";

export type ContainerProps = {
  children: ReactNode;
};
type Props = {
  className?: string;
} & ContainerProps;

const Component = ({ className, children }: Props): JSX.Element => (
  <h2 className={className}>{children}</h2>
);

const StyledComponent = styled(Component)`
  color: #444;
`;

export const Title = (props: ContainerProps): JSX.Element => {
  return <StyledComponent {...props} />;
};

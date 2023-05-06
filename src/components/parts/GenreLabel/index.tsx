import React from "react";
import styled from "styled-components";
import clsx from "clsx";

export type ContainerProps = {
  type?: "default" | "platform";
  label: string;
};
type Props = {
  className?: string;
} & ContainerProps;

const Component = ({ className, type, label }: Props): JSX.Element => (
  <div className={clsx(className, type)}>{label}</div>
);

const StyledComponent = styled(Component)`
  display: inline-block;
  font-size: 12px;
  min-width: 80px;
  padding: 2px 8px;
  text-align: center;
  color: #fff;
  border-radius: 3px;
  background-color: #ebc182;
  &.platform {
    background-color: #a0c0f0;
  }
`;

export const GenreLabel = (props: ContainerProps): JSX.Element => {
  return <StyledComponent {...props} />;
};

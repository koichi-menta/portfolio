import React from "react";
import styled from "styled-components";
import { TbDeviceImac, TbUser } from "react-icons/tb";

export type ContainerProps = {
  genre: string;
};
type Props = {
  className?: string;
} & ContainerProps;

const Component = ({ genre }: Props): JSX.Element => (
  <>
    {genre === "work" && <TbDeviceImac />}
    {genre === "life" && <TbUser />}
  </>
);

const StyledComponent = styled(Component)``;

export const GenreIcon = (props: ContainerProps): JSX.Element => {
  return <StyledComponent {...props} />;
};

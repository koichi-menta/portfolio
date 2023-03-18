import React from "react";
import styled from "styled-components";
import Image from "next/image";
import profile_image from "public/profile_icon.jpeg";

export type ContainerProps = {};
type Props = {
  className?: string;
} & ContainerProps;

const Component = ({ className }: Props): JSX.Element => (
  <div className={className}>
    <Image src={profile_image} alt="プロフィール画像" className="image" />
  </div>
);

const StyledComponent = styled(Component)`
  overflow: hidden;
  border-radius: 50%;
  border: 1px solid #aaa;
  width: 100%;
  height: 100%;
  > .image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

export const ProfileImage = (props: ContainerProps): JSX.Element => {
  return <StyledComponent {...props} />;
};

import React from "react";
import styled, { css } from "styled-components";
import Image from "next/image";
import logo_image from "public/logo.svg";

// gradient: 虹色のグラデーションが回転する枠 / solid: 単色の線の枠
export type FrameVariant = "gradient" | "solid";

export type ContainerProps = {
  onClick: () => void;
  variant?: FrameVariant;
};

type Props = {
  className?: string;
} & ContainerProps;

const Component = ({ className, onClick, variant }: Props): JSX.Element => (
  <div className={className} onClick={onClick}>
    {variant === "gradient" && <div className="background"></div>}
    <div className="logo">
      <Image src={logo_image} alt="ロゴ" className="image" />
    </div>
  </div>
);

const StyledComponent = styled(Component)`
  height: 100px;
  width: 100px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 20px;
  position: relative;
  overflow: hidden;
  cursor: pointer;
  ${({ variant }) =>
    variant === "gradient"
      ? css`
          background-color: #fa9;
          padding: 4px;
        `
      : css`
          border: 3px solid #1f1f1f;
        `}
  z-index: 1;
  > .background {
    animation-name: animation-sample;
    animation-duration: 2s;
    animation-direction: normal;
    animation-iteration-count: infinite;
    animation-timing-function: linear;
    width: 200%;
    height: 200%;
    position: absolute;
    z-index: 0;
    background: linear-gradient(
      to right bottom,
      red,
      orange,
      yellow,
      green,
      blue,
      red,
      orange,
      yellow,
      green,
      blue
    );
  }
  > .logo {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
    position: relative;
    z-index: 1;
    /* gradient のときは白背景でグラデーションを覆って枠に見せる */
    background-color: ${({ variant }) =>
      variant === "gradient" ? "#fff" : "transparent"};
    border-radius: 20px;
    user-select: none;
    > .image {
      width: auto;
      height: 60%;
    }
  }
  @keyframes animation-sample {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

export const MenuCard = ({
  variant = "solid",
  ...props
}: ContainerProps): JSX.Element => {
  return <StyledComponent variant={variant} {...props} />;
};

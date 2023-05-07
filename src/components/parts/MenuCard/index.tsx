import React from "react";
import styled from "styled-components";

export type ContainerProps = {
  onClick: () => void;
};

type Props = {
  className?: string;
} & ContainerProps;

const Component = ({ className, onClick }: Props): JSX.Element => (
  <div className={className} onClick={onClick}>
    <div className="background"></div>
    <p className="text">K</p>
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
  background-color: #fa9;
  overflow: hidden;
  cursor: pointer;
  padding: 4px;
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
  > .text {
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 65px;
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
    position: relative;
    z-index: 1;
    background-color: #fff;
    border-radius: 20px;
    user-select: none;
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

export const MenuCard = (props: ContainerProps): JSX.Element => {
  return <StyledComponent {...props} />;
};

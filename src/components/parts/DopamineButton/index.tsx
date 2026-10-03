import React, { ReactNode } from "react";
import styled from "styled-components";

export type ContainerProps = {
  children: ReactNode;
  onClick: () => void;
};

type Props = {
  className?: string;
} & ContainerProps;

const Component = ({ className, children, onClick }: Props): JSX.Element => (
  <button type="button" className={className} onClick={onClick}>
    {children}
  </button>
);

// ドーパミンモードの「引く」「もう一度」などの主役ボタン。流れる虹色の枠で光らせる
const StyledComponent = styled(Component)`
  padding: 14px 36px;
  border: 3px solid transparent;
  border-radius: 999px;
  background:
    linear-gradient(#fffff8, #fffff8) padding-box,
    linear-gradient(90deg, red, orange, yellow, lime, cyan, blue, magenta, red)
      border-box;
  background-size:
    100% 100%,
    200% 100%;
  color: #333;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0 0 16px rgba(255, 106, 213, 0.6);
  animation: dopamine-button-flow 2s linear infinite;

  @keyframes dopamine-button-flow {
    0% {
      background-position:
        0 0,
        0% 50%;
    }
    100% {
      background-position:
        0 0,
        200% 50%;
    }
  }
`;

export const DopamineButton = (props: ContainerProps): JSX.Element => {
  return <StyledComponent {...props} />;
};

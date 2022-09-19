import React from "react";
import styled from "styled-components";

export type ContainerProps = {
  question: string;
  answer: string;
};
type Props = {
  className?: string;
} & ContainerProps;

const Component = ({ className, question, answer }: Props): JSX.Element => (
  <div className={className}>
    <div className="section">
      <div className="icon question">
        <span>Q</span>
      </div>
      <p className="text">{question}</p>
    </div>
    <div className="section">
      <div className="icon answer">
        <span>A</span>
      </div>
      <p className="text">{answer}</p>
    </div>
  </div>
);

const StyledComponent = styled(Component)`
  border: 1px solid #000;
  border-radius: 10px;
  padding: 0 12px;
  > .section {
    padding: 12px 0;
    display: flex;
    gap: 16px;
    align-items: baseline;
    + .section {
      border-top: 1px solid #000;
    }
    > .icon {
      width: 30px;
      height: 30px;
      min-width: 30px;
      min-height: 30px;
      font-size: 16px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      &.question {
        background-color: #cce0fe;
      }
      &.answer {
        background-color: #fecccc;
      }
    }
    > .text {
      font-size: 14px;
      margin: 0;
    }
  }
`;

export const FaqItem = (props: ContainerProps): JSX.Element => {
  return <StyledComponent {...props} />;
};

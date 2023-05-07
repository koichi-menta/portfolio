import React from "react";
import styled from "styled-components";
import { Title } from "src/components/parts/Title";
import { FaqItem } from "src/components/blocks/FaqItem";
import faqData from "src/faq.json";

export type ContainerProps = {};
type Props = {
  className?: string;
} & ContainerProps;

const Component = ({ className }: Props): JSX.Element => (
  <div className={className}>
    <div className="title">
      <Title>よくある質問</Title>
    </div>
    <div className="faq">
      {faqData.map((item) => (
        <FaqItem question={item.question} answer={item.answer} />
      ))}
    </div>
  </div>
);

const StyledComponent = styled(Component)`
  max-width: 800px;
  margin: 0 auto;
  padding: 0 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  > .title {
    margin-top: 16px;
  }
  > .faq {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 32px;
    margin-top: 32px;
  }
`;

export const FaqContainer = (props: ContainerProps): JSX.Element => {
  return <StyledComponent {...props} />;
};

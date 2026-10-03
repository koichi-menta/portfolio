import React from "react";
import styled from "styled-components";
import { Title } from "src/components/parts/Title";
import { FaqItem } from "src/components/blocks/FaqItem";
import faqData from "src/faq.json";
import { FaqShorts } from "src/components/blocks/FaqShorts";
import { useDopamineMode } from "src/contexts/DopamineMode";

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
      {faqData.map((item, index) => (
        <FaqItem question={item.question} answer={item.answer} key={index} />
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
  const { isDopamine } = useDopamineMode();
  if (isDopamine) return <FaqShorts />;
  return <StyledComponent {...props} />;
};

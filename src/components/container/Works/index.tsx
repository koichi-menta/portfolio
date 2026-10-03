import React from "react";
import styled from "styled-components";
import { Title } from "src/components/parts/Title";
import { DevelopWorkSection } from "src/components/blocks/DevelopWorkSection";
import { WorksGacha } from "src/components/blocks/WorksGacha";
import { useDopamineMode } from "src/contexts/DopamineMode";

export type ContainerProps = {};
type Props = {
  className?: string;
  isDopamine: boolean;
} & ContainerProps;

const Component = ({ className, isDopamine }: Props): JSX.Element => (
  <div className={className}>
    <div className="title">
      <Title>Works</Title>
    </div>
    {isDopamine ? <WorksGacha /> : <DevelopWorkSection />}
  </div>
);

const StyledComponent = styled(Component)`
  max-width: 1000px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 16px;
  > .title {
    margin-top: 16px;
  }
`;

export const WorksContainer = (props: ContainerProps): JSX.Element => {
  const { isDopamine } = useDopamineMode();
  return <StyledComponent {...props} isDopamine={isDopamine} />;
};

import React from "react";
import styled from "styled-components";
import { Title } from "src/components/parts/Title";
import { WorkSection } from "src/components/blocks/WorkSection";

export type ContainerProps = {};
type Props = {
  className?: string;
} & ContainerProps;

const Component = ({ className }: Props): JSX.Element => (
  <div className={className}>
    <div className="title">
      <Title>Works</Title>
    </div>
    <WorkSection title="開発" link="#" description="ここに詳細が入ります" />
  </div>
);

const StyledComponent = styled(Component)`
  width: 1000px;
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
  return <StyledComponent {...props} />;
};

import React from "react";
import styled from "styled-components";
import { Title } from "src/components/parts/Title";
import { DevelopWorkSection } from "src/components/blocks/DevelopWorkSection";

export type ContainerProps = {};
type Props = {
  className?: string;
} & ContainerProps;

const Component = ({ className }: Props): JSX.Element => (
  <div className={className}>
    <div className="title">
      <Title>Works</Title>
    </div>
    <DevelopWorkSection />
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
  return <StyledComponent {...props} />;
};

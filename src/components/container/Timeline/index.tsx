import React from "react";
import styled from "styled-components";
import { VerticalTimeline } from "react-vertical-timeline-component";
import "react-vertical-timeline-component/style.min.css";
import { TimelineItem } from "src/components/parts/TimelineItem";
import timelineData from "src/timeline.json";

export type ContainerProps = {};
type Props = {
  className?: string;
} & ContainerProps;

const Component = ({}: Props): JSX.Element => (
  <VerticalTimeline lineColor="#4c4c4c">
    {timelineData.map((item) => (
      <TimelineItem>{item.title}</TimelineItem>
    ))}
  </VerticalTimeline>
);

const StyledComponent = styled(Component)``;

export const Timeline = (props: ContainerProps): JSX.Element => {
  return <StyledComponent {...props} />;
};

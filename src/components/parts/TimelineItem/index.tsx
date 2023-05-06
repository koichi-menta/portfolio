import React from "react";
import styled from "styled-components";
import {
  VerticalTimelineElement,
  VerticalTimelineElementProps,
} from "react-vertical-timeline-component";
import { GenreIcon } from "src/components/parts/GenreIcon";

export type ContainerProps = {
  genre: string;
} & VerticalTimelineElementProps;
type Props = {
  className?: string;
} & ContainerProps;

const Component = ({ children, genre, ...props }: Props): JSX.Element => (
  <VerticalTimelineElement
    contentStyle={{
      background: "#fffff8",
      color: "#444",
      padding: "12px",
      border: "1px solid #666",
      boxShadow: "none",
    }}
    contentArrowStyle={{ borderRight: "7px solid #666" }}
    iconStyle={{
      background: "#fffff8",
      color: "#444",
      boxShadow: "none",
      border: "1px solid #666",
    }}
    icon={<GenreIcon genre={genre} />}
    {...props}
  >
    {children}
  </VerticalTimelineElement>
);

const StyledComponent = styled(Component)``;

export const TimelineItem = (props: ContainerProps): JSX.Element => {
  return <StyledComponent {...props} />;
};

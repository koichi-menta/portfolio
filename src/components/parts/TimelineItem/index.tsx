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
      background: "rgb(110, 153, 226)",
      color: "#fff",
      padding: "12px",
    }}
    contentArrowStyle={{ borderRight: "7px solid rgb(110, 153, 226)" }}
    iconStyle={{
      background: "rgb(166, 196, 246)",
      color: "#fff",
      boxShadow:
        "0 0 0 3px #333, inset 0 2px 0 rgba(0,0,0,.08), 0 3px 0 4px rgba(0,0,0,.05)",
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

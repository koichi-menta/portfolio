import React from "react";
import styled from "styled-components";
import {
  VerticalTimelineElement,
  VerticalTimelineElementProps,
} from "react-vertical-timeline-component";
import { FaInfo } from "react-icons/fa";

export type ContainerProps = {} & VerticalTimelineElementProps;
type Props = {
  className?: string;
} & ContainerProps;

const Component = ({ children, ...props }: Props): JSX.Element => (
  <VerticalTimelineElement
    contentStyle={{ background: "rgb(110, 153, 226)", color: "#fff" }}
    contentArrowStyle={{ borderRight: "7px solid rgb(110, 153, 226)" }}
    iconStyle={{ background: "rgb(166, 196, 246)", color: "#fff" }}
    icon={<FaInfo />}
    {...props}
  >
    {children}
  </VerticalTimelineElement>
);

const StyledComponent = styled(Component)``;

export const TimelineItem = (props: ContainerProps): JSX.Element => {
  return <StyledComponent {...props} />;
};

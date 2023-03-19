import React from "react";
import styled from "styled-components";
import { VerticalTimeline } from "react-vertical-timeline-component";
import "react-vertical-timeline-component/style.min.css";
import { TimelineItem } from "src/components/parts/TimelineItem";
import timelineData from "src/timeline.json";
import { Title } from "src/components/parts/Title";

export type ContainerProps = {};
type Props = {
  className?: string;
} & ContainerProps;

const Component = ({ className }: Props): JSX.Element => (
  <div className={className}>
    <div className="title">
      <Title>Timeline</Title>
    </div>
    <div className="timeline">
      <VerticalTimeline lineColor="#4c4c4c">
        {timelineData.map((item) => (
          <TimelineItem className="item" genre={item.genre}>
            <div className="top">
              <span>{item.date}</span>
              <span>&nbsp;{item.title}</span>
            </div>
            <p className="description">{item.description}</p>
          </TimelineItem>
        ))}
      </VerticalTimeline>
    </div>
  </div>
);

const StyledComponent = styled(Component)`
  width: 1000px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 32px;
  > .title {
    margin-top: 32px;
  }
  > .timeline {
    width: 100%;
    margin-top: 16px;
    .item {
      .top {
        font-size: 13px;
        line-height: 13px;
        > span {
        }
      }
      .description {
        font-size: 15px;
        margin-top: 8px;
      }
    }
  }
`;

export const TimelineContainer = (props: ContainerProps): JSX.Element => {
  return <StyledComponent {...props} />;
};

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
      <VerticalTimeline lineColor="#666">
        {timelineData.map((item) => (
          <TimelineItem className="item" genre={item.genre} key={item.title}>
            <div className="top">
              <span className="date">{item.date}</span>
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
  max-width: 1000px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 16px;
  > .title {
    margin-top: 16px;
  }
  > .timeline {
    width: 100%;
    margin-top: 16px;
    overflow: hidden; /* timelineライブラリ用 */
    .item {
      .top {
        font-size: 14px;
        border-bottom: 1px solid;
        padding-bottom: 8px;
        line-height: 1.4;
        > .date {
          font-weight: bold;
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

import React from "react";
import { TimelineContainer, ContainerProps } from ".";
import { ComponentStory, ComponentMeta } from "@storybook/react";

export default {
  component: TimelineContainer,
  title: "container/TimelineContainer",
} as ComponentMeta<typeof TimelineContainer>;

const Template: ComponentStory<typeof TimelineContainer> = (
  props: ContainerProps
) => <TimelineContainer {...props} />;

export const Default = Template.bind({});

Default.args = {};

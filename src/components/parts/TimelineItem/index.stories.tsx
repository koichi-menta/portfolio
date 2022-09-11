import React from "react";
import { TimelineItem, ContainerProps } from ".";
import { ComponentStory, ComponentMeta } from "@storybook/react";

export default {
  component: TimelineItem,
  title: "parts/TimelineItem",
} as ComponentMeta<typeof TimelineItem>;

const Template: ComponentStory<typeof TimelineItem> = (
  props: ContainerProps
) => <TimelineItem {...props} />;

export const Default = Template.bind({});

Default.args = {
  children: "ここに内容が入ります。",
};

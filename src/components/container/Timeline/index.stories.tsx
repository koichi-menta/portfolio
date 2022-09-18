import React from "react";
import { Timeline, ContainerProps } from ".";
import { ComponentStory, ComponentMeta } from "@storybook/react";

export default {
  component: Timeline,
  title: "container/Timeline",
} as ComponentMeta<typeof Timeline>;

const Template: ComponentStory<typeof Timeline> = (props: ContainerProps) => (
  <Timeline {...props} />
);

export const Default = Template.bind({});

Default.args = {};

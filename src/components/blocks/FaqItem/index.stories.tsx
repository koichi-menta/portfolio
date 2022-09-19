import React from "react";
import { FaqItem, ContainerProps } from ".";
import { ComponentStory, ComponentMeta } from "@storybook/react";

export default {
  component: FaqItem,
  title: "blocks/FaqItem",
} as ComponentMeta<typeof FaqItem>;

const Template: ComponentStory<typeof FaqItem> = (props: ContainerProps) => (
  <FaqItem {...props} />
);

export const Default = Template.bind({});

Default.args = {
  question: "ここに質問が入ります",
  answer:
    "ここに回答がが入ります。ここに回答がが入ります。ここに回答がが入ります。ここに回答がが入ります。ここに回答がが入ります。ここに回答がが入ります。ここに回答がが入ります。",
};

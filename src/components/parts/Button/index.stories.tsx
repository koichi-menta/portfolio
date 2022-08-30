import React from "react";
import { Button, ContainerProps } from ".";
import { ComponentStory, ComponentMeta } from "@storybook/react";

export default {
  component: Button,
  title: "parts/Button",
} as ComponentMeta<typeof Button>;

const Template: ComponentStory<typeof Button> = (props: ContainerProps) => (
  <Button {...props} />
);

export const Default = Template.bind({});

Default.args = {
  children: "テスト",
};

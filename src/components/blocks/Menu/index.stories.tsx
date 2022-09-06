import React from "react";
import { Menu, ContainerProps } from ".";
import { ComponentStory, ComponentMeta } from "@storybook/react";

export default {
  component: Menu,
  title: "blocks/Menu",
} as ComponentMeta<typeof Menu>;

const Template: ComponentStory<typeof Menu> = (props: ContainerProps) => (
  <div style={{ marginTop: 150, marginLeft: 150 }}>
    <Menu {...props} />
  </div>
);

export const Default = Template.bind({});

Default.args = {};

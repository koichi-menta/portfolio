import React from "react";
import { MenuCard, ContainerProps } from ".";
import { ComponentStory, ComponentMeta } from "@storybook/react";

export default {
  component: MenuCard,
  title: "parts/MenuCard",
} as ComponentMeta<typeof MenuCard>;

const Template: ComponentStory<typeof MenuCard> = (props: ContainerProps) => (
  <MenuCard {...props} />
);

export const Default = Template.bind({});

Default.args = {
  onClick: () => {
    alert("クリックしました");
  },
};

import React from "react";
import { MenuCard } from ".";

export default {
  component: MenuCard,
  title: "parts/MenuCard",
};

export const Default = {
  args: {
    onClick: () => {
      alert("クリックしました");
    },
  },
};

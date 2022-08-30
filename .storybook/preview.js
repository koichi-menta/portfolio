import { addDecorator } from "@storybook/react";
import { withScreenshot } from "storycap";

addDecorator(withScreenshot);

export const parameters = {
  actions: { argTypesRegex: "^on[A-Z].*" },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
};

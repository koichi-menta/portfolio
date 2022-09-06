const path = require("path");

module.exports = {
  stories: ["../src/**/*.stories.mdx", "../src/**/*.stories.@(js|jsx|ts|tsx)"],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-interactions",
  ],
  framework: "@storybook/react",
  core: {
    builder: "@storybook/builder-webpack5",
  },
  webpackFinal: async (baseConfig) => {
    baseConfig.resolve.modules = [
      ...(baseConfig.resolve.modules || []),
      path.resolve(__dirname, "../"),
    ];
    return baseConfig;
  },
  previewHead: (head) => `
    ${head}
    <style>
      html, body, #root {
        height: 100%;
      }
    </style>
  `,
};

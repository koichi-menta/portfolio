const path = require("path");

module.exports = {
  stories: ["../src/**/*.stories.@(js|jsx|ts|tsx|mdx)"],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-interactions",
  ],
  framework: {
    name: "@storybook/react-webpack5",
    options: {},
  },
  webpackFinal: async (baseConfig) => {
    baseConfig.resolve.alias = {
      ...baseConfig.resolve.alias,
      "@": path.resolve(__dirname, "../src"),
    };
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

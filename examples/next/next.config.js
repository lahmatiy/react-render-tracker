const CopyPlugin = require("copy-webpack-plugin");

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: config => {
    // append the CopyPlugin to copy the file to your public dir
    config.plugins.push(
      new CopyPlugin({
        patterns: [
          {
            from: "node_modules/react-render-tracker/dist/react-render-tracker.js",
            to: "static",
          },
        ],
      })
    );

    // Important: return the modified config
    return config;
  },
};

module.exports = nextConfig;

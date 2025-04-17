// craco.config.js
module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      webpackConfig.resolve.fallback = {
        ...webpackConfig.resolve.fallback,
        fs: false, // We're not using the Node fs module in the browser
        path: false, // We don't need the Node path module either
        crypto: false,
      };
      return webpackConfig;
    },
  },
};

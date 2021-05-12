module.exports = {
  webpack: function (config) {
    config.output.filename = '../out/webview.js';
    config.optimization.splitChunks = {
      cacheGroups: {
        default: false,
      },
    };
    config.optimization.runtimeChunk = false;
    config.devtool = false;
    return config;
  },
};

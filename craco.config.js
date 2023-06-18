const path = require('path');
const WasmPackPlugin = require('@wasm-tool/wasm-pack-plugin');

const wasmPlugin = {
  plugin: {
    overrideWebpackConfig: ({webpackConfig}) => {
      const wasmExtensionRegExp = /\.wasm$/;

      webpackConfig.experiments = {
        asyncWebAssembly: true,
        topLevelAwait: true,
      };

      webpackConfig.module.rules.forEach((rule) => {
        (rule.oneOf || []).forEach((oneOf) => {
          if (oneOf.loader && oneOf.loader.indexOf('file-loader') >= 0) {
            // Make file-loader ignore WASM files
            oneOf.exclude.push(wasmExtensionRegExp);
          }
        });
      });

      webpackConfig.plugins.push(
        new WasmPackPlugin({
          crateDirectory: path.resolve(__dirname, './wasm'),

          extraArgs: '--target web',
          outDir: path.resolve(__dirname, './src/pkg'),

        })
      );
      return webpackConfig;
    }
  },
};
// https://stackoverflow.com/questions/46876570/create-react-app-exclude-folder-from-triggering-reload
module.exports = function ({ env }) {
  return {
    plugins: [wasmPlugin],
  };
};
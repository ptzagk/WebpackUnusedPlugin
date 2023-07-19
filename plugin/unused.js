const path = require('path');
const fg = require('fast-glob');
const fs = require('fs');

function getFileDepsMap(compilation) {
  const fileDepsBy = [...compilation.fileDependencies].reduce(
    (acc, usedFilepath) => {
      acc[usedFilepath] = true;
      return acc;
    },
    {}
  );

  const { assets } = compilation;
  Object.keys(assets).forEach((assetRelpath) => {
    const existsAt = assets[assetRelpath].existsAt;
    fileDepsBy[existsAt] = true;
  });
  return fileDepsBy;
}

async function applyAfterEmit(compiler, compilation, plugin) {
  const fileDepsMap = getFileDepsMap(compilation);

  const files = await fg(plugin.options.patterns, plugin.globOptions);
  const unused = files.filter(
    (it) => !fileDepsMap[path.join(plugin.globOptions.cwd, it)]
  );
  fs.writeFile(
    './unused-files.json',
    JSON.stringify(unused, null, 2),
    console.log
  );
}

class UnusedFilesWebpackPlugin {
  constructor(options = {}) {
    this.options = {
      ...options,
      patterns: options.patterns || ['src/**/*.*'], // default src directory
    };

    this.globOptions = {
      ignore: 'node_modules/**/*',
      cwd: process.cwd(),
    };
  }

  apply(compiler) {
    compiler.hooks.afterEmit.tapPromise('UnsedPlugin', (compilation) =>
      applyAfterEmit(compiler, compilation, this)
    );
  }
}

module.exports = UnusedFilesWebpackPlugin;

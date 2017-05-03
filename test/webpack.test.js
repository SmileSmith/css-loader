import fs from 'fs';
import path from 'path';
import webpack from 'webpack';
import cssnano from 'cssnano';

function mkdir(p) {
  try {
    fs.mkdirSync(p);
  } catch (e) {
    // ignore
  }
}

const OPTIONS = {
  normal: {
    rules: [
      {
        test: /\.css$/,
        use: {
          loader: path.resolve(__dirname, '../src'),
          options: {
            sourceMap: true,
            sourceMapContext: __dirname,
          },
        },
      },
    ],
  },
  otherConfig: {
    rules: [
      {
        test: /\.css$/,
        use: {
          loader: path.resolve(__dirname, '../src'),
          options: {
            sourceMap: {
              columns: true,
            },
            sourceMapPrefix: 'css:///',
            sourceMapContext: path.resolve(__dirname, '../src'),
          },
        },
      },
    ],
  },
  cssnano: {
    rules: [
      {
        test: /\.css$/,
        use: [
          {
            loader: path.resolve(__dirname, '../src'),
            options: {
              sourceMap: true,
              sourceMapContext: false,
            },
          },
          {
            loader: 'postcss-loader',
            options: {
              plugins: [
                cssnano(),
              ],
            },
          },
        ],
      },
    ],
  },
};

describe('webpack', () => {
  const fixtures = path.resolve(__dirname, 'webpack-fixtures');
  const output = path.resolve(__dirname, '.output');
  const tests = fs.readdirSync(fixtures);
  tests.forEach((filename) => {
    Object.keys(OPTIONS).forEach((optionsName) => {
      const options = OPTIONS[optionsName];
      it(`should process ${filename} with ${optionsName} options`, () => new Promise((resolve, reject) => {
        const outputDirectory = path.resolve(output, optionsName, filename.replace(/[^a-zA-Z0-9]+/g, '_'));
        mkdir(outputDirectory);
        webpack({
          entry: `./${filename}/index.css`,
          context: fixtures,
          output: {
            path: outputDirectory,
            filename: 'bundle.js',
            libraryTarget: 'commonjs2',
          },
          module: options,
        }, (err, stats) => {
          if (err) {
            reject(err);
            return;
          }
          try {
            expect(stats.toString('errors-only')).toMatchSnapshot();
            const result = require(path.resolve(outputDirectory, 'bundle.js')); // eslint-disable-line
            expect(result).toMatchSnapshot();
            expect(result.default.toString()).toMatchSnapshot();
            for (const item of result.default) {
              fs.writeFileSync(path.resolve(outputDirectory, `result${item[0]}.css`), item[1], 'utf-8');
              item[3].file = `result${item[0]}.css`;
              fs.writeFileSync(path.resolve(outputDirectory, `result${item[0]}.css.map`), JSON.stringify(item[3]), 'utf-8');
            }
          } catch (e) {
            reject(e);
            return;
          }
          resolve();
        });
      }), 20000);
    });
  });
});

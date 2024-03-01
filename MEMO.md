

# パッケージメモ

.erb/configs/webpack.config.base.ts の  module: {    rules: [　に、,
      { test: /\.cs$/, type: 'cs' },
      { test: /\.html$/, type: 'html' },
を追加。
同じファイルの   plugins: [　に、,
    new webpack.DefinePlugin({
      'process.env.FLUENTFFMPEG_COV': false,
    }),


release/app/package.json の　dependencies　に、　以下の項目を追加
  "dependencies": {
    "sqlite3": "^5.1.6",
    "winshortcut": "../../node_modules/winshortcut"
  }

node_modulesに、winshortcut　をコピー



npm install @mui/material @emotion/react @emotion/styled
npm install @mui/icons-material
npm install react-bootstrap bootstrap
npm install exif
npm install fluent-ffmpeg
npm install i18next --save
npm install react-i18next
npm install node-id3
npm install --save-dev @electron/rebuild

npm run postinstall


npm install sqlite3
.\node_modules\.bin\electron-rebuild.cmd

package.json の　dependencies　に、
    "winshortcut": "./node_modules/winshortcut"

npm install mock-aws-s3
npm install aws-sdk
npm install nock



npm install request
npm install sync-request
npm install cheerio







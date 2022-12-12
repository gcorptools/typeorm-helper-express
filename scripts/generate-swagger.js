const fs = require('fs');
const path = require('path');
const express = require('express');
const utils = require('../src/swagger');

const app = express();
const targetFile = path.join(__dirname, '../src/swagger/swagger.json');
utils
  .generateSwaggerJson(app, 'swagger', {
    baseDir: __dirname,
    // Glob pattern to find your jsdoc files (multiple patterns can be added in an array)
    filesPattern: [
      '../src/dtos/**/*.ts',
      '../src/errors/**/*.ts',
      '../src/mixins/**/*.ts',
      '../src/models/**/*.ts',
      '../src/types/**/*.ts'
    ]
  })
  .then((result) => {
    fs.writeFileSync(targetFile, JSON.stringify(result));
  });

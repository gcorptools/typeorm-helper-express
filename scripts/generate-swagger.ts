const express = require('express');
const utils = require('../src/swagger');

const app = express();
utils.generateSwaggerJson(app, 'swagger', {
  baseDir: __dirname,
  // Glob pattern to find your jsdoc files (multiple patterns can be added in an array)
  filesPattern: [
    '../src/dtos/**/*.ts',
    '../src/errors/**/*.ts',
    '../src/mixins/**/*.ts',
    '../src/models/**/*.ts',
    '../src/types/**/*.ts'
  ]
});

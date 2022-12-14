import { Application } from 'express';
import expressJSDocSwagger from 'express-jsdoc-swagger';
import EventEmitter from 'events';

/**
 * Generate JSON file
 * @param app express application
 * @param options swagger options
 * @param oldSwagger old swagger config (from a previously generated JSON file for example)
 */
export const generateSwaggerJson = (
  app: Application,
  options: any = {},
  oldSwagger: any = {}
): Promise<any> => {
  const swaggerOptions = {
    openapi: '3.0.0',
    info: {
      title: 'Rest API',
      version: '1.0.0',
      description: 'Generic REST API documentation.',
      license: {
        name: 'Licensed Under MIT',
        url: 'https://spdx.org/licenses/MIT.html'
      }
    },
    baseDir: __dirname,
    // Glob pattern to find your jsdoc files (multiple patterns can be added in an array)
    filesPattern: [
      '../**/*.ts'
      //'dtos/**/*.ts'
    ],
    // URL where SwaggerUI will be rendered
    swaggerUIPath: '/api-docs',
    exposeSwaggerUI: true,
    // Open API JSON Docs endpoint.
    apiDocsPath: '/v3/api-docs',
    notRequiredAsNullable: false,
    ...options
  };

  return new Promise((resolve, reject) => {
    const eventEmitter = new EventEmitter();

    const listener = expressJSDocSwagger(app)(swaggerOptions, oldSwagger);
    listener
      .on('error', (e) => eventEmitter.emit('error', e))
      .on('finish', (e) => {
        eventEmitter.emit('complete', { components: e.components });
      });

    const server = app.listen();

    eventEmitter.on('error', (e) => {
      console.error('Docs generation failed!', e);
      server.close();
      reject(e);
    });

    eventEmitter.on('complete', (r) => {
      console.log('Docs successfully generated!');
      server.close();
      resolve(r);
    });
  });
};

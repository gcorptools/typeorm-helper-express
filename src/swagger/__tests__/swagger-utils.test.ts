import express from 'express';
import { generateSwaggerJson } from '..';

describe('Swagger Utils', () => {
  it('should parse doc correctly', async () => {
    const app = express();
    const docs = await generateSwaggerJson(app);
    expect(docs.components).toBeDefined();
  });
});

import express from 'express';
import { generateSwaggerJson } from '..';

describe('Swagger Utils', () => {
  it('should parse doc correctly', async () => {
    const app = express();
    const docs = await generateSwaggerJson(app);
    expect(docs.components).toBeDefined();
  });

  it('should throw an error when invalid', async () => {
    const app: any = {
      listen: () => ({ close: () => {} }),
      use: jest.fn()
    };
    await generateSwaggerJson(app, null as any, { a: 1 })
      .then(() => fail('Should not work'))
      .catch((e) => expect(e).toBeDefined());
  });
});

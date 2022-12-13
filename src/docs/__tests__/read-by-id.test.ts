import request from 'supertest';
import { app, newCountries, COUNTRIES } from '../index';

describe('Read Countries by ID Route', () => {
  it('should not find unknown country', async () => {
    const response = await request(app).get(`${COUNTRIES}/1`).send({});
    expect(response.status).toEqual(404);
  });

  it('should retrieve country', async () => {
    const country = (await newCountries(1))[0];
    let url = `${COUNTRIES}/${country.id}`;

    let response = await request(app).get(url);
    expect(response.status).toEqual(200);
    expect(response.body.id).toEqual(country.id);
  });
});

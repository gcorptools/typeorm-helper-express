import request from 'supertest';
import { app, getUserAuthorization, newCountries, COUNTRIES } from '../index';

describe('Read All Country Route', () => {
  let url: string;

  it('should have a working endpoint', async () => {
    const response = await request(app).get(url).send({});
    expect(response.status).not.toEqual(404);
  });

  it('should retrieve all countries', async () => {
    const countries = await newCountries(10);

    let response = await request(app).get(url);
    expect(response.status).toEqual(200);
    expect(response.body.length).toEqual(countries.length);
    expect(response.body[0].id).toBeGreaterThan(0);

    const filteredUrl = `${url}?filters=code[is]${countries[4].code}`;
    response = await request(app).get(filteredUrl);
    expect(response.status).toEqual(200);
    expect(response.body.length).toEqual(1);
    expect(response.body[0].id).toEqual(countries[4].id);
  });

  beforeEach(async () => {
    url = `${COUNTRIES}/all`;
  });
});

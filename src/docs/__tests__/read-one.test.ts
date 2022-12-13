import request from 'supertest';
import { app, getUserAuthorization, newCountries, COUNTRIES } from '../index';

describe('Read One Countries Route', () => {
  it('should not find unknown country', async () => {
    const response = await request(app).get(`${COUNTRIES}/1`).send({});
    expect(response.status).toEqual(404);
  });

  it('should retrieve one country', async () => {
    const countries = await newCountries(10);
    let url = `${COUNTRIES}/one`;

    let response = await request(app).get(url);
    expect(response.status).toEqual(200);
    expect(response.body.id).toBeGreaterThan(0);

    url = `${COUNTRIES}/one?filters=code[is]${countries[3].code}`;
    response = await request(app).get(url);
    expect(response.status).toEqual(200);
    expect(response.body.id).toEqual(countries[3].id);
  });
});

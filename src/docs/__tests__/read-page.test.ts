import request from 'supertest';
import {
  app,
  newCountries,
  COUNTRIES,
  countryRepository,
  UserRole
} from '../index';

describe('Read Page Country Route', () => {
  it('should have a working endpoint', async () => {
    const response = await request(app).get(COUNTRIES).send({});
    expect(response.status).not.toEqual(404);
  });

  it('should retrieve page of countries', async () => {
    const countries = await newCountries(10);

    let response = await request(app).get(COUNTRIES);
    expect(response.status).toEqual(200);
    expect(response.body.totalElements).toEqual(countries.length);
    expect(response.body.data[0].id).toBeGreaterThan(0);

    const url = `${COUNTRIES}?filters=code[is]${countries[4].code}`;
    response = await request(app).get(url);
    expect(response.status).toEqual(200);
    expect(response.body.totalElements).toEqual(1);
    expect(response.body.data[0].id).toEqual(countries[4].id);
  });
});

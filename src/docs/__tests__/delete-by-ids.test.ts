import request from 'supertest';
import {
  app,
  newCountries,
  COUNTRIES,
  Country,
  countryRepository,
  UserRole,
  getUserCookie
} from '../index';

describe('Delete by IDs Country Route', () => {
  const URL = `${COUNTRIES}?ids=1&ids=2`;
  it('should have a working endpoint', async () => {
    const response = await request(app).delete(URL);
    expect(response.status).not.toEqual(404);
  });

  it('should not allow unauthorized users', async () => {
    const response = await request(app).delete(URL);
    expect(response.status).toEqual(401);
  });

  it('should not allow invalid user', async () => {
    const { token } = await getUserCookie();

    const country = (await newCountries(1))[0];

    const url = `${COUNTRIES}?ids=${country.id}`;
    const response = await request(app).delete(url).set('authorization', token);
    expect(response.status).toEqual(403);
  });

  it('should allow deletion by administrator', async () => {
    const countries = await newCountries(10);
    const { token: administratorToken } = await getUserCookie(
      UserRole.ADMINISTRATOR
    );

    expect(await countryRepository.count()).toEqual(countries.length);
    const ids = countries.map((country: Country) => `ids=${country.id}`);
    const url = `${COUNTRIES}?${ids.join('&')}`;
    const response = await request(app)
      .delete(url)
      .set('authorization', administratorToken);
    expect(response.status).toEqual(200);
    expect(await countryRepository.count()).toEqual(0);
  });
});

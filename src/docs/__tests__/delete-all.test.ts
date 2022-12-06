import request from 'supertest';
import {
  app,
  newCountries,
  COUNTRIES,
  countryRepository,
  UserRole,
  getUserCookie
} from '../index';

describe('Delete all Countries Route', () => {
  const URL = `${COUNTRIES}/all`;
  it('should have a working endpoint', async () => {
    const response = await request(app).delete(URL);
    expect(response.status).not.toEqual(404);
  });

  it('should not allow unauthorized users', async () => {
    const response = await request(app).delete(URL);
    expect(response.status).toEqual(401);
  });

  it('should not allow non administrators', async () => {
    const { token } = await getUserCookie();
    const response = await request(app).delete(URL).set('authorization', token);
    expect(response.status).toEqual(403);
  });

  it('should allow deletion by administrator', async () => {
    const countries = await newCountries(10);
    const { token: administratorToken } = await getUserCookie(
      UserRole.ADMINISTRATOR
    );

    expect(await countryRepository.count()).toEqual(countries.length);
    const response = await request(app)
      .delete(URL)
      .set('authorization', administratorToken);
    expect(response.status).toEqual(200);
    expect(await countryRepository.count()).toEqual(0);
  });
});

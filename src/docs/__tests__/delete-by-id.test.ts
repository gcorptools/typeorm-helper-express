import request from 'supertest';
import {
  app,
  getUserCookie,
  newCountries,
  COUNTRIES,
  UserRole
} from '../index';

describe('Delete by ID Country Route', () => {
  const URL = `${COUNTRIES}/1`;
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

    const url = `${COUNTRIES}/${country.id}`;
    const response = await request(app).delete(url).set('authorization', token);
    expect(response.status).toEqual(403);
  });

  it('should allow deletion by administrator', async () => {
    const { token: administratorToken } = await getUserCookie(
      UserRole.ADMINISTRATOR
    );
    const country = (await newCountries(1))[0];

    const url = `${COUNTRIES}/${country.id}`;
    const response = await request(app)
      .delete(url)
      .set('authorization', administratorToken);
    expect(response.status).toEqual(200);
  });
});

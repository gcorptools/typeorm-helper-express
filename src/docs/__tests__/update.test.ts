import request from 'supertest';
import {
  app,
  getUserCookie,
  newCountries,
  COUNTRIES,
  UserRole
} from '../index';

describe('Put Country Route', () => {
  const URL = `${COUNTRIES}/1`;
  it('should have a working endpoint', async () => {
    const response = await request(app).put(URL).send({});
    expect(response.status).not.toEqual(404);
  });

  it('should not allow unauthorized users', async () => {
    const response = await request(app).put(URL).send({});
    expect(response.status).toEqual(401);
  });

  it('should not allow invalid data', async () => {
    const { token } = await getUserCookie();
    const country = (await newCountries(1))[0];
    const url = `${COUNTRIES}/${country.id}`;
    let response = await request(app)
      .put(url)
      .set('authorization', token)
      .send(country);
    expect(response.status).toEqual(403);

    const { token: administratorToken } = await getUserCookie(
      UserRole.ADMINISTRATOR
    );
    response = await request(app)
      .put(url)
      .set('authorization', administratorToken)
      .send({
        id: country.id,
        code: '',
        name: null
      });
    expect(response.status).toEqual(400);
  });

  it('should allow edit by administrators', async () => {
    const { token } = await getUserCookie(UserRole.ADMINISTRATOR);
    const country = (await newCountries(1))[0];
    const url = `${COUNTRIES}/${country.id}`;
    const response = await request(app)
      .patch(url)
      .set('authorization', token)
      .send({
        id: country.id,
        code: 'fr',
        name: 'France'
      });
    expect(response.status).toEqual(200);
  });
});

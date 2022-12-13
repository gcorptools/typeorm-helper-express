import request from 'supertest';
import {
  app,
  getUserAuthorization,
  newCountries,
  COUNTRIES,
  UserRole
} from '../index';

describe('Patch Country Route', () => {
  const URL = `${COUNTRIES}/1`;
  it('should have a working endpoint', async () => {
    const response = await request(app).patch(URL).send({});
    expect(response.status).not.toEqual(404);
  });

  it('should not allow unauthorized users', async () => {
    const response = await request(app).patch(URL).send({});
    expect(response.status).toEqual(401);
  });

  it('should not allow invalid data', async () => {
    const { token } = await getUserAuthorization();
    const country = (await newCountries(1))[0];
    const url = `${COUNTRIES}/${country.id}`;
    let response = await request(app)
      .patch(url)
      .set('authorization', token)
      .send(country);
    expect(response.status).toEqual(403);

    const { token: administratorToken } = await getUserAuthorization(
      UserRole.ADMINISTRATOR
    );
    response = await request(app)
      .patch(url)
      .set('authorization', administratorToken)
      .send({
        id: country.id,
        code: ''
      });
    expect(response.status).toEqual(400);
  });

  it('should allow edit by administrators', async () => {
    const { token } = await getUserAuthorization(UserRole.ADMINISTRATOR);
    const country = (await newCountries(1))[0];
    const url = `${COUNTRIES}/${country.id}`;
    const response = await request(app)
      .patch(url)
      .set('authorization', token)
      .send({
        id: country.id,
        code: 'fr'
      });
    expect(response.status).toEqual(200);
  });
});

import request from 'supertest';
import {
  app,
  getUserCookie,
  newCountries,
  COUNTRIES,
  UserRole
} from '../index';

describe('Post Country Route', () => {
  it('should have a working endpoint', async () => {
    const response = await request(app).post(COUNTRIES).send({});
    expect(response.status).not.toEqual(404);
  });

  it('should not allow unauthorized users', async () => {
    const response = await request(app).post(COUNTRIES).send({});
    expect(response.status).toEqual(401);
  });

  it('should not allow invalid data', async () => {
    const { token } = await getUserCookie();
    let response = await request(app)
      .post(COUNTRIES)
      .set('authorization', token)
      .send({
        code: 'fr',
        name: 'France'
      });
    expect(response.status).toEqual(403);

    const { token: administratorToken } = await getUserCookie(
      UserRole.ADMINISTRATOR
    );
    response = await request(app)
      .post(COUNTRIES)
      .set('authorization', administratorToken)
      .send({
        code: '',
        name: null
      });
    expect(response.status).toEqual(400);
  });

  it('should allow edit by administrators', async () => {
    const { token } = await getUserCookie(UserRole.ADMINISTRATOR);
    const response = await request(app)
      .post(COUNTRIES)
      .set('authorization', token)
      .send({
        code: 'fr',
        name: 'France'
      });
    expect(response.status).toEqual(201);
    expect(response.body.code).toEqual('FR');
  });
});

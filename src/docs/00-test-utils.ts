import { newJwtToken } from '../utils';
import { countryRepository } from './02-repository';

export const UserRole = {
  ADMINISTRATOR: 'ADMINISTRATOR',
  CUSTOMER: 'CUSTOMER'
};

export const newCountries = async (size: number) =>
  await Promise.all(
    Array.from(Array(size)).map(async (nothing: any, index: number) => {
      const code = `fake-${new Date().getTime()}-country-${index}`;
      return countryRepository.save(
        countryRepository.create({
          code,
          name: code
        })
      );
    })
  );

export const getUserAuthorization = async (
  role: string = UserRole.CUSTOMER
) => {
  const userData = {
    id: '1',
    username: 'fake-email@mail.com',
    roles: [role]
  };
  const accessToken = newJwtToken(userData, {});
  const token = `Bearer ${accessToken}`;
  return { token };
};

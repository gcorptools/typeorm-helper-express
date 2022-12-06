import { checkEnvVariables } from '..';

describe('Env utils', () => {
  const _check = (fail: boolean, ...names: string[]) => {
    expect(names).toBeDefined();
    expect(names.length).toBeGreaterThan(0);
    const nameString = names.join(', ');
    if (!fail) {
      checkEnvVariables(...names);
      return;
    }
    try {
      checkEnvVariables(...names);
      throw new Error('Should not come here');
    } catch (e: any) {
      expect(e).toBeDefined();
      expect(e.message.includes(nameString)).toEqual(true);
    }
  };

  it('should throw error when env variable missing', () => {
    checkEnvVariables();
    _check(true, 'JWT_KEY', 'DATABASE_URL');
  });

  it('should not fail when env variable are all presents', () => {
    process.env.DATABASE_URL = 'An host';
    process.env.DATABASE_SYNC = 'An password';
    _check(false, 'DATABASE_SYNC', 'DATABASE_URL');
  });
});

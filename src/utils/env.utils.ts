/**
 * Check if all required env variable are available
 * @param {...string} names the names of the env variables to check
 */
export const checkEnvVariables = (...names: string[]): void => {
  if (!names || names.length === 0) {
    return;
  }
  const missing = names.filter((name: string) => !process.env[name]);
  if (missing.length === 0) {
    // No missing env variable
    return;
  }
  throw new Error(`Env variables ${missing.join(', ')} must be defined!`);
};

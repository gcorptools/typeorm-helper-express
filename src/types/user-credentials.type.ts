/**
 *
 * Current user credentials
 * @typedef {object} UserCredentials
 * @property {string} id.required - User's ID
 * @property {string} username.required - User's unique name
 * @property {string} role.required - User's associated privileges
 */
type AnyThing = Record<string, any>;

export interface UserCredentials {
  id: string;
  username: string;
  role: string;
}

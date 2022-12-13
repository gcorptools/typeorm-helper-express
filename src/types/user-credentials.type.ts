/**
 *
 * Current user credentials
 * @typedef {object} UserCredentials
 * @property {string} id.required - User's ID
 * @property {string} username.required - User's unique name
 * @property {array<string>} roles.required - User's associated privileges
 */
export interface UserCredentials {
  id: any;
  username: string;
  roles: any[];
}

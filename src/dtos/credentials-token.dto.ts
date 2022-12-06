/**
 * The tokens to user when communicating with token
 * @typedef {object} CredentialsTokenDto
 * @property {string} accessToken - A token granting access to some resources
 * @property {string} refreshToken - A token for refreshing access token
 */
export class CredentialsTokenDto {
  refreshToken!: string;
  accessToken!: string;
}

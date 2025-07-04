import dotenv from 'dotenv';
dotenv.config();

const SERVER_HOST = process.env.SERVER_HOST || 'https://localhost:443';
const SERVER_URL = process.env.SERVER_URL || 'https://localhost:443';
const CLIENT_HOST = process.env.CLIENT_HOST || 'http://localhost:3001';

export const urls = {
  client: {
    dashboard: `${CLIENT_HOST}/dashboard`,
    home: `${CLIENT_HOST}/home-logged`,
    login: `${CLIENT_HOST}/login`
  },
  api: {
    base: SERVER_HOST,
    auth: {
      google: `${SERVER_HOST}/api/auth/google`,
      gitlab: `${SERVER_HOST}/api/auth/gitlab`,
      googleCallback: `${SERVER_HOST}/api/auth/google/callback`,
      gitlabCallback: `${SERVER_HOST}/api/auth/gitlab/callback`
    }
  }
};

export {
    SERVER_HOST,
    SERVER_URL,
    CLIENT_HOST
}; 
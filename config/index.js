const URLS = {
  development: 'http://assisteai.test',
  production: 'https://api.assisteai.com.br',
};

export const API_URL = URLS[process.env.NODE_ENV];

export default {
  API_URL,
};

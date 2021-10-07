const URLS = {
  development: 'https://api.assisteai.com.br',
  production: 'https://api.assisteai.com.br',
};

export const API_URL = URLS[process.env.NODE_ENV];

export default {
  API_URL,
};

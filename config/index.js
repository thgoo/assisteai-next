export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.assisteai.com.br';

// The same OAuth client the API checks as the ID token's `aud`
export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
  || '736877274011-im98og8tkedl1gdtvjrj6u217dpqf9rq.apps.googleusercontent.com';

export default {
  API_URL,
  GOOGLE_CLIENT_ID,
};

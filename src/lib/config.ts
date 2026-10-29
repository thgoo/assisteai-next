/** Public URL of the API, used by the browser (baked in at build time). */
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.assisteai.com.br';

/** URL the Next.js server uses to reach the API, e.g. a local address on the same host. */
export const API_INTERNAL_URL = process.env.API_INTERNAL_URL || API_URL;

// The same OAuth client the API checks as the ID token's `aud`
export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
  || '736877274011-im98og8tkedl1gdtvjrj6u217dpqf9rq.apps.googleusercontent.com';

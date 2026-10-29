import {
  useState,
  useEffect,
  useContext,
  createContext,
} from 'react';
import PropTypes from 'prop-types';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { GOOGLE_CLIENT_ID } from '../../../config';
import api from '../../services/api';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // `credential` is the Google ID token from Google Identity Services
  const loginWithGoogle = async (credential) => {
    const { data: { user: apiUser } } = await api.post('auth/google', { credential });
    setUser(apiUser);
  };

  const logout = async () => {
    try {
      await api.post('auth/logout');
    } catch {
      // Log out locally even if the API could not be reached
    } finally {
      setUser(null);
    }
  };

  useEffect(() => {
    async function getUserFromSession() {
      try {
        const { data: { user: me } } = await api.get('me');
        setUser(me);
      } catch {
        // 401: anonymous visitor
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    getUserFromSession();
  }, []);

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthContext.Provider value={{
        isAuthenticated: !!user,
        user,
        loginWithGoogle,
        loading,
        logout,
      }}
      >
        {children}
      </AuthContext.Provider>
    </GoogleOAuthProvider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default function useAuth() {
  const context = useContext(AuthContext);

  return context;
}

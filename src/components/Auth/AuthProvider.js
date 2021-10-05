import {
  useState,
  useEffect,
  useContext,
  createContext,
} from 'react';
import PropTypes from 'prop-types';
import Cookies from 'js-cookie';
import api from '../../services/api';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loginWithGoogle = async ({ accessToken: oauthAccessToken }) => {
    const {
      data: {
        access_token: accessToken,
        user: apiUser,
      },
    } = await api.post('auth/login/google', { token: oauthAccessToken });
    Cookies.set('accessToken', accessToken, { expires: 60 });
    api.defaults.headers.Authorization = `Bearer ${accessToken}`;
    setUser(apiUser);
  };

  const logout = () => {
    Cookies.remove('accessToken');
    setUser(null);
  };

  useEffect(() => {
    async function getUserFromCookie() {
      const token = Cookies.get('accessToken');
      if (token) {
        api.defaults.headers.Authorization = `Bearer ${token}`;
        try {
          const { data: { user: me } } = await api.get('auth/me');
          if (me) setUser(me);
        } catch (err) {
          try {
            const {
              data: {
                access_token: accessToken,
              },
            } = await api.post('auth/refresh');
            Cookies.set('accessToken', accessToken, { expires: 60 });
            getUserFromCookie();
          } catch {
            logout();
          }
        } finally {
          setLoading(false);
        }
      }
    }
    getUserFromCookie();
  }, []);

  return (
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
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default function useAuth() {
  const context = useContext(AuthContext);

  return context;
}

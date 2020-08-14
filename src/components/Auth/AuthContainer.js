import AuthComponent from './AuthComponent';
import useAuth from './AuthProvider';

const AuthContainer = () => {
  const { logout, user } = useAuth();

  return <AuthComponent user={user} onLogout={logout} />;
};

export default AuthContainer;

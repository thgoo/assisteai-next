'use client';

import Login from '../Login/Login';
import UserMenu from '../UserMenu/UserMenu';
import useAuth from './AuthProvider';
import classes from './style.module.scss';

const Auth = () => {
  const { user, loading, logout } = useAuth();

  return (
    <div className={classes.auth}>
      <div className={classes.signinWrapper}>
        {/* Nothing until the session check answers: a signed-in visitor would see "Entrar" flash first */}
        {loading ? null : (user ? <UserMenu user={user} onLogout={logout} /> : <Login />)}
      </div>
    </div>
  );
};

export default Auth;

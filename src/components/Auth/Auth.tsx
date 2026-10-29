'use client';

import Login from '../Login/Login';
import UserMenu from '../UserMenu/UserMenu';
import useAuth from './AuthProvider';
import classes from './style.module.scss';

const Auth = () => {
  const { user, logout } = useAuth();

  return (
    <div className={classes.auth}>
      <div className={classes.signinWrapper}>
        {user ? <UserMenu user={user} onLogout={logout} /> : <Login />}
      </div>
    </div>
  );
};

export default Auth;

import PropTypes from 'prop-types';
import Login from '../Login';
import classes from './style.module.scss';
import UserMenu from '../UserMenu';

const AuthComponent = ({ onLogout, user }) => (
  <div className={classes.auth}>
    {user ? (
      <div className={classes.signinWrapper}>
        <UserMenu onLogout={onLogout} />
      </div>
    ) : (
      <div className={classes.signinWrapper}>
        <Login />
      </div>
    )}
  </div>
);

AuthComponent.propTypes = {
  user: PropTypes.object,
  onLogout: PropTypes.func.isRequired,
};

AuthComponent.defaultProps = {
  user: null,
};

export default AuthComponent;

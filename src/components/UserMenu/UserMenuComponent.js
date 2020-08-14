import { forwardRef } from 'react';
import { CSSTransition } from 'react-transition-group';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSignOut, faUserCircle } from '@fortawesome/pro-solid-svg-icons';
import classes from './style.module.scss';
import transitions from './transitions.module.scss';

const UserMenuComponent = forwardRef(({
  isOpen, user, toggle, onLogout,
}, ref) => (
  <div className={classes.userMenu}>
    <button type="button" onClick={toggle} ref={ref}>
      <div className={classes.name}>{user.name}</div>
      <div className={classes.avatar} style={{ backgroundImage: `url(${user.avatar})` }} />
    </button>
    <CSSTransition in={isOpen} timeout={300} classNames={transitions} unmountOnExit>
      <div className={classes.menu}>
        <ul>
          <li>
            <button type="button">
              <div className={classes.icon}><FontAwesomeIcon icon={faUserCircle} /></div>
              Meu perfil
            </button>
          </li>
          <li>
            <button type="button" onClick={onLogout}>
              <div className={classes.icon}><FontAwesomeIcon icon={faSignOut} /></div>
              Sair
            </button>
          </li>
        </ul>
      </div>
    </CSSTransition>
  </div>
));

UserMenuComponent.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  user: PropTypes.object.isRequired,
  toggle: PropTypes.func.isRequired,
  onLogout: PropTypes.func.isRequired,
};

export default UserMenuComponent;

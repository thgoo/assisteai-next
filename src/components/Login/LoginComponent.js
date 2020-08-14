import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSignIn } from '@fortawesome/pro-solid-svg-icons';
import { faGoogle, faFacebookF } from '@fortawesome/free-brands-svg-icons';
import { GoogleLogin } from 'react-google-login';
import Modal from '../Modal';
import classes from './style.module.scss';

const LoginComponent = ({
  modalVisible, onGoogleLogin, hideLoginModal, showLoginModal,
}) => (
  // eslint-disable-next-line
  <div className={classes.login}>
    <button type="button" className={classes.signinButton} onClick={showLoginModal}>
      <FontAwesomeIcon icon={faSignIn} />
      Entrar
    </button>
    <Modal isOpen={modalVisible} onRequestClose={hideLoginModal}>
      <div className={classes.loginForm}>
        <div className={classes.logo}>
          <img src="/img/logo-text.png" alt="Logo" />
        </div>
        <p>Bem-vindo ao Assiste Aí, faça login<br />escolhendo uma das opções abaixo:</p>
        <div className={classes.optionList}>
          <div className={classes.option}>
            <GoogleLogin
              clientId="736877274011-im98og8tkedl1gdtvjrj6u217dpqf9rq.apps.googleusercontent.com"
              buttonText="Google"
              onSuccess={onGoogleLogin}
              onFailure={onGoogleLogin}
              cookiePolicy="single_host_origin"
              render={({ onClick, disabled }) => (
                <button type="button" className="button" onClick={onClick} disabled={disabled}>
                  <FontAwesomeIcon icon={faGoogle} />
                  Google
                </button>
              )}
            />
          </div>
          <div className={classes.option}>
            <button type="button" className="button" disabled>
              <FontAwesomeIcon icon={faFacebookF} />
              Facebook
            </button>
          </div>
        </div>
      </div>
    </Modal>
  </div>
);

LoginComponent.propTypes = {
  modalVisible: PropTypes.bool.isRequired,
  hideLoginModal: PropTypes.func.isRequired,
  onGoogleLogin: PropTypes.func.isRequired,
  showLoginModal: PropTypes.func.isRequired,
};

export default LoginComponent;

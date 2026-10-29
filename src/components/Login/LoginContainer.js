import { useState } from 'react';
import { useDispatch } from 'react-redux';
import LoginComponent from './LoginComponent';
import useAuth from '../Auth/AuthProvider';
import { showToast } from '../../store/ducks/toasts';

const LoginContainer = ({ ...props }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const { loginWithGoogle } = useAuth();
  const dispatch = useDispatch();

  const showLoginModal = () => {
    setModalVisible(true);
  };

  const hideLoginModal = () => {
    setModalVisible(false);
  };

  const showLoginError = (text) => {
    dispatch(
      showToast({
        type: 'error',
        title: 'Ops!',
        text: text || 'Não foi possível entrar com o Google. Tente de novo.',
        duration: 5000,
      })
    );
  };

  const onGoogleLogin = async ({ credential }) => {
    try {
      await loginWithGoogle(credential);
      hideLoginModal();
    } catch ({ response }) {
      showLoginError(response?.data?.detail);
    }
  };

  return (
    <LoginComponent
      modalVisible={modalVisible}
      showLoginModal={showLoginModal}
      hideLoginModal={hideLoginModal}
      onGoogleLogin={onGoogleLogin}
      onGoogleLoginError={() => showLoginError()}
      {...props}
    />
  );
};

export default LoginContainer;

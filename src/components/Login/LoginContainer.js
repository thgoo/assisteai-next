import { useState } from 'react';
import LoginComponent from './LoginComponent';
import useAuth from '../Auth/AuthProvider';

const LoginContainer = ({ ...props }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const { loginWithGoogle } = useAuth();

  const showLoginModal = () => {
    setModalVisible(true);
  };

  const hideLoginModal = () => {
    setModalVisible(false);
  };

  return (
    <LoginComponent
      modalVisible={modalVisible}
      showLoginModal={showLoginModal}
      hideLoginModal={hideLoginModal}
      onGoogleLogin={loginWithGoogle}
      {...props}
    />
  );
};

export default LoginContainer;

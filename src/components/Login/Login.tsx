'use client';

import { useState } from 'react';
import Image from 'next/image';
import { LogIn } from 'lucide-react';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { ApiError } from '@/lib/api';
import useAuth from '../Auth/AuthProvider';
import Modal from '../Modal/Modal';
import { useToast } from '../Toast/ToastProvider';
import classes from './style.module.scss';

const Login = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const { loginWithGoogle } = useAuth();
  const { showToast } = useToast();

  const hideLoginModal = () => setModalVisible(false);

  const showLoginError = (text = 'Não foi possível entrar com o Google. Tente de novo.') => {
    showToast({
      type: 'error',
      title: 'Ops!',
      text,
      duration: 5000,
    });
  };

  const onGoogleLogin = async ({ credential }: CredentialResponse) => {
    if (!credential) {
      showLoginError();
      return;
    }

    try {
      await loginWithGoogle(credential);
      hideLoginModal();
    } catch (err) {
      showLoginError(err instanceof ApiError ? err.detail : undefined);
    }
  };

  return (
    <div className={classes.login}>
      <button type="button" className={classes.signinButton} onClick={() => setModalVisible(true)}>
        <LogIn />
        Entrar
      </button>
      <Modal isOpen={modalVisible} onRequestClose={hideLoginModal}>
        <div className={classes.loginForm}>
          <div className={classes.logo}>
            <Image src="/img/logo-text.png" alt="Logo" width={792} height={173} style={{ width: 'auto' }} />
          </div>
          <p>Bem-vindo ao Assiste Aí, faça login<br />escolhendo uma das opções abaixo:</p>
          <div className={classes.optionList}>
            <div className={`${classes.option} ${classes.googleOption}`}>
              {/* Google Identity Services renders its own button; it returns an ID token (`credential`) */}
              <GoogleLogin
                onSuccess={onGoogleLogin}
                onError={() => showLoginError()}
                text="signin_with"
                shape="pill"
              />
            </div>
            <div className={classes.option}>
              <button type="button" className="button" disabled>
                Facebook
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Login;

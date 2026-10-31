'use client';

import Image from 'next/image';
import { LogIn } from 'lucide-react';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { ApiError } from '@/lib/api';
import useAuth from '../Auth/AuthProvider';
import Modal from '../Modal/Modal';
import { useToast } from '../Toast/ToastProvider';
import classes from './style.module.scss';

const Login = () => {
  // Also opened by actions that need a session (useAuth's `openLogin`)
  const {
    loginWithGoogle, isLoginOpen, openLogin, closeLogin,
  } = useAuth();
  const { showToast } = useToast();

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
    } catch (err) {
      showLoginError(err instanceof ApiError ? err.detail : undefined);
    }
  };

  return (
    <div className={classes.login}>
      <button type="button" className={classes.signinButton} onClick={() => openLogin()}>
        <LogIn />
        Entrar
      </button>
      <Modal isOpen={isLoginOpen} onRequestClose={closeLogin}>
        <div className={classes.loginForm}>
          <div className={classes.logo}>
            <Image src="/img/logo-text.png" alt="Logo" width={792} height={173} style={{ width: 'auto' }} />
          </div>
          <p>Bem-vindo ao Assiste Aí, faça login<br />com a sua conta do Google:</p>
          <div className={classes.optionList}>
            <div className={`${classes.option} ${classes.googleOption}`}>
              {/* Google Identity Services renders its own button; it returns an ID token (`credential`) */}
              <GoogleLogin
                onSuccess={onGoogleLogin}
                onError={() => showLoginError()}
                text="signin_with"
                shape="pill"
                theme="filled_black"
                // Google first renders the generic button, then swaps in the personalized one ("Fazer login como…");
                // the same width for both keeps the swap in place
                width={280}
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Login;

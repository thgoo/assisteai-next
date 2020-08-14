import { useState, useEffect, useRef } from 'react';
import useAuth from '../Auth/AuthProvider';
import UserMenuComponent from './UserMenuComponent';

let shouldClose = false;
const UserMenuContainer = ({ ...props }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const ref = useRef();

  const toggle = () => {
    setIsOpen(oldState => !oldState);
    shouldClose = !shouldClose;
  };

  useEffect(() => {
    const closeMenu = (evt) => {
      if (!ref.current.contains(evt.target) && shouldClose) toggle();
    };

    const handleKeyUp = (evt) => {
      if (evt.code === 'Escape' && shouldClose) {
        toggle();
      }
    };

    document.addEventListener('click', closeMenu);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      document.removeEventListener('click', closeMenu);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return <UserMenuComponent isOpen={isOpen} toggle={toggle} user={user} ref={ref} {...props} />;
};

export default UserMenuContainer;

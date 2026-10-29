'use client';

import { useEffect, useRef, useState } from 'react';
import { CSSTransition } from 'react-transition-group';
import { CircleUser, LogOut } from 'lucide-react';
import type { User } from '@/lib/types';
import classes from './style.module.scss';
import transitions from './transitions.module.scss';

interface UserMenuProps {
  user: User;
  onLogout: () => void;
}

const UserMenu = ({ user, onLogout }: UserMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Clicks outside and Esc close it
  useEffect(() => {
    if (!isOpen) return undefined;

    const closeMenu = (evt: MouseEvent) => {
      if (!ref.current?.contains(evt.target as Node)) setIsOpen(false);
    };
    const handleKeyUp = (evt: KeyboardEvent) => {
      if (evt.code === 'Escape') setIsOpen(false);
    };

    document.addEventListener('click', closeMenu);
    document.addEventListener('keyup', handleKeyUp);
    return () => {
      document.removeEventListener('click', closeMenu);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [isOpen]);

  return (
    <div className={classes.userMenu} ref={ref}>
      <button type="button" onClick={() => setIsOpen(open => !open)}>
        <div className={classes.name}>{user.name}</div>
        <div
          className={classes.avatar}
          style={{ backgroundImage: user.avatarUrl ? `url(${user.avatarUrl})` : undefined }}
        />
      </button>
      <CSSTransition nodeRef={menuRef} in={isOpen} timeout={300} classNames={transitions} unmountOnExit>
        <div className={classes.menu} ref={menuRef}>
          <ul>
            <li>
              <button type="button">
                <div className={classes.icon}><CircleUser /></div>
                Meu perfil
              </button>
            </li>
            <li>
              <button type="button" onClick={onLogout}>
                <div className={classes.icon}><LogOut /></div>
                Sair
              </button>
            </li>
          </ul>
        </div>
      </CSSTransition>
    </div>
  );
};

export default UserMenu;

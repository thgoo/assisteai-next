'use client';

import { useEffect, useRef } from 'react';
import { CSSTransition } from 'react-transition-group';
import classes from './style.module.scss';
import opacityTransitions from './opacityTransitions.module.scss';

interface ModalProps {
  isOpen: boolean;
  onRequestClose: () => void;
  children: React.ReactNode;
  zeroPadding?: boolean;
}

const Modal = ({
  isOpen, onRequestClose, children, zeroPadding = false,
}: ModalProps) => {
  const nodeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    const onKeyUp = (evt: KeyboardEvent) => {
      if (evt.code === 'Escape') onRequestClose();
    };

    document.addEventListener('keyup', onKeyUp);
    return () => document.removeEventListener('keyup', onKeyUp);
  }, [isOpen, onRequestClose]);

  return (
    <CSSTransition nodeRef={nodeRef} in={isOpen} timeout={300} classNames={opacityTransitions} unmountOnExit>
      <div ref={nodeRef} className={`${classes.modal} ${zeroPadding ? classes.hasNoPadding : ''}`}>
        <div className={classes.overlay} onClick={onRequestClose}>
          <div className={`${classes.magicBorder} magic-border`}>
            <div className={classes.content} onClick={evt => evt.stopPropagation()}>
              {children}
            </div>
          </div>
        </div>
      </div>
    </CSSTransition>
  );
};

export default Modal;

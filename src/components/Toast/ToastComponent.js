import React, { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/pro-solid-svg-icons';
import {
  CSSTransition,
  TransitionGroup,
} from 'react-transition-group';
import Icon from './Icon';
import classes from './style.module.scss';

const handleExiting = (el) => {
  el.style.transform += ' scale(0.9)';
};

const setToastsPosition = (container) => {
  if (!container) return;
  const els = container.querySelectorAll('[class^=toast__]:not(.toast-exit-done)');
  let totalHeight = 0;
  for (let i = 0; i < els.length; i++) {
    const top = totalHeight + 10 * i;
    els[i].style.transform = `translate3d(0, -${top}px, 0)`;
    els[i].style.transitionDelay = `${0.015 * i}s`;
    totalHeight += els[i].offsetHeight;
  }
};

const timeouts = {};
const ToastComponent = ({ hideToast, toasts }) => {
  const container = useRef();

  useEffect(() => {
    toasts.forEach((toast) => {
      if (toast.duration) {
        if (!timeouts[toast.id]) {
          timeouts[toast.id] = setTimeout(() => {
            hideToast(toast.id);
          }, toast.duration);
        }
      }
    });
  }, [hideToast, toasts]);

  const handleClick = (toastId) => {
    clearTimeout(timeouts[toastId]);
    hideToast(toastId);
  };

  return (
    <div className={classes.toastContainer} ref={container}>
      <TransitionGroup component={null}>
        {toasts.map(toast => (
          <CSSTransition
            timeout={300}
            classNames="toast"
            onEnter={() => setToastsPosition(container.current)}
            onExiting={handleExiting}
            onExited={() => setToastsPosition(container.current)}
            unmountOnExit
            key={toast.id}
          >
            <div className={classes.toast}>
              <button type="button" className={classes.closeButton} onClick={() => handleClick(toast.id)}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
              <div className={classes.icon}>
                <Icon type={toast.type} />
              </div>
              <div className={classes.content}>
                <h5 className={classes.title}>{toast.title}</h5>
                <p className={classes.text}>{toast.text}</p>
              </div>
            </div>
          </CSSTransition>
        ))}
      </TransitionGroup>
    </div>
  );
};

ToastComponent.propTypes = {
  hideToast: PropTypes.func.isRequired,
  toasts: PropTypes.array,
};

ToastComponent.defaultProps = {
  toasts: [],
};

export default ToastComponent;

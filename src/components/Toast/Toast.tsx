'use client';

import { useEffect, useRef } from 'react';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import { CheckCheck, TriangleAlert, X } from 'lucide-react';
import { useToast, type ToastData } from './ToastProvider';
import classes from './style.module.scss';

// Stacks the visible toasts from the bottom up
const setToastsPosition = (container: HTMLElement | null) => {
  if (!container) return;
  const els = container.querySelectorAll<HTMLElement>('[data-toast]:not(.toast-exit-done)');
  let totalHeight = 0;
  els.forEach((el, i) => {
    const top = totalHeight + 10 * i;
    el.style.transform = `translate3d(0, -${top}px, 0)`;
    el.style.transitionDelay = `${0.015 * i}s`;
    totalHeight += el.offsetHeight;
  });
};

const ToastIcon = ({ type }: { type: ToastData['type'] }) => (
  type === 'error'
    ? <TriangleAlert style={{ color: 'rgba(235, 87, 104, 1)' }} />
    : <CheckCheck style={{ color: 'rgba(73, 180, 131, 1)' }} />
);

interface ToastItemProps {
  toast: ToastData;
  onClose: (id: string) => void;
  onLayout: () => void;
}

// TransitionGroup clones its children to pass `in`/`onExited`; they must reach the CSSTransition
const ToastItem = ({
  toast, onClose, onLayout, ...transitionProps
}: ToastItemProps) => {
  const nodeRef = useRef<HTMLDivElement>(null);

  return (
    <CSSTransition
      {...transitionProps}
      nodeRef={nodeRef}
      timeout={300}
      classNames="toast"
      onEnter={onLayout}
      onExiting={() => {
        if (nodeRef.current) nodeRef.current.style.transform += ' scale(0.9)';
      }}
      onExited={onLayout}
      unmountOnExit
    >
      <div className={classes.toast} ref={nodeRef} data-toast>
        <button type="button" className={classes.closeButton} onClick={() => onClose(toast.id)}>
          <X />
        </button>
        <div className={classes.icon}>
          <ToastIcon type={toast.type} />
        </div>
        <div className={classes.content}>
          <h5 className={classes.title}>{toast.title}</h5>
          <p className={classes.text}>{toast.text}</p>
        </div>
      </div>
    </CSSTransition>
  );
};

const Toast = () => {
  const { toasts, hideToast } = useToast();
  const container = useRef<HTMLDivElement>(null);
  const timeouts = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  useEffect(() => {
    toasts.forEach((toast) => {
      if (toast.duration && !timeouts.current.has(toast.id)) {
        timeouts.current.set(toast.id, setTimeout(() => hideToast(toast.id), toast.duration));
      }
    });
  }, [hideToast, toasts]);

  const handleClose = (id: string) => {
    clearTimeout(timeouts.current.get(id));
    hideToast(id);
  };

  return (
    <div className={classes.toastContainer} ref={container}>
      <TransitionGroup component={null}>
        {toasts.map(toast => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onClose={handleClose}
            onLayout={() => setToastsPosition(container.current)}
          />
        ))}
      </TransitionGroup>
    </div>
  );
};

export default Toast;

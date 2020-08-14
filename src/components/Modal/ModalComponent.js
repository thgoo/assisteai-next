import PropTypes from 'prop-types';
import { CSSTransition } from 'react-transition-group';
import classes from './style.module.scss';
import opacityTransitions from './opacityTransitions.module.scss';

const ModalComponent = ({
  isOpen,
  onRequestClose,
  children,
  withBorder,
  zeroPadding,
}) => (
  <CSSTransition in={isOpen} timeout={300} classNames={opacityTransitions} unmountOnExit>
    <div className={`${classes.modal} ${zeroPadding ? classes.hasNoPadding : ''}`}>
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

ModalComponent.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  children: PropTypes.node.isRequired,
  onRequestClose: PropTypes.func.isRequired,
  withBorder: PropTypes.bool,
  zeroPadding: PropTypes.bool,
};

ModalComponent.defaultProps = {
  withBorder: true,
  zeroPadding: false,
};

export default ModalComponent;

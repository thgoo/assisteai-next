import { useEffect } from 'react';
import PropTypes from 'prop-types';
import ModalComponent from './ModalComponent';

const ModalContainer = ({ onRequestClose, ...props }) => {
  useEffect(() => {
    const onKeyUp = (evt) => {
      if (evt.code === 'Escape') onRequestClose();
    };

    document.addEventListener('keyup', onKeyUp);

    return () => document.removeEventListener('keyup', onKeyUp);
  }, [onRequestClose]);

  return <ModalComponent onRequestClose={onRequestClose} {...props} />;
};

ModalContainer.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onRequestClose: PropTypes.func.isRequired,
};

export default ModalContainer;

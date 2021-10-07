import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/pro-regular-svg-icons';
import classes from './style.module.scss';

const NewThreadButtonComponent = ({ onClick, ...props }) => (
  <div className={classes.newThreadButton}>
    <button type="button" className="button-alt" onClick={onClick} {...props}>
      <FontAwesomeIcon icon={faPlus} />
      Nova indicação
    </button>
  </div>
);

NewThreadButtonComponent.propTypes = {
  onClick: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

NewThreadButtonComponent.defaultProps = {
  disabled: false,
};

export default NewThreadButtonComponent;

import PropTypes from 'prop-types';
import classes from './style.module.scss';

const BackdropComponent = ({ backdrop, colorless, ...props }) => (
  backdrop
    ? (
      <div
        className={classes.backdrop}
        {...props}
      >
        <div
          className={`${classes.background} ${colorless && classes.isColorless}`}
          style={{ backgroundImage: `url(${backdrop})` }}
        />
      </div>
    )
    : null
);

BackdropComponent.propTypes = {
  backdrop: PropTypes.string.isRequired,
  colorless: PropTypes.bool,
};

BackdropComponent.defaultProps = {
  colorless: false,
};

export default BackdropComponent;

import PropTypes from 'prop-types';
import classes from './style.module.scss';

const ContainerComponent = ({ children, maxWidth }) => {
  const getMaxWidth = () => {
    switch (maxWidth) {
      case 'sm':
        return classes.maxWidthSm;
      case 'md':
        return classes.maxWidthMd;
      default:
        return classes.maxWidthLg;
    }
  };

  return (
    <div
      className={`${classes.container} ${getMaxWidth()}`}
    >
      {children}
    </div>
  );
};

ContainerComponent.propTypes = {
  children: PropTypes.node.isRequired,
  maxWidth: PropTypes.string.isRequired,
};

ContainerComponent.defaultProps = {
};

export default ContainerComponent;

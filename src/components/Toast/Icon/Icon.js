import React from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle, faCheckDouble } from '@fortawesome/pro-solid-svg-icons';

const Icon = ({ type }) => {
  switch (type) {
    case 'error':
      return (
        <FontAwesomeIcon
          icon={faExclamationTriangle}
          style={{ color: 'rgba(235, 87, 104, 1)rgba(73, 180, 131, 1)' }}
        />
      );
    case 'success':
    default:
      return (
        <FontAwesomeIcon
          icon={faCheckDouble}
          style={{ color: 'rgba(73, 180, 131, 1)' }}
        />
      );
  }
};

Icon.propTypes = {
  type: PropTypes.string,
};

Icon.defaultProps = {
  type: null,
};

export default Icon;

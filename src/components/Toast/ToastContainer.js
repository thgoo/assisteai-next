import { connect } from 'react-redux';
import { hideToast } from '../../store/ducks/toasts';
import ToastComponent from './ToastComponent';

const mapStateToProps = ({ toasts }) => ({
  toasts,
});

const ToastContainer = connect(
  mapStateToProps,
  { hideToast }
)(ToastComponent);

export default ToastContainer;

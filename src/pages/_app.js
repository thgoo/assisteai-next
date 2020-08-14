import PropTypes from 'prop-types';
import ReactTooltip from 'react-tooltip';
import { wrapper } from '../store';
import Header from '../components/Header';
import Toast from '../components/Toast';
import { AuthProvider } from '../components/Auth/AuthProvider';
import '../../sass/style.scss';

const MyApp = ({ Component, pageProps }) => (
  <main>
    <AuthProvider>
      <Header />
      <Component {...pageProps} />
    </AuthProvider>
    <ReactTooltip effect="solid" uuid="a0ea1713-cb8b-47b9-baac-b54642328e3c" />
    <Toast />
  </main>
);

MyApp.propTypes = {
  Component: PropTypes.elementType.isRequired,
  pageProps: PropTypes.object.isRequired,
};

export default wrapper.withRedux(MyApp);

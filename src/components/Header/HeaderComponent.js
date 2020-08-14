import Link from 'next/link';
import Auth from '../Auth';
import classes from './style.module.scss';

const HeaderComponent = () => (
  <div className={classes.header}>
    <div className="container">
      <div className={classes.logo}>
        <Link href="/">
          <a><img src="/img/logo.svg" alt="Logo" /></a>
        </Link>
      </div>
      <div className={classes.authWrapper}>
        <Auth />
      </div>
    </div>
  </div>
);

export default HeaderComponent;

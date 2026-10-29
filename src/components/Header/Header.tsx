import Image from 'next/image';
import Link from 'next/link';
import Auth from '../Auth/Auth';
import classes from './style.module.scss';

const Header = () => (
  <div className={classes.header}>
    <div className="container">
      <div className={classes.logo}>
        <Link href="/">
          <Image src="/img/logo.svg" alt="Logo" width={791} height={172} style={{ width: 'auto' }} priority />
        </Link>
      </div>
      <div className={classes.authWrapper}>
        <Auth />
      </div>
    </div>
  </div>
);

export default Header;

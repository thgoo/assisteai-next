import Image from 'next/image';
import Auth from '../Auth/Auth';
import ListLink from '../ListLink/ListLink';
import NewThread from '../NewThread/NewThread';
import classes from './style.module.scss';

const Header = () => (
  <div className={classes.header}>
    <div className="container">
      <div className={classes.logo}>
        {/* The start: the list without filters */}
        <ListLink>
          <Image src="/img/logo.svg" alt="Logo" width={791} height={172} style={{ width: 'auto' }} priority />
        </ListLink>
      </div>
      <div className={classes.actions}>
        <NewThread />
        <Auth />
      </div>
    </div>
  </div>
);

export default Header;

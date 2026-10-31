'use client';

import { useState } from 'react';
import classes from './style.module.scss';

interface AvatarProps {
  name: string;
  url: string | null;
  /** In px */
  size: number;
  className?: string;
}

/** "Thiago Pavan" → "TP" */
const initials = (name: string) => {
  const words = name.trim().split(/\s+/);
  return (words.length > 1 ? words[0][0] + words[words.length - 1][0] : words[0].slice(0, 2)).toUpperCase();
};

/** A person's picture, or their initials when there's none or it fails to load. */
const Avatar = ({
  name, url, size, className = '',
}: AvatarProps) => {
  const [failed, setFailed] = useState(false);
  const style = { width: size, height: size, fontSize: size * 0.4 };

  return url && !failed ? (
    // Google avatars, already small
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt=""
      className={`${classes.avatar} ${className}`}
      style={style}
      // Google refuses some avatar requests coming from other sites
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  ) : (
    <span className={`${classes.avatar} ${classes.initials} ${className}`} style={style} aria-hidden>
      {initials(name)}
    </span>
  );
};

export default Avatar;

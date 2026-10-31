'use client';

import { useEffect, useRef, useState } from 'react';
import { watchPosterFlights } from '../PosterTransition/PosterTransition';
import classes from './style.module.scss';

const PHONES = '(max-width: 767px)';

// Backdrops loaded during this visit: a new image of one (the list's, coming back to it) isn't `complete` at once, but
// shows without a fade
const loaded = new Set<string>();

// TMDb's backdrops come at 1280px wide; phones show them at their screen's width, for which 780px is plenty
const smallerOnPhones = (url: string) => url.replace('/t/p/w1280/', '/t/p/w780/');

interface BackdropImageProps {
  url: string;
  colorless: boolean;
}

/** An image rather than a CSS background: browsers can decode it without holding up the page's frames */
const BackdropImage = ({ url, colorless }: BackdropImageProps) => {
  const image = useRef<HTMLImageElement>(null);
  const [isHeld, setHeld] = useState(false);
  // Not loaded yet once on screen: it fades in when it is, rather than popping in
  const [isLoading, setLoading] = useState(false);

  useEffect(() => {
    if (!image.current?.complete && !loaded.has(url)) setLoading(true);
  }, [url]);

  const settle = () => {
    loaded.add(url);
    setLoading(false);
  };

  // Phones: an image arriving while the poster flies here would be decoded and painted mid-flight, dropping frames;
  // until it lands, it waits unpainted. One already there (a page seen before) stays
  useEffect(() => watchPosterFlights((landing) => {
    if (!window.matchMedia(PHONES).matches || image.current?.complete) return;
    setHeld(true);
    landing.then(() => setHeld(false));
  }), []);

  return (
    <picture>
      <source media={PHONES} srcSet={smallerOnPhones(url)} />
      <img
        ref={image}
        src={url}
        alt=""
        decoding="async"
        className={`${classes.background} ${colorless ? classes.isColorless : ''} ${isHeld ? classes.isHeld : ''} ${
          isLoading ? classes.isLoading : ''}`}
        onLoad={settle}
        onError={() => setLoading(false)}
      />
    </picture>
  );
};

export default BackdropImage;

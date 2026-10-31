import { getImageProps } from 'next/image';

/** The posters' `sizes`: the preload and the movie page must pick the same file from the srcset as the card */
export const POSTER_SIZES = '(min-width: 768px) 260px, 50vw';

/** Loads posters into the browser's cache; resolves when all have loaded or failed, or after `timeoutMs`. */
export function preloadPosters(urls: string[], timeoutMs: number): Promise<void> {
  const loads = urls.map(url => new Promise<void>((resolve) => {
    const { props } = getImageProps({
      src: url, alt: '', fill: true, sizes: POSTER_SIZES,
    });
    const image = new window.Image();
    image.onload = () => resolve();
    image.onerror = () => resolve();
    image.sizes = props.sizes ?? '';
    image.srcset = props.srcSet ?? '';
    image.src = props.src;
  }));

  return new Promise((resolve) => {
    const timeout = setTimeout(resolve, timeoutMs);
    Promise.all(loads).then(() => {
      clearTimeout(timeout);
      resolve();
    });
  });
}

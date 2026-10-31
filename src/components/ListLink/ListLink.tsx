'use client';

import Link from 'next/link';
import { goingToListSearch, scrollPositionKey } from '../MovieFilters/useMovieFilters';

interface ListLinkProps extends Omit<React.ComponentProps<typeof Link>, 'href' | 'scroll'> {
  /** The list's filters, as its query string ('' for none) */
  search?: string;
}

/**
 * To the movie list, where the visitor left it: the list restores its own scroll (MovieList) before the page paints, so
 * a poster flying back lands on its card. Next.js scrolling to the top afterwards would undo that, hence `scroll`.
 */
const ListLink = ({ search = '', onClick, ...props }: ListLinkProps) => (
  <Link
    {...props}
    href={`/${search}`}
    scroll={false}
    onClick={(evt) => {
      // Never on this list yet (a movie opened from a shared link): its top
      const key = scrollPositionKey(search);
      if (window.sessionStorage.getItem(key) === null) window.sessionStorage.setItem(key, '0');
      goingToListSearch(search);
      onClick?.(evt);
    }}
  />
);

export default ListLink;

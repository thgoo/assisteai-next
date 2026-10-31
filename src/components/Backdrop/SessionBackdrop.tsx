'use client';

import { useState, type ReactNode } from 'react';
import Backdrop from './Backdrop';

// The first backdrop this page load got; it stays for the visit. Browser only: on the server this module outlives
// requests, and would give every visitor the first draw
let kept: string | null | undefined;
const isBrowser = typeof window !== 'undefined';

/**
 * The home's random backdrop, drawn again by the server on every navigation to the list: the links back to it would
 * show the one on screen, then swap it for the new draw. One per visit instead; reloading draws another.
 */
const SessionBackdrop = ({ backdrop }: { backdrop: string | null }) => {
  const [url] = useState(() => {
    if (!isBrowser) return backdrop;
    if (kept === undefined) kept = backdrop;
    return kept;
  });

  return <Backdrop backdrop={url} colorless />;
};

/**
 * Coming back to the list, the visit's backdrop at once; otherwise `children`, which draw it. Rendering them again
 * would hold the whole navigation until the server's new draw (unused) arrives: a transition keeps the previous page
 * rather than show a Suspense fallback again.
 */
export const KeptBackdrop = ({ children }: { children: ReactNode }) => {
  // Read on every render: the list's page stays mounted, and the draw is kept after this first rendered
  const url = isBrowser ? kept : undefined;

  return url === undefined ? children : <Backdrop backdrop={url} colorless />;
};

export default SessionBackdrop;

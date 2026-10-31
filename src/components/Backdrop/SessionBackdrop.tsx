'use client';

import { useState } from 'react';
import Backdrop from './Backdrop';

// The first backdrop this page load got; it stays for the visit
let kept: string | null | undefined;

/**
 * The home's random backdrop, drawn again by the server on every navigation to the list: the links back to it would
 * show the one on screen, then swap it for the new draw. One per visit instead; reloading draws another.
 */
const SessionBackdrop = ({ backdrop }: { backdrop: string | null }) => {
  const [url] = useState(() => {
    if (kept === undefined) kept = backdrop;
    return kept;
  });

  return <Backdrop backdrop={url} colorless />;
};

export default SessionBackdrop;

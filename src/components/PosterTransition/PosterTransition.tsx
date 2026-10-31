'use client';

import { ViewTransition, type ReactNode } from 'react';

type ShareHandler = NonNullable<React.ComponentProps<typeof ViewTransition>['onShare']>;

const FLIGHT_EVENT = 'posterflight';
let flight: Promise<void> | null = null;

/** Calls `onFlight` with the landing of the poster flying now, if any, and of the next ones until unsubscribed */
export function watchPosterFlights(onFlight: (landing: Promise<void>) => void) {
  if (flight) onFlight(flight);
  const listener = () => {
    if (flight) onFlight(flight);
  };
  window.addEventListener(FLIGHT_EVENT, listener);
  return () => window.removeEventListener(FLIGHT_EVENT, listener);
}

const announceFlight = (animation: Animation) => {
  const landing = animation.finished.then(() => {}, () => {}).finally(() => {
    if (flight === landing) flight = null;
  });
  flight = landing;
  window.dispatchEvent(new Event(FLIGHT_EVENT));
};

// The browser flies the poster by animating its width and height, which lays it out again on every frame: smooth on
// desktops, choppy on phones. The card and the movie page's poster share their 2:3 shape, so the same flight is a
// scale from the destination's size, which the GPU runs alone
const flyWithTransformOnly: ShareHandler = (instance) => {
  for (const animation of instance.group.getAnimations()) {
    const effect = animation.effect as KeyframeEffect | null;
    const [from, to] = effect?.getKeyframes() ?? [];
    // Already rewritten (both ends of the flight call this), or not the browser's flight
    if (!effect || !from?.width || !to?.width || from.width === to.width && from.height === to.height) continue;

    const scaleX = parseFloat(String(from.width)) / parseFloat(String(to.width));
    const scaleY = parseFloat(String(from.height)) / parseFloat(String(to.height));
    if (!Number.isFinite(scaleX) || !Number.isFinite(scaleY)) continue;

    // Scaled from the top left corner (globals.scss), the browser's own transforms only move it
    effect.setKeyframes([
      { ...from, width: to.width, height: to.height, transform: `${String(from.transform)} scale(${scaleX}, ${scaleY})` },
      to,
    ]);
    announceFlight(animation);
  }
};

/** The poster's frame, flying between its list card and the movie page (same `id`) when navigating between them */
export default function PosterTransition({ id, children }: { id: number; children: ReactNode }) {
  return (
    <ViewTransition name={`poster-${id}`} share="poster" default="none" onShare={flyWithTransformOnly}>
      {children}
    </ViewTransition>
  );
}

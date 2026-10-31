'use client';

import { ViewTransition, type ReactNode } from 'react';

type ShareHandler = NonNullable<React.ComponentProps<typeof ViewTransition>['onShare']>;

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

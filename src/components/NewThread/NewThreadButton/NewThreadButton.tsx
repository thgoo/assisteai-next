'use client';

import { useEffect, useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import classes from './style.module.scss';

const MOVE_MS = 220;
/** Roughly the cubic-bezier(0.2, 0.8, 0.2, 1) of the site's other transitions: quick start, soft landing */
const easeOut = (t: number) => 1 - (1 - t) ** 3;
const HEADER_RADIUS = 5;

/** Where the button is: in the header, on its way between the two places, or docked at the bottom right */
type Place = 'header' | 'moving' | 'docked';

const Content = () => (
  <>
    <Plus />
    <span className={classes.label}>Nova indicação</span>
  </>
);

/**
 * In the header. On phones it is a round button fixed at the bottom right; on wide screens it docks there once the
 * header's scrolls away, and goes back when it shows again: a copy (`ghost`) morphs from one place to the other, so the
 * eye follows where it went.
 */
const NewThreadButton = ({ onClick }: { onClick: () => void }) => {
  const headerRef = useRef<HTMLButtonElement>(null);
  const dockRef = useRef<HTMLButtonElement>(null);
  const ghostRef = useRef<HTMLDivElement>(null);
  const [place, setPlace] = useState<Place>('header');

  useEffect(() => {
    let docked = false;
    let moving = false;
    let frame = 0;

    const move = (toDock: boolean) => {
      const ghost = ghostRef.current!;
      const label = ghost.querySelector<HTMLElement>(`.${classes.label}`)!;
      const target = (toDock ? dockRef : headerRef).current!;
      // From where the ghost is, when the scroll turns back mid-way
      const from = (moving ? ghost : (toDock ? headerRef : dockRef).current!).getBoundingClientRect();
      const fromRadius = moving ? parseFloat(ghost.style.borderRadius) : (toDock ? HEADER_RADIUS : from.height / 2);
      // The label's share: whole in the header, none in the dock
      const fromLabel = moving ? parseFloat(label.style.opacity) : Number(toDock);
      const labelWidth = headerRef.current!.querySelector(`.${classes.label}`)!.getBoundingClientRect().width;
      const finalPlace = toDock ? 'docked' : 'header';
      cancelAnimationFrame(frame);

      // Phones (the dock isn't shown) and reduced motion: just switch
      if (!target.getBoundingClientRect().width || !from.width
        || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        moving = false;
        setPlace(finalPlace);
        return;
      }

      const start = performance.now();
      const step = (now: number) => {
        const t = Math.min((now - start) / MOVE_MS, 1);
        const mix = (a: number, b: number) => a + (b - a) * easeOut(t);
        // Toward where the target is now, not where it was: the header's button keeps moving while the page scrolls
        const to = target.getBoundingClientRect();
        Object.assign(ghost.style, {
          transform: `translate(${mix(from.left, to.left)}px, ${mix(from.top, to.top)}px)`,
          width: `${mix(from.width, to.width)}px`,
          height: `${mix(from.height, to.height)}px`,
          borderRadius: `${mix(fromRadius, toDock ? to.height / 2 : HEADER_RADIUS)}px`,
        });
        // The label shrinks away into the dock's circle, and grows back on the way to the header; the dock's shadow
        // grows and fades the other way, as the header's button has none
        const shown = mix(fromLabel, Number(!toDock));
        Object.assign(label.style, {
          opacity: String(shown),
          maxWidth: `${labelWidth * shown}px`,
          marginLeft: `${0.8 * shown}rem`,
        });
        const lift = 1 - shown;
        ghost.style.boxShadow = `0 ${4 * lift}px ${12 * lift}px rgba(0, 0, 0, ${0.45 * lift})`;

        if (t < 1) {
          frame = requestAnimationFrame(step);
        } else {
          moving = false;
          setPlace(finalPlace);
        }
      };

      // The first frame right away: the ghost shows with the next render, already in place
      step(start);
      moving = true;
      setPlace('moving');
      frame = requestAnimationFrame(step);
    };

    // Docks as soon as the header's button starts to leave the screen, so the morph starts where it can be seen
    const observer = new IntersectionObserver(([entry]) => {
      const toDock = entry.intersectionRatio < 1;
      if (toDock === docked) return;
      docked = toDock;
      move(toDock);
    }, { threshold: 1 });
    observer.observe(headerRef.current!);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <>
      <button
        ref={headerRef}
        type="button"
        className={`${classes.newThreadButton} ${place === 'header' ? '' : classes.isAway}`}
        aria-label="Nova indicação"
        onClick={onClick}
      >
        <Content />
      </button>
      <button
        ref={dockRef}
        type="button"
        className={`${classes.dock} ${place === 'docked' ? classes.isDocked : ''}`}
        aria-label="Nova indicação"
        onClick={onClick}
      >
        <Content />
      </button>
      <div ref={ghostRef} className={`${classes.ghost} ${place === 'moving' ? classes.isMoving : ''}`} aria-hidden>
        <Content />
      </div>
    </>
  );
};

export default NewThreadButton;

'use client';

import { useEffect, useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import classes from './style.module.scss';

const MOVE_MS = 220;
const EASING = 'cubic-bezier(0.2, 0.8, 0.2, 1)';

/** Where the button is: in the header, on its way between the two places, or docked at the bottom right */
type Place = 'header' | 'moving' | 'docked';

const shape = (rect: DOMRect) => ({
  transform: `translate(${rect.left}px, ${rect.top}px)`,
  width: `${rect.width}px`,
  height: `${rect.height}px`,
  // The header's rounded rectangle or the dock's circle
  borderRadius: rect.width === rect.height ? `${rect.height / 2}px` : '5px',
});

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
    let animations: Animation[] = [];

    const move = (toDock: boolean) => {
      const ghost = ghostRef.current!;
      // From where the ghost is, when the scroll turns back mid-way
      const moving = animations.some(animation => animation.playState === 'running');
      const from = (moving ? ghost : (toDock ? headerRef : dockRef).current!).getBoundingClientRect();
      const to = (toDock ? dockRef : headerRef).current!.getBoundingClientRect();
      animations.forEach(animation => animation.cancel());
      const finalPlace = toDock ? 'docked' : 'header';

      // Phones (the dock isn't shown) and reduced motion: just switch
      if (!to.width || !from.width || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        animations = [];
        setPlace(finalPlace);
        return;
      }

      const options = { duration: MOVE_MS, easing: EASING, fill: 'both' } as const;
      const label = ghost.querySelector(`.${classes.label}`)!;
      const wide = { opacity: 1, maxWidth: '200px', marginLeft: '0.8rem' };
      const round = { opacity: 0, maxWidth: '0px', marginLeft: '0px' };
      animations = [
        ghost.animate([shape(from), shape(to)], options),
        label.animate(toDock ? [wide, round] : [round, wide], options),
      ];
      setPlace('moving');
      // The ghost hides with the new place; canceling here would flash it at its unanimated spot first
      animations[0].onfinish = () => setPlace(finalPlace);
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
      animations.forEach(animation => animation.cancel());
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

import { Plus } from 'lucide-react';
import classes from './style.module.scss';

/** In the header on wide screens; on phones, a round button fixed at the bottom right. */
const NewThreadButton = (props: React.ComponentProps<'button'>) => (
  <button type="button" className={classes.newThreadButton} aria-label="Nova indicação" {...props}>
    <Plus />
    <span className={classes.label}>Nova indicação</span>
  </button>
);

export default NewThreadButton;

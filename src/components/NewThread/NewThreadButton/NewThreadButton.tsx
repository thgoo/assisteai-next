import { Plus } from 'lucide-react';
import classes from './style.module.scss';

const NewThreadButton = (props: React.ComponentProps<'button'>) => (
  <div className={classes.newThreadButton}>
    <button type="button" className="button-alt" {...props}>
      <Plus />
      Nova indicação
    </button>
  </div>
);

export default NewThreadButton;

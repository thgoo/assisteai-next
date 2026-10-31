import BackdropImage from './BackdropImage';
import classes from './style.module.scss';

interface BackdropProps {
  backdrop: string | null;
  colorless?: boolean;
}

/** Takes the backdrop's space while it loads, so the content below doesn't move when it arrives */
export const BackdropPlaceholder = () => <div className={`${classes.backdrop} ${classes.isPlaceholder}`} />;

const Backdrop = ({ backdrop, colorless = false }: BackdropProps) => (
  backdrop
    ? (
      <div className={classes.backdrop}>
        <BackdropImage url={backdrop} colorless={colorless} />
      </div>
    )
    : null
);

export default Backdrop;

import classes from './style.module.scss';

interface BackdropProps {
  backdrop: string | null;
  colorless?: boolean;
}

const Backdrop = ({ backdrop, colorless = false }: BackdropProps) => (
  backdrop
    ? (
      <div className={classes.backdrop}>
        <div
          className={`${classes.background} ${colorless ? classes.isColorless : ''}`}
          style={{ backgroundImage: `url(${backdrop})` }}
        />
      </div>
    )
    : null
);

export default Backdrop;

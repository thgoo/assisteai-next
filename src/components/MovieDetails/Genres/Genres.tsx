import classes from './style.module.scss';

const Genres = ({ genres }: { genres: string[] }) => (
  <div className={classes.genres}>
    {genres.map(genre => (
      <span key={genre}>{genre}</span>
    ))}
  </div>
);

export default Genres;

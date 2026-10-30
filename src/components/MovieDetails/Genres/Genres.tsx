import { genreLabel } from '@/lib/genres';
import classes from './style.module.scss';

const Genres = ({ genres }: { genres: string[] }) => (
  <div className={classes.genres}>
    {genres.map(genre => (
      <span key={genre}>{genreLabel(genre)}</span>
    ))}
  </div>
);

export default Genres;

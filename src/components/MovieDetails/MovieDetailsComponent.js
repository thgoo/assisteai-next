import PropTypes from 'prop-types';
import Backdrop from '../Backdrop';
import Container from '../Container';
import RatingSummary from './RatingSummary';
import Genres from './Genres';
import { ratingLabel } from '../../constants/ratings';
import classes from './style.module.scss';

const MovieDetailsComponent = ({ movie, isModal }) => (
  <div className={`${classes.movieDetails} ${isModal ? classes.isModal : ''}`}>
    <Backdrop backdrop={movie.backdropUrl} />
    <Container maxWidth="lg">
      <div className={`${classes.content}`}>
        <div className={classes.posterWrapper}>
          <div
            className={`${classes.poster} magic-border`}
            style={{ backgroundImage: movie.posterUrl ? `url(${movie.posterUrl})` : null }}
          />
        </div>
        <div className={classes.title}>
          <h1>
            {movie.originalTitle}
            {movie.year ? <small>({movie.year})</small> : null}
          </h1>
        </div>
        <div className={classes.description}>
          <p>{movie.description}</p>
          <Genres genres={movie.genres} />
        </div>
        <div className={classes.ratingSummaryWrapper}>
          <RatingSummary rating={movie.rating} />
        </div>
        <section className={classes.ratingSection}>
          <h3 className={classes.titleSection}>Avaliações</h3>
          <div className={classes.ratingList}>
            {movie.ratings.map(userRating => (
              <div className={classes.ratingWrapper} key={userRating.id}>
                <div className={classes.userWrapper}>
                  <img src={userRating.user.avatarUrl} alt="Avatar usuário" className={classes.userAvatar} />
                  <div className={classes.userDetail}>
                    <div className={classes.userName}>{userRating.user.name}</div>
                    <div className={classes.number}>{ratingLabel(userRating.rating)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </Container>
  </div>
);

MovieDetailsComponent.propTypes = {
  isModal: PropTypes.bool,
  movie: PropTypes.object.isRequired,
};

MovieDetailsComponent.defaultProps = {
  isModal: false,
};

export default MovieDetailsComponent;

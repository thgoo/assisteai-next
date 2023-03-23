import PropTypes from 'prop-types';
import Backdrop from '../Backdrop';
import Container from '../Container';
import RatingSummary from './RatingSummary';
import Genres from './Genres';
import classes from './style.module.scss';

const MovieDetailsComponent = ({ movie, isModal }) => (
  <div className={`${classes.movieDetails} ${isModal ? classes.isModal : ''}`}>
    <Backdrop backdrop={movie.backdrop_path} />
    <Container maxWidth="lg">
      <div className={`${classes.content}`}>
        <div className={classes.posterWrapper}>
          <div className={`${classes.poster} magic-border`} style={{ backgroundImage: `url(${movie.poster_path})` }} />
        </div>
        <div className={classes.title}>
          <h1>
            {movie.original_title}
            <small>({movie.year})</small>
          </h1>
        </div>
        <div className={classes.description}>
          <p>{movie.description}</p>
          <Genres genres={movie.genre} />
        </div>
        <div className={classes.ratingSummaryWrapper}>
          <RatingSummary rating={movie.rating} />
        </div>
        <section className={classes.ratingSection}>
          <h3 className={classes.titleSection}>Avaliações</h3>
          <div className={classes.ratingList}>
            {movie.rating.list.map(userRating => (
              <div className={classes.ratingWrapper}>
                <div className={classes.userWrapper}>
                  <img src={userRating.user.avatar} alt="Avatar usuário" className={classes.userAvatar} />
                  <div className={classes.userDetail}>
                    <div className={classes.userName}>{userRating.user.name}</div>
                    <div className={classes.number}>{userRating.rating}</div>
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

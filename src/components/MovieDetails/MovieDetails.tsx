import Image from 'next/image';
import { ratingLabel } from '@/lib/ratings';
import type { MovieDetail } from '@/lib/types';
import Avatar from '../Avatar/Avatar';
import Backdrop from '../Backdrop/Backdrop';
import { CurrentMovie } from '../CurrentMovie/CurrentMovie';
import Container from '../Container/Container';
import Genres from './Genres/Genres';
import RatingSummary from './RatingSummary/RatingSummary';
import classes from './style.module.scss';

const MovieDetails = ({ movie }: { movie: MovieDetail }) => (
  <div className={`${classes.movieDetails} ${movie.backdropUrl ? '' : classes.hasNoBackdrop}`}>
    <CurrentMovie
      movie={{
        id: movie.id,
        title: movie.title,
        originalTitle: movie.originalTitle,
        year: movie.year,
        category: movie.category,
        posterUrl: movie.posterUrl,
        raterIds: movie.ratings.map(rating => rating.user.id),
      }}
    />
    <Backdrop backdrop={movie.backdropUrl} />
    <Container maxWidth="lg">
      <div className={classes.content}>
        <div className={classes.posterWrapper}>
          <div className={`${classes.poster} magic-border`}>
            {movie.posterUrl ? (
              <Image src={movie.posterUrl} alt="" fill sizes="200px" priority className={classes.posterImage} />
            ) : null}
          </div>
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
              <div
                className={`${classes.ratingWrapper} ${userRating.comment ? classes.hasComment : ''}`}
                key={userRating.id}
              >
                <div className={classes.userWrapper}>
                  <Avatar
                    name={userRating.user.name}
                    url={userRating.user.avatarUrl}
                    size={42}
                    className={classes.userAvatar}
                  />
                  <div className={classes.userDetail}>
                    <div className={classes.userName}>{userRating.user.name}</div>
                    <div className={classes.number}>{ratingLabel(userRating.rating)}</div>
                  </div>
                </div>
                {userRating.comment ? <p className={classes.comment}>{userRating.comment}</p> : null}
              </div>
            ))}
          </div>
        </section>
      </div>
    </Container>
  </div>
);

export default MovieDetails;

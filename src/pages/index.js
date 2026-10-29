import PropTypes from 'prop-types';
import Head from 'next/head';
import MovieList from '../components/MovieList';
import Backdrop from '../components/Backdrop';
import NewThread from '../components/NewThread';
import api from '../services/api';
import MovieListProvider from '../components/MovieList/MovieListContext';

const IndexPage = ({ movie }) => (
  <MovieListProvider>
    <div className="container">
      <Head>
        <title>Assiste Aí</title>
      </Head>
      <div className="backdrop-wrapper">
        {movie?.backdropUrl ? <Backdrop backdrop={movie.backdropUrl} colorless /> : null}
      </div>
      <div className="actions-wrapper">
        <NewThread />
      </div>
      <div className="movie-list-wrapper">
        <MovieList />
      </div>
    </div>
  </MovieListProvider>
);

IndexPage.propTypes = {
  movie: PropTypes.object,
};

IndexPage.defaultProps = {
  movie: null,
};

IndexPage.getInitialProps = async () => {
  try {
    const { data: movie } = await api.get('/movies/random');
    return { movie };
  } catch {
    // 404: no eligible movie; the page works without a backdrop
    return { movie: null };
  }
};

export default IndexPage;

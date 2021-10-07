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
        <Backdrop backdrop={movie.backdrop_path} colorless />
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
  movie: PropTypes.object.isRequired,
};

IndexPage.getInitialProps = async () => {
  const { data: { data: movie } } = await api.get('/movies/random');

  return {
    movie,
  };
};

export default IndexPage;

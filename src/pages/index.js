import PropTypes from 'prop-types';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { API_URL } from '../../config';
import MovieList from '../components/MovieList';
import Backdrop from '../components/Backdrop';
import NewThread from '../components/NewThread';
import Modal from '../components/Modal';
import MovieDetails from '../components/MovieDetails';

const IndexPage = ({ movie, movies }) => {
  const router = useRouter();

  return (
    <div className="container">
      <Head>
        <title>Assiste Aí</title>
      </Head>
      <div className="backdrop-wrapper">
        <Backdrop backdrop={movie.backdrop_path} colorless />
      </div>
      <div className="title-wrapper">
        <h1 className="page-title">Últimas avaliações</h1>
        <NewThread />
      </div>
      <div className="movie-list-wrapper">
        <MovieList firstMovies={movies} />
      </div>
      {/*<Modal
        isOpen={!!router.query?.movieId}
        onRequestClose={() => router.push(router.pathname, undefined, { shallow: true })}
        withBorder={false}
        zeroPadding
      >
        <MovieDetails movie={movie} isModal />
      </Modal>*/}
    </div>
  );
};

IndexPage.propTypes = {
  movie: PropTypes.object.isRequired,
  movies: PropTypes.array.isRequired,
};

export const getServerSideProps = async () => {
  // Fetch data from external API
  const res = await fetch(`${API_URL}/movies/random`);
  const { data: movie } = await res.json();

  const res2 = await fetch(`${API_URL}/movies`);
  const { data: movies } = await res2.json();

  return {
    props: {
      movie,
      movies,
    },
  };
};

export default IndexPage;

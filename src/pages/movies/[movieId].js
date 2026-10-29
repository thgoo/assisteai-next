import PropTypes from 'prop-types';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { API_URL } from '../../../config';
import MovieDetails from '../../components/MovieDetails';

export async function getStaticPaths() {
  const res = await fetch(`${API_URL}/movies`);
  const { data: movies } = await res.json();
  const paths = movies.map(movie => ({
    params: { movieId: `${movie.id}-${movie.slug}` },
  }));

  return { paths, fallback: true };
}

export async function getStaticProps({ params }) {
  const [id] = params.movieId.split('-', 2);
  const res = await fetch(`${API_URL}/movies/${id}`);
  if (res.status === 404) return { notFound: true, revalidate: 300 };
  if (!res.ok) throw new Error(`GET /movies/${id} failed with ${res.status}`);
  const movie = await res.json();

  return { props: { movie }, revalidate: 300 }; // revalidate after 5 minutes
}

const MoviePage = ({ movie }) => {
  const router = useRouter();

  if (router.isFallback) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Head>
        <title>Assiste Aí - {movie.originalTitle}</title>
      </Head>
      <MovieDetails movie={movie} />
    </>
  );
};

MoviePage.propTypes = {
  movie: PropTypes.object.isRequired,
};

export default MoviePage;

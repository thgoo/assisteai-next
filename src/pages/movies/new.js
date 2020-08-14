import Head from 'next/head';
import protectRoute from '../../contexts/protect-route';

const NewMoviePage = () => (
  <div className="container">
    <Head>
      <title>Assiste Aí</title>
    </Head>
    <p>Nova indicação</p>
  </div>
);

export default protectRoute(NewMoviePage);

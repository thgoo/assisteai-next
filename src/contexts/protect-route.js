import { useEffect } from 'react';
import { useRouter } from 'next/dist/client/router';
import useAuth from '../components/Auth/AuthProvider';

export default function protectRoute(Component) {
  return () => {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!user && !loading) router.push('/');
    }, [router, loading, user]);

    if (loading || !user) return null;

    return <Component />;
  };
}

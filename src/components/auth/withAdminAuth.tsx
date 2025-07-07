import React from 'react';
import { useRouter } from 'next/router';
import { useContext, ComponentType, useEffect } from 'react';
import AuthContext from '../../context/AuthContext';


const withAdminAuth = <P extends object>(Page: ComponentType<P>) => {
  const Wrapper = (props: P) => {
    const { user, loading } = useContext(AuthContext);
    const router = useRouter();

    useEffect(() => {
      if (!loading && (!user || user.role !== 'admin')) {
        router.replace('/'); // Redirect non-admins to the homepage
      }
    }, [user, loading, router]);

    if (loading || !user || user.role !== 'admin') {
      return React.createElement('div', null, 'Loading...'); 
    }

    return React.createElement(Page, props);
  };

  return Wrapper;
};

export default withAdminAuth;
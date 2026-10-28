import React, { createContext, useContext, useEffect, useState } from 'react';

interface RouterContextType {
  path: string;
  navigate: (to: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const RouterContext = createContext<RouterContextType>({
  path: '/',
  navigate: () => {},
  searchQuery: '',
  setSearchQuery: () => {},
});

export const normalizePath = (rawPath: string): string => {
  if (!rawPath || rawPath === '/') return '/';
  // Strip trailing slashes, e.g. "/admin/" -> "/admin"
  const clean = rawPath.replace(/\/+$/, '');
  return clean || '/';
};

export const useRouter = () => useContext(RouterContext);

export const RouterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [path, setPath] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return normalizePath(window.location.pathname || '/');
    }
    return '/';
  });

  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    const handlePopState = () => {
      setPath(normalizePath(window.location.pathname || '/'));
      window.scrollTo(0, 0);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (to: string) => {
    if (typeof window !== 'undefined') {
      // Check if navigating to hash on current page
      if ((to.startsWith('/#') || to.startsWith('#')) && path === '/') {
        const id = to.replace('/#', '').replace('#', '');
        const elem = document.getElementById(id);
        if (elem) {
          elem.scrollIntoView({ behavior: 'smooth' });
          return;
        }
      }

      const pathWithoutHash = to.split('#')[0] || '/';
      const normalized = normalizePath(pathWithoutHash);

      window.history.pushState(null, '', to);
      setPath(normalized);
      window.scrollTo(0, 0);

      // If hash exists on the new path
      if (to.includes('#')) {
        const hashId = to.split('#')[1];
        setTimeout(() => {
          const elem = document.getElementById(hashId);
          if (elem) {
            elem.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
      }
    }
  };

  return (
    <RouterContext.Provider value={{ path, navigate, searchQuery, setSearchQuery }}>
      {children}
    </RouterContext.Provider>
  );
};

import React from 'react';
import { Navigate } from 'react-router-dom';

const routeMap = {
  '/': '/home-logged',
  '/generate-image': '/Generate-image-logged-in',
  '/remove-bg': '/RemoveBG-logged-in',
  '/login': '/home-logged',
  '/signup': '/home-logged',
  '/register': '/home-logged'
};

export const NonAuthRoute = ({ children }) => {
  const accessToken = localStorage.getItem('accessToken');
  const currentPath = window.location.pathname;
  
  if (accessToken) {
    const redirectPath = routeMap[currentPath] || '/home-logged';
    return <Navigate to={redirectPath} replace />;
  }

  return children;
}; 
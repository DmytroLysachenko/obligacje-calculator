'use client';

import React, { ReactNode } from 'react';

interface PageTransitionProps {
  children: ReactNode;
}

export const PageTransition: React.FC<PageTransitionProps> = ({ children }) => {
  return <div>{children}</div>;
};

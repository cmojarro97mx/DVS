import React from 'react';

export const PercentageIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 7.5l9 9" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.563 16.5a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M18.938 7.5a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
  </svg>
);

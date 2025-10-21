import React from 'react';

// This is a more complex version that is not currently in use
export const ChevronUpDownIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 20 20"
    fill="currentColor"
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      d="M10 3a.75.75 0 01.75.75v10.5a.75.75 0 01-1.5 0V3.75A.75.75 0 0110 3zM5.22 6.22a.75.75 0 011.06 0l3.25 3.25 3.25-3.25a.75.75 0 111.06 1.06l-3.75 3.75a.75.75 0 01-1.06 0L5.22 7.28a.75.75 0 010-1.06z"
      clipRule="evenodd"
    />
     <path
      fillRule="evenodd"
      d="M10 17a.75.75 0 01-.75-.75V5.75a.75.75 0 011.5 0v10.5A.75.75 0 0110 17zM14.78 13.78a.75.75 0 01-1.06 0l-3.25-3.25-3.25 3.25a.75.75 0 11-1.06-1.06l3.75-3.75a.75.75 0 011.06 0l3.75 3.75a.75.75 0 010 1.06z"
      clipRule="evenodd"
    />
  </svg>
);

// Simplified version in use
export const ChevronUpDownIconSimple = ({ className }: { className?: string }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9"
    />
  </svg>
);
import React from 'react';

export const NotesIcon = ({ className }: { className?: string }) => (
    <svg 
        className={className}
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
    >
        <path d="M8 6h8c1.1 0 2 .9 2 2v8c0 1.1-.9 2-2 2H8c-1.1 0-2-.9-2-2V8c0-1.1.9-2 2-2z"></path>
        <path d="M16 4h2a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2"></path>
    </svg>
);

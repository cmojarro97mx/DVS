import React from 'react';

export const LogoIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 185 40"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Nexxio Logo"
  >
    <title>Nexxio</title>
    {/* N */}
    <path d="M0 40 L0 0 L10 0 L25 25 L25 0 L35 0 L35 40 L25 40 L10 15 L10 40 L0 40 Z" />
    
    {/* E */}
    <path d="M45 40 L45 0 L65 0 L65 8 L53 8 L53 16 L63 16 L63 24 L53 24 L53 32 L65 32 L65 40 L45 40 Z" />
    
    {/* X */}
    <path d="M75 0 L85 13.33 L75 26.66 V0 Z M95 40 L85 26.66 L95 13.33 V40 Z" />
    
    {/* X */}
    <path d="M105 0 L115 13.33 L105 26.66 V0 Z M125 40 L115 26.66 L125 13.33 V40 Z" />
    
    {/* I */}
    <path d="M135 40 L135 0 L145 0 L145 40 L135 40 Z" />
    
    {/* O */}
    <path fillRule="evenodd" clipRule="evenodd" d="M165 40 C155.335 40 147.5 31.0457 147.5 20 C147.5 8.9543 155.335 0 165 0 C174.665 0 182.5 8.9543 182.5 20 C182.5 31.0457 174.665 40 165 40 Z M165 32 C170.247 32 174.5 26.6421 174.5 20 C174.5 13.3579 170.247 8 165 8 C159.753 8 155.5 13.3579 155.5 20 C155.5 26.6421 159.753 32 165 32 Z" />
  </svg>
);

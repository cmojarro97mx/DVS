import React from 'react';

interface EmailAvatarProps {
  name: string;
}

const colors = [
  'bg-red-200 text-red-800',
  'bg-yellow-200 text-yellow-800',
  'bg-green-200 text-green-800',
  'bg-blue-200 text-blue-800',
  'bg-indigo-200 text-indigo-800',
  'bg-purple-200 text-purple-800',
  'bg-pink-200 text-pink-800',
  'bg-orange-200 text-orange-800',
];

const getColorForString = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash % colors.length);
  return colors[index];
};

export const EmailAvatar: React.FC<EmailAvatarProps> = ({ name }) => {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || name[0]?.toUpperCase() || 'U';

  const colorClass = getColorForString(name);

  return (
    <div
      className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${colorClass}`}
      title={name}
    >
      {initials}
    </div>
  );
};
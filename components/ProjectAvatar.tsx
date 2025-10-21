import React from 'react';

interface ProjectAvatarProps {
  projectName: string;
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

// Simple hash function to get a consistent color for a given string
const getColorForString = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash % colors.length);
  return colors[index];
};

export const ProjectAvatar: React.FC<ProjectAvatarProps> = ({ projectName }) => {
  const initials = (projectName
    .split(' ')
    .slice(0, 2)
    .map(word => word[0])
    .join('') || projectName.substring(0, 2)
  ).toUpperCase();
  
  const colorClass = getColorForString(projectName);

  return (
    <div
      className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${colorClass}`}
      title={projectName}
    >
      {initials}
    </div>
  );
};
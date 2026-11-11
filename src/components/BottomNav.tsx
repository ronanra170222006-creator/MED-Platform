import React from 'react';
import { Crown, Home, User, Users } from 'lucide-react';

const NAV_ITEMS = [
  { path: '/home', label: 'Accueil', icon: Home },
  { path: '/plan', label: 'Plan', icon: Crown },
  { path: '/team', label: 'Équipe', icon: Users },
  { path: '/member', label: 'Profil', icon: User },
];

export function BottomNav({
  navigate,
  currentPath,
}: {
  navigate: (path: string) => void;
  currentPath: string;
}) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-emerald-100 shadow-lg z-40">
      <div className="max-w-md mx-auto flex items-center justify-around px-2 py-2">
        {NAV_ITEMS.map((item) => {
          const isActive =
            currentPath === item.path ||
            (item.path === '/home' && currentPath === '/');
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'text-med-deep'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Icon
                className={`w-6 h-6 transition-transform duration-200 ${
                  isActive ? 'scale-110' : ''
                }`}
                strokeWidth={isActive ? 2.2 : 1.8}
              />
              <span
                className={`text-[10px] font-semibold whitespace-nowrap ${
                  isActive ? 'text-med-deep' : 'text-gray-400'
                }`}
              >
                {item.label}
              </span>
              {isActive && (
                <div className="w-1.5 h-1.5 rounded-full bg-med-emerald -mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

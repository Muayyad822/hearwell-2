import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import {
  HomeIcon,
  ChatBubbleBottomCenterTextIcon,
  SpeakerWaveIcon,
  MusicalNoteIcon,
  AcademicCapIcon,
  BookOpenIcon,
  Cog6ToothIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Home', href: '/', icon: HomeIcon },
  { name: 'Speech to Text', href: '/speech-to-text', icon: ChatBubbleBottomCenterTextIcon },
  { name: 'Sound Amplifier', href: '/sound-amplifier', icon: SpeakerWaveIcon },
  { name: 'Tinnitus Relief', href: '/tinnitus-relief', icon: MusicalNoteIcon },
  { name: 'Training', href: '/training', icon: AcademicCapIcon },
  { name: 'Education', href: '/education', icon: BookOpenIcon },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
];

function Navigation() {
  const location = useLocation();
  const { darkMode } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Handle scroll behavior
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setShowLabels(currentScrollY <= lastScrollY || currentScrollY < 50);
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Mobile menu
  const MobileMenu = () => (
    <div className={`
      fixed inset-0 bg-gray-900/80 backdrop-blur-sm z-40
      transition-opacity duration-300
      ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
    `}>
      <div className={`
        fixed inset-y-0 right-0 w-64 bg-white dark:bg-gray-800
        transform transition-transform duration-300
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        <div className="flex justify-end p-4">
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <div className="flex flex-col space-y-1 p-4">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setIsOpen(false)}
                className={`
                  flex items-center px-4 py-3 rounded-lg
                  ${isActive
                    ? 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-500'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }
                `}
              >
                <item.icon className="h-6 w-6 mr-3" />
                <span className="text-sm font-medium">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile menu overlay */}
      <MobileMenu />

      {/* Bottom navigation bar */}
      <nav className={`
        fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-lg z-30
        transform transition-transform duration-300
        ${showLabels ? 'translate-y-0' : 'translate-y-12'}
      `}>
        <div className="max-w-7xl mx-auto px-4">
          {/* Mobile bottom bar */}
          <div className="md:hidden flex justify-between items-center">
            {navigation.slice(0, 4).map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex flex-col items-center py-2 ${
                    isActive
                      ? 'text-primary-600 dark:text-primary-500'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  <item.icon className="h-6 w-6" />
                  {showLabels && (
                    <span className="text-xs mt-1">{item.name}</span>
                  )}
                </Link>
              );
            })}
            <button
              onClick={() => setIsOpen(true)}
              className="flex flex-col items-center py-2 text-gray-600 dark:text-gray-400"
            >
              <Bars3Icon className="h-6 w-6" />
              {showLabels && <span className="text-xs mt-1">More</span>}
            </button>
          </div>

          {/* Desktop navigation */}
          <div className="hidden md:flex justify-around">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex flex-col items-center p-2 ${
                    isActive
                      ? 'text-primary-600 dark:text-primary-500'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  <item.icon className="h-6 w-6" />
                  <span className="text-xs mt-1">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
}

export default Navigation;


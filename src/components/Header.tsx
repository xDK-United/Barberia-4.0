import { Scissors, Calendar, Moon, Sun } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface HeaderProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function Header({ currentPage, onNavigate }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="bg-gray-900/95 border-b border-yellow-600/20 shadow-lg sticky top-0 z-50 transition-colors backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
          >
            <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 p-2 rounded-lg">
              <Scissors className="w-6 h-6 text-gray-900" />
            </div>
            <div className="text-left hidden sm:block">
              <h1 className="text-xl font-bold text-white">Onzy Barber</h1>
              <p className="text-xs text-gray-400">Sistema de Agendamento</p>
            </div>
          </button>

          <nav className="flex items-center space-x-2 sm:space-x-4">
            <button
              onClick={() => onNavigate('home')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentPage === 'home'
                  ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50'
                  : 'text-gray-400 hover:text-yellow-400 hover:bg-yellow-500/10'
              }`}
            >
              Início
            </button>

            <button
              onClick={() => onNavigate('services')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentPage === 'services'
                  ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50'
                  : 'text-gray-400 hover:text-yellow-400 hover:bg-yellow-500/10'
              }`}
            >
              Serviços
            </button>

            <button
              onClick={() => onNavigate('booking')}
              className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-gray-900 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 transition-all transform hover:scale-105"
            >
              <Calendar className="w-4 h-4" />
              <span>Agendar</span>
            </button>

            <button
              onClick={toggleTheme}
              className="text-gray-400 hover:text-yellow-400 hover:bg-yellow-500/10 p-2 rounded-lg transition-colors"
              title="Alternar tema"
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}

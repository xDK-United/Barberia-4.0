import { Clock, Calendar, Star, Scissors } from 'lucide-react';

interface HomePageProps {
  onNavigate: (page: string) => void;
}

export function HomePage({ onNavigate }: HomePageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        <div className="text-center mb-16">
          <div className="inline-block bg-gradient-to-br from-yellow-500 to-yellow-600 p-6 rounded-full mb-6 shadow-2xl">
            <Scissors className="w-16 h-16 text-gray-900" />
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
            Onzy Barber
          </h1>

          <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto mb-8 leading-relaxed px-4">
            Agende seu horário de forma rápida e prática. Escolha o serviço, data e horário que melhor se adequa à sua rotina.
          </p>

          <button
            onClick={() => onNavigate('booking')}
            className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-gray-900 px-8 py-4 rounded-lg text-lg font-semibold flex items-center space-x-3 mx-auto shadow-xl hover:shadow-2xl transition-all transform hover:scale-105"
          >
            <Calendar className="w-6 h-6" />
            <span>Agendar Agora</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          <div className="bg-gray-800/50 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all border border-yellow-600/30 hover:border-yellow-500/50">
            <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 w-16 h-16 rounded-full flex items-center justify-center mb-6 mx-auto">
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-4 text-center">
              Rápido e Fácil
            </h3>
            <p className="text-gray-300 text-center leading-relaxed">
              Agende em poucos cliques. Escolha o serviço, data e horário disponível.
            </p>
          </div>

          <div className="bg-gray-800/50 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all border border-yellow-600/30 hover:border-yellow-500/50">
            <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 w-16 h-16 rounded-full flex items-center justify-center mb-6 mx-auto">
              <Calendar className="w-8 h-8 text-yellow-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-4 text-center">
              Horários Flexíveis
            </h3>
            <p className="text-gray-300 text-center leading-relaxed">
              Diversos horários disponíveis para se adequar à sua agenda.
            </p>
          </div>

          <div className="bg-gray-800/50 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all border border-yellow-600/30 hover:border-yellow-500/50">
            <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 w-16 h-16 rounded-full flex items-center justify-center mb-6 mx-auto">
              <Star className="w-8 h-8 text-yellow-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-4 text-center">
              Qualidade Garantida
            </h3>
            <p className="text-gray-300 text-center leading-relaxed">
              Profissionais experientes e serviços de alta qualidade.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

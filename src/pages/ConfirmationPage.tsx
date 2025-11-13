import { CheckCircle, Calendar, Clock, User, Phone, Scissors, Home } from 'lucide-react';
import { Service } from '../types';

interface ConfirmationPageProps {
  onNavigate: (page: string) => void;
  bookingDetails: {
    service: Service;
    date: string;
    time: string;
    customerName: string;
    customerWhatsapp: string;
  };
}

export function ConfirmationPage({ onNavigate, bookingDetails }: ConfirmationPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 border border-yellow-600/30">
          <div className="text-center mb-8">
            <div className="inline-block bg-gradient-to-br from-yellow-500 to-yellow-600 p-4 rounded-full mb-4">
              <CheckCircle className="w-16 h-16 text-gray-900" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Agendamento Confirmado!
            </h1>
            <p className="text-gray-300 text-lg">
              Aguarde a confirmação do barbeiro
            </p>
          </div>

          <div className="space-y-4 mb-8">
            <div className="flex items-start space-x-4 p-4 bg-gray-700/50 rounded-lg border border-yellow-600/20">
              <Scissors className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-1" />
              <div>
                <p className="text-sm text-gray-400">Serviço</p>
                <p className="text-lg font-semibold text-white">
                  {bookingDetails.service.name}
                </p>
                <p className="text-sm text-gray-400">
                  {bookingDetails.service.duration_minutes} minutos • R$ {bookingDetails.service.price.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-4 bg-gray-700/50 rounded-lg border border-yellow-600/20">
              <Calendar className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-1" />
              <div>
                <p className="text-sm text-gray-400">Data</p>
                <p className="text-lg font-semibold text-white">
                  {bookingDetails.date}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-4 bg-gray-700/50 rounded-lg border border-yellow-600/20">
              <Clock className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-1" />
              <div>
                <p className="text-sm text-gray-400">Horário</p>
                <p className="text-lg font-semibold text-white">
                  {bookingDetails.time}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-4 bg-gray-700/50 rounded-lg border border-yellow-600/20">
              <User className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-1" />
              <div>
                <p className="text-sm text-gray-400">Cliente</p>
                <p className="text-lg font-semibold text-white">
                  {bookingDetails.customerName}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-4 bg-gray-700/50 rounded-lg border border-yellow-600/20">
              <Phone className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-1" />
              <div>
                <p className="text-sm text-gray-400">WhatsApp</p>
                <p className="text-lg font-semibold text-white">
                  {bookingDetails.customerWhatsapp}
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-yellow-600/20 pt-6">
            <p className="text-center text-sm text-gray-400 mb-6">
              Guarde essas informações. Chegue com 5 minutos de antecedência.
            </p>

            <div className="space-y-3">
              <button
                onClick={() => onNavigate('home')}
                className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-gray-900 px-6 py-3 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-all"
              >
                <Home className="w-5 h-5" />
                <span>Voltar para Início</span>
              </button>

              <button
                onClick={() => onNavigate('booking')}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors border border-yellow-600/20"
              >
                Fazer Outro Agendamento
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

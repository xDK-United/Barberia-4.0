import { useState, useEffect } from 'react';
import { Calendar, Clock, User, Phone, ArrowLeft, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Service, BusinessSettings, Appointment } from '../types';
import { formatDate, formatDateForDB, generateTimeSlots, isDateUnavailable, isTimeSlotAvailable } from '../utils/dateUtils';

interface BookingPageProps {
  onNavigate: (page: string, data?: any) => void;
  selectedServiceId?: string;
}

export function BookingPage({ onNavigate, selectedServiceId }: BookingPageProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerWhatsapp, setCustomerWhatsapp] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedServiceId && services.length > 0) {
      const service = services.find(s => s.id === selectedServiceId);
      if (service) {
        setSelectedService(service);
        setStep(2);
      }
    }
  }, [selectedServiceId, services]);

  async function loadInitialData() {
    try {
      const [servicesRes, settingsRes, appointmentsRes] = await Promise.all([
        supabase.from('services').select('*').eq('active', true).order('price'),
        supabase.from('business_settings').select('*').limit(1).single(),
        supabase.from('appointments').select('*').gte('appointment_date', formatDateForDB(new Date()))
      ]);

      if (servicesRes.data) setServices(servicesRes.data);
      if (settingsRes.data) setSettings(settingsRes.data);
      if (appointmentsRes.data) setAppointments(appointmentsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  function getDaysInMonth(date: Date): Date[] {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: Date[] = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(new Date(year, month, -startingDayOfWeek + i + 1));
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  }

  function isToday(date: Date): boolean {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  function isSameDay(date1: Date, date2: Date): boolean {
    return date1.toDateString() === date2.toDateString();
  }

  function getAvailableTimeSlots(): string[] {
    if (!settings || !selectedService || !selectedDate) return [];

    const slots = generateTimeSlots(
      settings.work_start_time.slice(0, 5),
      settings.work_end_time.slice(0, 5),
      settings.slot_interval_minutes,
      selectedService.duration_minutes
    );

    return slots.filter(slot => isTimeSlotAvailable(selectedDate, slot, appointments));
  }

  async function handleSubmit() {
    if (!selectedService || !selectedDate || !selectedTime || !customerName || !customerWhatsapp) {
      alert('Por favor, preencha todos os campos');
      return;
    }

    if (customerWhatsapp.replace(/\D/g, '').length < 10) {
      alert('Por favor, insira um número de WhatsApp válido');
      return;
    }

    setSubmitting(true);

    try {
      const dateStr = formatDateForDB(selectedDate);

      const { data: existing, error: checkError } = await supabase
        .from('appointments')
        .select('id')
        .eq('appointment_date', dateStr)
        .eq('appointment_time', selectedTime)
        .in('status', ['pending', 'confirmed'])
        .limit(1);

      if (checkError) throw checkError;

      if (existing && existing.length > 0) {
        alert('Este horário não está mais disponível. Por favor, escolha outro.');
        await loadInitialData();
        setSelectedTime(null);
        return;
      }

      const { data, error } = await supabase
        .from('appointments')
        .insert({
          service_id: selectedService.id,
          customer_name: customerName,
          customer_whatsapp: customerWhatsapp,
          appointment_date: dateStr,
          appointment_time: selectedTime,
          service_price: selectedService.price,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      onNavigate('confirmation', {
        service: selectedService,
        date: formatDate(selectedDate),
        time: selectedTime,
        customerName,
        customerWhatsapp
      });
    } catch (error) {
      console.error('Error creating appointment:', error);
      alert('Erro ao criar agendamento. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
          <p className="mt-4 text-gray-400">Carregando...</p>
        </div>
      </div>
    );
  }

  const timeSlots = getAvailableTimeSlots();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black py-12">
      <div className="max-w-4xl mx-auto px-4">
        <button
          onClick={() => step === 1 ? onNavigate('services') : setStep(step - 1)}
          className="flex items-center space-x-2 text-gray-400 hover:text-yellow-400 mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Voltar</span>
        </button>

        <div className="bg-gray-800/50 rounded-2xl shadow-2xl p-8 border border-yellow-600/30">
          <h1 className="text-3xl font-bold text-white text-center mb-8">
            Agendar Horário
          </h1>

          <div className="flex items-center justify-center space-x-4 mb-8">
            <div className={`flex items-center space-x-2 ${step >= 1 ? 'text-yellow-500' : 'text-gray-500'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-gradient-to-br from-yellow-500 to-yellow-600 text-gray-900' : 'bg-gray-600 text-gray-400'}`}>
                {step > 1 ? <Check className="w-5 h-5" /> : '1'}
              </div>
              <span className="text-sm font-medium hidden sm:inline">Serviço</span>
            </div>
            <div className="h-px w-12 bg-gray-600"></div>
            <div className={`flex items-center space-x-2 ${step >= 2 ? 'text-yellow-500' : 'text-gray-500'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-gradient-to-br from-yellow-500 to-yellow-600 text-gray-900' : 'bg-gray-600 text-gray-400'}`}>
                {step > 2 ? <Check className="w-5 h-5" /> : '2'}
              </div>
              <span className="text-sm font-medium hidden sm:inline">Data/Hora</span>
            </div>
            <div className="h-px w-12 bg-gray-600"></div>
            <div className={`flex items-center space-x-2 ${step >= 3 ? 'text-yellow-500' : 'text-gray-500'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-gradient-to-br from-yellow-500 to-yellow-600 text-gray-900' : 'bg-gray-600 text-gray-400'}`}>
                3
              </div>
              <span className="text-sm font-medium hidden sm:inline">Dados</span>
            </div>
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-white mb-4">
                Escolha o Serviço
              </h2>
              {services.map(service => (
                <button
                  key={service.id}
                  onClick={() => {
                    setSelectedService(service);
                    setStep(2);
                  }}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    selectedService?.id === service.id
                      ? 'border-yellow-500 bg-yellow-500/10'
                      : 'border-yellow-600/20 hover:border-yellow-500/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-white">{service.name}</h3>
                      <p className="text-sm text-gray-400">{service.description}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {service.duration_minutes} minutos
                      </p>
                    </div>
                    <span className="text-xl font-bold text-yellow-400">
                      R$ {service.price.toFixed(2)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                Escolha Data e Horário
              </h2>

              <div className="bg-gray-700/30 p-4 rounded-lg mb-6 border border-yellow-600/20">
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                    className="p-2 hover:bg-gray-600/50 rounded-lg transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-300" />
                  </button>
                  <h3 className="text-lg font-semibold text-white">
                    {currentMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                  </h3>
                  <button
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                    className="p-2 hover:bg-gray-600/50 rounded-lg transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-300" />
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                    <div key={day} className="text-center text-sm font-medium text-gray-400 py-2">
                      {day}
                    </div>
                  ))}
                  {getDaysInMonth(currentMonth).map((date, index) => {
                    const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
                    const unavailable = !settings || isDateUnavailable(
                      date,
                      settings.weekday_off,
                      settings.specific_days_off
                    );
                    const selected = selectedDate && isSameDay(date, selectedDate);

                    return (
                      <button
                        key={index}
                        onClick={() => {
                          if (isCurrentMonth && !unavailable) {
                            setSelectedDate(date);
                            setSelectedTime(null);
                          }
                        }}
                        disabled={!isCurrentMonth || unavailable}
                        className={`aspect-square rounded-lg text-sm font-medium transition-all ${
                          !isCurrentMonth
                            ? 'text-gray-700 cursor-not-allowed'
                            : unavailable
                            ? 'bg-red-900/30 text-red-400 cursor-not-allowed'
                            : selected
                            ? 'bg-gradient-to-br from-yellow-500 to-yellow-600 text-gray-900 font-bold'
                            : isToday(date)
                            ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                            : 'hover:bg-gray-600/30 text-gray-300 hover:text-white'
                        }`}
                      >
                        {date.getDate()}
                      </button>
                    );
                  })}
                </div>
              </div>

              {selectedDate && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">
                    Horários Disponíveis para {formatDate(selectedDate)}
                  </h3>
                  {timeSlots.length > 0 ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                      {timeSlots.map(slot => (
                        <button
                          key={slot}
                          onClick={() => {
                            setSelectedTime(slot);
                            setStep(3);
                          }}
                          className={`py-3 px-4 rounded-lg font-medium transition-all ${
                            selectedTime === slot
                              ? 'bg-gradient-to-br from-yellow-500 to-yellow-600 text-gray-900 font-bold'
                              : 'bg-gray-700/50 text-gray-300 hover:bg-yellow-500/20 hover:text-yellow-300 border border-yellow-600/20'
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-400 py-8">
                      Nenhum horário disponível para esta data
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                Seus Dados
              </h2>

              <div className="bg-yellow-500/10 p-4 rounded-lg mb-6 border border-yellow-600/30">
                <h3 className="font-semibold text-yellow-400 mb-2">Resumo do Agendamento</h3>
                <div className="text-sm text-gray-300 space-y-1">
                  <p><strong className="text-white">Serviço:</strong> {selectedService?.name}</p>
                  <p><strong className="text-white">Data:</strong> {selectedDate && formatDate(selectedDate)}</p>
                  <p><strong className="text-white">Horário:</strong> {selectedTime}</p>
                  <p><strong className="text-white">Valor:</strong> <span className="text-yellow-400">R$ {selectedService?.price.toFixed(2)}</span></p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <User className="w-4 h-4 inline mr-2" />
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-yellow-600/20 bg-gray-700/50 text-white placeholder-gray-500 focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                    placeholder="Digite seu nome completo"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <Phone className="w-4 h-4 inline mr-2" />
                    WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={customerWhatsapp}
                    onChange={(e) => setCustomerWhatsapp(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-yellow-600/20 bg-gray-700/50 text-white placeholder-gray-500 focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                    placeholder="(11) 98765-4321"
                  />
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting || !customerName || !customerWhatsapp}
                className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 disabled:from-gray-600 disabled:to-gray-700 text-gray-900 disabled:text-gray-400 px-6 py-4 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-all"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900"></div>
                    <span>Confirmando...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    <span>Confirmar Agendamento</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Calendar, Clock, User, Phone, RefreshCw, Settings, LogOut, Filter, Scissors, MessageCircle, Send, Trash2, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Appointment, PendingMessage } from '../types';
import { PasswordProtection } from '../components/PasswordProtection';
import { formatPhoneNumber, generateWhatsAppLink } from '../utils/whatsappUtils';

interface AdminPageProps {
  onNavigate: (page: string) => void;
}

export function AdminPage({ onNavigate }: AdminPageProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [pendingMessages, setPendingMessages] = useState<PendingMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'cancelled'>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'appointments' | 'messages'>('appointments');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingMessageText, setEditingMessageText] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      loadAppointments();
      loadPendingMessages();

      const interval = setInterval(() => {
        loadAppointments();
        loadPendingMessages();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, filter]);

  async function loadAppointments() {
    try {
      let query = supabase
        .from('appointments')
        .select(`
          *,
          service:services(*)
        `)
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadPendingMessages() {
    try {
      const { data, error } = await supabase
        .from('mensagens_pendentes')
        .select(`
          *,
          appointment:agendamento_id(*)
        `)
        .eq('enviado', false)
        .order('data_criacao', { ascending: false });

      if (error) throw error;
      setPendingMessages(data || []);
    } catch (error) {
      console.error('Error loading pending messages:', error);
    }
  }

  async function updateAppointmentStatus(id: string, status: 'confirmed' | 'cancelled') {
    setUpdatingId(id);
    try {
      const { error: updateError } = await supabase
        .from('appointments')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (updateError) throw updateError;

      let messageText = '';
      if (status === 'confirmed') {
        messageText = 'Seu horário foi confirmado! 🎉';
      } else {
        messageText = 'Seu horário foi cancelado pelo barbeiro. Entre em contato para remarcar.';
      }

      const { error: messageError } = await supabase
        .from('mensagens_pendentes')
        .insert({
          agendamento_id: id,
          tipo: status === 'confirmed' ? 'confirmacao' : 'cancelamento',
          mensagem: messageText,
          enviado: false,
          data_criacao: new Date().toISOString()
        });

      if (messageError) throw messageError;

      await loadAppointments();
      await loadPendingMessages();

      const statusLabel = status === 'confirmed' ? 'confirmado' : 'cancelado';
      setFeedback({ type: 'success', message: `Agendamento ${statusLabel} com sucesso! Mensagem adicionada à fila.` });
      setTimeout(() => setFeedback(null), 3000);
    } catch (error) {
      console.error('Error updating appointment:', error);
      setFeedback({ type: 'error', message: 'Erro ao atualizar agendamento. Tente novamente.' });
      setTimeout(() => setFeedback(null), 3000);
    } finally {
      setUpdatingId(null);
    }
  }

  async function markMessageAsSent(messageId: string) {
    try {
      const { error } = await supabase
        .from('mensagens_pendentes')
        .update({ enviado: true })
        .eq('id', messageId);

      if (error) throw error;
      await loadPendingMessages();
      setFeedback({ type: 'success', message: 'Mensagem marcada como enviada!' });
      setTimeout(() => setFeedback(null), 3000);
    } catch (error) {
      console.error('Error marking message as sent:', error);
      setFeedback({ type: 'error', message: 'Erro ao marcar mensagem como enviada.' });
      setTimeout(() => setFeedback(null), 3000);
    }
  }

  async function deleteMessage(messageId: string) {
    try {
      const { error } = await supabase
        .from('mensagens_pendentes')
        .delete()
        .eq('id', messageId);

      if (error) throw error;
      await loadPendingMessages();
      setFeedback({ type: 'success', message: 'Mensagem removida!' });
      setTimeout(() => setFeedback(null), 3000);
    } catch (error) {
      console.error('Error deleting message:', error);
      setFeedback({ type: 'error', message: 'Erro ao remover mensagem.' });
      setTimeout(() => setFeedback(null), 3000);
    }
  }

  async function updateMessageText(messageId: string, newText: string) {
    try {
      const { error } = await supabase
        .from('mensagens_pendentes')
        .update({ mensagem: newText })
        .eq('id', messageId);

      if (error) throw error;
      await loadPendingMessages();
      setEditingMessageId(null);
      setEditingMessageText('');
      setFeedback({ type: 'success', message: 'Mensagem atualizada!' });
      setTimeout(() => setFeedback(null), 3000);
    } catch (error) {
      console.error('Error updating message:', error);
      setFeedback({ type: 'error', message: 'Erro ao atualizar mensagem.' });
      setTimeout(() => setFeedback(null), 3000);
    }
  }

  function handleLogout() {
    sessionStorage.removeItem('admin_authenticated');
    setIsAuthenticated(false);
  }

  if (!isAuthenticated) {
    return <PasswordProtection onAuthenticated={() => setIsAuthenticated(true)} />;
  }

  const statusColors = {
    pending: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400',
    confirmed: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400',
    cancelled: 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
  };

  const statusLabels = {
    pending: 'Pendente',
    confirmed: 'Confirmado',
    cancelled: 'Cancelado'
  };

  const filteredAppointments = appointments;
  const stats = {
    total: appointments.length,
    pending: appointments.filter(a => a.status === 'pending').length,
    confirmed: appointments.filter(a => a.status === 'confirmed').length,
    cancelled: appointments.filter(a => a.status === 'cancelled').length
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 py-12">
      {feedback && (
        <div className={`fixed top-4 right-4 px-4 py-3 rounded-lg text-white font-medium z-50 ${
          feedback.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        }`}>
          {feedback.message}
        </div>
      )}
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Painel Administrativo
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Gerencie agendamentos e configurações
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={loadAppointments}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors"
              title="Atualizar"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Atualizar</span>
            </button>

            <button
              onClick={() => onNavigate('settings')}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Settings className="w-5 h-5" />
              <span className="hidden sm:inline">Configurações</span>
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              title="Sair"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Confirmados</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.confirmed}</p>
              </div>
              <Calendar className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Cancelados</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.cancelled}</p>
              </div>
              <Calendar className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <div className="flex items-center space-x-2 border-b border-gray-200 dark:border-gray-700 w-full sm:w-auto">
              <button
                onClick={() => setActiveTab('appointments')}
                className={`px-4 py-3 font-medium transition-colors border-b-2 ${
                  activeTab === 'appointments'
                    ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400'
                    : 'text-gray-600 dark:text-gray-400 border-transparent hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Agendamentos
              </button>
              <button
                onClick={() => setActiveTab('messages')}
                className={`px-4 py-3 font-medium transition-colors border-b-2 flex items-center space-x-2 ${
                  activeTab === 'messages'
                    ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400'
                    : 'text-gray-600 dark:text-gray-400 border-transparent hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <MessageCircle className="w-4 h-4" />
                <span>Mensagens</span>
                {pendingMessages.length > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {pendingMessages.length}
                  </span>
                )}
              </button>
            </div>

            {activeTab === 'appointments' && (
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as any)}
                  className="px-3 py-2 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todos</option>
                  <option value="pending">Pendentes</option>
                  <option value="confirmed">Confirmados</option>
                  <option value="cancelled">Cancelados</option>
                </select>
              </div>
            )}
          </div>

          {activeTab === 'appointments' ? (
            <>
              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  <p className="mt-4 text-gray-600 dark:text-gray-400">Carregando agendamentos...</p>
                </div>
              ) : filteredAppointments.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">Nenhum agendamento encontrado</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredAppointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                                <Scissors className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                  {appointment.service?.name || 'Serviço'}
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  R$ {appointment.service?.price.toFixed(2)} • {appointment.service?.duration_minutes} min
                                </p>
                              </div>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[appointment.status]}`}>
                              {statusLabels[appointment.status]}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                            <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                              <User className="w-4 h-4" />
                              <span>{appointment.customer_name}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                              <Phone className="w-4 h-4" />
                              <span>{formatPhoneNumber(appointment.customer_whatsapp)}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                              <Calendar className="w-4 h-4" />
                              <span>{new Date(appointment.appointment_date).toLocaleDateString('pt-BR')}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                              <Clock className="w-4 h-4" />
                              <span>{appointment.appointment_time.slice(0, 5)}</span>
                            </div>
                          </div>
                        </div>

                        {appointment.status === 'pending' && (
                          <div className="flex flex-row lg:flex-col gap-2">
                            <button
                              onClick={() => updateAppointmentStatus(appointment.id, 'confirmed')}
                              disabled={updatingId !== null}
                              className="flex-1 lg:flex-none px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed"
                            >
                              {updatingId === appointment.id ? 'Processando...' : 'Confirmar'}
                            </button>
                            <button
                              onClick={() => updateAppointmentStatus(appointment.id, 'cancelled')}
                              disabled={updatingId !== null}
                              className="flex-1 lg:flex-none px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed"
                            >
                              {updatingId === appointment.id ? 'Processando...' : 'Cancelar'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              {pendingMessages.length === 0 ? (
                <div className="text-center py-12">
                  <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">Nenhuma mensagem pendente</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingMessages.map((message) => {
                    const appointment = message.appointment as any;
                    const isEditing = editingMessageId === message.id;

                    return (
                      <div
                        key={message.id}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                          <div className="flex-1 space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center space-x-2 mb-2">
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    message.tipo === 'confirmacao'
                                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                      : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                  }`}>
                                    {message.tipo === 'confirmacao' ? 'Confirmação' : 'Cancelamento'}
                                  </span>
                                </div>
                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                  {appointment?.customer_name || 'Cliente'}
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                  {appointment?.service?.name || 'Serviço'}
                                </p>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
                              <div className="flex items-center space-x-2">
                                <Phone className="w-4 h-4" />
                                <span>{formatPhoneNumber(appointment?.customer_whatsapp || '')}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Calendar className="w-4 h-4" />
                                <span>{appointment?.appointment_date ? new Date(appointment.appointment_date).toLocaleDateString('pt-BR') : ''}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Clock className="w-4 h-4" />
                                <span>{appointment?.appointment_time?.slice(0, 5) || ''}</span>
                              </div>
                            </div>

                            <div className="mt-3 bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
                              {isEditing ? (
                                <textarea
                                  value={editingMessageText}
                                  onChange={(e) => setEditingMessageText(e.target.value)}
                                  className="w-full px-3 py-2 bg-white dark:bg-gray-600 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-500 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  rows={3}
                                />
                              ) : (
                                <p className="text-sm text-gray-700 dark:text-gray-300 break-words">{message.mensagem}</p>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-row lg:flex-col gap-2 justify-start lg:justify-end">
                            {isEditing ? (
                              <>
                                <button
                                  onClick={() => updateMessageText(message.id, editingMessageText)}
                                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center space-x-1"
                                >
                                  <Check className="w-4 h-4" />
                                  <span>Salvar</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingMessageId(null);
                                    setEditingMessageText('');
                                  }}
                                  className="px-3 py-2 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-900 dark:text-white rounded-lg text-sm font-medium transition-colors"
                                >
                                  Cancelar
                                </button>
                              </>
                            ) : (
                              <>
                                <a
                                  href={generateWhatsAppLink(appointment?.customer_whatsapp || '', message.mensagem)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center space-x-1 flex-1 lg:flex-none justify-center"
                                >
                                  <Send className="w-4 h-4" />
                                  <span>Enviar</span>
                                </a>
                                <button
                                  onClick={() => {
                                    setEditingMessageId(message.id);
                                    setEditingMessageText(message.mensagem);
                                  }}
                                  className="px-3 py-2 bg-gray-400 hover:bg-gray-500 dark:bg-gray-600 dark:hover:bg-gray-500 text-white rounded-lg text-sm font-medium transition-colors flex-1 lg:flex-none"
                                >
                                  Editar
                                </button>
                                <button
                                  onClick={() => markMessageAsSent(message.id)}
                                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center space-x-1 flex-1 lg:flex-none justify-center"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => deleteMessage(message.id)}
                                  className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center space-x-1 flex-1 lg:flex-none justify-center"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

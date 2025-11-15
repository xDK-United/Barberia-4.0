/*
  # Create Pending Messages Table

  1. New Tables
    - `mensagens_pendentes` - stores pending messages to be sent via WhatsApp

  2. Details for mensagens_pendentes
    - `id` (uuid, primary key)
    - `agendamento_id` (uuid, foreign key to appointments)
    - `tipo` (text: "confirmacao" or "cancelamento")
    - `mensagem` (text)
    - `enviado` (boolean, default false)
    - `data_criacao` (timestamptz)

  3. Security
    - Enable RLS on mensagens_pendentes table
    - Allow public SELECT, INSERT, UPDATE operations
    - Add indexes for efficient queries on appointment_id and enviado status

  4. Important Notes
    - Uses CASCADE delete to automatically remove messages when appointment is deleted
    - tipo field restricted to 'confirmacao' or 'cancelamento' values
    - enviado flag tracks if message has been sent by barber
*/

CREATE TABLE IF NOT EXISTS mensagens_pendentes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agendamento_id uuid NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('confirmacao', 'cancelamento')),
  mensagem text NOT NULL,
  enviado boolean DEFAULT false,
  data_criacao timestamptz DEFAULT now()
);

ALTER TABLE mensagens_pendentes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pending messages are publicly readable" ON mensagens_pendentes FOR SELECT USING (true);
CREATE POLICY "Public can insert pending messages" ON mensagens_pendentes FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update pending messages" ON mensagens_pendentes FOR UPDATE WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_mensagens_agendamento ON mensagens_pendentes(agendamento_id);
CREATE INDEX IF NOT EXISTS idx_mensagens_enviado ON mensagens_pendentes(enviado);
CREATE INDEX IF NOT EXISTS idx_mensagens_tipo ON mensagens_pendentes(tipo);

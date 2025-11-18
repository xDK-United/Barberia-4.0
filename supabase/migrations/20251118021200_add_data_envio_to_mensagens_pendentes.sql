/*
  # Add data_envio column to mensagens_pendentes

  1. Changes to mensagens_pendentes table
    - Add `data_envio` (timestamptz, nullable) column to track when message was sent
    - This field is populated when the barber sends the message via WhatsApp
    - Paired with the `enviado` flag for complete tracking

  2. Details
    - Column: data_envio (timestamptz, DEFAULT NULL)
    - Purpose: Track exact timestamp when message was sent and appointment was confirmed
    - Used alongside enviado flag to provide complete message history

  3. Security
    - No changes to RLS policies needed
    - Existing policies continue to apply

  4. Important Notes
    - Allows NULL values for messages not yet sent
    - Will be populated when markMessageAsSent or handleSendMessage is triggered
    - Enables audit trail of when confirmations were sent to customers
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mensagens_pendentes' AND column_name = 'data_envio'
  ) THEN
    ALTER TABLE mensagens_pendentes ADD COLUMN data_envio timestamptz DEFAULT NULL;
  END IF;
END $$;
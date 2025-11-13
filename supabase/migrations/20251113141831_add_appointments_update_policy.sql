/*
  # Add UPDATE Policy for Appointments

  1. Changes
    - Add policy to allow public UPDATE operations on appointments table
    - This enables status updates from 'pending' to 'confirmed' or 'cancelled'
  
  2. Security
    - Allows public update of appointment status (as required by admin interface)
    - Ensures data integrity through status validation in constraint
*/

CREATE POLICY "Public can update appointments" ON appointments FOR UPDATE WITH CHECK (true);
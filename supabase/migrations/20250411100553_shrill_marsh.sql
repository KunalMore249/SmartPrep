/*
  # Add slot tracking fields

  1. Changes
    - Add understanding_rating to study_slots
    - Add completed_topics array to study_slots
    - Add notifications_enabled to users

  2. Security
    - Maintain existing RLS policies
*/

ALTER TABLE study_slots
ADD COLUMN IF NOT EXISTS understanding_rating smallint,
ADD COLUMN IF NOT EXISTS completed_topics text[] DEFAULT '{}';

ALTER TABLE users
ADD COLUMN IF NOT EXISTS notifications_enabled boolean DEFAULT true;
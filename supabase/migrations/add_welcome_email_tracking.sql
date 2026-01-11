-- ===========================================
-- Welcome Email Tracking Migration
-- Adds columns to track when welcome emails were sent
-- to prevent duplicate emails during deployments
-- ===========================================

-- Add welcome_email_sent column to track if welcome email was sent
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS welcome_email_sent BOOLEAN DEFAULT FALSE;

-- Add welcome_email_sent_at column to track when welcome email was sent
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS welcome_email_sent_at TIMESTAMPTZ;

-- Create index for efficient querying of users who haven't received welcome email
CREATE INDEX IF NOT EXISTS idx_users_welcome_email_sent 
ON users(welcome_email_sent) 
WHERE welcome_email_sent = FALSE OR welcome_email_sent IS NULL;

-- Comment for documentation
COMMENT ON COLUMN users.welcome_email_sent IS 'Whether the user has received a welcome email';
COMMENT ON COLUMN users.welcome_email_sent_at IS 'Timestamp when the welcome email was sent';


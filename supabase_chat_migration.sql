-- ============================================
-- RENTCONNECT CHAT & NOTIFICATION TEMPLATES MIGRATION
-- ============================================
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. CHAT CONVERSATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS chat_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Participants
  participant_1_id UUID REFERENCES users(id) ON DELETE CASCADE,
  participant_2_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Related to (optional - could be about a lead or property)
  related_type TEXT CHECK (related_type IN ('lead', 'property', 'general')),
  related_id UUID,
  
  -- Last message preview
  last_message TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE,
  last_message_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Unread counts
  unread_count_1 INTEGER DEFAULT 0,  -- Unread for participant_1
  unread_count_2 INTEGER DEFAULT 0,  -- Unread for participant_2
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'blocked')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique conversation between two users
  UNIQUE(participant_1_id, participant_2_id)
);

-- Indexes for chat_conversations
CREATE INDEX IF NOT EXISTS idx_chat_conversations_participant_1 ON chat_conversations(participant_1_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_participant_2 ON chat_conversations(participant_2_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_updated ON chat_conversations(updated_at DESC);

-- ============================================
-- 2. CHAT MESSAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES chat_conversations(id) ON DELETE CASCADE,
  
  -- Sender
  sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Message content
  message TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
  
  -- Attachments (for images/files)
  attachments JSONB DEFAULT '[]'::jsonb,
  
  -- Read status
  read_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for chat_messages
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at DESC);

-- ============================================
-- 3. NOTIFICATION TEMPLATES TABLE (if not exists)
-- ============================================
CREATE TABLE IF NOT EXISTS notification_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Template Info
  name TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('new_lead', 'agent_contact', 'subscription_expiry', 'system', 'payment', 'verification_approved', 'verification_rejected', 'new_inquiry', 'support', 'welcome', 'password_reset')),
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  
  -- Variables (list of available variables like {{name}}, {{email}})
  variables JSONB DEFAULT '[]'::jsonb,
  
  -- Channels
  send_email BOOLEAN DEFAULT TRUE,
  send_push BOOLEAN DEFAULT TRUE,
  send_whatsapp BOOLEAN DEFAULT FALSE,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for notification_templates
CREATE INDEX IF NOT EXISTS idx_notification_templates_type ON notification_templates(type);
CREATE INDEX IF NOT EXISTS idx_notification_templates_active ON notification_templates(is_active);

-- ============================================
-- 4. INSERT DEFAULT NOTIFICATION TEMPLATES
-- ============================================
INSERT INTO notification_templates (name, type, subject, body, variables, send_email, send_push, send_whatsapp) VALUES
  ('Welcome Email', 'welcome', 'Welcome to RentConnect!', 'Hi {{name}},\n\nWelcome to RentConnect! We''re excited to have you on board.\n\nStart exploring properties or post your rental requirements today.\n\nBest regards,\nThe RentConnect Team', '["name", "email"]'::jsonb, TRUE, TRUE, FALSE),
  
  ('New Lead Alert', 'new_lead', 'New Rental Lead Available', 'Hi {{agent_name}},\n\nA new lead matching your criteria is available!\n\nLocation: {{location}}\nBudget: KSh {{budget}}\nProperty Type: {{property_type}}\n\nLog in to view details and contact the tenant.\n\nBest regards,\nRentConnect', '["agent_name", "location", "budget", "property_type"]'::jsonb, TRUE, TRUE, TRUE),
  
  ('Agent Contact', 'agent_contact', 'An Agent Has Contacted You', 'Hi {{tenant_name}},\n\n{{agent_name}} from {{agency_name}} has viewed your rental request and may contact you soon.\n\nYour Request: {{location}} - {{property_type}}\n\nBest regards,\nRentConnect', '["tenant_name", "agent_name", "agency_name", "location", "property_type"]'::jsonb, TRUE, TRUE, FALSE),
  
  ('Subscription Expiry', 'subscription_expiry', 'Your Subscription is Expiring Soon', 'Hi {{name}},\n\nYour {{plan_name}} subscription will expire on {{expiry_date}}.\n\nRenew now to continue enjoying unlimited access to leads.\n\nBest regards,\nRentConnect', '["name", "plan_name", "expiry_date"]'::jsonb, TRUE, TRUE, TRUE),
  
  ('Payment Confirmation', 'payment', 'Payment Received - Thank You!', 'Hi {{name}},\n\nWe''ve received your payment of KSh {{amount}} for {{purpose}}.\n\nTransaction ID: {{transaction_id}}\nDate: {{date}}\n\nThank you for your business!\n\nBest regards,\nRentConnect', '["name", "amount", "purpose", "transaction_id", "date"]'::jsonb, TRUE, TRUE, FALSE),
  
  ('Verification Approved', 'verification_approved', 'Your Account Has Been Verified!', 'Hi {{name}},\n\nCongratulations! Your agent account has been verified.\n\nYou can now access all premium features and contact unlimited leads.\n\nBest regards,\nRentConnect', '["name"]'::jsonb, TRUE, TRUE, TRUE),
  
  ('Verification Rejected', 'verification_rejected', 'Verification Update Required', 'Hi {{name}},\n\nUnfortunately, we couldn''t verify your account at this time.\n\nReason: {{reason}}\n\nPlease update your information and try again.\n\nBest regards,\nRentConnect', '["name", "reason"]'::jsonb, TRUE, TRUE, FALSE),
  
  ('New Inquiry', 'new_inquiry', 'New Property Inquiry', 'Hi {{agent_name}},\n\nYou have a new inquiry for your property: {{property_title}}\n\nFrom: {{inquirer_name}}\nMessage: {{message}}\n\nRespond quickly to secure the lead!\n\nBest regards,\nRentConnect', '["agent_name", "property_title", "inquirer_name", "message"]'::jsonb, TRUE, TRUE, TRUE),
  
  ('Support Ticket Update', 'support', 'Support Ticket Update', 'Hi {{name}},\n\nYour support ticket #{{ticket_id}} has been updated.\n\nStatus: {{status}}\n{{response}}\n\nBest regards,\nRentConnect Support', '["name", "ticket_id", "status", "response"]'::jsonb, TRUE, TRUE, FALSE)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 5. ENABLE RLS
-- ============================================
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Service role full access to chat_conversations" ON chat_conversations;
CREATE POLICY "Service role full access to chat_conversations" ON chat_conversations FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access to chat_messages" ON chat_messages;
CREATE POLICY "Service role full access to chat_messages" ON chat_messages FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access to notification_templates" ON notification_templates;
CREATE POLICY "Service role full access to notification_templates" ON notification_templates FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- 6. REALTIME SUBSCRIPTIONS
-- Enable realtime for chat tables
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_conversations;

-- ============================================
-- SUCCESS
-- ============================================
DO $$ 
BEGIN 
  RAISE NOTICE 'Chat and Notification Templates migration completed successfully!';
END $$;

-- =============================================
-- SUPPORT TICKETS SYSTEM
-- Created: 2026-01-08
-- =============================================

-- Support Tickets Table
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_type TEXT NOT NULL DEFAULT 'tenant', -- 'tenant' or 'agent'
    
    -- Ticket Details
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'general', -- 'technical', 'account', 'leads', 'payments', 'verification', 'general'
    priority TEXT NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
    status TEXT NOT NULL DEFAULT 'open', -- 'open', 'in_progress', 'pending', 'resolved', 'closed'
    
    -- Assignment
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT valid_category CHECK (category IN ('technical', 'account', 'leads', 'payments', 'verification', 'general')),
    CONSTRAINT valid_priority CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    CONSTRAINT valid_status CHECK (status IN ('open', 'in_progress', 'pending', 'resolved', 'closed')),
    CONSTRAINT valid_user_type CHECK (user_type IN ('tenant', 'agent'))
);

-- Ticket Replies Table
CREATE TABLE IF NOT EXISTS ticket_replies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Reply Content
    message TEXT NOT NULL,
    is_staff BOOLEAN DEFAULT FALSE, -- True if reply is from admin/support staff
    
    -- Attachments (optional, for future use)
    attachments JSONB DEFAULT '[]'::JSONB,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_category ON support_tickets(category);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON support_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON support_tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned_to ON support_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_ticket_replies_ticket_id ON ticket_replies(ticket_id);

-- Row Level Security (RLS)
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_replies ENABLE ROW LEVEL SECURITY;

-- Policies for support_tickets
-- Users can view their own tickets
CREATE POLICY "Users can view own tickets" ON support_tickets
    FOR SELECT USING (auth.uid() = user_id);

-- Admins can view all tickets
CREATE POLICY "Admins can view all tickets" ON support_tickets
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Users can create tickets
CREATE POLICY "Users can create tickets" ON support_tickets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own tickets (limited fields)
CREATE POLICY "Users can update own tickets" ON support_tickets
    FOR UPDATE USING (auth.uid() = user_id);

-- Admins can update any ticket
CREATE POLICY "Admins can update any ticket" ON support_tickets
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Policies for ticket_replies
-- Users can view replies on their tickets
CREATE POLICY "Users can view replies on own tickets" ON ticket_replies
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM support_tickets 
            WHERE support_tickets.id = ticket_replies.ticket_id 
            AND support_tickets.user_id = auth.uid()
        )
    );

-- Admins can view all replies
CREATE POLICY "Admins can view all replies" ON ticket_replies
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Users can create replies on their tickets
CREATE POLICY "Users can create replies on own tickets" ON ticket_replies
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM support_tickets 
            WHERE support_tickets.id = ticket_replies.ticket_id 
            AND (support_tickets.user_id = auth.uid() OR 
                 EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')))
        )
    );

-- Admins can create replies on any ticket
CREATE POLICY "Admins can create replies on any ticket" ON ticket_replies
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Function to update ticket updated_at timestamp
CREATE OR REPLACE FUNCTION update_ticket_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update timestamp
DROP TRIGGER IF EXISTS update_ticket_timestamp_trigger ON support_tickets;
CREATE TRIGGER update_ticket_timestamp_trigger
    BEFORE UPDATE ON support_tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_ticket_timestamp();

-- Function to update ticket when reply is added
CREATE OR REPLACE FUNCTION update_ticket_on_reply()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE support_tickets 
    SET updated_at = NOW()
    WHERE id = NEW.ticket_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for reply
DROP TRIGGER IF EXISTS update_ticket_on_reply_trigger ON ticket_replies;
CREATE TRIGGER update_ticket_on_reply_trigger
    AFTER INSERT ON ticket_replies
    FOR EACH ROW
    EXECUTE FUNCTION update_ticket_on_reply();

-- Grant permissions
GRANT ALL ON support_tickets TO authenticated;
GRANT ALL ON ticket_replies TO authenticated;
GRANT ALL ON support_tickets TO service_role;
GRANT ALL ON ticket_replies TO service_role;

COMMENT ON TABLE support_tickets IS 'Customer support tickets for tenants and agents';
COMMENT ON TABLE ticket_replies IS 'Replies/messages within a support ticket';

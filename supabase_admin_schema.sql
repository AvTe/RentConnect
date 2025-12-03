-- ============================================
-- Admin Management Schema for RentConnect
-- Tables: admin_users, admin_invites, admin_activity_logs, admin_permissions
-- ============================================

-- ============================================
-- ADMIN PERMISSIONS TABLE (Permission definitions)
-- ============================================
CREATE TABLE IF NOT EXISTS admin_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- e.g., 'users', 'content', 'finance', 'system'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default permissions
INSERT INTO admin_permissions (name, description, category) VALUES
  ('manage_users', 'Create, edit, and delete user accounts', 'users'),
  ('view_users', 'View user accounts and profiles', 'users'),
  ('manage_agents', 'Approve, reject, and manage agent accounts', 'users'),
  ('view_agents', 'View agent accounts and profiles', 'users'),
  ('manage_leads', 'Create, edit, and delete leads', 'content'),
  ('view_leads', 'View leads and rental requests', 'content'),
  ('manage_properties', 'Create, edit, and delete properties', 'content'),
  ('view_properties', 'View property listings', 'content'),
  ('manage_subscriptions', 'Create, edit, and cancel subscriptions', 'finance'),
  ('view_subscriptions', 'View subscription data', 'finance'),
  ('manage_payments', 'Process refunds and manage payments', 'finance'),
  ('view_payments', 'View payment history and reports', 'finance'),
  ('view_reports', 'Access analytics and reports', 'finance'),
  ('export_data', 'Export data to CSV/Excel', 'finance'),
  ('manage_content', 'Manage site content and announcements', 'content'),
  ('manage_settings', 'Change system settings and configuration', 'system'),
  ('view_audit_logs', 'View admin activity logs', 'system'),
  ('manage_admins', 'Create and manage admin accounts (Super Admin only)', 'system'),
  ('send_invites', 'Send admin invitations', 'system'),
  ('manage_support', 'Handle support tickets and inquiries', 'users')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- ADMIN USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Link to main users table when account is activated
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar TEXT,
  phone TEXT,
  
  -- Role hierarchy: super_admin > main_admin > sub_admin
  role TEXT NOT NULL DEFAULT 'sub_admin' CHECK (role IN ('super_admin', 'main_admin', 'sub_admin')),
  custom_role_name TEXT, -- Optional custom role name like "Finance Manager"
  
  -- Permissions stored as JSONB array of permission names
  permissions JSONB DEFAULT '[]'::jsonb,
  
  -- Team/parent assignment
  parent_admin_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  team_name TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'invited' CHECK (status IN ('active', 'invited', 'inactive', 'suspended')),
  
  -- Activity tracking
  last_login_at TIMESTAMP WITH TIME ZONE,
  last_activity_at TIMESTAMP WITH TIME ZONE,
  login_count INTEGER DEFAULT 0,
  
  -- Password (for admins who don't use OAuth)
  password_hash TEXT,
  password_set_at TIMESTAMP WITH TIME ZONE,
  force_password_change BOOLEAN DEFAULT FALSE,
  
  -- 2FA
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  two_factor_secret TEXT,
  
  -- Metadata
  created_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deactivated_at TIMESTAMP WITH TIME ZONE,
  deactivated_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  deactivation_reason TEXT
);

-- Indexes for admin_users
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);
CREATE INDEX IF NOT EXISTS idx_admin_users_status ON admin_users(status);
CREATE INDEX IF NOT EXISTS idx_admin_users_parent ON admin_users(parent_admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON admin_users(user_id);

-- ============================================
-- ADMIN INVITES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS admin_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  
  -- Invite token (secure random string)
  token TEXT UNIQUE NOT NULL,
  token_hash TEXT NOT NULL, -- Hashed for security
  
  -- Invite details
  invited_by UUID NOT NULL REFERENCES admin_users(id) ON DELETE SET NULL,
  invited_email TEXT NOT NULL,
  custom_message TEXT,
  
  -- Expiration
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  
  -- Tracking
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resent_count INTEGER DEFAULT 0,
  last_resent_at TIMESTAMP WITH TIME ZONE,
  accepted_at TIMESTAMP WITH TIME ZONE,
  revoked_at TIMESTAMP WITH TIME ZONE,
  revoked_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for admin_invites
CREATE INDEX IF NOT EXISTS idx_admin_invites_token ON admin_invites(token);
CREATE INDEX IF NOT EXISTS idx_admin_invites_admin_user ON admin_invites(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_invites_status ON admin_invites(status);
CREATE INDEX IF NOT EXISTS idx_admin_invites_expires ON admin_invites(expires_at);

-- ============================================
-- ADMIN ACTIVITY LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS admin_activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_user_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  admin_email TEXT NOT NULL, -- Store email in case admin is deleted
  
  -- Action details
  action TEXT NOT NULL, -- e.g., 'created_user', 'deleted_lead', 'changed_settings'
  action_category TEXT NOT NULL, -- e.g., 'users', 'content', 'settings', 'auth'
  description TEXT NOT NULL, -- Human-readable description
  
  -- Target of the action
  target_type TEXT, -- e.g., 'user', 'lead', 'property', 'admin', 'setting'
  target_id TEXT, -- ID of the affected resource
  target_name TEXT, -- Name/identifier for display
  
  -- Change details (before/after for updates)
  changes JSONB, -- { field: { old: value, new: value } }
  metadata JSONB, -- Additional context
  
  -- Request info
  ip_address TEXT,
  user_agent TEXT,
  
  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for admin_activity_logs
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_user ON admin_activity_logs(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_action ON admin_activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_logs_category ON admin_activity_logs(action_category);
CREATE INDEX IF NOT EXISTS idx_admin_logs_target ON admin_activity_logs(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created ON admin_activity_logs(created_at DESC);

-- ============================================
-- ADMIN SESSIONS TABLE (for session management/force logout)
-- ============================================
CREATE TABLE IF NOT EXISTS admin_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  
  -- Session info
  ip_address TEXT,
  user_agent TEXT,
  device_info JSONB,
  
  -- Validity
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Status
  is_valid BOOLEAN DEFAULT TRUE,
  revoked_at TIMESTAMP WITH TIME ZONE,
  revoked_by UUID REFERENCES admin_users(id) ON DELETE SET NULL
);

-- Indexes for admin_sessions
CREATE INDEX IF NOT EXISTS idx_admin_sessions_admin ON admin_sessions(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_valid ON admin_sessions(is_valid);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_permissions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to allow re-running this script)
DROP POLICY IF EXISTS "Service role full access to admin_users" ON admin_users;
DROP POLICY IF EXISTS "Service role full access to admin_invites" ON admin_invites;
DROP POLICY IF EXISTS "Service role full access to admin_activity_logs" ON admin_activity_logs;
DROP POLICY IF EXISTS "Service role full access to admin_sessions" ON admin_sessions;
DROP POLICY IF EXISTS "Anyone can read admin_permissions" ON admin_permissions;

-- Policies for admin_users (service role can do everything)
CREATE POLICY "Service role full access to admin_users" ON admin_users
  FOR ALL USING (true) WITH CHECK (true);

-- Policies for admin_invites
CREATE POLICY "Service role full access to admin_invites" ON admin_invites
  FOR ALL USING (true) WITH CHECK (true);

-- Policies for admin_activity_logs
CREATE POLICY "Service role full access to admin_activity_logs" ON admin_activity_logs
  FOR ALL USING (true) WITH CHECK (true);

-- Policies for admin_sessions
CREATE POLICY "Service role full access to admin_sessions" ON admin_sessions
  FOR ALL USING (true) WITH CHECK (true);

-- Policies for admin_permissions (read-only for everyone)
CREATE POLICY "Anyone can read admin_permissions" ON admin_permissions
  FOR SELECT USING (true);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to check if an admin has a specific permission
CREATE OR REPLACE FUNCTION admin_has_permission(admin_id UUID, permission_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  admin_role TEXT;
  admin_perms JSONB;
BEGIN
  SELECT role, permissions INTO admin_role, admin_perms
  FROM admin_users
  WHERE id = admin_id AND status = 'active';
  
  -- Super admin has all permissions
  IF admin_role = 'super_admin' THEN
    RETURN TRUE;
  END IF;
  
  -- Check if permission is in the permissions array
  RETURN admin_perms ? permission_name;
END;
$$ LANGUAGE plpgsql;

-- Function to update last_activity_at
CREATE OR REPLACE FUNCTION update_admin_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE admin_users 
  SET last_activity_at = NOW()
  WHERE id = NEW.admin_user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update activity on log entry
CREATE TRIGGER update_admin_activity_trigger
AFTER INSERT ON admin_activity_logs
FOR EACH ROW
EXECUTE FUNCTION update_admin_activity();

-- Function to auto-expire invites
CREATE OR REPLACE FUNCTION expire_old_invites()
RETURNS void AS $$
BEGIN
  UPDATE admin_invites
  SET status = 'expired'
  WHERE status = 'pending' AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- INITIAL SUPER ADMINS
-- These accounts will have full access to admin management
-- ============================================
INSERT INTO admin_users (email, name, role, status, permissions)
VALUES (
  'kartikamit171@gmail.com',
  'Kartik Amit',
  'super_admin',
  'active',
  '["manage_users", "view_users", "manage_agents", "view_agents", "manage_leads", "view_leads", "manage_properties", "view_properties", "manage_subscriptions", "view_subscriptions", "manage_payments", "view_payments", "view_reports", "export_data", "manage_content", "manage_settings", "view_audit_logs", "manage_admins", "send_invites", "manage_support"]'::jsonb
)
ON CONFLICT (email) DO UPDATE SET
  role = 'super_admin',
  status = 'active',
  permissions = '["manage_users", "view_users", "manage_agents", "view_agents", "manage_leads", "view_leads", "manage_properties", "view_properties", "manage_subscriptions", "view_subscriptions", "manage_payments", "view_payments", "view_reports", "export_data", "manage_content", "manage_settings", "view_audit_logs", "manage_admins", "send_invites", "manage_support"]'::jsonb;

INSERT INTO admin_users (email, name, role, status, permissions)
VALUES (
  'kuldeep.nagaria@gmail.com',
  'Kuldeep Nagaria',
  'super_admin',
  'active',
  '["manage_users", "view_users", "manage_agents", "view_agents", "manage_leads", "view_leads", "manage_properties", "view_properties", "manage_subscriptions", "view_subscriptions", "manage_payments", "view_payments", "view_reports", "export_data", "manage_content", "manage_settings", "view_audit_logs", "manage_admins", "send_invites", "manage_support"]'::jsonb
)
ON CONFLICT (email) DO UPDATE SET
  role = 'super_admin',
  status = 'active',
  permissions = '["manage_users", "view_users", "manage_agents", "view_agents", "manage_leads", "view_leads", "manage_properties", "view_properties", "manage_subscriptions", "view_subscriptions", "manage_payments", "view_payments", "view_reports", "export_data", "manage_content", "manage_settings", "view_audit_logs", "manage_admins", "send_invites", "manage_support"]'::jsonb;

-- Also update the users table to set role to super_admin for these emails
UPDATE users SET role = 'super_admin' WHERE email IN ('kartikamit171@gmail.com', 'kuldeep.nagaria@gmail.com');

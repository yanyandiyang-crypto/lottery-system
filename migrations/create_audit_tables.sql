-- Create login audit table
CREATE TABLE IF NOT EXISTS login_audit (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  username VARCHAR(255) NOT NULL,
  ip_address VARCHAR(45) NOT NULL,
  user_agent TEXT,
  login_success BOOLEAN DEFAULT false,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Create system audit log table
CREATE TABLE IF NOT EXISTS audit_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  action VARCHAR(255) NOT NULL,
  table_name VARCHAR(255),
  record_id VARCHAR(255),
  details JSONB,
  ip_address VARCHAR(45) NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Create security audit table for tracking security-related events
CREATE TABLE IF NOT EXISTS security_audit (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  event_type VARCHAR(50) NOT NULL,
  description TEXT,
  ip_address VARCHAR(45) NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Add indexes for better query performance
CREATE INDEX idx_login_audit_user_id ON login_audit(user_id);
CREATE INDEX idx_login_audit_created_at ON login_audit(created_at);
CREATE INDEX idx_login_audit_login_success ON login_audit(login_success);

CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);
CREATE INDEX idx_audit_log_table_name ON audit_log(table_name);

CREATE INDEX idx_security_audit_user_id ON security_audit(user_id);
CREATE INDEX idx_security_audit_created_at ON security_audit(created_at);
CREATE INDEX idx_security_audit_event_type ON security_audit(event_type);
-- Create database
CREATE DATABASE newbetting;

-- Connect to the database
\c newbetting;

-- Create user (optional, you can use your existing postgres user)
CREATE USER newbetting_user WITH PASSWORD 'newbetting123';
GRANT ALL PRIVILEGES ON DATABASE newbetting TO newbetting_user;

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO newbetting_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO newbetting_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO newbetting_user;





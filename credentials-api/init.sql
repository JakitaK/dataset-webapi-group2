-- Credentials API Database Schema
-- PostgreSQL initialization script

-- Drop tables if they exist (for clean setup)
DROP TABLE IF EXISTS Phone_Verification CASCADE;
DROP TABLE IF EXISTS Email_Verification CASCADE;
DROP TABLE IF EXISTS Account_Credential CASCADE;
DROP TABLE IF EXISTS Account CASCADE;

-- =====================================================
-- ACCOUNT TABLE
-- =====================================================
CREATE TABLE Account (
    Account_ID SERIAL PRIMARY KEY,
    FirstName VARCHAR(100) NOT NULL,
    LastName VARCHAR(100) NOT NULL,
    Username VARCHAR(50) UNIQUE NOT NULL,
    Email VARCHAR(255) UNIQUE NOT NULL,
    Phone VARCHAR(20) UNIQUE NOT NULL,
    Account_Role INTEGER NOT NULL DEFAULT 1,  -- 1=User, 2=Moderator, 3=Admin, 4=SuperAdmin, 5=Owner
    Email_Verified BOOLEAN NOT NULL DEFAULT FALSE,
    Phone_Verified BOOLEAN NOT NULL DEFAULT FALSE,
    Account_Status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, active, suspended, locked
    Created_At TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    Updated_At TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- ACCOUNT_CREDENTIAL TABLE
-- Separate table for security - password hashes not in main account table
-- =====================================================
CREATE TABLE Account_Credential (
    Credential_ID SERIAL PRIMARY KEY,
    Account_ID INTEGER NOT NULL UNIQUE,
    Salted_Hash VARCHAR(255) NOT NULL,
    Salt VARCHAR(255) NOT NULL,
    Created_At TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    Updated_At TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (Account_ID) REFERENCES Account(Account_ID) ON DELETE CASCADE
);

-- =====================================================
-- EMAIL_VERIFICATION TABLE
-- Stores email verification tokens
-- =====================================================
CREATE TABLE Email_Verification (
    Verification_ID SERIAL PRIMARY KEY,
    Account_ID INTEGER NOT NULL,
    Email VARCHAR(255) NOT NULL,
    Verification_Token VARCHAR(255) NOT NULL UNIQUE,
    Token_Expires TIMESTAMP NOT NULL,
    Created_At TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (Account_ID) REFERENCES Account(Account_ID) ON DELETE CASCADE
);

-- =====================================================
-- PHONE_VERIFICATION TABLE
-- Stores SMS verification codes
-- =====================================================
CREATE TABLE Phone_Verification (
    Verification_ID SERIAL PRIMARY KEY,
    Account_ID INTEGER NOT NULL,
    Phone VARCHAR(20) NOT NULL,
    Verification_Code VARCHAR(6) NOT NULL,
    Code_Expires TIMESTAMP NOT NULL,
    Attempts INTEGER NOT NULL DEFAULT 0,
    Created_At TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (Account_ID) REFERENCES Account(Account_ID) ON DELETE CASCADE
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX idx_account_email ON Account(Email);
CREATE INDEX idx_account_username ON Account(Username);
CREATE INDEX idx_account_phone ON Account(Phone);
CREATE INDEX idx_email_verification_token ON Email_Verification(Verification_Token);
CREATE INDEX idx_email_verification_account ON Email_Verification(Account_ID);
CREATE INDEX idx_phone_verification_account ON Phone_Verification(Account_ID);

-- =====================================================
-- SEED DATA (Optional - for testing)
-- =====================================================
-- Admin user (password: AdminPass123!)
-- Salt: e8f7c9a6b4d2e1f3
-- Hash generated from 'AdminPass123!' + salt using bcrypt
INSERT INTO Account (FirstName, LastName, Username, Email, Phone, Account_Role, Email_Verified, Phone_Verified, Account_Status)
VALUES ('Admin', 'User', 'admin', 'admin@example.com', '5555555555', 3, TRUE, TRUE, 'active');

-- Note: You'll need to generate the actual hash using bcrypt in your app
-- This is just a placeholder structure
-- INSERT INTO Account_Credential (Account_ID, Salted_Hash, Salt)
-- VALUES (1, 'bcrypt_hash_here', 'salt_here');

COMMIT;

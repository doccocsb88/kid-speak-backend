# KidSpeak Database Setup Guide

## Overview
This guide will help you set up Vercel Postgres database for the KidSpeak application.

## Prerequisites
- Vercel CLI installed (`npm install -g vercel`)
- Vercel account and project linked
- Node.js dependencies installed (`npm install`)

## Setup Steps

### 1. Create Vercel Postgres Database
```bash
# Login to Vercel (if not already logged in)
vercel login

# Link your project (if not already linked)
cd backend
vercel link --yes

# Create Postgres database
vercel postgres create kidspeak-db
```

### 2. Get Database Connection String
After creating the database, you'll get a connection string. Copy it and add to your environment variables.

### 3. Setup Environment Variables
Create a `.env` file in the backend directory:
```env
# Database Configuration
DATABASE_URL="postgres://username:password@host:port/database?sslmode=require"

# JWT Secret for authentication
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# Environment
NODE_ENV="development"

# Existing API keys
OPENAI_API_KEY="your-openai-api-key"
GEMINI_API_KEY="your-gemini-api-key"
```

### 4. Run Database Migration
```bash
# Run the migration to create tables
npm run migrate
```

### 5. Test Database Connection
```bash
# Test the database connection
npm run test-db
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run test-db` - Test database connection
- `npm run migrate` - Run database migration
- `npm run db:test` - Alias for test-db
- `npm run db:migrate` - Alias for migrate

## Database Schema

The database includes the following tables:

### Users Table
- `id` (UUID) - Primary key
- `email` (VARCHAR) - Unique email address
- `password_hash` (VARCHAR) - Hashed password
- `name` (VARCHAR) - User's name
- `age` (INTEGER) - User's age
- `language_preference` (VARCHAR) - Preferred language (default: 'vi')
- `avatar_url` (VARCHAR) - Profile picture URL
- `is_active` (BOOLEAN) - Account status
- `created_at` (TIMESTAMP) - Account creation time
- `updated_at` (TIMESTAMP) - Last update time

### Chat Sessions Table
- `id` (UUID) - Primary key
- `user_id` (UUID) - Foreign key to users table
- `topic` (VARCHAR) - Chat topic
- `difficulty_level` (VARCHAR) - Difficulty level (default: 'beginner')
- `session_status` (VARCHAR) - Session status (active, completed, abandoned)
- `created_at` (TIMESTAMP) - Session start time
- `ended_at` (TIMESTAMP) - Session end time
- `total_messages` (INTEGER) - Total messages in session
- `user_satisfaction` (INTEGER) - User satisfaction rating (1-5)

### Chat Messages Table
- `id` (UUID) - Primary key
- `session_id` (UUID) - Foreign key to chat_sessions table
- `role` (VARCHAR) - Message role (user, assistant, system)
- `content` (TEXT) - Message content
- `message_type` (VARCHAR) - Message type (text, audio, image)
- `audio_url` (VARCHAR) - Audio file URL
- `timestamp` (TIMESTAMP) - Message timestamp
- `is_corrected` (BOOLEAN) - Whether message was corrected
- `correction_feedback` (TEXT) - Correction feedback

### User Progress Table
- `id` (UUID) - Primary key
- `user_id` (UUID) - Foreign key to users table
- `topic` (VARCHAR) - Learning topic
- `level` (INTEGER) - Current level
- `score` (INTEGER) - Total score
- `total_sessions` (INTEGER) - Total sessions
- `completed_sessions` (INTEGER) - Completed sessions
- `last_activity` (TIMESTAMP) - Last activity time
- `created_at` (TIMESTAMP) - Record creation time
- `updated_at` (TIMESTAMP) - Last update time

### User Preferences Table
- `id` (UUID) - Primary key
- `user_id` (UUID) - Foreign key to users table
- `preferred_topics` (TEXT[]) - Array of preferred topics
- `difficulty_preference` (VARCHAR) - Preferred difficulty level
- `notification_settings` (JSONB) - Notification preferences
- `learning_goals` (TEXT) - Learning goals
- `created_at` (TIMESTAMP) - Record creation time
- `updated_at` (TIMESTAMP) - Last update time

## Health Check Endpoints

- `GET /api/health/health` - Basic health check
- `GET /api/health/db-info` - Database information and statistics

## Troubleshooting

### Connection Issues
1. Verify DATABASE_URL is correct
2. Check if database is accessible from your network
3. Ensure SSL settings are correct
4. Verify database credentials

### Migration Issues
1. Check if tables already exist
2. Verify database permissions
3. Check for syntax errors in schema.sql

### Performance Issues
1. Check connection pool settings
2. Monitor database performance
3. Consider adding indexes for frequently queried columns

## Next Steps

After successful setup:
1. Implement authentication routes
2. Add user registration and login
3. Integrate chat history storage
4. Add user progress tracking
5. Implement analytics and reporting

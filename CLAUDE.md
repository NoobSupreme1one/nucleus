# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `npm run dev` - Start development server (runs both client and server on port 5000)
- `npm run build` - Build for production (builds client with Vite and server with esbuild)
- `npm start` - Start production server
- `npm run check` - TypeScript type checking

### Database Operations
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema changes to database
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio for database management

## Architecture Overview

### Project Structure
This is a full-stack TypeScript application for co-founder matching and idea validation:

- **client/** - React frontend with Vite
- **server/** - Express.js backend API
- **shared/** - Shared types, schemas, and validation
- **prisma/** - Database schema and migrations

### Technology Stack
- **Frontend**: React 18 + TypeScript, Wouter for routing, TanStack Query, Tailwind CSS + shadcn/ui
- **Backend**: Express.js, TypeScript, Prisma ORM
- **Database**: PostgreSQL (with Drizzle schema in shared/schema.ts, Prisma schema in prisma/schema.prisma)
- **Authentication**: Dual auth system (Supabase for production, local in-memory for development)
- **AI Services**: Google Gemini for idea validation, Perplexity for analysis

### Key Features
1. **Idea Validation** - Users submit startup ideas for AI-powered validation and scoring
2. **Co-founder Matching** - Algorithm matches users based on roles, skills, and compatibility
3. **Real-time Messaging** - Match-based communication system
4. **Portfolio Submissions** - File upload system for showcasing work
5. **Leaderboard** - Ranking system based on idea validation scores

### Authentication Architecture
The app uses a flexible dual authentication system:
- **Production**: Supabase authentication (`server/supabaseAuth.ts`)
- **Development**: Local in-memory authentication (`server/localAuth.ts`)
- Automatically selects auth method based on environment variables
- Cookie-based session management with `memorystore`

### Database Schema
Uses both Drizzle and Prisma schemas (transitioning):
- **Users**: Profile data, roles (engineer/designer/marketer), subscription tiers
- **Ideas**: Startup ideas with validation scores and AI analysis reports
- **Submissions**: Portfolio submissions with file attachments
- **Matches**: User matching system with compatibility scores
- **Messages**: Match-based messaging

### API Structure
RESTful API with authentication middleware:
- `/api/ideas/*` - Idea validation and management
- `/api/submissions/*` - Portfolio submission management
- `/api/matches/*` - Matching system and compatibility
- `/api/leaderboard` - User rankings
- `/uploads/*` - Static file serving for attachments

### File Upload System
- Uses `multer` for file handling
- Supports images and documents (10MB limit)
- Files stored in `/uploads/` directory
- Served via Express static middleware

### Environment Configuration
- `NODE_ENV` determines auth system and build mode
- Database connection via `DATABASE_URL` 
- Optional Supabase configuration for production auth
- Gemini API key for AI validation services

### Deployment
- **Development**: Single server on port 5000 with Vite dev middleware
- **Production**: Built client served statically, API on same port
- **Vercel**: Configured for full-stack deployment with proper routing

### AI Integrations
- ** Use Gemini/Imagen for all AI text and image generation
- ** Only use perplexity api for performing research and analysis, and only use the "sonar" model..
- ** DO NOT USE OPENAI API
- ** DO NOT USE VERTEX AI
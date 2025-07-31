# FounderMatch - Co-Founder Matching Platform

## Overview

FounderMatch is a comprehensive platform that combines startup idea validation with skill-based founder matching. The application uses a proof-of-work approach where users validate their startup ideas through AI-powered analysis and then get matched with potential co-founders based on their demonstrated capabilities and portfolio submissions. The platform features a three-tier monetization model (freemium, pro, enterprise) and focuses on building a quality-first community of serious entrepreneurs.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React with TypeScript**: Modern React application using functional components and hooks
- **Wouter**: Lightweight routing library for client-side navigation
- **Shadcn/UI**: Component library built on Radix UI primitives for consistent design
- **Tailwind CSS**: Utility-first CSS framework for styling with custom color scheme
- **TanStack Query**: State management and data fetching with caching and synchronization
- **React Hook Form**: Form handling with Zod validation schemas
- **Vite**: Build tool and development server with hot module replacement

### Backend Architecture
- **Express.js**: Node.js web framework for API routes and middleware
- **TypeScript**: Type-safe server-side development
- **Session-based Authentication**: Using Replit's OpenID Connect authentication
- **RESTful API Design**: Structured endpoints for users, ideas, submissions, matches, and messages
- **Middleware Pattern**: Request logging, authentication checks, and error handling
- **File Upload Support**: Multer integration for portfolio submissions

### Data Storage Solutions
- **PostgreSQL**: Primary database using Neon serverless PostgreSQL
- **Drizzle ORM**: Type-safe database operations with schema definitions
- **Session Storage**: PostgreSQL-based session store for authentication persistence
- **File Storage**: Local file system for uploaded portfolio assets

### Authentication & Authorization
- **Replit Auth Integration**: OpenID Connect authentication flow
- **Session Management**: Secure session handling with PostgreSQL storage
- **Role-based Access**: User roles (engineer, designer, marketer) for specialized matching
- **Protected Routes**: Authentication middleware for API endpoint security

### Key Features & Business Logic
- **AI-Powered Idea Validation**: OpenAI integration for startup idea analysis and scoring
- **Matching Algorithm**: Skill-based matching system with compatibility scoring
- **Portfolio System**: File upload and portfolio management for proof-of-work
- **Leaderboard**: Ranking system based on idea validation scores
- **Real-time Messaging**: Match-based communication system
- **Swipe Interface**: Tinder-like UI for co-founder discovery

## External Dependencies

### Third-party Services
- **OpenAI API**: GPT-4 integration for idea validation and analysis
- **Neon Database**: Serverless PostgreSQL hosting
- **Replit Authentication**: OpenID Connect identity provider

### Key Libraries & Frameworks
- **Database**: Drizzle ORM, @neondatabase/serverless, connect-pg-simple
- **UI Components**: Radix UI primitives, Lucide React icons
- **Form Management**: React Hook Form, Hookform resolvers, Zod validation
- **State Management**: TanStack React Query for server state
- **Styling**: Tailwind CSS, class-variance-authority, clsx
- **File Handling**: Multer for multipart form uploads
- **Development**: Vite, TypeScript, ESBuild for production builds

### API Integrations
- **OpenAI**: Startup idea validation and market analysis
- **Session Management**: PostgreSQL-based session persistence
- **File Upload**: Local storage with validation and size limits
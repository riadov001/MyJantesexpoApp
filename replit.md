# Overview

MyJantes is a mobile-first web application for an automotive service business specializing in wheels (jantes) and tires. The application provides a complete service booking and quote management system for customers, with a dark-themed iOS-inspired user interface. The system handles user authentication, service browsing, appointment booking, quote requests with photo uploads, and history tracking of quotes and invoices.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The client-side is built using React with TypeScript, employing a component-based architecture with modern React patterns. The application uses Wouter for client-side routing and TanStack Query for state management and API interactions. The UI is implemented with shadcn/ui components built on top of Radix UI primitives, providing a consistent design system with dark theme support.

The application is designed as a mobile-first Progressive Web App (PWA) with a service worker for offline capabilities and app-like behavior. The layout mimics iOS design patterns with bottom navigation and card-based interfaces.

## Backend Architecture
The server uses Express.js with TypeScript in ESM module format. The architecture follows a RESTful API design with clean separation of concerns through dedicated route handlers and storage abstraction. Authentication is implemented using JWT tokens with bcrypt for password hashing.

The backend currently uses an in-memory storage implementation but is designed with an interface pattern to allow easy migration to a database. The storage layer provides abstractions for users, services, bookings, quotes, and invoices.

## Data Storage Solutions
The application is configured to use PostgreSQL with Drizzle ORM for database operations. The schema defines tables for users, services, bookings, quotes, and invoices with proper relationships and constraints. Drizzle provides type-safe database operations and migration management.

The current implementation includes a memory storage fallback for development, making the application immediately runnable without database setup.

## Authentication and Authorization
Authentication uses JWT tokens with 24-hour expiration for session management. Passwords are hashed using bcrypt before storage. The frontend stores tokens in localStorage and includes them in API requests via Authorization headers.

The system includes middleware for token verification on protected routes, ensuring secure access to user-specific data and operations.

## Design and Styling
The UI uses Tailwind CSS with a custom design system featuring CSS variables for theming. The design implements a dark theme with red accent colors, custom iOS-inspired border radius values, and carefully crafted spacing and typography scales.

Components use class-variance-authority for variant management and the cn utility function combines clsx and tailwind-merge for conditional styling.

# External Dependencies

## Database and ORM
- **Neon Database**: Serverless PostgreSQL database service configured via DATABASE_URL
- **Drizzle ORM**: Type-safe database toolkit with PostgreSQL dialect support
- **Drizzle Kit**: Migration and schema management tools

## UI and Styling
- **Radix UI**: Comprehensive component library providing accessible primitives
- **Tailwind CSS**: Utility-first CSS framework with custom configuration
- **shadcn/ui**: Pre-built component system combining Radix UI and Tailwind CSS
- **Lucide React**: Icon library for consistent iconography

## Development and Build Tools
- **Vite**: Fast build tool and development server with React plugin support
- **TypeScript**: Type system for enhanced development experience
- **ESBuild**: Fast bundler for production builds
- **PostCSS**: CSS processing with Tailwind CSS and Autoprefixer plugins

## Runtime and Utilities
- **TanStack React Query**: Server state management and data fetching
- **React Hook Form**: Form state management with Zod validation
- **Wouter**: Lightweight client-side routing library
- **date-fns**: Date manipulation and formatting utilities
- **nanoid**: Unique ID generation for various application needs

## Security and Authentication
- **bcrypt**: Password hashing for secure user authentication
- **jsonwebtoken**: JWT token generation and verification for session management

## Development Environment
- **Replit**: Development environment with specific plugins for error handling and debugging
- **tsx**: TypeScript execution for development server
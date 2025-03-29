# Quiz App

A modern, interactive quiz application. Create, edit, and take quizzes with support for multiple-choice questions, code snippets, and images.

## Features

- **Create and manage quizzes** with an intuitive interface
- **Password protection** for restricting quiz access
- **Multiple question types** including:
  - Single-choice questions
  - Multiple-choice questions
  - Questions with code snippets
  - Questions with images
- **Image optimization** with automatic compression for better performance
- **Responsive design** that works on desktop and mobile devices
- **Cloud storage** with Supabase backend (with local fallback)

## Tech Stack

- **Frontend**:
  - React 19
  - TypeScript
  - Vite (for fast development and optimized builds)
  - React Router (for navigation)
  - Zustand (for state management)
  - Tailwind CSS (for styling)
  - Radix UI (for accessible UI components)

- **Backend & Storage**:
  - Supabase (for backend-as-a-service)

- **Other Tools**:
  - React Hook Form (for form management)
  - Zod (for schema validation)
  - Lucide React (for icons)
  - browser-image-compression (for optimizing uploaded images)

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- pnpm, npm, or yarn

### Environment Setup

Create a `.env` file in the root directory with the following variables:

```shell
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

### Supabase Setup

1. Create a new Supabase project
2. Create a table called `quizzes` with the following structure:
   - id (uuid, primary key)
   - title (text)
   - password (text, nullable)
   - questions (json)
3. Enable storage for quiz images

## Usage

### Creating a Quiz

1. Click "Create Quiz" on the home page
2. Add a title and optional password
3. Add questions by clicking "Add Question"
4. For each question:
   - Enter question text
   - Toggle "Allow multiple answers" if needed
   - Optionally add a code snippet or image
   - Add options and mark correct answers
5. Click "Save Quiz" when finished

### Taking a Quiz

1. Click on a quiz from the home page
2. Enter the password if required
3. Answer all questions
4. Click "Submit Quiz" to see your results

### Editing a Quiz

1. Find the quiz on the home page
2. Click the "Edit" button
3. Make your changes
4. Save the updated quiz

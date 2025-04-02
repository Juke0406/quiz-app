# Quiz App

A modern, interactive quiz application for creating, editing, and taking quizzes with various question formats.

## Features

- **Create and manage quizzes** with an intuitive interface
- **Access control** for restricting quiz availability
- **Multiple question types** including:
  - Single-choice questions
  - Multiple-choice questions
  - Questions with code snippets
  - Questions with images
- **Image optimization** for better performance
- **Responsive design** that works on desktop and mobile devices
- **Data persistence** with cloud storage capabilities

## Tech Stack

- **Frontend**: Modern React-based application using TypeScript
- **UI**: Component-based design with responsive styling
- **State Management**: Efficient state handling for complex interactions

## Getting Started

### Prerequisites

- Node.js (recent LTS version)
- Package manager (pnpm, npm, or yarn)

### Environment Setup

The application requires environment variables for connecting to backend services. Contact the project administrator for setup details.

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

## Usage

### Creating a Quiz

1. Click "Create Quiz" on the home page
2. Add a title and optional access restrictions
3. Add questions by clicking "Add Question"
4. For each question:
   - Enter question text
   - Configure answer settings as needed
   - Optionally add supporting content
   - Add options and mark correct answers
5. Click "Save Quiz" when finished

### Taking a Quiz

1. Click on a quiz from the home page
2. Enter access credentials if required
3. Answer all questions
4. Submit your answers to see results

### Editing a Quiz

1. Find the quiz on the home page
2. Click the "Edit" button
3. Make your changes
4. Save the updated quiz

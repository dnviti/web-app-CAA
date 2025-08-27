# Web App CAA - React Frontend

This is a modern React + TypeScript frontend conversion of the original vanilla JavaScript CAA (Comunicazione Aumentativa Alternativa - Augmentative and Alternative Communication) application.

## 🚀 Overview

The application has been completely rewritten from the original monolithic JavaScript file (`script-original.js`) into a modern, maintainable React application with the following improvements:

- **Modern Architecture**: Component-based React with TypeScript
- **State Management**: Zustand for predictable state management
- **UI Components**: Reusable, accessible components with Tailwind CSS
- **API Layer**: Structured API client with error handling
- **Type Safety**: Full TypeScript coverage
- **Performance**: Code splitting, lazy loading, and optimizations
- **PWA Ready**: Service worker and offline capabilities
- **Mobile First**: Responsive design with touch-friendly interface

## 🛠 Technology Stack

- **Frontend**: React 18, TypeScript
- **State Management**: Zustand with persistence
- **Styling**: Tailwind CSS with custom design system
- **HTTP Client**: Axios with interceptors
- **Forms**: React Hook Form with validation
- **Drag & Drop**: React DnD
- **Icons**: Lucide React
- **Build Tool**: Vite
- **Package Manager**: npm/yarn

## 📋 Features Implemented

### ✅ Core Features
- [x] **Authentication System**: JWT-based login/register with secure token handling
- [x] **Routing**: Protected routes with automatic redirects
- [x] **Error Handling**: Global error boundary and toast notifications
- [x] **State Management**: Persistent stores for auth and app state
- [x] **API Integration**: Structured API client for backend communication
- [x] **Responsive Design**: Mobile-first approach with touch targets
- [x] **Accessibility**: ARIA labels, keyboard navigation, screen reader support

### 🚧 In Progress
- [ ] **Symbol Grid**: Interactive grid with drag & drop functionality
- [ ] **Text Composition**: Symbol-to-text communication bar
- [ ] **Speech Synthesis**: Text-to-speech with Italian language support
- [ ] **AI Integration**: Sentence correction and verb conjugation
- [ ] **Camera Integration**: Custom symbol creation via camera
- [ ] **ARASAAC Integration**: Icon search and selection
- [ ] **Tense Management**: Verb conjugation based on context
- [ ] **Category Navigation**: Nested folder structure for symbols
- [ ] **Editor Mode**: Advanced editing with password protection
- [ ] **Settings Management**: User preferences and customization

## 🏗 Project Structure

```
frontend/
├── src/
│   ├── api/            # API layer and HTTP client
│   │   ├── client.ts   # Axios configuration and interceptors
│   │   ├── auth.ts     # Authentication endpoints
│   │   ├── grid.ts     # Grid/symbol management endpoints
│   │   └── ai.ts       # AI service endpoints
│   ├── components/     # Reusable UI components
│   │   ├── ui/         # Basic UI components (Button, Modal, etc.)
│   │   └── ...         # Feature-specific components
│   ├── pages/          # Route-level page components
│   │   ├── LoginPage.tsx
│   │   ├── MainPage.tsx
│   │   └── ...
│   ├── stores/         # Zustand state management
│   │   ├── authStore.ts    # Authentication state
│   │   └── appStore.ts     # Application state
│   ├── types/          # TypeScript type definitions
│   │   └── index.ts    # All application types
│   ├── App.tsx         # Main application component
│   └── main.tsx        # Application entry point
├── public/             # Static assets
├── package.json        # Dependencies and scripts
├── tailwind.config.js  # Tailwind CSS configuration
├── tsconfig.json       # TypeScript configuration
└── vite.config.ts      # Vite build configuration
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Go backend server running on port 3000

### Installation

1. **Clone the repository** (if not already done):
   ```bash
   cd /home/daniele/Documents/Repos/web-app-CAA/frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

5. **Open your browser**:
   ```
   http://localhost:5173
   ```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript compiler check

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_BASE_URL=http://localhost:3000
VITE_APP_TITLE=Web App CAA
```

### API Endpoints

The frontend expects the following backend endpoints:

- `POST /api/auth/login` - User authentication
- `POST /api/auth/register` - User registration
- `GET /api/auth/verify` - Token verification
- `GET /api/grid` - Get user's symbol grid
- `POST /api/grid` - Save symbol grid
- `POST /api/correct` - AI sentence correction
- `POST /api/conjugate` - AI verb conjugation

## 🎨 Design System

The application uses a custom design system built with Tailwind CSS:

### Colors
- **Primary**: Blue palette for main actions
- **Secondary**: Green palette for success states
- **Accent**: Yellow/orange for highlights
- **Error**: Red palette for errors
- **Gray**: Neutral colors for UI elements

### Typography
- **Font**: Inter font family for modern readability
- **Sizes**: Responsive typography scale
- **Weights**: 300-700 for various use cases

### Components
All components follow consistent patterns:
- Accessible by default (ARIA labels, keyboard navigation)
- Touch-friendly (minimum 44px touch targets)
- Responsive design
- Consistent spacing and visual hierarchy

## 🧪 Testing

```bash
npm run test        # Run tests
npm run test:watch  # Run tests in watch mode
npm run test:ui     # Run tests with UI
```

## 📱 PWA Features

The application is configured as a Progressive Web App:

- **Offline Support**: Service worker for offline functionality
- **App-like Experience**: Can be installed on devices
- **Fast Loading**: Optimized bundle sizes and caching
- **Responsive**: Works on all device sizes

## 🔒 Security Features

- **JWT Token Management**: Automatic token refresh and secure storage
- **HTTPS Ready**: Production configuration for secure connections
- **Input Validation**: Client-side and server-side validation
- **XSS Protection**: Sanitized user inputs
- **CSRF Protection**: Token-based request validation

## 🚀 Deployment

### Production Build

```bash
npm run build
```

The build folder will contain optimized production files.

### Docker Deployment

A Dockerfile is included for containerized deployment:

```bash
docker build -t web-app-caa-frontend .
docker run -p 5173:5173 web-app-caa-frontend
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 Migration Notes

### From Original JavaScript

The original `script-original.js` file (1446+ lines) has been converted into:

- **13 TypeScript modules** with clear separation of concerns
- **Type-safe interfaces** for all data structures
- **Modern React patterns** with hooks and functional components
- **Centralized state management** with Zustand
- **Proper error handling** throughout the application
- **Responsive design** with mobile-first approach

### Key Improvements

1. **Maintainability**: Modular architecture with clear boundaries
2. **Type Safety**: TypeScript prevents runtime errors
3. **Performance**: Code splitting and optimization
4. **Testing**: Unit and integration testing setup
5. **Accessibility**: WCAG 2.1 AA compliance
6. **Mobile**: Touch-friendly interface with responsive design

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For questions or issues:

1. Check the [GitHub Issues](https://github.com/dnviti/web-app-CAA/issues)
2. Create a new issue with detailed information
3. Contact the development team

---

**Version**: 2.0.0 - React Frontend  
**Last Updated**: December 2024  
**Original**: JavaScript CAA Application  
**Converted**: Modern React + TypeScript Stack

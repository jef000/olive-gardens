# Olive Garden Admin Dashboard

Production-ready admin dashboard for managing the Olive Garden event venue system.

## 🚀 Features

- **User Management** - View, create, edit, and manage users with role-based access control
- **Booking Management** - Manage venue bookings, approvals, and availability
- **Analytics Dashboard** - View key metrics, charts, and statistics
- **Gallery Management** - Upload and manage venue images
- **Secure Authentication** - JWT-based authentication with admin role verification
- **Responsive Design** - Modern UI built with TailwindCSS and shadcn/ui

## 📋 Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Running backend API (see `../backend/` folder)

## 🛠️ Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and set:
   ```
   VITE_API_URL=http://localhost:5000/api
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Access the dashboard**
   Open http://localhost:5173 in your browser
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

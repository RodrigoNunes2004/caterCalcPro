# CaterCalc Pro

A comprehensive catering management application built with React, TypeScript, and Node.js.

## Features

- 🍽️ **Recipe Management** - Create, edit, and manage recipes with ingredients
- 📊 **Event Planning** - Plan and manage catering events
- 🛒 **Shopping Lists** - Auto-generate shopping lists from recipes
- 📋 **Prep Lists** - Generate detailed preparation lists for events
- 💰 **Cost Calculator** - Real-time cost analysis and profit margins
- 📦 **Inventory Management** - Track ingredients and stock levels
- 🎨 **Dark Mode** - Beautiful dark theme throughout the application

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL (Neon for production, PGLite for development)
- **ORM**: Drizzle ORM
- **UI Components**: Radix UI, shadcn/ui
- **Deployment**: Vercel

## Quick Start

### Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Or with Docker
docker build -t catercalc-dev .
docker run -p 3000:3000 catercalc-dev
```

### Production Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed Vercel deployment instructions.

## Project Structure

```
├── src/                    # Frontend React application
│   ├── components/         # Reusable UI components
│   ├── pages/             # Page components
│   ├── hooks/             # Custom React hooks
│   └── lib/               # Utility functions
├── server/                # Backend Express server
│   ├── routes/            # API route handlers
│   └── storage.ts         # Database operations
├── shared/                # Shared types and schemas
├── api/                   # Vercel serverless functions
└── vercel.json           # Vercel configuration
```

## API Endpoints

- `GET /api/recipes` - List recipes
- `POST /api/recipes` - Create recipe
- `GET /api/events` - List events
- `POST /api/events` - Create event
- `GET /api/menus` - List menus
- `POST /api/menus` - Create menu
- `GET /api/ingredients` - List ingredients
- `POST /api/ingredients` - Create ingredient

## Environment Variables

Create a `.env` file:

```env
DATABASE_URL=your_postgresql_connection_string
NODE_ENV=development
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

MIT License - see LICENSE file for details

# Project Root

Full-stack web application built with **Vue.js 3**, **Express.js**, **MySQL**, **TypeScript**, **PrimeVue**, and **Vite**.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy environment variables
cp .env.example .env

# 3. Set up database
#    - Create MySQL database matching DB_NAME in .env
#    - Run migrations: npm run db:migrate
#    - Run seeds:      npm run db:seed

# 4. Start development
npm run dev
```

## Project Structure

| Directory | Description |
|-----------|-------------|
| `client/` | Vue.js 3 frontend (Vite + PrimeVue) |
| `server/` | Express.js backend API |
| `database/` | SQL migrations & seed data |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both client & server in dev mode |
| `npm run dev:client` | Start only the frontend dev server |
| `npm run dev:server` | Start only the backend dev server |
| `npm run build` | Build all workspaces for production |
| `npm run db:migrate` | Run database migrations |
| `npm run db:seed` | Seed the database |

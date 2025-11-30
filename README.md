# 🖼️ Profile

A personal portfolio and blog website built with Node.js, Express, and TypeScript.

## ✨ Features

- **Blog Posts** - Write and publish articles with markdown support
- **Tips** - Share quick tips and snippets
- **Videos** - Showcase video content with external embeds
- **Tagging** - Organize content with tags
- **RSS Feeds** - Syndicate content via RSS
- **Admin Panel** - Manage all content through a protected dashboard
- **Authentication** - Secure login system with session management

## 🥞 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express 5
- **Language**: TypeScript
- **Database**: SQLite with Prisma ORM
- **Templating**: EJS
- **Authentication**: bcrypt + express-session

## 📋 Prerequisites

- Node.js 18+
- pnpm

## ⚙️ Installation

1. Clone the repository:
   ```bash
   git clone git@github.com:patoui/profile.git
   cd profile
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your configuration.

4. Generate Prisma client and run migrations:
   ```bash
   pnpm db:generate
   pnpm db:migrate
   ```

5. (Optional) Seed the database:
   ```bash
   pnpm db:seed
   ```

## 💻 Development

Start the development server with hot reload:

```bash
pnpm dev
```

The server will start at `http://localhost:3000`.

## 🛠️ Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server with hot reload |
| `pnpm build` | Build TypeScript to JavaScript |
| `pnpm start` | Run production build |
| `pnpm routes` | List all application routes |
| `pnpm lint` | Run ESLint |
| `pnpm lint:fix` | Fix ESLint errors |
| `pnpm test` | Run tests in watch mode |
| `pnpm test:run` | Run tests once |
| `pnpm test:coverage` | Run tests with coverage |
| `pnpm db:generate` | Generate Prisma client |
| `pnpm db:migrate` | Run database migrations (development) |
| `pnpm db:deploy` | Deploy migrations (production) |
| `pnpm db:push` | Push schema to database |
| `pnpm db:seed` | Seed the database |

## 🌳 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `3000` |
| `APP_NAME` | Application name | - |
| `BASE_URL` | Base URL for the site | `http://localhost:3000` |
| `DATABASE_URL` | SQLite database path | `file:./dev.db` |
| `SESSION_SECRET` | Session encryption secret | - |
| `ADMIN_EMAIL` | Admin user email | - |

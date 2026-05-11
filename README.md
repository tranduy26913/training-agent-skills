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
| `python-services/` | Python background workers (ingestion, query, delete) |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both client & server in dev mode |
| `npm run dev:client` | Start only the frontend dev server |
| `npm run dev:server` | Start only the backend dev server |
| `npm run build` | Build all workspaces for production |
| `npm run db:migrate` | Run database migrations |
| `npm run db:seed` | Seed the database |

## Python Services

Background workers that process NotebookLM jobs (document ingestion, semantic queries, document deletion) from a MySQL-backed job queue.

### Requirements

- Python 3.10+

### Setup

```bash
cd python-services

# (Recommended) Create and activate a virtual environment
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS / Linux
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Run tests

```bash
cd python-services
python -m pytest tests/ -v
```

### Workers

| Worker | Job type | Steps |
|--------|----------|-------|
| `IngestionWorker` | `INGEST` | parse → chunk → embed → index |
| `QueryWorker` | `QUERY` | prepare → retrieve → synthesize → store |
| `DeleteWorker` | `DELETE_DOC` | vector_delete → chunks_delete → document_delete |

All workers consume jobs from the `jobs` table and track progress in `job_steps`. Failed jobs are retried with exponential back-off; jobs that exhaust retries are moved to `dead_letter_jobs`.

### Using a worker

```python
import mysql.connector
from workers.ingestion_worker import IngestionWorker

conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="your_password",
    database="your_db",
)

worker = IngestionWorker(conn)

# Process one job from the queue (returns True if a job was processed)
worker.run_once()

conn.close()
```

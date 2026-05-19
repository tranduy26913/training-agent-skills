from __future__ import annotations

import argparse
import logging
import os
import time
from pathlib import Path
from typing import Any

from workers.delete_worker import DeleteWorker
from workers.ingestion_worker import IngestionWorker
from workers.query_worker import QueryWorker


def configure_logging() -> None:
    level_name = os.getenv("PYTHON_WORKER_LOG_LEVEL", "DEBUG").upper()
    level = getattr(logging, level_name, logging.DEBUG)
    log_file = os.getenv("PYTHON_WORKER_LOG_FILE")

    handlers: list[logging.Handler] = [logging.StreamHandler()]
    if log_file:
        log_path = Path(log_file)
    else:
        log_path = Path(__file__).resolve().parents[1] / "logs" / "python-worker.log"
    log_path.parent.mkdir(parents=True, exist_ok=True)
    handlers.append(logging.FileHandler(log_path, encoding="utf-8"))

    logging.basicConfig(
        level=level,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
        handlers=handlers,
    )


def load_project_env() -> None:
    env_path = Path(__file__).resolve().parents[1] / ".env"
    if not env_path.exists():
        return

    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        # .envファイルの値で環境変数を上書きする / .env values override inherited env vars
        os.environ[key.strip()] = value.strip()


def build_connection() -> Any:
    load_project_env()
    host = os.getenv("DB_HOST", "127.0.0.1")
    port = int(os.getenv("DB_PORT", "3306"))
    user = os.getenv("DB_USER", "root")
    password = os.getenv("DB_PASSWORD", "")
    database = os.getenv("DB_NAME", "app_db")

    try:
        import pymysql
        from pymysql.cursors import DictCursor

        return pymysql.connect(
            host=host,
            port=port,
            user=user,
            password=password,
            database=database,
            cursorclass=DictCursor,
            autocommit=False,
        )
    except ImportError:
        import mysql.connector

        return mysql.connector.connect(
            host=host,
            port=port,
            user=user,
            password=password,
            database=database,
            autocommit=False,
        )


def create_worker(worker_name: str, connection: Any):
    if worker_name == "ingestion":
        return IngestionWorker(connection)
    if worker_name == "query":
        return QueryWorker(connection)
    if worker_name == "delete":
        return DeleteWorker(connection)
    raise ValueError(f"Unsupported worker: {worker_name}")


def run_worker_loop(worker_name: str, once: bool, interval_seconds: int) -> None:
    connection = build_connection()
    try:
        worker = create_worker(worker_name, connection)
        while True:
            processed = worker.run_once()
            if once:
                return
            if not processed:
                time.sleep(interval_seconds)
    finally:
        connection.close()


def main() -> None:
    configure_logging()
    parser = argparse.ArgumentParser(description="Run a real NotebookLM worker against MySQL queue")
    parser.add_argument("--worker", choices=["ingestion", "query", "delete"], required=True)
    parser.add_argument("--once", action="store_true", help="Process at most one job and exit")
    parser.add_argument("--interval", type=int, default=2, help="Polling interval in seconds when not using --once")
    args = parser.parse_args()

    run_worker_loop(args.worker, once=args.once, interval_seconds=max(1, args.interval))


if __name__ == "__main__":
    main()

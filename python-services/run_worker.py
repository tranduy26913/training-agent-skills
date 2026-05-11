from __future__ import annotations

import argparse
import json
from typing import Any

from workers.ingestion_worker import IngestionWorker
from workers.query_worker import QueryWorker


class FakeCursor:
    def __init__(self, connection: "FakeConnection") -> None:
        self.connection = connection
        self._fetchone_row = None
        self._fetchall_rows = []

    def execute(self, sql: str, params=None) -> None:
        normalized = " ".join(sql.split())
        self.connection.executed.append((normalized, params))
        self._fetchone_row = None
        self._fetchall_rows = []

        if "FROM jobs" in normalized and "FOR UPDATE" in normalized:
            self._fetchone_row = self.connection.next_job()
        elif "SELECT" in normalized and "FROM documents" in normalized:
            doc_id = params[0] if params else None
            self._fetchone_row = self.connection.get_document(doc_id)
        elif "SELECT" in normalized and "FROM chunks" in normalized:
            doc_id = params[0] if params else None
            # emulate fetchall returning dict rows
            self._fetchall_rows = self.connection.get_chunks(doc_id)

    def fetchone(self):
        row = self._fetchone_row
        self._fetchone_row = None
        return row

    def fetchall(self):
        rows = self._fetchall_rows
        self._fetchall_rows = []
        return rows

    def close(self) -> None:
        return None


class FakeConnection:
    def __init__(self, jobs=None, documents=None, chunks=None) -> None:
        self.jobs = list(jobs or [])
        self._documents = {d["id"]: d for d in (documents or [])}
        self._chunks = list(chunks or [])
        self.executed: list[tuple[str, Any]] = []
        self.commits = 0
        self.rollbacks = 0
        self.tx_begins = 0

    def cursor(self):
        return FakeCursor(self)

    def start_transaction(self) -> None:
        self.tx_begins += 1

    def commit(self) -> None:
        self.commits += 1

    def rollback(self) -> None:
        self.rollbacks += 1

    def next_job(self):
        if not self.jobs:
            return None
        return self.jobs.pop(0)

    def get_document(self, doc_id):
        return self._documents.get(doc_id)

    def get_chunks(self, doc_id):
        # return rows as dicts with keys matching worker expectations
        return [c for c in self._chunks if c.get("document_id") == doc_id]


def make_document(doc_id: int, workspace_id: int = 1, file_data: bytes = b"Hello world") -> dict:
    return {
        "id": doc_id,
        "workspace_id": workspace_id,
        "status": "pending",
        "file_data": file_data,
    }


def run_ingestion_sim():
    jobs = [
        {"id": 101, "type": "INGEST", "payload": {"document_id": 201}, "retry_count": 0, "max_retries": 3}
    ]
    docs = [make_document(201, file_data=b"This is a test document. " * 40)]
    conn = FakeConnection(jobs=jobs, documents=docs)

    worker = IngestionWorker(conn)

    print("Starting simulated ingestion worker")
    while True:
        processed = worker.run_once()
        print(f"run_once -> {processed}")
        if not processed:
            break
    print("Executed SQL statements:")
    for sql, params in conn.executed:
        print(sql, params)


def run_query_sim():
    jobs = [
        {"id": 301, "type": "QUERY", "payload": {"query_text": "test document", "workspace_id": 1}, "retry_count": 0, "max_retries": 3}
    ]
    # seed some chunk rows
    chunk_rows = [
        {"chunk_text": "This is a test document about notebooks", "document_id": 201, "workspace_id": 1},
    ]
    conn = FakeConnection(jobs=jobs, chunks=chunk_rows)

    worker = QueryWorker(conn)

    print("Starting simulated query worker")
    while True:
        processed = worker.run_once()
        print(f"run_once -> {processed}")
        if not processed:
            break
    print("Executed SQL statements:")
    for sql, params in conn.executed:
        print(sql, params)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("worker", choices=["ingestion", "query"], help="which worker to run (simulate)")
    args = parser.parse_args()

    if args.worker == "ingestion":
        run_ingestion_sim()
    else:
        run_query_sim()


if __name__ == "__main__":
    main()

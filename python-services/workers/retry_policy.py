from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any, Callable, Sequence

DEFAULT_BACKOFF_SECONDS: tuple[int, ...] = (30, 120, 300, 900, 1800)


@dataclass(frozen=True)
class RetryTransition:
    next_status: str
    next_retry_count: int
    backoff_seconds: int | None


def calculate_retry_backoff_seconds(attempt_number: int, schedule: Sequence[int] = DEFAULT_BACKOFF_SECONDS) -> int:
    if attempt_number <= 1:
        return int(schedule[0])
    index = min(attempt_number - 1, len(schedule) - 1)
    return int(schedule[index])


def evaluate_retry_transition(
    current_retry: int,
    max_retries: int,
    schedule: Sequence[int] = DEFAULT_BACKOFF_SECONDS,
) -> RetryTransition:
    normalized_max_retries = max(1, int(max_retries))
    next_retry_count = int(current_retry) + 1

    if next_retry_count >= normalized_max_retries:
        return RetryTransition(next_status="dead_letter", next_retry_count=next_retry_count, backoff_seconds=None)

    backoff_seconds = calculate_retry_backoff_seconds(next_retry_count, schedule)
    return RetryTransition(next_status="pending", next_retry_count=next_retry_count, backoff_seconds=backoff_seconds)


def build_dead_letter_payload(
    *,
    job: dict[str, Any],
    error_message: str,
    failed_step: str,
    source_worker: str,
    next_retry_count: int,
) -> str:
    payload = {
        "job_id": int(job["id"]),
        "job_type": str(job.get("type") or ""),
        "job_payload": job.get("payload"),
        "retry_count": int(next_retry_count),
        "max_retries": int(job.get("max_retries") or 0),
        "error_message": error_message,
        "failed_step": failed_step,
        "source_worker": source_worker,
    }
    return json.dumps(payload, sort_keys=True)


def apply_retry_policy(
    *,
    execute: Callable[[str, tuple[Any, ...]], int],
    job: dict[str, Any],
    error_message: str,
    failed_step: str,
    source_worker: str,
    default_max_retries: int,
) -> RetryTransition:
    job_id = int(job["id"])
    current_retry = int(job.get("retry_count") or 0)
    max_retries = int(job.get("max_retries") or default_max_retries)

    transition = evaluate_retry_transition(current_retry=current_retry, max_retries=max_retries)

    execute(
        "UPDATE jobs SET retry_count = retry_count + 1, error_message = %s, updated_at = NOW() "
        "WHERE id = %s AND status = 'processing'",
        (error_message, job_id),
    )

    if transition.next_status == "dead_letter":
        execute(
            "UPDATE jobs SET status = 'dead_letter', error_message = %s, updated_at = NOW() "
            "WHERE id = %s AND status = 'processing'",
            (error_message, job_id),
        )
        dead_letter_payload = build_dead_letter_payload(
            job=job,
            error_message=error_message,
            failed_step=failed_step,
            source_worker=source_worker,
            next_retry_count=transition.next_retry_count,
        )
        execute(
            "INSERT INTO dead_letter_jobs "
            "(original_job_id, job_type, payload, failure_reason, moved_at) "
            "VALUES (%s, %s, %s, %s, NOW())",
            (
                job_id,
                str(job.get("type") or ""),
                json.dumps(job.get("payload"), sort_keys=True) if job.get("payload") is not None else "null",
                dead_letter_payload,
            ),
        )
        return transition

    execute(
        "UPDATE jobs SET status = 'pending', error_message = %s, updated_at = NOW() "
        "WHERE id = %s AND status = 'processing'",
        (error_message, job_id),
    )
    return transition

---
title: Script Management Implementation Plan
date: 2026-07-07
scope: Backend + Frontend, no E2E
---

# Script Management Implementation Plan

## Scope

- Implement backend Script CRUD APIs and AI generate/model endpoints.
- Implement frontend Script list/create/edit screens with service, store, types, and routes.
- Add Script card/count entry point to Project detail.
- Run backend/frontend checks that are practical in the current workspace.

## Out of Scope

- E2E/Playwright specs.
- Script pagination/filtering.
- AI model CRUD.
- Streaming generation.

## Execution Steps

1. Backend
   - Add provider model metadata and `ApiProviderService.generateWithModel`.
   - Add scripts validation, repository, service, controller, and routes.
   - Mount `/api/v1/admin/scripts` and `/api/v1/admin/ai-models`.

2. Frontend
   - Add script types, API service, composable, and Pinia store.
   - Add `ScriptListPage`, `ScriptFormPage`, and route definitions.
   - Add compact Script card to `ProjectDetailPage`.

3. Verification
   - Run server TypeScript/test command if available.
   - Run client typecheck/test command if available.
   - Fix compile errors in touched code.

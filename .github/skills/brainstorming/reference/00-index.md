```markdown
---
title: [Feature Design Title]
version: [e.g., 1.0]
author: [Team or Owner]
date: [YYYY-MM-DD]
---

# [Feature Design Title]

## Executive Summary

Provide a concise summary of the feature objective, business value, and expected outcome.

---

## Changelog

| Version | Date | Author | Summary |
|---------|------|--------|---------|
| 1.0 | [YYYY-MM-DD] | [Author] | Initial design |

---

## 1. Objective & Scope

### Purpose

Describe the main goal of this feature and its intended users.

### In Scope

- [List features included in this delivery]
- [...]

### Out of Scope

- [List features explicitly excluded from this delivery]
- [...]

---

## 2. Architecture Overview
```text
[Client Application]
      |
   HTTP/REST
      |
[Backend API]
  - Controller
  - Service
  - Repository
  - Validation
      |
    SQL/ORM
      |
[Database]
  - Existing tables
  - New tables
```

---

## 3. Spec File Index

| File | Description |
|------|-------------|
| [01-backend.md](./01-backend.md) | API endpoints, request/response contracts, validation rules, error handling |
| [02-frontend.md](./02-frontend.md) | UI layout, wireframes, component tree, screen item specs, TypeScript & DB models |
| [03-behavior.md](./03-behavior.md) | Page behavior: events, UI states, navigation flows, confirm dialogs, sequence diagrams |
| [04-quality.md](./04-quality.md) | Testing strategy, performance, security, accessibility, logging & audit |

---
```

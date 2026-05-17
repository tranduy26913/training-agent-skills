# UC-USR-01: Search and Filter User Accounts

| **Use Case ID:**             | UC-USR-01                                                       |
|------------------------------|-----------------------------------------------------------------|
| **Use Case Name:**           | Search and filter user accounts                                 |
| **Created By:**              | System Admin       | **Last Updated By:**   | —           |
| **Date Created:**            | 2026-05-17         | **Date Last Updated:** | —           |

---

| **Actor:**                   | Primary: **System Admin**                                       |
|------------------------------|-----------------------------------------------------------------|
| **Description:**             | The System Admin navigates to the User Management page to locate specific user accounts using search and filter controls. The admin can narrow the result set by name/email keywords, role, status, and date range, then browse results with pagination to efficiently manage large user bases. |

---

| **Preconditions:**           | 1. Admin is authenticated with role `admin`. 2. Admin is on the User Management page (`/users`). 3. At least one user record exists in the system. |
|------------------------------|-----------------------------------------------------------------|
| **Postconditions:**          | 1. The user table displays only records matching the applied criteria. 2. Pagination reflects the filtered total count. 3. No data is modified; this is a read-only operation. |
| **Priority:**                | High — primary entry point for all user management tasks.       |
| **Frequency of Use:**        | ~20–50 times per day (ongoing admin monitoring and support tasks). |

---

| **Normal Course of Events:** |                                                                 |
|------------------------------|-----------------------------------------------------------------|
|                              | 1. Admin navigates to `/users`. |
|                              | 2. System loads the user list with default parameters: sorted by `created_at` DESC, page 1, limit 10, no filters. |
|                              | 3. System displays skeleton rows while fetching, then renders the user table with columns: ID, Name, Email, Role, Status, Created At, Updated At, Last Login, Points, Actions. |
|                              | 4. Admin types a keyword in the Search box (name or email). |
|                              | 5. System debounces 300ms then sends a filtered API request (`search=<keyword>`). |
|                              | 6. System updates the table with matching results, resets to page 1. |
|                              | 7. Admin selects a value from the Role dropdown filter. |
|                              | 8. System sends a new API request with the combined filters. |
|                              | 9. System updates the table. |
|                              | 10. Admin clicks a column header to sort (e.g., Name ASC). |
|                              | 11. System sends API request with `sortBy=name&sortOrder=asc`. |
|                              | 12. System re-renders the table sorted by Name ascending. |

---

| **Alternative Courses:**     |                                                                 |
|------------------------------|-----------------------------------------------------------------|
| UC-USR-01.AC.1               | **Admin filters by Status and Date Range** — At step 7–9, Admin additionally selects a Status and sets a Date Range picker. System combines all active filters in a single API call and updates the table. |
| UC-USR-01.AC.2               | **Admin clears all filters** — At any step after filters are applied, Admin clicks "Clear Filters". System resets all filter controls to empty, reloads the table with default parameters (page 1, sort `created_at` DESC). |
| UC-USR-01.AC.3               | **Admin changes page size** — Admin selects 25 or 50 items per page from the pagination control. System reloads the table with the new limit, resets to page 1. |

---

| **Exceptions:**              |                                                                 |
|------------------------------|-----------------------------------------------------------------|
| UC-USR-01.EX.1               | **No results found** — At step 6 or 9, if no user matches the filters, System displays an empty state message: *"No users found matching your criteria."* The table shows 0 rows. Pagination shows "0 of 0". |
| UC-USR-01.EX.2               | **API error on load** — At step 2 or 5, if the server returns an error, System displays an error notification: *"Failed to load users. Please try again."* The table shows empty rows. Retry is triggered by refreshing the page. |
| UC-USR-01.EX.3               | **Admin session expired** — At any step, if the auth token expires, System redirects to the login page. |

---

| **Includes:**                | — |
|------------------------------|-----------------------------------------------------------------|
| **Special Requirements:**    | 1. **Performance**: User list API must respond within 500ms for datasets up to 10,000 records. 2. **Security**: `sortBy` field is validated against a whitelist server-side to prevent SQL injection. Search input is parameterized. 3. **Usability**: Filter changes apply within 300ms debounce; skeleton loading replaces spinner overlay. |
| **Assumptions:**             | 1. All filter operations are server-side (no client-side in-memory filtering). 2. Date range filter applies to `created_at` by default. 3. Search is case-insensitive and matches partial name or email. |
| **Notes and Issues:**        | TBD-1: Should Date Range filter allow switching between `created_at` and `updated_at`? \| Owner: Admin Team \| Due: 2026-05-30 |

---

*Generated by use-case-writer skill · Validated · 2026-05-17*

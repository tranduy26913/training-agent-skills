# UC-USR-04: Delete User Account

| **Use Case ID:**             | UC-USR-04                                                       |
|------------------------------|-----------------------------------------------------------------|
| **Use Case Name:**           | Delete user account                                             |
| **Created By:**              | System Admin       | **Last Updated By:**   | —           |
| **Date Created:**            | 2026-05-17         | **Date Last Updated:** | —           |

---

| **Actor:**                   | Primary: **System Admin**                                       |
|------------------------------|-----------------------------------------------------------------|
| **Description:**             | The System Admin permanently removes a user account from the system when the account is no longer needed. The admin triggers deletion from the User List, confirms intent via a dialog, and the system deletes the record and creates an audit log entry. An admin cannot delete their own account. |

---

| **Preconditions:**           | 1. Admin is authenticated with role `admin`. 2. The target user account exists in the system. 3. The target user is not the currently authenticated admin (self-delete is prohibited). |
|------------------------------|-----------------------------------------------------------------|
| **Postconditions:**          | 1. The user record is permanently removed from the database. 2. An audit log entry is created: action=`delete`, actor=admin ID, target=deleted user ID. 3. The User List page reloads and no longer shows the deleted user. |
| **Priority:**                | Medium — used infrequently; off-boarding or cleanup scenarios.  |
| **Frequency of Use:**        | ~1–5 times per week (account decommissioning, test account cleanup). |

---

| **Normal Course of Events:** |                                                                 |
|------------------------------|-----------------------------------------------------------------|
|                              | 1. Admin clicks "Delete" button on a user row in the User List page. |
|                              | 2. System displays a confirmation dialog: *"Are you sure you want to delete [User Name]? This action cannot be undone."* with "Confirm" and "Cancel" buttons. |
|                              | 3. Admin clicks "Confirm". |
|                              | 4. System sends a DELETE request to `/api/users/:id`. |
|                              | 5. Server verifies the target user is not the requesting admin. |
|                              | 6. System deletes the user record from the database. |
|                              | 7. System writes an audit log entry: action=`delete`, actor=admin ID, target=user ID. |
|                              | 8. System closes the dialog, reloads the User List, and displays a success notification: *"User [Name] has been deleted."* |

---

| **Alternative Courses:**     |                                                                 |
|------------------------------|-----------------------------------------------------------------|
| UC-USR-04.AC.1               | **Admin cancels deletion** — At step 2, Admin clicks "Cancel". System closes the dialog. No deletion occurs. No audit log is written. UC ends. |

---

| **Exceptions:**              |                                                                 |
|------------------------------|-----------------------------------------------------------------|
| UC-USR-04.EX.1               | **Admin attempts to delete own account** — At step 1, if the "Delete" button for the admin's own account is clicked, the button is disabled (grayed out) and shows a tooltip: *"You cannot delete your own account."* The confirmation dialog is never shown. |
| UC-USR-04.EX.2               | **User not found on delete** — At step 6, if the user was already deleted by another admin, Server returns 404. System shows: *"User no longer exists."* and reloads the User List. |
| UC-USR-04.EX.3               | **Server error on delete** — At step 6, if the database operation fails, Server returns 500. System shows: *"Failed to delete user. Please try again."* No record is deleted. No audit log is written. |
| UC-USR-04.EX.4               | **Admin session expired** — At any step, if the auth token expires, System redirects to the login page. |

---

| **Includes:**                | — |
|------------------------------|-----------------------------------------------------------------|
| **Special Requirements:**    | 1. **Security**: Self-delete prevention must be enforced both client-side (disable button) and server-side (403 response). Deletion is hard delete — no soft-delete/archive implemented in current scope. 2. **Usability**: Confirmation dialog must clearly state the action is irreversible. 3. **Audit**: Audit log must be written after successful deletion for compliance traceability. |
| **Assumptions:**             | 1. Deletion is permanent (hard delete); no recycle bin or restore feature in scope. 2. Associated audit log records for the deleted user are retained (not cascade-deleted). 3. If the deleted user has active sessions, those sessions become invalid immediately. |
| **Notes and Issues:**        | TBD-1: Should deletion be blocked if the user has associated audit logs or active content? \| Owner: Admin Team \| Due: 2026-05-30 |

---

*Generated by use-case-writer skill · Validated · 2026-05-17*

# UC-USR-03: Edit User Information

| **Use Case ID:**             | UC-USR-03                                                       |
|------------------------------|-----------------------------------------------------------------|
| **Use Case Name:**           | Edit user information                                           |
| **Created By:**              | System Admin       | **Last Updated By:**   | —           |
| **Date Created:**            | 2026-05-17         | **Date Last Updated:** | —           |

---

| **Actor:**                   | Primary: **System Admin** / Secondary: Authentication Service   |
|------------------------------|-----------------------------------------------------------------|
| **Description:**             | The System Admin updates an existing user's profile information, role, or status to reflect organizational changes. The admin modifies one or more fields on the Edit User page, and the system saves the changes while recording a detailed audit log entry of all modified fields. |

---

| **Preconditions:**           | 1. Admin is authenticated with role `admin`. 2. The target user account exists and is accessible via `/users/:id/edit`. 3. Admin is not attempting to edit their own account's role or status (self-edit restrictions do not apply to name/email/note/birthday). |
|------------------------------|-----------------------------------------------------------------|
| **Postconditions:**          | 1. The user record is updated in the database with the new field values. 2. An audit log entry is created with action=`update`, actor=admin ID, target=user ID, and a `changed_fields` JSON documenting old and new values for each modified field. 3. Admin receives a success notification. |
| **Priority:**                | High — required for role changes, status management, and profile corrections. |
| **Frequency of Use:**        | ~10–30 times per week (role adjustments, status changes, profile corrections). |

---

| **Normal Course of Events:** |                                                                 |
|------------------------------|-----------------------------------------------------------------|
|                              | 1. Admin clicks "Edit" button on a user row in the User List page, or navigates directly to `/users/:id/edit`. |
|                              | 2. System fetches the user record by ID and displays the Edit User form with current values pre-filled: Name, Email, Role, Status, Note (optional), Birthday (optional), Points (read-only), Created At (read-only). |
|                              | 3. Admin modifies one or more fields. |
|                              | 4. If Admin changes the Email field, System validates the new email in real-time: sends a duplicate-check request (excluding current user) after 500ms debounce. |
|                              | 5. System confirms the email is unique for other users and displays no error. |
|                              | 6. Admin clicks "Save". |
|                              | 7. System validates all required fields (Name 2–50 chars, Email format and uniqueness, Role, Status; Note max 500 chars; Birthday not in the future). |
|                              | 8. System updates the user record with the changed values. |
|                              | 9. System writes an audit log entry: action=`update`, changed_fields={field: {old: X, new: Y}} for each modified field. |
|                              | 10. System displays a success notification. Admin remains on the Edit page. |

---

| **Alternative Courses:**     |                                                                 |
|------------------------------|-----------------------------------------------------------------|
| UC-USR-03.AC.1               | **Admin sets status to "suspended"** — At step 3, Admin sets Status = `suspended`. System saves the record and the user immediately loses the ability to authenticate. Audit log records the status change. |
| UC-USR-03.AC.2               | **Admin navigates back without saving** — At any step before clicking "Save", Admin clicks "Cancel". System navigates back to the User List page. No changes are saved. No audit log is written. |

---

| **Exceptions:**              |                                                                 |
|------------------------------|-----------------------------------------------------------------|
| UC-USR-03.EX.1               | **User not found** — At step 2, if the user ID does not exist (e.g., deleted after list loaded), System displays an error notification: *"User not found."* and redirects Admin to the User List page. |
| UC-USR-03.EX.2               | **Duplicate email on save** — At step 4–5 or 7, if the new email is already in use by another user, System displays inline error: *"This email is already in use by another account."* Admin must change the email. |
| UC-USR-03.EX.3               | **Validation failure** — At step 7, if required fields are invalid, System highlights each invalid field with an error message. UC returns to step 3. |
| UC-USR-03.EX.4               | **Server error on save** — At step 8, if the update fails, System shows: *"Failed to update user. Please try again."* No changes are persisted. No audit log is written. |
| UC-USR-03.EX.5               | **Admin session expired** — At any step, if the auth token expires, System redirects to the login page. Any unsaved changes are lost. |

---

| **Includes:**                | — |
|------------------------------|-----------------------------------------------------------------|
| **Special Requirements:**    | 1. **Security**: Points field is read-only and cannot be modified via this UC. Admin cannot self-escalate role or status through this UI (server enforces). Email uniqueness is checked server-side with current-user exclusion. 2. **Performance**: Edit form loads within 1s. Save operation completes within 2s. 3. **Audit**: `changed_fields` JSON must record both `old` and `new` values for traceability. |
| **Assumptions:**             | 1. Admin cannot modify their own role (enforced server-side). 2. Birthday accepts only past or present dates. 3. Points are managed by a separate system; they are displayed here as read-only. |
| **Notes and Issues:**        | TBD-1: Should admin be able to force-reset a user's password from this page? \| Owner: Admin Team \| Due: 2026-05-30 |

---

*Generated by use-case-writer skill · Validated · 2026-05-17*

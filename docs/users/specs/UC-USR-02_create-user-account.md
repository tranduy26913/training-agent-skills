# UC-USR-02: Create User Account

| **Use Case ID:**             | UC-USR-02                                                      |
|------------------------------|----------------------------------------------------------------|
| **Use Case Name:**           | Create user account                                            |
| **Created By:**              | System Admin       | **Last Updated By:**   | —          |
| **Date Created:**            | 2026-05-17         | **Date Last Updated:** | —          |

---

| **Actor:**                   | Primary: **System Admin** / Secondary: Authentication Service  |
|------------------------------|----------------------------------------------------------------|
| **Description:**             | The System Admin creates a new user account in the system to grant access to internal tools. The admin provides identity information, assigns a role, and sets optional fields (birthday, note). The system saves the account with a default password (`username123`) and logs the creation in the audit trail. |

---

| **Preconditions:**           | 1. Admin is authenticated and has role `admin` in the system. 2. Admin is on the User Management page. 3. The email address to be registered does not already exist in the system. |
|------------------------------|----------------------------------------------------------------|
| **Postconditions:**          | 1. A new user record is saved in the database with status `active`. 2. The user's password is set to the default value `username123`. 3. An audit log entry (action: `create`, actor: admin ID, target: new user ID) is created. |
| **Priority:**                | High — core admin operation required before any user can access the system. |
| **Frequency of Use:**        | ~5–20 times per week (onboarding of new staff/partners).       |

---

| **Normal Course of Events:** |                                                                |
|------------------------------|----------------------------------------------------------------|
|                              | 1. Admin navigates to the User Management page and clicks "Create User". |
|                              | 2. System displays the Create User form with fields: Full Name, Email, Role, Status, Birthday (optional), Note (optional). |
|                              | 3. Admin fills in Full Name (2–50 chars), Email, selects Role and Status. |
|                              | 4. System validates the email in real-time: sends a duplicate-check request to the server after 500ms debounce. |
|                              | 5. System confirms the email is unique and displays no error. |
|                              | 6. Admin clicks "Save". |
|                              | 7. System validates all required fields (Full Name, Email, Role, Status). |
|                              | 8. System creates the user record with status `active` and default password `username123`. |
|                              | 9. System writes an audit log entry: action=`create`, actor=admin ID, target=new user ID. |
|                              | 10. System closes the form and redirects admin to the User List page with a success notification. |

---

| **Alternative Courses:**     |                                                                |
|------------------------------|----------------------------------------------------------------|
| UC-USR-02.AC.1               | **Admin creates user with inactive status** — At step 3 of Normal Course, if Admin selects Status = `inactive`, the system creates the account but the user cannot log in. Step 8 saves record with status `inactive`. Audit log records the initial status. |
| UC-USR-02.AC.2               | **Admin fills optional fields** — At step 3, Admin additionally fills Birthday and/or Note. System includes these values in the record saved at step 8. |

---

| **Exceptions:**              |                                                                |
|------------------------------|----------------------------------------------------------------|
| UC-USR-02.EX.1               | **Duplicate email** — At step 4–5, if the server detects the email already exists, System displays inline error: *"This email address is already in use."* Admin must change the email. UC cannot proceed until email is unique. |
| UC-USR-02.EX.2               | **Validation failure on submit** — At step 7, if required fields are missing or invalid (e.g. Full Name < 2 chars), System highlights each invalid field with an error message. UC returns to step 3. |
| UC-USR-02.EX.3               | **Server/network error on save** — At step 8, if the database write fails, System shows an error notification: *"Failed to create user. Please try again."* No record is created. No audit log is written. UC returns to step 6. |
| UC-USR-02.EX.4               | **Admin session expired** — At any step, if the admin's auth token is expired, System redirects to the login page. The form data is lost. |

---

| **Includes:**                | — (No shared sub-UC at this time)                              |
|------------------------------|----------------------------------------------------------------|
| **Special Requirements:**    | 1. **Security**: Default password `username123` must be documented; admins must notify users to reset it. Password stored as bcrypt hash. 2. **Performance**: Email duplicate-check API must respond within 300ms under normal load. Form save must complete within 2s. 3. **Usability**: Inline validation feedback appears within 500ms debounce; no page reload on validation errors. |
| **Assumptions:**             | 1. Email is the unique identifier for user accounts (no phone-based auth). 2. The system does not send a welcome email to the new user automatically (out of scope). 3. All admins have the same level of user management permission. |
| **Notes and Issues:**        | TBD-1: Should the system force password change on first login? \| Owner: Admin Team \| Due: 2026-05-30 |

---

*Generated by use-case-writer skill · Validated: 20/20 ✅ · 2026-05-17*

IDENTIFICATION DIVISION.
PROGRAM-ID. EMP-CREATE.
AUTHOR. COBOL-CGI.
*>================================================================
*> EMP-CREATE — Validate new employee input
*>
*> Input protocol (stdin from Node.js CGI runner, pipe-delimited):
*>   EMPLOYEE_CODE|<value>
*>   FULL_NAME|<value>
*>   EMAIL|<value>
*>   PHONE|<value>
*>   DEPARTMENT|<value>
*>   POSITION|<value>
*>   SALARY|<value>
*>   HIRE_DATE|<value>
*>   STATUS|<value>
*>   END
*>
*> Output — on validation failure:
*>   STATUS|ERROR
*>   CODE|<error_code>
*>   FIELD|<field_name>
*>   MESSAGE|<human_readable>
*>
*> Output — on validation success:
*>   STATUS|VALID
*>   EMPLOYEE_CODE|<trimmed_value>
*>   FULL_NAME|<trimmed_value>
*>   EMAIL|<trimmed_value>
*>   PHONE|<trimmed_value>
*>   DEPARTMENT|<trimmed_value>
*>   POSITION|<trimmed_value>
*>   SALARY|<trimmed_value>
*>   HIRE_DATE|<trimmed_value>
*>   STATUS|<trimmed_value>
*>================================================================
ENVIRONMENT DIVISION.
CONFIGURATION SECTION.

DATA DIVISION.
WORKING-STORAGE SECTION.

01  WS-LINE              PIC X(800)  VALUE SPACES.
01  WS-KEY               PIC X(30)   VALUE SPACES.
01  WS-VALUE             PIC X(500)  VALUE SPACES.
01  WS-EOF-FLAG          PIC X       VALUE 'N'.
01  WS-DELIM-POS         PIC 9(3)    VALUE 0.

COPY EMP-RECORD.

*> Trim helpers
01  WS-TRIM-RESULT       PIC X(255)  VALUE SPACES.

PROCEDURE DIVISION.
MAIN-PARA.
    PERFORM READ-INPUT UNTIL WS-EOF-FLAG = 'Y'
    PERFORM VALIDATE-INPUT
    STOP RUN.

READ-INPUT.
    ACCEPT WS-LINE FROM CONSOLE
    IF WS-LINE = SPACES
        MOVE 'Y' TO WS-EOF-FLAG
        EXIT PARAGRAPH
    END-IF
    IF FUNCTION TRIM(WS-LINE) = 'END'
        MOVE 'Y' TO WS-EOF-FLAG
        EXIT PARAGRAPH
    END-IF
    MOVE SPACES TO WS-KEY
    MOVE SPACES TO WS-VALUE
    UNSTRING WS-LINE DELIMITED BY '|'
        INTO WS-KEY
            WS-VALUE
    END-UNSTRING
    EVALUATE WS-KEY
        WHEN 'EMPLOYEE_CODE'
            MOVE FUNCTION TRIM(WS-VALUE) TO WS-EMP-CODE
        WHEN 'FULL_NAME'
            MOVE FUNCTION TRIM(WS-VALUE) TO WS-FULL-NAME
        WHEN 'EMAIL'
            MOVE FUNCTION TRIM(WS-VALUE) TO WS-EMAIL
        WHEN 'PHONE'
            MOVE FUNCTION TRIM(WS-VALUE) TO WS-PHONE
        WHEN 'DEPARTMENT'
            MOVE FUNCTION TRIM(WS-VALUE) TO WS-DEPARTMENT
        WHEN 'POSITION'
            MOVE FUNCTION TRIM(WS-VALUE) TO WS-POSITION
        WHEN 'SALARY'
            MOVE FUNCTION TRIM(WS-VALUE) TO WS-SALARY-STR
        WHEN 'HIRE_DATE'
            MOVE FUNCTION TRIM(WS-VALUE) TO WS-HIRE-DATE
        WHEN 'STATUS'
            MOVE FUNCTION TRIM(WS-VALUE) TO WS-STATUS
    END-EVALUATE.

VALIDATE-INPUT.
    *>-- Required: employee_code
    IF FUNCTION TRIM(WS-EMP-CODE) = SPACES
        DISPLAY 'RESULT|ERROR'
        DISPLAY 'CODE|VALIDATION_ERROR'
        DISPLAY 'FIELD|employee_code'
        DISPLAY 'MESSAGE|employee_code is required'
        STOP RUN
    END-IF
    IF FUNCTION LENGTH(FUNCTION TRIM(WS-EMP-CODE)) > 20
        DISPLAY 'RESULT|ERROR'
        DISPLAY 'CODE|VALIDATION_ERROR'
        DISPLAY 'FIELD|employee_code'
        DISPLAY 'MESSAGE|employee_code must not exceed 20 characters'
        STOP RUN
    END-IF

    *>-- Required: full_name
    IF FUNCTION TRIM(WS-FULL-NAME) = SPACES
        DISPLAY 'RESULT|ERROR'
        DISPLAY 'CODE|VALIDATION_ERROR'
        DISPLAY 'FIELD|full_name'
        DISPLAY 'MESSAGE|full_name is required'
        STOP RUN
    END-IF

    *>-- Required: email with @ check
    IF FUNCTION TRIM(WS-EMAIL) = SPACES
        DISPLAY 'RESULT|ERROR'
        DISPLAY 'CODE|VALIDATION_ERROR'
        DISPLAY 'FIELD|email'
        DISPLAY 'MESSAGE|email is required'
        STOP RUN
    END-IF
    MOVE FUNCTION TRIM(WS-EMAIL) TO WS-TRIM-RESULT
    IF FUNCTION TRIM(WS-TRIM-RESULT) NOT EQUAL ' '
        PERFORM CHECK-EMAIL-FORMAT
    END-IF

    *>-- Required: department enum
    IF FUNCTION TRIM(WS-DEPARTMENT) = SPACES
        DISPLAY 'RESULT|ERROR'
        DISPLAY 'CODE|VALIDATION_ERROR'
        DISPLAY 'FIELD|department'
        DISPLAY 'MESSAGE|department is required'
        STOP RUN
    END-IF
    PERFORM CHECK-DEPARTMENT

    *>-- Required: position enum
    IF FUNCTION TRIM(WS-POSITION) = SPACES
        DISPLAY 'RESULT|ERROR'
        DISPLAY 'CODE|VALIDATION_ERROR'
        DISPLAY 'FIELD|position'
        DISPLAY 'MESSAGE|position is required'
        STOP RUN
    END-IF
    PERFORM CHECK-POSITION

    *>-- Required: salary (non-negative numeric string)
    IF FUNCTION TRIM(WS-SALARY-STR) = SPACES
        DISPLAY 'RESULT|ERROR'
        DISPLAY 'CODE|VALIDATION_ERROR'
        DISPLAY 'FIELD|salary'
        DISPLAY 'MESSAGE|salary is required'
        STOP RUN
    END-IF

    *>-- Required: hire_date format YYYY-MM-DD
    IF FUNCTION TRIM(WS-HIRE-DATE) = SPACES
        DISPLAY 'RESULT|ERROR'
        DISPLAY 'CODE|VALIDATION_ERROR'
        DISPLAY 'FIELD|hire_date'
        DISPLAY 'MESSAGE|hire_date is required'
        STOP RUN
    END-IF
    IF FUNCTION LENGTH(FUNCTION TRIM(WS-HIRE-DATE)) NOT EQUAL 10
        DISPLAY 'RESULT|ERROR'
        DISPLAY 'CODE|VALIDATION_ERROR'
        DISPLAY 'FIELD|hire_date'
        DISPLAY 'MESSAGE|hire_date must be in YYYY-MM-DD format'
        STOP RUN
    END-IF

    *>-- Default status to 'active' if blank
    IF FUNCTION TRIM(WS-STATUS) = SPACES
        MOVE 'active' TO WS-STATUS
    END-IF
    PERFORM CHECK-STATUS

    *>-- All validations passed — output validated fields
    DISPLAY 'RESULT|VALID'
    DISPLAY 'EMPLOYEE_CODE|' WITH NO ADVANCING
    DISPLAY FUNCTION TRIM(WS-EMP-CODE)
    DISPLAY 'FULL_NAME|'     WITH NO ADVANCING
    DISPLAY FUNCTION TRIM(WS-FULL-NAME)
    DISPLAY 'EMAIL|'         WITH NO ADVANCING
    DISPLAY FUNCTION TRIM(WS-EMAIL)
    DISPLAY 'PHONE|'         WITH NO ADVANCING
    DISPLAY FUNCTION TRIM(WS-PHONE)
    DISPLAY 'DEPARTMENT|'    WITH NO ADVANCING
    DISPLAY FUNCTION TRIM(WS-DEPARTMENT)
    DISPLAY 'POSITION|'      WITH NO ADVANCING
    DISPLAY FUNCTION TRIM(WS-POSITION)
    DISPLAY 'SALARY|'        WITH NO ADVANCING
    DISPLAY FUNCTION TRIM(WS-SALARY-STR)
    DISPLAY 'HIRE_DATE|'     WITH NO ADVANCING
    DISPLAY FUNCTION TRIM(WS-HIRE-DATE)
    DISPLAY 'STATUS|'        WITH NO ADVANCING
    DISPLAY FUNCTION TRIM(WS-STATUS)
    .

CHECK-EMAIL-FORMAT.
    MOVE 0 TO WS-DELIM-POS
    INSPECT FUNCTION TRIM(WS-EMAIL)
        TALLYING WS-DELIM-POS FOR ALL '@'
    IF WS-DELIM-POS NOT EQUAL 1
        DISPLAY 'RESULT|ERROR'
        DISPLAY 'CODE|VALIDATION_ERROR'
        DISPLAY 'FIELD|email'
        DISPLAY 'MESSAGE|email must contain exactly one @ character'
        STOP RUN
    END-IF.

CHECK-DEPARTMENT.
    IF FUNCTION TRIM(WS-DEPARTMENT) = 'engineering'
        EXIT PARAGRAPH
    END-IF
    IF FUNCTION TRIM(WS-DEPARTMENT) = 'hr'
        EXIT PARAGRAPH
    END-IF
    IF FUNCTION TRIM(WS-DEPARTMENT) = 'finance'
        EXIT PARAGRAPH
    END-IF
    IF FUNCTION TRIM(WS-DEPARTMENT) = 'marketing'
        EXIT PARAGRAPH
    END-IF
    IF FUNCTION TRIM(WS-DEPARTMENT) = 'operations'
        EXIT PARAGRAPH
    END-IF
    DISPLAY 'RESULT|ERROR'
    DISPLAY 'CODE|VALIDATION_ERROR'
    DISPLAY 'FIELD|department'
    DISPLAY 'MESSAGE|department must be one of: engineering, hr, finance, marketing, operations'
    STOP RUN.

CHECK-POSITION.
    IF FUNCTION TRIM(WS-POSITION) = 'engineer'
        EXIT PARAGRAPH
    END-IF
    IF FUNCTION TRIM(WS-POSITION) = 'senior_engineer'
        EXIT PARAGRAPH
    END-IF
    IF FUNCTION TRIM(WS-POSITION) = 'team_lead'
        EXIT PARAGRAPH
    END-IF
    IF FUNCTION TRIM(WS-POSITION) = 'manager'
        EXIT PARAGRAPH
    END-IF
    IF FUNCTION TRIM(WS-POSITION) = 'director'
        EXIT PARAGRAPH
    END-IF
    IF FUNCTION TRIM(WS-POSITION) = 'analyst'
        EXIT PARAGRAPH
    END-IF
    IF FUNCTION TRIM(WS-POSITION) = 'specialist'
        EXIT PARAGRAPH
    END-IF
    IF FUNCTION TRIM(WS-POSITION) = 'intern'
        EXIT PARAGRAPH
    END-IF
    DISPLAY 'RESULT|ERROR'
    DISPLAY 'CODE|VALIDATION_ERROR'
    DISPLAY 'FIELD|position'
    DISPLAY 'MESSAGE|position must be one of: engineer, senior_engineer, team_lead, manager, director, analyst, specialist, intern'
    STOP RUN.

CHECK-STATUS.
    IF FUNCTION TRIM(WS-STATUS) = 'active'
        EXIT PARAGRAPH
    END-IF
    IF FUNCTION TRIM(WS-STATUS) = 'inactive'
        EXIT PARAGRAPH
    END-IF
    DISPLAY 'RESULT|ERROR'
    DISPLAY 'CODE|VALIDATION_ERROR'
    DISPLAY 'FIELD|status'
    DISPLAY 'MESSAGE|status must be either active or inactive'
    STOP RUN.

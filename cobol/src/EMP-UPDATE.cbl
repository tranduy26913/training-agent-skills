IDENTIFICATION DIVISION.
PROGRAM-ID. EMP-UPDATE.
AUTHOR. COBOL-CGI.
*>================================================================
*> EMP-UPDATE  EValidate employee update input
*>
*> Input protocol (stdin from Node.js CGI runner):
*>   EMPLOYEE_ID|<id>
*>   FULL_NAME|<value>        (required)
*>   EMAIL|<value>            (required)
*>   PHONE|<value>            (optional)
*>   DEPARTMENT|<value>       (required)
*>   POSITION|<value>         (required)
*>   SALARY|<value>           (required)
*>   HIRE_DATE|<value>        (required)
*>   STATUS|<value>           (required)
*>   END
*>
*> Output on error:
*>   STATUS|ERROR
*>   CODE|<error_code>
*>   FIELD|<field_name>
*>   MESSAGE|<human_readable>
*>
*> Output on success:
*>   STATUS|VALID
*>   EMPLOYEE_ID|<id>
*>   FULL_NAME|<value>
*>   ... all validated fields ...
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
01  WS-EMPLOYEE-ID       PIC X(10)   VALUE SPACES.

COPY EMP-RECORD.

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
        WHEN 'EMPLOYEE_ID'
            MOVE FUNCTION TRIM(WS-VALUE) TO WS-EMPLOYEE-ID
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
*>-- Required: employee_id
    IF FUNCTION TRIM(WS-EMPLOYEE-ID) = SPACES
        DISPLAY 'RESULT|ERROR'
        DISPLAY 'CODE|VALIDATION_ERROR'
        DISPLAY 'FIELD|id'
        DISPLAY 'MESSAGE|employee id is required for update'
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
    PERFORM CHECK-EMAIL-FORMAT

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

*>-- Required: salary
    IF FUNCTION TRIM(WS-SALARY-STR) = SPACES
        DISPLAY 'RESULT|ERROR'
        DISPLAY 'CODE|VALIDATION_ERROR'
        DISPLAY 'FIELD|salary'
        DISPLAY 'MESSAGE|salary is required'
        STOP RUN
    END-IF

*>-- Required: hire_date YYYY-MM-DD
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

*>-- Required: status enum
    IF FUNCTION TRIM(WS-STATUS) = SPACES
        MOVE 'active' TO WS-STATUS
    END-IF
    PERFORM CHECK-STATUS

*>-- All validations passed
    DISPLAY 'RESULT|VALID'
    DISPLAY 'EMPLOYEE_ID|' WITH NO ADVANCING
    DISPLAY FUNCTION TRIM(WS-EMPLOYEE-ID)
    DISPLAY 'FULL_NAME|'   WITH NO ADVANCING
    DISPLAY FUNCTION TRIM(WS-FULL-NAME)
    DISPLAY 'EMAIL|'       WITH NO ADVANCING
    DISPLAY FUNCTION TRIM(WS-EMAIL)
    DISPLAY 'PHONE|'       WITH NO ADVANCING
    DISPLAY FUNCTION TRIM(WS-PHONE)
    DISPLAY 'DEPARTMENT|'  WITH NO ADVANCING
    DISPLAY FUNCTION TRIM(WS-DEPARTMENT)
    DISPLAY 'POSITION|'    WITH NO ADVANCING
    DISPLAY FUNCTION TRIM(WS-POSITION)
    DISPLAY 'SALARY|'      WITH NO ADVANCING
    DISPLAY FUNCTION TRIM(WS-SALARY-STR)
    DISPLAY 'HIRE_DATE|'   WITH NO ADVANCING
    DISPLAY FUNCTION TRIM(WS-HIRE-DATE)
    DISPLAY 'STATUS|'      WITH NO ADVANCING
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

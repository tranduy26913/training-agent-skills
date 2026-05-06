IDENTIFICATION DIVISION.
PROGRAM-ID. EMP-DELETE.
AUTHOR. COBOL-CGI.
*>================================================================
*> EMP-DELETE  EValidate employee delete request
*>
*> Input protocol (stdin from Node.js CGI runner):
*>   EMPLOYEE_ID|<id>
*>   END
*>
*> Output on error:
*>   STATUS|ERROR
*>   CODE|VALIDATION_ERROR
*>   FIELD|id
*>   MESSAGE|<message>
*>
*> Output on success:
*>   STATUS|VALID
*>   EMPLOYEE_ID|<id>
*>
*> The CGI runner performs the actual existence check in MySQL
*> and executes the DELETE statement after receiving STATUS|VALID.
*>================================================================
ENVIRONMENT DIVISION.
CONFIGURATION SECTION.

DATA DIVISION.
WORKING-STORAGE SECTION.

01  WS-LINE              PIC X(100)  VALUE SPACES.
01  WS-KEY               PIC X(30)   VALUE SPACES.
01  WS-VALUE             PIC X(20)   VALUE SPACES.
01  WS-EOF-FLAG          PIC X       VALUE 'N'.
01  WS-EMPLOYEE-ID       PIC X(10)   VALUE SPACES.

*> Validate that ID is a positive integer using NUMVAL
01  WS-ID-NUMERIC        PIC 9(10)   VALUE 0.

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
    IF WS-KEY = 'EMPLOYEE_ID'
        MOVE FUNCTION TRIM(WS-VALUE) TO WS-EMPLOYEE-ID
    END-IF.

VALIDATE-INPUT.
*>-- Required: employee_id must not be blank
    IF FUNCTION TRIM(WS-EMPLOYEE-ID) = SPACES
        DISPLAY 'RESULT|ERROR'
        DISPLAY 'CODE|VALIDATION_ERROR'
        DISPLAY 'FIELD|id'
        DISPLAY 'MESSAGE|employee id is required'
        STOP RUN
    END-IF

*>-- employee_id must be a positive integer
    MOVE FUNCTION NUMVAL(FUNCTION TRIM(WS-EMPLOYEE-ID))
        TO WS-ID-NUMERIC
    IF WS-ID-NUMERIC <= 0
        DISPLAY 'RESULT|ERROR'
        DISPLAY 'CODE|VALIDATION_ERROR'
        DISPLAY 'FIELD|id'
        DISPLAY 'MESSAGE|employee id must be a positive integer'
        STOP RUN
    END-IF

*>-- Validation passed  ECGI runner will check existence and delete
    DISPLAY 'RESULT|VALID'
    DISPLAY 'EMPLOYEE_ID|' WITH NO ADVANCING
    DISPLAY FUNCTION TRIM(WS-EMPLOYEE-ID)
    .

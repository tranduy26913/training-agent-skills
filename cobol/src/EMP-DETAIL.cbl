IDENTIFICATION DIVISION.
PROGRAM-ID. EMP-DETAIL.
AUTHOR. COBOL-CGI.
*>================================================================
*> EMP-DETAIL — Get single employee by ID
*>
*> Input protocol (stdin from Node.js CGI runner):
*>   RECORD|<id>|<code>|<name>|<email>|<phone>|<dept>|<pos>|<salary>|<hire_date>|<status>|<created_at>|<updated_at>
*>   -OR-
*>   NOT_FOUND
*>
*> Output (stdout → JSON):
*>   {"status":"OK","data":{...employee...}}
*>   -OR-
*>   {"status":"ERROR","code":"NOT_FOUND","message":"Employee not found"}
*>================================================================
ENVIRONMENT DIVISION.
CONFIGURATION SECTION.

DATA DIVISION.
WORKING-STORAGE SECTION.

01  WS-LINE              PIC X(800)  VALUE SPACES.
01  WS-LINE-TYPE         PIC X(10)   VALUE SPACES.
01  WS-EOF-FLAG          PIC X       VALUE 'N'.

COPY EMP-RECORD.

PROCEDURE DIVISION.
MAIN-PARA.
    ACCEPT WS-LINE FROM CONSOLE
    EVALUATE TRUE
        WHEN WS-LINE(1:9) = 'NOT_FOUND'
            DISPLAY '{"status":"ERROR","code":"NOT_FOUND",'
            DISPLAY '"message":"Employee not found"}'
        WHEN WS-LINE(1:7) = 'RECORD|'
            PERFORM OUTPUT-EMPLOYEE
        WHEN OTHER
            DISPLAY '{"status":"ERROR","code":"DB_ERROR",'
            DISPLAY '"message":"Unexpected input from CGI runner"}'
    END-EVALUATE
    STOP RUN.

OUTPUT-EMPLOYEE.
    INITIALIZE WS-EMPLOYEE
    UNSTRING WS-LINE DELIMITED BY '|'
        INTO WS-LINE-TYPE
            WS-EMP-ID
            WS-EMP-CODE
            WS-FULL-NAME
            WS-EMAIL
            WS-PHONE
            WS-DEPARTMENT
            WS-POSITION
            WS-SALARY-STR
            WS-HIRE-DATE
            WS-STATUS
            WS-CREATED-AT
            WS-UPDATED-AT
    END-UNSTRING
    DISPLAY '{"status":"OK","data":{'           WITH NO ADVANCING
    DISPLAY '"id":'                             WITH NO ADVANCING
    DISPLAY FUNCTION TRIM(WS-EMP-ID)            WITH NO ADVANCING
    DISPLAY ',"employee_code":"'                WITH NO ADVANCING
    DISPLAY FUNCTION TRIM(WS-EMP-CODE)          WITH NO ADVANCING
    DISPLAY '"'                                 WITH NO ADVANCING
    DISPLAY ',"full_name":"'                    WITH NO ADVANCING
    DISPLAY FUNCTION TRIM(WS-FULL-NAME)         WITH NO ADVANCING
    DISPLAY '"'                                 WITH NO ADVANCING
    DISPLAY ',"email":"'                        WITH NO ADVANCING
    DISPLAY FUNCTION TRIM(WS-EMAIL)             WITH NO ADVANCING
    DISPLAY '"'                                 WITH NO ADVANCING
    DISPLAY ',"phone":"'                        WITH NO ADVANCING
    DISPLAY FUNCTION TRIM(WS-PHONE)             WITH NO ADVANCING
    DISPLAY '"'                                 WITH NO ADVANCING
    DISPLAY ',"department":"'                   WITH NO ADVANCING
    DISPLAY FUNCTION TRIM(WS-DEPARTMENT)        WITH NO ADVANCING
    DISPLAY '"'                                 WITH NO ADVANCING
    DISPLAY ',"position":"'                     WITH NO ADVANCING
    DISPLAY FUNCTION TRIM(WS-POSITION)          WITH NO ADVANCING
    DISPLAY '"'                                 WITH NO ADVANCING
    DISPLAY ',"salary":'                        WITH NO ADVANCING
    DISPLAY FUNCTION TRIM(WS-SALARY-STR)        WITH NO ADVANCING
    DISPLAY ',"hire_date":"'                    WITH NO ADVANCING
    DISPLAY FUNCTION TRIM(WS-HIRE-DATE)         WITH NO ADVANCING
    DISPLAY '"'                                 WITH NO ADVANCING
    DISPLAY ',"status":"'                       WITH NO ADVANCING
    DISPLAY FUNCTION TRIM(WS-STATUS)            WITH NO ADVANCING
    DISPLAY '"'                                 WITH NO ADVANCING
    DISPLAY ',"created_at":"'                   WITH NO ADVANCING
    DISPLAY FUNCTION TRIM(WS-CREATED-AT)        WITH NO ADVANCING
    DISPLAY '"'                                 WITH NO ADVANCING
    DISPLAY ',"updated_at":"'                   WITH NO ADVANCING
    DISPLAY FUNCTION TRIM(WS-UPDATED-AT)        WITH NO ADVANCING
    DISPLAY '"}}'
    .

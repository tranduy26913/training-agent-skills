IDENTIFICATION DIVISION.
PROGRAM-ID. EMP-LIST.
AUTHOR. COBOL-CGI.
*>================================================================
*> EMP-LIST — List employees with pagination
*>
*> Input protocol (stdin from Node.js CGI runner):
*>   HEADER|<page>|<limit>|<total>|<pages>
*>   RECORD|<id>|<code>|<name>|<email>|<phone>|<dept>|<pos>|<salary>|<hire_date>|<status>|<created_at>|<updated_at>
*>   ... (0 or more RECORD lines)
*>   EOF
*>
*> Output (stdout → JSON):
*>   {"status":"OK","data":[...],"pagination":{"page":N,...}}
*>================================================================
ENVIRONMENT DIVISION.
CONFIGURATION SECTION.

DATA DIVISION.
WORKING-STORAGE SECTION.

*> Input line buffer (must fit longest RECORD line)
01  WS-LINE              PIC X(800)  VALUE SPACES.
01  WS-LINE-TYPE         PIC X(10)   VALUE SPACES.

*> Pagination fields extracted from HEADER line
01  WS-PAGE-STR          PIC X(10)   VALUE SPACES.
01  WS-LIMIT-STR         PIC X(10)   VALUE SPACES.
01  WS-TOTAL-STR         PIC X(12)   VALUE SPACES.
01  WS-PAGES-STR         PIC X(12)   VALUE SPACES.

*> Shared employee fields (copybook)
COPY EMP-RECORD.

*> Control flags
01  WS-FIRST-RECORD      PIC X       VALUE 'Y'.
01  WS-EOF-FLAG          PIC X       VALUE 'N'.

PROCEDURE DIVISION.
MAIN-PARA.
    DISPLAY '{"status":"OK","data":['
    PERFORM READ-LOOP UNTIL WS-EOF-FLAG = 'Y'
    DISPLAY '],"pagination":{"page":' WITH NO ADVANCING
    DISPLAY FUNCTION TRIM(WS-PAGE-STR)   WITH NO ADVANCING
    DISPLAY ',"limit":'                  WITH NO ADVANCING
    DISPLAY FUNCTION TRIM(WS-LIMIT-STR)  WITH NO ADVANCING
    DISPLAY ',"total":'                  WITH NO ADVANCING
    DISPLAY FUNCTION TRIM(WS-TOTAL-STR)  WITH NO ADVANCING
    DISPLAY ',"pages":'                  WITH NO ADVANCING
    DISPLAY FUNCTION TRIM(WS-PAGES-STR)  WITH NO ADVANCING
    DISPLAY '}}'
    STOP RUN.

READ-LOOP.
    ACCEPT WS-LINE FROM CONSOLE
    IF WS-LINE = SPACES
        MOVE 'Y' TO WS-EOF-FLAG
        EXIT PARAGRAPH
    END-IF
    EVALUATE TRUE
        WHEN WS-LINE(1:7) = 'HEADER|'
            PERFORM PARSE-HEADER
        WHEN WS-LINE(1:7) = 'RECORD|'
            PERFORM PROCESS-RECORD
        WHEN WS-LINE(1:3) = 'EOF'
            MOVE 'Y' TO WS-EOF-FLAG
    END-EVALUATE.

PARSE-HEADER.
    UNSTRING WS-LINE DELIMITED BY '|'
        INTO WS-LINE-TYPE
            WS-PAGE-STR
            WS-LIMIT-STR
            WS-TOTAL-STR
            WS-PAGES-STR
    END-UNSTRING.

PROCESS-RECORD.
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
    IF WS-FIRST-RECORD = 'N'
        DISPLAY ',' WITH NO ADVANCING
    END-IF
    MOVE 'N' TO WS-FIRST-RECORD
    DISPLAY '{'                                WITH NO ADVANCING
    DISPLAY '"id":'                            WITH NO ADVANCING
    DISPLAY FUNCTION TRIM(WS-EMP-ID)           WITH NO ADVANCING
    DISPLAY ',"employee_code":"'               WITH NO ADVANCING
    DISPLAY FUNCTION TRIM(WS-EMP-CODE)         WITH NO ADVANCING
    DISPLAY '"'                                WITH NO ADVANCING
    DISPLAY ',"full_name":"'                   WITH NO ADVANCING
    DISPLAY FUNCTION TRIM(WS-FULL-NAME)        WITH NO ADVANCING
    DISPLAY '"'                                WITH NO ADVANCING
    DISPLAY ',"email":"'                       WITH NO ADVANCING
    DISPLAY FUNCTION TRIM(WS-EMAIL)            WITH NO ADVANCING
    DISPLAY '"'                                WITH NO ADVANCING
    DISPLAY ',"phone":"'                       WITH NO ADVANCING
    DISPLAY FUNCTION TRIM(WS-PHONE)            WITH NO ADVANCING
    DISPLAY '"'                                WITH NO ADVANCING
    DISPLAY ',"department":"'                  WITH NO ADVANCING
    DISPLAY FUNCTION TRIM(WS-DEPARTMENT)       WITH NO ADVANCING
    DISPLAY '"'                                WITH NO ADVANCING
    DISPLAY ',"position":"'                    WITH NO ADVANCING
    DISPLAY FUNCTION TRIM(WS-POSITION)         WITH NO ADVANCING
    DISPLAY '"'                                WITH NO ADVANCING
    DISPLAY ',"salary":'                       WITH NO ADVANCING
    DISPLAY FUNCTION TRIM(WS-SALARY-STR)       WITH NO ADVANCING
    DISPLAY ',"hire_date":"'                   WITH NO ADVANCING
    DISPLAY FUNCTION TRIM(WS-HIRE-DATE)        WITH NO ADVANCING
    DISPLAY '"'                                WITH NO ADVANCING
    DISPLAY ',"status":"'                      WITH NO ADVANCING
    DISPLAY FUNCTION TRIM(WS-STATUS)           WITH NO ADVANCING
    DISPLAY '"'                                WITH NO ADVANCING
    DISPLAY ',"created_at":"'                  WITH NO ADVANCING
    DISPLAY FUNCTION TRIM(WS-CREATED-AT)       WITH NO ADVANCING
    DISPLAY '"'                                WITH NO ADVANCING
    DISPLAY ',"updated_at":"'                  WITH NO ADVANCING
    DISPLAY FUNCTION TRIM(WS-UPDATED-AT)       WITH NO ADVANCING
    DISPLAY '"}'
    .

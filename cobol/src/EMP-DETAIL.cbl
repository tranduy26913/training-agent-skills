      *> EMP-DETAIL.cbl - Get one employee by ID
      *> CGI program: reads QUERY_STRING id param, queries MySQL, outputs JSON
      *> Called via: GET /cgi-bin/emp-detail.exe?id=1
       IDENTIFICATION DIVISION.
       PROGRAM-ID. EMP-DETAIL.
       AUTHOR. Training Team.

       ENVIRONMENT DIVISION.
       CONFIGURATION SECTION.

       DATA DIVISION.
       WORKING-STORAGE SECTION.

      *> Shared DB connection variables
       COPY DB-VARS.

      *> Query string parameter parsing
       01 WS-PARAM-KEY            PIC X(50)     VALUE SPACES.
       01 WS-PARAM-VALUE          PIC X(500)    VALUE SPACES.
       01 WS-PARSE-STATUS         PIC S9(9) COMP-5 VALUE 0.

      *> ID parameter
       01 WS-ID-NUM               PIC 9(10)     VALUE 0.
       01 WS-ID-STR               PIC X(12)     VALUE SPACES.

      *> SQL
       01 WS-SQL                  PIC X(500)    VALUE SPACES.

      *> Query result
       01 WS-EXEC-STATUS          PIC S9(9) COMP-5 VALUE 0.
       01 WS-FETCH-STATUS         PIC S9(9) COMP-5 VALUE 0.

      *> Column fetch
       01 WS-COL-BUF              PIC X(1000)   VALUE SPACES.
       01 WS-COL-BUF-LEN          PIC S9(9) COMP-5 VALUE 1000.
       01 WS-COL-IDX              PIC S9(9) COMP-5 VALUE 0.
       01 WS-COL-STATUS           PIC S9(9) COMP-5 VALUE 0.

      *> Employee fields
       01 WS-F-ID                 PIC X(12)     VALUE SPACES.
       01 WS-F-CODE               PIC X(20)     VALUE SPACES.
       01 WS-F-NAME               PIC X(100)    VALUE SPACES.
       01 WS-F-EMAIL              PIC X(255)    VALUE SPACES.
       01 WS-F-PHONE              PIC X(20)     VALUE SPACES.
       01 WS-F-DEPT               PIC X(20)     VALUE SPACES.
       01 WS-F-POS                PIC X(30)     VALUE SPACES.
       01 WS-F-SALARY             PIC X(20)     VALUE SPACES.
       01 WS-F-HIRE               PIC X(10)     VALUE SPACES.
       01 WS-F-STATUS             PIC X(10)     VALUE SPACES.
       01 WS-F-CREATED            PIC X(24)     VALUE SPACES.
       01 WS-F-UPDATED            PIC X(24)     VALUE SPACES.

      *> JSON-escaped buffers
       01 WS-J-NAME               PIC X(200)    VALUE SPACES.
       01 WS-J-NAME-LEN           PIC S9(9) COMP-5 VALUE 200.
       01 WS-J-EMAIL              PIC X(510)    VALUE SPACES.
       01 WS-J-EMAIL-LEN          PIC S9(9) COMP-5 VALUE 510.
       01 WS-J-PHONE              PIC X(40)     VALUE SPACES.
       01 WS-J-PHONE-LEN          PIC S9(9) COMP-5 VALUE 40.

      *> Helpers
       01 WS-STRLEN               PIC S9(9) COMP-5 VALUE 0.
       01 WS-LONG-VAL             PIC S9(9) COMP-5 VALUE 0.
       01 WS-NUM-BUF              PIC X(20)     VALUE SPACES.
       01 WS-NUM-BUF-LEN          PIC S9(9) COMP-5 VALUE 20.

       PROCEDURE DIVISION.
       MAIN-LOGIC.
           PERFORM PRINT-CGI-HEADERS
           PERFORM GET-ENV-VARS
           PERFORM CONNECT-DATABASE
           IF WS-DB-STATUS NOT = 0
               PERFORM OUTPUT-DB-ERROR
               STOP RUN
           END-IF
           PERFORM PARSE-ID-PARAM
           IF WS-ID-NUM = 0
               DISPLAY '{"status":"ERROR","code":"VALIDATION_ERROR",'
                   NO ADVANCING
               DISPLAY '"message":"id parameter is required"}'
               PERFORM DISCONNECT-DATABASE
               STOP RUN
           END-IF
           PERFORM QUERY-EMPLOYEE
           PERFORM DISCONNECT-DATABASE
           STOP RUN.

       PRINT-CGI-HEADERS.
           DISPLAY "Content-Type: application/json"
           DISPLAY "".

       COPY DB-PROCS.

       PARSE-ID-PARAM.
           MOVE "id                " TO WS-PARAM-KEY
           CALL "parse_qparam" USING BY REFERENCE WS-QUERY-STRING
               BY REFERENCE WS-PARAM-KEY
               BY REFERENCE WS-PARAM-VALUE
               BY REFERENCE WS-PARSE-STATUS
           IF WS-PARSE-STATUS = 0 AND WS-PARAM-VALUE NOT = SPACES
               MOVE FUNCTION NUMVAL(
                   FUNCTION TRIM(WS-PARAM-VALUE TRAILING))
                   TO WS-ID-NUM
           END-IF

           MOVE WS-ID-NUM TO WS-LONG-VAL
           MOVE 20 TO WS-NUM-BUF-LEN
           CALL "format_long_str" USING BY REFERENCE WS-LONG-VAL
               BY REFERENCE WS-ID-STR BY REFERENCE WS-NUM-BUF-LEN.

       QUERY-EMPLOYEE.
           STRING
               "SELECT id, employee_code, full_name, email, "
               DELIMITED SIZE
               "phone, department, position, salary, "
               DELIMITED SIZE
               "hire_date, status, created_at, updated_at "
               DELIMITED SIZE
               "FROM employees WHERE id = "
               DELIMITED SIZE
               FUNCTION TRIM(WS-ID-STR TRAILING) DELIMITED SIZE
               " LIMIT 1"
               DELIMITED SIZE
               INTO WS-SQL

           CALL "mysql_exec_query" USING
               BY REFERENCE WS-SQL
               BY REFERENCE WS-EXEC-STATUS

           IF WS-EXEC-STATUS NOT = 0
               PERFORM OUTPUT-DB-ERROR
               PERFORM DISCONNECT-DATABASE
               STOP RUN
           END-IF

           CALL "mysql_fetch_next" USING
               BY REFERENCE WS-FETCH-STATUS

           IF WS-FETCH-STATUS NOT = 0
               DISPLAY '{"status":"ERROR","code":"NOT_FOUND",'
                   NO ADVANCING
               DISPLAY '"message":"Employee not found"}'
               PERFORM DISCONNECT-DATABASE
               STOP RUN
           END-IF

           PERFORM FETCH-ALL-COLUMNS
           PERFORM OUTPUT-EMPLOYEE-JSON.

       FETCH-ALL-COLUMNS.
           MOVE 0 TO WS-COL-IDX
           CALL "mysql_get_col_val" USING BY REFERENCE WS-COL-IDX
               BY REFERENCE WS-COL-BUF BY REFERENCE WS-COL-BUF-LEN
               BY REFERENCE WS-COL-STATUS
           MOVE FUNCTION TRIM(WS-COL-BUF TRAILING) TO WS-F-ID

           MOVE 1 TO WS-COL-IDX
           CALL "mysql_get_col_val" USING BY REFERENCE WS-COL-IDX
               BY REFERENCE WS-COL-BUF BY REFERENCE WS-COL-BUF-LEN
               BY REFERENCE WS-COL-STATUS
           MOVE FUNCTION TRIM(WS-COL-BUF TRAILING) TO WS-F-CODE

           MOVE 2 TO WS-COL-IDX
           CALL "mysql_get_col_val" USING BY REFERENCE WS-COL-IDX
               BY REFERENCE WS-COL-BUF BY REFERENCE WS-COL-BUF-LEN
               BY REFERENCE WS-COL-STATUS
           MOVE FUNCTION TRIM(WS-COL-BUF TRAILING) TO WS-F-NAME
           MOVE FUNCTION LENGTH(FUNCTION TRIM(WS-F-NAME TRAILING))
               TO WS-STRLEN
           MOVE 200 TO WS-J-NAME-LEN
           CALL "json_escape_str" USING
               BY REFERENCE WS-F-NAME BY REFERENCE WS-STRLEN
               BY REFERENCE WS-J-NAME BY REFERENCE WS-J-NAME-LEN

           MOVE 3 TO WS-COL-IDX
           CALL "mysql_get_col_val" USING BY REFERENCE WS-COL-IDX
               BY REFERENCE WS-COL-BUF BY REFERENCE WS-COL-BUF-LEN
               BY REFERENCE WS-COL-STATUS
           MOVE FUNCTION TRIM(WS-COL-BUF TRAILING) TO WS-F-EMAIL
           MOVE FUNCTION LENGTH(FUNCTION TRIM(WS-F-EMAIL TRAILING))
               TO WS-STRLEN
           MOVE 510 TO WS-J-EMAIL-LEN
           CALL "json_escape_str" USING
               BY REFERENCE WS-F-EMAIL BY REFERENCE WS-STRLEN
               BY REFERENCE WS-J-EMAIL BY REFERENCE WS-J-EMAIL-LEN

           MOVE 4 TO WS-COL-IDX
           CALL "mysql_get_col_val" USING BY REFERENCE WS-COL-IDX
               BY REFERENCE WS-COL-BUF BY REFERENCE WS-COL-BUF-LEN
               BY REFERENCE WS-COL-STATUS
           IF WS-COL-STATUS = 0
               MOVE FUNCTION TRIM(WS-COL-BUF TRAILING) TO WS-F-PHONE
               MOVE FUNCTION LENGTH(FUNCTION TRIM(WS-F-PHONE TRAILING))
                   TO WS-STRLEN
               MOVE 40 TO WS-J-PHONE-LEN
               CALL "json_escape_str" USING
                   BY REFERENCE WS-F-PHONE BY REFERENCE WS-STRLEN
                   BY REFERENCE WS-J-PHONE BY REFERENCE WS-J-PHONE-LEN
           ELSE
               MOVE SPACES TO WS-F-PHONE
           END-IF

           MOVE 5 TO WS-COL-IDX
           CALL "mysql_get_col_val" USING BY REFERENCE WS-COL-IDX
               BY REFERENCE WS-COL-BUF BY REFERENCE WS-COL-BUF-LEN
               BY REFERENCE WS-COL-STATUS
           MOVE FUNCTION TRIM(WS-COL-BUF TRAILING) TO WS-F-DEPT

           MOVE 6 TO WS-COL-IDX
           CALL "mysql_get_col_val" USING BY REFERENCE WS-COL-IDX
               BY REFERENCE WS-COL-BUF BY REFERENCE WS-COL-BUF-LEN
               BY REFERENCE WS-COL-STATUS
           MOVE FUNCTION TRIM(WS-COL-BUF TRAILING) TO WS-F-POS

           MOVE 7 TO WS-COL-IDX
           CALL "mysql_get_col_val" USING BY REFERENCE WS-COL-IDX
               BY REFERENCE WS-COL-BUF BY REFERENCE WS-COL-BUF-LEN
               BY REFERENCE WS-COL-STATUS
           MOVE FUNCTION TRIM(WS-COL-BUF TRAILING) TO WS-F-SALARY

           MOVE 8 TO WS-COL-IDX
           CALL "mysql_get_col_val" USING BY REFERENCE WS-COL-IDX
               BY REFERENCE WS-COL-BUF BY REFERENCE WS-COL-BUF-LEN
               BY REFERENCE WS-COL-STATUS
           MOVE FUNCTION TRIM(WS-COL-BUF TRAILING) TO WS-F-HIRE

           MOVE 9 TO WS-COL-IDX
           CALL "mysql_get_col_val" USING BY REFERENCE WS-COL-IDX
               BY REFERENCE WS-COL-BUF BY REFERENCE WS-COL-BUF-LEN
               BY REFERENCE WS-COL-STATUS
           MOVE FUNCTION TRIM(WS-COL-BUF TRAILING) TO WS-F-STATUS

           MOVE 10 TO WS-COL-IDX
           CALL "mysql_get_col_val" USING BY REFERENCE WS-COL-IDX
               BY REFERENCE WS-COL-BUF BY REFERENCE WS-COL-BUF-LEN
               BY REFERENCE WS-COL-STATUS
           MOVE FUNCTION TRIM(WS-COL-BUF TRAILING) TO WS-F-CREATED

           MOVE 11 TO WS-COL-IDX
           CALL "mysql_get_col_val" USING BY REFERENCE WS-COL-IDX
               BY REFERENCE WS-COL-BUF BY REFERENCE WS-COL-BUF-LEN
               BY REFERENCE WS-COL-STATUS
           MOVE FUNCTION TRIM(WS-COL-BUF TRAILING) TO WS-F-UPDATED.

       OUTPUT-EMPLOYEE-JSON.
           DISPLAY '{"status":"OK","data":{' NO ADVANCING
           DISPLAY '"id":' NO ADVANCING
           DISPLAY FUNCTION TRIM(WS-F-ID TRAILING) NO ADVANCING
           DISPLAY ',"employee_code":"' NO ADVANCING
           DISPLAY FUNCTION TRIM(WS-F-CODE TRAILING) NO ADVANCING
           DISPLAY '","full_name":"' NO ADVANCING
           DISPLAY FUNCTION TRIM(WS-J-NAME TRAILING) NO ADVANCING
           DISPLAY '","email":"' NO ADVANCING
           DISPLAY FUNCTION TRIM(WS-J-EMAIL TRAILING) NO ADVANCING
           IF WS-F-PHONE = SPACES
               DISPLAY '","phone":null' NO ADVANCING
           ELSE
               DISPLAY '","phone":"' NO ADVANCING
               DISPLAY FUNCTION TRIM(WS-J-PHONE TRAILING) NO ADVANCING
               DISPLAY '"' NO ADVANCING
           END-IF
           DISPLAY ',"department":"' NO ADVANCING
           DISPLAY FUNCTION TRIM(WS-F-DEPT TRAILING) NO ADVANCING
           DISPLAY '","position":"' NO ADVANCING
           DISPLAY FUNCTION TRIM(WS-F-POS TRAILING) NO ADVANCING
           DISPLAY '","salary":' NO ADVANCING
           DISPLAY FUNCTION TRIM(WS-F-SALARY TRAILING) NO ADVANCING
           DISPLAY ',"hire_date":"' NO ADVANCING
           DISPLAY FUNCTION TRIM(WS-F-HIRE TRAILING) NO ADVANCING
           DISPLAY '","status":"' NO ADVANCING
           DISPLAY FUNCTION TRIM(WS-F-STATUS TRAILING) NO ADVANCING
           DISPLAY '","created_at":"' NO ADVANCING
           DISPLAY FUNCTION TRIM(WS-F-CREATED TRAILING) NO ADVANCING
           DISPLAY '","updated_at":"' NO ADVANCING
           DISPLAY FUNCTION TRIM(WS-F-UPDATED TRAILING) NO ADVANCING
           DISPLAY '"}}'.

       END PROGRAM EMP-DETAIL.

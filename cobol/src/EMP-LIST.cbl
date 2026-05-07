      *> EMP-LIST.cbl - List employees with pagination and filtering
      *> CGI program: reads QUERY_STRING, queries MySQL, outputs JSON
      *> Called via: GET /cgi-bin/emp-list.exe?page=1&limit=10&...
       IDENTIFICATION DIVISION.
       PROGRAM-ID. EMP-LIST.
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

      *> Filter parameters (URL-decoded)
       01 WS-SEARCH               PIC X(100)    VALUE SPACES.
       01 WS-SEARCH-ESC           PIC X(200)    VALUE SPACES.
       01 WS-SEARCH-ESC-LEN       PIC S9(9) COMP-5 VALUE 200.
       01 WS-DEPT                 PIC X(20)     VALUE SPACES.
       01 WS-DEPT-ESC             PIC X(40)     VALUE SPACES.
       01 WS-DEPT-ESC-LEN         PIC S9(9) COMP-5 VALUE 40.
       01 WS-STATUS-FILTER        PIC X(10)     VALUE SPACES.
       01 WS-STATUS-ESC           PIC X(20)     VALUE SPACES.
       01 WS-STATUS-ESC-LEN       PIC S9(9) COMP-5 VALUE 20.
       01 WS-PAGE-NUM             PIC 9(5)      VALUE 1.
       01 WS-LIMIT-NUM            PIC 9(3)      VALUE 10.
       01 WS-OFFSET-NUM           PIC 9(10)     VALUE 0.

      *> SQL buffers
       01 WS-SQL                  PIC X(3000)   VALUE SPACES.
       01 WS-SQL-COUNT            PIC X(3000)   VALUE SPACES.
       01 WS-SQL-PTR              PIC S9(9) COMP-5 VALUE 1.
       01 WS-SQL-COUNT-PTR        PIC S9(9) COMP-5 VALUE 1.

      *> Result tracking
       01 WS-EXEC-STATUS          PIC S9(9) COMP-5 VALUE 0.
       01 WS-FETCH-STATUS         PIC S9(9) COMP-5 VALUE 0.
       01 WS-TOTAL-COUNT          PIC 9(10)     VALUE 0.
       01 WS-PAGES-NUM            PIC 9(5)      VALUE 0.
       01 WS-FIRST-ROW            PIC 9         VALUE 1.

      *> Column fetch buffer
       01 WS-COL-BUF              PIC X(1000)   VALUE SPACES.
       01 WS-COL-BUF-LEN          PIC S9(9) COMP-5 VALUE 1000.
       01 WS-COL-IDX              PIC S9(9) COMP-5 VALUE 0.
       01 WS-COL-STATUS           PIC S9(9) COMP-5 VALUE 0.

      *> Employee field strings for current row
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

      *> JSON-escaped string buffers
       01 WS-J-NAME               PIC X(200)    VALUE SPACES.
       01 WS-J-NAME-LEN           PIC S9(9) COMP-5 VALUE 200.
       01 WS-J-EMAIL              PIC X(510)    VALUE SPACES.
       01 WS-J-EMAIL-LEN          PIC S9(9) COMP-5 VALUE 510.
       01 WS-J-PHONE              PIC X(40)     VALUE SPACES.
       01 WS-J-PHONE-LEN          PIC S9(9) COMP-5 VALUE 40.

      *> Helpers
       01 WS-NUM-BUF              PIC X(20)     VALUE SPACES.
       01 WS-NUM-BUF-LEN          PIC S9(9) COMP-5 VALUE 20.
       01 WS-LONG-VAL             PIC S9(9) COMP-5 VALUE 0.
       01 WS-STRLEN               PIC S9(9) COMP-5 VALUE 0.
       01 WS-ESC-STATUS           PIC S9(9) COMP-5 VALUE 0.
       01 WS-SEARCH-LEN           PIC S9(9) COMP-5 VALUE 0.
       01 WS-DEPT-LEN             PIC S9(9) COMP-5 VALUE 0.
       01 WS-STATUS-LEN           PIC S9(9) COMP-5 VALUE 0.

       PROCEDURE DIVISION.
       MAIN-LOGIC.
           PERFORM PRINT-CGI-HEADERS
           PERFORM GET-ENV-VARS
           PERFORM CONNECT-DATABASE
           IF WS-DB-STATUS NOT = 0
               PERFORM OUTPUT-DB-ERROR
               STOP RUN
           END-IF
           PERFORM PARSE-PARAMS
           PERFORM ESCAPE-FILTER-PARAMS
           PERFORM GET-TOTAL-COUNT
           PERFORM FETCH-AND-OUTPUT-EMPLOYEES
           PERFORM DISCONNECT-DATABASE
           STOP RUN.

       PRINT-CGI-HEADERS.
           DISPLAY "Content-Type: application/json"
           DISPLAY "".

       COPY DB-PROCS.

       PARSE-PARAMS.
           MOVE "page              " TO WS-PARAM-KEY
           CALL "parse_qparam" USING BY REFERENCE WS-QUERY-STRING
               BY REFERENCE WS-PARAM-KEY
               BY REFERENCE WS-PARAM-VALUE
               BY REFERENCE WS-PARSE-STATUS
           IF WS-PARSE-STATUS = 0 AND WS-PARAM-VALUE NOT = SPACES
               MOVE FUNCTION NUMVAL(
                   FUNCTION TRIM(WS-PARAM-VALUE TRAILING))
                   TO WS-PAGE-NUM
               IF WS-PAGE-NUM < 1
                   MOVE 1 TO WS-PAGE-NUM
               END-IF
           END-IF

           MOVE "limit             " TO WS-PARAM-KEY
           CALL "parse_qparam" USING BY REFERENCE WS-QUERY-STRING
               BY REFERENCE WS-PARAM-KEY
               BY REFERENCE WS-PARAM-VALUE
               BY REFERENCE WS-PARSE-STATUS
           IF WS-PARSE-STATUS = 0 AND WS-PARAM-VALUE NOT = SPACES
               MOVE FUNCTION NUMVAL(
                   FUNCTION TRIM(WS-PARAM-VALUE TRAILING))
                   TO WS-LIMIT-NUM
               IF WS-LIMIT-NUM < 1
                   MOVE 10 TO WS-LIMIT-NUM
               END-IF
               IF WS-LIMIT-NUM > 100
                   MOVE 100 TO WS-LIMIT-NUM
               END-IF
           END-IF

           MOVE "search            " TO WS-PARAM-KEY
           CALL "parse_qparam" USING BY REFERENCE WS-QUERY-STRING
               BY REFERENCE WS-PARAM-KEY
               BY REFERENCE WS-PARAM-VALUE
               BY REFERENCE WS-PARSE-STATUS
           IF WS-PARSE-STATUS = 0
               MOVE FUNCTION TRIM(WS-PARAM-VALUE TRAILING) TO WS-SEARCH
           END-IF

           MOVE "department        " TO WS-PARAM-KEY
           CALL "parse_qparam" USING BY REFERENCE WS-QUERY-STRING
               BY REFERENCE WS-PARAM-KEY
               BY REFERENCE WS-PARAM-VALUE
               BY REFERENCE WS-PARSE-STATUS
           IF WS-PARSE-STATUS = 0
               MOVE FUNCTION TRIM(WS-PARAM-VALUE TRAILING) TO WS-DEPT
           END-IF

           MOVE "status            " TO WS-PARAM-KEY
           CALL "parse_qparam" USING BY REFERENCE WS-QUERY-STRING
               BY REFERENCE WS-PARAM-KEY
               BY REFERENCE WS-PARAM-VALUE
               BY REFERENCE WS-PARSE-STATUS
           IF WS-PARSE-STATUS = 0
               MOVE FUNCTION TRIM(WS-PARAM-VALUE TRAILING)
                   TO WS-STATUS-FILTER
           END-IF

           COMPUTE WS-OFFSET-NUM = (WS-PAGE-NUM - 1) * WS-LIMIT-NUM.

       ESCAPE-FILTER-PARAMS.
           IF WS-SEARCH NOT = SPACES
               MOVE FUNCTION LENGTH(
                   FUNCTION TRIM(WS-SEARCH TRAILING))
                   TO WS-SEARCH-LEN
               CALL "mysql_escape_str" USING
                   BY REFERENCE WS-SEARCH
                   BY REFERENCE WS-SEARCH-LEN
                   BY REFERENCE WS-SEARCH-ESC
                   BY REFERENCE WS-SEARCH-ESC-LEN
                   BY REFERENCE WS-ESC-STATUS
           END-IF

           IF WS-DEPT NOT = SPACES
               MOVE FUNCTION LENGTH(
                   FUNCTION TRIM(WS-DEPT TRAILING))
                   TO WS-DEPT-LEN
               CALL "mysql_escape_str" USING
                   BY REFERENCE WS-DEPT
                   BY REFERENCE WS-DEPT-LEN
                   BY REFERENCE WS-DEPT-ESC
                   BY REFERENCE WS-DEPT-ESC-LEN
                   BY REFERENCE WS-ESC-STATUS
           END-IF

           IF WS-STATUS-FILTER NOT = SPACES
               MOVE FUNCTION LENGTH(
                   FUNCTION TRIM(WS-STATUS-FILTER TRAILING))
                   TO WS-STATUS-LEN
               CALL "mysql_escape_str" USING
                   BY REFERENCE WS-STATUS-FILTER
                   BY REFERENCE WS-STATUS-LEN
                   BY REFERENCE WS-STATUS-ESC
                   BY REFERENCE WS-STATUS-ESC-LEN
                   BY REFERENCE WS-ESC-STATUS
           END-IF.

       BUILD-COUNT-SQL.
           MOVE SPACES TO WS-SQL-COUNT
           MOVE 1 TO WS-SQL-COUNT-PTR
           STRING
               "SELECT COUNT(*) FROM employees WHERE 1=1"
               DELIMITED SIZE
               INTO WS-SQL-COUNT WITH POINTER WS-SQL-COUNT-PTR

           IF WS-SEARCH NOT = SPACES
               STRING
                   " AND (full_name LIKE '%" DELIMITED SIZE
                   FUNCTION TRIM(WS-SEARCH-ESC TRAILING) DELIMITED SIZE
                   "%' OR email LIKE '%" DELIMITED SIZE
                   FUNCTION TRIM(WS-SEARCH-ESC TRAILING) DELIMITED SIZE
                   "%')" DELIMITED SIZE
                   INTO WS-SQL-COUNT WITH POINTER WS-SQL-COUNT-PTR
           END-IF
           IF WS-DEPT NOT = SPACES
               STRING
                   " AND department = '" DELIMITED SIZE
                   FUNCTION TRIM(WS-DEPT-ESC TRAILING) DELIMITED SIZE
                   "'" DELIMITED SIZE
                   INTO WS-SQL-COUNT WITH POINTER WS-SQL-COUNT-PTR
           END-IF
           IF WS-STATUS-FILTER NOT = SPACES
               STRING
                   " AND status = '" DELIMITED SIZE
                   FUNCTION TRIM(WS-STATUS-ESC TRAILING) DELIMITED SIZE
                   "'" DELIMITED SIZE
                   INTO WS-SQL-COUNT WITH POINTER WS-SQL-COUNT-PTR
           END-IF
           MOVE X'00' TO WS-SQL-COUNT(WS-SQL-COUNT-PTR:1).

       GET-TOTAL-COUNT.
           PERFORM BUILD-COUNT-SQL
           CALL "mysql_exec_query" USING
               BY REFERENCE WS-SQL-COUNT
               BY REFERENCE WS-EXEC-STATUS

           MOVE 0 TO WS-TOTAL-COUNT
           IF WS-EXEC-STATUS = 0
               CALL "mysql_fetch_next" USING
                   BY REFERENCE WS-FETCH-STATUS
               IF WS-FETCH-STATUS = 0
                   MOVE 0 TO WS-COL-IDX
                   CALL "mysql_get_col_val" USING
                       BY REFERENCE WS-COL-IDX
                       BY REFERENCE WS-COL-BUF
                       BY REFERENCE WS-COL-BUF-LEN
                       BY REFERENCE WS-COL-STATUS
                   IF WS-COL-STATUS = 0
                       MOVE FUNCTION NUMVAL(
                           FUNCTION TRIM(WS-COL-BUF TRAILING))
                           TO WS-TOTAL-COUNT
                   END-IF
               END-IF
           END-IF

           IF WS-LIMIT-NUM > 0
               COMPUTE WS-PAGES-NUM =
                   (WS-TOTAL-COUNT + WS-LIMIT-NUM - 1)
                   / WS-LIMIT-NUM
           ELSE
               MOVE 1 TO WS-PAGES-NUM
           END-IF.

       FETCH-AND-OUTPUT-EMPLOYEES.
           MOVE SPACES TO WS-SQL
           MOVE 1 TO WS-SQL-PTR
           STRING
               "SELECT id, employee_code, full_name, email, "
               DELIMITED SIZE
               "phone, department, position, salary, "
               DELIMITED SIZE
               "hire_date, status, created_at, updated_at "
               DELIMITED SIZE
               "FROM employees WHERE 1=1"
               DELIMITED SIZE
               INTO WS-SQL WITH POINTER WS-SQL-PTR

           IF WS-SEARCH NOT = SPACES
               STRING
                   " AND (full_name LIKE '%" DELIMITED SIZE
                   FUNCTION TRIM(WS-SEARCH-ESC TRAILING) DELIMITED SIZE
                   "%' OR email LIKE '%" DELIMITED SIZE
                   FUNCTION TRIM(WS-SEARCH-ESC TRAILING) DELIMITED SIZE
                   "%')" DELIMITED SIZE
                   INTO WS-SQL WITH POINTER WS-SQL-PTR
           END-IF
           IF WS-DEPT NOT = SPACES
               STRING
                   " AND department = '" DELIMITED SIZE
                   FUNCTION TRIM(WS-DEPT-ESC TRAILING) DELIMITED SIZE
                   "'" DELIMITED SIZE
                   INTO WS-SQL WITH POINTER WS-SQL-PTR
           END-IF
           IF WS-STATUS-FILTER NOT = SPACES
               STRING
                   " AND status = '" DELIMITED SIZE
                   FUNCTION TRIM(WS-STATUS-ESC TRAILING) DELIMITED SIZE
                   "'" DELIMITED SIZE
                   INTO WS-SQL WITH POINTER WS-SQL-PTR
           END-IF

      *> Append ORDER BY with actual limit value
           MOVE WS-LIMIT-NUM TO WS-LONG-VAL
           MOVE 20 TO WS-NUM-BUF-LEN
           CALL "format_long_str" USING BY REFERENCE WS-LONG-VAL
               BY REFERENCE WS-NUM-BUF BY REFERENCE WS-NUM-BUF-LEN
           STRING
               " ORDER BY id ASC LIMIT "
               DELIMITED SIZE
               FUNCTION TRIM(WS-NUM-BUF TRAILING)
               DELIMITED SIZE
               INTO WS-SQL WITH POINTER WS-SQL-PTR

      *> Append OFFSET
           MOVE WS-OFFSET-NUM TO WS-LONG-VAL
           MOVE 20 TO WS-NUM-BUF-LEN
           CALL "format_long_str" USING BY REFERENCE WS-LONG-VAL
               BY REFERENCE WS-NUM-BUF BY REFERENCE WS-NUM-BUF-LEN
           STRING
               " OFFSET "
               DELIMITED SIZE
               FUNCTION TRIM(WS-NUM-BUF TRAILING)
               DELIMITED SIZE
               INTO WS-SQL WITH POINTER WS-SQL-PTR

           MOVE X'00' TO WS-SQL(WS-SQL-PTR:1)

           MOVE 0 TO WS-FETCH-STATUS
           CALL "mysql_exec_query" USING
               BY REFERENCE WS-SQL
               BY REFERENCE WS-EXEC-STATUS

           IF WS-EXEC-STATUS NOT = 0
               PERFORM OUTPUT-DB-ERROR
               PERFORM DISCONNECT-DATABASE
               STOP RUN
           END-IF

      *> Start JSON response
           MOVE 1 TO WS-FIRST-ROW
           DISPLAY '{"status":"OK","data":[' NO ADVANCING

           PERFORM UNTIL WS-FETCH-STATUS NOT = 0
               CALL "mysql_fetch_next" USING
                   BY REFERENCE WS-FETCH-STATUS
               IF WS-FETCH-STATUS = 0
                   PERFORM OUTPUT-ONE-EMPLOYEE
               END-IF
           END-PERFORM

      *> Pagination metadata
           MOVE WS-TOTAL-COUNT TO WS-LONG-VAL
           MOVE 20 TO WS-NUM-BUF-LEN
           CALL "format_long_str" USING BY REFERENCE WS-LONG-VAL
               BY REFERENCE WS-NUM-BUF BY REFERENCE WS-NUM-BUF-LEN
           MOVE FUNCTION TRIM(WS-NUM-BUF TRAILING) TO WS-F-ID

           MOVE WS-PAGES-NUM TO WS-LONG-VAL
           MOVE 20 TO WS-NUM-BUF-LEN
           CALL "format_long_str" USING BY REFERENCE WS-LONG-VAL
               BY REFERENCE WS-NUM-BUF BY REFERENCE WS-NUM-BUF-LEN
           MOVE FUNCTION TRIM(WS-NUM-BUF TRAILING) TO WS-F-CODE

      *> Format page number as trimmed string (avoid leading zeros)
           MOVE WS-PAGE-NUM TO WS-LONG-VAL
           MOVE 20 TO WS-NUM-BUF-LEN
           CALL "format_long_str" USING BY REFERENCE WS-LONG-VAL
               BY REFERENCE WS-NUM-BUF BY REFERENCE WS-NUM-BUF-LEN
           MOVE FUNCTION TRIM(WS-NUM-BUF TRAILING) TO WS-F-HIRE

      *> Format limit number as trimmed string (avoid leading zeros)
           MOVE WS-LIMIT-NUM TO WS-LONG-VAL
           MOVE 20 TO WS-NUM-BUF-LEN
           CALL "format_long_str" USING BY REFERENCE WS-LONG-VAL
               BY REFERENCE WS-NUM-BUF BY REFERENCE WS-NUM-BUF-LEN
           MOVE FUNCTION TRIM(WS-NUM-BUF TRAILING) TO WS-F-STATUS

           DISPLAY '],"pagination":{' NO ADVANCING
           DISPLAY '"page":' NO ADVANCING
           DISPLAY FUNCTION TRIM(WS-F-HIRE TRAILING) NO ADVANCING
           DISPLAY ',"limit":' NO ADVANCING
           DISPLAY FUNCTION TRIM(WS-F-STATUS TRAILING) NO ADVANCING
           DISPLAY ',"total":' NO ADVANCING
           DISPLAY FUNCTION TRIM(WS-F-ID TRAILING) NO ADVANCING
           DISPLAY ',"pages":' NO ADVANCING
           DISPLAY FUNCTION TRIM(WS-F-CODE TRAILING) NO ADVANCING
           DISPLAY '}}'.

       OUTPUT-ONE-EMPLOYEE.
           IF WS-FIRST-ROW = 0
               DISPLAY "," NO ADVANCING
           END-IF
           MOVE 0 TO WS-FIRST-ROW

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
           MOVE FUNCTION TRIM(WS-COL-BUF TRAILING) TO WS-F-UPDATED

           DISPLAY '{"id":' NO ADVANCING
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
           DISPLAY '"}' NO ADVANCING.

       END PROGRAM EMP-LIST.

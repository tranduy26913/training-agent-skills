      *> EMP-DELETE.cbl - Delete an employee by ID
      *> CGI program: reads id from QUERY_STRING, deletes from MySQL
      *> Called via: DELETE /cgi-bin/emp-delete.exe?id=1
       IDENTIFICATION DIVISION.
       PROGRAM-ID. EMP-DELETE.
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

      *> SQL and result
       01 WS-SQL                  PIC X(1000)   VALUE SPACES.
       01 WS-EXEC-STATUS          PIC S9(9) COMP-5 VALUE 0.
       01 WS-FETCH-STATUS         PIC S9(9) COMP-5 VALUE 0.
       01 WS-COUNT-VAL            PIC 9(10)     VALUE 0.

      *> Column fetch
       01 WS-COL-BUF              PIC X(200)    VALUE SPACES.
       01 WS-COL-BUF-LEN          PIC S9(9) COMP-5 VALUE 200.
       01 WS-COL-IDX              PIC S9(9) COMP-5 VALUE 0.
       01 WS-COL-STATUS           PIC S9(9) COMP-5 VALUE 0.

      *> Helpers
       01 WS-LONG-VAL             PIC S9(9) COMP-5 VALUE 0.
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
           PERFORM CHECK-EMPLOYEE-EXISTS
           PERFORM DELETE-EMPLOYEE
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

       CHECK-EMPLOYEE-EXISTS.
           STRING
               "SELECT COUNT(*) FROM employees WHERE id = "
               DELIMITED SIZE
               FUNCTION TRIM(WS-ID-STR TRAILING) DELIMITED SIZE
               INTO WS-SQL

           CALL "mysql_exec_query" USING
               BY REFERENCE WS-SQL
               BY REFERENCE WS-EXEC-STATUS
           IF WS-EXEC-STATUS NOT = 0
               PERFORM OUTPUT-DB-ERROR
               PERFORM DISCONNECT-DATABASE
               STOP RUN
           END-IF

           CALL "mysql_fetch_next" USING BY REFERENCE WS-FETCH-STATUS
           IF WS-FETCH-STATUS = 0
               MOVE 0 TO WS-COL-IDX
               CALL "mysql_get_col_val" USING
                   BY REFERENCE WS-COL-IDX
                   BY REFERENCE WS-COL-BUF
                   BY REFERENCE WS-COL-BUF-LEN
                   BY REFERENCE WS-COL-STATUS
               MOVE FUNCTION NUMVAL(
                   FUNCTION TRIM(WS-COL-BUF TRAILING))
                   TO WS-COUNT-VAL
               IF WS-COUNT-VAL = 0
                   DISPLAY '{"status":"ERROR","code":"NOT_FOUND",'
                       NO ADVANCING
                   DISPLAY '"message":"Employee not found"}'
                   PERFORM DISCONNECT-DATABASE
                   STOP RUN
               END-IF
           END-IF.

       DELETE-EMPLOYEE.
           MOVE SPACES TO WS-SQL
           STRING
               "DELETE FROM employees WHERE id = "
               DELIMITED SIZE
               FUNCTION TRIM(WS-ID-STR TRAILING) DELIMITED SIZE
               INTO WS-SQL

           CALL "mysql_exec_query" USING
               BY REFERENCE WS-SQL
               BY REFERENCE WS-EXEC-STATUS

           IF WS-EXEC-STATUS NOT = 0
               PERFORM OUTPUT-DB-ERROR
               PERFORM DISCONNECT-DATABASE
               STOP RUN
           END-IF

           DISPLAY '{"status":"OK","message":"Employee deleted successfully"}'.

       OUTPUT-DB-ERROR.
           MOVE 200 TO WS-ERR-BUF-LEN
           CALL "mysql_get_error" USING
               BY REFERENCE WS-ERR-BUF
               BY REFERENCE WS-ERR-BUF-LEN
           DISPLAY '{"status":"ERROR","code":"DB_ERROR","message":"'
               NO ADVANCING
           DISPLAY FUNCTION TRIM(WS-ERR-BUF TRAILING) NO ADVANCING
           DISPLAY '"}'.

       DISCONNECT-DATABASE.
           CALL "mysql_close_db".

       END PROGRAM EMP-DELETE.

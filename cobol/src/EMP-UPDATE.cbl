      *> EMP-UPDATE.cbl - Update an existing employee
      *> CGI program: reads id from QUERY_STRING, JSON body from stdin
      *> Called via: PUT /cgi-bin/emp-update.exe?id=1 (JSON body in stdin)
       IDENTIFICATION DIVISION.
       PROGRAM-ID. EMP-UPDATE.
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

      *> Request body
       01 WS-BODY                 PIC X(4000)   VALUE SPACES.
       01 WS-BODY-LEN             PIC S9(9) COMP-5 VALUE 4000.
       01 WS-BODY-READ            PIC S9(9) COMP-5 VALUE 0.

      *> ID parameter
       01 WS-ID-NUM               PIC 9(10)     VALUE 0.
       01 WS-ID-STR               PIC X(12)     VALUE SPACES.

      *> Input fields
       01 WS-FIELD-NAME           PIC X(50)     VALUE SPACES.
       01 WS-FIELD-VALUE          PIC X(500)    VALUE SPACES.

       01 WS-IN-NAME              PIC X(100)    VALUE SPACES.
       01 WS-IN-EMAIL             PIC X(255)    VALUE SPACES.
       01 WS-IN-PHONE             PIC X(20)     VALUE SPACES.
       01 WS-IN-DEPT              PIC X(20)     VALUE SPACES.
       01 WS-IN-POS               PIC X(30)     VALUE SPACES.
       01 WS-IN-SALARY            PIC X(20)     VALUE SPACES.
       01 WS-IN-HIRE              PIC X(10)     VALUE SPACES.
       01 WS-IN-STATUS            PIC X(10)     VALUE SPACES.

      *> Escaped fields for SQL
       01 WS-ESC-NAME             PIC X(200)    VALUE SPACES.
       01 WS-ESC-NAME-LEN         PIC S9(9) COMP-5 VALUE 200.
       01 WS-ESC-EMAIL            PIC X(510)    VALUE SPACES.
       01 WS-ESC-EMAIL-LEN        PIC S9(9) COMP-5 VALUE 510.
       01 WS-ESC-PHONE            PIC X(40)     VALUE SPACES.
       01 WS-ESC-PHONE-LEN        PIC S9(9) COMP-5 VALUE 40.
       01 WS-ESC-DEPT             PIC X(40)     VALUE SPACES.
       01 WS-ESC-DEPT-LEN         PIC S9(9) COMP-5 VALUE 40.
       01 WS-ESC-POS              PIC X(60)     VALUE SPACES.
       01 WS-ESC-POS-LEN          PIC S9(9) COMP-5 VALUE 60.
       01 WS-ESC-HIRE             PIC X(20)     VALUE SPACES.
       01 WS-ESC-HIRE-LEN         PIC S9(9) COMP-5 VALUE 20.
       01 WS-ESC-STATUS           PIC X(20)     VALUE SPACES.
       01 WS-ESC-STATUS-LEN       PIC S9(9) COMP-5 VALUE 20.

      *> SQL and result
       01 WS-SQL                  PIC X(3000)   VALUE SPACES.
       01 WS-SQL-PTR              PIC S9(9) COMP-5 VALUE 1.
       01 WS-EXEC-STATUS          PIC S9(9) COMP-5 VALUE 0.
       01 WS-FETCH-STATUS         PIC S9(9) COMP-5 VALUE 0.
       01 WS-COUNT-VAL            PIC 9(10)     VALUE 0.

      *> Column fetch
       01 WS-COL-BUF              PIC X(1000)   VALUE SPACES.
       01 WS-COL-BUF-LEN          PIC S9(9) COMP-5 VALUE 1000.
       01 WS-COL-IDX              PIC S9(9) COMP-5 VALUE 0.
       01 WS-COL-STATUS           PIC S9(9) COMP-5 VALUE 0.

      *> Employee output fields
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

      *> JSON-escaped output
       01 WS-J-NAME               PIC X(200)    VALUE SPACES.
       01 WS-J-NAME-LEN           PIC S9(9) COMP-5 VALUE 200.
       01 WS-J-EMAIL              PIC X(510)    VALUE SPACES.
       01 WS-J-EMAIL-LEN          PIC S9(9) COMP-5 VALUE 510.
       01 WS-J-PHONE              PIC X(40)     VALUE SPACES.
       01 WS-J-PHONE-LEN          PIC S9(9) COMP-5 VALUE 40.

      *> Helpers
       01 WS-STRLEN               PIC S9(9) COMP-5 VALUE 0.
       01 WS-ESC-STATUS-FLAG      PIC S9(9) COMP-5 VALUE 0.
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
           PERFORM CHECK-EMPLOYEE-EXISTS
           PERFORM READ-REQUEST-BODY
           PERFORM PARSE-INPUT-FIELDS
           PERFORM VALIDATE-INPUT
           PERFORM CHECK-UNIQUE-EMAIL
           PERFORM ESCAPE-ALL-FIELDS
           PERFORM UPDATE-EMPLOYEE
           PERFORM FETCH-UPDATED-EMPLOYEE
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

       READ-REQUEST-BODY.
           CALL "read_stdin_body" USING
               BY REFERENCE WS-BODY
               BY REFERENCE WS-BODY-LEN
               BY REFERENCE WS-BODY-READ.

       PARSE-INPUT-FIELDS.
           MOVE "full_name         " TO WS-FIELD-NAME
           CALL "parse_json_str_field" USING
               BY REFERENCE WS-BODY BY REFERENCE WS-FIELD-NAME
               BY REFERENCE WS-FIELD-VALUE BY REFERENCE WS-PARSE-STATUS
           IF WS-PARSE-STATUS = 0
               MOVE FUNCTION TRIM(WS-FIELD-VALUE TRAILING) TO WS-IN-NAME
           END-IF

           MOVE "email             " TO WS-FIELD-NAME
           CALL "parse_json_str_field" USING
               BY REFERENCE WS-BODY BY REFERENCE WS-FIELD-NAME
               BY REFERENCE WS-FIELD-VALUE BY REFERENCE WS-PARSE-STATUS
           IF WS-PARSE-STATUS = 0
               MOVE FUNCTION TRIM(WS-FIELD-VALUE TRAILING) TO WS-IN-EMAIL
           END-IF

           MOVE "phone             " TO WS-FIELD-NAME
           CALL "parse_json_str_field" USING
               BY REFERENCE WS-BODY BY REFERENCE WS-FIELD-NAME
               BY REFERENCE WS-FIELD-VALUE BY REFERENCE WS-PARSE-STATUS
           IF WS-PARSE-STATUS = 0
               MOVE FUNCTION TRIM(WS-FIELD-VALUE TRAILING) TO WS-IN-PHONE
           END-IF

           MOVE "department        " TO WS-FIELD-NAME
           CALL "parse_json_str_field" USING
               BY REFERENCE WS-BODY BY REFERENCE WS-FIELD-NAME
               BY REFERENCE WS-FIELD-VALUE BY REFERENCE WS-PARSE-STATUS
           IF WS-PARSE-STATUS = 0
               MOVE FUNCTION TRIM(WS-FIELD-VALUE TRAILING) TO WS-IN-DEPT
           END-IF

           MOVE "position          " TO WS-FIELD-NAME
           CALL "parse_json_str_field" USING
               BY REFERENCE WS-BODY BY REFERENCE WS-FIELD-NAME
               BY REFERENCE WS-FIELD-VALUE BY REFERENCE WS-PARSE-STATUS
           IF WS-PARSE-STATUS = 0
               MOVE FUNCTION TRIM(WS-FIELD-VALUE TRAILING) TO WS-IN-POS
           END-IF

           MOVE "salary            " TO WS-FIELD-NAME
           CALL "parse_json_str_field" USING
               BY REFERENCE WS-BODY BY REFERENCE WS-FIELD-NAME
               BY REFERENCE WS-FIELD-VALUE BY REFERENCE WS-PARSE-STATUS
           IF WS-PARSE-STATUS = 0
               MOVE FUNCTION TRIM(WS-FIELD-VALUE TRAILING) TO WS-IN-SALARY
           END-IF

           MOVE "hire_date         " TO WS-FIELD-NAME
           CALL "parse_json_str_field" USING
               BY REFERENCE WS-BODY BY REFERENCE WS-FIELD-NAME
               BY REFERENCE WS-FIELD-VALUE BY REFERENCE WS-PARSE-STATUS
           IF WS-PARSE-STATUS = 0
               MOVE FUNCTION TRIM(WS-FIELD-VALUE TRAILING) TO WS-IN-HIRE
           END-IF

           MOVE "status            " TO WS-FIELD-NAME
           CALL "parse_json_str_field" USING
               BY REFERENCE WS-BODY BY REFERENCE WS-FIELD-NAME
               BY REFERENCE WS-FIELD-VALUE BY REFERENCE WS-PARSE-STATUS
           IF WS-PARSE-STATUS = 0
               MOVE FUNCTION TRIM(WS-FIELD-VALUE TRAILING) TO WS-IN-STATUS
           END-IF.

       VALIDATE-INPUT.
           IF WS-IN-NAME = SPACES
               DISPLAY '{"status":"ERROR","code":"VALIDATION_ERROR",'
                   NO ADVANCING
               DISPLAY '"message":"full_name is required"}'
               PERFORM DISCONNECT-DATABASE
               STOP RUN
           END-IF
           IF WS-IN-EMAIL = SPACES
               DISPLAY '{"status":"ERROR","code":"VALIDATION_ERROR",'
                   NO ADVANCING
               DISPLAY '"message":"email is required"}'
               PERFORM DISCONNECT-DATABASE
               STOP RUN
           END-IF
           IF WS-IN-DEPT = SPACES
               DISPLAY '{"status":"ERROR","code":"VALIDATION_ERROR",'
                   NO ADVANCING
               DISPLAY '"message":"department is required"}'
               PERFORM DISCONNECT-DATABASE
               STOP RUN
           END-IF
           IF WS-IN-POS = SPACES
               DISPLAY '{"status":"ERROR","code":"VALIDATION_ERROR",'
                   NO ADVANCING
               DISPLAY '"message":"position is required"}'
               PERFORM DISCONNECT-DATABASE
               STOP RUN
           END-IF.

       CHECK-UNIQUE-EMAIL.
      *> Check email is unique, excluding current record
           MOVE FUNCTION LENGTH(
               FUNCTION TRIM(WS-IN-EMAIL TRAILING))
               TO WS-STRLEN
           CALL "mysql_escape_str" USING
               BY REFERENCE WS-IN-EMAIL
               BY REFERENCE WS-STRLEN
               BY REFERENCE WS-ESC-EMAIL
               BY REFERENCE WS-ESC-EMAIL-LEN
               BY REFERENCE WS-ESC-STATUS-FLAG

           MOVE SPACES TO WS-SQL
           STRING
               "SELECT COUNT(*) FROM employees WHERE email = '"
               DELIMITED SIZE
               FUNCTION TRIM(WS-ESC-EMAIL TRAILING) DELIMITED SIZE
               "' AND id != " DELIMITED SIZE
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
               IF WS-COUNT-VAL > 0
                   DISPLAY '{"status":"ERROR","code":"DUPLICATE_EMAIL",'
                       NO ADVANCING
                   DISPLAY '"message":"email already exists"}'
                   PERFORM DISCONNECT-DATABASE
                   STOP RUN
               END-IF
           END-IF.

       ESCAPE-ALL-FIELDS.
           MOVE FUNCTION LENGTH(
               FUNCTION TRIM(WS-IN-NAME TRAILING)) TO WS-STRLEN
           CALL "mysql_escape_str" USING
               BY REFERENCE WS-IN-NAME BY REFERENCE WS-STRLEN
               BY REFERENCE WS-ESC-NAME BY REFERENCE WS-ESC-NAME-LEN
               BY REFERENCE WS-ESC-STATUS-FLAG

           IF WS-IN-PHONE NOT = SPACES
               MOVE FUNCTION LENGTH(
                   FUNCTION TRIM(WS-IN-PHONE TRAILING)) TO WS-STRLEN
               CALL "mysql_escape_str" USING
                   BY REFERENCE WS-IN-PHONE BY REFERENCE WS-STRLEN
                   BY REFERENCE WS-ESC-PHONE BY REFERENCE WS-ESC-PHONE-LEN
                   BY REFERENCE WS-ESC-STATUS-FLAG
           END-IF

           MOVE FUNCTION LENGTH(
               FUNCTION TRIM(WS-IN-DEPT TRAILING)) TO WS-STRLEN
           CALL "mysql_escape_str" USING
               BY REFERENCE WS-IN-DEPT BY REFERENCE WS-STRLEN
               BY REFERENCE WS-ESC-DEPT BY REFERENCE WS-ESC-DEPT-LEN
               BY REFERENCE WS-ESC-STATUS-FLAG

           MOVE FUNCTION LENGTH(
               FUNCTION TRIM(WS-IN-POS TRAILING)) TO WS-STRLEN
           CALL "mysql_escape_str" USING
               BY REFERENCE WS-IN-POS BY REFERENCE WS-STRLEN
               BY REFERENCE WS-ESC-POS BY REFERENCE WS-ESC-POS-LEN
               BY REFERENCE WS-ESC-STATUS-FLAG

           IF WS-IN-HIRE NOT = SPACES
               MOVE FUNCTION LENGTH(
                   FUNCTION TRIM(WS-IN-HIRE TRAILING)) TO WS-STRLEN
               CALL "mysql_escape_str" USING
                   BY REFERENCE WS-IN-HIRE BY REFERENCE WS-STRLEN
                   BY REFERENCE WS-ESC-HIRE BY REFERENCE WS-ESC-HIRE-LEN
                   BY REFERENCE WS-ESC-STATUS-FLAG
           END-IF

           IF WS-IN-STATUS NOT = SPACES
               MOVE FUNCTION LENGTH(
                   FUNCTION TRIM(WS-IN-STATUS TRAILING)) TO WS-STRLEN
               CALL "mysql_escape_str" USING
                   BY REFERENCE WS-IN-STATUS BY REFERENCE WS-STRLEN
                   BY REFERENCE WS-ESC-STATUS BY REFERENCE WS-ESC-STATUS-LEN
                   BY REFERENCE WS-ESC-STATUS-FLAG
           END-IF.

       UPDATE-EMPLOYEE.
           IF WS-IN-SALARY = SPACES
               MOVE "0" TO WS-IN-SALARY
           END-IF

           MOVE SPACES TO WS-SQL
           MOVE 1 TO WS-SQL-PTR
           STRING
               "UPDATE employees SET "
               DELIMITED SIZE
               "full_name = '" DELIMITED SIZE
               FUNCTION TRIM(WS-ESC-NAME TRAILING) DELIMITED SIZE
               "', email = '" DELIMITED SIZE
               FUNCTION TRIM(WS-ESC-EMAIL TRAILING) DELIMITED SIZE
               "', department = '" DELIMITED SIZE
               FUNCTION TRIM(WS-ESC-DEPT TRAILING) DELIMITED SIZE
               "', position = '" DELIMITED SIZE
               FUNCTION TRIM(WS-ESC-POS TRAILING) DELIMITED SIZE
               "', salary = " DELIMITED SIZE
               FUNCTION TRIM(WS-IN-SALARY TRAILING) DELIMITED SIZE
               INTO WS-SQL WITH POINTER WS-SQL-PTR

           IF WS-IN-PHONE NOT = SPACES
               STRING
                   ", phone = '" DELIMITED SIZE
                   FUNCTION TRIM(WS-ESC-PHONE TRAILING) DELIMITED SIZE
                   "'" DELIMITED SIZE
                   INTO WS-SQL WITH POINTER WS-SQL-PTR
           ELSE
               STRING ", phone = NULL" DELIMITED SIZE
                   INTO WS-SQL WITH POINTER WS-SQL-PTR
           END-IF

           IF WS-IN-HIRE NOT = SPACES
               STRING
                   ", hire_date = '" DELIMITED SIZE
                   FUNCTION TRIM(WS-ESC-HIRE TRAILING) DELIMITED SIZE
                   "'" DELIMITED SIZE
                   INTO WS-SQL WITH POINTER WS-SQL-PTR
           END-IF

           IF WS-IN-STATUS NOT = SPACES
               STRING
                   ", status = '" DELIMITED SIZE
                   FUNCTION TRIM(WS-ESC-STATUS TRAILING) DELIMITED SIZE
                   "'" DELIMITED SIZE
                   INTO WS-SQL WITH POINTER WS-SQL-PTR
           END-IF

           STRING
               " WHERE id = " DELIMITED SIZE
               FUNCTION TRIM(WS-ID-STR TRAILING) DELIMITED SIZE
               INTO WS-SQL WITH POINTER WS-SQL-PTR
           MOVE X'00' TO WS-SQL(WS-SQL-PTR:1)

           CALL "mysql_exec_query" USING
               BY REFERENCE WS-SQL
               BY REFERENCE WS-EXEC-STATUS

           IF WS-EXEC-STATUS NOT = 0
               PERFORM OUTPUT-DB-ERROR
               PERFORM DISCONNECT-DATABASE
               STOP RUN
           END-IF.

       FETCH-UPDATED-EMPLOYEE.
           MOVE SPACES TO WS-SQL
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

           CALL "mysql_fetch_next" USING BY REFERENCE WS-FETCH-STATUS
           IF WS-FETCH-STATUS NOT = 0
               PERFORM OUTPUT-DB-ERROR
               PERFORM DISCONNECT-DATABASE
               STOP RUN
           END-IF

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

       END PROGRAM EMP-UPDATE.

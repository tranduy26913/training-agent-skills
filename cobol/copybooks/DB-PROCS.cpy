      *> DB-PROCS.cpy - Common database procedure paragraphs
      *> COPY this into PROCEDURE DIVISION of each CGI program
       GET-ENV-VARS.
           ACCEPT WS-DB-HOST   FROM ENVIRONMENT "DB_HOST"
           ACCEPT WS-DB-PORT   FROM ENVIRONMENT "DB_PORT"
           ACCEPT WS-DB-USER   FROM ENVIRONMENT "DB_USER"
           ACCEPT WS-DB-PASS   FROM ENVIRONMENT "DB_PASSWORD"
           ACCEPT WS-DB-NAME   FROM ENVIRONMENT "DB_NAME"
           ACCEPT WS-QUERY-STRING FROM ENVIRONMENT "QUERY_STRING"
           IF WS-DB-HOST = SPACES
               MOVE "localhost" TO WS-DB-HOST
           END-IF
           IF WS-DB-PORT = SPACES
               MOVE "3306  " TO WS-DB-PORT
           END-IF
           IF WS-DB-NAME = SPACES
               MOVE "app_db" TO WS-DB-NAME
           END-IF.

       CONNECT-DATABASE.
           CALL "mysql_connect_db" USING
               BY REFERENCE WS-DB-HOST
               BY REFERENCE WS-DB-USER
               BY REFERENCE WS-DB-PASS
               BY REFERENCE WS-DB-NAME
               BY REFERENCE WS-DB-PORT
               BY REFERENCE WS-DB-STATUS.

       DISCONNECT-DATABASE.
           CALL "mysql_close_db".

       OUTPUT-DB-ERROR.
           MOVE 200 TO WS-ERR-BUF-LEN
           CALL "mysql_get_error" USING
               BY REFERENCE WS-ERR-BUF
               BY REFERENCE WS-ERR-BUF-LEN
           DISPLAY '{"status":"ERROR","code":"DB_ERROR","message":"'
               NO ADVANCING
           DISPLAY FUNCTION TRIM(WS-ERR-BUF TRAILING) NO ADVANCING
           DISPLAY '"}'.

      *> DBTEST.cbl - minimal DB connectivity test
       IDENTIFICATION DIVISION.
       PROGRAM-ID. DBTEST.
       DATA DIVISION.
       WORKING-STORAGE SECTION.
       01 WS-STATUS    PIC S9(9) COMP-5 VALUE 0.
       01 WS-HOST      PIC X(64) VALUE "localhost".
       01 WS-USER      PIC X(64) VALUE "root".
       01 WS-PASS      PIC X(64) VALUE SPACES.
       01 WS-DB        PIC X(64) VALUE "app_db".
       01 WS-PORT      PIC X(6)  VALUE "3306  ".
       01 WS-SQL       PIC X(100) VALUE "SELECT 1".
       01 WS-FETCH     PIC S9(9) COMP-5 VALUE 0.
       01 WS-EXEC      PIC S9(9) COMP-5 VALUE 0.
       01 WS-COL-BUF   PIC X(50) VALUE SPACES.
       01 WS-COL-LEN   PIC S9(9) COMP-5 VALUE 50.
       01 WS-COL-IDX   PIC S9(9) COMP-5 VALUE 0.
       01 WS-COL-STS   PIC S9(9) COMP-5 VALUE 0.
       PROCEDURE DIVISION.
       MAIN.
           DISPLAY "step1: before connect" UPON SYSERR
           CALL "mysql_connect_db" USING
               BY REFERENCE WS-HOST BY REFERENCE WS-USER
               BY REFERENCE WS-PASS BY REFERENCE WS-DB
               BY REFERENCE WS-PORT BY REFERENCE WS-STATUS
           DISPLAY "step2: after connect" UPON SYSERR
           IF WS-STATUS NOT = 0
               DISPLAY "CONNECT FAILED status=" UPON SYSERR
               STOP RUN
           END-IF
           DISPLAY "step3: before query" UPON SYSERR
           CALL "mysql_exec_query" USING
               BY REFERENCE WS-SQL BY REFERENCE WS-EXEC
           DISPLAY "step4: after query" UPON SYSERR
           CALL "mysql_fetch_next" USING BY REFERENCE WS-FETCH
           DISPLAY "step5: fetch done" UPON SYSERR
           CALL "mysql_get_col_val" USING
               BY REFERENCE WS-COL-IDX BY REFERENCE WS-COL-BUF
               BY REFERENCE WS-COL-LEN BY REFERENCE WS-COL-STS
           DISPLAY "step6: got col=" UPON SYSERR
           DISPLAY WS-COL-BUF UPON SYSERR
           CALL "mysql_close_db"
           DISPLAY "step7: done" UPON SYSERR
           STOP RUN.
       END PROGRAM DBTEST.

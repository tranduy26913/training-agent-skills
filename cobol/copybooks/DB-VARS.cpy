      *> DB-VARS.cpy - Common database connection variables
      *> COPY this into WORKING-STORAGE SECTION of each CGI program
       01 WS-DB-HOST              PIC X(64)     VALUE SPACES.
       01 WS-DB-PORT              PIC X(6)      VALUE "3306  ".
       01 WS-DB-USER              PIC X(64)     VALUE SPACES.
       01 WS-DB-PASS              PIC X(64)     VALUE SPACES.
       01 WS-DB-NAME              PIC X(64)     VALUE SPACES.
       01 WS-DB-STATUS            PIC S9(9) COMP-5 VALUE 0.
       01 WS-QUERY-STRING         PIC X(2000)   VALUE SPACES.
       01 WS-ERR-BUF              PIC X(200)    VALUE SPACES.
       01 WS-ERR-BUF-LEN          PIC S9(9) COMP-5 VALUE 200.

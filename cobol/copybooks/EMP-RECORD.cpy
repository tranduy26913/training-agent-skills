      *> EMP-RECORD.cpy - Employee data structure copybook
      *> Used by all COBOL employee CGI programs
       01 WS-EMPLOYEE.
          05 WS-EMP-ID           PIC 9(10).
          05 WS-EMP-CODE         PIC X(20).
          05 WS-EMP-FULLNAME     PIC X(100).
          05 WS-EMP-EMAIL        PIC X(255).
          05 WS-EMP-PHONE        PIC X(20).
          05 WS-EMP-DEPARTMENT   PIC X(20).
          05 WS-EMP-POSITION     PIC X(30).
          05 WS-EMP-SALARY       PIC 9(12)V99.
          05 WS-EMP-HIREDATE     PIC X(10).
          05 WS-EMP-STATUS       PIC X(10).
          05 WS-EMP-CREATED-AT   PIC X(20).
          05 WS-EMP-UPDATED-AT   PIC X(20).

       01 WS-EMP-FILTERS.
          05 WS-FILTER-SEARCH    PIC X(100).
          05 WS-FILTER-DEPT      PIC X(20).
          05 WS-FILTER-STATUS    PIC X(10).
          05 WS-FILTER-PAGE      PIC 9(5).
          05 WS-FILTER-LIMIT     PIC 9(3).

       01 WS-PAGINATION.
          05 WS-PAGE             PIC 9(5).
          05 WS-LIMIT            PIC 9(3).
          05 WS-TOTAL            PIC 9(10).
          05 WS-PAGES            PIC 9(5).

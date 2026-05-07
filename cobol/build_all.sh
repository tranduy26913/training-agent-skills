export COB_CONFIG_DIR=/mingw64/share/gnucobol/config
cd /d/training/cobol
gcc -c c-helpers/mysql_helper.c -I/mingw64/include/mysql -o build/mysql_helper.o 2>&1 && echo "helper OK" || echo "helper FAILED"
cobc -x -free -I copybooks src/EMP-LIST.cbl build/mysql_helper.o -L/mingw64/lib -lmariadb -o build/emp-list.exe 2>&1 && echo "emp-list OK" || echo "emp-list FAILED"
cobc -x -free -I copybooks src/EMP-DETAIL.cbl build/mysql_helper.o -L/mingw64/lib -lmariadb -o build/emp-detail.exe 2>&1 && echo "emp-detail OK" || echo "emp-detail FAILED"
cobc -x -free -I copybooks src/EMP-CREATE.cbl build/mysql_helper.o -L/mingw64/lib -lmariadb -o build/emp-create.exe 2>&1 && echo "emp-create OK" || echo "emp-create FAILED"
cobc -x -free -I copybooks src/EMP-UPDATE.cbl build/mysql_helper.o -L/mingw64/lib -lmariadb -o build/emp-update.exe 2>&1 && echo "emp-update OK" || echo "emp-update FAILED"
cobc -x -free -I copybooks src/EMP-DELETE.cbl build/mysql_helper.o -L/mingw64/lib -lmariadb -o build/emp-delete.exe 2>&1 && echo "emp-delete OK" || echo "emp-delete FAILED"

# Makefile for COBOL Employee CGI Programs
# Requires: GnuCOBOL 3.x, MariaDB C Client (libmariadb)
# Usage:
#   make all        - Build all CGI programs
#   make clean      - Remove build artifacts
#   make install    - Copy CGIs to build/ (same as all)
#
# Prerequisites:
#   - GnuCOBOL:  C:\msys64\mingw64\bin\cobc.exe
#   - MariaDB:   C:\msys64\mingw64\lib\libmariadb.dll.a
#   - GCC:       C:\msys64\mingw64\bin\gcc.exe

COBC     = C:/msys64/mingw64/bin/cobc.exe
GCC      = C:/msys64/mingw64/bin/gcc.exe
COBFLAGS = -x -free
CC_FLAGS = -c -I/C/msys64/mingw64/include/mysql \
           -IC:/msys64/mingw64/include/mysql
LD_FLAGS = -LC:/msys64/mingw64/lib -lmariadb

BUILD_DIR = build
SRC_DIR   = src
COPY_DIR  = copybooks
HELPER_DIR = c-helpers

PROGRAMS = emp-list emp-detail emp-create emp-update emp-delete

.PHONY: all clean dirs

all: dirs $(BUILD_DIR)/mysql_helper.o $(patsubst %, $(BUILD_DIR)/%.exe, $(PROGRAMS))

dirs:
	if not exist $(BUILD_DIR) mkdir $(BUILD_DIR)

# Compile C helper object
$(BUILD_DIR)/mysql_helper.o: $(HELPER_DIR)/mysql_helper.c
	$(GCC) -c $(HELPER_DIR)/mysql_helper.c \
	    -IC:/msys64/mingw64/include/mysql \
	    -o $(BUILD_DIR)/mysql_helper.o

# Pattern rule: compile each COBOL program
$(BUILD_DIR)/emp-list.exe: $(SRC_DIR)/EMP-LIST.cbl $(BUILD_DIR)/mysql_helper.o
	$(COBC) $(COBFLAGS) \
	    -I $(COPY_DIR) \
	    $(SRC_DIR)/EMP-LIST.cbl \
	    $(BUILD_DIR)/mysql_helper.o \
	    $(LD_FLAGS) \
	    -o $(BUILD_DIR)/emp-list.exe

$(BUILD_DIR)/emp-detail.exe: $(SRC_DIR)/EMP-DETAIL.cbl $(BUILD_DIR)/mysql_helper.o
	$(COBC) $(COBFLAGS) \
	    -I $(COPY_DIR) \
	    $(SRC_DIR)/EMP-DETAIL.cbl \
	    $(BUILD_DIR)/mysql_helper.o \
	    $(LD_FLAGS) \
	    -o $(BUILD_DIR)/emp-detail.exe

$(BUILD_DIR)/emp-create.exe: $(SRC_DIR)/EMP-CREATE.cbl $(BUILD_DIR)/mysql_helper.o
	$(COBC) $(COBFLAGS) \
	    -I $(COPY_DIR) \
	    $(SRC_DIR)/EMP-CREATE.cbl \
	    $(BUILD_DIR)/mysql_helper.o \
	    $(LD_FLAGS) \
	    -o $(BUILD_DIR)/emp-create.exe

$(BUILD_DIR)/emp-update.exe: $(SRC_DIR)/EMP-UPDATE.cbl $(BUILD_DIR)/mysql_helper.o
	$(COBC) $(COBFLAGS) \
	    -I $(COPY_DIR) \
	    $(SRC_DIR)/EMP-UPDATE.cbl \
	    $(BUILD_DIR)/mysql_helper.o \
	    $(LD_FLAGS) \
	    -o $(BUILD_DIR)/emp-update.exe

$(BUILD_DIR)/emp-delete.exe: $(SRC_DIR)/EMP-DELETE.cbl $(BUILD_DIR)/mysql_helper.o
	$(COBC) $(COBFLAGS) \
	    -I $(COPY_DIR) \
	    $(SRC_DIR)/EMP-DELETE.cbl \
	    $(BUILD_DIR)/mysql_helper.o \
	    $(LD_FLAGS) \
	    -o $(BUILD_DIR)/emp-delete.exe

clean:
	if exist $(BUILD_DIR) rmdir /s /q $(BUILD_DIR)

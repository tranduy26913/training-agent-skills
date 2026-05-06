#================================================================
# Makefile — Build all COBOL CGI programs
#
# Architecture: Node.js CGI Runner (port 8081) replaces Apache.
# COBOL programs read piped data from stdin, output JSON to stdout.
#
# Usage (from d:\training\cobol\):
#   C:\msys64\mingw64\bin\mingw32-make.exe all
#   C:\msys64\mingw64\bin\mingw32-make.exe clean
#
# Required environment (set automatically below):
#   COB_CONFIG_DIR  = GnuCOBOL config directory
#   PATH includes   = C:/msys64/mingw64/bin (for gcc)
#================================================================

COBC     = C:/msys64/mingw64/bin/cobc.exe
COBFLAGS = -x -free -Wobsolete
SRCDIR   = src
BUILDDIR = build
COPYDIR  = copybooks

export COB_CONFIG_DIR  = C:/msys64/mingw64/share/gnucobol/config
export COB_LIBRARY_PATH= C:/msys64/mingw64/lib/gnucobol
export PATH           := C:/msys64/mingw64/bin:$(PATH)

PROGRAMS = emp-list emp-detail emp-create emp-update emp-delete
TARGETS  = $(addprefix $(BUILDDIR)/, $(addsuffix .exe, $(PROGRAMS)))

.PHONY: all clean

all: $(BUILDDIR) $(TARGETS)

$(BUILDDIR):
	mkdir -p $(BUILDDIR)

$(BUILDDIR)/emp-list.exe: $(SRCDIR)/EMP-LIST.cbl $(COPYDIR)/EMP-RECORD.cpy
	$(COBC) $(COBFLAGS) -I $(COPYDIR) -o $@ $<

$(BUILDDIR)/emp-detail.exe: $(SRCDIR)/EMP-DETAIL.cbl $(COPYDIR)/EMP-RECORD.cpy
	$(COBC) $(COBFLAGS) -I $(COPYDIR) -o $@ $<

$(BUILDDIR)/emp-create.exe: $(SRCDIR)/EMP-CREATE.cbl $(COPYDIR)/EMP-RECORD.cpy
	$(COBC) $(COBFLAGS) -I $(COPYDIR) -o $@ $<

$(BUILDDIR)/emp-update.exe: $(SRCDIR)/EMP-UPDATE.cbl $(COPYDIR)/EMP-RECORD.cpy
	$(COBC) $(COBFLAGS) -I $(COPYDIR) -o $@ $<

$(BUILDDIR)/emp-delete.exe: $(SRCDIR)/EMP-DELETE.cbl $(COPYDIR)/EMP-RECORD.cpy
	$(COBC) $(COBFLAGS) -I $(COPYDIR) -o $@ $<

clean:
	rm -rf $(BUILDDIR)

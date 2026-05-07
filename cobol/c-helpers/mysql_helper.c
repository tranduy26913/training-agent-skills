/*
 * mysql_helper.c
 * C helper library for COBOL programs to connect to MySQL via MariaDB C API.
 * COBOL programs use CALL to invoke these functions.
 *
 * Compile: gcc -c mysql_helper.c -IC:/msys64/mingw64/include/mysql -o mysql_helper.o
 * Link with COBOL: cobc -x program.cbl mysql_helper.o -LC:/msys64/mingw64/lib -lmariadb
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>
#include <mysql.h>

/* Global connection handle */
static MYSQL *g_conn = NULL;
static MYSQL_RES *g_result = NULL;
static MYSQL_ROW g_current_row = NULL;
static unsigned int g_num_fields = 0;

/*
 * mysql_connect_db
 * Parameters (all COBOL PIC X, space-padded, null-terminated on call):
 *   host     - PIC X(64)
 *   user     - PIC X(64)
 *   pass     - PIC X(64)
 *   dbname   - PIC X(64)
 *   port_str - PIC X(6)  e.g. "3306  "
 *   status   - PIC 9 COMP (int*): 0=success, 1=error
 */
void mysql_connect_db(char *host, char *user, char *pass,
                      char *dbname, char *port_str, int *status)
{
    /* Trim trailing spaces from COBOL strings */
    char h[65], u[65], p[65], d[65];
    int port;
    char *ptr;

    strncpy(h, host,   64); h[64]   = '\0';
    strncpy(u, user,   64); u[64]   = '\0';
    strncpy(p, pass,   64); p[64]   = '\0';
    strncpy(d, dbname, 64); d[64]   = '\0';

    /* Trim right spaces */
    for (ptr = h + strlen(h) - 1; ptr >= h && *ptr == ' '; ptr--) *ptr = '\0';
    for (ptr = u + strlen(u) - 1; ptr >= u && *ptr == ' '; ptr--) *ptr = '\0';
    for (ptr = p + strlen(p) - 1; ptr >= p && *ptr == ' '; ptr--) *ptr = '\0';
    for (ptr = d + strlen(d) - 1; ptr >= d && *ptr == ' '; ptr--) *ptr = '\0';

    port = atoi(port_str);
    if (port <= 0) port = 3306;

    if (g_conn != NULL) {
        mysql_close(g_conn);
        g_conn = NULL;
    }

    g_conn = mysql_init(NULL);
    if (g_conn == NULL) {
        *status = 1;
        return;
    }

    /* Set UTF-8 charset */
    mysql_options(g_conn, MYSQL_SET_CHARSET_NAME, "utf8mb4");

    if (!mysql_real_connect(g_conn, h, u, p, d, port, NULL, 0)) {
        mysql_close(g_conn);
        g_conn = NULL;
        *status = 1;
        return;
    }

    *status = 0;
}

/*
 * mysql_exec_query
 * Execute a SQL query string.
 *   sql    - PIC X(2000), null-terminated
 *   status - PIC 9 COMP: 0=success, 1=error
 */
void mysql_exec_query(char *sql, int *status)
{
    if (g_conn == NULL) {
        *status = 1;
        return;
    }

    /* Free previous result if any */
    if (g_result != NULL) {
        mysql_free_result(g_result);
        g_result = NULL;
        g_current_row = NULL;
        g_num_fields = 0;
    }

    /* Trim trailing spaces from COBOL string */
    int len = strlen(sql);
    while (len > 0 && sql[len-1] == ' ') len--;

    if (mysql_real_query(g_conn, sql, len) != 0) {
        *status = 1;
        return;
    }

    /* Store result for SELECT queries */
    g_result = mysql_store_result(g_conn);
    if (g_result != NULL) {
        g_num_fields = mysql_num_fields(g_result);
    }

    *status = 0;
}

/*
 * mysql_fetch_next
 * Fetch the next row from the result set.
 *   status - PIC 9 COMP: 0=row fetched, 1=no more rows or error
 */
void mysql_fetch_next(int *status)
{
    if (g_result == NULL) {
        *status = 1;
        return;
    }

    g_current_row = mysql_fetch_row(g_result);
    if (g_current_row == NULL) {
        *status = 1;
    } else {
        *status = 0;
    }
}

/*
 * mysql_get_col_val
 * Get the value of a column by 0-based index.
 *   col_idx - PIC 9(3) COMP (int*): 0-based column index
 *   buf     - PIC X(1000): output buffer
 *   buf_len - PIC 9(5) COMP (int*): buffer size
 *   status  - PIC 9 COMP: 0=ok, 1=null/error
 */
void mysql_get_col_val(int *col_idx, char *buf, int *buf_len, int *status)
{
    unsigned long *lengths;

    if (g_current_row == NULL || *col_idx < 0 ||
        (unsigned int)*col_idx >= g_num_fields) {
        memset(buf, ' ', *buf_len);
        *status = 1;
        return;
    }

    const char *val = g_current_row[*col_idx];
    if (val == NULL) {
        memset(buf, ' ', *buf_len);
        *status = 1;
        return;
    }

    lengths = mysql_fetch_lengths(g_result);
    unsigned long vlen;
    if (lengths != NULL) {
        vlen = lengths[*col_idx];
    } else {
        vlen = (unsigned long)strlen(val);
    }
    int copy_len = (int)vlen < (*buf_len - 1) ? (int)vlen : (*buf_len - 1);
    if (copy_len < 0) copy_len = 0;

    memcpy(buf, val, copy_len);
    /* Pad remaining with spaces (COBOL style) */
    if (*buf_len > copy_len) {
        memset(buf + copy_len, ' ', *buf_len - copy_len);
        buf[*buf_len - 1] = '\0';
    } else if (*buf_len > 0) {
        buf[*buf_len - 1] = '\0';
    }

    *status = 0;
}

/*
 * mysql_get_row_count
 * Get the number of rows in the result set.
 *   count - PIC S9(9) COMP (int*): row count
 */
void mysql_get_row_count(int *count)
{
    if (g_result == NULL) {
        *count = 0;
        return;
    }
    *count = (int)mysql_num_rows(g_result);
}

/*
 * mysql_get_affected
 * Get affected rows (for INSERT/UPDATE/DELETE).
 *   count - PIC S9(9) COMP (int*)
 */
void mysql_get_affected(int *count)
{
    if (g_conn == NULL) {
        *count = 0;
        return;
    }
    *count = (int)mysql_affected_rows(g_conn);
}

/*
 * mysql_get_last_id
 * Get the last auto-increment insert ID.
 *   id - PIC S9(9) COMP (int*)
 */
void mysql_get_last_id(int *id)
{
    if (g_conn == NULL) {
        *id = 0;
        return;
    }
    *id = (int)mysql_insert_id(g_conn);
}

/*
 * mysql_escape_str
 * Escape a string for safe use in SQL queries.
 *   input    - PIC X(500): input string
 *   in_len   - PIC 9(5) COMP (int*): input effective length
 *   output   - PIC X(1000): escaped output (will be null-terminated)
 *   out_len  - PIC 9(5) COMP (int*): output buffer size
 *   status   - PIC 9 COMP: 0=ok, 1=error
 */
void mysql_escape_str(char *input, int *in_len, char *output,
                      int *out_len, int *status)
{
    if (g_conn == NULL) {
        *status = 1;
        return;
    }

    /* Trim trailing spaces from input */
    int effective_len = *in_len;
    while (effective_len > 0 && input[effective_len-1] == ' ') effective_len--;

    /* Output needs at least in_len+1 bytes (conservative: 2*in_len+1 for worst case) */
    if (*out_len < effective_len + 1) {
        *status = 1;
        return;
    }

    unsigned long escaped_len = mysql_real_escape_string(
        g_conn, output, input, effective_len);

    /* Pad remaining with spaces */
    memset(output + escaped_len, ' ', *out_len - escaped_len);

    *status = 0;
}

/*
 * mysql_close_db
 * Close the database connection and free resources.
 */
void mysql_close_db(void)
{
    if (g_result != NULL) {
        mysql_free_result(g_result);
        g_result = NULL;
        g_current_row = NULL;
        g_num_fields = 0;
    }
    if (g_conn != NULL) {
        mysql_close(g_conn);
        g_conn = NULL;
    }
}

/*
 * mysql_get_error
 * Get the last MySQL error message.
 *   buf     - PIC X(200): error message buffer
 *   buf_len - PIC 9(5) COMP (int*): buffer size
 */
void mysql_get_error(char *buf, int *buf_len)
{
    const char *err = "";
    if (g_conn != NULL) {
        err = mysql_error(g_conn);
    }
    int elen = (int)strlen(err);
    int copy_len = elen < *buf_len ? elen : *buf_len - 1;
    memcpy(buf, err, copy_len);
    memset(buf + copy_len, ' ', *buf_len - copy_len);
}

/* =========================================================
 * Utility functions for COBOL programs
 * ========================================================= */

/*
 * rtrim
 * Internal: trim trailing spaces from a COBOL string in-place.
 * Returns the trimmed length.
 */
static int rtrim_len(const char *s, int max_len)
{
    int len = max_len;
    while (len > 0 && (s[len-1] == ' ' || s[len-1] == '\0')) len--;
    return len;
}

/*
 * url_decode_str
 * Decode a URL-encoded string (e.g., "hello%20world" → "hello world").
 *   input    - PIC X(500): URL-encoded input (space-padded)
 *   output   - PIC X(500): decoded output (space-padded)
 *   buf_len  - PIC 9(5) COMP (int*): buffer size for output
 */
void url_decode_str(char *input, char *output, int *buf_len)
{
    int in_len = rtrim_len(input, 500);
    int out_pos = 0;
    int i = 0;

    while (i < in_len && out_pos < *buf_len - 1) {
        if (input[i] == '%' && i + 2 < in_len &&
            isxdigit((unsigned char)input[i+1]) &&
            isxdigit((unsigned char)input[i+2])) {
            char hex[3] = { input[i+1], input[i+2], '\0' };
            output[out_pos++] = (char)strtol(hex, NULL, 16);
            i += 3;
        } else if (input[i] == '+') {
            output[out_pos++] = ' ';
            i++;
        } else {
            output[out_pos++] = input[i++];
        }
    }
    /* Pad remaining with spaces */
    memset(output + out_pos, ' ', *buf_len - out_pos);
}

/*
 * parse_qparam
 * Parse a single parameter value from a QUERY_STRING.
 * Example: QUERY_STRING="page=2&limit=10" → parse_qparam(..., "page", ...) → "2"
 *
 *   qs      - PIC X(2000): the full QUERY_STRING
 *   key     - PIC X(50):   the parameter name to find (space-padded)
 *   value   - PIC X(500):  output buffer for the decoded value
 *   status  - PIC 9 COMP:  0=found, 1=not found
 */
void parse_qparam(char *qs, char *key, char *value, int *status)
{
    int qs_len = rtrim_len(qs, 2000);
    int key_len = rtrim_len(key, 50);

    memset(value, ' ', 500);
    *status = 1;

    if (qs_len == 0 || key_len == 0) return;

    /* Scan through key=value& pairs */
    int i = 0;
    while (i <= qs_len - key_len - 1) {
        /* Check if key matches at position i */
        if (strncmp(qs + i, key, key_len) == 0 &&
            qs[i + key_len] == '=') {
            /* Found: extract value until '&' or end */
            int val_start = i + key_len + 1;
            int val_end = val_start;
            while (val_end < qs_len && qs[val_end] != '&') val_end++;

            /* URL-decode the value */
            char raw_val[501];
            int vlen = val_end - val_start;
            if (vlen > 500) vlen = 500;
            memcpy(raw_val, qs + val_start, vlen);
            memset(raw_val + vlen, ' ', 500 - vlen);
            raw_val[500] = '\0';

            int out_len = 500;
            url_decode_str(raw_val, value, &out_len);
            *status = 0;
            return;
        }
        /* Advance to next & */
        while (i < qs_len && qs[i] != '&') i++;
        i++; /* skip '&' */
    }
}

/*
 * format_long_str
 * Format an integer into a space-padded string buffer.
 *   num    - PIC S9(9) COMP (int*): the number to format
 *   buf    - PIC X(20): output string buffer
 *   buflen - PIC S9(9) COMP (int*): buffer size
 */
void format_long_str(int *num, char *buf, int *buflen)
{
    char tmp[32];
    snprintf(tmp, sizeof(tmp), "%d", *num);
    int tlen = (int)strlen(tmp);
    int copy = tlen < *buflen ? tlen : *buflen;
    memcpy(buf, tmp, copy);
    memset(buf + copy, ' ', *buflen - copy);
}

/*
 * json_escape_str
 * Escape a string for safe embedding in a JSON string value.
 * Escapes: " → \", \ → \\, control chars → \uXXXX
 *
 *   input    - PIC X(500): input string
 *   in_len   - PIC 9(5) COMP (int*): effective input length
 *   output   - PIC X(1000): escaped output
 *   out_len  - PIC 9(5) COMP (int*): output buffer size
 */
void json_escape_str(char *input, int *in_len, char *output, int *out_len)
{
    int effective = *in_len;
    /* Trim trailing spaces */
    while (effective > 0 && input[effective-1] == ' ') effective--;

    int j = 0;
    for (int i = 0; i < effective && j < *out_len - 6; i++) {
        unsigned char c = (unsigned char)input[i];
        if (c == '"') {
            output[j++] = '\\'; output[j++] = '"';
        } else if (c == '\\') {
            output[j++] = '\\'; output[j++] = '\\';
        } else if (c == '\n') {
            output[j++] = '\\'; output[j++] = 'n';
        } else if (c == '\r') {
            output[j++] = '\\'; output[j++] = 'r';
        } else if (c == '\t') {
            output[j++] = '\\'; output[j++] = 't';
        } else if (c < 0x20) {
            j += snprintf(output + j, 7, "\\u%04x", c);
        } else {
            output[j++] = c;
        }
    }
    /* Pad remaining with spaces */
    memset(output + j, ' ', *out_len - j);
}

/*
 * read_stdin_body
 * Read the HTTP request body from stdin into a buffer.
 * Reads up to CONTENT_LENGTH bytes.
 *
 *   buf     - PIC X(4000): output buffer
 *   buf_len - PIC 9(5) COMP (int*): buffer size
 *   read_len - PIC 9(5) COMP (int*): actual bytes read
 */
void read_stdin_body(char *buf, int *buf_len, int *read_len)
{
    const char *cl_env = getenv("CONTENT_LENGTH");
    int content_len = 0;
    if (cl_env != NULL) {
        content_len = atoi(cl_env);
    }

    if (content_len <= 0) {
        *read_len = 0;
        memset(buf, ' ', *buf_len);
        return;
    }

    int to_read = content_len < *buf_len ? content_len : *buf_len - 1;
    int n = (int)fread(buf, 1, to_read, stdin);
    *read_len = n;
    memset(buf + n, ' ', *buf_len - n);
}

/*
 * parse_json_str_field
 * Extract a string value from a JSON body by field name.
 * Handles simple JSON (no nested objects or arrays in value).
 * Example: body='{"name":"John","age":30}', field="name" → "John"
 *
 *   body    - PIC X(4000): JSON body
 *   field   - PIC X(50):   field name to find (space-padded)
 *   value   - PIC X(500):  output buffer
 *   status  - PIC 9 COMP:  0=found, 1=not found
 */
void parse_json_str_field(char *body, char *field, char *value, int *status)
{
    int body_len = rtrim_len(body, 4000);
    int field_len = rtrim_len(field, 50);

    memset(value, ' ', 500);
    *status = 1;

    if (body_len == 0 || field_len == 0) return;

    /* Build search pattern: "fieldname": */
    char pattern[60];
    snprintf(pattern, sizeof(pattern), "\"%.*s\"", field_len, field);
    int pat_len = (int)strlen(pattern);

    for (int i = 0; i <= body_len - pat_len; i++) {
        if (strncmp(body + i, pattern, pat_len) == 0) {
            /* Skip to ':' */
            int j = i + pat_len;
            while (j < body_len && (body[j] == ' ' || body[j] == ':')) j++;

            if (j >= body_len) return;

            if (body[j] == '"') {
                /* String value */
                j++;
                int out = 0;
                while (j < body_len && body[j] != '"' && out < 499) {
                    if (body[j] == '\\' && j + 1 < body_len) {
                        j++;
                        switch (body[j]) {
                            case '"':  value[out++] = '"';  break;
                            case '\\': value[out++] = '\\'; break;
                            case 'n':  value[out++] = '\n'; break;
                            case 'r':  value[out++] = '\r'; break;
                            case 't':  value[out++] = '\t'; break;
                            default:   value[out++] = body[j]; break;
                        }
                    } else {
                        value[out++] = body[j];
                    }
                    j++;
                }
                memset(value + out, ' ', 500 - out);
                *status = 0;
            } else if (body[j] == 'n' && j + 3 < body_len &&
                       strncmp(body + j, "null", 4) == 0) {
                /* null value → empty */
                *status = 0;
            } else {
                /* Numeric or other - read until , or } */
                int out = 0;
                while (j < body_len && body[j] != ',' && body[j] != '}'
                       && body[j] != ']' && out < 499) {
                    value[out++] = body[j++];
                }
                /* Trim trailing spaces/whitespace */
                while (out > 0 && (value[out-1] == ' ' || value[out-1] == '\n'
                       || value[out-1] == '\r' || value[out-1] == '\t')) {
                    out--;
                }
                memset(value + out, ' ', 500 - out);
                *status = 0;
            }
            return;
        }
    }
}

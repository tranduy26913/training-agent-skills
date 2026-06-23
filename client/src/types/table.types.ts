/**
 * Column definition for AppDataTable reusable component.
 * T = row data type, inferred from the :value prop on AppDataTable.
 */
export interface AppTableColumn<T = object> {
  /** Row data field key */
  field: string;
  /** Column header label */
  header: string;
  /** Fixed CSS width applied to both width and min-width, e.g. '140px' */
  width: string;
  /** Enable sortable header */
  sortable?: boolean;
  /**
   * Enable text truncation with ellipsis. Overflowed text is shown via
   * PrimeVue tooltip on hover. The tooltip value comes from formatter() or
   * String(row[field]).
   */
  truncate?: boolean;
  /**
   * Viewport px threshold  Ehide this column when window.innerWidth < hideBelow.
   * Ignored when frozen = true (frozen columns are always visible).
   */
  hideBelow?: number;
  /** Freeze column position. Requires scrollable DataTable. */
  frozen?: boolean;
  /** Side to freeze to. Defaults to 'right'. */
  alignFrozen?: 'left' | 'right';
  /** Text alignment of the header cell. Defaults to 'left'. */
  headerAlign?: 'left' | 'center' | 'right';
  /** Text alignment of body cells. Defaults to 'left'. */
  columnAlign?: 'left' | 'center' | 'right';
  /**
   * Custom text formatter for display and tooltip.
   * When provided, this function is called instead of String(row[field]).
   * Has no effect when a #cell-{field} slot is also provided.
   */
  formatter?: (row: T) => string;
}

/**
 * Table Utilities
 * Reusable functions for table sorting, filtering, and pagination
 */

class TableManager {
  constructor(tableId, options = {}) {
    this.table = document.getElementById(tableId);
    if (!this.table) {
      throw new Error(`Table with id "${tableId}" not found`);
    }

    this.options = {
      sortable: true,
      filterable: true,
      paginated: false,
      pageSize: 10,
      searchPlaceholder: 'Search...',
      ...options
    };

    this.data = [];
    this.filteredData = [];
    this.currentSort = { column: null, direction: 'asc' };
    this.currentFilter = '';
    this.currentPage = 0;

    this.init();
  }

  init() {
    if (this.options.filterable) {
      this.createSearchBox();
    }

    if (this.options.sortable) {
      this.setupSortableHeaders();
    }

    if (this.options.paginated) {
      this.createPagination();
    }
  }

  createSearchBox() {
    const searchContainer = document.createElement('div');
    searchContainer.className = 'table-search';
    searchContainer.innerHTML = `
      <input
        type="text"
        class="form-input"
        placeholder="${this.options.searchPlaceholder}"
        id="${this.table.id}-search"
      >
    `;

    this.table.parentNode.insertBefore(searchContainer, this.table);

    const searchInput = searchContainer.querySelector('input');
    searchInput.addEventListener('input', (e) => {
      this.filter(e.target.value);
    });
  }

  setupSortableHeaders() {
    const headers = this.table.querySelectorAll('thead th[data-sortable]');
    headers.forEach(header => {
      header.style.cursor = 'pointer';
      header.addEventListener('click', () => {
        const column = header.dataset.sortable;
        this.sort(column);
      });

      // Add sort indicator
      const indicator = document.createElement('span');
      indicator.className = 'sort-indicator';
      header.appendChild(indicator);
    });
  }

  createPagination() {
    const paginationContainer = document.createElement('div');
    paginationContainer.className = 'table-pagination';
    paginationContainer.id = `${this.table.id}-pagination`;
    this.table.parentNode.appendChild(paginationContainer);
  }

  setData(data) {
    this.data = data;
    this.filteredData = [...data];
    this.render();
  }

  filter(searchTerm) {
    this.currentFilter = searchTerm.toLowerCase();

    if (!searchTerm) {
      this.filteredData = [...this.data];
    } else {
      this.filteredData = this.data.filter(row => {
        return Object.values(row).some(value => {
          if (value === null || value === undefined) return false;
          return String(value).toLowerCase().includes(this.currentFilter);
        });
      });
    }

    this.currentPage = 0;
    this.render();
  }

  sort(column) {
    // Toggle direction if same column, otherwise default to ascending
    if (this.currentSort.column === column) {
      this.currentSort.direction = this.currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
      this.currentSort.column = column;
      this.currentSort.direction = 'asc';
    }

    this.filteredData.sort((a, b) => {
      let aVal = a[column];
      let bVal = b[column];

      // Handle null/undefined
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      // Handle dates
      if (aVal instanceof Date || !isNaN(Date.parse(aVal))) {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      }

      // Handle numbers
      if (!isNaN(aVal) && !isNaN(bVal)) {
        aVal = Number(aVal);
        bVal = Number(bVal);
      }

      // Compare
      if (aVal < bVal) return this.currentSort.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return this.currentSort.direction === 'asc' ? 1 : -1;
      return 0;
    });

    // Update sort indicators
    const headers = this.table.querySelectorAll('thead th[data-sortable]');
    headers.forEach(header => {
      const indicator = header.querySelector('.sort-indicator');
      if (header.dataset.sortable === column) {
        indicator.textContent = this.currentSort.direction === 'asc' ? ' ▲' : ' ▼';
      } else {
        indicator.textContent = '';
      }
    });

    this.render();
  }

  render() {
    const tbody = this.table.querySelector('tbody');
    if (!tbody) return;

    // Clear existing rows
    tbody.innerHTML = '';

    // Calculate pagination
    let dataToRender = this.filteredData;
    if (this.options.paginated) {
      const start = this.currentPage * this.options.pageSize;
      const end = start + this.options.pageSize;
      dataToRender = this.filteredData.slice(start, end);
    }

    // Render rows
    if (dataToRender.length === 0) {
      const headers = this.table.querySelectorAll('thead th');
      const colspan = headers.length;
      tbody.innerHTML = `
        <tr>
          <td colspan="${colspan}" style="text-align: center; padding: 2rem; color: #666;">
            No data found
          </td>
        </tr>
      `;
      return;
    }

    if (this.options.renderRow) {
      dataToRender.forEach(row => {
        const tr = this.options.renderRow(row);
        tbody.appendChild(tr);
      });
    }

    // Update pagination if enabled
    if (this.options.paginated) {
      this.updatePagination();
    }

    // Dispatch render event
    this.table.dispatchEvent(new CustomEvent('tableRendered', {
      detail: { rows: dataToRender.length, total: this.filteredData.length }
    }));
  }

  updatePagination() {
    const paginationContainer = document.getElementById(`${this.table.id}-pagination`);
    if (!paginationContainer) return;

    const totalPages = Math.ceil(this.filteredData.length / this.options.pageSize);
    const start = this.currentPage * this.options.pageSize + 1;
    const end = Math.min((this.currentPage + 1) * this.options.pageSize, this.filteredData.length);

    paginationContainer.innerHTML = `
      <div class="pagination-info">
        Showing ${start}-${end} of ${this.filteredData.length}
      </div>
      <div class="pagination-controls">
        <button
          class="btn btn-sm"
          ${this.currentPage === 0 ? 'disabled' : ''}
          data-action="first"
        >First</button>
        <button
          class="btn btn-sm"
          ${this.currentPage === 0 ? 'disabled' : ''}
          data-action="prev"
        >Previous</button>
        <span class="pagination-page">Page ${this.currentPage + 1} of ${totalPages}</span>
        <button
          class="btn btn-sm"
          ${this.currentPage >= totalPages - 1 ? 'disabled' : ''}
          data-action="next"
        >Next</button>
        <button
          class="btn btn-sm"
          ${this.currentPage >= totalPages - 1 ? 'disabled' : ''}
          data-action="last"
        >Last</button>
      </div>
    `;

    // Add event listeners
    paginationContainer.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        switch (action) {
          case 'first':
            this.currentPage = 0;
            break;
          case 'prev':
            this.currentPage = Math.max(0, this.currentPage - 1);
            break;
          case 'next':
            this.currentPage = Math.min(totalPages - 1, this.currentPage + 1);
            break;
          case 'last':
            this.currentPage = totalPages - 1;
            break;
        }
        this.render();
      });
    });
  }

  refresh() {
    this.render();
  }

  getData() {
    return this.filteredData;
  }

  getAllData() {
    return this.data;
  }

  clear() {
    this.data = [];
    this.filteredData = [];
    this.render();
  }
}

/**
 * Create a table row element from data
 * @param {Object} rowData - Row data object
 * @param {Array} columns - Array of column definitions
 * @returns {HTMLTableRowElement}
 */
function createTableRow(rowData, columns) {
  const tr = document.createElement('tr');

  columns.forEach(column => {
    const td = document.createElement('td');

    if (column.render) {
      // Custom render function
      const content = column.render(rowData[column.key], rowData);
      if (typeof content === 'string') {
        td.innerHTML = content;
      } else {
        td.appendChild(content);
      }
    } else {
      // Default rendering
      td.textContent = rowData[column.key] || '';
    }

    if (column.className) {
      td.className = column.className;
    }

    tr.appendChild(td);
  });

  return tr;
}

/**
 * Format date for display
 * @param {string|Date} date - Date to format
 * @returns {string}
 */
function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Format datetime for display
 * @param {string|Date} date - Datetime to format
 * @returns {string}
 */
function formatDateTime(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Create action buttons for table rows
 * @param {Object} options - Button configuration
 * @returns {HTMLDivElement}
 */
function createActionButtons(options) {
  const container = document.createElement('div');
  container.className = 'table-actions';

  if (options.onView) {
    const viewBtn = document.createElement('button');
    viewBtn.className = 'btn btn-sm btn-secondary';
    viewBtn.textContent = 'View';
    viewBtn.addEventListener('click', options.onView);
    container.appendChild(viewBtn);
  }

  if (options.onEdit) {
    const editBtn = document.createElement('button');
    editBtn.className = 'btn btn-sm btn-primary';
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', options.onEdit);
    container.appendChild(editBtn);
  }

  if (options.onDelete) {
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-sm btn-danger';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', options.onDelete);
    container.appendChild(deleteBtn);
  }

  return container;
}

// Export for use in other modules (Node.js)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    TableManager,
    createTableRow,
    formatDate,
    formatDateTime,
    createActionButtons
  };
}

// Make globally available in browser
if (typeof window !== 'undefined') {
  window.TableManager = TableManager;
  window.formatDate = formatDate;
  window.formatDateTime = formatDateTime;
  window.createTableRow = createTableRow;
  window.createActionButtons = createActionButtons;
}

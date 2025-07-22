// Content script for extracting ADX table data
class ADXTableExtractor {
  constructor() {
    this.setupMessageListener();
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'exportTable') {
        try {
          const tableData = this.extractCurrentTable();
          
          if (tableData) {
            sendResponse({
              success: true,
              data: tableData
            });
          } else {
            sendResponse({
              success: false,
              error: 'No visible AG Grid table found on this page. Make sure you are on an Azure Data Explorer page with query results displayed.'
            });
          }
        } catch (error) {
          sendResponse({
            success: false,
            error: `Failed to extract table: ${error.message || 'Unknown error'}`
          });
        }
      }
      return true; // Keep message channel open for async response
    });
  }

  findAGGrid() {
    // Look for AG Grid root element
    const agGrids = document.querySelectorAll('.ag-root[role="grid"]');
    
    for (const grid of agGrids) {
      if (this.isGridVisible(grid) && this.hasDataRows(grid)) {
        return grid;
      }
    }
    
    return null;
  }

  isGridVisible(grid) {
    const rect = grid.getBoundingClientRect();
    const style = window.getComputedStyle(grid);
    
    return (
      rect.width > 0 &&
      rect.height > 0 &&
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      style.opacity !== '0'
    );
  }

  hasDataRows(grid) {
    const dataRows = grid.querySelectorAll('.ag-center-cols-container [role="row"]');
    return dataRows.length > 0;
  }

  extractCurrentTable() {
    const grid = this.findAGGrid();
    if (!grid) {
      return null;
    }

    return this.extractAGGridData(grid);
  }

  extractAGGridData(grid) {
    const headers = [];
    const rows = [];

    // Extract headers from AG Grid header row
    const headerCells = grid.querySelectorAll('.ag-header-row .ag-header-cell');
    headerCells.forEach(cell => {
      const textElement = cell.querySelector('.ag-header-cell-text');
      if (textElement && textElement.textContent.trim()) {
        headers.push(this.cleanCellText(textElement.textContent));
      }
    });

    // Extract data rows from AG Grid center container
    const dataRows = grid.querySelectorAll('.ag-center-cols-container [role="row"]');
    dataRows.forEach(row => {
      const rowData = [];
      const cells = row.querySelectorAll('[role="gridcell"]');
      
      cells.forEach(cell => {
        // Skip expand/collapse column (usually has icons)
        if (cell.classList.contains('rowExpandIndicator') || 
            cell.querySelector('.ag-group-expanded, .ag-group-contracted')) {
          return;
        }
        
        // Get text content, handling various AG Grid cell structures
        let cellText = '';
        const spanElement = cell.querySelector('span:not(.ag-cell-wrapper):not(.ag-icon)');
        if (spanElement) {
          cellText = spanElement.textContent || '';
        } else {
          // Fallback to cell's direct text content
          cellText = cell.textContent || '';
        }
        
        rowData.push(this.cleanCellText(cellText));
      });
      
      // Only add rows that have actual data
      if (rowData.length > 0 && rowData.some(cell => cell.trim() !== '')) {
        // Ensure row matches header length
        while (rowData.length < headers.length) {
          rowData.push('');
        }
        rows.push(rowData.slice(0, headers.length));
      }
    });

    return {
      headers,
      rows,
      tableName: this.guessTableName()
    };
  }

  cleanCellText(text) {
    return text
      .replace(/\s+/g, ' ')
      .replace(/\|/g, '\\|') // Escape pipe characters for markdown
      .replace(/[\u00A0]/g, ' ') // Replace non-breaking spaces
      .trim();
  }

  guessTableName() {
    // Try to find table name from ADX UI elements
    const possibleSelectors = [
      '.query-result-header',
      '.ms-Panel-headerText',
      'h1, h2, h3',
      '[data-automation-id*="query"]'
    ];

    for (const selector of possibleSelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent) {
        const text = element.textContent.trim();
        if (text.length > 0 && text.length < 100) {
          return text.replace(/[^a-zA-Z0-9-_]/g, '_');
        }
      }
    }

    return 'adx_table';
  }
}

// Initialize the content script
new ADXTableExtractor();

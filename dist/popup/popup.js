// Popup script for ADX Table Exporter
class PopupManager {
  constructor() {
    this.tableData = null;
    this.initializeElements();
    this.setupEventListeners();
    this.extractTable(); // Auto-extract on popup open
  }

  initializeElements() {
    this.elements = {
      errorMessage: document.getElementById('error-message'),
      successMessage: document.getElementById('success-message'),
      loading: document.getElementById('loading'),
      actionButtons: document.getElementById('action-buttons'),
      retrySection: document.getElementById('retry-section'),
      copyBtn: document.getElementById('copy-btn'),
      downloadBtn: document.getElementById('download-btn'),
      retryBtn: document.getElementById('retry-btn')
    };
  }

  setupEventListeners() {
    this.elements.copyBtn.addEventListener('click', () => this.copyToClipboard());
    this.elements.downloadBtn.addEventListener('click', () => this.downloadFile());
    this.elements.retryBtn.addEventListener('click', () => this.extractTable());
  }

  showElement(element) {
    element.classList.remove('hidden');
  }

  hideElement(element) {
    element.classList.add('hidden');
  }

  showError(message) {
    this.elements.errorMessage.textContent = message;
    this.showElement(this.elements.errorMessage);
    this.hideElement(this.elements.successMessage);
  }

  showSuccess(message) {
    this.elements.successMessage.textContent = message;
    this.showElement(this.elements.successMessage);
    this.hideElement(this.elements.errorMessage);
  }

  clearMessages() {
    this.hideElement(this.elements.errorMessage);
    this.hideElement(this.elements.successMessage);
  }

  setLoadingState(isLoading) {
    if (isLoading) {
      this.showElement(this.elements.loading);
      this.hideElement(this.elements.actionButtons);
      this.hideElement(this.elements.retrySection);
    } else {
      this.hideElement(this.elements.loading);
      
      if (this.tableData) {
        this.showElement(this.elements.actionButtons);
        this.hideElement(this.elements.retrySection);
      } else {
        this.hideElement(this.elements.actionButtons);
        this.showElement(this.elements.retrySection);
      }
    }
  }

  async extractTable() {
    this.clearMessages();
    this.setLoadingState(true);

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab.id) {
        throw new Error('Could not identify active tab');
      }

      // Check if we're on an ADX page
      const adxDomains = ['kusto.windows.net', 'dataexplorer.azure.com'];
      const isADXPage = adxDomains.some(domain => tab.url?.includes(domain));
      
      if (!isADXPage) {
        throw new Error('Please navigate to an Azure Data Explorer page first');
      }

      // Send message to content script
      const response = await chrome.tabs.sendMessage(tab.id, {
        action: 'exportTable'
      });

      if (response.success && response.data) {
        this.tableData = response.data;
        this.showSuccess(
          `Found table with ${response.data.rows.length} rows and ${response.data.headers.length} columns`
        );
      } else {
        throw new Error(response.error || 'Failed to extract table');
      }
    } catch (error) {
      this.tableData = null;
      this.showError(error.message || 'Unknown error occurred');
    } finally {
      this.setLoadingState(false);
    }
  }

  async copyToClipboard() {
    if (!this.tableData) return;

    this.clearMessages();
    try {
      const markdown = MarkdownConverter.tableToMarkdown(this.tableData);
      const success = await ClipboardUtils.copyToClipboard(markdown);
      
      if (success) {
        this.showSuccess('Copied to clipboard!');
      } else {
        throw new Error('Failed to copy to clipboard');
      }
    } catch (error) {
      this.showError(error.message || 'Copy failed');
    }
  }

  async downloadFile() {
    if (!this.tableData) return;

    this.clearMessages();
    try {
      const markdown = MarkdownConverter.tableToMarkdown(this.tableData);
      const filename = MarkdownConverter.generateFileName(this.tableData.tableName);
      
      DownloadUtils.downloadAsFile(markdown, filename);
      this.showSuccess(`Downloaded as ${filename}`);
    } catch (error) {
      this.showError(error.message || 'Download failed');
    }
  }
}

// Initialize the popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PopupManager();
});

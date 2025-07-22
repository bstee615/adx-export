// Utility functions for markdown conversion and file operations
class MarkdownConverter {
  static tableToMarkdown(tableData) {
    if (!tableData.headers.length || !tableData.rows.length) {
      return '# Empty Table\n\nNo data available to export.';
    }

    const { headers, rows, tableName } = tableData;
    const timestamp = new Date().toISOString().split('T')[0];
    
    let markdown = '';

    // Create table header
    markdown += '| ' + headers.join(' | ') + ' |\n';
    markdown += '|' + headers.map(() => ' --- ').join('|') + '|\n';

    // Add table rows
    rows.forEach(row => {
      // Pad row to match header length
      const paddedRow = [...row];
      while (paddedRow.length < headers.length) {
        paddedRow.push('');
      }

      markdown += '| ' + paddedRow.slice(0, headers.length).map(text => text.replace('|', '\\|')).join(' | ') + ' |\n';
    });

    return markdown;
  }

  static generateFileName(tableName) {
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, '-')
      .slice(0, -5); // Remove milliseconds and Z

    const baseName = (tableName && tableName !== 'adx_table') ? tableName : 'adx_table';
    return `${baseName}_${timestamp}.md`;
  }
}

class ClipboardUtils {
  static async copyToClipboard(text) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        return successful;
      }
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      return false;
    }
  }
}

class DownloadUtils {
  static downloadAsFile(content, filename) {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    // Use Chrome extension downloads API if available
    if (typeof chrome !== 'undefined' && chrome.downloads) {
      chrome.downloads.download({
        url: url,
        filename: filename,
        saveAs: false
      }, (downloadId) => {
        if (chrome.runtime.lastError) {
          console.error('Download failed:', chrome.runtime.lastError);
          // Fallback to regular download
          DownloadUtils.fallbackDownload(url, filename);
        }
        URL.revokeObjectURL(url);
      });
    } else {
      DownloadUtils.fallbackDownload(url, filename);
    }
  }

  static fallbackDownload(url, filename) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

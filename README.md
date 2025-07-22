# ADX Table Exporter Chrome/Edge Extension

A clean and simple Chrome/Edge extension that extracts tables from Azure Data Explorer (ADX) and exports them to Markdown format.

## Features

- 📊 **AG Grid Detection**: Automatically detects and extracts data from Azure Data Explorer's AG Grid tables
- 📋 **Copy to Clipboard** or 💾 **Download as File**: One-click copy table data as Markdown or download as a `.md` file with timestamp
- ⚡ **Vanilla JS**: No build system required - just load and go

## Installation Instructions

### Method 1: Load Unpacked Extension (Development)

1. **Download/Clone** this repository to your local machine
2. **Open Chrome/Edge** and navigate to extensions page:
   - Chrome: `chrome://extensions/`
   - Edge: `edge://extensions/`
3. **Enable Developer Mode** (toggle in top-right corner)
4. **Click "Load unpacked"** and select the `dist` folder from this project
5. **Pin the extension** to your toolbar for easy access

## Usage

1. **Navigate** to Azure Data Explorer (dataexplorer.azure.com or your kusto endpoint)
2. **Run a query** that returns tabular data
3. **Click the extension icon** in your browser toolbar
4. **Wait** for the extension to detect the table (happens automatically)
5. **Choose your action**:
   - **📋 Copy to Clipboard**: Copies Markdown table to clipboard
   - **💾 Download as .md**: Downloads file named `adx_table_YYYY-MM-DDTHH-mm-ss.md`

## File Structure

```
dist/                       # Extension package
├── manifest.json           # Extension configuration
├── popup/                  # Popup UI and logic
├── content/                # Table extraction
├── utils.js                # Utility functions (markdown, clipboard, download)
└── icons/                  # Icons created from icon.svg
```

## How It Works

1. **Content Script**: Injected into ADX pages to scan for AG Grid components
2. **Table Detection**: Looks for `.ag-root[role="grid"]` elements with data
3. **Data Extraction**: Extracts headers from `.ag-header-cell-text` and rows from `[role="gridcell"]`
4. **Markdown Conversion**: Converts extracted data to properly formatted Markdown tables
5. **Export Options**: Provides clipboard copy and file download functionality

## Troubleshooting

**"No visible table found"**
- Make sure you're on an Azure Data Explorer page
- Ensure your query has returned results and the table is visible
- Try clicking the "refresh" button or refreshing the page and running the query again

**Extension not working**
- If you see "Please navigate to an Azure Data Explorer page first", check that you're on a supported ADX domain
    - `https://*.kusto.windows.net/*`
    - `https://dataexplorer.azure.com/*`
    - `https://*.dataexplorer.azure.com/*`
- Ensure the extension has permissions for the current site (Extension settings)
- Otherwise, an error message should be shown on the popup; feel free to submit a GitHub issue with a screenshot.

## Permissions

- `activeTab`: Access to current tab for table extraction
- `downloads`: Download generated Markdown files
- Host permissions for ADX domains

## License

MIT License - feel free to modify and distribute as needed.

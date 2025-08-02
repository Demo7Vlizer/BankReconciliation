# Bank Reconciliation System

A comprehensive web-based bank reconciliation tool that compares bank statements with Tally Prime data to identify matched and unmatched transactions.

## Features

- **File Upload**: Support for Excel (.xlsx, .xls) and CSV files
- **Smart Matching**: Matches transactions by date, amount, and type with tolerance
- **Filtering**: Filter by month, year, and amount range
- **Real-time Processing**: Handles large datasets efficiently
- **Export Results**: Export reconciliation results to Excel format
- **Responsive Design**: Works on desktop and mobile devices

## How to Use

### 1. Prepare Your Data Files

#### Bank Statement Format

Your bank statement should have columns for:

- **Date**: Transaction date (DD/MM/YYYY format)
- **Description**: Transaction description/narration
- **Amount**: Transaction amount
- **Type**: Debit/Credit (optional)

#### Tally Prime Data Format

Your Tally data should have similar columns:

- **Date**: Voucher date
- **Description**: Ledger name or narration
- **Amount**: Transaction amount
- **Type**: Debit/Credit (optional)

### 2. Upload Files

1. Open `index.html` in your web browser
2. Upload your bank statement file in the "Upload Bank Statement" section
3. Upload your Tally data file in the "Upload Tally Data" section

### 3. Configure Filters (Optional)

- **Month Filter**: Select specific month to analyze
- **Year Filter**: Select specific year to analyze
- **Amount Range**: Set minimum and maximum amount filters

### 4. Start Reconciliation

Click the "Start Reconciliation" button to begin the matching process.

### 5. Review Results

The system will display results in three tabs:

#### Matched Transactions

- Shows transactions that match between bank and Tally data
- Displays date, description, amounts, and type

#### Unmatched Transactions

- Shows transactions that exist in one system but not the other
- Separates bank and Tally transactions

#### Differences

- Shows transactions with matching dates but different amounts
- Highlights discrepancies for investigation

### 6. Export Results

Click "Export Results" to download an Excel file containing:

- Matched transactions
- Unmatched transactions
- Differences
- Summary statistics

## Sample Data

The system includes sample files for testing:

- `sample_bank_data.csv`: Sample bank statement
- `sample_tally_data.csv`: Sample Tally data

## Technical Details

### Matching Algorithm

The system uses the following criteria to match transactions:

1. **Date Matching**: Transactions within 1 day of each other
2. **Amount Matching**: Amounts within ₹0.01 tolerance
3. **Type Matching**: Debit/Credit type matching (if available)

### Supported File Formats

- **Excel**: .xlsx, .xls files
- **CSV**: Comma-separated values files

### Browser Compatibility

- Chrome (recommended)
- Firefox
- Safari
- Edge

## File Structure

```
BANK-RECONCILIATION/
├── index.html              # Main application file
├── styles.css              # Styling and layout
├── script.js               # Core reconciliation logic
├── sample_bank_data.csv    # Sample bank statement
├── sample_tally_data.csv   # Sample Tally data
└── README.md              # This file
```

## Troubleshooting

### Common Issues

1. **File Not Loading**

   - Ensure file format is supported (.csv, .xlsx, .xls)
   - Check file size (should be under 10MB)

2. **No Matches Found**

   - Verify date formats are consistent
   - Check if amounts are in the same currency
   - Ensure transaction types are properly labeled

3. **Slow Performance**
   - Use filters to reduce data size
   - Close other browser tabs
   - Consider splitting large files

### Data Format Tips

- Use consistent date formats (DD/MM/YYYY recommended)
- Include transaction descriptions for better matching
- Label transaction types as "debit" or "credit"
- Remove currency symbols from amount columns

## Security Notes

- All processing happens locally in your browser
- No data is uploaded to external servers
- Files are not stored permanently

## Support

For issues or questions:

1. Check the troubleshooting section above
2. Verify your data format matches the requirements
3. Test with the provided sample files first

---

**Note**: This is a client-side application. For production use with sensitive financial data, consider implementing additional security measures and server-side validation.

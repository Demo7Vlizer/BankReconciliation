class BankReconciliation {
    constructor() {
        this.bankData = [];
        this.tallyData = [];
        this.matchedTransactions = [];
        this.unmatchedBankTransactions = [];
        this.unmatchedTallyTransactions = [];
        this.differences = [];
        this.currentPasteTarget = null;
        
        // Fuzzy matching configuration
        this.fuzzyConfig = {
            searchRange: 6,        // Check next 6 entries
            dateTolerance: 7,      // Within 7 days
            amountTolerance: 0.01  // Amount tolerance
        };
        
        this.initializeEventListeners();
        this.populateYearFilter();
    }

    initializeEventListeners() {
        // Add row buttons
        document.getElementById('addBankRow').addEventListener('click', () => {
            this.addRow('bankDataTable');
        });
        
        document.getElementById('addTallyRow').addEventListener('click', () => {
            this.addRow('tallyDataTable');
        });

        // Clear data buttons
        document.getElementById('clearBankData').addEventListener('click', () => {
            this.clearTable('bankDataTable');
        });
        
        document.getElementById('clearTallyData').addEventListener('click', () => {
            this.clearTable('tallyDataTable');
        });

        // Paste data buttons
        document.getElementById('pasteBankData').addEventListener('click', () => {
            this.openPasteModal('bankDataTable');
        });
        
        document.getElementById('pasteTallyData').addEventListener('click', () => {
            this.openPasteModal('tallyDataTable');
        });

        // Download data buttons
        document.getElementById('downloadBankData').addEventListener('click', () => {
            this.downloadTableData('bankDataTable', 'Bank_Statement_Data');
        });
        
        document.getElementById('downloadTallyData').addEventListener('click', () => {
            this.downloadTableData('tallyDataTable', 'Tally_Prime_Data');
        });

        // Modal controls
        document.getElementById('processPasteBtn').addEventListener('click', () => {
            this.processPastedData();
        });
        
        document.getElementById('cancelPasteBtn').addEventListener('click', () => {
            this.closePasteModal();
        });

        // Modal close button
        document.querySelector('.close').addEventListener('click', () => {
            this.closePasteModal();
        });

        // Close modal when clicking outside
        window.addEventListener('click', (event) => {
            const modal = document.getElementById('pasteModal');
            if (event.target === modal) {
                this.closePasteModal();
            }
        });

        // Reconciliation button
        document.getElementById('reconcileBtn').addEventListener('click', () => {
            this.performReconciliation();
        });

        // Filter listeners
        document.getElementById('monthFilter').addEventListener('change', () => {
            this.applyFilters();
        });
        
        document.getElementById('yearFilter').addEventListener('change', () => {
            this.applyFilters();
        });
        
        document.getElementById('minAmount').addEventListener('input', () => {
            this.applyFilters();
        });
        
        document.getElementById('maxAmount').addEventListener('input', () => {
            this.applyFilters();
        });

        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Export button
        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportResults();
        });
    }

    populateYearFilter() {
        const yearSelect = document.getElementById('yearFilter');
        const currentYear = new Date().getFullYear();
        
        for (let year = currentYear; year >= currentYear - 10; year--) {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            yearSelect.appendChild(option);
        }
    }

    addRow(tableId) {
        const table = document.getElementById(tableId);
        const tbody = table.querySelector('tbody');
        const newRow = document.createElement('tr');
        
        newRow.innerHTML = `
            <td><input type="text" placeholder="01/01/2024" class="date-input"></td>
            <td><input type="number" placeholder="50000" class="amount-input"></td>
            <td>
                <button class="delete-row-btn" onclick="deleteRow(this)">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        tbody.appendChild(newRow);
    }

    clearTable(tableId) {
        const table = document.getElementById(tableId);
        const tbody = table.querySelector('tbody');
        
        // Keep one empty row
        tbody.innerHTML = `
            <tr>
                <td><input type="text" placeholder="01/01/2024" class="date-input"></td>
                <td><input type="number" placeholder="50000" class="amount-input"></td>
                <td>
                    <button class="delete-row-btn" onclick="deleteRow(this)">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }

    openPasteModal(tableId) {
        this.currentPasteTarget = tableId;
        document.getElementById('pasteModal').style.display = 'block';
        document.getElementById('pasteTextarea').focus();
    }

    closePasteModal() {
        document.getElementById('pasteModal').style.display = 'none';
        document.getElementById('pasteTextarea').value = '';
        this.currentPasteTarget = null;
    }

    processPastedData() {
        const textarea = document.getElementById('pasteTextarea');
        const data = textarea.value.trim();
        
        if (!data) {
            alert('Please paste some data first.');
            return;
        }

        const rows = data.split('\n').filter(row => row.trim());
        const processedData = [];

        for (let row of rows) {
            // Split by tab, comma, or multiple spaces
            const columns = row.split(/[\t,]+|\s{2,}/).map(col => col.trim()).filter(col => col);
            
            if (columns.length >= 2) {
                const [date, amount] = columns;
                const parsedDate = this.parseDate(date);
                const parsedAmount = this.parseAmount(amount);
                
                if (parsedDate && parsedAmount !== null) {
                    processedData.push({
                        date: parsedDate,
                        description: '', // No description needed
                        amount: parsedAmount,
                        type: 'unknown' // No type needed
                    });
                } else {
                    console.log(`Skipping invalid row: Date="${date}" Amount="${amount}"`);
                }
            }
        }

        if (processedData.length === 0) {
            alert('No valid data found. Please check your format. Expected: Date Amount');
            return;
        }

        this.populateTableWithData(this.currentPasteTarget, processedData);
        this.closePasteModal();
        
        // Show success message
        alert(`Successfully processed ${processedData.length} transactions!`);
    }

    populateTableWithData(tableId, data) {
        const table = document.getElementById(tableId);
        const tbody = table.querySelector('tbody');
        
        // Clear existing rows
        tbody.innerHTML = '';
        
        // Add data rows
        for (let item of data) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><input type="text" value="${this.formatDateForInput(item.date)}" class="date-input"></td>
                <td><input type="number" value="${item.amount}" class="amount-input"></td>
                <td>
                    <button class="delete-row-btn" onclick="deleteRow(this)">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        }
        
        // Add one empty row at the end
        this.addRow(tableId);
    }

    collectTableData(tableId) {
        const table = document.getElementById(tableId);
        const rows = table.querySelectorAll('tbody tr');
        const data = [];

        for (let row of rows) {
            const inputs = row.querySelectorAll('input, select');
            if (inputs.length === 0) continue;

            const dateInput = inputs[0];
            const amountInput = inputs[1];

            // Skip empty rows
            if (!dateInput.value.trim() && !amountInput.value.trim()) {
                continue;
            }

            const date = this.parseDate(dateInput.value);
            const amount = this.parseAmount(amountInput.value);

            if (date && amount !== null) {
                data.push({
                    date: date,
                    description: '', // No description needed
                    amount: amount,
                    type: 'unknown', // No type needed
                    source: tableId === 'bankDataTable' ? 'bank' : 'tally'
                });
            }
        }

        return data;
    }

    parseDate(dateString) {
        if (!dateString) return null;
        
        // Clean the date string
        const cleanDate = dateString.toString().trim();
        
        // Try DD-Mon-YY format (Excel format like "01-Apr-24")
        const excelFormat = cleanDate.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{2})$/);
        if (excelFormat) {
            const day = parseInt(excelFormat[1]);
            const monthName = excelFormat[2];
            const year = parseInt(excelFormat[3]);
            
            // Convert month name to number
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                              'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const month = monthNames.findIndex(m => m.toLowerCase() === monthName.toLowerCase());
            
            if (month !== -1) {
                // Convert 2-digit year to 4-digit year
                const fullYear = year < 50 ? 2000 + year : 1900 + year;
                const date = new Date(fullYear, month, day);
                
                // Validate the date
                if (date.getDate() === day && date.getMonth() === month && date.getFullYear() === fullYear) {
                    return date;
                }
            }
        }
        
        // Try DD-MM-YYYY format (like "24-04-2024")
        const dashFormat = cleanDate.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
        if (dashFormat) {
            const day = parseInt(dashFormat[1]);
            const month = parseInt(dashFormat[2]) - 1; // Month is 0-indexed
            const year = parseInt(dashFormat[3]);
            
            // Validate the date
            if (day >= 1 && day <= 31 && month >= 0 && month <= 11 && year >= 1900 && year <= 2100) {
                const date = new Date(year, month, day);
                if (date.getDate() === day && date.getMonth() === month && date.getFullYear() === year) {
                    return date;
                }
            }
        }
        
        // Try DD/MM/YYYY format (most common in India)
        const parts = cleanDate.split(/[\/\-\.\s]/).filter(part => part.trim());
        if (parts.length === 3) {
            const day = parseInt(parts[0]);
            const month = parseInt(parts[1]) - 1; // Month is 0-indexed
            const year = parseInt(parts[2]);
            
            // Validate the date
            if (day >= 1 && day <= 31 && month >= 0 && month <= 11 && year >= 1900 && year <= 2100) {
                const date = new Date(year, month, day);
                // Check if the date is valid (handles cases like 31/02/2024)
                if (date.getDate() === day && date.getMonth() === month && date.getFullYear() === year) {
                    return date;
                }
            }
        }
        
        // Try MM/DD/YYYY format as fallback
        if (parts.length === 3) {
            const month = parseInt(parts[0]) - 1;
            const day = parseInt(parts[1]);
            const year = parseInt(parts[2]);
            
            // Validate the date
            if (day >= 1 && day <= 31 && month >= 0 && month <= 11 && year >= 1900 && year <= 2100) {
                const date = new Date(year, month, day);
                if (date.getDate() === day && date.getMonth() === month && date.getFullYear() === year) {
                    return date;
                }
            }
        }
        
        // Try standard Date constructor as last resort
        const date = new Date(cleanDate);
        if (!isNaN(date.getTime())) return date;
        
        return null;
    }

    parseAmount(amountString) {
        if (!amountString) return null;
        
        // Remove currency symbols and commas
        const cleanAmount = amountString.toString().replace(/[^\d\.\-]/g, '');
        const amount = parseFloat(cleanAmount);
        
        return isNaN(amount) ? null : amount;
    }

    formatDateForInput(date) {
        if (!date) return '';
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }

    performReconciliation() {
        // Collect data from tables
        this.bankData = this.collectTableData('bankDataTable');
        this.tallyData = this.collectTableData('tallyDataTable');

        if (this.bankData.length === 0 || this.tallyData.length === 0) {
            alert('Please enter data in both Bank Statement and Tally Data tables.');
            return;
        }

        const reconcileBtn = document.getElementById('reconcileBtn');
        const originalText = reconcileBtn.innerHTML;
        reconcileBtn.innerHTML = '<div class="loading"></div> Processing...';
        reconcileBtn.disabled = true;

        // Use setTimeout to allow UI to update
        setTimeout(() => {
            this.executeReconciliation();
            reconcileBtn.innerHTML = originalText;
            reconcileBtn.disabled = false;
        }, 100);
    }

    executeReconciliation() {
        this.matchedTransactions = [];
        this.unmatchedBankTransactions = [];
        this.unmatchedTallyTransactions = [];
        this.differences = [];

        // Sort transactions by date
        const bankTransactions = [...this.bankData].sort((a, b) => a.date.getTime() - b.date.getTime());
        const tallyTransactions = [...this.tallyData].sort((a, b) => a.date.getTime() - b.date.getTime());

        // Step 1: Match exact individual transactions
        this.matchExactTransactions(bankTransactions, tallyTransactions);

        // Step 2: Match grouped transactions by date
        this.matchGroupedTransactions(bankTransactions, tallyTransactions);

        // Step 3: Match with running balance (carry forward logic)
        this.matchWithRunningBalance(bankTransactions, tallyTransactions);

        // Add remaining unmatched transactions
        bankTransactions.forEach(transaction => {
            this.unmatchedBankTransactions.push(transaction);
        });
        
        tallyTransactions.forEach(transaction => {
            this.unmatchedTallyTransactions.push(transaction);
        });

        // Find differences in matched transactions
        this.matchedTransactions.forEach(match => {
            if (match.difference > 0.01) {
                this.differences.push(match);
            }
        });

        this.updateSummary();
        this.displayResults();
    }

    matchExactTransactions(bankTransactions, tallyTransactions) {
        for (let i = 0; i < bankTransactions.length; i++) {
            const bankTransaction = bankTransactions[i];
            let matched = false;

            // First try exact match
            for (let j = 0; j < tallyTransactions.length; j++) {
                const tallyTransaction = tallyTransactions[j];
                
                if (this.isIndividualMatch(bankTransaction, tallyTransaction)) {
                    this.matchedTransactions.push({
                        bankTransactions: [bankTransaction],
                        tallyTransactions: [tallyTransaction],
                        bankTotal: bankTransaction.amount,
                        tallyTotal: tallyTransaction.amount,
                        date: bankTransaction.date,
                        difference: Math.abs(bankTransaction.amount - tallyTransaction.amount),
                        matchType: 'exact'
                    });
                    
                    // Remove matched transactions
                    bankTransactions.splice(i, 1);
                    tallyTransactions.splice(j, 1);
                    i--; // Adjust index after removal
                    matched = true;
                    break;
                }
            }

            // If no exact match, try fuzzy matching (check next 5-6 entries)
            if (!matched) {
                const fuzzyMatch = this.findFuzzyMatch(bankTransaction, tallyTransactions);
                if (fuzzyMatch) {
                    this.matchedTransactions.push({
                        bankTransactions: [bankTransaction],
                        tallyTransactions: [fuzzyMatch],
                        bankTotal: bankTransaction.amount,
                        tallyTotal: fuzzyMatch.amount,
                        date: bankTransaction.date,
                        difference: Math.abs(bankTransaction.amount - fuzzyMatch.amount),
                        matchType: 'fuzzy'
                    });
                    
                    // Remove matched transactions
                    bankTransactions.splice(i, 1);
                    const fuzzyIndex = tallyTransactions.indexOf(fuzzyMatch);
                    tallyTransactions.splice(fuzzyIndex, 1);
                    i--; // Adjust index after removal
                    matched = true;
                }
            }
        }
    }

    findFuzzyMatch(bankTransaction, tallyTransactions) {
        // Check next N entries for amount match (ignoring date)
        const searchRange = Math.min(this.fuzzyConfig.searchRange, tallyTransactions.length);
        
        for (let i = 0; i < searchRange; i++) {
            const tallyTransaction = tallyTransactions[i];
            
            // Check if amounts match (within tolerance)
            const amountDiff = Math.abs(bankTransaction.amount - tallyTransaction.amount);
            if (amountDiff <= this.fuzzyConfig.amountTolerance) {
                // Check if dates are within reasonable range
                const dateDiff = Math.abs(bankTransaction.date.getTime() - tallyTransaction.date.getTime());
                const toleranceDays = this.fuzzyConfig.dateTolerance * 24 * 60 * 60 * 1000;
                
                if (dateDiff <= toleranceDays) {
                    return tallyTransaction;
                }
            }
        }
        
        return null;
    }

    matchGroupedTransactions(bankTransactions, tallyTransactions) {
        const bankByDate = this.groupTransactionsByDate(bankTransactions);
        const tallyByDate = this.groupTransactionsByDate(tallyTransactions);

        for (const [dateKey, bankTransactions] of Object.entries(bankByDate)) {
            const tallyTransactions = tallyByDate[dateKey];
            
            if (tallyTransactions) {
                const bankTotal = bankTransactions.reduce((sum, t) => sum + t.amount, 0);
                const tallyTotal = tallyTransactions.reduce((sum, t) => sum + t.amount, 0);
                
                // Check if totals match
                if (Math.abs(bankTotal - tallyTotal) <= 0.01) {
                    this.matchedTransactions.push({
                        bankTransactions,
                        tallyTransactions,
                        bankTotal,
                        tallyTotal,
                        date: bankTransactions[0].date,
                        difference: Math.abs(bankTotal - tallyTotal),
                        matchType: 'grouped'
                    });
                    
                    // Remove matched transactions from both groups
                    delete bankByDate[dateKey];
                    delete tallyByDate[dateKey];
                }
            }
        }

        // Update the original arrays
        bankTransactions.length = 0;
        tallyTransactions.length = 0;
        
        Object.values(bankByDate).flat().forEach(t => bankTransactions.push(t));
        Object.values(tallyByDate).flat().forEach(t => tallyTransactions.push(t));
    }

    matchWithRunningBalance(bankTransactions, tallyTransactions) {
        let bankRunningBalance = 0;
        let tallyRunningBalance = 0;
        let bankIndex = 0;
        let tallyIndex = 0;

        while (bankIndex < bankTransactions.length && tallyIndex < tallyTransactions.length) {
            const bankTransaction = bankTransactions[bankIndex];
            const tallyTransaction = tallyTransactions[tallyIndex];

            // Add to running balances
            bankRunningBalance += bankTransaction.amount;
            tallyRunningBalance += tallyTransaction.amount;

            // Check if running balances match
            if (Math.abs(bankRunningBalance - tallyRunningBalance) <= 0.01) {
                // Create a match with all transactions up to this point
                const matchedBankTransactions = bankTransactions.slice(0, bankIndex + 1);
                const matchedTallyTransactions = tallyTransactions.slice(0, tallyIndex + 1);

                this.matchedTransactions.push({
                    bankTransactions: matchedBankTransactions,
                    tallyTransactions: matchedTallyTransactions,
                    bankTotal: bankRunningBalance,
                    tallyTotal: tallyRunningBalance,
                    date: bankTransaction.date,
                    difference: Math.abs(bankRunningBalance - tallyRunningBalance),
                    matchType: 'running_balance'
                });

                // Remove matched transactions
                bankTransactions.splice(0, bankIndex + 1);
                tallyTransactions.splice(0, tallyIndex + 1);
                
                // Reset indices and balances
                bankIndex = 0;
                tallyIndex = 0;
                bankRunningBalance = 0;
                tallyRunningBalance = 0;
            } else if (bankRunningBalance < tallyRunningBalance) {
                // Bank balance is lower, add more bank transactions
                bankIndex++;
            } else {
                // Tally balance is lower, add more tally transactions
                tallyIndex++;
            }
        }
    }

    isIndividualMatch(bankTransaction, tallyTransaction) {
        // Check if dates are within 1 day of each other
        const dateDiff = Math.abs(bankTransaction.date.getTime() - tallyTransaction.date.getTime());
        const oneDay = 24 * 60 * 60 * 1000;
        
        if (dateDiff > oneDay) return false;

        // Check if amounts are within 0.01 tolerance
        const amountDiff = Math.abs(bankTransaction.amount - tallyTransaction.amount);
        if (amountDiff > 0.01) return false;

        return true;
    }

    groupTransactionsByDate(transactions) {
        const grouped = {};
        
        transactions.forEach(transaction => {
            const dateKey = transaction.date.toISOString().split('T')[0]; // YYYY-MM-DD format
            if (!grouped[dateKey]) {
                grouped[dateKey] = [];
            }
            grouped[dateKey].push(transaction);
        });
        
        return grouped;
    }

    isMatch(bankTransaction, tallyTransaction) {
        // Check if dates are within 1 day of each other
        const dateDiff = Math.abs(bankTransaction.date.getTime() - tallyTransaction.date.getTime());
        const oneDay = 24 * 60 * 60 * 1000;
        
        if (dateDiff > oneDay) return false;

        // Check if amounts are within 0.01 tolerance
        const amountDiff = Math.abs(bankTransaction.amount - tallyTransaction.amount);
        if (amountDiff > 0.01) return false;

        // Only match by date and amount - ignore description and type
        return true;
    }

    applyFilters() {
        const monthFilter = document.getElementById('monthFilter').value;
        const yearFilter = document.getElementById('yearFilter').value;
        const minAmount = parseFloat(document.getElementById('minAmount').value) || 0;
        const maxAmount = parseFloat(document.getElementById('maxAmount').value) || Infinity;

        let filteredMatched = this.matchedTransactions.filter(match => {
            return this.matchesFilter(match.bankTransaction, monthFilter, yearFilter, minAmount, maxAmount) ||
                   this.matchesFilter(match.tallyTransaction, monthFilter, yearFilter, minAmount, maxAmount);
        });

        let filteredUnmatchedBank = this.unmatchedBankTransactions.filter(transaction => {
            return this.matchesFilter(transaction, monthFilter, yearFilter, minAmount, maxAmount);
        });

        let filteredUnmatchedTally = this.unmatchedTallyTransactions.filter(transaction => {
            return this.matchesFilter(transaction, monthFilter, yearFilter, minAmount, maxAmount);
        });

        this.displayFilteredResults(filteredMatched, filteredUnmatchedBank, filteredUnmatchedTally);
    }

    matchesFilter(transaction, monthFilter, yearFilter, minAmount, maxAmount) {
        const transactionMonth = transaction.date.getMonth() + 1;
        const transactionYear = transaction.date.getFullYear();

        if (monthFilter && transactionMonth !== parseInt(monthFilter)) return false;
        if (yearFilter && transactionYear !== parseInt(yearFilter)) return false;
        if (transaction.amount < minAmount || transaction.amount > maxAmount) return false;

        return true;
    }

    updateSummary() {
        document.getElementById('totalBankTransactions').textContent = this.bankData.length;
        document.getElementById('totalTallyTransactions').textContent = this.tallyData.length;
        document.getElementById('matchedTransactions').textContent = this.matchedTransactions.length;
        document.getElementById('unmatchedTransactions').textContent = 
            this.unmatchedBankTransactions.length + this.unmatchedTallyTransactions.length;
    }

    displayResults() {
        this.displayMatchedTransactions();
        this.displayUnmatchedTransactions();
        this.displayDifferences();
    }

    displayFilteredResults(matched, unmatchedBank, unmatchedTally) {
        this.displayMatchedTransactions(matched);
        this.displayUnmatchedTransactions(unmatchedBank, unmatchedTally);
        this.displayDifferences(matched.filter(match => match.difference > 0.01));
    }

    displayMatchedTransactions(matchedTransactions = this.matchedTransactions) {
        const tbody = document.querySelector('#matchedTable tbody');
        tbody.innerHTML = '';

        matchedTransactions.forEach(match => {
            const row = document.createElement('tr');
            let matchType = '';
            switch(match.matchType) {
                case 'exact':
                    matchType = 'Exact';
                    break;
                case 'fuzzy':
                    matchType = 'Fuzzy (Date Diff)';
                    break;
                case 'grouped':
                    matchType = 'Grouped';
                    break;
                case 'running_balance':
                    matchType = 'Running Balance';
                    break;
                default:
                    matchType = 'Matched';
            }
            row.innerHTML = `
                <td>${this.formatDate(match.date)}</td>
                <td>${this.formatAmount(match.bankTotal)} (${match.bankTransactions.length} transactions)</td>
                <td>${this.formatAmount(match.tallyTotal)} (${match.tallyTransactions.length} transactions)</td>
                <td class="status-matched">✓ ${matchType}</td>
            `;
            tbody.appendChild(row);
        });
    }

    displayUnmatchedTransactions(unmatchedBank = this.unmatchedBankTransactions, unmatchedTally = this.unmatchedTallyTransactions) {
        const tbody = document.querySelector('#unmatchedTable tbody');
        tbody.innerHTML = '';

        // Display unmatched bank transactions
        unmatchedBank.forEach(transaction => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>Bank</td>
                <td>${this.formatDate(transaction.date)}</td>
                <td>${this.formatAmount(transaction.amount)}</td>
            `;
            tbody.appendChild(row);
        });

        // Display unmatched tally transactions
        unmatchedTally.forEach(transaction => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>Tally</td>
                <td>${this.formatDate(transaction.date)}</td>
                <td>${this.formatAmount(transaction.amount)}</td>
            `;
            tbody.appendChild(row);
        });
    }

    displayDifferences(differences = this.differences) {
        const tbody = document.querySelector('#differencesTable tbody');
        tbody.innerHTML = '';

        differences.forEach(match => {
            const row = document.createElement('tr');
            const difference = match.bankTotal - match.tallyTotal;
            row.innerHTML = `
                <td>${this.formatDate(match.date)}</td>
                <td>${this.formatAmount(match.bankTotal)} (${match.bankTransactions.length} transactions)</td>
                <td>${this.formatAmount(match.tallyTotal)} (${match.tallyTransactions.length} transactions)</td>
                <td class="${difference > 0 ? 'amount-debit' : 'amount-credit'}">${this.formatAmount(Math.abs(difference))}</td>
            `;
            tbody.appendChild(row);
        });
    }

    switchTab(tabName) {
        // Remove active class from all tabs and panes
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));

        // Add active class to selected tab and pane
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(tabName).classList.add('active');
    }

    formatDate(date) {
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    formatAmount(amount) {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(amount);
    }

    downloadTableData(tableId, fileName) {
        const table = document.getElementById(tableId);
        const rows = table.querySelectorAll('tbody tr');
        const data = [];

        // Add header
        data.push(['Date', 'Amount']);

        // Add data rows
        rows.forEach(row => {
            const inputs = row.querySelectorAll('input');
            if (inputs.length >= 2) {
                const dateInput = inputs[0];
                const amountInput = inputs[1];
                
                // Skip empty rows
                if (dateInput.value.trim() && amountInput.value.trim()) {
                    data.push([dateInput.value, parseFloat(amountInput.value) || 0]);
                }
            }
        });

        if (data.length <= 1) {
            alert('No data to download. Please enter some data first.');
            return;
        }

        // Create workbook
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.aoa_to_sheet(data);
        
        // Set column widths
        worksheet['!cols'] = [
            { width: 15 }, // Date column
            { width: 15 }  // Amount column
        ];

        XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
        
        // Download the file
        XLSX.writeFile(workbook, `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`);
    }

    exportResults() {
        const workbook = XLSX.utils.book_new();
        
        // Export matched transactions
        const matchedData = this.matchedTransactions.map(match => ({
            'Date': this.formatDate(match.date),
            'Bank Total': match.bankTotal,
            'Bank Transactions': match.bankTransactions.length,
            'Tally Total': match.tallyTotal,
            'Tally Transactions': match.tallyTransactions.length,
            'Status': 'Matched'
        }));
        
        if (matchedData.length > 0) {
            const matchedSheet = XLSX.utils.json_to_sheet(matchedData);
            XLSX.utils.book_append_sheet(workbook, matchedSheet, 'Matched Transactions');
        }

        // Export unmatched transactions
        const unmatchedData = [
            ...this.unmatchedBankTransactions.map(transaction => ({
                'Source': 'Bank',
                'Date': this.formatDate(transaction.date),
                'Amount': transaction.amount
            })),
            ...this.unmatchedTallyTransactions.map(transaction => ({
                'Source': 'Tally',
                'Date': this.formatDate(transaction.date),
                'Amount': transaction.amount
            }))
        ];
        
        if (unmatchedData.length > 0) {
            const unmatchedSheet = XLSX.utils.json_to_sheet(unmatchedData);
            XLSX.utils.book_append_sheet(workbook, unmatchedSheet, 'Unmatched Transactions');
        }

        // Export differences
        const differencesData = this.differences.map(match => ({
            'Date': this.formatDate(match.date),
            'Bank Total': match.bankTotal,
            'Bank Transactions': match.bankTransactions.length,
            'Tally Total': match.tallyTotal,
            'Tally Transactions': match.tallyTransactions.length,
            'Difference': Math.abs(match.bankTotal - match.tallyTotal)
        }));
        
        if (differencesData.length > 0) {
            const differencesSheet = XLSX.utils.json_to_sheet(differencesData);
            XLSX.utils.book_append_sheet(workbook, differencesSheet, 'Differences');
        }

        // Export summary
        const summaryData = [{
            'Total Bank Transactions': this.bankData.length,
            'Total Tally Transactions': this.tallyData.length,
            'Matched Transactions': this.matchedTransactions.length,
            'Unmatched Transactions': this.unmatchedBankTransactions.length + this.unmatchedTallyTransactions.length,
            'Differences Found': this.differences.length
        }];
        
        const summarySheet = XLSX.utils.json_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

        // Download the file
        XLSX.writeFile(workbook, `Bank_Reconciliation_${new Date().toISOString().split('T')[0]}.xlsx`);
    }
}

// Global function for delete row button
function deleteRow(button) {
    const row = button.closest('tr');
    const tbody = row.parentElement;
    
    // Don't delete if it's the last row
    if (tbody.children.length > 1) {
        row.remove();
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new BankReconciliation();
}); 
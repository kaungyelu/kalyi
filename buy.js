// buy.js - Complete version with correct clear button logic and auto over list click

// Global variables
let currentKey = '';
let ledgerData = {}; // { "12": 1500, "21": 500, "34": 1000 }
let overBets = []; // Array of { number: "12", amount: 500 }
let manualBets = []; // Array of { id: 1, number: "12", amount: 1000, type: 'Regular' }
let inputAmount = 0;
let users = [];
let selectedUser = '';
let selectedUserCom = 0;
let selectedUserZa = 0;
let manualBetIdCounter = 1;

// Initialize Supabase
function initSupabase() {
    try {
        if (!window.supabase) {
            console.error('Supabase library not loaded');
            return false;
        }
        
        // Use the supabase client from su.js
        supabase = window.supabaseClient;
        
        if (!supabase) {
            console.error('Supabase client not initialized');
            return false;
        }
        
        console.log('Supabase initialized successfully');
        return true;
    } catch (error) {
        console.error('Failed to initialize Supabase:', error);
        return false;
    }
}

// Load users from Supabase
async function loadUsersFromSupabase() {
    const userSelect = document.getElementById('userSelect');
    const selectedUserDisplay = document.getElementById('selectedUserDisplay');
    
    try {
        userSelect.innerHTML = '<option value="">Loading users...</option>';
        
        if (!supabase && !initSupabase()) {
            userSelect.innerHTML = '<option value="">Database connection failed</option>';
            return;
        }
        
        const { data, error } = await supabase
            .from('Name')
            .select('name, com, za')
            .order('name', { ascending: true });
        
        if (error) {
            console.error('Supabase error:', error);
            const localUsers = localStorage.getItem('users');
            if (localUsers) {
                users = JSON.parse(localUsers);
                updateUserDropdown();
                return;
            }
            throw error;
        }
        
        users = data || [];
        
        if (users.length > 0) {
            localStorage.setItem('users', JSON.stringify(users));
        }
        
        updateUserDropdown();
        
    } catch (error) {
        console.error('Error loading users:', error);
        userSelect.innerHTML = '<option value="">Error loading users</option>';
    }
}

// Update user dropdown
function updateUserDropdown() {
    const userSelect = document.getElementById('userSelect');
    const selectedUserDisplay = document.getElementById('selectedUserDisplay');
    
    userSelect.innerHTML = '<option value="">Select User</option>';
    
    if (users.length === 0) {
        userSelect.innerHTML = '<option value="">No users found</option>';
        return;
    }
    
    users.forEach(user => {
        const option = document.createElement('option');
        option.value = user.name;
        option.textContent = `${user.name} (${user.com || 0}/${user.za || 0})`;
        option.setAttribute('data-com', user.com || 0);
        option.setAttribute('data-za', user.za || 0);
        userSelect.appendChild(option);
    });
    
    if (users.length > 0) {
        const firstUser = users[0];
        userSelect.value = firstUser.name;
        selectedUser = firstUser.name;
        selectedUserCom = firstUser.com || 0;
        selectedUserZa = firstUser.za || 0;
        selectedUserDisplay.textContent = `${firstUser.name} (${firstUser.com || 0}/${firstUser.za || 0})`;
    }
}

// Get URL parameters
function getUrlParams() {
    const params = {};
    const queryString = window.location.search.substring(1);
    const pairs = queryString.split('&');
    
    for (let i = 0; i < pairs.length; i++) {
        const pair = pairs[i].split('=');
        if (pair[0]) {
            params[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
        }
    }
    return params;
}

// Format number with leading zero
function formatNumber(num) {
    if (num === undefined || num === null || isNaN(num)) return '00';
    const numStr = num.toString();
    return numStr.length === 1 ? '0' + numStr : numStr;
}

// Load ledger data from Supabase
async function loadLedgerData() {
    const params = getUrlParams();
    const activeTimeDisplay = document.getElementById('activeTimeDisplay');
    
    if (params.date && params.time) {
        currentKey = `${params.date} ${params.time}`;
        activeTimeDisplay.textContent = currentKey;
    } else if (params.key) {
        currentKey = params.key;
        activeTimeDisplay.textContent = currentKey;
    } else {
        const storedDate = localStorage.getItem('selectedDate');
        const storedTime = localStorage.getItem('selectedTime');
        if (storedDate && storedTime) {
            currentKey = `${storedDate} ${storedTime}`;
            activeTimeDisplay.textContent = currentKey;
        } else {
            activeTimeDisplay.textContent = 'No Active Time Selected';
            return;
        }
    }
    
    if (!supabase && !initSupabase()) {
        console.log('Failed to initialize Supabase, using local data');
        const localData = localStorage.getItem(`ledger_${currentKey}`);
        if (localData) {
            try {
                ledgerData = JSON.parse(localData);
                updateAllDisplays();
                return;
            } catch (e) {
                console.error('Error parsing local data:', e);
            }
        }
        return;
    }
    
    try {
        const { data, error } = await supabase
            .from('sales')
            .select('bets')
            .eq('key', currentKey);
        
        if (error) {
            console.error('Supabase error:', error);
            const localData = localStorage.getItem(`ledger_${currentKey}`);
            if (localData) {
                try {
                    ledgerData = JSON.parse(localData);
                    updateAllDisplays();
                } catch (e) {
                    console.error('Error parsing local data:', e);
                }
            }
            return;
        }
        
        ledgerData = {};
        
        if (data && data.length > 0) {
            data.forEach(slip => {
                if (slip.bets && slip.bets.length > 0) {
                    slip.bets.forEach(bet => {
                        const num = formatNumber(bet.display || bet.num || bet.number);
                        const amount = bet.amount || 0;
                        
                        if (!ledgerData[num]) {
                            ledgerData[num] = 0;
                        }
                        ledgerData[num] += amount;
                    });
                }
            });
            
            localStorage.setItem(`ledger_${currentKey}`, JSON.stringify(ledgerData));
            
            updateAllDisplays();
            
        } else {
            clearAllData();
        }
        
    } catch (error) {
        console.error('Error loading ledger data:', error);
        const localData = localStorage.getItem(`ledger_${currentKey}`);
        if (localData) {
            try {
                ledgerData = JSON.parse(localData);
                updateAllDisplays();
            } catch (e) {
                console.error('Error parsing local data:', e);
            }
        } else {
            clearAllData();
        }
    }
}

// Update all displays
function updateAllDisplays() {
    updateTextViews();
    updatePercent();
    updateListView1();
    updateListView2();
    updateTotalBox();
    updateOverTotalBox();
}

// Update text views
function updateTextViews() {
    const textView1 = document.getElementById('textView1');
    const textView2 = document.getElementById('textView2');
    const singleTextView = document.getElementById('singleTextView');
    
    if (!textView1 || !textView2 || !singleTextView) return;
    
    let singleTotal = 0;
    Object.values(ledgerData).forEach(amount => {
        singleTotal += amount;
    });
    
    let overTotal = 0;
    overBets.forEach(bet => {
        overTotal += bet.amount;
    });
    
    singleTextView.textContent = `Total Bets: ${singleTotal.toLocaleString()}`;
    textView2.textContent = `Over Total: ${overTotal.toLocaleString()}`;
    const remaining = Math.max(0, singleTotal - overTotal);
    textView1.textContent = `Remaining: ${remaining.toLocaleString()}`;
}

// Update percent view
function updatePercent() {
    const percentElement = document.getElementById('percent');
    if (!percentElement) return;
    
    let singleTotal = 0;
    Object.values(ledgerData).forEach(amount => {
        singleTotal += amount;
    });
    
    let overTotal = 0;
    overBets.forEach(bet => {
        overTotal += bet.amount;
    });
    
    const remaining = Math.max(0, singleTotal - overTotal);
    
    if (inputAmount <= 0) {
        percentElement.textContent = 'Percent%: 0';
        return;
    }
    
    const baseAmount = inputAmount * 80;
    if (baseAmount === 0) {
        percentElement.textContent = 'Percent%: 0';
        return;
    }
    
    const percentValue = (remaining / baseAmount * 100).toFixed(2);
    percentElement.textContent = `Percent%: ${percentValue}`;
}

// Update total box
function updateTotalBox() {
    const totalBox = document.getElementById('totalBox');
    let total = 0;
    
    manualBets.forEach(bet => {
        total += bet.amount;
    });
    
    totalBox.textContent = `Total: ${total.toLocaleString()}`;
}

// Update over total box
function updateOverTotalBox() {
    const overTotalBox = document.getElementById('overTotalBox');
    let overTotal = 0;
    
    overBets.forEach(bet => {
        overTotal += bet.amount;
    });
    
    overTotalBox.textContent = `OverTotal: ${overTotal.toLocaleString()}`;
}

// Calculate over bets
function calculateOverBets() {
    const amountInput = document.getElementById('mainEditText');
    inputAmount = parseInt(amountInput.value) || 0;
    
    if (inputAmount <= 0) {
        alert('Please enter a valid amount');
        amountInput.focus();
        return;
    }
    
    overBets = [];
    
    Object.keys(ledgerData).forEach(num => {
        const ledgerAmount = ledgerData[num];
        
        if (ledgerAmount > inputAmount) {
            const overAmount = ledgerAmount - inputAmount;
            overBets.push({ number: num, amount: overAmount });
        }
    });
    
    overBets.sort((a, b) => parseInt(a.number) - parseInt(b.number));
    
    updateListView2();
    updateOverTotalBox();
    updateTextViews();
    updatePercent();
}

// Recalculate over bets (for keyboard integration)
function recalculateOverBets() {
    if (inputAmount <= 0) return;
    
    overBets = [];
    
    Object.keys(ledgerData).forEach(num => {
        const ledgerAmount = ledgerData[num];
        
        if (ledgerAmount > inputAmount) {
            const overAmount = ledgerAmount - inputAmount;
            overBets.push({ number: num, amount: overAmount });
        }
    });
    
    overBets.sort((a, b) => parseInt(a.number) - parseInt(b.number));
    
    // Update displays
    updateListView2();
    updateOverTotalBox();
    updateTextViews();
    updatePercent();
}

// Update list view 1 (manual bets)
function updateListView1() {
    const listView1 = document.getElementById('listView1');
    if (!listView1) return;
    
    listView1.innerHTML = '';
    
    if (manualBets.length === 0) {
        for (let i = 0; i < 3; i++) {
            const row = document.createElement('div');
            row.className = 'list-row';
            row.innerHTML = `
                <div class="list-cell"></div>
                <div class="list-cell"></div>
                <div class="list-cell"></div>
            `;
            listView1.appendChild(row);
        }
        updateTotalBox();
        return;
    }
    
    manualBets.forEach(bet => {
        const row = document.createElement('div');
        row.className = 'list-row';
        
        row.innerHTML = `
            <div class="list-cell">${bet.number}</div>
            <div class="list-cell">${bet.amount.toLocaleString()}</div>
            <div class="list-cell">
                <button class="delete-btn-small" data-id="${bet.id}">Delete</button>
            </div>
        `;
        
        listView1.appendChild(row);
    });
    
    while (listView1.children.length < 3) {
        const row = document.createElement('div');
        row.className = 'list-row';
        row.innerHTML = `
            <div class="list-cell"></div>
            <div class="list-cell"></div>
            <div class="list-cell"></div>
        `;
        listView1.appendChild(row);
    }
    
    // Add event listeners to delete buttons
    document.querySelectorAll('.delete-btn-small').forEach(btn => {
        btn.addEventListener('click', function() {
            const betId = parseInt(this.getAttribute('data-id'));
            deleteManualBet(betId);
        });
    });
    
    updateTotalBox();
}

// Update list view 2 (over bets) with click functionality
function updateListView2() {
    const listView2 = document.getElementById('listView2');
    if (!listView2) return;
    
    listView2.innerHTML = '';
    
    if (overBets.length === 0) {
        for (let i = 0; i < 3; i++) {
            const row = document.createElement('div');
            row.className = 'overlist-row';
            row.innerHTML = `
                <div class="overlist-cell"></div>
                <div class="overlist-cell"></div>
            `;
            listView2.appendChild(row);
        }
        return;
    }
    
    overBets.forEach(bet => {
        const row = document.createElement('div');
        row.className = 'overlist-row';
        row.dataset.number = bet.number;
        row.dataset.amount = bet.amount;
        
        row.innerHTML = `
            <div class="overlist-cell overlist-clickable">${bet.number}</div>
            <div class="overlist-cell overlist-clickable">${bet.amount.toLocaleString()}</div>
        `;
        
        // Add click event to the row (NO CONFIRM - Auto add)
        row.addEventListener('click', function() {
            handleOverListItemClick(bet.number, bet.amount);
        });
        
        listView2.appendChild(row);
    });
    
    while (listView2.children.length < 3) {
        const row = document.createElement('div');
        row.className = 'overlist-row';
        row.innerHTML = `
            <div class="overlist-cell"></div>
            <div class="overlist-cell"></div>
        `;
        listView2.appendChild(row);
    }
}

// Handle over list item click (NO CONFIRM - Auto add)
function handleOverListItemClick(number, amount) {
    // NO CONFIRM DIALOG - Auto add
    
    // Add to manual bets
    const existingIndex = manualBets.findIndex(bet => bet.number === number);
    
    if (existingIndex === -1) {
        manualBets.push({ 
            id: manualBetIdCounter++, 
            number: number, 
            amount: amount,
            type: 'From Over List'
        });
    } else {
        manualBets[existingIndex].amount += amount;
    }
    
    // Update ledgerData (subtract from ledgerData)
    if (ledgerData[number] !== undefined) {
        ledgerData[number] -= amount;
    }
    
    // Save to localStorage
    localStorage.setItem(`ledger_${currentKey}`, JSON.stringify(ledgerData));
    
    // Remove from overBets
    const overIndex = overBets.findIndex(bet => bet.number === number);
    if (overIndex !== -1) {
        overBets.splice(overIndex, 1);
    }
    
    // Recalculate if there are still over amounts
    if (inputAmount > 0) {
        const newLedgerAmount = ledgerData[number] || 0;
        if (newLedgerAmount > inputAmount) {
            const newOverAmount = newLedgerAmount - inputAmount;
            overBets.push({ number: number, amount: newOverAmount });
            overBets.sort((a, b) => parseInt(a.number) - parseInt(b.number));
        }
    }
    
    // Update all displays
    updateAllDisplays();
}

// Delete manual bet
function deleteManualBet(betId) {
    const betIndex = manualBets.findIndex(bet => bet.id === betId);
    
    if (betIndex === -1) return;
    
    const deletedBet = manualBets[betIndex];
    
    // Return amount to ledgerData
    if (ledgerData[deletedBet.number] !== undefined) {
        ledgerData[deletedBet.number] += deletedBet.amount;
    } else {
        ledgerData[deletedBet.number] = deletedBet.amount;
    }
    
    // Save to localStorage
    localStorage.setItem(`ledger_${currentKey}`, JSON.stringify(ledgerData));
    
    // Remove from manual bets
    manualBets.splice(betIndex, 1);
    
    // Recalculate over bets
    if (inputAmount > 0) {
        recalculateOverBets();
    }
    
    updateAllDisplays();
}

// Clear all manual bets (CORRECTED - Return amounts to ledgerData)
function clearAllManualBets() {
    if (manualBets.length === 0) {
        alert('No manual bets to clear');
        return;
    }
    
    // Return all manual bets amounts to ledgerData
    manualBets.forEach(bet => {
        if (ledgerData[bet.number] !== undefined) {
            ledgerData[bet.number] += bet.amount;
        } else {
            ledgerData[bet.number] = bet.amount;
        }
    });
    
    // Save to localStorage
    localStorage.setItem(`ledger_${currentKey}`, JSON.stringify(ledgerData));
    
    // Clear manual bets
    manualBets = [];
    manualBetIdCounter = 1;
    
    // Recalculate over bets
    if (inputAmount > 0) {
        recalculateOverBets();
    }
    
    // Update all displays
    updateAllDisplays();
    
    alert('Cleared all manual bets and returned amounts to ledger');
}

// Clear all data (full reset)
function clearAllData() {
    ledgerData = {};
    overBets = [];
    manualBets = [];
    manualBetIdCounter = 1;
    inputAmount = 0;
    
    const singleTextView = document.getElementById('singleTextView');
    const mainEditText = document.getElementById('mainEditText');
    const textView1 = document.getElementById('textView1');
    const textView2 = document.getElementById('textView2');
    const overTotalBox = document.getElementById('overTotalBox');
    const totalBox = document.getElementById('totalBox');
    const percentElement = document.getElementById('percent');
    
    if (singleTextView) singleTextView.textContent = 'Total Bets: 0';
    if (mainEditText) mainEditText.value = '';
    if (textView1) textView1.textContent = 'Remaining: 0';
    if (textView2) textView2.textContent = 'Over Total: 0';
    if (overTotalBox) overTotalBox.textContent = 'OverTotal: 0';
    if (totalBox) totalBox.textContent = 'Total: 0';
    if (percentElement) percentElement.textContent = 'Percent%: 0';
    
    // Clear localStorage for this key
    if (currentKey) {
        localStorage.removeItem(`ledger_${currentKey}`);
    }
    
    updateListView1();
    updateListView2();
}

// Move all over bets to manual
function moveAllOverToManual() {
    if (overBets.length === 0) {
        alert('No over bets to move');
        return;
    }
    
    overBets.forEach(overBet => {
        const existingIndex = manualBets.findIndex(bet => bet.number === overBet.number);
        
        if (existingIndex === -1) {
            manualBets.push({ 
                id: manualBetIdCounter++, 
                number: overBet.number, 
                amount: overBet.amount,
                type: 'From Over'
            });
        } else {
            manualBets[existingIndex].amount += overBet.amount;
        }
        
        // Update ledgerData
        if (ledgerData[overBet.number] !== undefined) {
            ledgerData[overBet.number] -= overBet.amount;
        }
    });
    
    // Save to localStorage
    localStorage.setItem(`ledger_${currentKey}`, JSON.stringify(ledgerData));
    
    overBets = [];
    
    updateAllDisplays();
    
    alert(`Moved ${overBets.length} over bets to manual bets`);
}

// Save manual bets to Supabase
async function saveManualBetsToSupabase() {
    if (manualBets.length === 0) {
        alert('No manual bets to save');
        return;
    }
    
    if (!selectedUser) {
        alert('Please select a user');
        document.getElementById('userSelect').focus();
        return;
    }
    
    if (!currentKey) {
        alert('No active time selected');
        return;
    }
    
    try {
        const negativeBets = manualBets.map(bet => ({
            display: bet.number,
            num: parseInt(bet.number),
            number: parseInt(bet.number),
            amount: -bet.amount
        }));
        
        const totalAmount = manualBets.reduce((sum, bet) => sum + bet.amount, 0);
        const negativeTotalAmount = -totalAmount;
        
        const selectedOption = document.getElementById('userSelect').options[document.getElementById('userSelect').selectedIndex];
        const userCom = selectedOption ? selectedOption.getAttribute('data-com') : 0;
        const userZa = selectedOption ? selectedOption.getAttribute('data-za') : 0;
        
        const saleData = {
            key: currentKey,
            name: selectedUser,
            com: parseInt(userCom) || 0,
            za: parseInt(userZa) || 0,
            bets: negativeBets,
            total_amount: negativeTotalAmount,
            numbers: manualBets.map(bet => bet.number),
            created_at: new Date().toISOString()
        };
        
        console.log('Saving to Supabase:', saleData);
        
        const { data, error } = await supabase
            .from('sales')
            .insert([saleData]);
        
        if (error) {
            console.error('Supabase error:', error);
            const localSales = JSON.parse(localStorage.getItem('pending_sales') || '[]');
            localSales.push(saleData);
            localStorage.setItem('pending_sales', JSON.stringify(localSales));
            
            alert('Saved to local storage. Will sync when connection is restored.');
        } else {
            alert(`Successfully saved ${manualBets.length} bets to Supabase`);
        }
        
        manualBets = [];
        manualBetIdCounter = 1;
        updateListView1();
        
        loadLedgerData();
        
    } catch (error) {
        console.error('Error saving to Supabase:', error);
        alert('Error: ' + error.message);
    }
}

// Functions for keyboard integration
window.updateLedgerDataForBuyPage = function(numbers, amount) {
    numbers.forEach(num => {
        if (ledgerData[num] !== undefined) {
            ledgerData[num] -= amount;
        } else {
            ledgerData[num] = -amount;
        }
    });
    
    localStorage.setItem(`ledger_${currentKey}`, JSON.stringify(ledgerData));
};

window.addToManualBetsForBuyPage = function(number, amount, type) {
    const existingIndex = manualBets.findIndex(bet => bet.number === number);
    
    if (existingIndex === -1) {
        manualBets.push({ 
            id: manualBetIdCounter++, 
            number: number, 
            amount: amount,
            type: type || 'Keyboard'
        });
    } else {
        manualBets[existingIndex].amount += amount;
    }
};

window.recalculateOverBetsForBuyPage = function() {
    recalculateOverBets();
};

window.updateAllDisplaysForBuyPage = function() {
    updateAllDisplays();
};

window.formatNumberForBuyPage = formatNumber;

// Setup event listeners
function setupEventListeners() {
    // User selection
    const userSelect = document.getElementById('userSelect');
    const selectedUserDisplay = document.getElementById('selectedUserDisplay');
    
    userSelect.addEventListener('change', function() {
        const selectedOption = this.options[this.selectedIndex];
        
        if (selectedOption && selectedOption.value) {
            selectedUser = selectedOption.value;
            selectedUserCom = selectedOption.getAttribute('data-com') || 0;
            selectedUserZa = selectedOption.getAttribute('data-za') || 0;
            selectedUserDisplay.textContent = `${selectedUser} (${selectedUserCom}/${selectedUserZa})`;
        } else {
            selectedUser = '';
            selectedUserCom = 0;
            selectedUserZa = 0;
            selectedUserDisplay.textContent = '';
        }
    });
    
    // Main save button
    document.getElementById('mainSaveBtn').addEventListener('click', function() {
        calculateOverBets();
    });
    
    // Enter key on main edit text
    document.getElementById('mainEditText').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            document.getElementById('mainSaveBtn').click();
        }
    });
    
    // Clear button - CORRECTED: Return amounts to ledgerData
    document.getElementById('clearBtn').addEventListener('click', function() {
        clearAllManualBets();
    });
    
    // Save button
    document.getElementById('saveBtn').addEventListener('click', function() {
        saveManualBetsToSupabase();
    });
    
    // F1 button - move all over to manual
    document.getElementById('f1Btn').addEventListener('click', function() {
        moveAllOverToManual();
    });
    
    // F2 button - refresh data
    document.getElementById('f2Btn').addEventListener('click', function() {
        loadLedgerData();
        alert('Data refreshed');
    });
    
    // F3 button - clear all (full reset)
    document.getElementById('f3Btn').addEventListener('click', function() {
        if (confirm('Are you sure you want to clear ALL data?')) {
            clearAllData();
        }
    });
}

// Add delete button styles
function addDeleteButtonStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .delete-btn-small {
            padding: 2px 4px;
            background: #e74c3c;
            color: white;
            border: none;
            border-radius: 2px;
            font-size: 9px;
            font-weight: bold;
            cursor: pointer;
            width: 40px;
            height: 18px;
        }
        
        .delete-btn-small:hover {
            background: #c0392b;
        }
        
        .overlist-clickable {
            cursor: pointer;
            user-select: none;
        }
        
        .overlist-clickable:hover {
            background-color: #e3f2fd;
            transition: background-color 0.2s;
        }
        
        .overlist-row:hover {
            background-color: #f5f5f5;
        }
    `;
    document.head.appendChild(style);
}

// Setup real-time updates
function setupRealTimeUpdates() {
    if (!supabase || !currentKey) return;
    
    supabase
        .channel('buy-updates')
        .on('postgres_changes', 
            { 
                event: '*', 
                schema: 'public', 
                table: 'sales',
                filter: `key=eq.${currentKey}`
            },
            (payload) => {
                console.log('Real-time update received');
                loadLedgerData();
            }
        )
        .subscribe();
}

// Sync pending sales
async function syncPendingSales() {
    try {
        const pendingSales = JSON.parse(localStorage.getItem('pending_sales') || '[]');
        if (pendingSales.length === 0 || !supabase) return;
        
        for (const saleData of pendingSales) {
            const { error } = await supabase
                .from('sales')
                .insert([saleData]);
            
            if (!error) {
                console.log('Synced pending sale:', saleData);
            }
        }
        
        localStorage.removeItem('pending_sales');
        
    } catch (error) {
        console.error('Error syncing pending sales:', error);
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('buy.js - Buy page initialized with correct clear button logic');
    
    initSupabase();
    loadUsersFromSupabase();
    loadLedgerData();
    setupEventListeners();
    addDeleteButtonStyles();
    syncPendingSales();
    
    // Make global variables available for keyboard.js
    window.ledgerData = ledgerData;
    window.overBets = overBets;
    window.manualBets = manualBets;
    window.manualBetIdCounter = manualBetIdCounter;
    window.inputAmount = inputAmount;
});

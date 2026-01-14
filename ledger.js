// ledger.js - Supabase version for ledger.html

// Global variables
let currentKey = '';
let ledgerData = {};
let users = [];
let selectedUser = '';
let selectedUserCom = 0;
let selectedUserZa = 0;
let capitalAmount = 0;
let originalLedgerData = {};

// Function to show error message
function showError(message) {
    alert(message);
}

// Function to show success message
function showSuccess(message) {
    alert(message);
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

// Load users from Supabase Name table (buy.js နည်းအတိုင်း)
async function loadUsersFromSupabase() {
    const userSelect = document.getElementById('userSelect');
    
    try {
        userSelect.innerHTML = '<option value="">လူစာရင်းလာချိန်...</option>';
        
        const supabase = window.supabaseClient;
        if (!supabase) {
            userSelect.innerHTML = '<option value="">Database connection မရ</option>';
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
                try {
                    users = JSON.parse(localUsers);
                    updateUserDropdown();
                    return;
                } catch (e) {
                    console.error('Error parsing local users:', e);
                }
            }
            userSelect.innerHTML = '<option value="">လူစာရင်းမရ</option>';
            return;
        }
        
        users = data || [];
        
        if (users.length > 0) {
            localStorage.setItem('users', JSON.stringify(users));
        }
        
        updateUserDropdown();
        
    } catch (error) {
        console.error('Error loading users:', error);
        userSelect.innerHTML = '<option value="">လူစာရင်းမရှိပါ</option>';
        
        const localUsers = localStorage.getItem('users');
        if (localUsers) {
            try {
                users = JSON.parse(localUsers);
                updateUserDropdown();
            } catch (e) {
                console.error('Error parsing local users:', e);
            }
        }
    }
}

// Update user dropdown
function updateUserDropdown() {
    const userSelect = document.getElementById('userSelect');
    
    userSelect.innerHTML = '<option value="">အမည်ရွှေးပါ</option>';
    
    if (users.length === 0) {
        userSelect.innerHTML = '<option value="">သုံးစွဲသူမရှိ</option>';
        return;
    }
    
    users.forEach(user => {
        const option = document.createElement('option');
        const userName = user.name || '';
        option.value = userName;
        option.textContent = userName + ' (' + (user.com || 0) + '/' + (user.za || 0) + ')';
        option.setAttribute('data-com', user.com || 0);
        option.setAttribute('data-za', user.za || 0);
        userSelect.appendChild(option);
    });
}

// Load ledger data from Supabase
async function loadLedgerData() {
    const activeTimeDisplay = document.getElementById('activeTimeDisplay');
    const params = getUrlParams();
    
    if (params.date && params.time) {
        currentKey = params.date + ' ' + params.time;
        activeTimeDisplay.textContent = currentKey;
    } else if (params.key) {
        currentKey = params.key;
        activeTimeDisplay.textContent = currentKey;
    } else {
        const storedDate = localStorage.getItem('selectedDate');
        const storedTime = localStorage.getItem('selectedTime');
        if (storedDate && storedTime) {
            currentKey = storedDate + ' ' + storedTime;
            activeTimeDisplay.textContent = currentKey;
        } else {
            activeTimeDisplay.textContent = 'အချိန်မရွေးရသေး';
            showError('အချိန်မရွေးရသေး');
            return;
        }
    }
    
    // Load capital from localStorage
    const savedCapital = localStorage.getItem('capital_' + currentKey);
    if (savedCapital) {
        capitalAmount = parseInt(savedCapital) || 0;
        document.getElementById('capitalInput').value = capitalAmount;
    }
    
    const supabase = window.supabaseClient;
    if (!supabase) {
        console.log('Supabase client not available, using local data');
        const localData = localStorage.getItem('ledger_' + currentKey);
        if (localData) {
            try {
                ledgerData = JSON.parse(localData);
                originalLedgerData = {...ledgerData};
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
            const localData = localStorage.getItem('ledger_' + currentKey);
            if (localData) {
                try {
                    ledgerData = JSON.parse(localData);
                    originalLedgerData = {...ledgerData};
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
            
            localStorage.setItem('ledger_' + currentKey, JSON.stringify(ledgerData));
            originalLedgerData = {...ledgerData};
            
            updateAllDisplays();
            
        } else {
            ledgerData = {};
            originalLedgerData = {};
            localStorage.removeItem('ledger_' + currentKey);
            updateAllDisplays();
        }
        
    } catch (error) {
        console.error('Error loading ledger data:', error);
        const localData = localStorage.getItem('ledger_' + currentKey);
        if (localData) {
            try {
                ledgerData = JSON.parse(localData);
                originalLedgerData = {...ledgerData};
                updateAllDisplays();
            } catch (e) {
                console.error('Error parsing local data:', e);
            }
        }
    }
}

// Update all displays
function updateAllDisplays() {
    updateTextViews();
    updatePercentage();
    updateLedgerListLeft();
    updateLedgerListRight();
}

// Update text views (remaining, overspent, total) - toLocaleString မသုံး
function updateTextViews() {
    const remainingAmount = document.getElementById('remainingAmount');
    const overspentAmount = document.getElementById('overspentAmount');
    const totalMoneyAmount = document.getElementById('totalMoneyAmount');
    
    let totalMoney = 0;
    Object.values(ledgerData).forEach(amount => {
        totalMoney += amount;
    });
    
    let overTotal = 0;
    Object.keys(ledgerData).forEach(num => {
        const amount = ledgerData[num];
        if (capitalAmount > 0 && amount > capitalAmount) {
            overTotal += (amount - capitalAmount);
        }
    });
    
    const remaining = Math.max(0, totalMoney - overTotal);
    
    remainingAmount.textContent = 'ကျန်ငွေ: ' + remaining;
    overspentAmount.textContent = 'ကျော်ငွေ: ' + overTotal;
    totalMoneyAmount.textContent = 'စုစုပေါင်းငွေ: ' + totalMoney;
}

// Update percentage display
function updatePercentage() {
    const percentageAmount = document.getElementById('percentageAmount');
    
    let totalMoney = 0;
    Object.values(ledgerData).forEach(amount => {
        totalMoney += amount;
    });
    
    let overTotal = 0;
    Object.keys(ledgerData).forEach(num => {
        const amount = ledgerData[num];
        if (capitalAmount > 0 && amount > capitalAmount) {
            overTotal += (amount - capitalAmount);
        }
    });
    
    const remaining = Math.max(0, totalMoney - overTotal);
    
    if (capitalAmount > 0) {
        const baseAmount = capitalAmount;
        if (baseAmount === 0) {
            percentageAmount.textContent = 'ရာခိုင်နှုန်း: 0%';
            return;
        }
        const percentValue = ((remaining / baseAmount) ).toFixed(2);
        percentageAmount.textContent = 'ရာခိုင်နှုန်း: ' + percentValue + '%';
    } else {
        let maxAmount = 0;
        Object.values(ledgerData).forEach(amount => {
            if (amount > maxAmount) {
                maxAmount = amount;
            }
        });
        
        const A = maxAmount;
        if (A === 0) {
            percentageAmount.textContent = 'ရာခိုင်နှုန်း: 0%';
            return;
        }
        
        const percentValue = ((totalMoney / A) ).toFixed(2);
        percentageAmount.textContent = 'ရာခိုင်နှုန်း: ' + percentValue + '%';
    }
}

// Update left list (ledger list) - toLocaleString မသုံး
function updateLedgerListLeft() {
    const ledgerListLeft = document.getElementById('ledgerListLeft');
    
    if (!ledgerListLeft) return;
    
    ledgerListLeft.innerHTML = '';
    
    const numbers = Object.keys(ledgerData).sort((a, b) => parseInt(a) - parseInt(b));
    
    if (numbers.length === 0) {
        const row = document.createElement('div');
        row.className = 'loading';
        row.textContent = 'လောင်းကြေးများ မရှိပါ';
        ledgerListLeft.appendChild(row);
        return;
    }
    
    numbers.forEach(num => {
        const row = document.createElement('div');
        row.className = 'list-row';
        row.dataset.number = num;
        row.dataset.amount = ledgerData[num];
        
        row.innerHTML = '<div class="list-cell number">' + num + '</div>' +
                       '<div class="list-cell bets">' + ledgerData[num] + '</div>';
        
        ledgerListLeft.appendChild(row);
    });
}

// Update right list (over list) - toLocaleString မသုံး
function updateLedgerListRight() {
    const ledgerListRight = document.getElementById('ledgerListRight');
    
    if (!ledgerListRight) return;
    
    ledgerListRight.innerHTML = '';
    
    if (capitalAmount <= 0) {
        const row = document.createElement('div');
        row.className = 'loading';
        row.textContent = 'Over မရှိသေးပါ';
        ledgerListRight.appendChild(row);
        return;
    }
    
    const overNumbers = [];
    Object.keys(ledgerData).forEach(num => {
        const amount = ledgerData[num];
        if (amount > capitalAmount) {
            overNumbers.push({
                number: num,
                overAmount: amount - capitalAmount
            });
        }
    });
    
    if (overNumbers.length === 0) {
        const row = document.createElement('div');
        row.className = 'loading';
        row.textContent = 'Over မရှိသေးပါ';
        ledgerListRight.appendChild(row);
        return;
    }
    
    overNumbers.sort((a, b) => parseInt(a.number) - parseInt(b.number));
    
    overNumbers.forEach(item => {
        const row = document.createElement('div');
        row.className = 'overlist-row';
        row.dataset.number = item.number;
        row.dataset.amount = item.overAmount;
        
        row.innerHTML = '<div class="overlist-cell number">' + item.number + '</div>' +
                       '<div class="overlist-cell over">' + item.overAmount + '</div>';
        
        ledgerListRight.appendChild(row);
    });
}

// Save capital amount
function saveCapital() {
    const capitalInput = document.getElementById('capitalInput');
    const amount = parseInt(capitalInput.value) || 0;
    
    if (amount <= 0) {
        showError('စားငွေအမောက် ထည့်ပါ');
        capitalInput.focus();
        return;
    }
    
    capitalAmount = amount;
    
    localStorage.setItem('capital_' + currentKey, amount.toString());
    
    updateAllDisplays();
    showSuccess('စားငွေသိမ်းပြီးပါပြီ');
}

// Save selected user
function saveUser() {
    const userSelect = document.getElementById('userSelect');
    const selectedOption = userSelect.options[userSelect.selectedIndex];
    
    if (!selectedOption || !selectedOption.value) {
        showError('အမည်ရွေးပါ');
        return;
    }
    
    selectedUser = selectedOption.value;
    selectedUserCom = selectedOption.getAttribute('data-com') || 0;
    selectedUserZa = selectedOption.getAttribute('data-za') || 0;
    
    showSuccess(selectedUser + ' ရွေးပြီးပါပြီ');
}

// Search numbers in ledger
function searchNumber() {
    const searchInput = document.getElementById('searchNumberInput');
    const searchTerm = searchInput.value.trim();
    
    if (!searchTerm) {
        ledgerData = {...originalLedgerData};
        updateLedgerListLeft();
        return;
    }
    
    const filteredData = {};
    Object.keys(originalLedgerData).forEach(num => {
        if (num.includes(searchTerm)) {
            filteredData[num] = originalLedgerData[num];
        }
    });
    
    ledgerData = filteredData;
    updateLedgerListLeft();
}

// Save over bets to Supabase database
async function saveOverBets() {
    if (!selectedUser) {
        showError('အမည်ရွေးပါ');
        document.getElementById('userSelect').focus();
        return;
    }
    
    if (capitalAmount <= 0) {
        showError('စားငွေအမောက် ထည့်ပါ');
        document.getElementById('capitalInput').focus();
        return;
    }
    
    const overBets = [];
    Object.keys(ledgerData).forEach(num => {
        const amount = ledgerData[num];
        if (amount > capitalAmount) {
            const overAmount = amount - capitalAmount;
            overBets.push({
                number: num,
                overAmount: overAmount
            });
        }
    });
    
    if (overBets.length === 0) {
        showError('ကျော်ငွေမရှိပါ');
        return;
    }
    
    try {
        const supabase = window.supabaseClient;
        if (!supabase) {
            showError('Database connection မရှိပါ');
            return;
        }
        
        const numbersArray = overBets.map(bet => bet.number);
        const negativeBets = overBets.map(bet => ({
            display: bet.number,
            num: parseInt(bet.number),
            number: parseInt(bet.number),
            amount: -bet.overAmount
        }));
        
        const totalAmount = overBets.reduce((sum, bet) => sum + bet.overAmount, 0);
        const negativeTotalAmount = -totalAmount;
        
        const saleData = {
            key: currentKey,
            name: selectedUser,
            com: parseInt(selectedUserCom) || 0,
            za: parseInt(selectedUserZa) || 0,
            numbers: numbersArray,
            bets: negativeBets,
            total_amount: negativeTotalAmount,
            created_at: new Date().toISOString()
        };
        
        console.log('Saving over bets to Supabase:', saleData);
        
        const { data, error } = await supabase
            .from('sales')
            .insert([saleData]);
        
        if (error) {
            console.error('Supabase error:', error);
            showError('သိမ်းမအောင်မြင်ပါ');
            return;
        }
        
        overBets.forEach(bet => {
            if (ledgerData[bet.number] !== undefined) {
                ledgerData[bet.number] -= bet.overAmount;
            }
        });
        
        originalLedgerData = {...ledgerData};
        localStorage.setItem('ledger_' + currentKey, JSON.stringify(ledgerData));
        
        updateAllDisplays();
        showSuccess(selectedUser + ' အတွက် ' + overBets.length + ' ကျော်ငွေသိမ်းပြီး');
        
    } catch (error) {
        console.error('Error saving over bets:', error);
        showError('အမှား: ' + error.message);
    }
}

// Copy all ledger data to clipboard (webapp interface style)
function copyAllLedgerData() {
    try {
        let copyString = '';
        const numbers = Object.keys(ledgerData).sort((a, b) => parseInt(a) - parseInt(b));
        
        numbers.forEach(num => {
            copyString += num + '=' + ledgerData[num] + '\n';
        });
        
        if (copyString === '') {
            copyString = 'No data to copy';
        }
        
        const textArea = document.createElement('textarea');
        textArea.value = copyString;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (successful) {
            showSuccess('လောင်းကြေးများ အားလုံး copy ကူးပြီးပါပြီ');
        } else {
            showError('Copy ကူးရာမှာ အမှားတစ်ခုခုဖြစ်နေပါတယ်');
        }
    } catch (error) {
        console.error('Error copying data:', error);
        showError('Copy ကူးရာမှာ အမှားတစ်ခုခုဖြစ်နေပါတယ်');
    }
}

// Setup real-time updates
function setupRealTimeUpdates() {
    const supabase = window.supabaseClient;
    if (!supabase || !currentKey) return;
    
    supabase
        .channel('ledger-updates')
        .on('postgres_changes', 
            { 
                event: '*', 
                schema: 'public', 
                table: 'sales',
                filter: 'key=eq.' + currentKey
            },
            (payload) => {
                console.log('Real-time update received');
                loadLedgerData();
            }
        )
        .subscribe();
}

// Setup event listeners
function setupEventListeners() {
    document.getElementById('saveCapitalBtn').addEventListener('click', function() {
        saveCapital();
    });
    
    document.getElementById('capitalInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            saveCapital();
        }
    });
    
    document.getElementById('buyBtn').addEventListener('click', function() {
        saveOverBets();
    });
    
    document.getElementById('userSelect').addEventListener('change', function() {
        const selectedOption = this.options[this.selectedIndex];
        if (selectedOption && selectedOption.value) {
            selectedUser = selectedOption.value;
            selectedUserCom = selectedOption.getAttribute('data-com') || 0;
            selectedUserZa = selectedOption.getAttribute('data-za') || 0;
        }
    });
    
    document.getElementById('searchNumberInput').addEventListener('input', function() {
        searchNumber();
    });
    
    document.getElementById('searchNumberInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchNumber();
        }
    });
    
    const ledgerListLeft = document.getElementById('ledgerListLeft');
    let pressTimer;
    
    ledgerListLeft.addEventListener('mousedown', function(e) {
        if (e.target.closest('.list-row')) {
            pressTimer = setTimeout(() => {
                copyAllLedgerData();
            }, 500);
        }
    });
    
    ledgerListLeft.addEventListener('mouseup', function() {
        clearTimeout(pressTimer);
    });
    
    ledgerListLeft.addEventListener('mouseleave', function() {
        clearTimeout(pressTimer);
    });
    
    ledgerListLeft.addEventListener('touchstart', function(e) {
        if (e.target.closest('.list-row')) {
            pressTimer = setTimeout(() => {
                copyAllLedgerData();
            }, 500);
        }
    });
    
    ledgerListLeft.addEventListener('touchend', function() {
        clearTimeout(pressTimer);
    });
    
    ledgerListLeft.addEventListener('touchmove', function() {
        clearTimeout(pressTimer);
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('ledger.js - Supabase ledger management initialized');
    
    loadUsersFromSupabase();
    loadLedgerData();
    setupEventListeners();
    setupRealTimeUpdates();
    
    setInterval(loadLedgerData, 30000);
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'F5') {
            e.preventDefault();
            loadLedgerData();
        } else if (e.key === 'r' && e.ctrlKey) {
            e.preventDefault();
            loadLedgerData();
        } else if (e.key === 'Escape') {
            const params = getUrlParams();
            if (params.date && params.time) {
                window.location.href = 'sale.html?date=' + encodeURIComponent(params.date) + '&time=' + encodeURIComponent(params.time);
            } else if (params.key) {
                window.location.href = 'sale.html?key=' + encodeURIComponent(params.key);
            } else {
                window.location.href = 'sale.html';
            }
        }
    });
});

// slip.js

// Get DOM elements
const activeTimeDisplay = document.getElementById('activeTimeDisplay');
const slipList = document.getElementById('slipList');
const listCount = document.getElementById('listCount');
const grandTotal = document.getElementById('grandTotal');
const loadingMessage = document.getElementById('loadingMessage');
const copyNotification = document.getElementById('copyNotification');

// Global variables
let currentKey = '';
let currentData = [];

let currentEditingSlipId = null;
let currentEditingBetIndex = null;
let editingBets = [];
let pressTimer = null;
const LONG_PRESS_DURATION = 800; // milliseconds

// Initialize Supabase
function initSupabase() {
    try {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('Supabase initialized successfully');
        return true;
    } catch (error) {
        console.error('Failed to initialize Supabase:', error);
        showMessage('Database connection failed', 'error');
        return false;
    }
}

// Function to get URL parameters
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

// Function to show message
function showMessage(message, type = 'info') {
    const messageDiv = document.createElement('div');
    messageDiv.className = type === 'error' ? 'error-message' : 
                          type === 'success' ? 'success-message' : 'loading-text';
    messageDiv.textContent = message;
    messageDiv.style.position = 'fixed';
    messageDiv.style.top = '20px';
    messageDiv.style.left = '50%';
    messageDiv.style.transform = 'translateX(-50%)';
    messageDiv.style.zIndex = '1001';
    messageDiv.style.padding = '10px 20px';
    messageDiv.style.borderRadius = '5px';
    messageDiv.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        if (messageDiv.parentNode) {
            document.body.removeChild(messageDiv);
        }
    }, 3000);
}

// Function to show copy notification
function showCopyNotification() {
    copyNotification.style.display = 'block';
    setTimeout(() => {
        copyNotification.style.display = 'none';
    }, 2000);
}

// Function to copy slip data to clipboard
function copySlipDataToClipboard(slip) {
    const userName = slip.name || 'No Name';
    let slipData = `User: ${userName}\n`;
    
    // Add bet numbers and amounts
    if (slip.bets && slip.bets.length > 0) {
        slip.bets.forEach(item => {
            const displayNum = formatNumber(item.display || item.num || item.number);
            const amount = item.amount || 0;
            slipData += ` ${displayNum} ${amount.toString()}\n`;
        });
    } else if (slip.numbers && slip.numbers.length > 0) {
        const estimatedAmount = slip.total_amount / slip.numbers.length;
        slip.numbers.forEach(num => {
            slipData += ` ${formatNumber(num)} ${Math.round(estimatedAmount).toString()}\n`;
        });
    }
    
    // Add slip total
    const total = slip.total_amount || slip.total || 0;
    slipData += `Total: ${total.toString()}`;
    
    // Copy to clipboard
    navigator.clipboard.writeText(slipData).then(() => {
        showCopyNotification();
    }).catch(err => {
        console.error('Failed to copy: ', err);
        showMessage('Copy failed', 'error');
    });
}

// Function to format number with leading zero
function formatNumber(num) {
    if (num === undefined || num === null || isNaN(num)) return '';
    const numStr = num.toString();
    return numStr.length === 1 ? '0' + numStr : numStr;
}

// Function to format date in English
function formatEnglishDate(dateString) {
    try {
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');
        
        return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
    } catch (e) {
        return new Date().toString();
    }
}

// Function to get color class for total amount
function getTotalColorClass(total) {
    if (total < 0) {
        return 'negative'; // အနီရောင်
    } else {
        return 'positive'; // အစိမ်းရောင်
    }
}

// Function to toggle slip details
function toggleSlipDetails(slipNumber) {
    const slipHeader = document.querySelector(`[data-slip-number="${slipNumber}"]`);
    const slipDetails = document.getElementById(`slip-details-${slipNumber}`);
    
    if (!slipHeader || !slipDetails) return;
    
    const isExpanded = slipHeader.classList.contains('expanded');
    
    // Close all other open slips
    document.querySelectorAll('.slip-header-row.expanded').forEach(row => {
        if (row.dataset.slipNumber !== slipNumber.toString()) {
            row.classList.remove('expanded');
            const details = document.getElementById(`slip-details-${row.dataset.slipNumber}`);
            if (details) details.classList.remove('expanded');
        }
    });
    
    // Toggle current slip
    slipHeader.classList.toggle('expanded');
    slipDetails.classList.toggle('expanded');
}

// Function to create slip header row
function createSlipHeaderRow(slip, slipNumber) {
    const slipHeaderRow = document.createElement('div');
    slipHeaderRow.className = 'slip-header-row';
    slipHeaderRow.dataset.slipNumber = slipNumber;
    slipHeaderRow.dataset.id = slip.id;
    
    const userName = slip.name || 'No Name';
    const totalAmount = slip.total_amount || slip.total || 0;
    const colorClass = getTotalColorClass(totalAmount);
    
    slipHeaderRow.innerHTML = `
        <div class="slip-header-info">
            <span class="slip-number">${slipNumber}</span>
            <span class="slip-summary">
                <span class="user-name">${userName}</span>
                <span class="slip-total-summary ${colorClass}">${totalAmount.toString()}</span>
            </span>
            <div class="slip-date">${formatEnglishDate(slip.created_at || slip.timestamp || new Date().toISOString())}</div>
        </div>
        <div class="expand-icon">▼</div>
    `;
    
    // Add click event for expand/collapse
    slipHeaderRow.addEventListener('click', (e) => {
        // Don't toggle if clicking on edit/delete buttons
        if (!e.target.closest('.edit-btn') && !e.target.closest('.delete-btn')) {
            toggleSlipDetails(slipNumber);
        }
    });
    
    // Add long press event for copy to clipboard
    slipHeaderRow.addEventListener('mousedown', (e) => {
        pressTimer = setTimeout(() => {
            copySlipDataToClipboard(slip);
        }, LONG_PRESS_DURATION);
    });
    
    slipHeaderRow.addEventListener('mouseup', () => {
        clearTimeout(pressTimer);
    });
    
    slipHeaderRow.addEventListener('mouseleave', () => {
        clearTimeout(pressTimer);
    });
    
    // Touch events for mobile
    slipHeaderRow.addEventListener('touchstart', (e) => {
        pressTimer = setTimeout(() => {
            copySlipDataToClipboard(slip);
            e.preventDefault();
        }, LONG_PRESS_DURATION);
    });
    
    slipHeaderRow.addEventListener('touchend', () => {
        clearTimeout(pressTimer);
    });
    
    slipHeaderRow.addEventListener('touchcancel', () => {
        clearTimeout(pressTimer);
    });
    
    return slipHeaderRow;
}

// Function to create slip details section
function createSlipDetails(slip, slipNumber) {
    const slipDetails = document.createElement('div');
    slipDetails.className = 'slip-details';
    slipDetails.id = `slip-details-${slipNumber}`;
    
    const userName = slip.name || 'No Name';
    const userCom = slip.com || 0;
    const userZa = slip.za || 0;
    
    let betRows = '';
    if (slip.bets && slip.bets.length > 0) {
        slip.bets.forEach(item => {
            const displayNum = formatNumber(item.display || item.num || item.number);
            const amount = item.amount || 0;
            
            betRows += `
                <div class="bet-row">
                    <div class="bet-number">${displayNum}</div>
                    <div class="bet-amount">${amount.toString()}</div>
                </div>
            `;
        });
    } else if (slip.numbers && slip.numbers.length > 0) {
        // Fallback: display from numbers array if bets not available
        slip.numbers.forEach((num, idx) => {
            const amount = slip.total_amount / slip.numbers.length;
            const displayNum = formatNumber(num);
            
            betRows += `
                <div class="bet-row">
                    <div class="bet-number">${displayNum}</div>
                    <div class="bet-amount">${Math.round(amount).toString()}</div>
                </div>
            `;
        });
    }
    
    slipDetails.innerHTML = `
        <div class="user-info">
            <span class="user-name-detail">${userName}</span>
            <span class="user-stats">Com: ${userCom} | Za: ${userZa}</span>
        </div>
        ${betRows}
        <div class="slip-total">
            Total: ${(slip.total_amount || slip.total || 0).toString()}
        </div>
        <div class="item-actions">
            <button class="edit-btn" onclick="editSlip('${slip.id}')">Edit</button>
            <button class="delete-btn" onclick="deleteSlip('${slip.id}')">Delete</button>
        </div>
    `;
    
    return slipDetails;
}

// Function to load saved bets from Supabase
async function loadSavedBets() {
    const params = getUrlParams();
    
    // Get current time from URL parameters
    if (params.date && params.time) {
        currentKey = `${params.date} ${params.time}`;
        activeTimeDisplay.textContent = currentKey;
    } else if (params.key) {
        currentKey = params.key;
        activeTimeDisplay.textContent = currentKey;
    } else {
        // Try to get from localStorage or default
        const storedDate = localStorage.getItem('selectedDate');
        const storedTime = localStorage.getItem('selectedTime');
        if (storedDate && storedTime) {
            currentKey = `${storedDate} ${storedTime}`;
            activeTimeDisplay.textContent = currentKey;
        } else {
            activeTimeDisplay.textContent = 'No Active Time Selected';
            showMessage('အချိန်မရွေးထားပါ', 'error');
            return;
        }
    }
    
    // Show loading state
    loadingMessage.innerHTML = `
        <div class="spinner"></div>
        <div class="loading-text">လောင်းကြေးများ လာရောက်နေသည်...</div>
    `;
    loadingMessage.style.display = 'block';
    
    // Check if Supabase is initialized
    if (!supabase) {
        if (!initSupabase()) {
            showMessage('Database connection failed. Please refresh.', 'error');
            return;
        }
    }
    
    try {
        // Get data from Supabase
        const { data, error } = await supabase
            .from('sales')
            .select('*')
            .eq('key', currentKey)
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('Supabase error:', error);
            throw error;
        }
        
        currentData = data || [];
        
        if (currentData.length === 0) {
            loadingMessage.innerHTML = '<div class="empty-message">ဘောင်ချာများမရှိသေးပါ</div>';
            listCount.textContent = '0';
            grandTotal.textContent = '0';
            return;
        }
        
        // Display the slips
        displaySlips(currentData);
        
    } catch (error) {
        console.error('Error loading slips:', error);
        loadingMessage.innerHTML = `<div class="error-message">လောင်းကြေးများရယူရာတွင်အမှားတစ်ခုဖြစ်နေသည်</div>`;
        
        // Fallback to localStorage if available
        try {
            const savedData = JSON.parse(localStorage.getItem(currentKey));
            if (savedData && savedData.length > 0) {
                console.log('Using localStorage fallback');
                currentData = savedData;
                displaySlips(savedData);
                showMessage('⚠️ LocalStorage မှဒေတာကိုအသုံးပြုထားသည်', 'error');
            }
        } catch (fallbackError) {
            console.error('Fallback also failed:', fallbackError);
        }
    }
}

// Function to display slips from Supabase
function displaySlips(slipsData) {
    slipList.innerHTML = '';
    let totalGrandTotal = 0;
    
    if (slipsData.length === 0) {
        loadingMessage.innerHTML = '<div class="empty-message">ဘောင်ချာများမရှိသေးပါ</div>';
        listCount.textContent = '0';
        grandTotal.textContent = '0';
        return;
    }
    
    // First, sort the data by created_at (newest first)
    const sortedData = [...slipsData].sort((a, b) => {
        const dateA = new Date(a.created_at || a.timestamp || 0);
        const dateB = new Date(b.created_at || b.timestamp || 0);
        return dateB - dateA; // Newest first
    });
    
    // Create slip items
    sortedData.forEach((slip, index) => {
        // Slip number: newest (first in sorted array) gets highest number
        const slipNumber = sortedData.length - index;
        
        // Create slip header row
        const slipHeaderRow = createSlipHeaderRow(slip, slipNumber);
        
        // Create slip details section
        const slipDetails = createSlipDetails(slip, slipNumber);
        
        // Add to slipList
        slipList.appendChild(slipHeaderRow);
        slipList.appendChild(slipDetails);
        
        totalGrandTotal += (slip.total_amount || slip.total || 0);
    });
    
    // Hide loading message
    loadingMessage.style.display = 'none';
    
    // Update counters
    listCount.textContent = slipsData.length;
    grandTotal.textContent = totalGrandTotal.toString();
}

// Function to load user names from Name table for select dropdown
async function loadUserNamesForSelect(currentName) {
    try {
        // Get names from Name table
        const { data, error } = await supabase
            .from('Name')
            .select('name')
            .order('name');
        
        if (error) {
            console.error('Error loading user names:', error);
            // Return just current name as option
            return `<option value="${currentName || ''}">${currentName || 'Select Name'}</option>`;
        }
        
        // Build options HTML
        let optionsHtml = `<option value="">Select Name</option>`;
        
        // Add names from Name table
        data.forEach(item => {
            if (item.name && item.name.trim()) {
                const selected = item.name === currentName ? 'selected' : '';
                optionsHtml += `<option value="${item.name}" ${selected}>${item.name}</option>`;
            }
        });
        
        // Add current name if not in the list
        if (currentName && !data.some(item => item.name === currentName)) {
            optionsHtml += `<option value="${currentName}" selected>${currentName}</option>`;
        }
        
        return optionsHtml;
        
    } catch (error) {
        console.error('Error loading names:', error);
        return `<option value="${currentName || ''}">${currentName || 'Enter Name'}</option>`;
    }
}

// Function to create bets list view for edit modal
function createBetsListView(betsArray) {
    if (!betsArray || betsArray.length === 0) {
        return '<div class="empty-message" style="padding: 20px; margin: 10px;">No bets found</div>';
    }
    
    let listHtml = '<div class="bets-list-view">';
    
    betsArray.forEach((bet, index) => {
        const num = formatNumber(bet.display || bet.num || bet.number);
        const amount = bet.amount || 0;
        
        listHtml += `
            <div class="bet-item" 
                 data-index="${index}"
                 onclick="editBetItem(${index})"
                 onmousedown="startLongPress(${index})"
                 onmouseup="clearLongPress()"
                 onmouseleave="clearLongPress()"
                 ontouchstart="startLongPress(${index})"
                 ontouchend="clearLongPress()"
                 ontouchcancel="clearLongPress()">
                <div class="bet-item-info">
                    <div class="bet-item-number">${num}</div>
                    <div class="bet-item-amount">${amount.toString()}</div>
                </div>
                <button class="bet-item-edit-btn" onclick="event.stopPropagation(); editBetItem(${index})">Edit</button>
            </div>
        `;
    });
    
    listHtml += '</div>';
    return listHtml;
}

// Function to start long press timer for deletion
function startLongPress(index) {
    pressTimer = setTimeout(() => {
        askDeleteBetItem(index);
    }, LONG_PRESS_DURATION);
}

// Function to clear long press timer
function clearLongPress() {
    if (pressTimer) {
        clearTimeout(pressTimer);
        pressTimer = null;
    }
}

// Function to ask for bet item deletion
function askDeleteBetItem(index) {
    if (confirm('Delete this bet item?')) {
        deleteBetItem(index);
    }
}

// Function to delete bet item from editing array
function deleteBetItem(index) {
    if (index >= 0 && index < editingBets.length) {
        editingBets.splice(index, 1);
        updateEditModalBetsList();
    }
}

// Function to update the bets list in edit modal
function updateEditModalBetsList() {
    const betsListContainer = document.getElementById('betsListContainer');
    if (betsListContainer) {
        betsListContainer.innerHTML = createBetsListView(editingBets);
    }
    
    // Update total
    const totalElement = document.getElementById('editModalTotal');
    if (totalElement) {
        const total = calculateTotal(editingBets);
        totalElement.textContent = `Total: ${total.toString()}`;
    }
}

// Function to calculate total from bets array
function calculateTotal(betsArray) {
    return betsArray.reduce((sum, bet) => sum + (bet.amount || 0), 0);
}

// Function to show edit modal
function showEditModal(slipId) {
    const slip = currentData.find(s => s.id == slipId);
    if (!slip) {
        showMessage('Slip not found', 'error');
        return;
    }
    
    currentEditingSlipId = slipId;
    
    // Initialize editing bets array from database EXACTLY as stored
    editingBets = [];
    if (slip.bets && slip.bets.length > 0) {
        // Deep copy bets array - keep negative amounts as they are
        editingBets = JSON.parse(JSON.stringify(slip.bets));
    } else if (slip.numbers && slip.numbers.length > 0) {
        // Create bets array from numbers
        const estimatedAmount = slip.total_amount / slip.numbers.length;
        editingBets = slip.numbers.map(num => ({
            display: formatNumber(num),
            num: num,
            number: num,
            amount: Math.round(estimatedAmount)
        }));
    }
    
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'editModal';
    
    // Calculate total (negative amounts included)
    const total = calculateTotal(editingBets);
    
    // Load user names from Name table for select dropdown
    loadUserNamesForSelect(slip.name).then(optionsHtml => {
        // Create modal content with list view
        overlay.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <div class="modal-title">Edit Slip</div>
                    <button class="close-btn" onclick="closeEditModal()">✕</button>
                </div>
                
                <div class="edit-section">
                    <label class="edit-label">User Name:</label>
                    <select class="edit-input" id="editName" style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 5px; font-family: 'Pyidaungsu', sans-serif; font-size: 14px; margin-bottom: 10px;">
                        ${optionsHtml}
                    </select>
                </div>
                
                <div id="betsListContainer">
                    ${createBetsListView(editingBets)}
                </div>
                
                <div class="total-summary" id="editModalTotal">Total: ${total.toString()}</div>
                
                <div class="modal-buttons">
                    <button class="save-btn" id="saveEditBtn" onclick="saveEditedSlip()">Save</button>
                    <button class="cancel-btn" onclick="closeEditModal()">Cancel</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // Focus on name field
        setTimeout(() => {
            const nameSelect = document.getElementById('editName');
            if (nameSelect) {
                nameSelect.focus();
            }
        }, 100);
    });
}

// Function to edit bet item
function editBetItem(index) {
    console.log('editBetItem called with index:', index);
    if (index >= 0 && index < editingBets.length) {
        currentEditingBetIndex = index;
        const bet = editingBets[index];
        const amount = bet.amount || 0;
        
        // Store whether original amount was negative
        const originalIsNegative = amount < 0;
        const absoluteAmount = Math.abs(amount);
        
        console.log('Bet data:', bet);
        console.log('Amount:', amount, 'Original is negative:', originalIsNegative, 'Absolute:', absoluteAmount);
        
        // Create edit bet modal
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.id = 'editBetModal';
        
        overlay.innerHTML = `
            <div class="edit-bet-modal">
                <div class="modal-header">
                    <div class="modal-title">Edit Bet Item</div>
                    <button class="close-btn" onclick="closeEditBetModal()">✕</button>
                </div>
                <div class="edit-bet-form">
                    <div class="edit-bet-input-group">
                        <input type="number" 
                               class="edit-bet-input" 
                               id="editBetNumber" 
                               placeholder="Number (00-99)" 
                               maxlength="2"
                               value="${formatNumber(bet.display || bet.num || bet.number)}">
</div>
  <div class="edit-bet-input-group">

                        <input type="number" 
                               class="edit-bet-input" 
                               id="editBetAmount" 
                               placeholder="Amount" 
                               value="${absoluteAmount}">
                    </div>
                    <div class="edit-bet-buttons">
                        <button type="button" class="save-bet-btn" onclick="saveEditedBet(${originalIsNegative}, ${index})">Save</button>
                        <button type="button" class="cancel-bet-btn" onclick="closeEditBetModal()">Cancel</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // Focus on number field
        setTimeout(() => {
            const numberInput = document.getElementById('editBetNumber');
            if (numberInput) {
                numberInput.focus();
                numberInput.select();
            }
        }, 100);
    }
}

// Function to close edit bet modal
function closeEditBetModal() {
    const modal = document.getElementById('editBetModal');
    if (modal) {
        document.body.removeChild(modal);
    }
    currentEditingBetIndex = null;
}

// Function to save edited bet
function saveEditedBet(originalIsNegative = false, index = null) {
    console.log('=== saveEditedBet START ===');
    console.log('originalIsNegative:', originalIsNegative);
    console.log('passed index:', index);
    console.log('currentEditingBetIndex:', currentEditingBetIndex);
    
    // Use passed index if available, otherwise use global index
    const betIndex = index !== null ? index : currentEditingBetIndex;
    console.log('Using betIndex:', betIndex);
    
    const numberInput = document.getElementById('editBetNumber');
    const amountInput = document.getElementById('editBetAmount');
    
    console.log('Number input element:', numberInput);
    console.log('Amount input element:', amountInput);
    
    if (!numberInput) {
        console.error('Number input not found!');
        showMessage('Number input not found', 'error');
        return;
    }
    
    if (!amountInput) {
        console.error('Amount input not found!');
        showMessage('Amount input not found', 'error');
        return;
    }
    
    let numStr = numberInput.value;
    let amountStr = amountInput.value;
    
    console.log('Raw numStr:', numStr, 'Raw amountStr:', amountStr);
    
    numStr = numStr.trim();
    amountStr = amountStr.trim();
    
    console.log('Trimmed numStr:', numStr, 'Trimmed amountStr:', amountStr);
    
    if (!numStr) {
        console.error('Number is empty!');
        showMessage('Please enter number', 'error');
        numberInput.focus();
        return;
    }
    
    if (!amountStr) {
        console.error('Amount is empty!');
        showMessage('Please enter amount', 'error');
        amountInput.focus();
        return;
    }
    
    // Parse number (ensure it's a valid number between 0-99)
    const num = parseInt(numStr);
    console.log('Parsed number:', num);
    
    if (isNaN(num) || num < 0 || num > 99) {
        showMessage('Please enter a valid number (00-99)', 'error');
        numberInput.focus();
        return;
    }
    
    // Parse amount (must be positive number)
    let amount = parseFloat(amountStr);
    console.log('Parsed amount:', amount);
    
    if (isNaN(amount) || amount <= 0) {
        showMessage('Please enter a valid positive amount', 'error');
        amountInput.focus();
        return;
    }
    
    // If original amount was negative, make the new amount negative too
    if (originalIsNegative) {
        amount = -amount;
        console.log('Applied negative sign. New amount:', amount);
    }
    
    // Update the bet item - keep exactly as database format
    editingBets[betIndex] = {
        display: formatNumber(num),
        num: num,
        number: num,
        amount: amount  // Could be negative if original was negative
    };
    
    console.log('Updated bet item:', editingBets[betIndex]);
    console.log('=== saveEditedBet END ===');
    
    // Close modal and update list
    closeEditBetModal();
    updateEditModalBetsList();
}

// Function to close edit modal
function closeEditModal() {
    const modal = document.getElementById('editModal');
    if (modal) {
        document.body.removeChild(modal);
    }
    currentEditingSlipId = null;
    editingBets = [];
}

// Function to edit slip
function editSlip(slipId) {
    // Prevent event bubbling
    if (event) event.stopPropagation();
    showEditModal(slipId);
}

// Function to save edited slip to Supabase
async function saveEditedSlip() {
    console.log('=== saveEditedSlip START ===');
    
    const modal = document.getElementById('editModal');
    if (!modal) {
        console.error('Edit modal not found!');
        return;
    }
    
    const nameSelect = document.getElementById('editName');
    
    if (!nameSelect) {
        console.error('Name select not found!');
        return;
    }
    
    const name = nameSelect.value.trim();
    
    if (!name) {
        showMessage('Please select user name', 'error');
        nameSelect.focus();
        return;
    }
    
    if (editingBets.length === 0) {
        showMessage('Please add at least one bet', 'error');
        return;
    }
    
    console.log('Name:', name);
    console.log('Editing bets:', editingBets);
    
    const saveBtn = document.getElementById('saveEditBtn');
    const originalText = saveBtn.textContent;
    
    try {
        // Show loading
        saveBtn.textContent = 'Saving...';
        saveBtn.disabled = true;
        
        // Calculate total (negative amounts included)
        const total = calculateTotal(editingBets);
        console.log('Total calculated:', total);
        
        // Update created_at to current time
        const updatedDate = new Date().toISOString();
        console.log('Updated date:', updatedDate);
        
        // Prepare update data EXACTLY as from database format
        const updateData = {
            name: name,
            bets: editingBets,  // Bets array with original structure
            total_amount: total,
            numbers: editingBets.map(item => item.display || item.num || item.number),
            created_at: updatedDate  // Update time to now
        };
        
        console.log('Updating slip ID:', currentEditingSlipId);
        console.log('Update data:', JSON.stringify(updateData, null, 2));
        
        // Update in Supabase
        const { data, error } = await supabase
            .from('sales')
            .update(updateData)
            .eq('id', currentEditingSlipId);
        
        if (error) {
            console.error('Supabase update error:', error);
            throw error;
        }
        
        console.log('Update successful');
        
        // Close modal
        closeEditModal();
        
        // Reload the list
        await loadSavedBets();
        
        showMessage('Slip updated successfully!', 'success');
        
    } catch (error) {
        console.error('Error updating slip:', error);
        showMessage('Failed to update slip. Please try again.', 'error');
        
        // Restore button
        saveBtn.textContent = originalText;
        saveBtn.disabled = false;
    }
    
    console.log('=== saveEditedSlip END ===');
}

// Function to delete slip from Supabase
async function deleteSlip(slipId) {
    // Prevent event bubbling
    if (event) event.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this slip?')) {
        return;
    }
    
    try {
        // Delete from Supabase
        const { error } = await supabase
            .from('sales')
            .delete()
            .eq('id', slipId);
        
        if (error) {
            throw error;
        }
        
        // Remove from currentData
        currentData = currentData.filter(slip => slip.id != slipId);
        
        // Update display
        displaySlips(currentData);
        
        showMessage('Slip deleted successfully!', 'success');
        
    } catch (error) {
        console.error('Error deleting slip:', error);
        showMessage('Failed to delete slip. Please try again.', 'error');
    }
}

// Function to setup real-time updates
function setupRealTimeUpdates() {
    if (!supabase || !currentKey) return;
    
    supabase
        .channel('slip-updates')
        .on('postgres_changes', 
            { 
                event: '*', 
                schema: 'public', 
                table: 'sales',
                filter: `key=eq.${currentKey}`
            },
            (payload) => {
                console.log('Real-time update:', payload);
                loadSavedBets();
            }
        )
        .subscribe();
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    if (initSupabase()) {
        loadSavedBets();
        setupRealTimeUpdates();
    }
    
    // Auto-refresh every 30 seconds
    setInterval(loadSavedBets, 30000);
});

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        // Go back to sale.html
        const params = getUrlParams();
        if (params.date && params.time) {
            window.location.href = `sale.html?date=${encodeURIComponent(params.date)}&time=${encodeURIComponent(params.time)}`;
        } else if (params.key) {
            window.location.href = `sale.html?key=${encodeURIComponent(params.key)}`;
        } else {
            window.location.href = "sale.html";
        }
    } else if (e.key === 'F5') {
        e.preventDefault();
        loadSavedBets();
    } else if (e.key === 'r' && e.ctrlKey) {
        e.preventDefault();
        loadSavedBets();
    }
});

// Make functions available globally
window.toggleSlipDetails = toggleSlipDetails;
window.editSlip = editSlip;
window.deleteSlip = deleteSlip;
window.saveEditedSlip = saveEditedSlip;
window.closeEditModal = closeEditModal;
window.editBetItem = editBetItem;
window.closeEditBetModal = closeEditBetModal;
window.saveEditedBet = saveEditedBet;
window.startLongPress = startLongPress;
window.clearLongPress = clearLongPress;

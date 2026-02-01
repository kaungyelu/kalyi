  // Global Variables
        
        let currentKey = '';
        let allSalesData = [];
        let filteredSalesData = [];
        let searchNumber = '';

        // DOM Elements
        const activeTimeDisplay = document.getElementById('activeTimeDisplay');
        const searchInput = document.getElementById('searchInput');
        const clearBtn = document.getElementById('clearBtn');
        const searchStatus = document.getElementById('searchStatus');
        const dataSection = document.getElementById('dataSection');
        const loadingContainer = document.getElementById('loadingContainer');
        const grandTotal = document.getElementById('grandTotal');

        // Function to show message (EXACTLY as slip.html style)
        function showMessage(message, type = 'info') {
            const messageDiv = document.createElement('div');
            messageDiv.className = type === 'error' ? 'error-message' : 'loading-text';
            messageDiv.textContent = message;
            messageDiv.style.position = 'fixed';
            messageDiv.style.top = '20px';
            messageDiv.style.left = '50%';
            messageDiv.style.transform = 'translateX(-50%)';
            messageDiv.style.zIndex = '1001';
            messageDiv.style.padding = '10px 20px';
            messageDiv.style.borderRadius = '5px';
            messageDiv.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
            
            if (type === 'error') {
                messageDiv.style.background = '#ffeaea';
                messageDiv.style.color = '#e74c3c';
            } else {
                messageDiv.style.background = '#eaffea';
                messageDiv.style.color = '#27ae60';
            }
            
            document.body.appendChild(messageDiv);
            
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    document.body.removeChild(messageDiv);
                }
            }, 3000);
        }

        // Initialize Supabase (EXACTLY as slip.html)
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

        // Function to get URL parameters (EXACTLY as slip.html)
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

        // Function to format number with leading zero (EXACTLY as slip.html)
        function formatNumber(num) {
            if (num === undefined || num === null || isNaN(num)) return '';
            const numStr = num.toString();
            return numStr.length === 1 ? '0' + numStr : numStr;
        }

        // Function to load saved bets from Supabase (EXACTLY as slip.html logic)
        async function loadSavedBets() {
            const params = getUrlParams();
            
            // Get current time from URL parameters (EXACTLY as slip.html)
            if (params.date && params.time) {
                currentKey = `${params.date} ${params.time}`;
                activeTimeDisplay.textContent = currentKey;
            } else if (params.key) {
                currentKey = params.key;
                activeTimeDisplay.textContent = currentKey;
            } else {
                // Try to get from localStorage or default (EXACTLY as slip.html)
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
            
            // Check if Supabase is initialized (EXACTLY as slip.html)
            if (!supabase) {
                if (!initSupabase()) {
                    showMessage('Database connection failed. Please refresh.', 'error');
                    return;
                }
            }
            
            try {
                // Get data from Supabase (EXACTLY as slip.html query)
                const { data, error } = await supabase
                    .from('sales')
                    .select('*')
                    .eq('key', currentKey)
                    .order('created_at', { ascending: false });
                
                if (error) {
                    console.error('Supabase error:', error);
                    throw error;
                }
                
                allSalesData = data || [];
                
                if (allSalesData.length === 0) {
                    loadingContainer.innerHTML = '<div class="empty-message">ဘောင်ချာများမရှိသေးပါ</div>';
                    grandTotal.textContent = '0';
                    return;
                }
                
                // Apply search filter if any
                filteredSalesData = filterDataByNumber(allSalesData, searchNumber);
                
                // Display the slips
                displaySlips(filteredSalesData);
                
            } catch (error) {
                console.error('Error loading slips:', error);
                loadingContainer.innerHTML = '<div class="error-message">လောင်းကြေးများရယူရာတွင်အမှားတစ်ခုဖြစ်နေသည်</div>';
            }
        }

        // Function to filter data by search number
        function filterDataByNumber(data, searchNum) {
            if (!searchNum || searchNum === '') {
                return data;
            }
            
            const filteredData = [];
            const searchNumInt = parseInt(searchNum);
            
            data.forEach(slip => {
                // Check if this slip has the searched number (EXACTLY as slip.html format)
                let hasMatchingBets = false;
                const matchingBets = [];
                
                if (slip.bets && slip.bets.length > 0) {
                    slip.bets.forEach(bet => {
                        const betNumber = bet.display || bet.num || bet.number;
                        if (parseInt(betNumber) === searchNumInt) {
                            hasMatchingBets = true;
                            matchingBets.push(bet);
                        }
                    });
                } else if (slip.numbers && slip.numbers.length > 0) {
                    // Fallback to numbers array (EXACTLY as slip.html)
                    slip.numbers.forEach(num => {
                        if (parseInt(num) === searchNumInt) {
                            hasMatchingBets = true;
                            // Estimate amount if not available
                            const estimatedAmount = slip.total_amount / slip.numbers.length;
                            matchingBets.push({
                                display: formatNumber(num),
                                num: num,
                                amount: Math.round(estimatedAmount)
                            });
                        }
                    });
                }
                
                if (hasMatchingBets) {
                    // Create a copy of the slip with only matching bets
                    const filteredSlip = {
                        ...slip,
                        bets: matchingBets,
                        total_amount: matchingBets.reduce((sum, bet) => sum + (bet.amount || 0), 0)
                    };
                    filteredData.push(filteredSlip);
                }
            });
            
            return filteredData;
        }

        // Function to calculate grand total
        function calculateGrandTotal(data) {
            return data.reduce((total, slip) => total + (slip.total_amount || 0), 0);
        }

        // Function to display slips (EXACTLY as slip.html sorting logic)
        function displaySlips(slipsData) {
            loadingContainer.style.display = 'none';
            dataSection.innerHTML = '';
            
            if (slipsData.length === 0) {
                dataSection.innerHTML = `
                    <div class="no-results">
                        ${searchNumber ? 
                            'Number ' + formatNumber(searchNumber) + ' နှင့် ကိုက်ညီသော လောင်းကြေးမရှိပါ' : 
                            'လောင်းကြေးများ မရှိသေးပါ'
                        }
                    </div>
                `;
                grandTotal.textContent = '0';
                return;
            }
            
            // First, sort the data by created_at (newest first) - EXACTLY as slip.html
            const sortedData = [...slipsData].sort((a, b) => {
                const dateA = new Date(a.created_at || a.timestamp || 0);
                const dateB = new Date(b.created_at || b.timestamp || 0);
                return dateB - dateA; // Newest first
            });
            
            let allSlipsHtml = '';
            
            // Create slip items (EXACTLY as requested format)
            sortedData.forEach((slip, index) => {
                // Slip number: newest (first in sorted array) gets highest number
                const slipNumber = sortedData.length - index;
                const userName = slip.name || 'No Name';
                const slipTotal = slip.total_amount || slip.total || 0;
                
                let betRows = '';
                if (slip.bets && slip.bets.length > 0) {
                    slip.bets.forEach(bet => {
                        const displayNum = formatNumber(bet.display || bet.num || bet.number);
                        const amount = bet.amount || 0;
                        
                        betRows += `
                            <div class="bet-row">
                                <div class="bet-number">${displayNum}</div>
                                <div class="bet-amount">${amount.toString()}</div>
                            </div>
                        `;
                    });
                } else if (slip.numbers && slip.numbers.length > 0) {
                    // Fallback display (EXACTLY as slip.html)
                    slip.numbers.forEach(num => {
                        const estimatedAmount = slip.total_amount / slip.numbers.length;
                        const displayNum = formatNumber(num);
                        
                        betRows += `
                            <div class="bet-row">
                                <div class="bet-number">${displayNum}</div>
                                <div class="bet-amount">${Math.round(estimatedAmount).toString()}</div>
                            </div>
                        `;
                    });
                }
                
                const slipHtml = `
                    <div class="slip-item">
                        <div class="slip-header">
                            <div class="slip-number">${slipNumber}</div>
                            <div class="user-name">${userName}</div>
                            <div class="slip-total">${slipTotal.toString()}</div>
                        </div>
                        <div class="bet-items">
                            ${betRows}
                            <div class="item-total">
                                Total = ${slipTotal.toString()}
                            </div>
                        </div>
                    </div>
                `;
                
                allSlipsHtml += slipHtml;
            });
            
            dataSection.innerHTML = allSlipsHtml;
            
            // Update grand total
            const total = calculateGrandTotal(slipsData);
            grandTotal.textContent = total.toString();
            
            // Update search status
            if (searchNumber) {
                const matchingCount = slipsData.length;
                const matchingTotal = total;
                searchStatus.innerHTML = `
                    Number <strong>${formatNumber(searchNumber)}</strong> သည်Slip
                    <strong>${matchingCount}</strong> ခုတွင်ရှိသည် | 
                    Total: <strong>${matchingTotal.toString()}</strong>
                `;
            } else {
                searchStatus.textContent = 'အားလုံး ပြသထားသည်';
            }
        }

        // Event Listeners
        searchInput.addEventListener('input', function(e) {
            searchNumber = e.target.value.trim();
            
            // Validate input (00-99)
            if (searchNumber && (parseInt(searchNumber) < 0 || parseInt(searchNumber) > 99)) {
                searchInput.value = '';
                searchNumber = '';
                searchStatus.textContent = 'Please enter number between 00-99';
                return;
            }
            
            // Apply filter
            filteredSalesData = filterDataByNumber(allSalesData, searchNumber);
            displaySlips(filteredSalesData);
        });
        
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                searchNumber = this.value.trim();
                filteredSalesData = filterDataByNumber(allSalesData, searchNumber);
                displaySlips(filteredSalesData);
            }
        });
        
        clearBtn.addEventListener('click', function() {
            searchInput.value = '';
            searchNumber = '';
            filteredSalesData = allSalesData;
            displaySlips(filteredSalesData);
        });

        // Initialize on page load
        document.addEventListener('DOMContentLoaded', function() {
            if (initSupabase()) {
                loadSavedBets();
            }
        });

        // Keyboard shortcuts (EXACTLY as slip.html style)
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                // Clear search
                searchInput.value = '';
                searchNumber = '';
                filteredSalesData = allSalesData;
                displaySlips(filteredSalesData);
            }
        });
    

        console.log('slipview-helper.js functionality loaded');

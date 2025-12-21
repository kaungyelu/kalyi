    let currentTimeData = null;
        

        document.addEventListener('DOMContentLoaded', async function() {
            try {
                // Initialize Supabase
                supabase = window.supabaseClient;
                console.log('Supabase initialized successfully');
                
                // Load current time data
                await loadCurrentTimeData();
                
                // Initialize close sale button
                await initializeCloseSaleButton();
                
                // Load close numbers
                await loadCloseNumbers();
                
                // Add click events to buttons
                document.getElementById('closeSaleButton').addEventListener('click', handleCloseSaleClick);
                document.getElementById('hotButton').addEventListener('click', showAddCloseNumberModal);
                document.getElementById('deleteButton').addEventListener('click', handleDeleteAllClick);
                
            } catch (error) {
                console.error('Initialization error:', error);
                showMessage('Initialization failed. Please refresh.', 'error');
            }
        });

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

        async function loadCurrentTimeData() {
            const params = getUrlParams();
            
            if (params.date && params.time) {
                currentTimeData = {
                    date: params.date,
                    time: params.time
                };
                
                document.getElementById('activeTime').textContent = `${params.date} ${params.time}`;
                
                // Store in localStorage
                localStorage.setItem('selectedDate', params.date);
                localStorage.setItem('selectedTime', params.time);
                
            } else {
                const storedDate = localStorage.getItem('selectedDate');
                const storedTime = localStorage.getItem('selectedTime');
                
                if (storedDate && storedTime) {
                    currentTimeData = {
                        date: storedDate,
                        time: storedTime
                    };
                    
                    document.getElementById('activeTime').textContent = `${storedDate} ${storedTime}`;
                } else {
                    document.getElementById('activeTime').textContent = 'No Active Time Set';
                    showMessage('Please select a time from main page first', 'error');
                }
            }
        }

        async function initializeCloseSaleButton() {
            if (!currentTimeData) {
                document.getElementById('closeSaleButton').textContent = 'အရောင်းပိတ်ရန် (No time set)';
                return;
            }

            try {
                // Check if current time has 'k' in open column
                const { data: timeData, error } = await supabase
                    .from('TimeC')
                    .select('open')
                    .eq('date', currentTimeData.date)
                    .eq('time', currentTimeData.time.toUpperCase())
                    .limit(1);

                if (error) {
                    console.error('Error checking open status:', error);
                    throw error;
                }

                const closeSaleButton = document.getElementById('closeSaleButton');
                
                if (timeData && timeData.length > 0) {
                    const openValue = timeData[0].open || '';
                    
                    if (openValue.includes('k')) {
                        // Has 'k' - sale is open
                        closeSaleButton.textContent = 'အရောင်းပိတ်ရန် (ဖွင့်ပီးပါပီ)';
                    } else {
                        // No 'k' - sale is closed
                        closeSaleButton.textContent = 'အရောင်းပိတ်ရန် (ပိတ်ပီးပါပီ)';
                    }
                } else {
                    // No data found - assume sale is closed
                    closeSaleButton.textContent = 'အရောင်းပိတ်ရန် (ပိတ်ပီးပါပီ)';
                }
                
            } catch (error) {
                console.error('Error initializing close sale button:', error);
                document.getElementById('closeSaleButton').textContent = 'အရောင်းပိတ်ရန် (Error)';
            }
        }

        async function handleCloseSaleClick() {
            if (!currentTimeData) {
                showMessage('No active time selected', 'error');
                return;
            }

            try {
                const closeSaleButton = document.getElementById('closeSaleButton');
                const currentButtonText = closeSaleButton.textContent;
                const isCurrentlyOpen = currentButtonText.includes('ဖွင့်ပီးပါပီ');
                
                // Get current time data from TimeC table
                const { data: timeData, error: fetchError } = await supabase
                    .from('TimeC')
                    .select('id, open')
                    .eq('date', currentTimeData.date)
                    .eq('time', currentTimeData.time.toUpperCase())
                    .limit(1);

                if (fetchError) {
                    console.error('Error fetching time data:', fetchError);
                    throw fetchError;
                }

                if (!timeData || timeData.length === 0) {
                    showMessage('No time data found for current selection', 'error');
                    return;
                }

                const timeId = timeData[0].id;
                const currentOpenValue = timeData[0].open || '';

                if (isCurrentlyOpen) {
                    // Currently open, need to remove 'k'
                    let newOpenValue = currentOpenValue.replace(/k/g, '');
                    
                    // Update the specific time record
                    const { error: updateError } = await supabase
                        .from('TimeC')
                        .update({ open: newOpenValue })
                        .eq('id', timeId);

                    if (updateError) {
                        console.error('Error updating open value:', updateError);
                        throw updateError;
                    }
                    
                    closeSaleButton.textContent = 'အရောင်းပိတ်ရန် (ပိတ်ပီးပါပီ)';
                    showMessage('Sale closed successfully', 'success');
                    
                } else {
                    // Currently closed, need to add 'k' and remove 'k' from other times
                    
                    // First, remove 'k' from all other TimeC records
                    const { error: clearError } = await supabase
                        .from('TimeC')
                        .update({ open: '' })
                        .neq('id', timeId);

                    if (clearError) {
                        console.error('Error clearing other open values:', clearError);
                        throw clearError;
                    }

                    // Then add 'k' to current time record
                    let newOpenValue = currentOpenValue;
                    if (!newOpenValue.includes('k')) {
                        newOpenValue = newOpenValue ? newOpenValue + 'k' : 'k';
                    }
                    
                    const { error: updateError } = await supabase
                        .from('TimeC')
                        .update({ open: newOpenValue })
                        .eq('id', timeId);

                    if (updateError) {
                        console.error('Error updating current open value:', updateError);
                        throw updateError;
                    }
                    
                    closeSaleButton.textContent = 'အရောင်းပိတ်ရန် (ဖွင့်ပီးပါပီ)';
                    showMessage('Sale opened successfully', 'success');
                }
                
            } catch (error) {
                console.error('Error handling close sale click:', error);
                showMessage('Operation failed. Please try again.', 'error');
            }
        }

        async function loadCloseNumbers() {
            try {
                const { data, error } = await supabase
                    .from('Closenum')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(50);

                if (error) {
                    console.error('Error loading close numbers:', error);
                    showMessage('Error loading close numbers', 'error');
                    return;
                }

                const listview = document.getElementById('listview');
                listview.innerHTML = '';

                if (!data || data.length === 0) {
                    listview.innerHTML = '<div style="text-align: center; color: #999; padding: 20px;">No close numbers found</div>';
                    return;
                }

                data.forEach(item => {
                    console.log('Processing item:', item);
                    
                    // Check if cnumbers is a string (JSON format)
                    if (item.cnumbers && typeof item.cnumbers === 'string') {
                        try {
                            // Parse the JSON string to array
                            const parsedNumbers = JSON.parse(item.cnumbers);
                            console.log('Parsed numbers:', parsedNumbers);
                            
                            if (Array.isArray(parsedNumbers)) {
                                const itemDiv = document.createElement('div');
                                itemDiv.className = 'list-item';
                                
                                // Format numbers for display
                                const displayNumbers = parsedNumbers
                                    .map(num => {
                                        const numValue = typeof num === 'string' ? parseInt(num) : num;
                                        return numValue < 10 ? '0' + numValue : numValue.toString();
                                    })
                                    .join(', ');
                                
                                itemDiv.textContent = displayNumbers;
                                
                                // Add delete button for individual item
                                const deleteBtn = document.createElement('button');
                                deleteBtn.textContent = '×';
                                deleteBtn.style.cssText = `
                                    position: absolute;
                                    right: 10px;
                                    top: 50%;
                                    transform: translateY(-50%);
                                    background: #e74c3c;
                                    color: white;
                                    border: none;
                                    border-radius: 50%;
                                    width: 24px;
                                    height: 24px;
                                    cursor: pointer;
                                    font-size: 16px;
                                    display: none;
                                `;
                                itemDiv.style.position = 'relative';
                                
                                itemDiv.addEventListener('mouseenter', () => {
                                    deleteBtn.style.display = 'block';
                                });
                                
                                itemDiv.addEventListener('mouseleave', () => {
                                    deleteBtn.style.display = 'none';
                                });
                                
                                deleteBtn.addEventListener('click', async (e) => {
                                    e.stopPropagation();
                                    if (confirm('Delete this close number?')) {
                                        await deleteCloseNumber(item.id);
                                    }
                                });
                                
                                itemDiv.appendChild(deleteBtn);
                                listview.appendChild(itemDiv);
                            }
                        } catch (parseError) {
                            console.error('Error parsing cnumbers:', parseError);
                        }
                    }
                    // Also check if it's already an array
                    else if (item.cnumbers && Array.isArray(item.cnumbers)) {
                        const itemDiv = document.createElement('div');
                        itemDiv.className = 'list-item';
                        // Show as numbers without quotes
                        itemDiv.textContent = item.cnumbers.map(num => parseInt(num)).join(', ');
                        
                        // Add delete button for individual item
                        const deleteBtn = document.createElement('button');
                        deleteBtn.textContent = '×';
                        deleteBtn.style.cssText = `
                            position: absolute;
                            right: 10px;
                            top: 50%;
                            transform: translateY(-50%);
                            background: #e74c3c;
                            color: white;
                            border: none;
                            border-radius: 50%;
                            width: 24px;
                            height: 24px;
                            cursor: pointer;
                            font-size: 16px;
                            display: none;
                        `;
                        itemDiv.style.position = 'relative';
                        
                        itemDiv.addEventListener('mouseenter', () => {
                            deleteBtn.style.display = 'block';
                        });
                        
                        itemDiv.addEventListener('mouseleave', () => {
                            deleteBtn.style.display = 'none';
                        });
                        
                        deleteBtn.addEventListener('click', async (e) => {
                            e.stopPropagation();
                            if (confirm('Delete this close number?')) {
                                await deleteCloseNumber(item.id);
                            }
                        });
                        
                        itemDiv.appendChild(deleteBtn);
                        listview.appendChild(itemDiv);
                    }
                });

            } catch (error) {
                console.error('Error in loadCloseNumbers:', error);
                showMessage('Failed to load close numbers', 'error');
            }
        }

        async function deleteCloseNumber(id) {
            try {
                const { error } = await supabase
                    .from('Closenum')
                    .delete()
                    .eq('id', id);

                if (error) {
                    console.error('Error deleting close number:', error);
                    showMessage('Failed to delete close number', 'error');
                    return;
                }

                showMessage('Close number deleted successfully', 'success');
                await loadCloseNumbers(); // Refresh the list
                
            } catch (error) {
                console.error('Error in deleteCloseNumber:', error);
                showMessage('Failed to delete close number', 'error');
            }
        }

        async function handleDeleteAllClick() {
            if (!confirm('Are you sure you want to delete ALL close numbers?')) {
                return;
            }

            try {
                const { error } = await supabase
                    .from('Closenum')
                    .delete()
                    .neq('cnumbers', ''); // Delete all records

                if (error) {
                    console.error('Error deleting close numbers:', error);
                    showMessage('Failed to delete close numbers', 'error');
                    return;
                }

                showMessage('All close numbers deleted successfully', 'success');
                await loadCloseNumbers(); // Refresh the list
                
            } catch (error) {
                console.error('Error in handleDeleteAllClick:', error);
                showMessage('Failed to delete close numbers', 'error');
            }
        }

        function showAddCloseNumberModal() {
            const modalOverlay = document.createElement('div');
            modalOverlay.className = 'modal-overlay';
            
            const modalContent = document.createElement('div');
            modalContent.className = 'modal-content';
            
            modalContent.innerHTML = `
                <div class="modal-header">ဟော့ကွက်ပိတ်ရန်</div>
                <textarea 
                    class="close-input" 
                    placeholder="နမူနာ: 
12
12r
12/13/14r
1/2/3/4/5ထိပ်
1/2/3/4/5ပိတ်
1ပါ1p
အပူး
1ဘရိတ်"
                    rows="6"
                ></textarea>
                <div class="modal-buttons">
                    <button class="modal-btn cancel">Cancel</button>
                    <button class="modal-btn paste">Paste</button>
                    <button class="modal-btn preview">Preview</button>
                </div>
                <div class="preview-container" style="margin-top: 20px; display: none;">
                    <div class="preview-header" style="font-weight: bold; margin-bottom: 10px;">အရေအတွက်: <span class="preview-count">0</span> ခု</div>
                    <div class="preview-numbers" style="background: #f8f9fa; padding: 10px; border-radius: 5px; max-height: 200px; overflow-y: auto;"></div>
                    <div class="preview-buttons" style="margin-top: 15px; display: flex; gap: 10px;">
                        <button class="modal-btn cancel-preview" style="flex: 1;">Cancel</button>
                        <button class="modal-btn save" style="flex: 1; background: #2ecc71;">Save</button>
                    </div>
                </div>
            `;
            
            modalOverlay.appendChild(modalContent);
            document.body.appendChild(modalOverlay);
            
            const input = modalContent.querySelector('.close-input');
            const cancelBtn = modalContent.querySelector('.modal-btn.cancel');
            const pasteBtn = modalContent.querySelector('.modal-btn.paste');
            const previewBtn = modalContent.querySelector('.modal-btn.preview');
            const previewContainer = modalContent.querySelector('.preview-container');
            const previewCount = modalContent.querySelector('.preview-count');
            const previewNumbers = modalContent.querySelector('.preview-numbers');
            const previewCancelBtn = modalContent.querySelector('.cancel-preview');
            const saveBtn = modalContent.querySelector('.preview-buttons .save');
            
            let parsedData = null;
            
            input.focus();
            
            cancelBtn.addEventListener('click', () => {
                document.body.removeChild(modalOverlay);
            });
            
            pasteBtn.addEventListener('click', async () => {
                try {
                    if (navigator.clipboard && navigator.clipboard.readText) {
                        const text = await navigator.clipboard.readText();
                        input.value = text;
                        showMessage('Pasted from clipboard', 'success');
                    } else {
                        alert('Clipboard API not available. Please paste manually.');
                        input.select();
                    }
                } catch (error) {
                    console.error('Error pasting:', error);
                    alert('Cannot access clipboard. Please paste manually.');
                    input.select();
                }
            });
            
            previewBtn.addEventListener('click', () => {
                const text = input.value.trim();
                if (!text) {
                    showMessage('Please enter close numbers first', 'error');
                    input.focus();
                    return;
                }
                
                parsedData = parseCloseNumbers(text);
                
                if (parsedData.validLines.length === 0) {
                    showMessage('No valid close numbers found', 'error');
                    return;
                }
                
                // Show preview
                previewCount.textContent = parsedData.totalNumbers;
                previewNumbers.innerHTML = '';
                
                parsedData.validLines.forEach((item, index) => {
                    const lineDiv = document.createElement('div');
                    lineDiv.style.marginBottom = '10px';
                    lineDiv.innerHTML = `
                        <div style="font-weight: bold; color: #333; margin-bottom: 3px;">
                            ${index + 1}. ${item.input}
                        </div>
                        <div style="color: #666; font-size: 14px;">
                            ${item.numbers.map(num => parseInt(num)).join(', ')}
                        </div>
                    `;
                    previewNumbers.appendChild(lineDiv);
                });
                
                previewContainer.style.display = 'block';
            });
            
            previewCancelBtn.addEventListener('click', () => {
                previewContainer.style.display = 'none';
                parsedData = null;
            });
            
            saveBtn.addEventListener('click', async () => {
                if (!parsedData || parsedData.validLines.length === 0) {
                    showMessage('No data to save', 'error');
                    return;
                }
                
                // Save to database
                await saveCloseNumbers(parsedData.validLines);
                document.body.removeChild(modalOverlay);
            });
            
            modalOverlay.addEventListener('click', (e) => {
                if (e.target === modalOverlay) {
                    document.body.removeChild(modalOverlay);
                }
            });
        }

        // Function to parse close numbers from text
        function parseCloseNumbers(text) {
            const lines = text.split('\n');
            const validLines = [];
            const invalidLines = [];
            let totalNumbers = 0;
            
            lines.forEach((line, index) => {
                const trimmedLine = line.trim();
                if (!trimmedLine) return;
                
                const parsedNumbers = parseCloseNumberLine(trimmedLine);
                
                if (parsedNumbers && parsedNumbers.length > 0) {
                    validLines.push({
                        input: trimmedLine,
                        numbers: parsedNumbers
                    });
                    totalNumbers += parsedNumbers.length;
                } else {
                    invalidLines.push({
                        line: trimmedLine,
                        reason: 'Invalid format'
                    });
                }
            });
            
            return {
                validLines,
                invalidLines,
                totalNumbers
            };
        }

        // Function to parse a single line
        function parseCloseNumberLine(line) {
            const trimmedLine = line.trim();
            
            // 1. Special cases
            if (trimmedLine === 'အပူး') {
                return ['00', '11', '22', '33', '44', '55', '66', '77', '88', '99'];
            }
            if (trimmedLine === 'ပါဝါ') {
                return ['05', '16', '27', '38', '49', '50', '61', '72', '83', '94'];
            }
            if (trimmedLine === 'နက္ခ') {
                return ['07', '18', '24', '35', '42', '53', '69', '70', '81', '96'];
            }
            if (trimmedLine === 'ညီကို') {
                return ['01', '12', '23', '34', '45', '56', '67', '78', '89', '90'];
            }
            if (trimmedLine === 'ကိုညီ') {
                return ['09', '10', '21', '32', '43', '54', '65', '76', '87', '98'];
            }
            
            // 2. Check for reverse (r)
            if (trimmedLine.includes('r')) {
                const beforeR = trimmedLine.split('r')[0];
                const numbers = [];
                
                // Extract all numbers with various separators
                const numberStrings = beforeR.split(/[\/,\s]+/);
                
                numberStrings.forEach(str => {
                    const numStr = str.replace(/\D/g, '');
                    if (numStr.length === 1 || numStr.length === 2) {
                        const num = parseInt(numStr);
                        if (num >= 0 && num <= 99) {
                            numbers.push(num.toString().padStart(2, '0'));
                            // Add reverse
                            const tens = Math.floor(num / 10);
                            const ones = num % 10;
                            const reverseNum = ones * 10 + tens;
                            numbers.push(reverseNum.toString().padStart(2, '0'));
                        }
                    }
                });
                
                return [...new Set(numbers)]; // Remove duplicates
            }
            
            // 3. Check for brake system (ဘရိတ်)
            if (trimmedLine.includes('ဘရိတ်') || trimmedLine.includes('b') || trimmedLine.includes('B')) {
                const digitMatch = trimmedLine.match(/\d/);
                if (digitMatch) {
                    const digit = parseInt(digitMatch[0]);
                    if (digit >= 0 && digit <= 9) {
                        const brakeMap = {
                            0: ['00', '19', '28', '37', '46', '55', '64', '73', '82', '91'],
                            1: ['01', '10', '29', '38', '47', '56', '65', '74', '83', '92'],
                            2: ['02', '11', '20', '39', '48', '57', '66', '75', '84', '93'],
                            3: ['03', '12', '21', '30', '49', '58', '67', '76', '85', '94'],
                            4: ['04', '13', '22', '31', '40', '59', '68', '77', '86', '95'],
                            5: ['05', '14', '23', '32', '41', '50', '69', '78', '87', '96'],
                            6: ['06', '15', '24', '33', '42', '51', '60', '79', '88', '97'],
                            7: ['07', '16', '25', '34', '43', '52', '61', '70', '89', '98'],
                            8: ['08', '17', '26', '35', '44', '53', '62', '71', '80', '99'],
                            9: ['09', '18', '27', '36', '45', '54', '63', '72', '81', '90']
                        };
                        return brakeMap[digit] || [];
                    }
                }
            }
            
            // 4. Check for dynamic types
            const digitMatches = trimmedLine.match(/\d/g);
            if (digitMatches) {
                const digits = digitMatches.map(d => parseInt(d)).filter(d => d >= 0 && d <= 9);
                
                if (trimmedLine.includes('ထိပ်')) {
                    const numbers = [];
                    digits.forEach(digit => {
                        for (let i = 0; i <= 9; i++) {
                            numbers.push(digit.toString() + i.toString());
                        }
                    });
                    return numbers;
                }
                
                if (trimmedLine.includes('ပိတ်')) {
                    const numbers = [];
                    digits.forEach(digit => {
                        for (let i = 0; i <= 9; i++) {
                            numbers.push(i.toString() + digit.toString());
                        }
                    });
                    return numbers;
                }
                
                if (trimmedLine.includes('ပါ') || trimmedLine.includes('p') || trimmedLine.includes('P') || trimmedLine.includes('ပတ်')) {
                    const numbers = [];
                    digits.forEach(digit => {
                        for (let i = 0; i <= 9; i++) {
                            numbers.push(digit.toString() + i.toString());
                            numbers.push(i.toString() + digit.toString());
                        }
                    });
                    return [...new Set(numbers)]; // Remove duplicates
                }
            }
            
            // 5. Simple numbers with slash
            if (trimmedLine.includes('/')) {
                const numberStrings = trimmedLine.split('/');
                const numbers = [];
                
                numberStrings.forEach(str => {
                    const numStr = str.replace(/\D/g, '');
                    if (numStr.length === 1 || numStr.length === 2) {
                        const num = parseInt(numStr);
                        if (num >= 0 && num <= 99) {
                            numbers.push(num.toString().padStart(2, '0'));
                        }
                    }
                });
                
                return numbers;
            }
            
            // 6. Single number
            const singleMatch = trimmedLine.match(/\d+/);
            if (singleMatch) {
                const num = parseInt(singleMatch[0]);
                if (num >= 0 && num <= 99) {
                    return [num.toString().padStart(2, '0')];
                }
            }
            
            return null;
        }

        // Function to save close numbers
        async function saveCloseNumbers(validLines) {
            try {
                const savedEntries = [];
                
                for (const item of validLines) {
                    // Convert to numbers (remove leading zeros, convert to integers)
                    const numberArray = item.numbers.map(num => parseInt(num));
                    
                    // Save to database - cnumbers as array of numbers
                    const { error } = await supabase
                        .from('Closenum')
                        .insert([{ 
                            cnumbers: numberArray
                        }]);

                    if (error) {
                        console.error('Error saving close number:', error);
                        showMessage('Error saving: ' + item.input, 'error');
                    } else {
                        savedEntries.push(item);
                    }
                }
                
                // Show success message
                if (savedEntries.length > 0) {
                    let message = `✅ Saved ${savedEntries.length} close number(s) successfully!\n\n`;
                    savedEntries.forEach((item, index) => {
                        message += `${index + 1}. ${item.input}\n   ${item.numbers.map(num => parseInt(num)).join(', ')}\n\n`;
                    });
                    
                    showMessage(message, 'success');
                }
                
                // Refresh the list
                await loadCloseNumbers();
                
            } catch (error) {
                console.error('Error saving close numbers:', error);
                showMessage('Failed to save close numbers: ' + error.message, 'error');
            }
        }

        function showMessage(message, type = 'success') {
            const messageDiv = document.createElement('div');
            messageDiv.className = type === 'error' ? 'error-message' : 'success-message';
            messageDiv.textContent = message;
            messageDiv.style.position = 'fixed';
            messageDiv.style.top = '20px';
            messageDiv.style.left = '50%';
            messageDiv.style.transform = 'translateX(-50%)';
            messageDiv.style.zIndex = '1001';
            messageDiv.style.padding = '10px 20px';
            messageDiv.style.borderRadius = '5px';
            messageDiv.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
            messageDiv.style.backgroundColor = type === 'error' ? '#ff6b6b' : '#51cf66';
            messageDiv.style.color = 'white';
            messageDiv.style.fontWeight = '500';
            messageDiv.style.whiteSpace = 'pre-line';
            messageDiv.style.maxWidth = '90%';
            messageDiv.style.textAlign = 'center';
            
            document.body.appendChild(messageDiv);
            
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    document.body.removeChild(messageDiv);
                }
            }, 5000);
        }

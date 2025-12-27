// buykeyboard.js - Complete version for buy.html
document.addEventListener('DOMContentLoaded', function() {
    console.log('buykeyboard.js - Complete version for buy page');
    
    // DOM Elements
    const editTxt1 = document.getElementById('editTxt1');
    const editTxt2 = document.getElementById('editTxt2');
    const editTxt3 = document.getElementById('editTxt3');
    const textView = document.getElementById('textViewDisplay');
    const buttonsScrollContainer = document.getElementById('buttonsScrollContainer');
    const numButtons = document.querySelectorAll('.num-btn');
    const okButton = document.querySelector('.action-special-btn');
    const additionalButtons = document.querySelectorAll('.additional-btn');
    const inputRowDisplay = document.getElementById('inputRowDisplay');
    
    // State variables
    let reverseMode = false;
    let isSpecialMode = false;
    let specialType = '';
    let isComboMode = false;
    let comboType = '';
    
    // Special cases definitions
    const specialCases = {
        'အပူး': [0, 11, 22, 33, 44, 55, 66, 77, 88, 99],
        'ပါဝါ': [5, 16, 27, 38, 49, 50, 61, 72, 83, 94],
        'နက္ခ': [7, 18, 24, 35, 42, 53, 69, 70, 81, 96],
        'ညီကို': [1, 12, 23, 34, 45, 56, 67, 78, 89, 90],
        'ကိုညီ': [9, 10, 21, 32, 43, 54, 65, 76, 87, 98],
        'ညီကိုR': [1, 12, 23, 34, 45, 56, 67, 78, 89, 90, 9, 10, 21, 32, 43, 54, 65, 76, 87, 98],
        'စုံစုံ': [0, 2, 4, 6, 8, 20, 22, 24, 26, 28, 40, 42, 44, 46, 48, 60, 62, 64, 66, 68, 80, 82, 84, 86, 88],
        'မမ': [11, 13, 15, 17, 19, 31, 33, 35, 37, 39, 51, 53, 55, 57, 59, 71, 73, 75, 77, 79, 91, 93, 95, 97, 99],
        'စုံမ': [1, 3, 5, 7, 9, 21, 23, 25, 27, 29, 41, 43, 45, 47, 49, 61, 63, 65, 67, 69, 81, 83, 85, 87, 89],
        'မစုံ': [10, 12, 14, 16, 18, 30, 32, 34, 36, 38, 50, 52, 54, 56, 58, 70, 72, 74, 76, 78, 90, 92, 94, 96, 98],
        'စုံပူး': [0, 22, 44, 66, 88],
        'မပူး': [11, 33, 55, 77, 99]
    };
    
    // Initialize
    resetFields();
    setupEventListeners();
    
    function resetFields() {
        editTxt1.textContent = 'ဂဏန်း';
        editTxt2.textContent = 'ယူနစ်';
        editTxt3.style.display = 'none';
        editTxt3.textContent = '';
        textView.textContent = '';
        reverseMode = false;
        isSpecialMode = false;
        specialType = '';
        isComboMode = false;
        comboType = '';
        highlightField(editTxt1);
        
        setTimeout(() => {
            if (buttonsScrollContainer) {
                buttonsScrollContainer.scrollTop = 0;
            }
        }, 10);
    }
    
    function removeHighlights() {
        editTxt1.style.borderColor = '#ddd';
        editTxt1.style.backgroundColor = '#f8f9fa';
        editTxt2.style.borderColor = '#ddd';
        editTxt2.style.backgroundColor = '#f8f9fa';
        editTxt3.style.borderColor = '#ddd';
        editTxt3.style.backgroundColor = '#f8f9fa';
        if (textView) {
            textView.style.borderColor = '#ddd';
            textView.style.backgroundColor = '#f8f9fa';
        }
    }
    
    function highlightField(field) {
        removeHighlights();
        field.style.borderColor = '#3498db';
        field.style.backgroundColor = '#e3f2fd';
        
        if (field === editTxt2 || field === editTxt3 || field === textView) {
            setTimeout(() => {
                if (buttonsScrollContainer) {
                    buttonsScrollContainer.scrollTop = 0;
                }
            }, 10);
        }
    }
    
    function setupEventListeners() {
        // Number buttons (0-9, 00)
        numButtons.forEach(button => {
            const text = button.textContent;
            
            if (text !== 'R' && text !== 'အပါ' && text !== 'OK' && text !== 'DEL') {
                button.addEventListener('click', function() {
                    addDigitToField(text);
                });
            }
        });
        
        // R button
        const rButton = document.querySelector('.num-btn.special-btn');
        if (rButton && rButton.textContent === 'R') {
            rButton.addEventListener('click', function() {
                // Check if R button should be allowed
                if (isSpecialMode) {
                    // Allow R only for ထိပ် and ပိတ်
                    if (specialType !== 'ထိပ်' && specialType !== 'ပိတ်') {
                        alert('R နှိပ်လို့မရပါ');
                        return;
                    }
                }
                
                if (editTxt1.textContent === 'ဂဏန်း' || editTxt1.textContent === '') {
                    alert('ဂဏန်းထည့်ပါ');
                    highlightField(editTxt1);
                    return;
                }
                
                if (editTxt2.textContent === 'ယူနစ်' || editTxt2.textContent === '') {
                    alert('ငွေပမာဏထည့်ပါ');
                    highlightField(editTxt2);
                    return;
                }
                
                reverseMode = true;
                if (textView) {
                    textView.textContent = textView.textContent + ' R';
                }
                editTxt3.style.display = 'block';
                editTxt3.textContent = '';
                
                highlightField(editTxt3);
                
                setTimeout(() => {
                    if (buttonsScrollContainer) {
                        buttonsScrollContainer.scrollTop = 0;
                    }
                }, 10);
            });
        }
        
        // အပါ button
        const apalButton = Array.from(numButtons).find(btn => btn.textContent === 'အပါ');
        if (apalButton) {
            apalButton.addEventListener('click', function() {
                isSpecialMode = true;
                isComboMode = false;
                reverseMode = false;
                specialType = 'အပါ';
                comboType = '';
                
                if (textView) {
                    textView.textContent = 'အပါ';
                }
                editTxt1.textContent = '';
                editTxt3.style.display = 'none';
                highlightField(editTxt1);
                
                setTimeout(() => {
                    if (buttonsScrollContainer) {
                        buttonsScrollContainer.scrollTop = 0;
                    }
                }, 10);
            });
        }
        
        // DELETE button
        const delButton = Array.from(numButtons).find(btn => btn.textContent === 'DEL');
        if (delButton) {
            delButton.addEventListener('click', function() {
                handleDelete();
            });
        }
        
        // Additional buttons (ထိပ်, ပိတ်, အပူး, etc.)
        additionalButtons.forEach(button => {
            button.addEventListener('click', function() {
                handleAdditionalButton(this.textContent);
            });
        });
        
        // OK button
        if (okButton) {
            okButton.addEventListener('click', function() {
                processOKButton();
            });
        }
        
        // Field click handlers
        editTxt1.addEventListener('click', () => highlightField(editTxt1));
        editTxt2.addEventListener('click', () => highlightField(editTxt2));
        editTxt3.addEventListener('click', () => highlightField(editTxt3));
        if (textView) {
            textView.addEventListener('click', () => highlightField(textView));
        }
    }
    
    function handleDelete() {
        let currentField;
        
        if (editTxt1.style.borderColor === 'rgb(52, 152, 219)') {
            currentField = editTxt1;
        } else if (editTxt2.style.borderColor === 'rgb(52, 152, 219)') {
            currentField = editTxt2;
        } else if (editTxt3.style.borderColor === 'rgb(52, 152, 219)') {
            currentField = editTxt3;
        } else if (textView && textView.style.borderColor === 'rgb(52, 152, 219)') {
            currentField = textView;
        } else {
            currentField = editTxt1;
        }
        
        if (currentField === editTxt1 && editTxt1.textContent !== 'ဂဏန်း' && editTxt1.textContent.length > 0) {
            editTxt1.textContent = editTxt1.textContent.slice(0, -1);
            if (editTxt1.textContent === '') {
                editTxt1.textContent = 'ဂဏန်း';
            }
        } 
        else if (currentField === editTxt2 && editTxt2.textContent !== 'ယူနစ်' && editTxt2.textContent.length > 0) {
            editTxt2.textContent = editTxt2.textContent.slice(0, -1);
            if (editTxt2.textContent === '') {
                editTxt2.textContent = 'ယူနစ်';
            }
        }
        else if (currentField === editTxt3 && editTxt3.textContent.length > 0) {
            editTxt3.textContent = editTxt3.textContent.slice(0, -1);
        }
        else if (currentField === textView && textView.textContent.length > 0) {
            textView.textContent = '';
            reverseMode = false;
            isSpecialMode = false;
            isComboMode = false;
            specialType = '';
            comboType = '';
        }
    }
    
    function handleAdditionalButton(buttonText) {
        reverseMode = false;
        isSpecialMode = true;
        isComboMode = false;
        specialType = buttonText;
        comboType = '';
        editTxt3.style.display = 'none';
        
        editTxt1.textContent = '';
        editTxt2.textContent = 'ယူနစ်';
        editTxt3.textContent = '';
        
        // Combo modes
        if (buttonText === 'အခွေ' || buttonText === 'ခွေပူး') {
            isComboMode = true;
            comboType = buttonText;
            isSpecialMode = false;
            if (textView) {
                textView.textContent = buttonText;
            }
            highlightField(editTxt1);
        }
        // Special modes that need 1 digit
        else if (buttonText === 'အပါ' || buttonText === 'ထိပ်' || buttonText === 'ပိတ်' || 
                 buttonText === 'ဘရိတ်' || buttonText === 'စုံကပ်' || buttonText === 'မကပ်' || 
                 buttonText === 'စုံကပ်R' || buttonText === 'မကပ်R' || buttonText === 'ကပ်') {
            if (textView) {
                textView.textContent = buttonText;
            }
            highlightField(editTxt1);
        }
        // Special modes that don't need digit
        else if (buttonText === 'အပူး' || buttonText === 'ညီကို' || buttonText === 'ကိုညီ' || 
                 buttonText === 'ညီကိုR' || buttonText === 'ပါဝါ' || buttonText === 'နက္ခ' ||
                 buttonText === 'စုံစုံ' || buttonText === 'မမ' || buttonText === 'စုံမ' || 
                 buttonText === 'မစုံ' || buttonText === 'စုံပူး' || buttonText === 'မပူး') {
            if (textView) {
                textView.textContent = buttonText;
            }
            highlightField(editTxt2);
        }
        // K button
        else if (buttonText === 'K') {
            if (textView) {
                textView.textContent = 'K';
            }
            highlightField(editTxt1);
        }
        
        setTimeout(() => {
            if (buttonsScrollContainer) {
                buttonsScrollContainer.scrollTop = 0;
            }
        }, 10);
    }
    
    function addDigitToField(digit) {
        let currentField;
        
        if (editTxt1.style.borderColor === 'rgb(52, 152, 219)') {
            currentField = editTxt1;
        } else if (editTxt2.style.borderColor === 'rgb(52, 152, 219)') {
            currentField = editTxt2;
        } else if (editTxt3.style.borderColor === 'rgb(52, 152, 219)') {
            currentField = editTxt3;
        } else if (textView && textView.style.borderColor === 'rgb(52, 152, 219)') {
            currentField = textView;
        } else {
            currentField = editTxt1;
        }
        
        if (currentField === editTxt1 && editTxt1.textContent === 'ဂဏန်း') {
            editTxt1.textContent = '';
        } else if (currentField === editTxt2 && editTxt2.textContent === 'ယူနစ်') {
            editTxt2.textContent = '';
        } else if (currentField === editTxt3 && editTxt3.textContent === '') {
            editTxt3.textContent = '';
        }
        
        if (currentField === editTxt1) {
            let maxLength = 2;
            
            if (isComboMode && (comboType === 'အခွေ' || comboType === 'ခွေပူး')) {
                maxLength = 10;
            } else if (isSpecialMode && (specialType === 'အပါ' || specialType === 'ထိပ်' || 
                       specialType === 'ပိတ်' || specialType === 'ဘရိတ်' || 
                       specialType === 'စုံကပ်' || specialType === 'မကပ်' || 
                       specialType === 'စုံကပ်R' || specialType === 'မကပ်R' || specialType === 'ကပ်')) {
                maxLength = 1;
            }
            
            if (editTxt1.textContent.length < maxLength) {
                editTxt1.textContent += digit;
            }
            
            // Auto move to amount field
            if (isSpecialMode && (specialType === 'အပါ' || specialType === 'ထိပ်' || 
                specialType === 'ပိတ်' || specialType === 'ဘရိတ်' || 
                specialType === 'စုံကပ်' || specialType === 'မကပ်' || 
                specialType === 'စုံကပ်R' || specialType === 'မကပ်R' || specialType === 'ကပ်')) {
                if (editTxt1.textContent.length >= 1) {
                    highlightField(editTxt2);
                    setTimeout(() => {
                        if (buttonsScrollContainer) {
                            buttonsScrollContainer.scrollTop = 0;
                        }
                    }, 10);
                }
            }
            else if (isComboMode && (comboType === 'အခွေ' || comboType === 'ခွေပူး')) {
                // Do NOT auto move for combo modes
            }
            else if (!isSpecialMode && !isComboMode && editTxt1.textContent.length >= 2) {
                highlightField(editTxt2);
                setTimeout(() => {
                    if (buttonsScrollContainer) {
                        buttonsScrollContainer.scrollTop = 0;
                    }
                }, 10);
            }
        } 
        else if (currentField === editTxt2 && editTxt2.textContent.length < 7) {
            editTxt2.textContent += digit;
        }
        else if (currentField === editTxt3 && editTxt3.textContent.length < 7) {
            editTxt3.textContent += digit;
        }
        else if (currentField === textView) {
            return;
        }
    }
    
    function processOKButton() {
        // Combo modes (အခွေ, ခွေပူး)
        if (isComboMode) {
            processComboMode();
            return;
        }
        
        // Special modes that don't need digit
        if (isSpecialMode && specialCases[specialType]) {
            processSpecialModeNoDigit();
            return;
        }
        
        // Special modes that need 1 digit - including ထိပ် and ပိတ်
        if (isSpecialMode && (specialType === 'အပါ' || specialType === 'ထိပ်' || 
            specialType === 'ပိတ်' || specialType === 'ဘရိတ်' || 
            specialType === 'စုံကပ်' || specialType === 'မကပ်' || 
            specialType === 'စုံကပ်R' || specialType === 'မကပ်R' || specialType === 'ကပ်')) {
            processSpecialModeWithDigit();
            return;
        }
        
        // Regular bet with/without reverse
        processRegularBet();
    }
    
    function processComboMode() {
        const digitsStr = editTxt1.textContent;
        if (digitsStr === 'ဂဏန်း' || digitsStr === '' || digitsStr.length < 2) {
            alert('ဂဏန်းနှစ်လုံး (သို့) အထက်ထည့်ပါ');
            highlightField(editTxt1);
            return;
        }
        
        const amountText = editTxt2.textContent;
        if (amountText === 'ယူနစ်' || amountText === '') {
            alert('ငွေပမာဏထည့်ပါ');
            highlightField(editTxt2);
            return;
        }
        
        const amount = parseInt(amountText.replace(/[^0-9]/g, ''));
        if (isNaN(amount) || amount < 100) {
            alert('ငွေပမာဏမှားယွင်းနေပါသည် (အနည်းဆုံး 100)');
            highlightField(editTxt2);
            return;
        }
        
        let numbers;
        if (comboType === 'အခွေ') {
            numbers = generateAhkwayNumbers(digitsStr);
        } else if (comboType === 'ခွေပူး') {
            numbers = generateKhwayPhuNumbers(digitsStr);
        }
        
        if (numbers && numbers.length > 0) {
            addBetsToBuyPage(numbers, amount, comboType);
            resetFields();
        }
    }
    
    function processSpecialModeNoDigit() {
        const amountText = editTxt2.textContent;
        if (amountText === 'ယူနစ်' || amountText === '') {
            alert('ငွေပမာဏထည့်ပါ');
            highlightField(editTxt2);
            return;
        }
        
        const amount = parseInt(amountText.replace(/[^0-9]/g, ''));
        if (isNaN(amount) || amount < 100) {
            alert('ငွေပမာဏမှားယွင်းနေပါသည် (အနည်းဆုံး 100)');
            highlightField(editTxt2);
            return;
        }
        
        const numbers = specialCases[specialType];
        addBetsToBuyPage(numbers, amount, specialType);
        resetFields();
    }
    
    function processSpecialModeWithDigit() {
        const digitStr = editTxt1.textContent;
        if (digitStr === 'ဂဏန်း' || digitStr === '') {
            alert('ဂဏန်းထည့်ပါ');
            highlightField(editTxt1);
            return;
        }
        
        const digit = parseInt(digitStr);
        if (isNaN(digit) || digit < 0 || digit > 9) {
            alert('ဂဏန်းမှားယွင်းနေပါသည် (0-9)');
            highlightField(editTxt1);
            return;
        }
        
        const amountText = editTxt2.textContent;
        if (amountText === 'ယူနစ်' || amountText === '') {
            alert('ငွေပမာဏထည့်ပါ');
            highlightField(editTxt2);
            return;
        }
        
        const amount = parseInt(amountText.replace(/[^0-9]/g, ''));
        if (isNaN(amount) || amount < 100) {
            alert('ငွေပမာဏမှားယွင်းနေပါသည် (အနည်းဆုံး 100)');
            highlightField(editTxt2);
            return;
        }
        
        let reverseAmount = amount;
        if (reverseMode) {
            const reverseAmountText = editTxt3.textContent;
            if (reverseAmountText !== '') {
                reverseAmount = parseInt(reverseAmountText.replace(/[^0-9]/g, ''));
                if (isNaN(reverseAmount) || reverseAmount < 100) {
                    alert('အာယူနစ်မှားယွင်းနေပါသည် (အနည်းဆုံး 100)');
                    highlightField(editTxt3);
                    return;
                }
            }
        }
        
        let numbers = [];
        if (specialType === 'အပါ') {
            numbers = generateApalNumbers(digit);
        } else if (specialType === 'ထိပ်') {
            if (!reverseMode) {
                numbers = generateFrontNumbers(digit);
            } else {
                // For ထိပ် with R - main bet is front, reverse is back
                const frontNumbers = generateFrontNumbers(digit);
                const backNumbers = generateBackNumbers(digit);
                
                // Add main bets (front numbers)
                addBetsToBuyPage(frontNumbers, amount, 'ထိပ်');
                
                // Add reverse bets (back numbers)
                addBetsToBuyPage(backNumbers, reverseAmount, 'ပိတ်');
                
                resetFields();
                return;
            }
        } else if (specialType === 'ပိတ်') {
            if (!reverseMode) {
                numbers = generateBackNumbers(digit);
            } else {
                // For ပိတ် with R - main bet is back, reverse is front
                const backNumbers = generateBackNumbers(digit);
                const frontNumbers = generateFrontNumbers(digit);
                
                // Add main bets (back numbers)
                addBetsToBuyPage(backNumbers, amount, 'ပိတ်');
                
                // Add reverse bets (front numbers)
                addBetsToBuyPage(frontNumbers, reverseAmount, 'ထိပ်');
                
                resetFields();
                return;
            }
        } else if (specialType === 'ဘရိတ်') {
            numbers = generateBreakNumbers(digit);
        } else if (specialType === 'စုံကပ်') {
            numbers = generateEvenKhatNumbers(digit);
        } else if (specialType === 'မကပ်') {
            numbers = generateOddKhatNumbers(digit);
        } else if (specialType === 'စုံကပ်R') {
            numbers = generateEvenKhatRNumbers(digit);
        } else if (specialType === 'မကပ်R') {
            numbers = generateOddKhatRNumbers(digit);
        } else if (specialType === 'ကပ်') {
            numbers = generateKhatNumbers(digit);
        }
        
        if (!reverseMode) {
            if (numbers.length > 0) {
                addBetsToBuyPage(numbers, amount, specialType);
                resetFields();
            }
        } else {
            addBetsToBuyPage(numbers, amount, specialType + ' (Main)');
            
            let reverseNumbers = [];
            if (specialType === 'အပါ') {
                reverseNumbers = numbers;
            } else if (specialType === 'ဘရိတ်') {
                reverseNumbers = numbers;
            }
            
            if (reverseNumbers.length > 0) {
                addBetsToBuyPage(reverseNumbers, reverseAmount, specialType + ' (R)');
            }
            
            resetFields();
        }
    }
    
    function processRegularBet() {
        const numberText = editTxt1.textContent;
        if (numberText === 'ဂဏန်း' || numberText === '') {
            alert('ဂဏန်းထည့်ပါ');
            highlightField(editTxt1);
            return;
        }
        
        const amountText = editTxt2.textContent;
        if (amountText === 'ယူနစ်' || amountText === '') {
            alert('ငွေပမာဏထည့်ပါ');
            highlightField(editTxt2);
            return;
        }
        
        const amount = parseInt(amountText.replace(/[^0-9]/g, ''));
        if (isNaN(amount) || amount < 100) {
            alert('ငွေပမာဏမှားယွင်းနေပါသည် (အနည်းဆုံး 100)');
            highlightField(editTxt2);
            return;
        }
        
        let reverseAmount = amount;
        if (reverseMode) {
            const reverseAmountText = editTxt3.textContent;
            if (reverseAmountText !== '') {
                reverseAmount = parseInt(reverseAmountText.replace(/[^0-9]/g, ''));
                if (isNaN(reverseAmount) || reverseAmount < 100) {
                    alert('အာယူနစ်မှားယွင်းနေပါသည် (အနည်းဆုံး 100)');
                    highlightField(editTxt3);
                    return;
                }
            }
        }
        
        const numbers = parseNumberInput(numberText);
        if (numbers.length === 0) {
            alert('ဂဏန်းမှားယွင်းနေပါသည်');
            highlightField(editTxt1);
            return;
        }
        
        if (!reverseMode) {
            addBetsToBuyPage(numbers, amount, 'Regular');
        } else {
            // Add main bets
            addBetsToBuyPage(numbers, amount, 'Main');
            
            // Add reverse bets
            numbers.forEach(num => {
                const revNum = reverseNumber(num);
                if (revNum !== num) {
                    addSingleBetToBuyPage(revNum, reverseAmount, 'Reverse');
                }
            });
        }
        
        resetFields();
    }
    
    // Helper functions
    function addBetsToBuyPage(numbers, amount, betType) {
        numbers.forEach(num => {
            addSingleBetToBuyPage(num, amount, betType);
        });
    }
    
    function addSingleBetToBuyPage(num, amount, betType) {
        // Check if buy.js functions are available
        if (!window.updateLedgerDataForBuyPage) {
            console.error('buy.js functions not available');
            alert('Error: buy.js not loaded properly');
            return;
        }
        
        // Call buy.js function to update ledgerData
        const formattedNum = formatNumberForBuyPage(num);
        
        // Update ledgerData in buy.js
        window.updateLedgerDataForBuyPage([formattedNum], amount);
        
        // Add to manualBets in buy.js
        if (window.addToManualBetsForBuyPage) {
            window.addToManualBetsForBuyPage(formattedNum, amount, betType);
        }
        
        // Recalculate over bets if inputAmount is set
        if (window.recalculateOverBetsForBuyPage) {
            window.recalculateOverBetsForBuyPage();
        }
        
        // Update displays
        if (window.updateAllDisplaysForBuyPage) {
            window.updateAllDisplaysForBuyPage();
        }
    }
    
    function parseNumberInput(input) {
        const numbers = [];
        const cleanInput = input.replace(/[^0-9\/\-]/g, '');
        
        if (cleanInput.includes('/') || cleanInput.includes('-')) {
            const parts = cleanInput.split(/[\/\-]/);
            parts.forEach(part => {
                if (part.length === 1 || part.length === 2) {
                    const num = parseInt(part);
                    if (!isNaN(num) && num >= 0 && num <= 99) {
                        numbers.push(num);
                    }
                }
            });
        } else {
            if (input.length === 1 || input.length === 2) {
                const num = parseInt(input);
                if (!isNaN(num) && num >= 0 && num <= 99) {
                    numbers.push(num);
                }
            }
        }
        
        return numbers;
    }
    
    // Number generation functions
    function generateFrontNumbers(digit) {
        const numbers = [];
        for (let i = 0; i <= 9; i++) {
            numbers.push(parseInt(digit.toString() + i.toString()));
        }
        return numbers;
    }
    
    function generateBackNumbers(digit) {
        const numbers = [];
        for (let i = 0; i <= 9; i++) {
            numbers.push(parseInt(i.toString() + digit.toString()));
        }
        return numbers;
    }
    
    function generateBreakNumbers(digit) {
        const numbers = [];
        for (let n = 0; n <= 99; n++) {
            const tens = Math.floor(n / 10);
            const units = n % 10;
            const sum = tens + units;
            if (sum % 10 === digit) {
                numbers.push(n);
            }
        }
        return numbers;
    }
    
    function generateApalNumbers(digit) {
        const numbers = [];
        const digitStr = digit.toString();
        for (let n = 0; n <= 99; n++) {
            const numStr = n.toString().padStart(2, '0');
            if (numStr.includes(digitStr)) {
                numbers.push(n);
            }
        }
        return numbers;
    }
    
    function generateEvenKhatNumbers(digit) {
        const numbers = [];
        const evenDigits = [0, 2, 4, 6, 8];
        for (const evenDigit of evenDigits) {
            numbers.push(parseInt(digit.toString() + evenDigit.toString()));
        }
        return numbers;
    }
    
    function generateOddKhatNumbers(digit) {
        const numbers = [];
        const oddDigits = [1, 3, 5, 7, 9];
        for (const oddDigit of oddDigits) {
            numbers.push(parseInt(digit.toString() + oddDigit.toString()));
        }
        return numbers;
    }
    
    function generateEvenKhatRNumbers(digit) {
        const numbers = [];
        const evenDigits = [0, 2, 4, 6, 8];
        for (const evenDigit of evenDigits) {
            numbers.push(parseInt(digit.toString() + evenDigit.toString()));
            numbers.push(parseInt(evenDigit.toString() + digit.toString()));
        }
        return [...new Set(numbers)];
    }
    
    function generateOddKhatRNumbers(digit) {
        const numbers = [];
        const oddDigits = [1, 3, 5, 7, 9];
        for (const oddDigit of oddDigits) {
            numbers.push(parseInt(digit.toString() + oddDigit.toString()));
            numbers.push(parseInt(oddDigit.toString() + digit.toString()));
        }
        return [...new Set(numbers)];
    }
    
    function generateKhatNumbers(digit) {
        const numbers = [];
        for (let i = 0; i <= 9; i++) {
            numbers.push(parseInt(digit.toString() + i.toString()));
            numbers.push(parseInt(i.toString() + digit.toString()));
        }
        return [...new Set(numbers)];
    }
    
    function generateCombinationsFromArray(arr, k) {
        const combinations = [];
        
        function combine(start, current) {
            if (current.length === k) {
                combinations.push([...current]);
                return;
            }
            
            for (let i = start; i < arr.length; i++) {
                current.push(arr[i]);
                combine(i + 1, current);
                current.pop();
            }
        }
        
        combine(0, []);
        return combinations;
    }
    
    function generateAhkwayNumbers(digitsStr) {
        const numbers = new Set();
        const digits = digitsStr.split('');
        
        const combos = generateCombinationsFromArray(digits, 2);
        
        combos.forEach(combo => {
            const num1 = parseInt(combo[0] + combo[1]);
            const num2 = parseInt(combo[1] + combo[0]);
            numbers.add(num1);
            numbers.add(num2);
        });
        
        return Array.from(numbers);
    }
    
    function generateKhwayPhuNumbers(digitsStr) {
        const numbers = new Set();
        const digits = digitsStr.split('');
        
        const combos = generateCombinationsFromArray(digits, 2);
        
        combos.forEach(combo => {
            const num1 = parseInt(combo[0] + combo[1]);
            const num2 = parseInt(combo[1] + combo[0]);
            numbers.add(num1);
            numbers.add(num2);
        });
        
        const uniqueDigits = [...new Set(digits)];
        uniqueDigits.forEach(digit => {
            const doubleNum = parseInt(digit + digit);
            numbers.add(doubleNum);
        });
        
        return Array.from(numbers);
    }
    
    function reverseNumber(n) {
        const s = n.toString().padStart(2, '0');
        return parseInt(s.split('').reverse().join(''));
    }
    
    function formatNumberForBuyPage(num) {
        const numStr = num.toString();
        return numStr.length === 1 ? '0' + numStr : numStr;
    }
    
    console.log('buykeyboard.js - Complete version loaded successfully');
});

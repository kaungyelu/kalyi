
// Function to show message
function showMessage(message, type = 'info') {
    console.log(`${type}: ${message}`);
    
    // Create a temporary message display
    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        padding: 10px 20px;
        border-radius: 5px;
        background: ${type === 'error' ? '#e74c3c' : type === 'success' ? '#2ecc71' : '#3498db'};
        color: white;
        z-index: 1000;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        font-family: 'Pyidaungsu', sans-serif;
    `;
    messageDiv.textContent = message;
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        if (messageDiv.parentNode) {
            document.body.removeChild(messageDiv);
        }
    }, 3000);
}

// Function to get the current key from active time display
function getCurrentKey() {
    const activeTimeDisplay = document.getElementById('activeTimeDisplay');
    if (activeTimeDisplay) {
        const key = activeTimeDisplay.textContent.trim();
        // Check if it's not "Loading..." or empty
        if (key && key !== 'Loading...' && key !== 'No Active Time Selected') {
            return key;
        }
    }
    return null;
}

// Function to navigate to slipview.html with current key
function navigateToSlipView() {
    const currentKey = getCurrentKey();
    
    if (!currentKey) {
        showMessage('အချိန်မရွေးထားပါ', 'error');
        return;
    }
    
    // Check if currentKey contains both date and time
    const parts = currentKey.split(' ');
    if (parts.length >= 2) {
        // Format: "date time" or "date time extra"
        const date = parts[0];
        const time = parts[1];
        
        // Navigate to slipview.html with parameters
        window.location.href = `slipview.html?date=${encodeURIComponent(date)}&time=${encodeURIComponent(time)}`;
    } else {
        // Use the entire string as key
        window.location.href = `slipview.html?key=${encodeURIComponent(currentKey)}`;
    }
}

// Function to update the header to be clickable
function makeHeaderClickable() {
    const header = document.querySelector('header h1');
    if (!header) return;
    
    // Store original text
    const originalText = header.textContent;
    
    // Change cursor to pointer to indicate it's clickable
    header.style.cursor = 'pointer';
    header.style.color = '#3498db';
    header.style.transition = 'color 0.3s';
    
    // Add hover effect
    header.addEventListener('mouseenter', function() {
        this.style.color = '#2980b9';
        this.style.textDecoration = 'underline';
    });
    
    header.addEventListener('mouseleave', function() {
        this.style.color = '#3498db';
        this.style.textDecoration = 'none';
    });
    
    // Add click event
    header.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        navigateToSlipView();
    });
    
    // Add tooltip
    header.title = "Slip View စာမျက်နှာသို့ သွားရန် နှိပ်ပါ";
    
}

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Make the header clickable
    setTimeout(() => {
        makeHeaderClickable();
    }, 1000); // Delay to ensure DOM is ready
    
    // Also check if active time display is loaded
    const checkTimeInterval = setInterval(() => {
        const currentKey = getCurrentKey();
        if (currentKey) {
            // Enable header clickability if we have a valid key
            makeHeaderClickable();
            clearInterval(checkTimeInterval);
        }
    }, 500);
});

// Add keyboard shortcut for navigation (optional)
document.addEventListener('keydown', function(e) {
    // Ctrl + S or Cmd + S for slipview
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        navigateToSlipView();
    }
    
    // F2 for slipview
    if (e.key === 'F2') {
        e.preventDefault();
        navigateToSlipView();
    }
});

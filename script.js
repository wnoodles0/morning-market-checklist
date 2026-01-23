const ITEM_LIST = [
    "ไก่สด", "เล็บมือนาง", "ตีนไก่", "ปลาดุก", "กุ้งสด", "หมึกสด", "ปูม้า", "ปูดำ", "หอยเชอรี่", "สีผสมอาหาร",
    "ถั่วลิสง", "กุ้งแห้ง", "กระเทียมเล็ก", "กระเทียมใหญ่", "กล่องใส่ไก่", "น้ำมะนาว", "น้ำกระเทียมดอง", "น้ำมันหอย",
    "น้ำมันพืช", "ซอสพริก", "ซอสฝาเขียว", "เกลือ", "พริกไทยดำ", "หอยดอง", "กะปิแท้", "น้ำตามะพร้าว", "น้ำตาลปี๊บ",
    "ถุงหิ้ว 9*18", "ถุงหิ้ว 7*15", "ถุงร้อน 7*11", "ถุงหิ้ว 12*20", "ถุงร้อน 14*12", "ถุงร้อน 3*5", "ถุงร้อน 4/5*7",
    "พริกแห้ง", "หอมแขก", "ไม้เสียบปลาดุก", "ถ้วยโฟม", "ช้อนส้อมพลาสติก", "เส้นเล็ก", "หมูทำต้ม", "กระดูกอ่อน",
    "หมูสับ", "คอแท้หมู", "เนื้อทำต้ม", "เนื้อทำก้อย", "ดีวัว", "หมูยอ", "ไข่เค็ม", "ขนมจีน", "พริกสด", "ผักกะหล่ำ",
    "มะเขือเปราะ", "ถั่วฝักยาว", "แตงกวา", "หน่อไม้ใส่ตำป่า", "ข่า", "ตะไคร้", "ใบมะกรูด", "ต้นหอม", "ผักชี",
    "ผักชีใบเลื่อย", "ผักชีลาว", "โหระพา", "ข้าวโพด", "มะละกอ", "มะนาว", "มะเขือเทศ", "มะม่วง", "ผักบุ้ง", "ใบเตย",
    "น้ำตาลทราย", "น้ำปลา", "ผงชูรส", "รสดี", "คนอร์"
];

const STORAGE_KEY = 'checklistState';
const QUANTITY_KEY = 'quantityNotes';
const DATE_KEY = 'lastResetDate';
const CHECKLIST_UL = document.getElementById('checklist');
const SEARCH_INPUT = document.getElementById('search-input');
const MARK_ALL_BTN = document.getElementById('mark-all-btn');
const RESET_ALL_BTN = document.getElementById('reset-all-btn');
const COPY_BTN = document.getElementById('copy-btn');
const PROGRESS_TEXT = document.getElementById('progress-text');
const TOAST = document.getElementById('toast');

let checklistItems = []; // Array to hold all list item elements

/**
 * Helper function to get today's date string (YYYY-MM-DD)
 * @param {Date} date - The date object
 * @returns {string} The date string
 */
function getTodayDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Checks if a daily reset is needed (after 04:00 AM)
 * @returns {boolean} True if reset is needed, false otherwise
 */
function checkDailyReset() {
    const now = new Date();
    const todayDate = getTodayDateString(now);
    const storedDate = localStorage.getItem(DATE_KEY);

    // Check if the current time is past 04:00 AM
    const isPastResetTime = now.getHours() >= 4;

    // If no stored date, it's the first run, no reset needed, just save today's date
    if (!storedDate) {
        localStorage.setItem(DATE_KEY, todayDate);
        return false;
    }

    // Reset condition:
    // 1. It's past 04:00 AM AND
    // 2. The stored date is NOT today's date
    if (isPastResetTime && storedDate !== todayDate) {
        // It's a new day (after 04:00 AM), so reset
        localStorage.setItem(DATE_KEY, todayDate);
        return true;
    }

    // If it's before 04:00 AM, the stored date might be yesterday's, but we don't reset yet.
    // If it's past 04:00 AM and the stored date IS today's date, no reset needed.
    return false;
}

/**
 * Loads the checked state from localStorage.
 * @returns {Object} An object mapping item name to its checked state (boolean).
 */
function loadState() {
    if (checkDailyReset()) {
        // Daily reset occurred, return an empty state (all unchecked)
        // Note: quantity/notes are NOT cleared
        return {};
    }
    
    const savedState = localStorage.getItem(STORAGE_KEY);
    return savedState ? JSON.parse(savedState) : {};
}

/**
 * Loads the quantity/notes from localStorage.
 * @returns {Object} An object mapping item name to its quantity/notes text.
 */
function loadQuantityNotes() {
    const savedQuantity = localStorage.getItem(QUANTITY_KEY);
    return savedQuantity ? JSON.parse(savedQuantity) : {};
}

/**
 * Saves the current checked state to localStorage.
 */
function saveState() {
    const currentState = {};
    checklistItems.forEach(li => {
        const checkbox = li.querySelector('input[type="checkbox"]');
        const itemName = checkbox.dataset.itemName;
        currentState[itemName] = checkbox.checked;
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentState));
    updateProgress();
}

/**
 * Saves the quantity/notes to localStorage.
 */
function saveQuantityNotes() {
    const currentQuantity = {};
    checklistItems.forEach(li => {
        const checkbox = li.querySelector('input[type="checkbox"]');
        const itemName = checkbox.dataset.itemName;
        const quantityInput = li.querySelector('.quantity-input');
        if (quantityInput && quantityInput.value) {
            currentQuantity[itemName] = quantityInput.value;
        }
    });
    localStorage.setItem(QUANTITY_KEY, JSON.stringify(currentQuantity));
}

/**
 * Updates the progress indicator text.
 */
function updateProgress() {
    const total = ITEM_LIST.length;
    const checkedCount = checklistItems.filter(li => li.querySelector('input[type="checkbox"]').checked).length;
    PROGRESS_TEXT.textContent = `${checkedCount}/${total}`;
}

/**
 * Renders the checklist items to the DOM.
 */
function renderChecklist() {
    const savedState = loadState();
    const quantityNotes = loadQuantityNotes();
    CHECKLIST_UL.innerHTML = ''; // Clear existing list
    checklistItems = []; // Reset the array

    ITEM_LIST.forEach((item, index) => {
        const li = document.createElement('li');
        li.className = 'checklist-item';
        li.dataset.index = index; // Store original index for filtering

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `item-${index}`;
        checkbox.dataset.itemName = item; // Use item name as key for persistence
        
        // Apply saved state
        if (savedState[item] === true) {
            checkbox.checked = true;
        }

        const label = document.createElement('label');
        label.className = 'checklist-item-label';
        label.htmlFor = `item-${index}`;
        label.textContent = item;

        // Create quantity/notes input
        const quantityInput = document.createElement('input');
        quantityInput.type = 'text';
        quantityInput.className = 'quantity-input';
        quantityInput.placeholder = 'จำนวน / หมายเหตุ';
        quantityInput.dataset.itemName = item;
        
        // Apply saved quantity/notes
        if (quantityNotes[item]) {
            quantityInput.value = quantityNotes[item];
        }

        li.appendChild(checkbox);
        li.appendChild(label);
        li.appendChild(quantityInput);
        CHECKLIST_UL.appendChild(li);
        checklistItems.push(li);

        // Add event listeners
        checkbox.addEventListener('change', saveState);
        quantityInput.addEventListener('input', saveQuantityNotes);
    });

    updateProgress();
}

/**
 * Filters the list based on the search input.
 */
function filterList() {
    const searchTerm = SEARCH_INPUT.value.trim().toLowerCase();

    checklistItems.forEach(li => {
        const itemName = li.querySelector('input[type="checkbox"]').dataset.itemName.toLowerCase();
        
        if (searchTerm === '' || itemName.includes(searchTerm)) {
            li.classList.remove('hidden');
        } else {
            li.classList.add('hidden');
        }
    });
}

/**
 * Handles "Mark all" and "Reset all" button clicks.
 * @param {boolean} checkState - True for "Mark all", false for "Reset all".
 */
function setAllChecks(checkState) {
    checklistItems.forEach(li => {
        // Only affect visible items if there is a search term, otherwise affect all
        if (li.classList.contains('hidden') && SEARCH_INPUT.value.trim() !== '') {
            return;
        }
        li.querySelector('input[type="checkbox"]').checked = checkState;
    });
    saveState();
}

/**
 * Shows a toast notification with the given message.
 * @param {string} message - The message to display.
 * @param {number} duration - Duration in milliseconds (default: 2000).
 */
function showToast(message, duration = 2000) {
    TOAST.textContent = message;
    TOAST.classList.add('show');
    
    setTimeout(() => {
        TOAST.classList.remove('show');
    }, duration);
}

/**
 * Copies all checked items to clipboard as a formatted list.
 * Includes quantity/notes if present.
 */
function copyCheckedItems() {
    const quantityNotes = loadQuantityNotes();
    const checkedItems = checklistItems
        .filter(li => li.querySelector('input[type="checkbox"]').checked)
        .map(li => {
            const itemName = li.querySelector('input[type="checkbox"]').dataset.itemName;
            const quantity = quantityNotes[itemName];
            return quantity ? `- ${itemName} — ${quantity}` : `- ${itemName}`;
        });
    
    if (checkedItems.length === 0) {
        showToast('ยังไม่ได้ติ๊กรายการ');
        return;
    }
    
    const textToCopy = checkedItems.join('\n');
    
    // Use Clipboard API
    navigator.clipboard.writeText(textToCopy).then(() => {
        showToast('คัดลอกแล้ว');
    }).catch(err => {
        console.error('Failed to copy to clipboard:', err);
        showToast('คัดลอกไม่สำเร็จ');
    });
}

/**
 * Updates the CSS variable for top bar offset dynamically.
 * This ensures the list starts below the entire top bar (header + controls) on all screen sizes.
 */
function updateTopBarOffset() {
    const topBar = document.getElementById('topBar');
    if (topBar) {
        const topBarHeight = topBar.offsetHeight;
        document.documentElement.style.setProperty('--top-offset', topBarHeight + 'px');
    }
}

/**
 * Initializes the application.
 */
function initChecklist() {
    renderChecklist();
    
    // Calculate top bar offset on load
    updateTopBarOffset();

    // Event listeners for controls
    SEARCH_INPUT.addEventListener('input', filterList);
    MARK_ALL_BTN.addEventListener('click', () => setAllChecks(true));
    RESET_ALL_BTN.addEventListener('click', () => setAllChecks(false));
    COPY_BTN.addEventListener('click', copyCheckedItems);
    
    // Recalculate top bar offset on window resize and orientation change
    window.addEventListener('resize', updateTopBarOffset);
    window.addEventListener('orientationchange', () => {
        // Delay slightly to allow layout to settle
        setTimeout(updateTopBarOffset, 100);
    });
}

// Run the initialization when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    initChecklist();
    // Ensure top bar offset is calculated after a brief delay to account for font loading
    setTimeout(updateTopBarOffset, 150);
});

// Optional: Service Worker for Offline capability (Minimal and Safe)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').then(registration => {
            console.log('SW registered: ', registration);
        }).catch(registrationError => {
            console.log('SW registration failed: ', registrationError);
        });
    });
}

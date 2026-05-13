const canvas = document.getElementById('matrixCanvas');
const ctx = canvas.getContext('2d');
const digitalClock = document.getElementById('digitalClock');
const timeFormatToggle = document.getElementById('timeFormatToggle');
const secondsToggle = document.getElementById('secondsToggle');
const menuToggle = document.getElementById('menuToggle');
const matrixControls = document.getElementById('matrixControls');
const searchField = document.getElementById('passwordField');
let is24HourFormat = true; // Default to 24-hour format
let showSeconds = true; // Default to showing seconds
let frameCount = 0;


canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// --- Configuration ---
let rainColor = '#00FF41'; // Initial color for matrix rain
let uiThemeColor = rainColor; // Initial color for UI elements

let fontSize = 20;
let animationSpeed = 18;

const characters = `123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%^&*()_-+=/?.,<>~ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉ`;
const charArray = characters.split('');

let columns = Math.ceil(canvas.width / fontSize);
let drops = Array(columns).fill(1);

// --- Helper to convert hex to RGB for CSS variables with opacity ---
function hexToRgb(hex) {
    let r = 0, g = 0, b = 0;
    if (hex.length == 4) { // #RGB
        r = parseInt(hex[1] + hex[1], 16);
        g = parseInt(hex[2] + hex[2], 16);
        b = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length == 7) { // #RRGGBB
        r = parseInt(hex[1] + hex[2], 16);
        g = parseInt(hex[3] + hex[4], 16);
        b = parseInt(hex[5] + hex[6], 16);
    }
    return `${r}, ${g}, ${b}`;
}

function updateThemeColors(newColor) {
    rainColor = newColor; // For matrix rain itself
    uiThemeColor = newColor; // For UI elements
    document.documentElement.style.setProperty('--theme-color', uiThemeColor);
    document.documentElement.style.setProperty('--theme-color-rgb', hexToRgb(uiThemeColor));
}

let bgColor = '#000000';
let bgColorRGB = '0, 0, 0';

function updateBackgroundColor(newColor) {
    bgColor = newColor;
    bgColorRGB = hexToRgb(newColor);
    document.documentElement.style.setProperty('--bg-color', newColor);
    document.documentElement.style.setProperty('--bg-color-rgb', bgColorRGB);
}


// --- Control Elements ---
const colorPicker = document.getElementById('colorPicker');
const bgColorPicker = document.getElementById('bgColorPicker');
const speedSlider = document.getElementById('speedSlider');
const fontSizeSlider = document.getElementById('fontSizeSlider');
const speedValueSpan = document.getElementById('speedValue');
const fontSizeValueSpan = document.getElementById('fontSizeValue');

// --- Initialize Controls and Theme ---
updateThemeColors(colorPicker.value); // Initialize theme with picker's default value
if (bgColorPicker) {
    updateBackgroundColor(bgColorPicker.value);
}
speedSlider.value = animationSpeed;
speedValueSpan.textContent = animationSpeed;
fontSizeSlider.value = fontSize;
fontSizeValueSpan.textContent = fontSize;


// --- Control Event Listeners ---
colorPicker.addEventListener('input', (event) => {
    updateThemeColors(event.target.value);
    updateFavicon(event.target.value);
});
colorPicker.addEventListener('change', (event) => {
    settings.themeColor = event.target.value;
    saveSettingsToStorage();
    updateFavicon(event.target.value);
});

if (bgColorPicker) {
    bgColorPicker.addEventListener('input', (event) => {
        updateBackgroundColor(event.target.value);
    });
    bgColorPicker.addEventListener('change', (event) => {
        settings.backgroundColor = event.target.value;
        saveSettingsToStorage();
    });
}

speedSlider.addEventListener('input', (event) => {
    animationSpeed = parseInt(event.target.value, 10);
    speedValueSpan.textContent = animationSpeed;
});
speedSlider.addEventListener('change', (event) => {
    settings.animationSpeed = animationSpeed;
    saveSettingsToStorage();
});

fontSizeSlider.addEventListener('input', (event) => {
    fontSize = parseInt(event.target.value, 10);
    fontSizeValueSpan.textContent = fontSize;
    columns = Math.ceil(canvas.width / fontSize);
    drops = Array(columns).fill(1);
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
});
fontSizeSlider.addEventListener('change', (event) => {
    settings.fontSize = fontSize;
    saveSettingsToStorage();
});

const resetSettingsBtn = document.getElementById('resetSettingsBtn');
if (resetSettingsBtn) {
    resetSettingsBtn.addEventListener('click', () => {
        settings = { ...defaultSettings };
        saveSettingsToStorage();
        applySettings();
    });
}


function drawMatrix() {
    ctx.fillStyle = `rgba(${bgColorRGB}, 0.05)`; // Fading effect using dynamic background color
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = rainColor; // Use the dynamic rain color
    ctx.font = `${fontSize}px 'Courier New', Courier, monospace`;

    for (let i = 0; i < drops.length; i++) {
        const text = charArray[Math.floor(Math.random() * charArray.length)];
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
            drops[i] = 0;
        }
        drops[i]++;
    }
}

function animate() {
    frameCount++;
    if (frameCount % (21 - animationSpeed) === 0) {
        drawMatrix();
    }
    requestAnimationFrame(animate);
}

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    columns = Math.ceil(canvas.width / fontSize);
    drops = Array(columns).fill(1);
    if (ctx) { // Ensure ctx is available
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
});

let clockTimeout;

function updateClock() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    let period = '';

    if (!is24HourFormat) {
        period = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
    }

    const formattedHours = String(hours).padStart(2, '0');
    let timeString = '';
    if (is24HourFormat) {
        timeString = showSeconds ? `${formattedHours}:${minutes}:${seconds}` : `${formattedHours}:${minutes}`;
    } else {
        timeString = showSeconds ? `${formattedHours}:${minutes}:${seconds} ${period}` : `${formattedHours}:${minutes} ${period}`;
    }

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const dateString = `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()} ${days[now.getDay()]}`;

    digitalClock.innerHTML = `
        <div class="time-string">${timeString}</div>
        <div class="date-string">${dateString}</div>
    `;

    // Schedule next update precisely
    if (clockTimeout) clearTimeout(clockTimeout);

    let delay;
    if (showSeconds) {
        delay = 1000 - now.getMilliseconds();
    } else {
        delay = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
    }
    // Prevent 0 or negative delays
    if (delay <= 0) delay = showSeconds ? 1000 : 60000;

    clockTimeout = setTimeout(updateClock, delay);
}

updateClock(); // Initial call to display clock immediately

timeFormatToggle.addEventListener('change', (e) => {
    is24HourFormat = !e.target.checked;
    settings.is24HourFormat = is24HourFormat;
    saveSettingsToStorage();
    updateClock();
});

secondsToggle.addEventListener('change', (e) => {
    showSeconds = e.target.checked;
    settings.showSeconds = showSeconds;
    saveSettingsToStorage();
    updateClock();
});

menuToggle.addEventListener('click', () => {
    matrixControls.classList.toggle('hidden');
});

// Search / URL navigation functionality
searchField.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        const query = this.value.trim();
        if (query) {
            // Check if it's a URL
            const urlPattern = /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w-.\/?%&=]*)?$/i;
            if (urlPattern.test(query) && !query.includes(' ')) {
                let url = query;
                if (!url.startsWith('http://') && !url.startsWith('https://')) {
                    url = 'https://' + url;
                }
                window.location.href = url;
            } else {
                // Search Google
                window.location.href = 'https://www.google.com/search?q=' + encodeURIComponent(query);
            }
        }
    }
});

// Bookmark Functionality
const bookmarksContainer = document.getElementById('bookmarksContainer');
const addBookmarkBtn = document.getElementById('addBookmarkBtn');
const bookmarkModal = document.getElementById('bookmarkModal');
const cancelBookmarkBtn = document.getElementById('cancelBookmarkBtn');
const saveBookmarkBtn = document.getElementById('saveBookmarkBtn');
const bookmarkIdInput = document.getElementById('bookmarkId');
const bookmarkNameInput = document.getElementById('bookmarkName');
const bookmarkUrlInput = document.getElementById('bookmarkUrl');
const modalTitle = document.getElementById('modalTitle');

let bookmarks = [];

let custom_default =
[
    { id: '1', name: 'Google', url: 'https://google.com' },
    { id: '2', name: 'YouTube', url: 'https://youtube.com' }
];

const defaultSettings = {
    themeColor: '#00FF41',
    backgroundColor: '#000000',
    animationSpeed: 18,
    fontSize: 20,
    is24HourFormat: true,
    showSeconds: true
};

let settings = { ...defaultSettings };

function saveSettingsToStorage() {
    if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.set({ 'matrix_settings': settings });
    } else {
        localStorage.setItem('matrix_settings', JSON.stringify(settings));
    }
}

function saveBookmarksToStorage() {
    if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.set({ 'matrix_bookmarks': bookmarks });
    } else {
        localStorage.setItem('matrix_bookmarks', JSON.stringify(bookmarks));
    }
}

function updateFavicon(color) {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');

    // Clear canvas
    ctx.clearRect(0, 0, 32, 32);

    // Draw the terminal icon
    ctx.fillStyle = color;
    ctx.font = '900 24px "Font Awesome 6 Free"';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('\uf120', 16, 16); // \uf120 is fa-terminal

    // Update Tab Favicon
    const dataUrl = canvas.toDataURL('image/png');
    let link = document.getElementById('dynamic-favicon');
    if (!link) {
        link = document.createElement('link');
        link.id = 'dynamic-favicon';
        link.rel = 'icon';
        link.type = 'image/png';
        document.head.appendChild(link);
    }
    link.href = dataUrl;

    // Update Extension Icon
    if (typeof chrome !== 'undefined' && chrome.action && chrome.action.setIcon) {
        try {
            const imageData = ctx.getImageData(0, 0, 32, 32);
            chrome.action.setIcon({ imageData: imageData });
        } catch (e) {
            console.error('Could not set extension icon', e);
        }
    }
}

function applySettings() {
    animationSpeed = settings.animationSpeed;
    fontSize = settings.fontSize;
    is24HourFormat = settings.is24HourFormat;
    showSeconds = settings.showSeconds;

    // Update UI controls
    colorPicker.value = settings.themeColor;
    updateThemeColors(settings.themeColor);

    if (bgColorPicker) {
        bgColorPicker.value = settings.backgroundColor || '#000000';
        updateBackgroundColor(bgColorPicker.value);
    }

    // Wait for fonts to load before drawing favicon
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => updateFavicon(settings.themeColor));
    } else {
        updateFavicon(settings.themeColor);
    }

    speedSlider.value = settings.animationSpeed;
    speedValueSpan.textContent = settings.animationSpeed;

    fontSizeSlider.value = settings.fontSize;
    fontSizeValueSpan.textContent = settings.fontSize;

    timeFormatToggle.checked = !settings.is24HourFormat;
    secondsToggle.checked = settings.showSeconds;

    columns = Math.ceil(canvas.width / fontSize);
    drops = Array(columns).fill(1);
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    updateClock();
}

function loadDataFromStorage(callback) {
    if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.get(['matrix_bookmarks', 'matrix_settings'], function (result) {
            if (result.matrix_bookmarks) {
                bookmarks = result.matrix_bookmarks;
            } else {
              bookmarks = custom_default;
            }
            if (result.matrix_settings) {
                settings = result.matrix_settings;
            }
            callback();
        });
    } else {
      bookmarks = JSON.parse(localStorage.getItem('matrix_bookmarks')) || custom_default;
        const savedSettings = JSON.parse(localStorage.getItem('matrix_settings'));
        if (savedSettings) {
            settings = savedSettings;
        }
        callback();
    }
}

function renderBookmarks() {
    // Clear existing bookmarks
    const items = bookmarksContainer.querySelectorAll('.bookmark-item');
    items.forEach(item => item.remove());

    bookmarks.forEach(bookmark => {
        const a = document.createElement('a');
        a.href = bookmark.url;
        a.className = 'bookmark-item';
        a.innerHTML = `
            <i class="fas fa-globe favicon"></i>
            <span>${bookmark.name}</span>
            <div class="bookmark-actions">
                <button class="edit-btn" data-id="${bookmark.id}" title="Edit"><i class="fas fa-pencil-alt"></i></button>
                <button class="delete-btn" data-id="${bookmark.id}" title="Delete"><i class="fas fa-trash"></i></button>
            </div>
        `;
        bookmarksContainer.insertBefore(a, addBookmarkBtn);
    });

    // Add event listeners for edit/delete buttons
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent navigating
            e.stopPropagation();
            openModal(e.currentTarget.getAttribute('data-id'));
        });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent navigating
            e.stopPropagation();
            deleteBookmark(e.currentTarget.getAttribute('data-id'));
        });
    });
}

function openModal(id = null) {
    if (id) {
        const bookmark = bookmarks.find(b => b.id === id);
        if (bookmark) {
            bookmarkIdInput.value = bookmark.id;
            bookmarkNameInput.value = bookmark.name;
            bookmarkUrlInput.value = bookmark.url;
            modalTitle.textContent = 'Edit Bookmark';
        }
    } else {
        bookmarkIdInput.value = '';
        bookmarkNameInput.value = '';
        bookmarkUrlInput.value = '';
        modalTitle.textContent = 'Add Bookmark';
    }
    bookmarkModal.classList.add('active');
    bookmarkNameInput.focus();
}

function closeModal() {
    bookmarkModal.classList.remove('active');
}

function saveBookmark() {
    const id = bookmarkIdInput.value;
    const name = bookmarkNameInput.value.trim();
    let url = bookmarkUrlInput.value.trim();

    if (!name || !url) {
        alert('Please enter both name and URL');
        return;
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
    }

    if (id) {
        // Edit existing
        const index = bookmarks.findIndex(b => b.id === id);
        if (index !== -1) {
            bookmarks[index] = { id, name, url };
        }
    } else {
        // Add new
        const newId = Date.now().toString();
        bookmarks.push({ id: newId, name, url });
    }

    saveBookmarksToStorage();
    renderBookmarks();
    closeModal();
}

function deleteBookmark(id) {
    if (confirm('Are you sure you want to delete this bookmark?')) {
        bookmarks = bookmarks.filter(b => b.id !== id);
        saveBookmarksToStorage();
        renderBookmarks();
    }
}

addBookmarkBtn.addEventListener('click', () => openModal());
cancelBookmarkBtn.addEventListener('click', closeModal);
saveBookmarkBtn.addEventListener('click', saveBookmark);

bookmarkModal.addEventListener('click', (e) => {
    if (e.target === bookmarkModal) {
        closeModal();
    }
});

bookmarkNameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') bookmarkUrlInput.focus();
});

bookmarkUrlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') saveBookmark();
});

// Initialize data
loadDataFromStorage(() => {
    applySettings();
    renderBookmarks();
});

// Start animation
animate();

let options = [];

// Add option from input
function addOption() {
    const input = document.getElementById('optionInput');
    const value = input.value.trim();
    const lang = (document.getElementById('languageSelect') && document.getElementById('languageSelect').value) || 'vi';
    const texts = translations[lang] || translations.vi;

    if (value === '') {
        showToast(texts.toastEmptyInput);
        return;
    }

    if (options.includes(value)) {
        showToast(texts.toastDuplicate);
        return;
    }

    options.push(value);
    input.value = '';
    updateDisplay();
    input.focus();
}

// Handle Enter key
function handleKeyPress(event) {
    if (event.key === 'Enter') {
        addOption();
    }
}

// Remove option
function removeOption(index) {
    options.splice(index, 1);
    updateDisplay();
}

// Update display
function updateDisplay() {
    const optionsList = document.getElementById('optionsList');
    const optionsCount = document.getElementById('optionsCount');
    const chooseBtn = document.getElementById('chooseBtn');

    optionsCount.textContent = options.length;
    chooseBtn.disabled = options.length < 2;
    const lang = (document.getElementById('languageSelect') && document.getElementById('languageSelect').value) || 'vi';
    const texts = translations[lang] || translations.vi;

    if (options.length === 0) {
        optionsList.innerHTML = `<div class="empty-state">${texts.noOptions}</div>`;
    } else {
        optionsList.innerHTML = options
            .map((option, index) => `
                <div class="option-tag">
                    <span>${option}</span>
                    <button class="btn-remove" onclick="removeOption(${index})">✕</button>
                </div>
            `)
            .join('');
    }

    saveToLocalStorage();
}

// Add multiple options from input (comma/newline separated)
function addAllOptions() {
    const input = document.getElementById('optionInput');
    const raw = input.value.trim();
    const lang = (document.getElementById('languageSelect') && document.getElementById('languageSelect').value) || 'vi';
    const texts = translations[lang] || translations.vi;

    if (!raw) {
        showToast(texts.toastEmptyList);
        return;
    }

    const parts = raw.split(/[,\n;|]+/).map(s => s.trim()).filter(Boolean);
    let added = 0;
    let skipped = 0;
    parts.forEach(p => {
        if (!options.includes(p)) {
            options.push(p);
            added++;
        } else skipped++;
    });

    if (added > 0) {
        const skippedText = skipped ? `, ${texts.toastSkipped.replace('{count}', skipped)}` : '';
        showToast(texts.toastAdded.replace('{count}', added).replace('{skippedCount}', skippedText));
        input.value = '';
        updateDisplay();
        input.focus();
    } else {
        showToast(texts.toastNoValid);
    }
}

// Choose random option with animation
function chooseRandom() {
    const lang = (document.getElementById('languageSelect') && document.getElementById('languageSelect').value) || 'vi';
    const texts = translations[lang] || translations.vi;

    if (options.length < 2) {
        showToast(texts.toastMinOptions);
        return;
    }

    const chooseBtn = document.getElementById('chooseBtn');
    chooseBtn.disabled = true;

    // prepare audio context for beeps
    if (!window._audioCtx) {
        try { window._audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) { window._audioCtx = null; }
    }

    // Animation effect
    const optionsList = document.getElementById('optionsList');
    const tags = optionsList.querySelectorAll('.option-tag');
    let currentIndex = 0;
    let iterations = 0;
    const maxIterations = 20 + Math.random() * 15;

    const interval = setInterval(() => {
        tags.forEach(tag => tag.classList.remove('highlight'));
        tags[currentIndex].classList.add('highlight');
        // play tick
        playBeep(800 + (iterations % 5) * 60, 0.04);
        currentIndex = (currentIndex + 1) % options.length;
        iterations++;

        if (iterations > maxIterations) {
            clearInterval(interval);
            const winner = options[(currentIndex - 1 + options.length) % options.length];
            showResult(winner);
            createConfetti();
            playWin();
            chooseBtn.disabled = false;
        }
    }, 90);
}

// Show result
function showResult(answer) {
    const resultSection = document.getElementById('resultSection');
    const resultAnswer = document.getElementById('resultAnswer');
    
    resultAnswer.textContent = answer;
    resultSection.classList.add('show');
}

// Copy result to clipboard
function copyResult() {
    const txt = document.getElementById('resultAnswer').textContent;
    const lang = (document.getElementById('languageSelect') && document.getElementById('languageSelect').value) || 'vi';
    const texts = translations[lang] || translations.vi;

    if (!txt) {
        showToast(texts.toastNoResult);
        return;
    }

    navigator.clipboard.writeText(txt).then(
        () => showToast(texts.toastCopied),
        () => showToast(texts.toastCopyFailed)
    );
}

// Create confetti effect
function createConfetti() {
    const colors = ['#667eea', '#764ba2', '#f39c12', '#e74c3c', '#2ecc71', '#3498db'];
    
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * window.innerWidth + 'px';
        confetti.style.top = -10 + 'px';
        confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
        document.body.appendChild(confetti);

        const duration = 2 + Math.random() * 1;
        const horizontalDrift = -100 + Math.random() * 200;

        confetti.animate([
            { 
                transform: 'translateY(0)',
                opacity: 1 
            },
            { 
                transform: `translateY(${window.innerHeight}px) translateX(${horizontalDrift}px) rotate(360deg)`,
                opacity: 0 
            }
        ], {
            duration: duration * 1000,
            easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        });

        setTimeout(() => confetti.remove(), duration * 1000);
    }
}

// Reset all
function resetAll() {
    const lang = (document.getElementById('languageSelect') && document.getElementById('languageSelect').value) || 'vi';
    const texts = translations[lang] || translations.vi;

    if (options.length === 0) return;
    
    if (confirm(texts.confirmReset)) {
        options = [];
        document.getElementById('resultSection').classList.remove('show');
        updateDisplay();
    }
}

// Local Storage functions
function saveToLocalStorage() {
    localStorage.setItem('foodOptions', JSON.stringify(options));
}

function loadFromLocalStorage() {
    const saved = localStorage.getItem('foodOptions');
    if (saved) {
        options = JSON.parse(saved);
        updateDisplay();
    }
}

function saveFavoriteList() {
    const lang = (document.getElementById('languageSelect') && document.getElementById('languageSelect').value) || 'vi';
    const texts = translations[lang] || translations.vi;

    const name = prompt(texts.promptListName);
    if (!name || options.length === 0) return;

    const savedLists = JSON.parse(localStorage.getItem('savedLists') || '{}');
    savedLists[name] = options.slice();
    localStorage.setItem('savedLists', JSON.stringify(savedLists));
    updateSavedLists();
}

function loadFavoriteList(name) {
    const savedLists = JSON.parse(localStorage.getItem('savedLists') || '{}');
    options = savedLists[name].slice();
    document.getElementById('resultSection').classList.remove('show');
    updateDisplay();
}

function deleteFavoriteList(name) {
    const lang = (document.getElementById('languageSelect') && document.getElementById('languageSelect').value) || 'vi';
    const texts = translations[lang] || translations.vi;

    if (confirm(texts.confirmDeleteList.replace('{name}', name))) {
        const savedLists = JSON.parse(localStorage.getItem('savedLists') || '{}');
        delete savedLists[name];
        localStorage.setItem('savedLists', JSON.stringify(savedLists));
        updateSavedLists();
    }
}

function updateSavedLists() {
    const savedList = document.getElementById('savedList');
    const savedLists = JSON.parse(localStorage.getItem('savedLists') || '{}');
    const listNames = Object.keys(savedLists);

    const lang = (document.getElementById('languageSelect') && document.getElementById('languageSelect').value) || 'vi';
    const texts = translations[lang] || translations.vi;

    if (listNames.length === 0) {
        savedList.innerHTML = `<div class="empty-state">${texts.savedNone}</div>`;
    } else {
        savedList.innerHTML = listNames
            .map(name => `
                <div class="saved-item" onclick="loadFavoriteList('${name}')">
                    <span>${name}</span>
                    <button class="saved-item-delete" onclick="event.stopPropagation(); deleteFavoriteList('${name}')">✕</button>
                </div>
            `)
            .join('');
    }
}

// Initialize
window.addEventListener('load', () => {
    loadFromLocalStorage();
    updateSavedLists();
});

// Toast helper
let _toastTimer = null;
function showToast(msg, ms = 1800) {
    let t = document.getElementById('toast');
    if (!t) {
        t = document.createElement('div');
        t.id = 'toast';
        document.body.appendChild(t);
    }
    t.textContent = msg;
    t.style.opacity = '1';
    t.style.transform = 'translateX(-50%) translateY(0)';
    if (_toastTimer) clearTimeout(_toastTimer);
    _toastTimer = setTimeout(() => {
        t.style.opacity = '0';
        t.style.transform = 'translateX(-50%) translateY(8px)';
    }, ms);
}

// Simple beep using WebAudio
function playBeep(freq = 1000, duration = 0.05) {
    const ctx = window._audioCtx;
    if (!ctx) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = freq;
    g.gain.value = 0.001;
    o.connect(g);
    g.connect(ctx.destination);
    const now = ctx.currentTime;
    g.gain.setValueAtTime(0.001, now);
    g.gain.exponentialRampToValueAtTime(0.15, now + 0.01);
    o.start(now);
    g.gain.exponentialRampToValueAtTime(0.001, now + duration);
    o.stop(now + duration + 0.02);
}

function playWin() {
    const ctx = window._audioCtx;
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [880, 1100, 1320];
    notes.forEach((n, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.value = n;
        o.connect(g);
        g.connect(ctx.destination);
        g.gain.value = 0.001;
        g.gain.exponentialRampToValueAtTime(0.12, now + i * 0.08 + 0.01);
        o.start(now + i * 0.08);
        g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.18);
        o.stop(now + i * 0.08 + 0.2);
    });
}

const translations = {
    en: {
        title: "🍜 What to eat today?",
        subtitle: "Your quick decision assistant",
        addPlaceholder: "Enter an option (e.g., Pho, Pizza, etc.)",
        addButton: "Add",
        addAllButton: "Add All",
        chooseButton: "✨ Choose for me",
        resetButton: "Reset All",
        saveButton: "💾 Save List",
        copyButton: "Copy Result",
        noOptions: "No options yet. Add some!",
        optionsTitle: "Options",
        resultText: "Selected result:",
        savedListsTitle: "📌 Saved Lists",
        savedNone: "No saved lists",
        confirmReset: "Are you sure you want to reset all options?",
        toastAdded: "Added {count} items",
        toastSkipped: "{count} skipped",
        toastNoValid: "No valid items to add.",
        toastMinOptions: "At least 2 options are required!",
        toastNoResult: "No result to copy.",
        toastCopied: "Result copied!",
        toastCopyFailed: "Unable to copy.",
        toastEmptyInput: "Please enter an option!",
        toastDuplicate: "This option already exists!",
        toastEmptyList: "Please enter a list to add!",
        toastAdded: "Added {count} items{skippedCount}",
        toastNoValid: "No valid items to add.",
        toastMinOptions: "At least 2 options are required!",
        toastNoResult: "No result to copy.",
        toastCopied: "Result copied!",
        toastCopyFailed: "Unable to copy.",
        confirmReset: "Are you sure you want to reset all options?",
        promptListName: "List name (e.g., This week, Dinner, etc.):",
        confirmDeleteList: "Delete list \"{name}\"?",
        languageLabel: "🌐 Language:"
    },
    vi: {
        title: "🍜 Hôm nay ăn gì?",
        subtitle: "Trợ thủ quyết định nhanh chóng của bạn",
        addPlaceholder: "Nhập lựa chọn (ví dụ: Phở, Cơm tấm, Pizza...)",
        addButton: "Thêm",
        addAllButton: "Thêm tất cả",
        chooseButton: "✨ Chọn giúp tôi",
        resetButton: "Xóa hết",
        saveButton: "💾 Lưu danh sách",
        copyButton: "Sao chép kết quả",
        noOptions: "Chưa có lựa chọn nào. Hãy thêm một vài tùy chọn!",
        optionsTitle: "Danh sách lựa chọn",
        resultText: "Kết quả được chọn:",
        savedListsTitle: "📌 Danh sách đã lưu",
        savedNone: "Chưa lưu danh sách nào",
        confirmReset: "Bạn chắc chắn muốn xóa tất cả lựa chọn?",
        toastAdded: "Đã thêm {count} mục{skippedCount}",
        toastSkipped: "{count} bị bỏ qua",
        toastNoValid: "Không có mục hợp lệ để thêm.",
        toastMinOptions: "Cần ít nhất 2 lựa chọn!",
        toastNoResult: "Chưa có kết quả để sao chép",
        toastCopied: "Đã sao chép kết quả",
        toastCopyFailed: "Không thể sao chép",
        toastEmptyInput: "Vui lòng nhập một lựa chọn!",
        toastDuplicate: "Lựa chọn này đã tồn tại!",
        toastEmptyList: "Vui lòng nhập danh sách để thêm!",
        toastAdded: "Đã thêm {count} mục{skippedCount}",
        toastNoValid: "Không có mục hợp lệ để thêm.",
        toastMinOptions: "Cần ít nhất 2 lựa chọn!",
        toastNoResult: "Chưa có kết quả để sao chép",
        toastCopied: "Đã sao chép kết quả",
        toastCopyFailed: "Không thể sao chép",
        confirmReset: "Bạn chắc chắn muốn xóa tất cả lựa chọn?",
        promptListName: "Tên danh sách (ví dụ: Tuần này, Ăn tối, v.v.):",
        confirmDeleteList: "Xóa danh sách \"{name}\"?",
        languageLabel: "🌐 Ngôn ngữ:"
    }
};

function switchLanguage() {
    const selectedLang = document.getElementById('languageSelect').value;
    const texts = translations[selectedLang];

    document.querySelector('h1').textContent = texts.title;
    document.querySelector('.subtitle').textContent = texts.subtitle;
    document.getElementById('optionInput').placeholder = texts.addPlaceholder;
    document.querySelector('.btn-add').textContent = texts.addButton;
    document.querySelector('.btn-add-all').textContent = texts.addAllButton;
    document.getElementById('chooseBtn').textContent = texts.chooseButton;
    document.querySelector('.btn-reset').textContent = texts.resetButton;
    document.querySelector('.btn-save').textContent = texts.saveButton;
    document.getElementById('copyBtn').textContent = texts.copyButton;
    document.querySelector('.options-title span').textContent = texts.optionsTitle;
    document.querySelector('.result-text').textContent = texts.resultText;
    document.querySelector('.storage-title').textContent = texts.savedListsTitle;
    document.querySelector('.language-switcher label').textContent = texts.languageLabel;
    // Refresh dynamic lists/empty states
    updateDisplay();
    updateSavedLists();
}
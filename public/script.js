let allHolidays = {};
let holidays = {};

async function fetchHolidays(year) {
    const overlay = document.getElementById('loading-overlay');
    overlay.style.display = 'flex';
    
    try {
        // 初回のみCSV全体を取得
        if (Object.keys(allHolidays).length === 0) {
            const response = await fetch('/api/holidays');
            
            if (!response.ok) {
                throw new Error('祝日データ取得失敗');
            }
            
            const text = await response.text();
            const lines = text.split('\n');
            
            // CSVパース（ヘッダー行スキップ）
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;
                
                const parts = line.split(',');
                if (parts.length < 2) continue;
                
                const dateStr = parts[0].trim();
                const name = parts[1].trim().replace(/^"|"$/g, '');
                
                const match = dateStr.match(/(\d{4})\/(\d{1,2})\/(\d{1,2})/);
                if (!match) continue;
                
                const y = parseInt(match[1]);
                const m = parseInt(match[2]);
                const d = parseInt(match[3]);
                const key = `${y}/${m}/${d}`;
                
                allHolidays[key] = name;
            }
            
            console.log('全祝日データ取得完了:', Object.keys(allHolidays).length + '件');
        }
        
        // 指定年の祝日を抽出
        holidays = {};
        Object.keys(allHolidays).forEach(key => {
            const y = parseInt(key.split('/')[0]);
            if (y === year) {
                holidays[key] = allHolidays[key];
            }
        });
        
        console.log(`${year}年の祝日: ${Object.keys(holidays).length}件`);
        console.log('祝日データ:', holidays);
        
    } catch (e) {
        console.error("取得失敗:", e);
        document.getElementById('loading-text').innerText = "祝日データの取得に失敗しました。";
        setTimeout(() => { overlay.style.display = 'none'; }, 2000);
        return false;
    }
    
    overlay.style.display = 'none';
    return true;
}

async function generateCalendar() {
    const yearInput = document.getElementById("yearInput");
    const btn = document.querySelector("button[onclick^='generateCalendar']");
    const year = parseInt(yearInput.value);
    
    btn.disabled = true;
    btn.innerText = "取得中...";

    const success = await fetchHolidays(year);
    if (!success) {
        btn.disabled = false;
        btn.innerText = "生成・更新";
        return;
    }

    const output = document.getElementById("output");
    output.innerHTML = "";

    for (let m = 1; m <= 12; m += 2) {
        const page = document.createElement("div");
        page.className = "page";
        page.innerHTML = createMonthHtml(year, m) + createMonthHtml(year, m + 1);
        output.appendChild(page);
    }
    
    btn.disabled = false;
    btn.innerText = "生成・更新";
}

function getMonthData(year, month) {
    const lastDay = new Date(year, month, 0).getDate();
    const days = [];
    const weekDays = ["日", "月", "火", "水", "木", "金", "土"];

    for (let d = 1; d <= lastDay; d++) {
        const dateObj = new Date(year, month - 1, d);
        const dateKey = `${year}/${month}/${d}`;
        const dayIdx = dateObj.getDay();
        
        const holidayName = holidays[dateKey];
        const isHoliday = !!holidayName;

        days.push({
            day: d,
            week: weekDays[dayIdx],
            dayIdx: dayIdx,
            holiday: holidayName || "",
            isHoliday: isHoliday,
        });
    }
    return days;
}

function createMonthHtml(year, month) {
    const days = getMonthData(year, month);
    let leftColHtml = "";
    let rightColHtml = "";

    for (let i = 0; i < 16; i++) {
        leftColHtml += createDayRowHtml(days[i]);
    }
    for (let i = 16; i < 32; i++) {
        rightColHtml += createDayRowHtml(days[i]);
    }

    return `
        <div class="calendar-container">
            <div class="header">
                <div class="month-large">${month}</div>
                <div class="year-small">${year}</div>
            </div>
            <div class="calendar-body">
                <div class="column column-left">${leftColHtml}</div>
                <div class="column column-right">${rightColHtml}</div>
            </div>
            <div class="footer">${year} / ${month}</div>
        </div>
    `;
}

function createDayRowHtml(dayData) {
    if (!dayData) return '<div class="day-row"></div>';
    let weekClass = "";
    if (dayData.dayIdx === 0 || dayData.isHoliday) weekClass = "text-sun";
    else if (dayData.dayIdx === 6) weekClass = "text-sat";
    const rowClass = (dayData.dayIdx === 0 || dayData.isHoliday || dayData.dayIdx === 6) ? "bg-holiday" : "";

    return `
        <div class="day-row ${rowClass}">
            <div class="day-num">${dayData.day}</div>
            <div class="day-week ${weekClass}">${dayData.week}</div>
            <div class="holiday-name">${dayData.holiday}</div>
        </div>
    `;
}

function toggleSettings() {
    const panel = document.getElementById('settings-panel');
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
}

function applySettings() {
    const font = document.getElementById('fontSelect').value;
    const dateSize = document.getElementById('dateSize').value;
    const weekSize = document.getElementById('weekSize').value;
    const holidaySize = document.getElementById('holidaySize').value;
    const sundayColor = document.getElementById('sundayColor').value;
    const saturdayColor = document.getElementById('saturdayColor').value;
    const holidayBgColor = document.getElementById('holidayBgColor').value; // 追加
    
    // CSSカスタムプロパティへ適用
    const root = document.documentElement;
    root.style.setProperty('--font-family', font);
    root.style.setProperty('--date-size', dateSize + 'px');
    root.style.setProperty('--week-size', weekSize + 'px');
    root.style.setProperty('--holiday-size', holidaySize + 'px');
    root.style.setProperty('--sun-red', sundayColor);
    root.style.setProperty('--sat-blue', saturdayColor);
    root.style.setProperty('--bg-holiday', holidayBgColor); // 祝日背景色を反映
    
    // 設定を保存
    localStorage.setItem('calendarSettings', JSON.stringify({
        font, dateSize, weekSize, holidaySize, sundayColor, saturdayColor, holidayBgColor
    }));
    
    // カレンダー再生成（DOMを更新してスタイルを確実に適用）
    generateCalendar();
}

function resetSettings() {
    localStorage.removeItem('calendarSettings');
    document.getElementById('fontSelect').value = "'ヒラギノ角ゴ Pro', sans-serif";
    document.getElementById('dateSize').value = 24;
    document.getElementById('weekSize').value = 14;
    document.getElementById('holidaySize').value = 11;
    document.getElementById('sundayColor').value = '#d32f2f'; // 文字色（赤）
    document.getElementById('saturdayColor').value = '#1976d2'; // 文字色（青）
    // 以下を追加：背景色の初期値をセット
    document.getElementById('holidayBgColor').value = '#fff5f5'; 
    applySettings();
}

// ページ読み込み時に保存された設定を復元
function loadSettings() {
    const saved = localStorage.getItem('calendarSettings');
    if (saved) {
        const settings = JSON.parse(saved);
        document.getElementById('fontSelect').value = settings.font;
        document.getElementById('dateSize').value = settings.dateSize;
        document.getElementById('weekSize').value = settings.weekSize;
        document.getElementById('holidaySize').value = settings.holidaySize;
        document.getElementById('sundayColor').value = settings.sundayColor;
        document.getElementById('saturdayColor').value = settings.saturdayColor;
        
        if (settings.holidayBgColor) {
            document.getElementById('holidayBgColor').value = settings.holidayBgColor;
        }

        // スライダーの横のテキスト（24px等）も復元した値に更新
        updateSliderLabels(settings);

        // 重要：applySettingsを呼ぶことで、その中のgenerateCalendarも実行される
        applySettings();
        return true; 
    }
    return false;
}

// スライダーのラベル表示を一括更新する補助関数
function updateSliderLabels(settings) {
    if (document.getElementById('dateSizeValue')) 
        document.getElementById('dateSizeValue').textContent = settings.dateSize + 'px';
    if (document.getElementById('weekSizeValue')) 
        document.getElementById('weekSizeValue').textContent = settings.weekSize + 'px';
    if (document.getElementById('holidaySizeValue')) 
        document.getElementById('holidaySizeValue').textContent = settings.holidaySize + 'px';
}

// スライダー連動（数値表示のリアルタイム更新）
document.getElementById('dateSize')?.addEventListener('input', (e) => {
    document.getElementById('dateSizeValue').textContent = e.target.value + 'px';
});
document.getElementById('weekSize')?.addEventListener('input', (e) => {
    document.getElementById('weekSizeValue').textContent = e.target.value + 'px';
});
document.getElementById('holidaySize')?.addEventListener('input', (e) => {
    document.getElementById('holidaySizeValue').textContent = e.target.value + 'px';
});

// ページ読み込み時の処理
window.onload = function() {
    // 1. まず設定を読み込む
    const hasSettings = loadSettings();
    
    // 2. 設定がなかった場合（初回訪問）のみ、手動でカレンダーを生成する
    // 設定があった場合は、loadSettings -> applySettings -> generateCalendar の順ですでに実行されている
    if (!hasSettings) {
        generateCalendar();
    }
};
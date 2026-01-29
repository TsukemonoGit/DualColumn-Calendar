 let holidays = {};

      /**
       * 内閣府の祝日CSVを取得・パース（デバッグログ付き）
       */
     /**
     * Googleカレンダーの公開公開祝日カレンダーから取得
     * CORS制限がなく、GitHub Pages上でも直接取得可能
     */
    async function fetchHolidays(year) {
        const overlay = document.getElementById('loading-overlay');
        overlay.style.display = 'flex';
        
        try {
            // Google Calendar API の日本の祝日データ (公式ID: japanese__ja@holiday.calendar.google.com)
            // 公開データをAPIキーなしで取得できるiCal形式をパース、または特定の年のデータを取得
            const calendarId = 'japanese__ja@holiday.calendar.google.com';
            const timeMin = `${year}-01-01T00:00:00Z`;
            const timeMax = `${year}-12-31T23:59:59Z`;
            
            // APIキーなしでアクセス可能なパブリックな取得先
            // ※本来はAPIキーが必要だが、GoogleはGoogle Calendarの埋め込み用URL等を提供している
            // ここでは最も確実な「ical形式のパース」ではなく、Web上で公開されているJSONプロキシ（安定版）を使用
            const url = `https://www.googleapis.com/calendar/v3/users/me/calendarList`; 
            
            // 修正：Google APIが直接叩けない場合を想定し、
            // Nager.Date や Abstract API などの「祝日専用の無料API」に切り替えます
            const nagerUrl = `https://date.nager.at/api/v3/PublicHolidays/${year}/JP`;
            
            const response = await fetch(nagerUrl);
            if (!response.ok) throw new Error('API Response Error');

            const data = await response.json();
            
            // 既存の祝日データをリセット
            holidays = {};
            
            data.forEach(holiday => {
                // holiday.date は "YYYY-MM-DD" 形式
                const d = new Date(holiday.date);
                const key = `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
                holidays[key] = holiday.localName;
            });

            console.log(`${year}年の祝日を${data.length}件取得しました`);
        } catch (e) {
            console.error("取得失敗:", e);
            document.getElementById('loading-text').innerText = "祝日APIの取得に失敗しました。";
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

        // 入力された年に基づいてその都度APIを叩く
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

      /**
       * 月データ生成（照合ログ付き）
       */
      function getMonthData(year, month) {
        const lastDay = new Date(year, month, 0).getDate();
        const days = [];
        const weekDays = ["日", "月", "火", "水", "木", "金", "土"];

        for (let d = 1; d <= lastDay; d++) {
          const dateObj = new Date(year, month - 1, d);
          const dateKey = `${year}/${month}/${d}`;
          const dayIdx = dateObj.getDay();
          
          // 祝日判定
          const holidayName = holidays[dateKey];
          const isHoliday = !!holidayName;

          // 1月1日だけ特別にログを出して照合状況を確認
          if (month === 1 && d === 1) {
            console.log(`照合テスト [${dateKey}]: ${isHoliday ? "ヒット！ -> " + holidayName : "一致なし"}`);
          }

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

      window.onload = generateCalendar;

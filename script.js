 let holidays = {};

      /**
       * 内閣府の祝日CSVを取得・パース（デバッグログ付き）
       */
     /**
     * Googleカレンダーの公開公開祝日カレンダーから取得
     * CORS制限がなく、GitHub Pages上でも直接取得可能
     */
    /**
 * 祝日データの取得と、日本独自の休日ルールの計算
 */
async function fetchHolidays(year) {
    const overlay = document.getElementById('loading-overlay');
    overlay.style.display = 'flex';
    
    try {
        // 1. APIからベースとなる祝日を取得
        const nagerUrl = `https://date.nager.at/api/v3/PublicHolidays/${year}/JP`;
        const response = await fetch(nagerUrl);
        if (!response.ok) throw new Error('API Response Error');
        const data = await response.json();

        holidays = {};
        // 一旦、APIから来た祝日を格納
        data.forEach(h => {
            const d = new Date(h.date);
            const key = `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
            holidays[key] = h.localName;
        });

        // 2. 振替休日の判定 (祝日が日曜日の場合、翌平日を休みにする)
        // ※ Nager.Dateが返してこない場合のための補完ロジック
        Object.keys(holidays).forEach(dateKey => {
            const d = new Date(dateKey);
            if (d.getDay() === 0) { // 日曜日
                let substitute = new Date(d);
                let found = false;
                while (!found) {
                    substitute.setDate(substitute.getDate() + 1);
                    const subKey = `${substitute.getFullYear()}/${substitute.getMonth() + 1}/${substitute.getDate()}`;
                    if (!holidays[subKey]) {
                        holidays[subKey] = "振替休日";
                        found = true;
                    }
                }
            }
        });

        // 3. 国民の休日の判定 (祝日と祝日の間に挟まれた平日を休みにする)
        // 例: 敬老の日と秋分の日に挟まれた日
        const sortedDates = Object.keys(holidays).map(k => new Date(k)).sort((a, b) => a - b);
        for (let i = 0; i < sortedDates.length - 1; i++) {
            const d1 = sortedDates[i];
            const d2 = sortedDates[i+1];
            const diff = (d2 - d1) / (1000 * 60 * 60 * 24);
            
            if (diff === 2) { // 1日だけ空いている
                const target = new Date(d1);
                target.setDate(target.getDate() + 1);
                if (target.getDay() !== 0) { // 日曜でないなら
                    const targetKey = `${target.getFullYear()}/${target.getMonth() + 1}/${target.getDate()}`;
                    if (!holidays[targetKey]) {
                        holidays[targetKey] = "国民の休日";
                    }
                }
            }
        }

        console.log(`${year}年の祝日計算完了（振休・国民の休日含む）`);
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

const STORAGE_KEY = "gecko-manager-local-v2";
const INITIAL_DATE = "2026-05-09";

const palette = ["#4e7658", "#d89035", "#397c8f", "#c45f4b", "#7660a6", "#65724f", "#a35d3b"];

const initialState = {
  geckos: [
    {
      id: "some",
      name: "ソメちゃん",
      species: "スミワケササクレヤモリ",
      sex: "不明",
      memo: "",
    },
    {
      id: "fuku",
      name: "フクちゃん",
      species: "ニホンヤモリ",
      sex: "不明",
      memo: "",
    },
    {
      id: "cocoa",
      name: "ココアちゃん",
      species: "クレステッドゲッコー",
      sex: "不明",
      memo: "",
    },
    {
      id: "mikan",
      name: "オレンジ（みかんちゃん）",
      species: "クレステッドゲッコー",
      sex: "不明",
      memo: "",
    },
    {
      id: "meme",
      name: "メメちゃん",
      species: "ニホンヤモリ",
      sex: "オス",
      memo: "",
    },
  ],
  records: [
    makeRecord("some", INITIAL_DATE, 4, "なし", "通常", false, false, ""),
    makeRecord("fuku", INITIAL_DATE, 2, "なし", "通常", false, false, ""),
    makeRecord("cocoa", INITIAL_DATE, 2, "なし", "食いつき悪い", false, false, "今日は食べず"),
    makeRecord("mikan", INITIAL_DATE, 6, "なし", "食いつき普通", false, false, ""),
    makeRecord("meme", INITIAL_DATE, 0, "なし", "通常", false, false, "これからコオロギフード予定"),
  ],
};

const state = {
  ...loadState(),
  chartDays: 7,
  historyFilter: "",
};

const elements = {
  todayLabel: document.querySelector("#todayLabel"),
  todayTotal: document.querySelector("#todayTotal"),
  alertsList: document.querySelector("#alertsList"),
  resetButton: document.querySelector("#resetButton"),
  geckoForm: document.querySelector("#geckoForm"),
  geckoId: document.querySelector("#geckoId"),
  geckoName: document.querySelector("#geckoName"),
  geckoSpecies: document.querySelector("#geckoSpecies"),
  geckoSex: document.querySelector("#geckoSex"),
  geckoMemo: document.querySelector("#geckoMemo"),
  recordForm: document.querySelector("#recordForm"),
  recordDate: document.querySelector("#recordDate"),
  recordGecko: document.querySelector("#recordGecko"),
  recordCrickets: document.querySelector("#recordCrickets"),
  recordFood: document.querySelector("#recordFood"),
  recordAppetite: document.querySelector("#recordAppetite"),
  recordCleaning: document.querySelector("#recordCleaning"),
  recordHumidity: document.querySelector("#recordHumidity"),
  recordMemo: document.querySelector("#recordMemo"),
  geckoList: document.querySelector("#geckoList"),
  feedingChart: document.querySelector("#feedingChart"),
  chartLegend: document.querySelector("#chartLegend"),
  historyFilter: document.querySelector("#historyFilter"),
  historyList: document.querySelector("#historyList"),
};

elements.recordDate.value = todayInputValue();
bindEvents();
render();

function bindEvents() {
  elements.geckoForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const existingId = elements.geckoId.value;
    const gecko = {
      id: existingId || crypto.randomUUID(),
      name: elements.geckoName.value.trim(),
      species: elements.geckoSpecies.value.trim(),
      sex: elements.geckoSex.value,
      memo: elements.geckoMemo.value.trim(),
    };

    if (!gecko.name || !gecko.species) return;

    if (existingId) {
      state.geckos = state.geckos.map((item) => (item.id === existingId ? gecko : item));
    } else {
      state.geckos.push(gecko);
    }

    elements.geckoForm.reset();
    elements.geckoId.value = "";
    saveState();
    render();
  });

  elements.recordForm.addEventListener("submit", (event) => {
    event.preventDefault();
    state.records.unshift(
      makeRecord(
        elements.recordGecko.value,
        elements.recordDate.value,
        Number(elements.recordCrickets.value),
        elements.recordFood.value,
        elements.recordAppetite.value,
        elements.recordCleaning.checked,
        elements.recordHumidity.checked,
        elements.recordMemo.value.trim(),
      ),
    );

    elements.recordCrickets.value = "";
    elements.recordFood.value = "あり";
    elements.recordAppetite.value = "通常";
    elements.recordCleaning.checked = false;
    elements.recordHumidity.checked = false;
    elements.recordMemo.value = "";
    saveState();
    render();
  });

  document.querySelectorAll(".range-button").forEach((button) => {
    button.addEventListener("click", () => {
      state.chartDays = Number(button.dataset.days);
      document.querySelectorAll(".range-button").forEach((item) => item.classList.toggle("active", item === button));
      renderChart();
    });
  });

  elements.historyFilter.addEventListener("input", () => {
    state.historyFilter = elements.historyFilter.value;
    renderHistory();
  });

  elements.resetButton.addEventListener("click", () => {
    if (!confirm("localStorageの内容を初期データに戻しますか？")) return;
    state.geckos = clone(initialState.geckos);
    state.records = clone(initialState.records);
    saveState();
    render();
  });
}

function render() {
  renderToday();
  renderSelects();
  renderAlerts();
  renderGeckos();
  renderChart();
  renderHistory();
}

function renderToday() {
  const today = todayInputValue();
  const total = state.records.filter((record) => record.date === today).reduce((sum, record) => sum + record.crickets, 0);
  elements.todayLabel.textContent = formatDate(today);
  elements.todayTotal.textContent = `${total}匹`;
}

function renderSelects() {
  const options = state.geckos.map((gecko) => `<option value="${escapeHtml(gecko.id)}">${escapeHtml(gecko.name)}</option>`).join("");
  const filterOptions = `<option value="">すべて</option>${options}`;
  elements.recordGecko.innerHTML = options;
  elements.historyFilter.innerHTML = filterOptions;
  elements.historyFilter.value = state.historyFilter;
}

function renderAlerts() {
  const alerts = buildAlerts();
  elements.alertsList.innerHTML = "";

  if (alerts.length === 0) {
    elements.alertsList.innerHTML = `<div class="empty">現在の警告はありません。直近の記録は落ち着いています。</div>`;
    return;
  }

  alerts.forEach((alert) => {
    const item = document.createElement("article");
    item.className = `alert ${alert.level}`;
    item.innerHTML = `
      <div class="alert-icon">${alert.level === "notice" ? "!" : "!!"}</div>
      <div>
        <strong>${escapeHtml(alert.title)}</strong>
        <span>${escapeHtml(alert.message)}</span>
      </div>
    `;
    elements.alertsList.append(item);
  });
}

function renderGeckos() {
  elements.geckoList.innerHTML = "";

  state.geckos.forEach((gecko) => {
    const latest = getRecordsForGecko(gecko.id)[0];
    const card = document.createElement("article");
    card.className = "gecko-card";
    card.innerHTML = `
      <header>
        <div>
          <h3>${escapeHtml(gecko.name)}</h3>
          <p>${escapeHtml(gecko.species)} / ${escapeHtml(gecko.sex)}</p>
        </div>
      </header>
      <p>${escapeHtml(gecko.memo || "メモなし")}</p>
      <span>最新: ${latest ? `${formatDate(latest.date)} / ${latest.crickets}匹 / ${latest.appetite}` : "記録なし"}</span>
      <div class="card-actions">
        <button class="small-button" type="button" data-action="edit">編集</button>
        <button class="danger-button" type="button" data-action="delete">削除</button>
      </div>
    `;
    card.querySelector('[data-action="edit"]').addEventListener("click", () => editGecko(gecko.id));
    card.querySelector('[data-action="delete"]').addEventListener("click", () => deleteGecko(gecko.id));
    elements.geckoList.append(card);
  });
}

function renderChart() {
  const canvas = elements.feedingChart;
  const rect = canvas.getBoundingClientRect();
  const scale = window.devicePixelRatio || 1;
  canvas.width = Math.max(680, Math.floor(rect.width || 680)) * scale;
  canvas.height = 260 * scale;

  const ctx = canvas.getContext("2d");
  ctx.scale(scale, scale);
  const width = canvas.width / scale;
  const height = canvas.height / scale;
  const padding = { top: 24, right: 18, bottom: 44, left: 38 };
  const dates = buildDateRange(state.chartDays);
  const series = state.geckos.map((gecko, index) => ({
    gecko,
    color: palette[index % palette.length],
    values: dates.map((date) => getDailyCrickets(gecko.id, date)),
  }));
  const totals = dates.map((date) => state.geckos.reduce((sum, gecko) => sum + getDailyCrickets(gecko.id, date), 0));
  const maxValue = Math.max(6, ...series.flatMap((item) => item.values), ...totals);
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const xStep = plotWidth / Math.max(1, dates.length - 1);
  const y = (value) => padding.top + plotHeight - (value / maxValue) * plotHeight;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#fffefb";
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = "#dbe1d2";
  ctx.lineWidth = 1;
  ctx.fillStyle = "#667064";
  ctx.font = "12px system-ui";

  for (let tick = 0; tick <= 4; tick += 1) {
    const value = Math.round((maxValue / 4) * tick);
    const ty = y(value);
    ctx.beginPath();
    ctx.moveTo(padding.left, ty);
    ctx.lineTo(width - padding.right, ty);
    ctx.stroke();
    ctx.fillText(String(value), 10, ty + 4);
  }

  series.forEach((item) => drawLine(ctx, item.values, item.color, dates, xStep, padding, y, false));
  drawLine(ctx, totals, "#19221c", dates, xStep, padding, y, true);

  dates.forEach((date, index) => {
    const x = padding.left + xStep * index;
    if (state.chartDays === 30 && index % 3 !== 0 && index !== dates.length - 1) return;
    ctx.fillStyle = "#667064";
    ctx.fillText(date.slice(5).replace("-", "/"), x - 14, height - 18);
  });

  elements.chartLegend.innerHTML = [
    `<span class="legend-item"><span class="legend-swatch" style="background:#19221c"></span>全個体合計</span>`,
    ...series.map(
      (item) =>
        `<span class="legend-item"><span class="legend-swatch" style="background:${item.color}"></span>${escapeHtml(item.gecko.name)}</span>`,
    ),
  ].join("");
}

function renderHistory() {
  const records = state.records
    .filter((record) => !state.historyFilter || record.geckoId === state.historyFilter)
    .slice()
    .sort((a, b) => `${b.date}${b.createdAt}`.localeCompare(`${a.date}${a.createdAt}`));

  elements.historyList.innerHTML = "";
  if (records.length === 0) {
    elements.historyList.innerHTML = `<div class="empty">まだ記録がありません。</div>`;
    return;
  }

  records.forEach((record) => {
    const gecko = findGecko(record.geckoId);
    const item = document.createElement("article");
    item.className = "history-item";
    item.innerHTML = `
      <div>
        <strong>${formatDate(record.date)} / ${escapeHtml(gecko?.name || "削除済み")} / ${record.crickets}匹</strong>
        <span>フード${escapeHtml(record.food)}、${escapeHtml(record.appetite)}、掃除${record.cleaning ? "あり" : "なし"}、湿度交換${record.humidity ? "あり" : "なし"}${record.memo ? ` / ${escapeHtml(record.memo)}` : ""}</span>
      </div>
      <button class="danger-button" type="button">削除</button>
    `;
    item.querySelector("button").addEventListener("click", () => deleteRecord(record.id));
    elements.historyList.append(item);
  });
}

function drawLine(ctx, values, color, dates, xStep, padding, y, isTotal) {
  ctx.strokeStyle = color;
  ctx.lineWidth = isTotal ? 3 : 2;
  ctx.setLineDash(isTotal ? [7, 4] : []);
  ctx.beginPath();
  values.forEach((value, index) => {
    const x = padding.left + xStep * index;
    const pointY = y(value);
    if (index === 0) ctx.moveTo(x, pointY);
    else ctx.lineTo(x, pointY);
  });
  ctx.stroke();
  ctx.setLineDash([]);

  values.forEach((value, index) => {
    const x = padding.left + xStep * index;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y(value), isTotal ? 3.5 : 3, 0, Math.PI * 2);
    ctx.fill();
  });
}

function buildAlerts() {
  return state.geckos.flatMap((gecko) => {
    const records = getRecordsForGecko(gecko.id);
    const alerts = [];
    const poorStreak = countStreak(records, (record) => record.appetite === "食いつき悪い" || record.appetite === "食べず");
    const zeroStreak = countStreak(records, (record) => record.crickets === 0);

    if (poorStreak >= 2) {
      alerts.push({
        level: "warning",
        title: `${gecko.name}の食欲低下`,
        message: `「食いつき悪い」「食べず」が${poorStreak}回続いています。直近の様子を確認してください。`,
      });
    }

    if (zeroStreak >= 2) {
      alerts.push({
        level: "notice",
        title: `${gecko.name}のコオロギ0匹が継続`,
        message: `コオロギ0匹の記録が${zeroStreak}回続いています。給餌予定やフードの有無を確認してください。`,
      });
    }

    return alerts;
  });
}

function editGecko(id) {
  const gecko = findGecko(id);
  if (!gecko) return;
  elements.geckoId.value = gecko.id;
  elements.geckoName.value = gecko.name;
  elements.geckoSpecies.value = gecko.species;
  elements.geckoSex.value = gecko.sex;
  elements.geckoMemo.value = gecko.memo;
  elements.geckoName.focus();
}

function deleteGecko(id) {
  const gecko = findGecko(id);
  if (!gecko || !confirm(`${gecko.name}を削除しますか？関連する記録も削除されます。`)) return;
  state.geckos = state.geckos.filter((item) => item.id !== id);
  state.records = state.records.filter((record) => record.geckoId !== id);
  saveState();
  render();
}

function deleteRecord(id) {
  state.records = state.records.filter((record) => record.id !== id);
  saveState();
  render();
}

function getRecordsForGecko(geckoId) {
  return state.records
    .filter((record) => record.geckoId === geckoId)
    .slice()
    .sort((a, b) => `${b.date}${b.createdAt}`.localeCompare(`${a.date}${a.createdAt}`));
}

function countStreak(records, predicate) {
  let count = 0;
  for (const record of records) {
    if (!predicate(record)) break;
    count += 1;
  }
  return count;
}

function getDailyCrickets(geckoId, date) {
  return state.records
    .filter((record) => record.geckoId === geckoId && record.date === date)
    .reduce((sum, record) => sum + record.crickets, 0);
}

function buildDateRange(days) {
  const end = parseLocalDate(todayInputValue());
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(end);
    date.setDate(end.getDate() - (days - index - 1));
    return toDateInputValue(date);
  });
}

function makeRecord(geckoId, date, crickets, food, appetite, cleaning, humidity, memo) {
  return {
    id: crypto.randomUUID(),
    geckoId,
    date,
    crickets: Math.max(0, Math.round(Number(crickets) || 0)),
    food,
    appetite,
    cleaning,
    humidity,
    memo,
    createdAt: new Date().toISOString(),
  };
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && Array.isArray(saved.geckos) && Array.isArray(saved.records)) return saved;
  } catch {
    return clone(initialState);
  }
  return clone(initialState);
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ geckos: state.geckos, records: state.records }));
}

function findGecko(id) {
  return state.geckos.find((gecko) => gecko.id === id);
}

function todayInputValue() {
  return toDateInputValue(new Date());
}

function toDateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseLocalDate(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDate(dateString) {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    weekday: "short",
  }).format(parseLocalDate(dateString));
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return entities[character];
  });
}

window.addEventListener("resize", renderChart);

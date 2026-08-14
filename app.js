"use strict";
/* ==================== 数据层 ==================== */
const STORE_KEY = "dailyCheckin.v1";
const HABITS = [
    { id: "english", icon: "🎧", name: "英语提升", auto: true },
    { id: "tech", icon: "💻", name: "技术学习" },
    { id: "reading", icon: "📖", name: "阅读" },
    { id: "exercise", icon: "🏃‍♀️", name: "锻炼" },
    { id: "sugar", icon: "🍬", name: "控糖" },
    { id: "supplement", icon: "💊", name: "补剂", auto: true },
    { id: "water", icon: "💧", name: "喝水", auto: true },
    { id: "skincare", icon: "🧴", name: "护肤" },
    { id: "diary", icon: "✍️", name: "日记" },
    { id: "review", icon: "🌙", name: "复盘", auto: true },
];
const HABIT_ICONS = {
    english: "headphones", tech: "code", reading: "book", exercise: "run",
    sugar: "activity", supplement: "pill", water: "droplet", skincare: "sparkle",
    diary: "edit", review: "moon",
};
const MEALS = [
    { id: "breakfast", icon: "🌅", name: "早餐" },
    { id: "lunch", icon: "☀️", name: "午餐" },
    { id: "dinner", icon: "🌆", name: "晚餐" },
];
const RATINGS = [
    { id: "good", label: "😊 控糖良好", cls: "sel-good" },
    { id: "mid", label: "😐 一般", cls: "sel-mid" },
    { id: "bad", label: "😅 超标了", cls: "sel-bad" },
];
const BOWEL_AMOUNTS = ["少", "中", "多"];
const BOWEL_HEALTH = [
    { id: "good", label: "😊 健康", cls: "sel-good" },
    { id: "mid", label: "😐 一般", cls: "sel-mid" },
    { id: "bad", label: "😟 不佳", cls: "sel-bad" },
];
const EXPENSE_CATS = [
    { id: "餐饮", icon: "🍜" },
    { id: "日用", icon: "🧺" },
    { id: "母婴", icon: "👶" },
    { id: "家庭", icon: "🏠" },
    { id: "交通", icon: "🚕" },
    { id: "医疗", icon: "💊" },
    { id: "购物", icon: "🛍" },
    { id: "娱乐", icon: "🎬" },
    { id: "学习", icon: "📚" },
    { id: "人情", icon: "🎁" },
    { id: "其他", icon: "✨" },
];
/* 任一微任务完成即算「英语提升」当日打卡 */
const ENG_TASKS = [
    { id: "video", icon: "📺", name: "看 1 条英文技术视频", desc: "想刷手机时的替代动作 · 5-10 分钟，程序员的「短视频」", link: "https://www.youtube.com/@Fireship/videos", linkName: "Fireship ▶" },
    { id: "podcast", icon: "🎧", name: "听英文播客 10 分钟", desc: "通勤 / 走路 / 做家务时顺便完成，不占用额外时间", link: "https://syntax.fm/", linkName: "Syntax ▶" },
    { id: "speaking", icon: "🗣️", name: "AI 口语对话 10 分钟", desc: "语音模式：讲今天写的代码 / 预演 standup / mock 会议发言", link: "https://chatgpt.com/", linkName: "ChatGPT ▶" },
    { id: "shadowing", icon: "🔁", name: "跟读 5 句", desc: "看视频时暂停跟读，模仿语音语调；睡前复习也可", link: "https://youglish.com/", linkName: "YouGlish ▶" },
    { id: "phrase", icon: "✍️", name: "记 1 条知识点", desc: "好表达、新单词随时记在下方，可累加，自动完成", auto: true },
];
const ENG_TIPS = [
    "想刷小红书？先看完 1 条 Fireship 再说 —— 它同样是快节奏、有梗的「短视频」，但全程在练听力 👆",
    "最低目标只有 1 项，5 分钟就能完成。先启动，别追求完美 ✊",
    "开会前 2 分钟：用英语在心里预演一遍你要说的话，就当口语练习 🗣️",
    "通勤路上戴上耳机放播客 = 今天已完成 1 项，零成本打卡 🎧",
    "听到同事说了个地道表达？马上记到「今日一句」里 ✍️",
    "连续天数比学习时长更重要 —— 别让 streak 断掉 🔥",
    "把学英语当成刷手机：随手点开、随时暂停、不需要仪式感 📱",
];

function makeRecordId(prefix) {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return `${prefix}_${crypto.randomUUID()}`;
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}
function recordDateTime(date, time) {
    return `${date || todayStr()}T${time || "00:00"}:00`;
}
function recordTimestamp(record, fallbackDate) {
    return (record && record.createdAt) || recordDateTime((record && record.date) || fallbackDate, record && record.time);
}
function recordTimestampValue(record, fallbackDate) {
    const value = Date.parse(recordTimestamp(record, fallbackDate));
    return Number.isFinite(value) ? value : 0;
}
function normalizeTimestampedRecord(record, recordDate) {
    if (!record || typeof record !== "object" || record.createdAt) return false;
    record.createdAt = recordDateTime(record.date || recordDate, record.time);
    return true;
}
function normalizeThoughtRecord(t, recordDate) {
    if (!t || typeof t !== "object") return false;
    let changed = false;
    if (!Array.isArray(t.tags)) {
        t.tags = t.tag ? [t.tag] : [];
        changed = true;
    }
    const tags = Array.from(new Set(t.tags.map(x => String(x || "").trim()).filter(Boolean)));
    if (tags.length !== t.tags.length || tags.some((x, i) => x !== t.tags[i])) { t.tags = tags; changed = true; }
    if (Object.prototype.hasOwnProperty.call(t, "tag")) { delete t.tag; changed = true; }
    if (!t.date) { t.date = recordDate; changed = true; }
    if (normalizeTimestampedRecord(t, recordDate)) changed = true;
    return changed;
}
function normalizeTaskRecord(t, createdDate, index) {
    if (!t || typeof t !== "object") return false;
    let changed = false;
    if (!t.id) { t.id = `task_${String(createdDate).replace(/-/g, "")}_${index}_${Math.random().toString(36).slice(2, 8)}`; changed = true; }
    if (!t.createdDate) { t.createdDate = createdDate; changed = true; }
    if (!t.scheduledDate || t.scheduledDate !== createdDate) { t.scheduledDate = createdDate; changed = true; }
    if (t.createdTime == null) { t.createdTime = ""; changed = true; }
    if (t.done) {
        if (!t.completedDate) { t.completedDate = createdDate; changed = true; }
        if (t.completedTime == null || (!t.completedTime && t.time)) { t.completedTime = t.time || ""; changed = true; }
    } else {
        if (t.completedDate) { t.completedDate = ""; changed = true; }
        if (t.completedTime) { t.completedTime = ""; changed = true; }
    }
    if (Object.prototype.hasOwnProperty.call(t, "time")) { delete t.time; changed = true; }
    return changed;
}
function migrateStoreData(s) {
    let changed = false;
    Object.keys(s.days || {}).forEach(d => {
        const o = s.days[d] || {};
        (o.thoughts || []).forEach(t => { if (normalizeThoughtRecord(t, d)) changed = true; });
        (o.pregDiaries || []).forEach(t => { if (normalizeTimestampedRecord(t, d)) changed = true; });
        (o.tasks || []).forEach((t, i) => { if (normalizeTaskRecord(t, d, i)) changed = true; });
    });
    return changed;
}

let store = loadStore();
let currentDate = todayStr();
let calYear, calMonth; // 日历视图
let kType = "播客";
// 首页折叠状态（Phase 2）
let planHideDone = (store.settings && store.settings.planHideDone !== undefined) ? !!store.settings.planHideDone : true; // 每日计划：是否隐藏已完成（默认折叠已完成）
let tasksShowDone = false;    // 临时任务：是否展开已完成分组
let todoCenterShowDone = false;

function loadStore() {
    let s;
    try {
        const raw = localStorage.getItem(STORE_KEY);
        if (raw) s = JSON.parse(raw);
    } catch (e) { console.error(e); }
    if (!s || typeof s !== "object") s = {};
    s.days = s.days || {};
    s.settings = s.settings || {};
    s.settings.supplements = s.settings.supplements || ["DHA", "钙", "铁", "复合维生素"];
    s.settings.symptomTags = s.settings.symptomTags || ["腰疼", "背疼", "手疼", "腿疼", "腿麻", "肚子疼", "胃酸", "胃疼"];
    s.settings.thoughtTags = s.settings.thoughtTags || ["梦", "情绪", "技能", "工作", "idea", "复盘", "人际", "好物", "其他"];
    if (migrateStoreData(s)) {
        try { localStorage.setItem(STORE_KEY, JSON.stringify(s)); } catch (e) { console.error(e); }
    }
    return s;
}
function save() { localStorage.setItem(STORE_KEY, JSON.stringify(store)); }
function day(d) {
    d = d || currentDate;
    if (!store.days[d]) store.days[d] = {};
    const o = store.days[d];
    o.habits = o.habits || {};   // {id:{done,time}}
    o.waterLogs = o.waterLogs || [];   // [{time,amount}]
    o.supplements = o.supplements || {};   // {name:{done,time}}
    o.review = o.review || "";
    o.reviewTime = o.reviewTime || "";
    o.reviews = o.reviews || [];   // [{text,time}]
    if (o.review && o.review.trim()) o.reviews.push({ text: o.review.trim(), time: o.reviewTime || "" });
    delete o.review; delete o.reviewTime;
    o.gratitude = o.gratitude || [];   // [{text,time}]
    o.meals = o.meals || {};   // {breakfast:{food,rating,time}}
    o.snacks = o.snacks || [];   // [{food,rating,time}]
    o.exercises = o.exercises || [];   // [{text,time}]
    o.bowels = o.bowels || [];   // [{honey,amount,healthy,note,time}]
    o.expenses = o.expenses || [];   // [{amount,cat,note,time}]
    o.wishes = o.wishes || [];   // [{item,amount,reason,status:"cooling"|"resisted"|"bought",time,date,decidedAt}]
    // 迁移旧版固定加餐
    if (o.meals.snack && (o.meals.snack.food || o.meals.snack.rating)) {
        o.snacks.push({ food: o.meals.snack.food || "", rating: o.meals.snack.rating || "", time: o.meals.snack.time || "" });
    }
    delete o.meals.snack;
    o.pregDiary = o.pregDiary || "";
    o.pregDiaryTime = o.pregDiaryTime || "";
    o.pregDiaries = o.pregDiaries || [];   // [{text,time,createdAt}]
    if (o.pregDiary && o.pregDiary.trim()) o.pregDiaries.push({ text: o.pregDiary.trim(), time: o.pregDiaryTime || "" });
    delete o.pregDiary; delete o.pregDiaryTime;
    o.media = o.media || [];   // [{text,tag,time}] 自媒体运营
    o.thoughts = o.thoughts || [];   // [{text,tags:[],time,date,createdAt}]
    o.knowledge = o.knowledge || [];   // [{text,type,time}]
    o.tasks = o.tasks || [];   // [{id,text,done,createdDate,createdTime,scheduledDate,completedDate,completedTime}]
    o.pregDiaries.forEach(t => normalizeTimestampedRecord(t, d));
    o.thoughts.forEach(t => normalizeThoughtRecord(t, d));
    o.tasks.forEach((t, i) => normalizeTaskRecord(t, d, i));
    o.weight = o.weight || null;   // {value,time,note}
    o.sleep = o.sleep || null;   // {quality:"good"|"mid"|"bad",time}
    o.symptoms = o.symptoms || [];   // [{tag,time}]
    o.techLogs = o.techLogs || [];   // [{text,time}]
    o.english = o.english || { tasks: {} }; // tasks: {id:{count,time}}
    o.english.tasks = o.english.tasks || {};
    o.english.phrases = o.english.phrases || []; // [{text,time}]
    // 迁移旧版单条 phrase 字符串
    if (o.english.phrase && o.english.phrase.trim()) {
        o.english.phrases.push({ text: o.english.phrase.trim(), time: o.english.phraseTime || "" });
        delete o.english.phrase; delete o.english.phraseTime;
    }
    // 迁移旧版英语微任务 done → count
    Object.keys(o.english.tasks).forEach(k => {
        const t = o.english.tasks[k];
        if (t && t.count == null) { t.count = t.done ? 1 : 0; delete t.done; }
        if (t && t.count <= 0 && !(t.notes && t.notes.length)) delete o.english.tasks[k]; // 有备注则保留
    });
    return o;
}
function todayStr() {
    const d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}
function nowTime() {
    const d = new Date();
    return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
}
function waterTotal(d) { return day(d).waterLogs.reduce((s, l) => s + l.amount, 0); }
function isHabitDone(id, d) {
    const o = day(d);
    // english 兼容旧版手动打卡数据
    if (id === "english") return ENG_TASKS.some(t => isEngTaskDone(t.id, d)) || !!(o.habits.english && o.habits.english.done);
    if (id === "tech") return o.techLogs.length > 0 || !!(o.habits.tech && o.habits.tech.done);
    if (id === "water") return waterTotal(d) >= waterGoal();
    if (id === "supplement") {
        const list = store.settings.supplements;
        return list.length > 0 && list.every(n => o.supplements[n] && o.supplements[n].done);
    }
    if (id === "review") return day(d).reviews.length > 0;
    return !!(o.habits[id] && o.habits[id].done);
}
function habitDoneCount(d) { return activeHabits().filter(h => isHabitDone(h.id, d)).length; }
function allHabitDefs() { return [...HABITS, ...(store.settings.customHabits || [])]; }
function activeHabits() {
    const hidden = store.settings.habitHidden || {};
    return orderedHabitDefs().filter(h => !hidden[h.id]);
}
function waterGoal() { return store.settings.waterGoal || 2000; }
function waterCup() { return store.settings.waterCup || 200; }

/* ==================== 日期切换 ==================== */
function setDate(d) {
    if (!d) return;
    currentDate = d;
    const dt = new Date(d + "T12:00:00");
    const wd = ["日", "一", "二", "三", "四", "五", "六"][dt.getDay()];
    const tip = document.getElementById("notTodayTip");
    if (d === todayStr()) {
        tip.style.display = "none";
    } else {
        document.getElementById("notTodayText").textContent = `${dt.getMonth() + 1}月${dt.getDate()}日 周${wd}`;
        tip.style.display = "flex";
    }
    renderAll();
}
function pickDate() {
    openAppDatePicker({
        title: "选择查看日期",
        hint: "切换日期后，可以查看记录或补录当天内容",
        value: currentDate,
        onSave: setDate,
    });
}
let appDatePickerSelected = todayStr();
let appDatePickerYear = new Date().getFullYear();
let appDatePickerMonth = new Date().getMonth();
let appDatePickerSaveHandler = null;
function openAppDatePicker(options) {
    const selected = options.value || todayStr();
    const dt = new Date(selected + "T12:00:00");
    closeSheet();
    appDatePickerSelected = selected;
    appDatePickerYear = dt.getFullYear();
    appDatePickerMonth = dt.getMonth();
    appDatePickerSaveHandler = options.onSave;
    setTxt("datePickerSheetTitle", options.title || "选择日期");
    setTxt("datePickerHint", options.hint || "选择一个日期后确认");
    renderAppDatePicker();
    openSheet("datePickerSheet");
}
function datePickerLabel(d) {
    const dt = new Date(d + "T12:00:00");
    const wd = ["日", "一", "二", "三", "四", "五", "六"][dt.getDay()];
    return `${dt.getFullYear()}年${dt.getMonth() + 1}月${dt.getDate()}日 · 周${wd}`;
}
function renderAppDatePicker() {
    const grid = document.getElementById("datePickerGrid");
    if (!grid) return;
    setTxt("datePickerMonthLabel", `${appDatePickerYear} 年 ${appDatePickerMonth + 1} 月`);
    setTxt("datePickerSelectedLabel", datePickerLabel(appDatePickerSelected));
    const firstDay = new Date(appDatePickerYear, appDatePickerMonth, 1).getDay();
    const daysInMonth = new Date(appDatePickerYear, appDatePickerMonth + 1, 0).getDate();
    const today = todayStr();
    let html = "";
    for (let i = 0; i < firstDay; i++) html += `<span class="date-picker-blank" aria-hidden="true"></span>`;
    for (let n = 1; n <= daysInMonth; n++) {
        const d = `${appDatePickerYear}-${String(appDatePickerMonth + 1).padStart(2, "0")}-${String(n).padStart(2, "0")}`;
        const selected = d === appDatePickerSelected;
        const hasData = !!store.days[d];
        html += `<button type="button" role="gridcell" class="date-picker-day ${d === today ? "today" : ""} ${selected ? "selected" : ""} ${hasData ? "has-data" : ""}" aria-selected="${selected}" aria-label="${datePickerLabel(d)}${hasData ? "，已有记录" : ""}" onclick="selectAppDate('${d}')"><span>${n}</span>${hasData ? '<i aria-hidden="true"></i>' : ""}</button>`;
    }
    grid.innerHTML = html;
}
function selectAppDate(d) {
    appDatePickerSelected = d;
    renderAppDatePicker();
}
function shiftDatePickerMonth(n) {
    appDatePickerMonth += n;
    if (appDatePickerMonth < 0) { appDatePickerMonth = 11; appDatePickerYear--; }
    if (appDatePickerMonth > 11) { appDatePickerMonth = 0; appDatePickerYear++; }
    renderAppDatePicker();
}
function pickDateShortcut(days) {
    const base = new Date(todayStr() + "T12:00:00");
    base.setDate(base.getDate() + days);
    const d = `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, "0")}-${String(base.getDate()).padStart(2, "0")}`;
    appDatePickerSelected = d;
    appDatePickerYear = base.getFullYear();
    appDatePickerMonth = base.getMonth();
    renderAppDatePicker();
}
function confirmDatePicker() {
    if (!appDatePickerSaveHandler || !appDatePickerSelected) return;
    const handler = appDatePickerSaveHandler;
    appDatePickerSaveHandler = null;
    closeSheet();
    handler(appDatePickerSelected);
}
function renderAppTitle() {
    const t = store.settings.appTitle || "CC GOGOGO";
    const el = document.getElementById("appTitle");
    if (el) el.textContent = t;
    document.title = t.replace(/^[^\w\u4e00-\u9fa5]+/, "").trim() || "CC GOGOGO";
    renderProfile();
}
function renderProfile() {
    setTxt("profileName", store.settings.appTitle || "CC GOGOGO");
    const streak = overallStreak();
    const fallback = streak > 0 ? `已连续记录 ${streak} 天 · 继续加油` : "今天，比昨天更好一点";
    const custom = (store.settings.profileSubtitle || "").trim();
    setTxt("profileSub", custom || fallback);
}
function editTitle(e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    const input = document.getElementById("titleInput");
    if (!input) {
        const cur = store.settings.appTitle || "CC GOGOGO";
        const v = prompt("自定义标题（可含 emoji）：", cur);
        if (v === null) return;
        store.settings.appTitle = v.trim() || "CC GOGOGO";
        save(); renderAppTitle();
        return;
    }
    const cur = store.settings.appTitle || "CC GOGOGO";
    const subInput = document.getElementById("profileSubInput");
    input.value = cur;
    if (subInput) subInput.value = store.settings.profileSubtitle || "";
    openSheet("titleSheet");
    setTimeout(() => {
        input.focus();
        input.select();
    }, 40);
}
function saveTitleFromSheet() {
    const input = document.getElementById("titleInput");
    const subInput = document.getElementById("profileSubInput");
    if (!input) return;
    store.settings.appTitle = input.value.trim() || "CC GOGOGO";
    if (subInput) {
        const sub = subInput.value.trim();
        if (sub) store.settings.profileSubtitle = sub;
        else delete store.settings.profileSubtitle;
    }
    save();
    renderAppTitle();
    closeSheet();
}
function shiftDate(n) {
    const d = new Date(currentDate + "T12:00:00");
    d.setDate(d.getDate() + n);
    setDate(d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"));
}

/* ==================== 图标（Lucide 内联 SVG，离线可用） ==================== */
const ICON_PATHS = {
    home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9"/>',
    plan: '<path d="m3 17 2 2 4-4"/><path d="m3 7 2 2 4-4"/><path d="M13 6h8"/><path d="M13 12h8"/><path d="M13 18h8"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    utensils: '<path d="M4 3v7a2 2 0 0 0 4 0V3"/><path d="M6 11v10"/><path d="M18 3c-1.7 0-3 2-3 5v4h3"/><path d="M18 3v18"/>',
    apple: '<path d="M12 20.9c1.5 0 2.7 1 4 1 2.9 0 5.9-7.9 5.9-12A4.8 4.8 0 0 0 17 5c-2.1 0-3.9 1.4-5 2-1-.6-2.8-2-4.9-2A4.8 4.8 0 0 0 2 9.9C2 14 5 22 8 22c1.2 0 2.4-1.1 4-1.1Z"/><path d="M10 2c1 .5 2 2 2 5"/>',
    droplet: '<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>',
    pill: '<path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/>',
    activity: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
    record: '<circle cx="12" cy="12" r="8"/>',
    scale: '<circle cx="12" cy="5" r="2"/><path d="M6 9h12l2 11H4Z"/>',
    bed: '<path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/>',
    thermometer: '<path d="M14 4v10.5a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/>',
    headphones: '<path d="M3 14v3a2 2 0 0 0 2 2h1v-7H5a2 2 0 0 0-2 2Z"/><path d="M21 14v3a2 2 0 0 1-2 2h-1v-7h1a2 2 0 0 1 2 2Z"/><path d="M4 14a8 8 0 0 1 16 0"/>',
    code: '<path d="m16 18 6-6-6-6"/><path d="m8 6-6 6 6 6"/>',
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/>',
    moon: '<path d="M12 3a6.4 6.4 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
    heart: '<path d="M20.8 5.6a5.5 5.5 0 0 0-7.8 0L12 6.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.6Z"/>',
    notebook: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8"/><path d="M8 10h8"/><path d="M8 14h5"/>',
    sunset: '<path d="M12 10V3"/><path d="m8 6 4 4 4-4"/><path d="M2 18h20"/><path d="M4 14h2"/><path d="M18 14h2"/><path d="M7 14a5 5 0 0 1 10 0"/>',
    lightbulb: '<path d="M9 18h6"/><path d="M10 22h4"/><path d="M8 14a5 5 0 1 1 8 0c-.7.9-1 1.4-1 2H9c0-.6-.3-1.1-1-2Z"/>',
    megaphone: '<path d="m3 11 15-6v14l-15-6z"/><path d="M4 11v4a1 1 0 0 0 1 1h2"/>',
    wallet: '<path d="M3 7a2 2 0 0 1 2-2h13a1 1 0 0 1 1 1v3"/><path d="M3 7v12a2 2 0 0 0 2 2h14a1 1 0 0 0 1-1v-3"/><path d="M21 12h-4a2 2 0 0 0 0 4h4"/>',
    snowflake: '<path d="M12 2v20"/><path d="M2 12h20"/><path d="m5 5 14 14"/><path d="m19 5-14 14"/>',
    chart: '<path d="M4 20V10"/><path d="M10 20V4"/><path d="M16 20v-7"/><path d="M2 20h20"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4-4"/>',
    clipboard: '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M9 12h6"/><path d="M9 16h6"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M8 2v4"/><path d="M16 2v4"/><path d="M3 10h18"/>',
    trend: '<path d="m3 17 6-6 4 4 8-8"/><path d="M17 7h4v4"/>',
    table: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M12 3v18"/>',
    drive: '<path d="M4 14h16"/><path d="m5 14 2-9h10l2 9"/><path d="M4 14v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4"/><circle cx="8" cy="17" r=".5" fill="currentColor"/>',
    sliders: '<path d="M4 6h8"/><path d="M18 6h2"/><path d="M4 12h4"/><path d="M12 12h8"/><path d="M4 18h10"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
    alert: '<path d="M10.3 4 2 18a2 2 0 0 0 1.7 3h16.6a2 2 0 0 0 1.7-3L13.7 4a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
    mic: '<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0"/><path d="M12 17v5"/>',
    square: '<rect x="4" y="4" width="16" height="16" rx="3"/>',
    copy: '<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M4 16a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2"/>',
    share: '<path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7"/><path d="m8 6 4-4 4 4"/><path d="M12 2v14"/>',
    package: '<path d="M21 8 12 3 3 8v8l9 5 9-5Z"/><path d="m3 8 9 5 9-5"/><path d="M12 13v9"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
    trash: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    'chevron-down': '<path d="m6 9 6 6 6-6"/>',
    'chevron-left': '<path d="m15 18-6-6 6-6"/>',
    'chevron-right': '<path d="m9 18 6-6-6-6"/>',
    leaf: '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 6 6v2"/>',
    run: '<circle cx="13" cy="4" r="2"/><path d="m8 22 3-7 2 2v5"/><path d="M6 12l4-5 4 2 3 3"/><path d="M17 22l-3-5"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/>',
    sparkle: '<path d="m12 3 1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6Z"/>',
    list: '<path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/>',
    plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
};
function icon(name) {
    const p = ICON_PATHS[name]; if (!p) return "";
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
}
function renderIcons(root) {
    (root || document).querySelectorAll("[data-ic]").forEach(el => {
        if (el.dataset.icDone) return;
        el.innerHTML = icon(el.dataset.ic);
        el.dataset.icDone = "1";
    });
}
function entryActions(editCall, deleteCall, editLabel, deleteLabel) {
    return `<div class="entry-actions">
      ${editCall ? `<button type="button" class="entry-edit" onclick="${editCall}" aria-label="${escAttr(editLabel || "编辑记录")}" title="${escAttr(editLabel || "编辑记录")}">${icon("edit")}</button>` : ""}
      ${deleteCall ? `<button type="button" class="entry-delete" onclick="${deleteCall}" aria-label="${escAttr(deleteLabel || "删除记录")}" title="${escAttr(deleteLabel || "删除记录")}">${icon("trash")}</button>` : ""}
    </div>`;
}

/* ==================== Tabs ==================== */
let activeBottomNav = "home";
const TAB_TO_NAV = {
    home: "home", record: "record", growth: "growth", review: "review",
    settings: "mine", data: "mine", wealth: "record", health: "record",
    customize: "mine", about: "mine", todos: "home",
};
function setBottomNav(navKey) {
    activeBottomNav = navKey;
    document.querySelectorAll("#bottomTabs button").forEach(b => b.classList.toggle("active", b.dataset.nav === activeBottomNav));
}
function switchTab(tab, navKey) {
    document.querySelectorAll("nav.tabs button").forEach(b => b.classList.toggle("active", b.dataset.tab === tab));
    document.querySelectorAll(".tab-page").forEach(p => p.classList.toggle("active", p.id === "page-" + tab));

    if (navKey) setBottomNav(navKey);
    else setBottomNav(TAB_TO_NAV[tab] || null);

    if (tab === "data") { renderHistory(); renderBackupTip(); ensurePersistentStorage(); }
    if (tab === "record") { renderRecordFilterRow(); renderRecordTimeline(); }
    if (tab === "growth") renderGrowthOverview();
    if (tab === "health") renderHealthOverview();
    if (tab === "review") renderReviewOverview();
    if (tab === "todos") renderTodoCenter();
    if (tab === "settings") renderProfile();
    if (tab === "customize") { renderHabitManager(); renderModuleManager(); }
}
function openDataSection(collapseId, focusId) {
    switchTab("data");
    const card = document.querySelector(`#page-data [data-collapse="${collapseId}"]`);
    if (card) card.classList.remove("collapsed");
    setTimeout(() => {
        const target = document.getElementById(focusId);
        if (!target) return;
        target.scrollIntoView({ behavior: "smooth", block: "center" });
        target.focus({ preventScroll: true });
    }, 60);
}
const topTabs = document.getElementById("tabs");
if (topTabs) topTabs.addEventListener("click", e => {
    const btn = e.target.closest("button"); if (!btn) return;
    switchTab(btn.dataset.tab);
});
document.getElementById("bottomTabs").addEventListener("click", e => {
    const btn = e.target.closest("button"); if (!btn) return;
    switchTab(btn.dataset.tab, btn.dataset.nav);
    const target = btn.dataset.scroll;
    if (!target) return;
    if (target === "top") {
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
    }
    const el = document.getElementById(target);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
});

/* ==================== 通用组件 ==================== */
let toastTimer = null;
function showToast(msg) {
    const t = document.getElementById("toast");
    if (!t) return;
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
}
function openSheet(id) {
    const scrim = document.getElementById("sheetScrim");
    const sheet = document.getElementById(id);
    if (!sheet || !scrim) return;
    scrim.classList.add("open");
    sheet.classList.add("open");
}
let editorSaveHandler = null;
let editorAllowEmpty = false;
function updateEditorCount() {
    const ta = document.getElementById("editorTextarea");
    const count = document.getElementById("editorCount");
    if (ta && count) count.textContent = `${ta.value.length} 字`;
}
function openTextEditor(options) {
    const ta = document.getElementById("editorTextarea");
    if (!ta) return;
    closeSheet();
    editorAllowEmpty = !!options.allowEmpty;
    editorSaveHandler = options.onSave;
    setTxt("editorSheetTitle", options.title || "编辑记录");
    setTxt("editorHint", options.hint || "支持长文本和换行；按 ⌘/Ctrl + Enter 快速保存");
    ta.value = options.value || "";
    ta.placeholder = options.placeholder || "请输入内容…";
    updateEditorCount();
    openSheet("editorSheet");
    setTimeout(() => {
        ta.focus();
        ta.setSelectionRange(ta.value.length, ta.value.length);
    }, 40);
}
function openDateEditor(options) {
    openAppDatePicker({
        title: options.title || "移动 Todo 到指定日期",
        hint: options.hint || "选择后，Todo 会出现在目标日期；原始创建时间保持不变",
        value: options.value || currentDate,
        onSave: options.onSave,
    });
}
function saveEditorSheet() {
    if (!editorSaveHandler) return;
    const value = document.getElementById("editorTextarea").value.trim();
    if (!value && !editorAllowEmpty) { showToast("内容不能为空"); return; }
    const handler = editorSaveHandler;
    editorSaveHandler = null;
    closeSheet();
    handler(value);
}
function editRecordText(type, d, i, extra) {
    const o = day(d);
    let target = null, field = "text", title = "编辑记录", allowEmpty = false;
    if (type === "review") { target = o.reviews[i]; title = "编辑复盘"; }
    else if (type === "gratitude") { target = o.gratitude[i]; title = "编辑感恩记录"; }
    else if (type === "exercise") { target = o.exercises[i]; title = "编辑锻炼记录"; }
    else if (type === "bowel") { target = o.bowels[i]; field = "note"; title = "编辑排便备注"; allowEmpty = true; }
    else if (type === "pregDiary") { target = o.pregDiaries[i]; title = "编辑孕期日记"; }
    else if (type === "tech") { target = o.techLogs[i]; title = "编辑技术笔记"; }
    else if (type === "media") { target = o.media[i]; title = "编辑运营记录"; }
    else if (type === "thought") { target = o.thoughts[i]; title = "编辑想法"; }
    else if (type === "knowledge") { target = o.knowledge[i]; title = "编辑知识记录"; }
    else if (type === "phrase") { target = o.english.phrases[i]; title = "编辑英语知识点"; }
    else if (type === "engNote") { target = o.english.tasks[extra] && o.english.tasks[extra].notes && o.english.tasks[extra].notes[i]; title = "编辑英语备注"; }
    else if (type === "expense") { target = o.expenses[i]; field = "note"; title = "编辑开支备注"; allowEmpty = true; }
    else if (type === "wishItem") { target = o.wishes[i]; field = "item"; title = "编辑想买物品"; }
    else if (type === "wishReason") { target = o.wishes[i]; field = "reason"; title = "编辑购买理由"; allowEmpty = true; }
    if (!target) return;
    openTextEditor({
        title,
        value: target[field] || "",
        allowEmpty,
        onSave: value => {
            target[field] = value;
            target.updatedAt = recordDateTime(todayStr(), nowTime());
            save(); renderAll(); showToast("已保存修改");
        },
    });
}
function closeSheet() {
    const editor = document.getElementById("editorSheet");
    const editorWasOpen = !!(editor && editor.classList.contains("open"));
    const datePicker = document.getElementById("datePickerSheet");
    const datePickerWasOpen = !!(datePicker && datePicker.classList.contains("open"));
    document.querySelectorAll(".sheet.open").forEach(s => s.classList.remove("open"));
    const scrim = document.getElementById("sheetScrim");
    if (scrim) scrim.classList.remove("open");
    if (editorWasOpen) editorSaveHandler = null;
    if (datePickerWasOpen) appDatePickerSaveHandler = null;
}
document.addEventListener("keydown", e => {
    if (e.key === "Escape") closeSheet();
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && document.getElementById("editorSheet").classList.contains("open")) {
        e.preventDefault(); saveEditorSheet();
    }
});

function expandCollapseCard(collapseId) {
    if (!collapseId) return;
    const card = document.querySelector(`.card.collapsible[data-collapse="${collapseId}"]`);
    if (!card || !card.classList.contains("collapsed")) return;
    card.classList.remove("collapsed");
    store.settings.collapsed = store.settings.collapsed || {};
    store.settings.collapsed[collapseId] = false;
    save();
}

/* 快速记录 · 从底部 Sheet 跳转到对应的既有输入区（不改数据结构） */
function openQuickRecord() { openSheet("quickSheet"); }
const QUICK_TARGETS = {
    study: { tab: "growth", focus: "techInput", collapse: "g-tech" },
    meal: { tab: "health", scroll: "mealBlocks", collapse: "h-meals" },
    water: { tab: "health", scroll: "card-water", collapse: "h-water" },
    expense: { tab: "wealth", focus: "expenseAmount" },
    thought: { tab: "review", focus: "thoughtInput", collapse: "thoughts" },
    diary: { tab: "review", focus: "pregDiaryInput", collapse: "diary" },
    gratitude: { tab: "review", focus: "gratitudeInput", collapse: "gratitude" },
    symptom: { tab: "health", scroll: "symptomList", collapse: "h-symptoms" },
    todo: { tab: "home", focus: "taskInput" },
};
function quickRecord(key) {
    const t = QUICK_TARGETS[key];
    closeSheet();
    if (!t) return;
    switchTab(t.tab);
    expandCollapseCard(t.collapse);
    setTimeout(() => {
        if (t.scroll === "top") { window.scrollTo({ top: 0, behavior: "smooth" }); return; }
        let el = document.getElementById(t.focus || t.scroll);
        if (!el && t.collapse) el = document.querySelector(`.card.collapsible[data-collapse="${t.collapse}"]`);
        if (!el) return;
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        if (t.focus && typeof el.focus === "function") el.focus({ preventScroll: true });
    }, 60);
}

/* ==================== 习惯打卡 ==================== */
function toggleHabit(id) {
    const h = allHabitDefs().find(x => x.id === id);
    if (h && h.auto) return;
    const o = day();
    if (o.habits[id] && o.habits[id].done) delete o.habits[id];
    else o.habits[id] = { done: true, time: nowTime() };
    save(); renderToday();
}
function renderHabits() {
    const grid = document.getElementById("habitGrid");
    // 未完成优先，已完成弱化并沉到末尾（Phase 2）
    const habits = activeHabits().map(h => ({ h, done: isHabitDone(h.id) }));
    habits.sort((a, b) => (a.done ? 1 : 0) - (b.done ? 1 : 0));
    const visible = planHideDone ? habits.filter(x => !x.done) : habits;
    grid.innerHTML = visible.length ? visible.map(({ h, done }) => {
        let time = "";
        if (done) {
            const o = day();
            if (h.id === "water") { const last = o.waterLogs[o.waterLogs.length - 1]; time = last ? last.time : ""; }
            else if (h.id === "supplement") { const ts = Object.values(o.supplements).filter(s => s.done).map(s => s.time).sort(); time = ts[ts.length - 1] || ""; }
            else if (h.id === "review") { const rs = o.reviews; time = rs.length ? rs[rs.length - 1].time : ""; }
            else if (h.id === "english") { const ts = Object.values(o.english.tasks).filter(t => t.count > 0).map(t => t.time).concat(o.english.phrases.map(p => p.time)).filter(Boolean).sort(); time = ts[ts.length - 1] || ""; }
            else if (h.id === "tech") { const ts = o.techLogs.map(t => t.time).concat(o.habits.tech && o.habits.tech.done ? [o.habits.tech.time] : []).filter(Boolean).sort(); time = ts[ts.length - 1] || ""; }
            else time = o.habits[h.id].time || "";
        }
                const meta = h.auto ? autoHabitProgressText(h.id) : (done ? (time || "已完成") : "");
        const onClick = h.auto ? `openAutoHabit('${h.id}')` : `toggleHabit('${h.id}')`;
                const metaHtml = meta ? `<span class="meta">${meta}</span>` : "";
        return `<button type="button" class="habit-item ${done ? "done" : ""} ${h.auto ? "auto" : ""}" onclick="${onClick}" title="${h.auto ? "查看该自动项详情" : "点击打卡"}">
      <span class="habit-ic">${HABIT_ICONS[h.id] ? icon(HABIT_ICONS[h.id]) : h.icon}</span>
                        <span class="habit-info"><span class="name">${h.name}</span>${metaHtml}</span>
      <span class="habit-check">${done ? icon("check") : ""}</span>
    </button>`;
    }).join("") : `<div class="empty-tip">今天都完成啦，点击右下角可展开已完成 ✅</div>`;
    const n = habitDoneCount(), total = activeHabits().length;
    const hp = document.getElementById("habitProgress");
    if (hp) hp.textContent = `${n}/${total}`;
    document.getElementById("habitBar").style.width = (total ? n / total * 100 : 0) + "%";
    const streak = overallStreak();
    const leftTxt = n === total ? "🎉 今日全部完成" : `已完成 ${n} / ${total}`;
    const rightTxt = n > 0
        ? `<button type="button" class="plan-done-toggle" onclick="togglePlanDone()">${planHideDone ? `显示已完成 (${n})` : "隐藏已完成"}</button>`
        : (streak > 1 ? `🔥 连续 ${streak} 天` : "");
    document.getElementById("habitBarText").innerHTML = `<span>${leftTxt}</span><span>${rightTxt}</span>`;
    renderHeroMetrics(n, total, streak);
}
function autoHabitProgressText(id, d) {
    d = d || currentDate;
    if (id === "water") return `${waterTotal(d)}/${waterGoal()}ml`;
    if (id === "supplement") {
        const o = day(d);
        const list = store.settings.supplements || [];
        const done = list.filter(n => o.supplements[n] && o.supplements[n].done).length;
        return `${done}/${list.length}`;
    }
    if (id === "english") {
        const done = ENG_TASKS.filter(t => isEngTaskDone(t.id, d)).length;
        return `${done}/${ENG_TASKS.length}`;
    }
    if (id === "review") return `${day(d).reviews.length} 条`;
    return "";
}
function openAutoHabit(id) {
    if (id === "review") {
        switchTab("review");
        reviewStart();
        return;
    }
    const targets = {
        english: { tab: "growth", collapse: "g-english", focus: "engPhrase" },
        water: { tab: "health", collapse: "h-water", scroll: "card-water" },
        supplement: { tab: "health", collapse: "h-supp", scroll: "card-supplement" },
    };
    const t = targets[id];
    if (!t) return;
    switchTab(t.tab);
    expandCollapseCard(t.collapse);
    setTimeout(() => {
        const el = document.getElementById(t.focus || t.scroll);
        if (!el) return;
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        if (t.focus && typeof el.focus === "function") el.focus({ preventScroll: true });
    }, 80);
}
function togglePlanDone() {
    planHideDone = !planHideDone;
    store.settings.planHideDone = planHideDone;
    save();
    renderHabits();
}
function setTxt(id, v) { const el = document.getElementById(id); if (el) el.textContent = v; }
function setMetric(id, num, unit) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = `${num}${unit ? `<i class="m-unit">${unit}</i>` : ""}`;
}
function renderHeroMetrics(done, total, streak) {
    const ring = document.getElementById("heroRing");
    if (!ring) return;
    const pct = total ? Math.round(done / total * 100) : 0;
    ring.style.setProperty("--p", pct);
    setTxt("heroRingPct", pct + "%");
    setTxt("heroRingText", (done === total && total) ? "今日全部完成 🎉" : `今日计划 ${done}/${total}`);
    setTxt("heroGreeting", heroGreeting());
    setTxt("heroStreakLine", streak > 0 ? `🔥 已连续记录 ${streak} 天` : "完成任意 1 项，开启连续记录");
    const weight = day(currentDate).weight;
    setMetric("heroWeight", weight && weight.value != null ? weight.value : "—", weight && weight.value != null ? "kg" : "");
    setMetric("heroWater", waterTotal(), "ml");
    setMetric("heroExpense", "¥" + fmtMoney(expenseTotal(currentDate)), "");
}
function heroGreeting() {
    const hr = new Date().getHours();
    if (hr < 6) return "夜深了";
    if (hr < 11) return "早上好";
    if (hr < 14) return "中午好";
    if (hr < 18) return "下午好";
    return "晚上好";
}
function overallStreak() {
    const today = todayStr();
    let streak = 0;
    for (let i = 0; ; i++) {
        const d = offsetDate(today, -i);
        if (habitDoneCount(d) >= 1) streak++;
        else { if (i === 0) continue; break; } // 今天还没打卡不打断昨天起的连续记录
    }
    return streak;
}

/* ==================== 英语提升 ==================== */
function isEngTaskDone(id, d) {
    const e = day(d).english;
    if (id === "phrase") return e.phrases.length > 0;
    return !!(e.tasks[id] && e.tasks[id].count > 0);
}
function logEngTask(id) {
    const t = ENG_TASKS.find(x => x.id === id);
    if (t.auto) { document.getElementById("engPhrase").focus(); return; }
    const e = day().english;
    const rec = e.tasks[id] || { count: 0 };
    rec.count = (rec.count || 0) + 1;
    rec.time = nowTime();
    const noteEl = document.getElementById("engNote_" + id);
    const note = noteEl ? noteEl.value.trim() : "";
    if (note) { rec.notes = rec.notes || []; rec.notes.push({ text: note, time: nowTime() }); }
    e.tasks[id] = rec;
    if (noteEl) noteEl.value = "";
    save(); renderToday();
}
function decEngTask(id) {
    const e = day().english;
    const rec = e.tasks[id];
    if (!rec) return;
    rec.count = (rec.count || 0) - 1;
    if (rec.count <= 0) {
        rec.count = 0;
        if (!rec.notes || !rec.notes.length) delete e.tasks[id]; // 无备注才移除
    } else rec.time = nowTime();
    save(); renderToday();
}
function delEngTaskNote(id, i) {
    const rec = day().english.tasks[id];
    if (!rec || !rec.notes) return;
    removeWithUndo(rec.notes, i, "英语备注", renderToday);
}
function addEngPhrase() {
    const ta = document.getElementById("engPhrase");
    const text = ta.value.trim(); if (!text) return;
    day().english.phrases.push({ text, time: nowTime() });
    ta.value = ""; save(); flash("engPhraseSaved"); renderToday();
}
function delEngPhrase(d, i) { removeWithUndo(day(d).english.phrases, i, "知识点", renderToday); }
function engStreak() {
    const today = todayStr();
    let streak = 0;
    for (let i = 0; ; i++) {
        const d = offsetDate(today, -i);
        if (isHabitDone("english", d)) streak++;
        else { if (i === 0) continue; break; } // 今天还没做不打断昨天起的记录
    }
    return streak;
}
function renderEnglish() {
    const e = day().english;
    const doneCount = ENG_TASKS.filter(t => isEngTaskDone(t.id)).length;
    document.getElementById("engBadge").textContent = `${doneCount}/${ENG_TASKS.length} · 任 1 项即打卡`;
    const streak = engStreak();
    document.getElementById("engStreak").innerHTML =
        streak > 0 ? `🔥 已连续 <b>${streak}</b> 天，别断掉！` : `今天完成任意 1 项，开启你的连续记录 🔥`;
    const dayIdx = Math.floor(new Date(currentDate + "T12:00:00").getTime() / 86400000);
    document.getElementById("engTip").textContent = "💡 " + ENG_TIPS[dayIdx % ENG_TIPS.length];
    document.getElementById("engTaskList").innerHTML = ENG_TASKS.map(t => {
        if (t.id === "phrase") {
            const done = isEngTaskDone(t.id);
            const time = done && e.phrases.length ? e.phrases[e.phrases.length - 1].time : "";
            return `<div class="eng-task ${done ? "done" : ""}" onclick="logEngTask('${t.id}')">
      <span class="icon">${t.icon}</span>
      <span class="body"><div class="name">${done ? "✓ " : ""}${t.name}</div><div class="desc">${t.desc}</div></span>
      ${time ? `<span class="time">${time}</span>` : ""}
    </div>`;
        }
        const rec = e.tasks[t.id];
        const count = rec ? rec.count : 0;
        const done = count > 0;
        const notes = (rec && rec.notes) || [];
        return `<div class="eng-task-wrap">
      <div class="eng-task ${done ? "done" : ""}" onclick="logEngTask('${t.id}')">
      <span class="icon">${t.icon}</span>
      <span class="body"><div class="name">${done ? "✓ " : ""}${t.name}${count > 1 ? ` <span class="count-badge">×${count}</span>` : ""}</div><div class="desc">${t.desc}</div></span>
      ${done ? `<span class="time">${rec.time}</span>` : ""}
      ${done ? `<button class="eng-dec" onclick="event.stopPropagation();decEngTask('${t.id}')">−</button>` : ""}
      ${t.link ? `<a class="go" href="${t.link}" target="_blank" rel="noopener" onclick="event.stopPropagation()">${t.linkName}</a>` : ""}
    </div>
      <div class="eng-note-row">
        <input id="engNote_${t.id}" type="text" class="eng-note-input" placeholder="学了啥？可选，填了会记在下面" onkeydown="if(event.key==='Enter'){event.preventDefault();logEngTask('${t.id}')}">
        <button class="btn small" onclick="logEngTask('${t.id}')">打卡</button>
      </div>
      ${notes.length ? `<div class="eng-note-list">${notes.map((n, i) => `<div class="eng-note-item entry-has-actions"><span class="eng-note-text">${escMultiline(n.text)}</span><span class="eng-note-time">${n.time}</span>${entryActions(`editRecordText('engNote','${currentDate}',${i},'${t.id}')`, `delEngTaskNote('${t.id}',${i})`, "编辑英语备注", "删除英语备注")}</div>`).join("")}</div>` : ""}
    </div>`;
    }).join("");
    // 汇总全部知识点（含当天，近到远）
    const items = [];
    Object.keys(store.days).sort().reverse().forEach(d => {
        const en = store.days[d].english;
        if (en && en.phrases) en.phrases.forEach((p, i) => items.push({ d, i, p }));
    });
    document.getElementById("engPhraseCount").textContent = items.length ? `已积累 ${items.length} 条` : "";
    renderCollapsibleList("engPhraseList", "engPhrase", "知识点", items.length,
        items.map(x => `<div class="entry entry-has-actions history-entry history-text-entry"><span class="tag">${x.d === todayStr() ? "今天" : x.d}</span><div class="history-entry-text">${escMultiline(x.p.text)}</div>
<div class="meta"><span>${x.d} ${x.p.time}</span></div>
${entryActions(`editRecordText('phrase','${x.d}',${x.i})`, `delEngPhrase('${x.d}',${x.i})`, "编辑英语知识点", "删除英语知识点")}</div>`).join(""),
        `<div class="empty-tip">还没有知识点，听到好表达随手记一条吧 ✨</div>`);
    renderGrowthOverview();
}

/* ==================== 临时任务 ==================== */
function openTodoCenter() {
    switchTab("todos");
    window.scrollTo({ top: 0, behavior: "smooth" });
}
function addTask() {
    const input = document.getElementById("taskInput");
    const text = input.value.trim(); if (!text) return;
    day().tasks.push({
        id: makeRecordId("task"), text, done: false,
        createdDate: currentDate, createdTime: nowTime(), scheduledDate: currentDate,
        completedDate: "", completedTime: "", updatedAt: "",
    });
    input.value = ""; save(); renderToday();
    renderTodoCenter();
}
function allTaskRecords() {
    const items = [];
    Object.keys(store.days).sort().forEach(d => {
        day(d).tasks.forEach((t, i) => items.push({ d, i, t }));
    });
    return items;
}
function taskLocation(d, id) {
    const arr = day(d).tasks;
    const i = arr.findIndex(t => t.id === id);
    return i >= 0 ? { arr, i, t: arr[i] } : null;
}
function renderTaskViews() {
    renderToday();
    renderTodoCenter();
    renderRecordTimeline();
}
function toggleTask(d, id) {
    const loc = taskLocation(d, id); if (!loc) return;
    const t = loc.t;
    const previous = { done: !!t.done, completedDate: t.completedDate || "", completedTime: t.completedTime || "" };
    t.done = !t.done;
    t.completedDate = t.done ? todayStr() : "";
    t.completedTime = t.done ? nowTime() : "";
    t.updatedAt = `${todayStr()} ${nowTime()}`;
    save(); renderTaskViews();
    if (t.done) showUndo("已完成任务", () => {
        t.done = previous.done;
        t.completedDate = previous.completedDate;
        t.completedTime = previous.completedTime;
        t.updatedAt = `${todayStr()} ${nowTime()}`;
        save(); renderTaskViews();
    });
}
function editTask(d, id) {
    const loc = taskLocation(d, id); if (!loc) return;
    if (loc.t.done) { showToast("已完成任务请先恢复后再编辑"); return; }
    openTextEditor({
        title: "编辑 Todo",
        value: loc.t.text,
        placeholder: "写清楚要做什么；支持长文本和换行…",
        onSave: text => {
            const latest = taskLocation(d, id);
            if (!latest || latest.t.done) { showToast("任务状态已变化，请重试"); return; }
            latest.t.text = text;
            latest.t.updatedAt = recordDateTime(todayStr(), nowTime());
            save(); renderTaskViews(); showToast("Todo 已更新");
        },
    });
}
function moveTask(d, id) {
    const loc = taskLocation(d, id); if (!loc) return;
    if (loc.t.done) { showToast("已完成任务不能移动日期"); return; }
    openDateEditor({
        title: "移动 Todo 到指定日期",
        value: d,
        onSave: targetDate => {
            const latest = taskLocation(d, id);
            if (!latest || latest.t.done) { showToast("任务状态已变化，请重试"); return; }
            if (targetDate === d) { showToast("Todo 已在这个日期"); return; }
            const task = latest.arr.splice(latest.i, 1)[0];
            task.scheduledDate = targetDate;
            task.updatedAt = recordDateTime(todayStr(), nowTime());
            day(targetDate).tasks.push(task);
            save(); renderTaskViews(); showToast(`已移动到 ${targetDate}`);
        },
    });
}
function delTask(d, id) {
    const loc = taskLocation(d, id); if (!loc) return;
    removeWithUndo(loc.arr, loc.i, "任务", renderTaskViews);
}
function taskRow(t, d, center) {
    const created = t.createdDate || d;
    const completed = t.completedDate || "";
    const planned = t.scheduledDate || d;
    const meta = t.done && completed
        ? `完成 ${completed === todayStr() ? "今天" : completed}${t.completedTime ? " " + t.completedTime : ""}`
        : (center ? `创建 ${created}${t.createdTime ? " " + t.createdTime : ""}${planned !== created ? ` · 计划 ${planned}` : ""}` : "");
    return `<div class="task-item ${t.done ? "done" : ""}">
      ${t.done ? "" : `<button class="task-check" onclick="toggleTask('${d}','${t.id}')" aria-label="标记完成" title="标记完成"></button>`}
      <div class="task-content">
        ${t.done
            ? `<div class="task-text task-text-readonly">${escMultiline(t.text)}</div>`
            : `<button type="button" class="task-text" onclick="editTask('${d}','${t.id}')" aria-label="编辑任务" title="点击编辑">${escMultiline(t.text)}</button>`}
        ${meta ? `<div class="task-meta">${esc(meta)}</div>` : ""}
      </div>
      <div class="task-actions">
        ${t.done
            ? `<button type="button" onclick="toggleTask('${d}','${t.id}')" aria-label="恢复为待办" title="恢复为待办">${icon("undo")}</button>`
            : `<button type="button" onclick="moveTask('${d}','${t.id}')" aria-label="移动到指定日期" title="移动到指定日期">${icon("calendar")}</button>`}
        <button type="button" class="task-del" onclick="delTask('${d}','${t.id}')" aria-label="删除任务" title="删除任务">${icon("trash")}</button>
      </div>
    </div>`;
}
function toggleTasksDone() { tasksShowDone = !tasksShowDone; renderTasks(); }
function renderTasks() {
    const tasks = day().tasks;
    const totalPending = allTaskRecords().filter(x => !x.t.done).length;
    const countEl = document.getElementById("allTodoCount");
    if (countEl) countEl.textContent = totalPending ? String(totalPending) : "";
    const undone = tasks.map((t, i) => ({ t, i })).filter(x => !x.t.done);
    const done = tasks.map((t, i) => ({ t, i })).filter(x => x.t.done)
        .sort((a, b) => ((a.t.completedDate || "") + (a.t.completedTime || "")).localeCompare((b.t.completedDate || "") + (b.t.completedTime || "")));
    let html = "";
    if (!tasks.length) {
        html = `<div class="empty-tip">今天还没有临时任务${totalPending ? `，全部待办还有 ${totalPending} 项` : "，加一条吧 ✨"}</div>`;
    } else {
        html = undone.map(({ t }) => taskRow(t, currentDate, false)).join("");
        if (!undone.length) html += `<div class="empty-tip">今天的临时任务都完成啦 🎉</div>`;
        if (done.length) {
            html += `<button type="button" class="task-group-toggle ${tasksShowDone ? "open" : ""}" onclick="toggleTasksDone()">
        <span class="tg-caret" data-ic="chevron-down"></span>已完成 ${done.length} 项</button>`;
            if (tasksShowDone) html += `<div class="task-done-group">${done.map(({ t }) => taskRow(t, currentDate, false)).join("")}</div>`;
        }
    }
    const list = document.getElementById("taskList");
    list.innerHTML = html;
    renderIcons(list);
}
function toggleTodoCenterDone() { todoCenterShowDone = !todoCenterShowDone; renderTodoCenter(); }
function renderTodoCenter() {
    const list = document.getElementById("todoCenterList"); if (!list) return;
    const all = allTaskRecords();
    const pending = all.filter(x => !x.t.done).sort((a, b) =>
        ((a.t.createdDate || a.d) + (a.t.createdTime || "")).localeCompare((b.t.createdDate || b.d) + (b.t.createdTime || "")));
    const done = all.filter(x => x.t.done).sort((a, b) =>
        ((b.t.completedDate || "") + (b.t.completedTime || "")).localeCompare((a.t.completedDate || "") + (a.t.completedTime || "")));
    const pendingEl = document.getElementById("todoPendingCount");
    const doneEl = document.getElementById("todoDoneCount");
    if (pendingEl) pendingEl.textContent = pending.length;
    if (doneEl) doneEl.textContent = done.length;
    let html = `<div class="todo-center-heading"><b>未完成</b><span>${pending.length} 项 · 按创建时间排序</span></div>`;
    html += pending.length
        ? `<div class="todo-center-group">${pending.map(x => taskRow(x.t, x.d, true)).join("")}</div>`
        : `<div class="empty-tip">没有未完成任务，轻松一下吧 🎉</div>`;
    if (done.length) {
        html += `<button type="button" class="todo-done-toggle ${todoCenterShowDone ? "open" : ""}" onclick="toggleTodoCenterDone()"><span data-ic="chevron-down"></span>已完成 ${done.length} 项</button>`;
        if (todoCenterShowDone) html += `<div class="todo-center-heading done-heading"><b>已完成</b><span>仅支持恢复或删除</span></div><div class="todo-center-group done-group">${done.map(x => taskRow(x.t, x.d, true)).join("")}</div>`;
    }
    list.innerHTML = html;
    renderIcons(list);
}

/* ==================== 喝水 ==================== */
function addWater(amount) {
    const o = day();
    if (amount < 0) {
        if (o.waterLogs.length) o.waterLogs.pop();
    } else {
        o.waterLogs.push({ time: nowTime(), amount });
    }
    save(); renderToday();
}
function renderWater() {
    const total = waterTotal();
    const goal = waterGoal(), cup = waterCup();
    const pct = goal ? Math.min(100, Math.round(total / goal * 100)) : 0;
    const bar = document.getElementById("waterProgress"); if (bar) bar.style.width = pct + "%";
    setTxt("waterTotal", total);
    setTxt("waterPct", pct + "%");
    setTxt("waterGoalText", goal);
    const badge = document.getElementById("waterGoalBadge");
    if (badge) badge.textContent = `目标 ${goal}ml`;
    const gi = document.getElementById("waterGoalInput"); if (gi && document.activeElement !== gi) gi.value = goal;
    const ci = document.getElementById("waterCupInput"); if (ci && document.activeElement !== ci) ci.value = cup;
    const cupBtn = document.getElementById("waterCupBtn"); if (cupBtn) { cupBtn.textContent = `+${cup}ml`; cupBtn.setAttribute("onclick", `addWater(${cup})`); }
}
function setWaterGoal(v) { const n = parseInt(v, 10); if (n > 0) { store.settings.waterGoal = n; save(); renderToday(); } }
function setWaterCup(v) { const n = parseInt(v, 10); if (n > 0) { store.settings.waterCup = n; save(); renderToday(); } }

/* ==================== 补剂 ==================== */
function toggleSupp(name) {
    const o = day();
    if (o.supplements[name] && o.supplements[name].done) delete o.supplements[name];
    else o.supplements[name] = { done: true, time: nowTime() };
    save(); renderToday();
}
function renderSupps() {
    const list = store.settings.supplements;
    const o = day();
    document.getElementById("suppList").innerHTML = list.map(n => {
        const s = o.supplements[n];
        return `<div class="supp-chip ${s && s.done ? "done" : ""}" onclick="toggleSupp('${n.replace(/'/g, "\\'")}')">${s && s.done ? "✓ " : ""}${n}</div>`;
    }).join("") || `<span class="empty-tip">暂无补剂，点下方"管理补剂清单"添加</span>`;
    const done = list.filter(n => o.supplements[n] && o.supplements[n].done).length;
    document.getElementById("suppBadge").textContent = `${done}/${list.length}`;
}
function manageSupplements() {
    const cur = store.settings.supplements.join("、");
    const input = prompt("请输入补剂清单（用、或,分隔）：", cur);
    if (input === null) return;
    store.settings.supplements = input.split(/[、,，;；\s]+/).filter(Boolean);
    save(); renderToday();
}

/* ==================== 健康概览（Phase 5） ==================== */
const HEALTH_MODULES = [
    { name: "饮食", ic: "utensils", target: "card-meals" },
    { name: "饮水", ic: "droplet", target: "card-water" },
    { name: "补剂", ic: "pill", target: "card-supplement" },
    { name: "锻炼", ic: "activity", target: "card-exercise" },
    { name: "排便", ic: "record", target: "card-bowel" },
    { name: "体重", ic: "scale", target: "card-weight" },
    { name: "睡眠", ic: "bed", target: "card-sleep" },
    { name: "孕期", ic: "thermometer", target: "card-symptoms" },
];
function healthGo(target) {
    const el = document.getElementById(target);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}
function renderHealthOverview() {
    const el = document.getElementById("healthOverview"); if (!el) return;
    const o = day();
    const badge = document.getElementById("healthDateBadge");
    if (badge) badge.textContent = currentDate === todayStr() ? "今天" : dateLabel(currentDate);
    const list = store.settings.supplements || [];
    const supDone = list.filter(n => o.supplements[n] && o.supplements[n].done).length;
    const sleepLabel = o.sleep ? ({ good: "好", mid: "一般", bad: "差" }[o.sleep.quality] || "一般") : "—";
    const weightVal = o.weight ? o.weight.value : null;
    const metrics = [
        { b: String(waterTotal()), u: `/${waterGoal()}ml`, s: "饮水" },
        { b: String(supDone), u: `/${list.length}`, s: "补剂" },
        { b: sleepLabel, u: "", s: "睡眠" },
        { b: weightVal != null ? String(weightVal) : "—", u: weightVal != null ? "kg" : "", s: "体重" },
    ];
    el.innerHTML = `
    <div class="health-metrics">${metrics.map(m => `<div class="health-metric"><b>${esc(m.b)}${m.u ? `<i>${esc(m.u)}</i>` : ""}</b><span>${m.s}</span></div>`).join("")}</div>
    <div class="health-modules">${HEALTH_MODULES.map(m => `<button type="button" class="gh-mod" onclick="healthGo('${m.target}')"><span class="gh-mod-ic" data-ic="${m.ic}"></span>${m.name}</button>`).join("")}</div>
  `;
    renderIcons(el);
}

/* ==================== 时间轴 ==================== */
const HABIT_CAT = {
    english: "study", tech: "study", reading: "study",
    exercise: "health", sugar: "health",
    skincare: "life", diary: "life", review: "life",
};
function collectTimeline(d) {
    const timelineDate = d || currentDate;
    const o = day(timelineDate), ev = [];
    HABITS.forEach(h => {
        if (!h.auto && o.habits[h.id] && o.habits[h.id].done && o.habits[h.id].time)
            ev.push({ time: o.habits[h.id].time, label: `${h.icon} 完成打卡：${h.name}`, ref: o.habits[h.id], cat: HABIT_CAT[h.id] || "life" });
    });
    o.waterLogs.forEach(l => ev.push({ time: l.time, label: `💧 喝水 ${l.amount}ml`, ref: l, cat: "health" }));
    ENG_TASKS.forEach(t => {
        if (t.id === "phrase") o.english.phrases.forEach(p => { if (p.time) ev.push({ time: p.time, label: `✍️ 英语知识点：${p.text}`, ref: p, cat: "study", textRecord: true }); });
        else {
            const rec = o.english.tasks[t.id];
            if (rec && rec.count > 0) ev.push({ time: rec.time, label: `${t.icon} 英语：${t.name}${rec.count > 1 ? ` ×${rec.count}` : ""}`, ref: rec, cat: "study" });
            (rec && rec.notes || []).forEach(n => { if (n.time) ev.push({ time: n.time, label: `✍️ 英语[${t.name}]：${n.text}`, ref: n, cat: "study", textRecord: true }); });
        }
    });
    allTaskRecords().forEach(({ t }) => {
        if (t.done && t.completedDate === timelineDate) ev.push({ time: t.completedTime || "", label: `📌 完成任务：${t.text}`, ref: t, timeField: "completedTime", cat: "life", textRecord: true });
    });
    Object.entries(o.supplements).forEach(([n, s]) => { if (s.done) ev.push({ time: s.time, label: `💊 补剂：${n}`, ref: s, cat: "health" }); });
    o.reviews.forEach(r => { if (r.time) ev.push({ time: r.time, label: `🌙 复盘：${r.text}`, ref: r, cat: "life", textRecord: true }); });
    o.gratitude.forEach(g => ev.push({ time: g.time, label: `💛 感恩：${g.text}`, ref: g, cat: "life", textRecord: true }));
    Object.entries(o.meals).forEach(([mid, m]) => {
        const meal = MEALS.find(x => x.id === mid);
        if (meal && m.time && (m.food || m.rating)) ev.push({ time: m.time, label: `${meal.icon} 记录${meal.name}${m.food ? "：" + m.food : ""}`, ref: m, cat: "diet", textRecord: !!m.food });
    });
    o.snacks.forEach(s => { if (s.time && (s.food || s.rating)) ev.push({ time: s.time, label: `🍎 加餐${s.food ? "：" + s.food : ""}`, ref: s, cat: "diet", textRecord: !!s.food }); });
    o.exercises.forEach(x => ev.push({ time: x.time, label: `🏃 锻炼：${x.text}`, ref: x, cat: "health", textRecord: true }));
    o.bowels.forEach(b => { const extra = [b.amount ? "量·" + b.amount : "", b.honey === true ? "蜂蜜露" : ""].filter(Boolean).join(" "); ev.push({ time: b.time, label: `💩 排便${extra ? "（" + extra + "）" : ""}`, ref: b, cat: "health" }); });
    o.pregDiaries.forEach(p => { if (p.time) ev.push({ time: p.time, label: `🤰 孕期日记：${p.text}`, ref: p, cat: "pregnancy", textRecord: true }); });
    if (o.weight && o.weight.time) ev.push({ time: o.weight.time, label: `⚖️ 体重 ${o.weight.value} kg${o.weight.note ? "：" + o.weight.note : ""}`, ref: o.weight, cat: "health", textRecord: !!o.weight.note });
    if (o.sleep && o.sleep.time) {
        const sLabel = { good: "好 😊", mid: "一般 😐", bad: "差 😵" };
        ev.push({ time: o.sleep.time, label: `😴 睡眠：${sLabel[o.sleep.quality] || "一般 😐"}`, ref: o.sleep, cat: "health" });
    }
    o.symptoms.forEach(s => ev.push({ time: s.time, label: `🤕 孕期反应：${s.tag}`, ref: s, cat: "pregnancy" }));
    o.techLogs.forEach(t => ev.push({ time: t.time, label: `💻 技术：${t.text}`, ref: t, cat: "study", textRecord: true }));
    o.media.forEach(m => ev.push({ time: m.time, label: `📣 ${m.tag}：${m.text}`, ref: m, cat: "inspiration", textRecord: true }));
    o.thoughts.forEach(t => { const tags = thoughtTagsOf(t); ev.push({ time: t.time, label: `💭 想法${tags.length ? "[" + tags.join("/") + "]" : ""}：${t.text}`, ref: t, cat: "inspiration", textRecord: true }); });
    o.knowledge.forEach(k => ev.push({ time: k.time, label: `📚 ${k.type}：${k.text}`, ref: k, cat: "study", textRecord: true }));
    o.expenses.forEach(e => ev.push({ time: e.time, label: `💸 ${catIcon(e.cat)}${e.cat} ¥${fmtMoney(e.amount)}${e.note ? "：" + e.note : ""}`, ref: e, cat: "consume", textRecord: !!e.note }));
    o.wishes.forEach(w => { if (w.time) ev.push({ time: w.time, label: `🧊 想买：${w.item}${w.amount ? " ¥" + fmtMoney(w.amount) : ""}`, ref: w, cat: "consume", textRecord: true }); });
    ev.sort((a, b) => (a.time || "").localeCompare(b.time || ""));
    return ev;
}
function trunc(s, n) { s = s.trim(); return s.length > n ? s.slice(0, n) + "…" : s; }
const HOME_RECENT_LIMIT = 3;
function renderTimeline() {
    const ev = collectTimeline();
    const el = document.getElementById("timeline");
    if (!el) return;
    el.classList.add("home-feed");
    if (!ev.length) {
        el.innerHTML = `<div class="empty-tip">还没有动态，先完成一个计划开始记录吧 ✨</div><button type="button" class="tl-more" onclick="switchTab('record')">去记录页开始记录<span class="tl-more-ic" data-ic="chevron-right"></span></button>`;
        renderIcons(el);
        return;
    }
    const shown = ev.slice(-HOME_RECENT_LIMIT).reverse();
    const rows = shown.map(e => {
        const idx = e.label.indexOf("：");
        const title = idx >= 0 ? e.label.slice(0, idx) : e.label;
        const note = idx >= 0 ? e.label.slice(idx + 1) : "";
        const preview = note ? trunc(note.replace(/\s+/g, " "), 42) : "";
        return `<div class="home-feed-item"><span class="home-feed-time">${e.time || "--:--"}</span><div class="home-feed-body"><div class="home-feed-title">${esc(title)}</div>${preview ? `<div class="home-feed-note">${esc(preview)}</div>` : ""}</div></div>`;
    }).join("");
    const toggle = `<button type="button" class="tl-more" onclick="switchTab('record')">查看今天全部 ${ev.length} 条<span class="tl-more-ic" data-ic="chevron-right"></span></button>`;
    el.innerHTML = rows + toggle;
    renderIcons(el);
}

/* ==================== 记录页 · 统一时间轴（Phase 3） ==================== */
const RECORD_FILTERS = [
    { id: "all", name: "全部" },
    { id: "health", name: "健康" },
    { id: "diet", name: "饮食" },
    { id: "study", name: "学习" },
    { id: "life", name: "生活" },
    { id: "consume", name: "消费" },
    { id: "pregnancy", name: "孕期" },
    { id: "inspiration", name: "灵感" },
];
let recordFilter = "all";
let recordRefs = [];
function dateLabel(d) {
    const dt = new Date(d + "T12:00:00");
    const wd = ["日", "一", "二", "三", "四", "五", "六"][dt.getDay()];
    return `${dt.getMonth() + 1}月${dt.getDate()}日 周${wd}`;
}
function setRecordFilter(id) { recordFilter = id; renderRecordFilterRow(); renderRecordTimeline(); }
function renderRecordFilterRow() {
    const row = document.getElementById("recordFilterRow");
    if (!row) return;
    row.innerHTML = RECORD_FILTERS.map(f =>
        `<button type="button" class="filter-chip ${recordFilter === f.id ? "sel" : ""}" onclick="setRecordFilter('${f.id}')">${f.name}</button>`).join("");
}
function toggleHistoryEntry(el) {
    const expanded = el.classList.toggle("tl-expanded");
    el.setAttribute("aria-expanded", expanded ? "true" : "false");
    el.setAttribute("aria-label", expanded ? "收起完整记录" : "展开完整记录");
}
function renderRecordTimeline() {
    const el = document.getElementById("recordTimeline");
    if (!el) return;
    const badge = document.getElementById("recordDateBadge");
    if (badge) badge.textContent = currentDate === todayStr() ? "今天" : dateLabel(currentDate);
    const ev = collectTimeline();
    recordRefs = ev.map(e => ({ ref: e.ref, timeField: e.timeField || "time", date: currentDate }));
    let items = ev.map((e, i) => ({ e, i }));   // 保留原始 index 供改时间
    if (recordFilter !== "all") items = items.filter(x => x.e.cat === recordFilter);
    const searchEl = document.getElementById("recordSearch");
    const q = (searchEl ? searchEl.value : "").trim().toLowerCase();
    if (q) items = items.filter(x => x.e.label.toLowerCase().includes(q));
    if (!items.length) {
        el.innerHTML = `<div class="empty-tip">${(q || recordFilter !== "all") ? "没有匹配的记录" : "这一天还没有记录，用右下角 ＋ 开始记录吧 ✨"}</div>`;
        return;
    }
    el.innerHTML = items.map(({ e, i }) => {
        const idx = e.label.indexOf("：");
        const title = idx >= 0 ? e.label.slice(0, idx) : e.label;
        const note = idx >= 0 ? e.label.slice(idx + 1) : "";
        const expandable = !!(note && (note.length > 72 || note.includes("\n")));
        return `<div class="tl-item"><input type="time" class="tl-time" value="${e.time || ""}" onchange="setRecordTime(${i},this.value)" title="点击修改实际时间"><div class="tl-card history-entry ${e.textRecord ? "history-text-entry" : ""}"${expandable ? ` onclick="toggleHistoryEntry(this)" role="button" tabindex="0" aria-expanded="false" aria-label="展开完整记录" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();toggleHistoryEntry(this)}"` : ""}><div class="tl-title">${esc(title)}</div>${note ? `<div class="tl-note history-entry-text">${escMultiline(note)}</div>` : ""}${expandable ? `<div class="history-expand-hint" aria-hidden="true">${icon("chevron-down")}</div>` : ""}</div></div>`;
    }).join("");
}
function setRecordTime(i, val) {
    const target = recordRefs[i];
    if (!target || !target.ref || !val) { renderRecordTimeline(); return; }
    target.ref[target.timeField] = val;
    if (target.timeField === "time" && target.ref.createdAt) {
        target.ref.createdAt = recordDateTime(target.ref.date || target.date, val);
    }
    save(); renderRecordTimeline();
}
function esc(s) { const d = document.createElement("div"); d.textContent = s; return d.innerHTML; }
function escMultiline(s) { return esc(s).replace(/\n/g, "<br>"); }

/* ==================== 删除撤销 ==================== */
let undoTimer = null;
function removeWithUndo(arr, i, label, rerender) {
    const removed = arr.splice(i, 1)[0];
    save(); rerender();
    showUndo(`已删除${label}`, () => { arr.splice(Math.min(i, arr.length), 0, removed); save(); rerender(); });
}
function showUndo(msg, restore) {
    const bar = document.getElementById("undoBar"); if (!bar) return;
    clearTimeout(undoTimer);
    bar.querySelector(".undo-msg").textContent = msg;
    bar.querySelector(".undo-btn").onclick = () => { restore(); hideUndo(); };
    bar.style.display = "flex";
    undoTimer = setTimeout(hideUndo, 5000);
}
function hideUndo() { clearTimeout(undoTimer); const bar = document.getElementById("undoBar"); if (bar) bar.style.display = "none"; }

/* ==================== 列表折叠（长列表一键收起/展开） ==================== */
function isListCollapsed(key) { return !!(store.settings.listCollapsed && store.settings.listCollapsed[key]); }
function toggleList(key) {
    store.settings.listCollapsed = store.settings.listCollapsed || {};
    store.settings.listCollapsed[key] = !store.settings.listCollapsed[key];
    save();
    ({ engPhrase: renderEnglish, thoughts: renderThoughts, knowledge: renderKnowledge, media: renderMedia, tech: renderTech, recentReviews: renderReviewOverview }[key] || renderAll)();
}
function renderCollapsibleList(elId, key, label, count, itemsHtml, emptyHtml, alwaysToggle) {
    const el = document.getElementById(elId); if (!el) return;
    if (!count) { el.innerHTML = emptyHtml; return; }
    const collapsed = isListCollapsed(key);
    const showToggle = !!alwaysToggle || count > 3 || collapsed; // 内容多或调用方要求时显示收起入口
    const bar = showToggle
        ? `<div class="list-toggle"><span>${label} ${count} 条</span><button type="button" class="list-toggle-icon ${collapsed ? "collapsed" : ""}" onclick="toggleList('${key}')" aria-label="${collapsed ? "展开" : "收起"}${escAttr(label)}">${icon("chevron-down")}</button></div>`
        : "";
    el.innerHTML = bar + (collapsed ? "" : itemsHtml);
}

/* ==================== 卡片折叠 ==================== */
function toggleCard(h2) {
    const card = h2.closest(".card"); if (!card) return;
    const id = card.dataset.collapse;
    card.classList.toggle("collapsed");
    store.settings.collapsed = store.settings.collapsed || {};
    store.settings.collapsed[id] = card.classList.contains("collapsed");
    save();
}
function applyCollapsedState() {
    const map = store.settings.collapsed || {};
    document.querySelectorAll(".card.collapsible").forEach(card => {
        const stored = map[card.dataset.collapse];
        const collapsed = (stored === undefined) ? (card.dataset.collapseDefault === "collapsed") : !!stored;
        card.classList.toggle("collapsed", collapsed);
    });
}

/* ==================== 个性化：习惯 / 模块 ==================== */
const OPTIONAL_MODULES = [
    { id: "symptoms", name: "孕期反应" },
    { id: "pregDiary", name: "日记记录" },
    { id: "media", name: "自媒体运营" },
    { id: "snack", name: "加餐" },
    { id: "bowel", name: "排便记录" },
    { id: "supplement", name: "补剂打卡" },
    { id: "exercise", name: "锻炼记录" },
];
function orderedHabitDefs() {
    const order = store.settings.habitOrder || [];
    const byId = {};
    allHabitDefs().forEach(h => byId[h.id] = h);
    const list = [];
    order.forEach(id => { if (byId[id]) { list.push(byId[id]); delete byId[id]; } });
    allHabitDefs().forEach(h => { if (byId[h.id]) list.push(h); });
    return list;
}
function goHabits() {
    switchTab("customize");
    setTimeout(() => {
        const sec = document.getElementById("personalizeHabits");
        if (sec) sec.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
}
function renderHabitManager() {
    const el = document.getElementById("habitManager"); if (!el) return;
    const hidden = store.settings.habitHidden || {};
    const list = orderedHabitDefs();
    const customIds = new Set((store.settings.customHabits || []).map(h => h.id));
    el.innerHTML = list.map((h, i) => `<div class="habit-mng-row">
      <span class="hm-name"><span class="hm-ic">${h.icon}</span>${h.name}${customIds.has(h.id) ? " <em>自定义</em>" : ""}</span>
      <span class="hm-actions">
        <button onclick="moveHabit('${h.id}',-1)" ${i === 0 ? "disabled" : ""}>↑</button>
        <button onclick="moveHabit('${h.id}',1)" ${i === list.length - 1 ? "disabled" : ""}>↓</button>
        <label class="switch" title="显示/隐藏"><input type="checkbox" ${hidden[h.id] ? "" : "checked"} onchange="toggleHabitHidden('${h.id}',this.checked)"><span class="switch-slider"></span></label>
        ${customIds.has(h.id) ? `<button class="hm-del" onclick="deleteCustomHabit('${h.id}')">✕</button>` : ""}
      </span>
    </div>`).join("");
}
function moveHabit(id, dir) {
    const list = orderedHabitDefs().map(h => h.id);
    const i = list.indexOf(id); if (i < 0) return;
    const j = i + dir; if (j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    store.settings.habitOrder = list;
    save(); renderHabitManager(); renderToday();
}
function toggleHabitHidden(id, show) {
    store.settings.habitHidden = store.settings.habitHidden || {};
    if (show) delete store.settings.habitHidden[id]; else store.settings.habitHidden[id] = true;
    save(); renderHabitManager(); renderToday();
}
function addCustomHabit() {
    const iconEl = document.getElementById("newHabitIcon");
    const nameEl = document.getElementById("newHabitName");
    const name = nameEl.value.trim(); if (!name) { alert("请输入习惯名称"); return; }
    const icon = iconEl.value.trim() || "⭐";
    const id = "custom_" + Date.now();
    store.settings.customHabits = store.settings.customHabits || [];
    store.settings.customHabits.push({ id, icon, name });
    store.settings.habitOrder = orderedHabitDefs().map(h => h.id).concat(id);
    iconEl.value = ""; nameEl.value = "";
    save(); renderHabitManager(); renderToday();
}
function deleteCustomHabit(id) {
    if (!confirm("删除这个自定义习惯？历史打卡记录会保留但不再显示。")) return;
    store.settings.customHabits = (store.settings.customHabits || []).filter(h => h.id !== id);
    if (store.settings.habitOrder) store.settings.habitOrder = store.settings.habitOrder.filter(x => x !== id);
    if (store.settings.habitHidden) delete store.settings.habitHidden[id];
    save(); renderHabitManager(); renderToday();
}
function renderModuleManager() {
    const el = document.getElementById("moduleManager"); if (!el) return;
    const hide = store.settings.hideModules || {};
    el.innerHTML = OPTIONAL_MODULES.map(m =>
        `<label class="toggle-row"><span>${m.name}</span><span class="switch"><input type="checkbox" ${hide[m.id] ? "" : "checked"} onchange="toggleModule('${m.id}',this.checked)"><span class="switch-slider"></span></span></label>`).join("");
}
function toggleModule(id, show) {
    store.settings.hideModules = store.settings.hideModules || {};
    if (show) delete store.settings.hideModules[id]; else store.settings.hideModules[id] = true;
    save(); applyModuleVisibility();
}
function applyModuleVisibility() {
    const hide = store.settings.hideModules || {};
    OPTIONAL_MODULES.forEach(m => {
        document.querySelectorAll(`[data-module="${m.id}"]`).forEach(card => { card.style.display = hide[m.id] ? "none" : ""; });
    });
}

/* ==================== 复盘 ==================== */
function addReview() {
    const ta = document.getElementById("reviewInput");
    const text = ta.value.trim(); if (!text) return;
    day().reviews.push({ text, time: nowTime() });
    ta.value = ""; save(); renderToday();
}
function delReview(i) { removeWithUndo(day().reviews, i, "复盘", renderToday); }
function delReviewAt(d, i) {
    const reviews = day(d).reviews;
    if (!reviews[i]) return;
    removeWithUndo(reviews, i, "复盘", () => {
        renderReviews();
        renderReviewOverview();
        renderSummary();
        renderTimeline();
    });
}
function renderReviews() {
    const list = day().reviews;
    document.getElementById("reviewList").innerHTML = list.map((r, i) =>
        `<div class="entry entry-has-actions history-entry history-text-entry"><div class="history-entry-text">${escMultiline(r.text)}</div><div class="meta"><span>${r.time}</span></div>
     ${entryActions(`editRecordText('review','${currentDate}',${i})`, `delReview(${i})`, "编辑复盘", "删除复盘")}</div>`).join("");
}

/* ==================== 复盘概览（Phase 6） ==================== */
function reviewStart() {
    const card = document.getElementById("card-review");
    if (!card) return;
    if (card.classList.contains("collapsed")) {
        card.classList.remove("collapsed");
        store.settings.collapsed = store.settings.collapsed || {};
        store.settings.collapsed["review"] = false;
        save();
    }
    card.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => { const ta = document.getElementById("reviewInput"); if (ta) ta.focus({ preventScroll: true }); }, 350);
}
function renderReviewOverview() {
    const el = document.getElementById("reviewOverview"); if (!el) return;
    const o = day();
    const badge = document.getElementById("reviewDateBadge");
    if (badge) badge.textContent = currentDate === todayStr() ? "今天" : dateLabel(currentDate);
    const reviewed = o.reviews.length > 0;
    const metrics = [
        { b: reviewed ? "已复盘" : "未复盘", s: "复盘", cls: reviewed ? "done" : "" },
        { b: String(o.gratitude.length), s: "感恩" },
        { b: String(o.pregDiaries.length), s: "日记" },
    ];
    const recent = [];
    Object.keys(store.days).forEach(d => {
        (store.days[d].reviews || []).forEach((r, i) => recent.push({ d, i, r }));
    });
    recent.sort((a, b) => (b.d + (b.r.time || "")).localeCompare(a.d + (a.r.time || "")));
    const recentHtml = recent.map(x =>
        `<div class="entry entry-has-actions history-entry history-text-entry rv-recent-item">
          <div class="rv-r-text history-entry-text">${escMultiline(x.r.text)}</div>
          <div class="meta"><span>${x.d === todayStr() ? "今天" : x.d}${x.r.time ? ` · ${esc(x.r.time)}` : ""}</span></div>
          ${entryActions(`editRecordText('review','${x.d}',${x.i})`, `delReviewAt('${x.d}',${x.i})`, "编辑复盘", "删除复盘")}
        </div>`).join("");
    el.innerHTML = `
    <div class="review-metrics">${metrics.map(m => `<div class="review-metric ${m.cls || ""}"><b>${m.b}</b><span>${m.s}</span></div>`).join("")}</div>
    <button type="button" class="btn review-start-btn" onclick="reviewStart()">${reviewed ? "继续今日复盘" : "开始今日复盘"}</button>
    ${recent.length ? `<div class="rv-recent-title">最近复盘</div><div class="rv-recent" id="recentReviewList"></div>` : ""}
  `;
    if (recent.length) renderCollapsibleList("recentReviewList", "recentReviews", "全部复盘", recent.length, recentHtml, "", true);
    renderIcons(el);
}
function flash(id, msg) {
    const el = document.getElementById(id);
    el.textContent = msg || "已保存 ✓";
    setTimeout(() => el.textContent = "", 2000);
}

/* ==================== 今日汇总 ==================== */
function buildSummaryText(d) {
    d = d || currentDate; const o = day(d);
    const lines = [`🌸 ${d} 今日汇总`, `✅ 打卡 ${habitDoneCount(d)}/${activeHabits().length} · 💧 ${waterTotal(d)}ml`];
    const push = (title, arr) => { if (arr.length) { lines.push("", title); arr.forEach(x => lines.push(`· ${x.text}`)); } };
    push("🌙 复盘", o.reviews);
    push("💛 感恩", o.gratitude);
    push("🤰 孕期日记", o.pregDiaries);
    return lines.join("\n");
}
function renderSummary() {
    const o = day();
    const sec = (icon, title, arr) => arr.length
        ? `<div class="sum-sec"><div class="sum-h">${icon} ${title}</div>${arr.map(x => `<div class="sum-item"><span>· ${escMultiline(x.text)}</span><span class="sum-t">${x.time || ""}</span></div>`).join("")}</div>`
        : "";
    const body = sec("🌙", "复盘", o.reviews) + sec("💛", "感恩", o.gratitude) + sec("🤰", "孕期日记", o.pregDiaries);
    document.getElementById("dailySummary").innerHTML =
        `<div class="sum-top">✅ 打卡 ${habitDoneCount()}/${activeHabits().length} · 💧 ${waterTotal()}ml</div>`
        + (body || `<div class="empty-tip">写下复盘、感恩、日记后，这里会自动汇总，方便一天结束时回顾 ✨</div>`);
}
function copySummary() {
    const text = buildSummaryText();
    const done = () => flash("summaryCopied", "已复制 ✓");
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
    } else fallbackCopy(text, done);
}
function fallbackCopy(text, cb) {
    const ta = document.createElement("textarea");
    ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); } catch (e) { }
    document.body.removeChild(ta); cb();
}

/* ==================== 感恩 ==================== */
function addGratitude() {
    const ta = document.getElementById("gratitudeInput");
    const text = ta.value.trim(); if (!text) return;
    day().gratitude.push({ text, time: nowTime() });
    ta.value = ""; save(); renderToday();
}
function delGratitude(i) { removeWithUndo(day().gratitude, i, "感恩", renderToday); }
function renderGratitude() {
    const list = day().gratitude;
    document.getElementById("gratitudeList").innerHTML = list.map((g, i) =>
        `<div class="entry entry-has-actions history-entry history-text-entry"><div class="history-entry-text">${escMultiline(g.text)}</div><div class="meta"><span>${g.time}</span></div>
     ${entryActions(`editRecordText('gratitude','${currentDate}',${i})`, `delGratitude(${i})`, "编辑感恩记录", "删除感恩记录")}</div>`).join("");
}

/* ==================== 三餐 ==================== */
function renderMeals() {
    const o = day();
    document.getElementById("mealBlocks").innerHTML = MEALS.map(m => {
        const rec = o.meals[m.id] || {};
        return `<div class="meal-block">
      <div class="meal-title">${m.icon} ${m.name}${rec.time ? `<span style="font-size:11px;color:var(--text-light)">${rec.time}</span>` : ""}</div>
      <input type="text" value="${escAttr(rec.food || "")}" placeholder="吃了什么？例如：燕麦粥+鸡蛋+蓝莓"
onchange="saveMealFood('${m.id}', this.value)">
      <div class="rating-row">
${RATINGS.map(r => `<button class="${rec.rating === r.id ? r.cls : ""}" onclick="setMealRating('${m.id}','${r.id}')">${r.label}</button>`).join("")}
      </div>
    </div>`;
    }).join("");
}
function escAttr(s) { return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;"); }
function saveMealFood(id, food) {
    const o = day();
    o.meals[id] = o.meals[id] || {};
    o.meals[id].food = food.trim();
    o.meals[id].time = o.meals[id].time || nowTime();
    save(); renderTimeline();
}
function setMealRating(id, rating) {
    const o = day();
    o.meals[id] = o.meals[id] || {};
    o.meals[id].rating = (o.meals[id].rating === rating) ? "" : rating;
    o.meals[id].time = o.meals[id].time || nowTime();
    save(); renderMeals(); renderTimeline();
}

/* ==================== 加餐（随时添加） ==================== */
function addSnack() {
    day().snacks.push({ food: "", rating: "", time: nowTime() });
    save(); renderSnacks();
}
function saveSnackFood(i, food) {
    const s = day().snacks[i]; if (!s) return;
    s.food = food.trim(); s.time = s.time || nowTime();
    save(); renderTimeline();
}
function setSnackRating(i, rating) {
    const s = day().snacks[i]; if (!s) return;
    s.rating = (s.rating === rating) ? "" : rating;
    s.time = s.time || nowTime();
    save(); renderSnacks(); renderTimeline();
}
function delSnack(i) { removeWithUndo(day().snacks, i, "加餐", () => { renderSnacks(); renderTimeline(); }); }
function renderSnacks() {
    const snacks = day().snacks;
    const el = document.getElementById("snackList");
    if (!el) return;
    el.innerHTML = snacks.length ? snacks.map((rec, i) => `<div class="snack-block">
      <div class="meal-title">🍎 加餐${i + 1}${rec.time ? `<span style="font-size:11px;color:var(--text-light)">${rec.time}</span>` : ""}</div>
      <button class="del" onclick="delSnack(${i})">✕</button>
      <input type="text" value="${escAttr(rec.food || "")}" placeholder="吃了什么？例如：无糖酸奶+坚果"
onchange="saveSnackFood(${i}, this.value)">
      <div class="rating-row">
${RATINGS.map(r => `<button class="${rec.rating === r.id ? r.cls : ""}" onclick="setSnackRating(${i},'${r.id}')">${r.label}</button>`).join("")}
      </div>
    </div>`).join("") : `<div class="empty-tip">还没有加餐记录，点下方按钮添加</div>`;
}

/* ==================== 锻炼记录（随时添加） ==================== */
function addExercise() {
    const ta = document.getElementById("exerciseInput");
    const text = ta.value.trim(); if (!text) return;
    day().exercises.push({ text, time: nowTime() });
    ta.value = ""; save(); renderExercises(); renderTimeline();
}
function delExercise(i) { removeWithUndo(day().exercises, i, "锻炼", () => { renderExercises(); renderTimeline(); }); }
function renderExercises() {
    const list = day().exercises;
    const el = document.getElementById("exerciseList");
    if (!el) return;
    el.innerHTML = list.map((x, i) =>
        `<div class="entry entry-has-actions history-entry history-text-entry"><div class="history-entry-kicker">🏃 锻炼记录</div><div class="history-entry-text">${escMultiline(x.text)}</div><div class="meta"><span>${x.time}</span></div>
     ${entryActions(`editRecordText('exercise','${currentDate}',${i})`, `delExercise(${i})`, "编辑锻炼记录", "删除锻炼记录")}</div>`).join("");
}

/* ==================== 排便记录（随时添加） ==================== */
let bowelDraft = { honey: null, amount: "", healthy: "" };
function setBowel(field, val) {
    bowelDraft[field] = (bowelDraft[field] === val) ? (field === "honey" ? null : "") : val;
    renderBowelForm();
}
function renderBowelForm() {
    const el = document.getElementById("bowelForm");
    if (!el) return;
    el.innerHTML = `
      <div class="bowel-row"><span class="bowel-label">蜂蜜露</span>
<button class="${bowelDraft.honey === true ? "sel" : ""}" onclick="setBowel('honey',true)">是</button>
<button class="${bowelDraft.honey === false ? "sel" : ""}" onclick="setBowel('honey',false)">否</button>
      </div>
      <div class="bowel-row"><span class="bowel-label">便便量</span>
${BOWEL_AMOUNTS.map(a => `<button class="${bowelDraft.amount === a ? "sel" : ""}" onclick="setBowel('amount','${a}')">${a}</button>`).join("")}
      </div>
      <div class="bowel-row"><span class="bowel-label">是否健康</span>
${BOWEL_HEALTH.map(h => `<button class="${bowelDraft.healthy === h.id ? "sel" : ""}" onclick="setBowel('healthy','${h.id}')">${h.label}</button>`).join("")}
      </div>`;
}
function addBowel() {
    const note = document.getElementById("bowelNote").value.trim();
    if (bowelDraft.honey === null && !bowelDraft.amount && !bowelDraft.healthy && !note) {
        alert("请至少填写一项排便信息"); return;
    }
    day().bowels.push({ honey: bowelDraft.honey, amount: bowelDraft.amount, healthy: bowelDraft.healthy, note, time: nowTime() });
    bowelDraft = { honey: null, amount: "", healthy: "" };
    document.getElementById("bowelNote").value = "";
    save(); renderBowelForm(); renderBowel(); renderTimeline();
}
function delBowel(i) { removeWithUndo(day().bowels, i, "排便记录", () => { renderBowel(); renderTimeline(); }); }
function renderBowel() {
    const list = day().bowels;
    const el = document.getElementById("bowelList");
    if (!el) return;
    const healthLabel = { good: "😊 健康", mid: "😐 一般", bad: "😟 不佳" };
    el.innerHTML = list.map((b, i) => {
        const parts = [];
        if (b.amount) parts.push(`量·${b.amount}`);
        if (b.honey === true) parts.push("用了蜂蜜露");
        if (b.honey === false) parts.push("未用蜂蜜露");
        if (b.healthy) parts.push(healthLabel[b.healthy] || "");
        const summary = parts.join(" · ");
        return `<div class="entry entry-has-actions history-entry health-history-entry"><div class="history-entry-kicker">💩 排便记录</div><div class="history-entry-text">${esc(summary)}${summary && b.note ? "<br>" : ""}${b.note ? escMultiline(b.note) : ""}</div>
       <div class="meta"><span>${b.time}</span></div>
       ${entryActions(`editRecordText('bowel','${currentDate}',${i})`, `delBowel(${i})`, "编辑排便备注", "删除排便记录")}</div>`;
    }).join("");
}

/* ==================== 体重 / 睡眠 / 孕期反应 ==================== */
function saveWeight() {
    const input = document.getElementById("weightInput");
    const v = parseFloat(input.value);
    if (!v || v <= 0) { alert("请输入有效体重"); return; }
    const noteInput = document.getElementById("weightNote");
    const note = noteInput.value.trim();
    day().weight = { value: v, time: nowTime(), note };
    save(); renderWeight(); renderTimeline(); renderRecordTimeline();
    input.value = "";
    noteInput.value = "";
    flash("weightSaved");
}
function lastWeightBefore(d) {
    const dates = Object.keys(store.days).filter(x => x < d && store.days[x].weight && store.days[x].weight.value).sort();
    if (!dates.length) return null;
    const ld = dates[dates.length - 1];
    return { d: ld, value: store.days[ld].weight.value };
}
function renderWeight() {
    const o = day();
    const input = document.getElementById("weightInput");
    input.value = o.weight ? o.weight.value : "";
    document.getElementById("weightNote").value = o.weight && o.weight.note ? o.weight.note : "";
    const prev = lastWeightBefore(currentDate);
    let info = "";
    if (o.weight && prev) {
        const diff = (o.weight.value - prev.value).toFixed(1);
        info = `上次 ${prev.d}：${prev.value} kg，${diff > 0 ? "+" + diff : diff} kg`;
    } else if (prev) info = `上次 ${prev.d}：${prev.value} kg`;
    document.getElementById("weightInfo").textContent = info;
    const history = document.getElementById("weightHistory");
    if (history) {
        history.innerHTML = o.weight ? `<div class="entry entry-has-actions history-entry health-history-entry">
          <div class="history-entry-kicker">⚖️ 体重记录</div>
          <div class="history-entry-value">${esc(String(o.weight.value))}<i>kg</i></div>
          ${o.weight.note ? `<div class="history-entry-text">${escMultiline(o.weight.note)}</div>` : ""}
          <div class="meta"><span>${o.weight.time || ""}</span></div>
          ${entryActions("focusWeightRecord()", "deleteWeightRecord()", "编辑体重记录", "删除体重记录")}</div>` : "";
    }
    const heroWeight = document.getElementById("heroWeight");
    if (heroWeight) setMetric("heroWeight", o.weight && o.weight.value != null ? o.weight.value : "—", o.weight && o.weight.value != null ? "kg" : "");
}
function focusWeightRecord() {
    const input = document.getElementById("weightInput");
    if (!input) return;
    const weight = day().weight;
    input.value = weight && weight.value != null ? weight.value : "";
    const noteInput = document.getElementById("weightNote");
    if (noteInput) noteInput.value = weight && weight.note ? weight.note : "";
    input.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => { input.focus({ preventScroll: true }); input.select(); }, 220);
}
function deleteWeightRecord() {
    const previous = day().weight;
    if (!previous) return;
    day().weight = null;
    save(); renderWeight(); renderTimeline(); renderRecordTimeline();
    showUndo("已删除体重记录", () => {
        day().weight = previous;
        save(); renderWeight(); renderTimeline(); renderRecordTimeline();
    });
}
function setSleep(quality) {
    const o = day();
    o.sleep = (o.sleep && o.sleep.quality === quality) ? null : { quality, time: nowTime() };
    save(); renderSleep(); renderTimeline();
}
function renderSleep() {
    const o = day();
    const q = o.sleep ? o.sleep.quality : "";
    if (q && !["good", "mid", "bad"].includes(q)) o.sleep.quality = "mid";
    document.getElementById("sleepRow").innerHTML =
        `<button class="${q === "good" ? "sel" : ""}" onclick="setSleep('good')">😊 好</button>
     <button class="${q === "mid" ? "sel" : ""}" onclick="setSleep('mid')">😐 一般</button>
     <button class="${q === "bad" ? "sel" : ""}" onclick="setSleep('bad')">😵 差</button>
     ${o.sleep ? `<span style="font-size:11px;color:var(--text-light)">${o.sleep.time}</span>` : ""}`;
}
function toggleSymptom(tag) {
    const list = day().symptoms;
    const i = list.findIndex(s => s.tag === tag);
    if (i >= 0) list.splice(i, 1);
    else list.push({ tag, time: nowTime() });
    save(); renderSymptoms(); renderTimeline();
}
function addSymptomTag() {
    const tag = prompt("输入新的孕期反应标签：");
    if (!tag || !tag.trim()) return;
    const t = tag.trim();
    if (!store.settings.symptomTags.includes(t)) store.settings.symptomTags.push(t);
    save(); renderSymptoms();
}
function renderSymptoms() {
    const active = day().symptoms.map(s => s.tag);
    document.getElementById("symptomList").innerHTML = store.settings.symptomTags.map(t =>
        `<div class="supp-chip ${active.includes(t) ? "done" : ""}" onclick="toggleSymptom('${t.replace(/'/g, "\\'")}')">${active.includes(t) ? "✓ " : ""}${t}</div>`).join("");
}
function quickPregDiary() {
    openTextEditor({
        title: "快速记录孕期日记",
        value: "",
        placeholder: "记录此刻的身体感受、宝宝胎动、心情或产检情况…",
        hint: `将保存到 ${currentDate}，自动记录当前时间；支持长文本和换行`,
        onSave: text => {
            const time = nowTime();
            day().pregDiaries.push({ text, time, createdAt: recordDateTime(currentDate, time) });
            save(); renderAll(); showToast("孕期日记已记录");
        },
    });
}

/* ==================== 技术学习 ==================== */
/* ==================== 成长概览（Phase 4） ==================== */
const GROWTH_MODULES = [
    { id: "english", name: "英语", ic: "headphones", target: "card-english" },
    { id: "tech", name: "技术", ic: "code", target: "card-tech" },
    { id: "knowledge", name: "知识", ic: "book", target: "card-knowledge" },
    { id: "media", name: "自媒体", ic: "megaphone", target: "card-media" },
];
function growthGo(id) {
    const m = GROWTH_MODULES.find(x => x.id === id); if (!m) return;
    if (m.tab) { switchTab(m.tab); return; }
    const el = document.getElementById(m.target);
    if (!el) return;
    if (el.dataset.collapse) expandCollapseCard(el.dataset.collapse);
    el.scrollIntoView({ behavior: "smooth", block: "start" });
}
function renderGrowthOverview() {
    const el = document.getElementById("growthStats"); if (!el) return;
    const today = todayStr();
    let learnDays = 0, newCount = 0;
    const recent = [];
    for (let i = 0; i < 7; i++) {
        const d = offsetDate(today, -i);
        const o = day(d);
        const items = [];
        (o.techLogs || []).forEach(t => items.push({ d, time: t.time || "", ic: "💻", label: trunc(t.text, 22) }));
        (o.knowledge || []).forEach(k => items.push({ d, time: k.time || "", ic: "📚", label: `[${k.type}] ${trunc(k.text, 18)}` }));
        ((o.english && o.english.phrases) || []).forEach(p => items.push({ d, time: p.time || "", ic: "✍️", label: trunc(p.text, 22) }));
        (o.media || []).forEach(m => items.push({ d, time: m.time || "", ic: "📣", label: `[${m.tag}] ${trunc(m.text, 16)}` }));
        newCount += items.length;
        if (items.length || isHabitDone("english", d)) learnDays++;
        recent.push(...items);
    }
    recent.sort((a, b) => (b.d + b.time).localeCompare(a.d + a.time));
    el.innerHTML = `
    <div class="gh-metrics">
      <div class="gh-metric"><b>${learnDays}<i>天</i></b><span>本周学习</span></div>
      <div class="gh-metric"><b>${newCount}<i>条</i></b><span>本周新增</span></div>
    </div>
    <div class="gh-modules">${GROWTH_MODULES.map(m => `<button type="button" class="gh-mod" onclick="growthGo('${m.id}')"><span class="gh-mod-ic" data-ic="${m.ic}"></span>${m.name}</button>`).join("")}</div>
    ${recent.length
            ? `<div class="gh-recent-title">最近学习</div><div class="gh-recent">${recent.slice(0, 3).map(r => `<div class="gh-recent-item"><span class="gh-r-ic">${r.ic}</span><span class="gh-r-text">${esc(r.label)}</span><span class="gh-r-date">${r.d === today ? "今天" : r.d.slice(5)}</span></div>`).join("")}</div>`
            : `<div class="gh-recent-empty">本周还没有学习记录，从下面记一条开始吧 ✨</div>`}
  `;
    renderIcons(el);
}

function addTech() {
    const ta = document.getElementById("techInput");
    const text = ta.value.trim(); if (!text) return;
    day().techLogs.push({ text, time: nowTime() });
    ta.value = ""; save(); renderTech(); renderHabits(); renderTimeline();
}
function delTech(d, i) { removeWithUndo(day(d).techLogs, i, "技术笔记", () => { renderTech(); renderHabits(); renderTimeline(); }); }
function renderTech() {
    const items = [];
    Object.keys(store.days).sort().reverse().forEach(d => {
        (store.days[d].techLogs || []).forEach((t, i) => items.push({ d, i, t }));
    });
    document.getElementById("techList") && renderCollapsibleList("techList", "tech", "技术笔记", items.length,
        items.map(x => `<div class="entry entry-has-actions history-entry history-text-entry"><span class="tag">${x.d === todayStr() ? "今天" : x.d}</span><div class="history-entry-text">${escMultiline(x.t.text)}</div>
<div class="meta"><span>${x.d} ${x.t.time}</span></div>
${entryActions(`editRecordText('tech','${x.d}',${x.i})`, `delTech('${x.d}',${x.i})`, "编辑技术笔记", "删除技术笔记")}</div>`).join(""),
        `<div class="empty-tip">今天学了什么？随手记一条，同时完成"技术学习"打卡 💪</div>`);
    renderGrowthOverview();
}

/* ==================== 孕期日记 ==================== */        function addPregDiary() {
    const ta = document.getElementById("pregDiaryInput");
    const text = ta.value.trim(); if (!text) return;
    const time = nowTime();
    day().pregDiaries.push({ text, time, createdAt: recordDateTime(currentDate, time) });
    ta.value = ""; save(); renderToday();
}
function delPregDiary(i) { removeWithUndo(day().pregDiaries, i, "孕期日记", renderToday); }
function renderPregDiaries() {
    const list = day().pregDiaries.map((p, i) => ({ p, i }))
        .sort((a, b) => recordTimestampValue(b.p, currentDate) - recordTimestampValue(a.p, currentDate));
    const el = document.getElementById("pregDiaryList");
    el.innerHTML = list.map(({ p, i }) =>
        `<div class="entry entry-has-actions history-entry history-text-entry"><div class="history-entry-text">${escMultiline(p.text)}</div><div class="meta"><span>${p.time}</span></div>
     ${entryActions(`editRecordText('pregDiary','${currentDate}',${i})`, `delPregDiary(${i})`, "编辑孕期日记", "删除孕期日记")}</div>`).join("");
}

/* ==================== 自媒体运营 ==================== */
let mediaTag = "小红书";
let mediaFilter = "全部";
function selectMediaTag(btn) {
    mediaTag = btn.dataset.mtag;
    document.querySelectorAll("#mediaTagRow button").forEach(b => b.classList.toggle("ghost", b !== btn));
}
function addMedia() {
    const ta = document.getElementById("mediaInput");
    const text = ta.value.trim(); if (!text) return;
    day().media.push({ text, tag: mediaTag, time: nowTime() });
    ta.value = ""; save(); renderMedia(); renderTimeline();
}
function delMedia(d, i) { removeWithUndo(day(d).media, i, "运营记录", () => { renderMedia(); renderTimeline(); }); }
function setMediaFilter(tag) { mediaFilter = tag; renderMedia(); }
function renderMedia() {
    const all = [];
    Object.keys(store.days).sort().reverse().forEach(d => {
        (store.days[d].media || []).forEach((m, i) => all.push({ d, i, m }));
    });
    const tags = ["全部", ...Array.from(new Set(all.map(x => x.m.tag)))];
    if (!tags.includes(mediaFilter)) mediaFilter = "全部";
    document.getElementById("mediaFilterRow").innerHTML = tags.map(t =>
        `<button class="filter-chip ${mediaFilter === t ? "sel" : ""}" onclick="setMediaFilter('${t.replace(/'/g, "\\'")}')">${t} (${t === "全部" ? all.length : all.filter(x => x.m.tag === t).length})</button>`).join("");
    const items = mediaFilter === "全部" ? all : all.filter(x => x.m.tag === mediaFilter);
    renderCollapsibleList("mediaList", "media", "运营", items.length,
        items.map(x => `<div class="entry entry-has-actions history-entry history-text-entry"><span class="tag">${x.m.tag}</span><div class="history-entry-text">${escMultiline(x.m.text)}</div>
<div class="meta"><span>${x.d} ${x.m.time}</span></div>
${entryActions(`editRecordText('media','${x.d}',${x.i})`, `delMedia('${x.d}',${x.i})`, "编辑运营记录", "删除运营记录")}</div>`).join(""),
        `<div class="empty-tip">还没有运营记录，发布一条 / 整理素材就记一条吧</div>`);
    renderGrowthOverview();
}

/* ==================== 想法碎片 ==================== */
let thoughtTagsSelected = [];
let thoughtFilter = "全部";
function selectThoughtTag(tag) {
    const i = thoughtTagsSelected.indexOf(tag);
    if (i >= 0) thoughtTagsSelected.splice(i, 1);
    else thoughtTagsSelected.push(tag);
    renderThoughtTagRow();
}
function addThoughtTag() {
    const tag = prompt("输入新的想法 tag：");
    if (!tag || !tag.trim()) return;
    const t = tag.trim();
    if (!store.settings.thoughtTags.includes(t)) store.settings.thoughtTags.push(t);
    if (!thoughtTagsSelected.includes(t)) thoughtTagsSelected.push(t);
    save(); renderThoughtTagRow();
}
function renderThoughtTagRow() {
    document.getElementById("thoughtTagRow").innerHTML = store.settings.thoughtTags.map(t =>
        `<button type="button" class="filter-chip ${thoughtTagsSelected.includes(t) ? "sel" : ""}" aria-pressed="${thoughtTagsSelected.includes(t)}" onclick="selectThoughtTag('${t.replace(/'/g, "\\'")}')">${esc(t)}</button>`).join("")
        + `<button class="filter-chip" onclick="addThoughtTag()">+ 自定义</button>`;
}
function thoughtTagsOf(t) {
    if (Array.isArray(t && t.tags)) return t.tags;
    return t && t.tag ? [t.tag] : [];
}
function addThought() {
    const ta = document.getElementById("thoughtInput");
    const text = ta.value.trim(); if (!text) return;
    const time = nowTime();
    day().thoughts.push({ text, tags: [...thoughtTagsSelected], time, date: currentDate, createdAt: recordDateTime(currentDate, time) });
    ta.value = "";
    thoughtTagsSelected = [];
    save(); renderThoughtTagRow(); renderThoughts(); renderTimeline();
}
function delThought(d, i) { removeWithUndo(day(d).thoughts, i, "想法", () => { renderThoughts(); renderTimeline(); }); }
function setThoughtFilter(tag) { thoughtFilter = tag; renderThoughts(); }
function renderThoughts() {
    // 使用完整时间戳全局排序，避免先按日期桶、再按插入顺序造成错序。
    const all = [];
    Object.keys(store.days).forEach(d => {
        (store.days[d].thoughts || []).forEach((t, i) => all.push({ d, i, t }));
    });
    all.sort((a, b) => recordTimestampValue(b.t, b.d) - recordTimestampValue(a.t, a.d));
    const tags = ["全部", ...Array.from(new Set(all.flatMap(x => thoughtTagsOf(x.t))))];
    if (!tags.includes(thoughtFilter)) thoughtFilter = "全部";
    document.getElementById("thoughtFilterRow").innerHTML = tags.length > 1 ? tags.map(t =>
        `<button class="filter-chip ${thoughtFilter === t ? "sel" : ""}" onclick="setThoughtFilter('${t.replace(/'/g, "\\'")}')">${esc(t)} (${t === "全部" ? all.length : all.filter(x => thoughtTagsOf(x.t).includes(t)).length})</button>`).join("") : "";
    const items = thoughtFilter === "全部" ? all : all.filter(x => thoughtTagsOf(x.t).includes(thoughtFilter));
    renderCollapsibleList("thoughtList", "thoughts", "想法", items.length,
        items.map(x => `<div class="entry entry-has-actions history-entry history-text-entry">${thoughtTagsOf(x.t).map(t => `<span class="tag">${esc(t)}</span>`).join("")}<div class="history-entry-text">${escMultiline(x.t.text)}</div>
<div class="meta"><span>${x.d} ${x.t.time}</span></div>
${entryActions(`editRecordText('thought','${x.d}',${x.i})`, `delThought('${x.d}',${x.i})`, "编辑想法", "删除想法")}</div>`).join(""),
        `<div class="empty-tip">还没有想法碎片，随手记一条吧</div>`);
}

/* ==================== 有意思的知识 ==================== */
function selectKType(btn) {
    kType = btn.dataset.ktype;
    document.querySelectorAll("#knowledgeTypeRow button").forEach(b => {
        b.classList.toggle("ghost", b !== btn);
    });
}
function addKnowledge() {
    const ta = document.getElementById("knowledgeInput");
    const text = ta.value.trim(); if (!text) return;
    day().knowledge.push({ text, type: kType, time: nowTime() });
    ta.value = ""; save(); renderKnowledge(); renderTimeline();
}
function delKnowledge(d, i) { removeWithUndo(day(d).knowledge, i, "知识", () => { renderKnowledge(); renderTimeline(); }); }
function renderKnowledge() {
    const items = [];
    Object.keys(store.days).sort().reverse().forEach(d => {
        (store.days[d].knowledge || []).forEach((k, i) => items.push({ d, i, k }));
    });
    renderCollapsibleList("knowledgeList", "knowledge", "知识", items.length,
        items.map(x => `<div class="entry entry-has-actions history-entry history-text-entry"><span class="tag">${x.k.type}</span><div class="history-entry-text">${escMultiline(x.k.text)}</div>
<div class="meta"><span>${x.d} ${x.k.time}</span></div>
${entryActions(`editRecordText('knowledge','${x.d}',${x.i})`, `delKnowledge('${x.d}',${x.i})`, "编辑知识记录", "删除知识记录")}</div>`).join(""),
        `<div class="empty-tip">今天听了什么播客、看了什么好文章？记下来吧</div>`);
    renderGrowthOverview();
}

/* ==================== 丰盛（开支 / 冷静购物） ==================== */
let expenseCat = EXPENSE_CATS[0].id;
let wishFilter = "全部";
function fmtMoney(n) { n = Math.round((Number(n) || 0) * 100) / 100; return n % 1 === 0 ? String(n) : n.toFixed(2); }
function catIcon(id) { const c = EXPENSE_CATS.find(x => x.id === id); return c ? c.icon : "✨"; }
function expenseTotal(d) { return day(d).expenses.reduce((s, e) => s + (e.amount || 0), 0); }
function selectExpenseCat(id) { expenseCat = id; renderExpenseCatRow(); }
function renderExpenseCatRow() {
    document.getElementById("expenseCatRow").innerHTML = EXPENSE_CATS.map(c =>
        `<button class="filter-chip ${expenseCat === c.id ? "sel" : ""}" onclick="selectExpenseCat('${c.id}')">${c.icon} ${c.id}</button>`).join("");
}
function addExpense() {
    const amtEl = document.getElementById("expenseAmount");
    const amt = parseFloat(amtEl.value);
    if (!(amt > 0)) { alert("请输入正确的金额"); return; }
    const note = document.getElementById("expenseNote").value.trim();
    day().expenses.push({ amount: Math.round(amt * 100) / 100, cat: expenseCat, note, time: nowTime() });
    amtEl.value = ""; document.getElementById("expenseNote").value = "";
    save(); renderWealth(); renderTimeline();
}
function delExpense(i) { removeWithUndo(day().expenses, i, "开支", () => { renderWealth(); renderTimeline(); }); }
function renderExpenses() {
    const list = day().expenses;
    document.getElementById("expenseTodayBadge").textContent = "¥" + fmtMoney(expenseTotal(currentDate));
    const expEl = document.getElementById("heroExpense");
    if (expEl) expEl.textContent = "¥" + fmtMoney(expenseTotal(currentDate));
    document.getElementById("expenseList").innerHTML = list.length
        ? list.map((e, i) => `<div class="entry entry-has-actions history-entry"><div class="history-entry-kicker"><span class="tag">${catIcon(e.cat)} ${e.cat}</span><b>¥${fmtMoney(e.amount)}</b></div>${e.note ? `<div class="history-entry-text">${escMultiline(e.note)}</div>` : ""}
<div class="meta"><span>${e.time}</span></div>
${entryActions(`editRecordText('expense','${currentDate}',${i})`, `delExpense(${i})`, "编辑开支备注", "删除开支")}</div>`).join("")
        : `<div class="empty-tip">今天还没有记账，点上方分类记一笔吧</div>`;
}
function addWish() {
    const itemEl = document.getElementById("wishItem");
    const item = itemEl.value.trim(); if (!item) { alert("请填写想买的东西"); return; }
    const amt = parseFloat(document.getElementById("wishAmount").value);
    const reason = document.getElementById("wishReason").value.trim();
    day().wishes.push({ item, amount: amt > 0 ? Math.round(amt * 100) / 100 : 0, reason, status: "cooling", time: nowTime(), date: currentDate });
    itemEl.value = ""; document.getElementById("wishAmount").value = ""; document.getElementById("wishReason").value = "";
    save(); renderWealth();
}
function setWishStatus(d, i, status) {
    const w = day(d).wishes[i]; if (!w) return;
    w.status = status; w.decidedAt = todayStr();
    save(); renderWealth();
}
function delWish(d, i) { removeWithUndo(day(d).wishes, i, "想买记录", renderWealth); }
function setWishFilter(f) { wishFilter = f; renderWishes(); }
function renderWishes() {
    const all = [];
    Object.keys(store.days).sort().reverse().forEach(d => (store.days[d].wishes || []).forEach((w, i) => all.push({ d, i, w })));
    const statusLabel = { cooling: "冷静中", resisted: "忍住了", bought: "已购买" };
    const filters = ["全部", "冷静中", "忍住了", "已购买"];
    document.getElementById("wishFilterRow").innerHTML = filters.map(f =>
        `<button class="filter-chip ${wishFilter === f ? "sel" : ""}" onclick="setWishFilter('${f}')">${f} (${f === "全部" ? all.length : all.filter(x => statusLabel[x.w.status] === f).length})</button>`).join("");
    const items = wishFilter === "全部" ? all : all.filter(x => statusLabel[x.w.status] === wishFilter);
    document.getElementById("wishList").innerHTML = items.length
        ? items.map(x => {
            const w = x.w;
            const coolDays = Math.round((new Date(todayStr()) - new Date(w.date || x.d)) / 86400000);
            let head, actions = "";
            if (w.status === "resisted") head = `<span class="tag tag-good">✋ 忍住 · 省 ¥${fmtMoney(w.amount)}</span>`;
            else if (w.status === "bought") head = `<span class="tag tag-bad">🛒 已购买${w.amount ? " ¥" + fmtMoney(w.amount) : ""}</span>`;
            else {
                head = `<span class="tag">🧊 冷静 ${coolDays} 天</span>`;
                actions = `<div class="wish-actions"><button class="btn small" onclick="setWishStatus('${x.d}',${x.i},'resisted')">✋ 忍住了</button><button class="btn small ghost" onclick="setWishStatus('${x.d}',${x.i},'bought')">🛒 还是买了</button></div>`;
            }
            return `<div class="entry entry-has-actions history-entry">${head}<div class="history-entry-value history-entry-value-small">${esc(w.item)}${w.amount ? `<i>¥${fmtMoney(w.amount)}</i>` : ""}</div><div class="wish-reason-row"><div class="wish-reason history-entry-text ${w.reason ? "" : "empty"}">${w.reason ? escMultiline(w.reason) : "添加购买理由"}</div><button type="button" class="wish-reason-edit" onclick="editRecordText('wishReason','${x.d}',${x.i})" aria-label="编辑购买理由" title="编辑购买理由">${icon("edit")}</button></div>
<div class="meta"><span>${x.d} ${w.time}</span></div>${actions}
${entryActions(`editRecordText('wishItem','${x.d}',${x.i})`, `delWish('${x.d}',${x.i})`, "编辑想买物品", "删除想买记录")}</div>`;
        }).join("")
        : `<div class="empty-tip">还没有想买清单，冲动消费前先加进来冷静一下 🧊</div>`;
}
function renderWealthSummary() {
    const ym = todayStr().slice(0, 7);
    let total = 0; const byCat = {};
    Object.keys(store.days).filter(d => d.startsWith(ym)).forEach(d =>
        (store.days[d].expenses || []).forEach(e => { total += e.amount || 0; byCat[e.cat] = (byCat[e.cat] || 0) + (e.amount || 0); }));
    const wishesAll = [];
    Object.keys(store.days).forEach(d => (store.days[d].wishes || []).forEach(w => wishesAll.push(w)));
    const cooling = wishesAll.filter(w => w.status === "cooling").length;
    const saved = wishesAll.filter(w => w.status === "resisted").reduce((s, w) => s + (w.amount || 0), 0);
    const stat = (num, label) => `<div class="wealth-stat"><div class="ws-num">${num}</div><div class="ws-label">${label}</div></div>`;
    const stats = `<div class="wealth-stats">${stat("¥" + fmtMoney(total), "本月支出")}${stat("¥" + fmtMoney(saved), "忍住省下")}${stat(cooling, "冷静中")}</div>`;
    const cats = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
    const bd = cats.length
        ? `<div class="cat-breakdown">` + cats.map(([c, v]) => {
            const pct = total ? Math.round(v / total * 100) : 0;
            return `<div class="cat-bar-row"><span class="cat-bar-label">${catIcon(c)} ${c}</span><div class="cat-bar"><div class="cat-bar-fill" style="width:${pct}%"></div></div><span class="cat-bar-val">¥${fmtMoney(v)}</span></div>`;
        }).join("") + `</div>`
        : `<div class="empty-tip">本月还没有支出记录</div>`;
    document.getElementById("wealthSummary").innerHTML = stats + bd;
}
function renderWealth() { renderExpenseCatRow(); renderExpenses(); renderWishes(); renderWealthSummary(); }

/* ==================== 语音转文字 ==================== */
let recognition = null, recTarget = null, recBtn = null, recBaseText = "";
function toggleMic(targetId, btnId) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("当前浏览器不支持语音识别，请使用 Chrome 或 Edge 浏览器。"); return; }
    if (recognition) { recognition.stop(); return; }
    recTarget = document.getElementById(targetId);
    recBtn = document.getElementById(btnId);
    recBaseText = recTarget.value;
    recognition = new SR();
    recognition.lang = "zh-CN";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = e => {
        let finalText = "", interim = "";
        for (let i = 0; i < e.results.length; i++) {
            if (e.results[i].isFinal) finalText += e.results[i][0].transcript;
            else interim += e.results[i][0].transcript;
        }
        recTarget.value = recBaseText + finalText + interim;
    };
    recognition.onerror = e => {
        if (e.error === "not-allowed") alert("请允许浏览器使用麦克风权限。");
        stopMic();
    };
    recognition.onend = stopMic;
    recognition.start();
    setMicUI(recBtn, true);
}
function stopMic() {
    setMicUI(recBtn, false);
    recognition = null; recTarget = null; recBtn = null;
}
function setMicUI(btn, recording) {
    if (!btn) return;
    btn.classList.toggle("recording", recording);
    if (btn.classList.contains("text-btn")) {
        btn.textContent = recording ? "停止录音" : "语音输入";
    } else {
        btn.innerHTML = icon(recording ? "square" : "mic");
    }
}

/* ==================== 日历 ==================== */
function shiftMonth(n) {
    calMonth += n;
    if (calMonth < 0) { calMonth = 11; calYear--; }
    if (calMonth > 11) { calMonth = 0; calYear++; }
    renderCalendar();
}
function renderCalendar() {
    document.getElementById("calTitle").textContent = `${calYear} 年 ${calMonth + 1} 月`;
    const first = new Date(calYear, calMonth, 1);
    const startDow = first.getDay(); // 0=Sun
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const today = todayStr();
    let html = ["日", "一", "二", "三", "四", "五", "六"].map(d => `<div class="dow">${d}</div>`).join("");
    for (let i = 0; i < startDow; i++) html += `<div class="cal-cell other"></div>`;
    for (let d = 1; d <= daysInMonth; d++) {
        const ds = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        let dot = "";
        if (store.days[ds]) {
            const n = habitDoneCount(ds);
            const p = n === 0 ? 0 : n <= 3 ? 1 : n < activeHabits().length ? 2 : 3;
            if (n > 0) dot = `<div class="cal-dot p${p}"></div>`;
            else dot = `<div class="cal-dot"></div>`;
        }
        html += `<div class="cal-cell ${ds === today ? "today" : ""} ${ds === currentDate ? "selected" : ""}" onclick="calPick('${ds}')">${d}${dot}</div>`;
    }
    document.getElementById("calGrid").innerHTML = html;
}
function calPick(ds) {
    setDate(ds);
    const homeTab = document.querySelector('nav.tabs button[data-tab="home"]');
    if (homeTab) homeTab.click();
}

/* ==================== 统计辅助 ==================== */
function offsetDate(base, n) {
    const d = new Date(base + "T12:00:00");
    d.setDate(d.getDate() + n);
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}
function renderTrends() {
    const today = todayStr();
    const days = [];
    for (let i = 29; i >= 0; i--) days.push(offsetDate(today, -i));
    // 体重折线图
    const wEl = document.getElementById("weightChart");
    const pts = days.map((d, i) => {
        const o = store.days[d];
        return { i, w: o && o.weight && o.weight.value ? parseFloat(o.weight.value) : null };
    }).filter(p => p.w != null);
    if (pts.length < 2) {
        wEl.innerHTML = `<div class="empty-tip">记录 2 天以上体重后显示趋势图</div>`;
    } else {
        const W = 320, H = 130, P = 26;
        const min = Math.min(...pts.map(p => p.w)), max = Math.max(...pts.map(p => p.w));
        const span = (max - min) || 1;
        const x = i => P + i * (W - 2 * P) / 29;
        const y = w => H - P - (w - min) * (H - 2 * P) / span;
        const line = pts.map(p => `${x(p.i).toFixed(1)},${y(p.w).toFixed(1)}`).join(" ");
        const dots = pts.map(p => `<circle cx="${x(p.i).toFixed(1)}" cy="${y(p.w).toFixed(1)}" r="3" fill="var(--primary)"/>`).join("");
        const last = pts[pts.length - 1];
        wEl.innerHTML = `<svg viewBox="0 0 ${W} ${H}" style="width:100%">
<text x="2" y="${y(max) + 4}" font-size="10" fill="var(--text-light)">${max}</text>
<text x="2" y="${y(min) + 4}" font-size="10" fill="var(--text-light)">${min}</text>
<polyline points="${line}" fill="none" stroke="var(--primary)" stroke-width="2" stroke-linejoin="round"/>${dots}
<text x="${x(last.i).toFixed(1)}" y="${(y(last.w) - 8).toFixed(1)}" font-size="11" fill="var(--primary-dark)" text-anchor="middle" font-weight="bold">${last.w}kg</text>
      </svg><div class="chart-range">${days[0].slice(5)} ～ ${days[29].slice(5)}</div>`;
    }
    // 孕期反应历史
    const hLabel = { good: "😊", mid: "😐", bad: "😟" };
    const items = [];
    Object.keys(store.days).sort().reverse().forEach(d => {
        const s = (store.days[d].symptoms || []).map(x => x.tag);
        if (s.length) items.push({ d, tags: s });
    });
    document.getElementById("symptomHistory").innerHTML = items.length
        ? items.slice(0, 30).map(x => `<div class="entry"><span class="tag">${x.d === today ? "今天" : x.d}</span>${x.tags.map(t => esc(t)).join("、")}</div>`).join("")
        : `<div class="empty-tip">还没有孕期反应记录</div>`;
}
function renderHistory() { renderCalendar(); renderTrends(); renderWeekly(); renderSearch(); }

/* ==================== 全局搜索 ==================== */
function collectSearchItems() {
    const items = [];
    const rlbl = { good: "控糖良好", mid: "一般", bad: "超标" };
    const slbl = { good: "好", mid: "一般", bad: "差" };
    const blbl = { good: "健康", mid: "一般", bad: "不佳" };
    Object.keys(store.days).sort().reverse().forEach(d => {
        const o = store.days[d];
        (o.thoughts || []).forEach(x => { const tags = thoughtTagsOf(x); items.push({ d, time: x.time, type: tags.length ? "想法·" + tags.join("/") : "想法", text: x.text }); });
        (o.knowledge || []).forEach(x => items.push({ d, time: x.time, type: "知识·" + x.type, text: x.text }));
        (o.media || []).forEach(x => items.push({ d, time: x.time, type: "运营·" + x.tag, text: x.text }));
        (o.techLogs || []).forEach(x => items.push({ d, time: x.time, type: "技术", text: x.text }));
        (o.reviews || []).forEach(x => items.push({ d, time: x.time, type: "复盘", text: x.text }));
        (o.gratitude || []).forEach(x => items.push({ d, time: x.time, type: "感恩", text: x.text }));
        (o.pregDiaries || []).forEach(x => items.push({ d, time: x.time, type: "孕期日记", text: x.text }));
        (o.exercises || []).forEach(x => items.push({ d, time: x.time, type: "锻炼", text: x.text }));
        if (o.english && o.english.phrases) o.english.phrases.forEach(x => items.push({ d, time: x.time, type: "英语知识点", text: x.text }));
        if (o.english && o.english.tasks) Object.entries(o.english.tasks).forEach(([id, rec]) => { const t = ENG_TASKS.find(x => x.id === id); (rec.notes || []).forEach(n => items.push({ d, time: n.time, type: "英语·" + (t ? t.name : id), text: n.text })); });
        (o.tasks || []).forEach(x => items.push({
            d: x.createdDate || d,
            time: x.done ? x.completedTime : x.createdTime,
            type: x.done ? "任务·已完成" : "任务·待办",
            text: x.text + (x.done && x.completedDate ? `（完成于 ${x.completedDate}）` : ""),
        }));
        (o.expenses || []).forEach(x => items.push({ d, time: x.time, type: "开支·" + x.cat, text: (x.note || "") + " ¥" + x.amount }));
        (o.wishes || []).forEach(x => items.push({ d, time: x.time, type: "想买", text: x.item + (x.reason ? " — " + x.reason : "") }));
        MEALS.forEach(m => { const r = o.meals && o.meals[m.id]; if (r && (r.food || r.rating)) items.push({ d, time: r.time, type: m.name, text: (r.food || "") + (r.rating ? "（" + (rlbl[r.rating] || "") + "）" : "") }); });
        (o.snacks || []).forEach(x => { if (x.food || x.rating) items.push({ d, time: x.time, type: "加餐", text: (x.food || "") + (x.rating ? "（" + (rlbl[x.rating] || "") + "）" : "") }); });
        (o.bowels || []).forEach(x => { const parts = [x.amount ? "量·" + x.amount : "", x.honey === true ? "用蜂蜜露" : "", blbl[x.healthy] || "", x.note || ""].filter(Boolean).join(" "); items.push({ d, time: x.time, type: "排便", text: parts }); });
        if (o.weight && o.weight.value != null) items.push({ d, time: o.weight.time, type: "体重", text: o.weight.value + " kg" + (o.weight.note ? " — " + o.weight.note : "") });
        if (o.sleep && o.sleep.quality) items.push({ d, time: o.sleep.time, type: "睡眠", text: slbl[o.sleep.quality] || "一般" });
        (o.symptoms || []).forEach(x => items.push({ d, time: x.time, type: "孕期反应", text: x.tag }));
        Object.entries(o.supplements || {}).forEach(([n, s]) => { if (s.done) items.push({ d, time: s.time, type: "补剂", text: n }); });
    });
    return items;
}
function renderSearch() {
    const el = document.getElementById("searchResults");
    const q = (document.getElementById("searchInput").value || "").trim().toLowerCase();
    if (!q) { el.innerHTML = ""; return; }
    const hits = collectSearchItems().filter(x => (x.text || "").toLowerCase().includes(q) || (x.type || "").toLowerCase().includes(q)).slice(0, 80);
    el.innerHTML = hits.length
        ? hits.map(x => `<div class="entry search-hit" onclick="jumpToRecord('${x.d}','${typeToTab(x.type)}')"><span class="tag">${esc(x.type)}</span>${escMultiline(x.text)}
      <div class="meta"><span>${x.d} ${x.time || ""} · 点击查看 ›</span></div></div>`).join("")
        : `<div class="empty-tip">没有找到包含「${esc(q)}」的记录</div>`;
}
function typeToTab(type) {
    type = type || "";
    if (type.startsWith("想法") || type.startsWith("运营")) return "review";
    if (type.startsWith("知识")) return "growth";
    if (type === "技术") return "growth";
    if (type.startsWith("英语")) return "growth";
    if (type === "复盘" || type === "感恩") return "home";
    if (type.startsWith("任务")) return "todos";
    if (type.startsWith("开支") || type === "想买") return "wealth";
    return "record"; // 餐食/加餐/排便/体重/睡眠/孕期反应/日记/锻炼/补剂
}
function jumpToRecord(d, tab) {
    setDate(d);
    switchTab(tab);
}

/* ==================== 打卡汇总 ==================== */
let weeklyRange = 7;
function setWeeklyRange(n) {
    weeklyRange = n;
    document.getElementById("range7").classList.toggle("sel", n === 7);
    document.getElementById("range30").classList.toggle("sel", n === 30);
    document.getElementById("weeklyBadge").textContent = `近 ${n} 天`;
    renderWeekly();
}
function weekData() {
    const today = todayStr();
    const days = [];
    for (let i = weeklyRange - 1; i >= 0; i--) days.push(offsetDate(today, -i));
    return days;
}
function healthDetailLine(d) {
    const o = store.days[d]; if (!o) return "";
    const worst = hs => hs.includes("bad") ? "bad" : hs.includes("mid") ? "mid" : hs.includes("good") ? "good" : "";
    const gradeLabel = { good: "良好", mid: "一般", bad: "超标" };
    const sleepLabel = { good: "好", mid: "一般", bad: "差" };
    const hLabel = { good: "健康", mid: "一般", bad: "不佳" };
    const water = waterTotal(d);
    const meals = Object.values(o.meals || {}).concat(o.snacks || []);
    const rate = worst(meals.map(m => m.rating).filter(Boolean));
    const exN = (o.exercises || []).length;
    const sleep = o.sleep ? sleepLabel[o.sleep.quality] || "一般" : "-";
    const bw = o.bowels || [];
    const bwHealth = worst(bw.map(b => b.healthy).filter(Boolean));
    const parts = [
        `💧${water || 0}ml`,
        `🍬${rate ? gradeLabel[rate] : "-"}`,
        `🏃${exN}次`,
        `😴${sleep}`,
        `💩${bw.length ? bw.length + "次" + (bwHealth ? "/" + hLabel[bwHealth] : "") : "无"}`,
    ];
    if (o.weight && o.weight.value != null) parts.push(`⚖️${o.weight.value}kg`);
    const symN = (o.symptoms || []).length;
    if (symN) parts.push(`🤕${symN}项`);
    return parts.join(" ");
}
function buildWeeklyText() {
    const days = weekData();
    const n = days.length;
    const lines = [
        "【请帮我分析这份健康打卡数据】",
        "重点关注「喝水 / 饮食(控糖) / 运动」与「排便、睡眠、孕期反应」之间的关联规律，指出问题并给出具体、可执行的改善建议。",
        "",
        `📋 汇总 ${days[0]} ～ ${days[n - 1]}（近 ${n} 天）`
    ];
    const ratingLabel = { good: "控糖良好", mid: "一般", bad: "超标" };
    // 打卡
    const counts = days.map(d => habitDoneCount(d));
    lines.push(`✅ 打卡：日均 ${(counts.reduce((a, b) => a + b, 0) / n).toFixed(1)}/${activeHabits().length}，全勤 ${counts.filter(c => c === activeHabits().length).length} 天`);
    // 体重
    const ws = days.map(d => store.days[d] && store.days[d].weight ? store.days[d].weight.value : null).filter(v => v != null);
    if (ws.length) lines.push(`⚖️ 体重：${ws[0]} → ${ws[ws.length - 1]} kg（${(ws[ws.length - 1] - ws[0]) >= 0 ? "+" : ""}${(ws[ws.length - 1] - ws[0]).toFixed(1)}）`);
    // 控糖
    let rGood = 0, rMid = 0, rBad = 0;
    days.forEach(d => {
        const o = store.days[d]; if (!o) return;
        Object.values(o.meals || {}).concat(o.snacks || []).forEach(m => {
            if (m.rating === "good") rGood++; else if (m.rating === "mid") rMid++; else if (m.rating === "bad") rBad++;
        });
    });
    if (rGood + rMid + rBad) lines.push(`🍬 控糖：良好 ${rGood} 餐 · 一般 ${rMid} 餐 · 超标 ${rBad} 餐`);
    // 喝水
    const waters = days.map(d => waterTotal(d));
    const waterDays = waters.filter(v => v > 0);
    if (waterDays.length) lines.push(`💧 喝水：日均 ${Math.round(waterDays.reduce((a, b) => a + b, 0) / waterDays.length)}ml · 达标(≥${waterGoal()}ml) ${waters.filter(v => v >= waterGoal()).length}/${n} 天`);
    // 睡眠 / 排便 / 反应
    const sleeps = days.map(d => store.days[d] && store.days[d].sleep ? store.days[d].sleep.quality : null).filter(Boolean);
    if (sleeps.length) {
        lines.push(`😴 睡眠：好 ${sleeps.filter(s => s === "good").length} 晚 · 一般 ${sleeps.filter(s => s === "mid").length} 晚 · 差 ${sleeps.filter(s => s === "bad").length} 晚`);
    }
    const hLabel = { good: "健康", mid: "一般", bad: "不佳" };
    const bowels = [];
    days.forEach(d => (store.days[d] && store.days[d].bowels || []).forEach(b => bowels.push(b)));
    if (bowels.length) lines.push(`💩 排便：共 ${bowels.length} 次，${["good", "mid", "bad"].map(h => { const n = bowels.filter(b => b.healthy === h).length; return n ? hLabel[h] + " " + n : ""; }).filter(Boolean).join(" · ") || "未评估"}`);
    const sympCount = {};
    days.forEach(d => (store.days[d] && store.days[d].symptoms || []).forEach(s => sympCount[s.tag] = (sympCount[s.tag] || 0) + 1));
    if (Object.keys(sympCount).length) lines.push(`🤕 孕期反应：${Object.entries(sympCount).sort((a, b) => b[1] - a[1]).map(([t, n]) => `${t}×${n}`).join(" · ")}`);
    // 每日健康明细（按天对齐，便于 AI 关联分析：喝水/控糖/运动/睡眠/排便/反应）
    const detail = days.map(d => { const line = healthDetailLine(d); return line ? `${d.slice(5)}｜${line}` : null; }).filter(Boolean);
    if (detail.length) { lines.push("", "📊 每日健康明细（喝水/控糖/运动/睡眠/排便/体重）："); detail.forEach(x => lines.push(x)); }
    // 丰盛（开支 / 冷静购物）
    let expTotal = 0; const catSum = {};
    days.forEach(d => (store.days[d] && store.days[d].expenses || []).forEach(e => { expTotal += e.amount || 0; catSum[e.cat] = (catSum[e.cat] || 0) + (e.amount || 0); }));
    if (expTotal > 0) {
        const catStr = Object.entries(catSum).sort((a, b) => b[1] - a[1]).map(([c, v]) => `${c} ¥${fmtMoney(v)}`).join(" · ");
        lines.push("", `💸 支出：共 ¥${fmtMoney(expTotal)}（日均 ¥${fmtMoney(expTotal / n)}）`, `　分类：${catStr}`);
    }
    const wishesW = [];
    days.forEach(d => (store.days[d] && store.days[d].wishes || []).forEach(w => wishesW.push({ d, w })));
    if (wishesW.length) {
        const resisted = wishesW.filter(x => x.w.status === "resisted");
        const bought = wishesW.filter(x => x.w.status === "bought");
        const cooling = wishesW.filter(x => x.w.status === "cooling");
        const saved = resisted.reduce((s, x) => s + (x.w.amount || 0), 0);
        lines.push(`🧊 冷静购物：新增 ${wishesW.length} 件 · 忍住 ${resisted.length} 件(省 ¥${fmtMoney(saved)}) · 冷静中 ${cooling.length} 件 · 购买 ${bought.length} 件`);
        const stLabel = { cooling: "🧊冷静中", resisted: "✋忍住", bought: "🛒买了" };
        wishesW.forEach(({ d, w }) => lines.push(`· ${d.slice(5)} ${w.item}${w.amount ? " ¥" + fmtMoney(w.amount) : ""}（${stLabel[w.status] || ""}）${w.reason ? "：" + w.reason : ""}`));
    }
    // 锻炼 / 英语 / 技术
    const exs = []; days.forEach(d => (store.days[d] && store.days[d].exercises || []).forEach(x => exs.push(`${d.slice(5)} ${x.text}`)));
    if (exs.length) { lines.push("", "🏃 锻炼："); exs.forEach(x => lines.push(`· ${x}`)); }
    const engDays = days.filter(d => isHabitDone("english", d)).length;
    const techDays = days.filter(d => isHabitDone("tech", d)).length;
    lines.push("", `🎧 英语打卡 ${engDays}/${n} 天 · 💻 技术打卡 ${techDays}/${n} 天`);
    // 文字记录
    const push = (title, key) => {
        const arr = []; days.forEach(d => ((store.days[d] && store.days[d][key]) || []).forEach(x => arr.push(`${d.slice(5)} ${x.text}`)));
        if (arr.length) { lines.push("", title); arr.forEach(x => lines.push(`· ${x}`)); }
    };
    push("🌙 复盘：", "reviews");
    push("💛 感恩：", "gratitude");
    push("🤰 孕期日记：", "pregDiaries");
    return lines.join("\n");
}
function renderWeekly() {
    const el = document.getElementById("weeklyReport");
    const days = weekData();
    const n = days.length;
    const dense = n > 7;
    const today = todayStr();
    const DONE = "#7ca98f", MID = "#e0b060", BAD = "#c0392b", NONE = "var(--border)";
    const dow = ["日", "一", "二", "三", "四", "五", "六"];
    let html = `<div class="week-grid ${dense ? "dense" : ""}" style="grid-template-columns:minmax(${dense ? 72 : 88}px,auto) repeat(${n},1fr)">`;
    // 表头：7天模式显星期+日期，30天模式每5天标一个日期
    html += `<div></div>` + days.map((d, i) => {
        const dt = new Date(d + "T12:00:00");
        if (!dense) return `<div class="week-day-head ${d === today ? "today" : ""}">${dow[dt.getDay()]}<br>${d.slice(8)}</div>`;
        const show = i % 5 === 0 || d === today;
        return `<div class="week-day-head ${d === today ? "today" : ""}">${show ? d.slice(8) : ""}</div>`;
    }).join("");
    const row = (label, cells) => `<div class="week-label">${label}</div>` + cells.join("");
    const cell = (color, title) => `<div class="week-cell" title="${title}" style="background:${color}"></div>`;
    // 每个习惯一行
    activeHabits().forEach(h => {
        html += row(`${h.icon} ${h.name}`, days.map(d =>
            cell(isHabitDone(h.id, d) ? DONE : NONE, `${d} ${h.name}${isHabitDone(h.id, d) ? " ✓" : ""}`)));
    });
    // 控糖评估（三餐+加餐取最差）
    const worstOf = hs => hs.includes("bad") ? "bad" : hs.includes("mid") ? "mid" : hs.includes("good") ? "good" : "";
    const cmap = { good: DONE, mid: MID, bad: BAD, "": NONE };
    html += row("🍬 控糖评估", days.map(d => {
        const o = store.days[d] || {};
        const hs = Object.values(o.meals || {}).concat(o.snacks || []).map(m => m.rating).filter(Boolean);
        const w = worstOf(hs);
        return cell(cmap[w], `${d} 控糖${w ? "：" + { good: "良好", mid: "一般", bad: "超标" }[w] : "：无记录"}`);
    }));
    // 睡眠
    html += row("😴 睡眠", days.map(d => {
        const s = store.days[d] && store.days[d].sleep;
        const cmap = { good: DONE, mid: MID, bad: BAD };
        const slabel = { good: "好", mid: "一般", bad: "差" };
        return cell(s ? (cmap[s.quality] || MID) : NONE, `${d} 睡眠${s ? "：" + (slabel[s.quality] || "一般") : "：无记录"}`);
    }));
    // 排便健康（取最差）
    html += row("💩 排便", days.map(d => {
        const hs = ((store.days[d] && store.days[d].bowels) || []).map(b => b.healthy).filter(Boolean);
        const w = worstOf(hs);
        return cell(cmap[w], `${d} 排便${w ? "：" + { good: "健康", mid: "一般", bad: "不佳" }[w] : "：无记录"}`);
    }));
    // 孕期反应（有反应标黄，无记录灰，明确无反应绿？无法区分——有反应数量越多越深）
    html += row("🤕 孕期反应", days.map(d => {
        const n = ((store.days[d] && store.days[d].symptoms) || []).length;
        const color = n === 0 ? NONE : n <= 2 ? MID : BAD;
        return cell(color, `${d} 反应 ${n} 项`);
    }));
    html += `</div>
    <div class="trend-legend" style="margin-top:12px">
      <span><i style="background:${DONE}"></i>完成/良好</span>
      <span><i style="background:${MID}"></i>一般/少量反应</span>
      <span><i style="background:${BAD}"></i>超标/不佳</span>
      <span><i style="background:var(--border)"></i>未完成/无记录</span>
    </div>`;
    // 底部关键数字
    const counts = days.map(d => habitDoneCount(d));
    const ws = days.map(d => store.days[d] && store.days[d].weight ? store.days[d].weight.value : null).filter(v => v != null);
    html += `<div class="sum-top" style="margin-top:10px">✅ 日均 ${(counts.reduce((a, b) => a + b, 0) / n).toFixed(1)}/${activeHabits().length} · 全勤 ${counts.filter(c => c === activeHabits().length).length} 天${ws.length ? ` · ⚖️ ${ws[0]} → ${ws[ws.length - 1]} kg` : ""}</div>`;
    el.innerHTML = html;
}
function copyWeekly() {
    const text = buildWeeklyText();
    const done = () => flash("weeklyCopied", "已复制 ✓");
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
    } else fallbackCopy(text, done);
}

/* ==================== 导出 / 导入 ==================== */
function download(filename, content, mime) {
    const blob = new Blob([content], { type: mime });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
}

/* ==================== 文字模块单独导出（Markdown / CSV） ==================== */
const TEXT_MODULES = [
    { key: "reviews", name: "每日复盘", icon: "🌙", get: o => o.reviews || [] },
    { key: "gratitude", name: "感恩的心", icon: "💛", get: o => o.gratitude || [] },
    { key: "techLogs", name: "技术学习", icon: "💻", get: o => o.techLogs || [] },
    { key: "pregDiaries", name: "孕期日记", icon: "🤰", get: o => o.pregDiaries || [] },
    { key: "thoughts", name: "想法碎片", icon: "💭", get: o => o.thoughts || [], tagField: "tags" },
    { key: "knowledge", name: "知识收藏", icon: "📚", get: o => o.knowledge || [], tagField: "type" },
    { key: "media", name: "自媒体运营", icon: "📣", get: o => o.media || [], tagField: "tag" },
    { key: "phrases", name: "英语知识点", icon: "✍️", get: o => (o.english && o.english.phrases) || [] },
];
function moduleEntries(mod) {
    const arr = [];
    Object.keys(store.days).forEach(d => {
        (mod.get(store.days[d]) || []).forEach(e => arr.push({ d, e }));
    });
    return arr.sort((a, b) => recordTimestampValue(b.e, b.d) - recordTimestampValue(a.e, a.d));
}
function moduleTagValue(mod, entry) {
    if (!mod.tagField) return "";
    const value = entry[mod.tagField];
    return Array.isArray(value) ? value.join(" / ") : (value || "");
}
function buildModuleMarkdown(mod, entries) {
    const lines = [`# ${mod.icon} ${mod.name}`, "", `> 导出于 ${todayStr()} ${nowTime()} · 共 ${entries.length} 条`];
    let curDate = "";
    entries.forEach(({ d, e }) => {
        if (d !== curDate) { curDate = d; lines.push("", `## 📅 ${d}`); }
        const tag = moduleTagValue(mod, e);
        lines.push("", `**🕐 ${e.time || "—"}**${tag ? ` · \`${tag}\`` : ""}`, "");
        (e.text || "").trim().split("\n").forEach(l => lines.push(l.length ? l : ""));
    });
    return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
}
function buildModuleCSV(mod, entries) {
    const head = ["日期", "时间"];
    if (mod.tagField) head.push("标签");
    head.push("内容");
    const rows = [head];
    entries.forEach(({ d, e }) => {
        const row = [d, e.time || ""];
        if (mod.tagField) row.push(moduleTagValue(mod, e));
        row.push(e.text || "");
        rows.push(row);
    });
    return "\uFEFF" + rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\r\n");
}
function exportModule(key, format) {
    const mod = TEXT_MODULES.find(m => m.key === key); if (!mod) return;
    const entries = moduleEntries(mod);
    if (!entries.length) { alert(`「${mod.name}」还没有内容可导出`); return; }
    if (format === "md") download(`${mod.name}_${todayStr()}.md`, buildModuleMarkdown(mod, entries), "text/markdown;charset=utf-8");
    else download(`${mod.name}_${todayStr()}.csv`, buildModuleCSV(mod, entries), "text/csv;charset=utf-8");
    markExported();
}
function exportAllModulesMarkdown() {
    const sections = TEXT_MODULES.map(mod => ({ mod, entries: moduleEntries(mod) })).filter(s => s.entries.length);
    if (!sections.length) { alert("还没有任何文字内容可导出"); return; }
    const total = sections.reduce((s, x) => s + x.entries.length, 0);
    const toc = sections.map(s => `- [${s.mod.icon} ${s.mod.name}](#${s.mod.icon}-${s.mod.name}) （${s.entries.length} 条）`);
    const parts = [
        "# 💐 CC GOGOGO 文字备份",
        "",
        `> 导出于 ${todayStr()} ${nowTime()} · 共 ${sections.length} 个模块 · ${total} 条`,
        "",
        "## 目录",
        "",
        ...toc,
    ];
    sections.forEach(s => {
        parts.push("", "---", "", buildModuleMarkdown(s.mod, s.entries).trim());
    });
    download(`CC-GOGOGO文字备份_${todayStr()}.md`, parts.join("\n") + "\n", "text/markdown;charset=utf-8");
    markExported();
}
function renderModuleExport() {
    const el = document.getElementById("moduleExport"); if (!el) return;
    const rows = TEXT_MODULES.map(m => {
        const n = moduleEntries(m).length;
        return `<div class="mod-row">
      <span class="mod-name">${m.icon} ${m.name}<em>${n} 条</em></span>
      <span class="mod-btns">
        <button ${n ? "" : "disabled"} onclick="exportModule('${m.key}','md')">MD</button>
        <button ${n ? "" : "disabled"} onclick="exportModule('${m.key}','csv')">CSV</button>
      </span>
    </div>`;
    }).join("");
    const total = TEXT_MODULES.reduce((s, m) => s + moduleEntries(m).length, 0);
    el.innerHTML = `<button class="mod-all-btn" ${total ? "" : "disabled"} onclick="exportAllModulesMarkdown()">📚 一键打包导出全部（单个 Markdown）</button>${rows}`;
}
function exportJSON() {
    download(`打卡数据备份_${todayStr()}.json`, JSON.stringify(store, null, 2), "application/json");
    markExported();
}
async function shareBackup() {
    const content = JSON.stringify(store, null, 2);
    const filename = `打卡数据备份_${todayStr()}.json`;
    try {
        const file = new File([content], filename, { type: "application/json" });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file], title: "CC GOGOGO 备份", text: "我的打卡数据备份" });
            markExported();
            return;
        }
    } catch (e) {
        if (e && e.name === "AbortError") return; // 用户取消分享
    }
    download(filename, content, "application/json"); // 不支持分享文件时退回下载
}
function exportCSV() {
    const ratingLabel = { good: "控糖良好", mid: "一般", bad: "超标" };
    const head = ["日期", ...activeHabits().map(h => h.name), "英语微任务", "英语知识点", "饮水(ml)",
        ...MEALS.flatMap(m => [m.name, m.name + "控糖评估"]),
        "加餐", "锻炼", "排便", "体重(kg)", "睡眠", "孕期反应", "技术学习", "临时任务", "复盘", "感恩", "孕期日记", "运营", "想法碎片", "知识收藏", "开支", "想买清单", "健康明细(喝水/控糖/运动/睡眠/排便/体重)"];
    const rows = [head];
    Object.keys(store.days).sort().forEach(d => {
        const o = day(d);
        const bowelLabel = { good: "健康", mid: "一般", bad: "不佳" };
        rows.push([
            d,
            ...activeHabits().map(h => isHabitDone(h.id, d) ? "✓" : ""),
            ENG_TASKS.filter(t => isEngTaskDone(t.id, d)).map(t => t.name).join(" | "),
            o.english.phrases.map(p => p.text).join(" | "),
            waterTotal(d),
            ...MEALS.flatMap(m => { const r = o.meals[m.id] || {}; return [r.food || "", ratingLabel[r.rating] || ""]; }),
            o.snacks.map(s => s.food + (s.rating ? "(" + (ratingLabel[s.rating] || "") + ")" : "")).join(" | "),
            o.exercises.map(x => x.text).join(" | "),
            o.bowels.map(b => [b.amount ? "量·" + b.amount : "", b.honey === true ? "用蜂蜜露" : b.honey === false ? "未用蜂蜜露" : "", bowelLabel[b.healthy] || "", b.note].filter(Boolean).join(" ")).join(" | "),
            o.weight ? o.weight.value : "",
            o.sleep ? ({ good: "好", mid: "一般", bad: "差" }[o.sleep.quality] || "一般") : "",
            o.symptoms.map(s => s.tag).join(" | "),
            o.techLogs.map(t => t.text).join(" | "),
            o.tasks.map(t => `${t.done ? "✓" : "○"} ${t.text}（创建 ${t.createdDate || d}${t.done && t.completedDate ? `；完成 ${t.completedDate}` : ""}）`).join(" | "),
            o.reviews.map(r => r.text).join(" | "),
            o.gratitude.map(g => g.text).join(" | "),
            o.pregDiaries.map(p => p.text).join(" | "),
            o.media.map(m => `[${m.tag}] ${m.text}`).join(" | "),
            o.thoughts.map(t => thoughtTagsOf(t).map(tag => `[${tag}]`).join("") + (thoughtTagsOf(t).length ? " " : "") + t.text).join(" | "),
            o.knowledge.map(k => `[${k.type}] ${k.text}`).join(" | "),
            o.expenses.map(e => `${e.cat} ¥${fmtMoney(e.amount)}${e.note ? "(" + e.note + ")" : ""}`).join(" | "),
            o.wishes.map(w => `${{ cooling: "冷静中", resisted: "忍住", bought: "已买" }[w.status] || ""} ${w.item}${w.amount ? " ¥" + fmtMoney(w.amount) : ""}`).join(" | "),
            healthDetailLine(d),
        ]);
    });
    const csv = "\uFEFF" + rows.map(r => r.map(c =>
        `"${String(c).replace(/"/g, '""').replace(/\r?\n/g, " ")}"`).join(",")).join("\r\n");
    download(`打卡数据_${todayStr()}.csv`, csv, "text/csv;charset=utf-8");
    markExported();
}
function exportWishesCSV() {
    const statusLabel = { cooling: "冷静中", resisted: "忍住了", bought: "已购买" };
    const rows = [["物品", "预估金额", "状态", "省下金额", "理由", "加入日期", "加入时间", "决定日期"]];
    const all = [];
    Object.keys(store.days).forEach(d => (store.days[d].wishes || []).forEach(w => all.push({ d, w })));
    if (!all.length) { alert("还没有想买清单记录"); return; }
    all.sort((a, b) => (b.d + (b.w.time || "")).localeCompare(a.d + (a.w.time || "")));
    all.forEach(({ d, w }) => rows.push([
        w.item,
        w.amount || "",
        statusLabel[w.status] || "",
        w.status === "resisted" ? (w.amount || 0) : "",
        w.reason || "",
        w.date || d,
        w.time || "",
        w.decidedAt || "",
    ]));
    const csv = "\uFEFF" + rows.map(r => r.map(c =>
        `"${String(c).replace(/"/g, '""').replace(/\r?\n/g, " ")}"`).join(",")).join("\r\n");
    download(`想买清单_${todayStr()}.csv`, csv, "text/csv;charset=utf-8");
    markExported();
}
function importJSON(input) {
    const file = input.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
        try {
            const data = JSON.parse(reader.result);
            if (!data.days) throw new Error("格式不正确");
            const dates = Object.keys(data.days).sort();
            const range = dates.length ? `${dates[0]} ~ ${dates[dates.length - 1]}` : "无";
            if (!confirm(`导入文件：${file.name}\n记录天数：${dates.length} 天\n日期范围：${range}\n合并方式：按日期合并（同日期以导入数据为准）\n\n确认导入？`)) return;
            Object.assign(store.days, data.days);
            if (data.settings && data.settings.supplements) store.settings.supplements = data.settings.supplements;
            if (data.settings && data.settings.symptomTags) store.settings.symptomTags = data.settings.symptomTags;
            if (data.settings && data.settings.thoughtTags) store.settings.thoughtTags = data.settings.thoughtTags;
            migrateStoreData(store);
            save(); renderAll();
            alert("导入成功！");
        } catch (e) { alert("导入失败：" + e.message); }
    };
    reader.readAsText(file);
    input.value = "";
}
function clearAll() {
    if (!confirm("确定清空全部数据？此操作不可恢复，建议先导出 JSON 备份。")) return;
    const word = prompt('二次确认：请输入「清空」以永久删除全部数据（此操作不可恢复）。');
    if (word === null) return;
    if (word.trim() !== "清空") { alert("输入不匹配，已取消清空。"); return; }
    localStorage.removeItem(STORE_KEY);
    store = loadStore();
    renderAll();
    if (typeof showToast === "function") showToast("已清空全部数据");
}

/* ==================== 渲染入口 ==================== */
function renderToday() {
    renderHabits(); renderEnglish(); renderTasks(); renderWater(); renderSupps(); renderTimeline(); renderReviews(); renderGratitude(); renderSummary(); renderMeals();
    renderSnacks(); renderExercises(); renderBowelForm(); renderBowel(); renderPregDiaries();
    renderWeight(); renderSleep(); renderSymptoms(); renderHealthOverview(); renderReviewOverview();
}
function renderAll() {
    renderToday(); renderTodoCenter(); renderThoughts(); renderKnowledge(); renderMedia(); renderTech(); renderWealth(); renderBackupTip();
    renderRecordTimeline();
    if (document.getElementById("page-data").classList.contains("active")) renderHistory();
}

/* ==================== 备份提醒 ==================== */
function markExported() {
    store.settings.lastExport = todayStr();
    save(); renderBackupTip();
}
function renderBackupTip() {
    const hasData = Object.keys(store.days).length > 0;
    const last = store.settings.lastExport;
    let overdue = 0;
    if (hasData) {
        if (!last) overdue = 999;
        else overdue = Math.round((new Date(todayStr()) - new Date(last)) / 86400000);
    }
    const need = hasData && overdue >= 3;
    const mineBtn = document.querySelector('#bottomTabs button[data-nav="mine"]');
    if (mineBtn) mineBtn.classList.toggle("need-backup", need);
    const tip = document.getElementById("backupTip");
    if (!tip) return;
    if (!hasData) { tip.style.display = "none"; return; }
    tip.style.display = "block";
    if (need) {
        tip.className = "warn";
        tip.innerHTML = `⚠️ ${last ? `已 <b>${overdue}</b> 天未备份` : "从未备份过"}，为避免数据丢失，建议现在备份
          <button class="tip-share" onclick="shareBackup()">📤 立即备份</button>`;
    } else {
        tip.className = "ok";
        tip.innerHTML = `✅ 上次备份：${overdue === 0 ? "今天" : overdue + " 天前"}，数据安全`;
    }
}

/* ==================== 持久化存储（降低系统自动清理概率） ==================== */
async function ensurePersistentStorage() {
    const el = document.getElementById("storageStatus");
    if (!el) return;
    if (!(navigator.storage && navigator.storage.persist)) {
        el.style.display = "none";
        return;
    }
    let persisted = await navigator.storage.persisted();
    if (!persisted) persisted = await navigator.storage.persist();
    el.style.display = "block";
    el.className = "storage-status " + (persisted ? "ok" : "warn");
    el.innerHTML = persisted
        ? "🔒 已开启持久化存储，数据不会被系统自动清理"
        : "⚠️ 未能开启持久化存储，请务必定期导出 JSON 备份（iOS 可能在长期不用后清理网页数据）";
}

/* ==================== 跨天检测 ==================== */
let lastKnownToday = todayStr();
function checkDayRollover() {
    const t = todayStr();
    if (t === lastKnownToday) return;
    const wasViewingToday = currentDate === lastKnownToday;
    lastKnownToday = t;
    if (wasViewingToday) setDate(t); // 隔夜后自动切到新的一天，避免误记到昨天
    else renderAll();
}
document.addEventListener("visibilitychange", () => { if (!document.hidden) checkDayRollover(); });
window.addEventListener("focus", checkDayRollover);

/* ==================== 初始化 ==================== */
(function init() {
    const now = new Date();
    calYear = now.getFullYear(); calMonth = now.getMonth();
    setDate(currentDate);
    renderIcons();
    selectKType(document.querySelector('#knowledgeTypeRow button[data-ktype="播客"]'));
    selectMediaTag(document.querySelector('#mediaTagRow button[data-mtag="小红书"]'));
    renderThoughtTagRow();
    renderRecordFilterRow();
    renderAppTitle();
    renderAll();
    switchTab("home", "home");
    applyCollapsedState();
    applyModuleVisibility();
    ensurePersistentStorage();
    registerServiceWorker();
})();

/* ==================== 版本更新（部署后自动检测并提示刷新） ==================== */
let swRefreshing = false;
let waitingWorker = null;
function applyUpdate() {
    const bar = document.getElementById("updateBar");
    if (bar) bar.style.display = "none";
    if (waitingWorker) waitingWorker.postMessage("skipWaiting");
    else location.reload();
}
function registerServiceWorker() {
    if (!(location.protocol.startsWith("http") && "serviceWorker" in navigator)) return;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (swRefreshing) return;
        swRefreshing = true;
        location.reload();
    });
    navigator.serviceWorker.register("sw.js", { updateViaCache: "none" }).then(reg => {
        const notify = w => {
            // 仅当已有旧版本在运行时提示（首次安装不打扰）
            if (w && navigator.serviceWorker.controller) {
                waitingWorker = w;
                const bar = document.getElementById("updateBar");
                if (bar) bar.style.display = "flex";
            }
        };
        if (reg.waiting) notify(reg.waiting);
        reg.addEventListener("updatefound", () => {
            const nw = reg.installing;
            if (!nw) return;
            nw.addEventListener("statechange", () => { if (nw.state === "installed") notify(nw); });
        });
        // 重新聚焦 App 时主动检查更新
        const check = () => reg.update().catch(() => { });
        document.addEventListener("visibilitychange", () => { if (!document.hidden) check(); });
        window.addEventListener("focus", check);
    }).catch(() => { });
}

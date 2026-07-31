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
    { id: "water", icon: "💧", name: "2000毫升水", auto: true },
    { id: "skincare", icon: "🧴", name: "护肤" },
    { id: "diary", icon: "✍️", name: "日记" },
    { id: "review", icon: "🌙", name: "复盘", auto: true },
];
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

let store = loadStore();
store.settings.symptomTags = store.settings.symptomTags || ["腰疼", "背疼", "手疼", "腿疼", "腿麻", "肚子疼", "胃酸", "胃疼"];
store.settings.thoughtTags = store.settings.thoughtTags || ["梦", "情绪", "技能", "工作", "idea", "复盘", "人际", "好物", "其他"];
let currentDate = todayStr();
let calYear, calMonth; // 日历视图
let kType = "播客";

function loadStore() {
    try {
        const raw = localStorage.getItem(STORE_KEY);
        if (raw) return JSON.parse(raw);
    } catch (e) { console.error(e); }
    return { days: {}, settings: { supplements: ["DHA", "钙", "铁", "复合维生素"] } };
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
    // 迁移旧版固定加餐
    if (o.meals.snack && (o.meals.snack.food || o.meals.snack.rating)) {
        o.snacks.push({ food: o.meals.snack.food || "", rating: o.meals.snack.rating || "", time: o.meals.snack.time || "" });
    }
    delete o.meals.snack;
    o.pregDiary = o.pregDiary || "";
    o.pregDiaryTime = o.pregDiaryTime || "";
    o.pregDiaries = o.pregDiaries || [];   // [{text,time}]
    if (o.pregDiary && o.pregDiary.trim()) o.pregDiaries.push({ text: o.pregDiary.trim(), time: o.pregDiaryTime || "" });
    delete o.pregDiary; delete o.pregDiaryTime;
    o.media = o.media || [];   // [{text,tag,time}] 自媒体运营
    o.thoughts = o.thoughts || [];   // [{text,time,voice}]
    o.knowledge = o.knowledge || [];   // [{text,type,time}]
    o.tasks = o.tasks || [];   // [{text,done,time}]
    o.weight = o.weight || null;   // {value,time}
    o.sleep = o.sleep || null;   // {quality:"good"|"bad",time}
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
        if (t && t.count <= 0) delete o.english.tasks[k];
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
    if (id === "water") return waterTotal(d) >= 2000;
    if (id === "supplement") {
        const list = store.settings.supplements;
        return list.length > 0 && list.every(n => o.supplements[n] && o.supplements[n].done);
    }
    if (id === "review") return day(d).reviews.length > 0;
    return !!(o.habits[id] && o.habits[id].done);
}
function habitDoneCount(d) { return HABITS.filter(h => isHabitDone(h.id, d)).length; }

/* ==================== 日期切换 ==================== */
function setDate(d) {
    if (!d) return;
    currentDate = d;
    document.getElementById("datePicker").value = d;
    document.getElementById("notTodayTip").style.display = (d === todayStr()) ? "none" : "block";
    renderAll();
}
function shiftDate(n) {
    const d = new Date(currentDate + "T12:00:00");
    d.setDate(d.getDate() + n);
    setDate(d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"));
}

/* ==================== Tabs ==================== */
document.getElementById("tabs").addEventListener("click", e => {
    const btn = e.target.closest("button"); if (!btn) return;
    document.querySelectorAll("nav.tabs button").forEach(b => b.classList.toggle("active", b === btn));
    document.querySelectorAll(".tab-page").forEach(p => p.classList.toggle("active", p.id === "page-" + btn.dataset.tab));
    if (btn.dataset.tab === "history") renderHistory();
});

/* ==================== 习惯打卡 ==================== */
function toggleHabit(id) {
    const h = HABITS.find(x => x.id === id);
    if (h.auto) return;
    const o = day();
    if (o.habits[id] && o.habits[id].done) delete o.habits[id];
    else o.habits[id] = { done: true, time: nowTime() };
    save(); renderToday();
}
function renderHabits() {
    const grid = document.getElementById("habitGrid");
    grid.innerHTML = HABITS.map(h => {
        const done = isHabitDone(h.id);
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
        return `<div class="habit-item ${done ? "done" : ""} ${h.auto ? "auto" : ""}" onclick="toggleHabit('${h.id}')" title="${h.auto ? "该项自动完成" : "点击打卡"}">
      <span class="icon">${h.icon}</span>
      <span class="name">${h.name}${h.auto ? "<span style='font-size:10px;color:var(--text-light)'> ·自动</span>" : ""}</span>
      ${done ? `<span class="time">${time}</span><span class="check">✓</span>` : ""}
    </div>`;
    }).join("");
    const n = habitDoneCount(), total = HABITS.length;
    document.getElementById("habitProgress").textContent = `${n}/${total}`;
    document.getElementById("habitBar").style.width = (n / total * 100) + "%";
    document.getElementById("habitBarText").textContent = n === total ? "🎉 今日全部完成，太棒啦！" : `已完成 ${n}/${total}`;
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
    e.tasks[id] = rec;
    save(); renderToday();
}
function decEngTask(id) {
    const e = day().english;
    const rec = e.tasks[id];
    if (!rec) return;
    rec.count = (rec.count || 0) - 1;
    if (rec.count <= 0) delete e.tasks[id];
    else rec.time = nowTime();
    save(); renderToday();
}
function addEngPhrase() {
    const ta = document.getElementById("engPhrase");
    const text = ta.value.trim(); if (!text) return;
    day().english.phrases.push({ text, time: nowTime() });
    ta.value = ""; save(); flash("engPhraseSaved"); renderToday();
}
function delEngPhrase(d, i) { day(d).english.phrases.splice(i, 1); save(); renderToday(); }
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
        return `<div class="eng-task ${done ? "done" : ""}" onclick="logEngTask('${t.id}')">
      <span class="icon">${t.icon}</span>
      <span class="body"><div class="name">${done ? "✓ " : ""}${t.name}${count > 1 ? ` <span class="count-badge">×${count}</span>` : ""}</div><div class="desc">${t.desc}</div></span>
      ${done ? `<span class="time">${rec.time}</span>` : ""}
      ${done ? `<button class="eng-dec" onclick="event.stopPropagation();decEngTask('${t.id}')">−</button>` : ""}
      ${t.link ? `<a class="go" href="${t.link}" target="_blank" rel="noopener" onclick="event.stopPropagation()">${t.linkName}</a>` : ""}
    </div>`;
    }).join("");
    // 汇总全部知识点（含当天，近到远）
    const items = [];
    Object.keys(store.days).sort().reverse().forEach(d => {
        const en = store.days[d].english;
        if (en && en.phrases) en.phrases.forEach((p, i) => items.push({ d, i, p }));
    });
    document.getElementById("engPhraseCount").textContent = items.length ? `已积累 ${items.length} 条` : "";
    document.getElementById("engPhraseList").innerHTML = items.length
        ? items.map(x => `<div class="entry"><span class="tag">${x.d === todayStr() ? "今天" : x.d}</span>${esc(x.p.text)}
<div class="meta"><span>${x.d} ${x.p.time}</span></div>
<button class="del" onclick="delEngPhrase('${x.d}',${x.i})">✕</button></div>`).join("")
        : `<div class="empty-tip">还没有知识点，听到好表达随手记一条吧 ✨</div>`;
}

/* ==================== 临时任务 ==================== */
function addTask() {
    const input = document.getElementById("taskInput");
    const text = input.value.trim(); if (!text) return;
    day().tasks.push({ text, done: false, time: "" });
    input.value = ""; save(); renderToday();
}
function toggleTask(i) {
    const t = day().tasks[i];
    t.done = !t.done;
    t.time = t.done ? nowTime() : "";
    save(); renderToday();
}
function delTask(i) { day().tasks.splice(i, 1); save(); renderToday(); }
function renderTasks() {
    const tasks = day().tasks;
    document.getElementById("taskList").innerHTML = tasks.map((t, i) =>
        `<div class="task-item ${t.done ? "done" : ""}">
      <span class="task-check" onclick="toggleTask(${i})">${t.done ? "✓" : ""}</span>
      <span class="task-text" onclick="toggleTask(${i})">${esc(t.text)}</span>
      ${t.done ? `<span class="task-time">${t.time}</span>` : ""}
      <button class="del" onclick="delTask(${i})">✕</button>
    </div>`).join("");
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
    const cups = Math.min(10, Math.floor(total / 200));
    document.getElementById("waterCups").innerHTML =
        Array.from({ length: 10 }, (_, i) => `<div class="cup ${i < cups ? "full" : ""}" onclick="addWater(200)">${i < cups ? "💧" : "+"}</div>`).join("");
    document.getElementById("waterTotal").textContent = total;
}

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

/* ==================== 时间轴 ==================== */
function collectTimeline(d) {
    const o = day(d), ev = [];
    HABITS.forEach(h => {
        if (!h.auto && o.habits[h.id] && o.habits[h.id].done && o.habits[h.id].time)
            ev.push({ time: o.habits[h.id].time, label: `${h.icon} 完成打卡：${h.name}` });
    });
    o.waterLogs.forEach(l => ev.push({ time: l.time, label: `💧 喝水 ${l.amount}ml` }));
    ENG_TASKS.forEach(t => {
        if (t.id === "phrase") o.english.phrases.forEach(p => { if (p.time) ev.push({ time: p.time, label: `✍️ 英语知识点：${trunc(p.text, 18)}` }); });
        else if (o.english.tasks[t.id] && o.english.tasks[t.id].count > 0) ev.push({ time: o.english.tasks[t.id].time, label: `${t.icon} 英语：${t.name}${o.english.tasks[t.id].count > 1 ? ` ×${o.english.tasks[t.id].count}` : ""}` });
    });
    o.tasks.forEach(t => { if (t.done && t.time) ev.push({ time: t.time, label: `📌 完成任务：${trunc(t.text, 18)}` }); });
    Object.entries(o.supplements).forEach(([n, s]) => { if (s.done) ev.push({ time: s.time, label: `💊 补剂：${n}` }); });
    o.reviews.forEach(r => { if (r.time) ev.push({ time: r.time, label: `🌙 复盘：${trunc(r.text, 18)}` }); });
    o.gratitude.forEach(g => ev.push({ time: g.time, label: `💛 感恩：${trunc(g.text, 18)}` }));
    Object.entries(o.meals).forEach(([mid, m]) => {
        const meal = MEALS.find(x => x.id === mid);
        if (meal && m.time && (m.food || m.rating)) ev.push({ time: m.time, label: `${meal.icon} 记录${meal.name}${m.food ? "：" + trunc(m.food, 14) : ""}` });
    });
    o.snacks.forEach(s => { if (s.time && (s.food || s.rating)) ev.push({ time: s.time, label: `🍎 加餐${s.food ? "：" + trunc(s.food, 14) : ""}` }); });
    o.exercises.forEach(x => ev.push({ time: x.time, label: `🏃 锻炼：${trunc(x.text, 18)}` }));
    o.bowels.forEach(b => { const extra = [b.amount ? "量·" + b.amount : "", b.honey === true ? "蜂蜜露" : ""].filter(Boolean).join(" "); ev.push({ time: b.time, label: `💩 排便${extra ? "（" + extra + "）" : ""}` }); });
    o.pregDiaries.forEach(p => { if (p.time) ev.push({ time: p.time, label: `🤰 孕期日记：${trunc(p.text, 18)}` }); });
    if (o.weight && o.weight.time) ev.push({ time: o.weight.time, label: `⚖️ 体重 ${o.weight.value} kg` });
    if (o.sleep && o.sleep.time) ev.push({ time: o.sleep.time, label: `😴 睡眠：${o.sleep.quality === "good" ? "好 😊" : "差 😵"}` });
    o.symptoms.forEach(s => ev.push({ time: s.time, label: `🤕 孕期反应：${s.tag}` }));
    o.techLogs.forEach(t => ev.push({ time: t.time, label: `💻 技术：${trunc(t.text, 18)}` }));
    o.media.forEach(m => ev.push({ time: m.time, label: `📣 ${m.tag}：${trunc(m.text, 18)}` }));
    o.thoughts.forEach(t => ev.push({ time: t.time, label: `💭 想法${t.tag ? "[" + t.tag + "]" : ""}：${trunc(t.text, 18)}` }));
    o.knowledge.forEach(k => ev.push({ time: k.time, label: `📚 ${k.type}：${trunc(k.text, 18)}` }));
    ev.sort((a, b) => a.time.localeCompare(b.time));
    return ev;
}
function trunc(s, n) { s = s.trim(); return s.length > n ? s.slice(0, n) + "…" : s; }
function renderTimeline() {
    const ev = collectTimeline();
    document.getElementById("timeline").innerHTML = ev.length
        ? ev.map(e => `<div class="tl-item"><span class="tl-time">${e.time}</span><span class="tl-label">${esc(e.label)}</span></div>`).join("")
        : `<div class="empty-tip">还没有记录，从第一个打卡开始吧 ✨</div>`;
}
function esc(s) { const d = document.createElement("div"); d.textContent = s; return d.innerHTML; }

/* ==================== 复盘 ==================== */
function addReview() {
    const ta = document.getElementById("reviewInput");
    const text = ta.value.trim(); if (!text) return;
    day().reviews.push({ text, time: nowTime() });
    ta.value = ""; save(); renderToday();
}
function delReview(i) { day().reviews.splice(i, 1); save(); renderToday(); }
function renderReviews() {
    const list = day().reviews;
    document.getElementById("reviewList").innerHTML = list.map((r, i) =>
        `<div class="entry">${esc(r.text)}<div class="meta"><span>${r.time}</span></div>
     <button class="del" onclick="delReview(${i})">✕</button></div>`).join("");
}
function flash(id, msg) {
    const el = document.getElementById(id);
    el.textContent = msg || "已保存 ✓";
    setTimeout(() => el.textContent = "", 2000);
}

/* ==================== 今日汇总 ==================== */
function buildSummaryText(d) {
    d = d || currentDate; const o = day(d);
    const lines = [`🌸 ${d} 今日汇总`, `✅ 打卡 ${habitDoneCount(d)}/${HABITS.length} · 💧 ${waterTotal(d)}ml`];
    const push = (title, arr) => { if (arr.length) { lines.push("", title); arr.forEach(x => lines.push(`· ${x.text}`)); } };
    push("🌙 复盘", o.reviews);
    push("💛 感恩", o.gratitude);
    push("🤰 孕期日记", o.pregDiaries);
    return lines.join("\n");
}
function renderSummary() {
    const o = day();
    const sec = (icon, title, arr) => arr.length
        ? `<div class="sum-sec"><div class="sum-h">${icon} ${title}</div>${arr.map(x => `<div class="sum-item"><span>· ${esc(x.text)}</span><span class="sum-t">${x.time || ""}</span></div>`).join("")}</div>`
        : "";
    const body = sec("🌙", "复盘", o.reviews) + sec("💛", "感恩", o.gratitude) + sec("🤰", "孕期日记", o.pregDiaries);
    document.getElementById("dailySummary").innerHTML =
        `<div class="sum-top">✅ 打卡 ${habitDoneCount()}/${HABITS.length} · 💧 ${waterTotal()}ml</div>`
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
function delGratitude(i) { day().gratitude.splice(i, 1); save(); renderToday(); }
function renderGratitude() {
    const list = day().gratitude;
    document.getElementById("gratitudeList").innerHTML = list.map((g, i) =>
        `<div class="entry">${esc(g.text)}<div class="meta"><span>${g.time}</span></div>
     <button class="del" onclick="delGratitude(${i})">✕</button></div>`).join("");
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
function delSnack(i) { day().snacks.splice(i, 1); save(); renderSnacks(); renderTimeline(); }
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
function delExercise(i) { day().exercises.splice(i, 1); save(); renderExercises(); renderTimeline(); }
function renderExercises() {
    const list = day().exercises;
    const el = document.getElementById("exerciseList");
    if (!el) return;
    el.innerHTML = list.map((x, i) =>
        `<div class="entry">${esc(x.text)}<div class="meta"><span>${x.time}</span></div>
     <button class="del" onclick="delExercise(${i})">✕</button></div>`).join("");
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
function delBowel(i) { day().bowels.splice(i, 1); save(); renderBowel(); renderTimeline(); }
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
        return `<div class="entry">💩 ${parts.join(" · ")}${b.note ? "<br>" + esc(b.note) : ""}
       <div class="meta"><span>${b.time}</span></div>
       <button class="del" onclick="delBowel(${i})">✕</button></div>`;
    }).join("");
}

/* ==================== 体重 / 睡眠 / 孕期反应 ==================== */
function saveWeight() {
    const input = document.getElementById("weightInput");
    const v = parseFloat(input.value);
    if (!v || v <= 0) { alert("请输入有效体重"); return; }
    day().weight = { value: v, time: nowTime() };
    save(); flash("weightSaved"); renderWeight(); renderTimeline();
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
    const prev = lastWeightBefore(currentDate);
    let info = "";
    if (o.weight && prev) {
        const diff = (o.weight.value - prev.value).toFixed(1);
        info = `上次 ${prev.d}：${prev.value} kg，${diff > 0 ? "+" + diff : diff} kg`;
    } else if (prev) info = `上次 ${prev.d}：${prev.value} kg`;
    document.getElementById("weightInfo").textContent = info;
}
function setSleep(quality) {
    const o = day();
    o.sleep = (o.sleep && o.sleep.quality === quality) ? null : { quality, time: nowTime() };
    save(); renderSleep(); renderTimeline();
}
function renderSleep() {
    const o = day();
    const q = o.sleep ? o.sleep.quality : "";
    document.getElementById("sleepRow").innerHTML =
        `<button class="${q === "good" ? "sel" : ""}" onclick="setSleep('good')">😊 好</button>
     <button class="${q === "bad" ? "sel" : ""}" onclick="setSleep('bad')">😵 坏</button>
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

/* ==================== 技术学习 ==================== */
function addTech() {
    const ta = document.getElementById("techInput");
    const text = ta.value.trim(); if (!text) return;
    day().techLogs.push({ text, time: nowTime() });
    ta.value = ""; save(); renderTech(); renderHabits(); renderTimeline();
}
function delTech(d, i) { day(d).techLogs.splice(i, 1); save(); renderTech(); renderHabits(); renderTimeline(); }
function renderTech() {
    const items = [];
    Object.keys(store.days).sort().reverse().forEach(d => {
        (store.days[d].techLogs || []).forEach((t, i) => items.push({ d, i, t }));
    });
    document.getElementById("techList").innerHTML = items.length
        ? items.map(x => `<div class="entry"><span class="tag">${x.d === todayStr() ? "今天" : x.d}</span>${esc(x.t.text)}
<div class="meta"><span>${x.d} ${x.t.time}</span></div>
<button class="del" onclick="delTech('${x.d}',${x.i})">✕</button></div>`).join("")
        : `<div class="empty-tip">今天学了什么？随手记一条，同时完成"技术学习"打卡 💪</div>`;
}

/* ==================== 孕期日记 ==================== */        function addPregDiary() {
    const ta = document.getElementById("pregDiaryInput");
    const text = ta.value.trim(); if (!text) return;
    day().pregDiaries.push({ text, time: nowTime() });
    ta.value = ""; save(); renderToday();
}
function delPregDiary(i) { day().pregDiaries.splice(i, 1); save(); renderToday(); }
function renderPregDiaries() {
    const list = day().pregDiaries;
    document.getElementById("pregDiaryList").innerHTML = list.map((p, i) =>
        `<div class="entry">${esc(p.text)}<div class="meta"><span>${p.time}</span></div>
     <button class="del" onclick="delPregDiary(${i})">✕</button></div>`).join("");
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
function delMedia(d, i) { day(d).media.splice(i, 1); save(); renderMedia(); renderTimeline(); }
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
    document.getElementById("mediaList").innerHTML = items.length
        ? items.map(x => `<div class="entry"><span class="tag">${x.m.tag}</span>${esc(x.m.text)}
<div class="meta"><span>${x.d} ${x.m.time}</span></div>
<button class="del" onclick="delMedia('${x.d}',${x.i})">✕</button></div>`).join("")
        : `<div class="empty-tip">还没有运营记录，发布一条 / 整理素材就记一条吧</div>`;
}

/* ==================== 想法碎片 ==================== */
let thoughtTag = "";
let thoughtFilter = "全部";
function selectThoughtTag(tag) {
    thoughtTag = thoughtTag === tag ? "" : tag;
    renderThoughtTagRow();
}
function addThoughtTag() {
    const tag = prompt("输入新的想法 tag：");
    if (!tag || !tag.trim()) return;
    const t = tag.trim();
    if (!store.settings.thoughtTags.includes(t)) store.settings.thoughtTags.push(t);
    thoughtTag = t;
    save(); renderThoughtTagRow();
}
function renderThoughtTagRow() {
    document.getElementById("thoughtTagRow").innerHTML = store.settings.thoughtTags.map(t =>
        `<button class="filter-chip ${thoughtTag === t ? "sel" : ""}" onclick="selectThoughtTag('${t.replace(/'/g, "\\'")}')">${esc(t)}</button>`).join("")
        + `<button class="filter-chip" onclick="addThoughtTag()">+ 自定义</button>`;
}
function addThought() {
    const ta = document.getElementById("thoughtInput");
    const text = ta.value.trim(); if (!text) return;
    day().thoughts.push({ text, tag: thoughtTag, time: nowTime(), date: currentDate });
    ta.value = ""; save(); renderThoughts(); renderTimeline();
}
function delThought(d, i) { day(d).thoughts.splice(i, 1); save(); renderThoughts(); renderTimeline(); }
function setThoughtFilter(tag) { thoughtFilter = tag; renderThoughts(); }
function renderThoughts() {
    // 展示所有日期的想法（近到远），方便回顾整理
    const all = [];
    Object.keys(store.days).sort().reverse().forEach(d => {
        (store.days[d].thoughts || []).forEach((t, i) => all.push({ d, i, t }));
    });
    const tags = ["全部", ...Array.from(new Set(all.map(x => x.t.tag).filter(Boolean)))];
    if (!tags.includes(thoughtFilter)) thoughtFilter = "全部";
    document.getElementById("thoughtFilterRow").innerHTML = tags.length > 1 ? tags.map(t =>
        `<button class="filter-chip ${thoughtFilter === t ? "sel" : ""}" onclick="setThoughtFilter('${t.replace(/'/g, "\\'")}')">${esc(t)} (${t === "全部" ? all.length : all.filter(x => x.t.tag === t).length})</button>`).join("") : "";
    const items = thoughtFilter === "全部" ? all : all.filter(x => x.t.tag === thoughtFilter);
    document.getElementById("thoughtList").innerHTML = items.length
        ? items.map(x => `<div class="entry">${x.t.tag ? `<span class="tag">${esc(x.t.tag)}</span>` : ""}${esc(x.t.text)}
<div class="meta"><span>${x.d} ${x.t.time}</span></div>
<button class="del" onclick="delThought('${x.d}',${x.i})">✕</button></div>`).join("")
        : `<div class="empty-tip">还没有想法碎片，随手记一条吧</div>`;
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
function delKnowledge(d, i) { day(d).knowledge.splice(i, 1); save(); renderKnowledge(); renderTimeline(); }
function renderKnowledge() {
    const items = [];
    Object.keys(store.days).sort().reverse().forEach(d => {
        (store.days[d].knowledge || []).forEach((k, i) => items.push({ d, i, k }));
    });
    document.getElementById("knowledgeList").innerHTML = items.length
        ? items.map(x => `<div class="entry"><span class="tag">${x.k.type}</span>${esc(x.k.text)}
<div class="meta"><span>${x.d} ${x.k.time}</span></div>
<button class="del" onclick="delKnowledge('${x.d}',${x.i})">✕</button></div>`).join("")
        : `<div class="empty-tip">今天听了什么播客、看了什么好文章？记下来吧</div>`;
}

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
    recBtn.classList.add("recording");
    recBtn.textContent = "⏹";
}
function stopMic() {
    if (recBtn) { recBtn.classList.remove("recording"); recBtn.textContent = "🎙"; }
    recognition = null; recTarget = null; recBtn = null;
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
            const p = n === 0 ? 0 : n <= 3 ? 1 : n < HABITS.length ? 2 : 3;
            if (n > 0) dot = `<div class="cal-dot p${p}"></div>`;
            else dot = `<div class="cal-dot"></div>`;
        }
        html += `<div class="cal-cell ${ds === today ? "today" : ""} ${ds === currentDate ? "selected" : ""}" onclick="calPick('${ds}')">${d}${dot}</div>`;
    }
    document.getElementById("calGrid").innerHTML = html;
}
function calPick(ds) {
    setDate(ds);
    document.querySelector('nav.tabs button[data-tab="today"]').click();
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
    Object.keys(store.days).sort().reverse().forEach(d => {
        const o = store.days[d];
        (o.thoughts || []).forEach(x => items.push({ d, time: x.time, type: x.tag ? "想法·" + x.tag : "想法", text: x.text }));
        (o.knowledge || []).forEach(x => items.push({ d, time: x.time, type: "知识·" + x.type, text: x.text }));
        (o.media || []).forEach(x => items.push({ d, time: x.time, type: "运营·" + x.tag, text: x.text }));
        (o.techLogs || []).forEach(x => items.push({ d, time: x.time, type: "技术", text: x.text }));
        (o.reviews || []).forEach(x => items.push({ d, time: x.time, type: "复盘", text: x.text }));
        (o.gratitude || []).forEach(x => items.push({ d, time: x.time, type: "感恩", text: x.text }));
        (o.pregDiaries || []).forEach(x => items.push({ d, time: x.time, type: "孕期日记", text: x.text }));
        (o.exercises || []).forEach(x => items.push({ d, time: x.time, type: "锻炼", text: x.text }));
        if (o.english && o.english.phrases) o.english.phrases.forEach(x => items.push({ d, time: x.time, type: "英语知识点", text: x.text }));
        (o.tasks || []).forEach(x => items.push({ d, time: x.time, type: "任务", text: x.text }));
    });
    return items;
}
function renderSearch() {
    const el = document.getElementById("searchResults");
    const q = (document.getElementById("searchInput").value || "").trim().toLowerCase();
    if (!q) { el.innerHTML = ""; return; }
    const hits = collectSearchItems().filter(x => x.text.toLowerCase().includes(q)).slice(0, 50);
    el.innerHTML = hits.length
        ? hits.map(x => `<div class="entry"><span class="tag">${esc(x.type)}</span>${esc(x.text)}
      <div class="meta"><span>${x.d} ${x.time || ""}</span></div></div>`).join("")
        : `<div class="empty-tip">没有找到包含「${esc(q)}」的记录</div>`;
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
function buildWeeklyText() {
    const days = weekData();
    const n = days.length;
    const lines = [`📋 汇总 ${days[0]} ～ ${days[n - 1]}（近 ${n} 天）`];
    const ratingLabel = { good: "控糖良好", mid: "一般", bad: "超标" };
    // 打卡
    const counts = days.map(d => habitDoneCount(d));
    lines.push(`✅ 打卡：日均 ${(counts.reduce((a, b) => a + b, 0) / n).toFixed(1)}/${HABITS.length}，全勤 ${counts.filter(c => c === HABITS.length).length} 天`);
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
    // 睡眠 / 排便 / 反应
    const sleeps = days.map(d => store.days[d] && store.days[d].sleep ? store.days[d].sleep.quality : null).filter(Boolean);
    if (sleeps.length) lines.push(`😴 睡眠：好 ${sleeps.filter(s => s === "good").length} 晚 · 坏 ${sleeps.filter(s => s === "bad").length} 晚`);
    const hLabel = { good: "健康", mid: "一般", bad: "不佳" };
    const bowels = [];
    days.forEach(d => (store.days[d] && store.days[d].bowels || []).forEach(b => bowels.push(b)));
    if (bowels.length) lines.push(`💩 排便：共 ${bowels.length} 次，${["good", "mid", "bad"].map(h => { const n = bowels.filter(b => b.healthy === h).length; return n ? hLabel[h] + " " + n : ""; }).filter(Boolean).join(" · ") || "未评估"}`);
    const sympCount = {};
    days.forEach(d => (store.days[d] && store.days[d].symptoms || []).forEach(s => sympCount[s.tag] = (sympCount[s.tag] || 0) + 1));
    if (Object.keys(sympCount).length) lines.push(`🤕 孕期反应：${Object.entries(sympCount).sort((a, b) => b[1] - a[1]).map(([t, n]) => `${t}×${n}`).join(" · ")}`);
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
    HABITS.forEach(h => {
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
        return cell(s ? (s.quality === "good" ? DONE : BAD) : NONE, `${d} 睡眠${s ? (s.quality === "good" ? "：好" : "：坏") : "：无记录"}`);
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
    html += `<div class="sum-top" style="margin-top:10px">✅ 日均 ${(counts.reduce((a, b) => a + b, 0) / n).toFixed(1)}/${HABITS.length} · 全勤 ${counts.filter(c => c === HABITS.length).length} 天${ws.length ? ` · ⚖️ ${ws[0]} → ${ws[ws.length - 1]} kg` : ""}</div>`;
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
function exportJSON() {
    download(`打卡数据备份_${todayStr()}.json`, JSON.stringify(store, null, 2), "application/json");
    markExported();
}
function exportCSV() {
    const ratingLabel = { good: "控糖良好", mid: "一般", bad: "超标" };
    const head = ["日期", ...HABITS.map(h => h.name), "英语微任务", "英语知识点", "饮水(ml)",
        ...MEALS.flatMap(m => [m.name, m.name + "控糖评估"]),
        "加餐", "锻炼", "排便", "体重(kg)", "睡眠", "孕期反应", "技术学习", "临时任务", "复盘", "感恩", "孕期日记", "运营", "想法碎片", "知识收藏"];
    const rows = [head];
    Object.keys(store.days).sort().forEach(d => {
        const o = day(d);
        const bowelLabel = { good: "健康", mid: "一般", bad: "不佳" };
        rows.push([
            d,
            ...HABITS.map(h => isHabitDone(h.id, d) ? "✓" : ""),
            ENG_TASKS.filter(t => isEngTaskDone(t.id, d)).map(t => t.name).join(" | "),
            o.english.phrases.map(p => p.text).join(" | "),
            waterTotal(d),
            ...MEALS.flatMap(m => { const r = o.meals[m.id] || {}; return [r.food || "", ratingLabel[r.rating] || ""]; }),
            o.snacks.map(s => s.food + (s.rating ? "(" + (ratingLabel[s.rating] || "") + ")" : "")).join(" | "),
            o.exercises.map(x => x.text).join(" | "),
            o.bowels.map(b => [b.amount ? "量·" + b.amount : "", b.honey === true ? "用蜂蜜露" : b.honey === false ? "未用蜂蜜露" : "", bowelLabel[b.healthy] || "", b.note].filter(Boolean).join(" ")).join(" | "),
            o.weight ? o.weight.value : "",
            o.sleep ? (o.sleep.quality === "good" ? "好" : "坏") : "",
            o.symptoms.map(s => s.tag).join(" | "),
            o.techLogs.map(t => t.text).join(" | "),
            o.tasks.map(t => (t.done ? "✓ " : "○ ") + t.text).join(" | "),
            o.reviews.map(r => r.text).join(" | "),
            o.gratitude.map(g => g.text).join(" | "),
            o.pregDiaries.map(p => p.text).join(" | "),
            o.media.map(m => `[${m.tag}] ${m.text}`).join(" | "),
            o.thoughts.map(t => (t.tag ? `[${t.tag}] ` : "") + t.text).join(" | "),
            o.knowledge.map(k => `[${k.type}] ${k.text}`).join(" | "),
        ]);
    });
    const csv = "\uFEFF" + rows.map(r => r.map(c =>
        `"${String(c).replace(/"/g, '""').replace(/\r?\n/g, " ")}"`).join(",")).join("\r\n");
    download(`打卡数据_${todayStr()}.csv`, csv, "text/csv;charset=utf-8");
    markExported();
}
function importJSON(input) {
    const file = input.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
        try {
            const data = JSON.parse(reader.result);
            if (!data.days) throw new Error("格式不正确");
            if (!confirm(`将导入 ${Object.keys(data.days).length} 天的数据，与现有数据按日期合并（同日期以导入数据为准）。继续？`)) return;
            Object.assign(store.days, data.days);
            if (data.settings && data.settings.supplements) store.settings.supplements = data.settings.supplements;
            if (data.settings && data.settings.symptomTags) store.settings.symptomTags = data.settings.symptomTags;
            if (data.settings && data.settings.thoughtTags) store.settings.thoughtTags = data.settings.thoughtTags;
            save(); renderAll();
            alert("导入成功！");
        } catch (e) { alert("导入失败：" + e.message); }
    };
    reader.readAsText(file);
    input.value = "";
}
function clearAll() {
    if (!confirm("确定清空全部数据？此操作不可恢复！")) return;
    if (!confirm("再次确认：真的要清空吗？建议先导出 JSON 备份。")) return;
    localStorage.removeItem(STORE_KEY);
    store = loadStore();
    renderAll();
}

/* ==================== 渲染入口 ==================== */
function renderToday() {
    renderHabits(); renderEnglish(); renderTasks(); renderWater(); renderSupps(); renderTimeline(); renderReviews(); renderGratitude(); renderSummary(); renderMeals();
    renderSnacks(); renderExercises(); renderBowelForm(); renderBowel(); renderPregDiaries();
    renderWeight(); renderSleep(); renderSymptoms();
}
function renderAll() {
    renderToday(); renderThoughts(); renderKnowledge(); renderMedia(); renderTech(); renderBackupTip();
    if (document.getElementById("page-history").classList.contains("active")) renderHistory();
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
    const need = hasData && overdue >= 7;
    document.querySelector('nav.tabs button[data-tab="data"]').classList.toggle("need-backup", need);
    const tip = document.getElementById("backupTip");
    if (need) {
        tip.style.display = "block";
        tip.innerHTML = `⚠️ ${last ? `已 <b>${overdue}</b> 天未备份` : "从未备份过"}，建议立即导出 JSON 保存到云盘/相册`;
    } else {
        tip.style.display = "none";
    }
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
    document.getElementById("datePicker").value = currentDate;
    selectKType(document.querySelector('#knowledgeTypeRow button[data-ktype="播客"]'));
    selectMediaTag(document.querySelector('#mediaTagRow button[data-mtag="小红书"]'));
    renderThoughtTagRow();
    renderAll();
    if (location.protocol.startsWith("http") && "serviceWorker" in navigator)
        navigator.serviceWorker.register("sw.js").catch(() => { });
})();

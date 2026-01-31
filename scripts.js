// ================= LINKS DATA =================
const linksData = {
  general: {
    ERP: "https://iitdadierp.iitd.ac.in/student/login",
    Teams: "https://teams.microsoft.com/",
    Outlook: "https://outlook.office.com/",
    Blackboard: "https://iida.blackboard.com/ultra/course",
    TimeTable: "https://iitdabudhabi.ac.ae/uploaded_files/semseter-schedule/V2%20-%20B.Tech%20EEN%20-%20Semester%204.pdf"
  },

  courses: {
    "AENL200 (CET)": {
      Blackboard: "https://iida.blackboard.com/ultra/courses/_106_1/outline"
    },

    "AENL224 (Elec Mch)": {
      Blackboard: "https://iida.blackboard.com/ultra/courses/_109_1/outline"
    },

    "AENL223 (Materials Enrgy Sys)": {
      Blackboard: "https://iida.blackboard.com/ultra/courses/_107_1/outline"
    },

    "AENL202 (RET)": {
      Blackboard: "https://iida.blackboard.com/ultra/courses/_108_1/outline"
    }
  }
};

// ================= UPDATES DATA =================
const updatesData = [];

// ================= INSTAGRAM REELS =================
const localClips = Array.from({ length: 16 }, (_, i) => `idk${i + 1}.mp4`);

function pickRandomClips(count) {
  const pool = [...localClips];
  const result = [];

  for (let i = 0; i < count && pool.length; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    result.push(pool.splice(idx, 1)[0]);
  }

  return result;
}

function renderLocalClips() {
  const leftVid = document.getElementById("local-clip-left");
  const rightVid = document.getElementById("local-clip-right");
  if (!leftVid || !rightVid || localClips.length === 0) return;

  const [leftSrc, rightSrc] = pickRandomClips(2);

  [leftVid, rightVid].forEach((vid, idx) => {
    vid.src = idx === 0 ? leftSrc : rightSrc;
    vid.muted = true;
    vid.playsInline = true;
    vid.loop = true;
    vid.autoplay = true;
    vid.load();
    vid.play().catch(() => {});
  });
}

// ================= HELPER: ADD UPDATE =================
function addUpdate(category, text, expiry) {
  updatesData.push([category, text, expiry]);
}

// ================= RENDER GENERAL LINKS =================
function renderGeneralLinks(selector, data) {
  const container = document.querySelector(selector);
  if (!container) return;

  for (const [name, url] of Object.entries(data)) {
    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.textContent = name;
    container.appendChild(link);
  }
}

// ================= RENDER COURSE LINKS =================
function renderCourseLinks(selector, data) {
  const container = document.querySelector(selector);
  if (!container) return;

  for (const [course, resources] of Object.entries(data)) {
    const box = document.createElement("div");
    box.className = "box";

    const title = document.createElement("h1");
    title.textContent = course;
    box.appendChild(title);

    for (const [name, url] of Object.entries(resources)) {
      const link = document.createElement("a");
      link.href = url;
      link.target = "_blank";
      link.textContent = name;
      box.appendChild(link);
    }

    container.appendChild(box);
  }
}

// ================= RENDER UPDATES (QUIZZES FIRST) =================
function renderUpdates() {
  const now = new Date();
  const grouped = {};

  // group updates
  updatesData.forEach(([category, text, expiry]) => {
    if (!grouped[category]) grouped[category] = [];
    grouped[category].push([text, expiry]);
  });

  // define priority
  const orderedCategories = [
    "quizzes",
    ...Object.keys(grouped).filter(c => c !== "quizzes")
  ];

  orderedCategories.forEach(category => {
    const items = grouped[category];
    if (!items) return;

    items.sort((a, b) => new Date(a[1]) - new Date(b[1]));
    const container = document.getElementById(category + "-box");
    if (!container) return;

    container.innerHTML = ""; // clean slate

    items.forEach(([text, expiry]) => {
      const parts = String(expiry).split("-").map(Number);
      if (parts.length !== 3) return;

      const [y, m, d] = parts;
      const expiryExclusive = new Date(y, m - 1, d + 1);

      if (now < expiryExclusive) {
        const p = document.createElement("p");
        p.textContent = text;
        container.appendChild(p);
      }
    });
  });
}

// ================= THEME TOGGLE =================
const toggleBtn = document.getElementById("theme-toggle");
const savedTheme = localStorage.getItem("theme");

if (savedTheme) {
  document.documentElement.setAttribute("data-theme", savedTheme);
}

if (toggleBtn) {
  toggleBtn.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme");
    const next = current === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
  });
}

// ================= SEM 2 UPDATES =================
addUpdate(
  "quizzes",
  "AENL200: Quiz 1 scheduled for Monday 02/02/2026",
  "2026-02-02"
);

addUpdate(
  "quizzes",
  "AENL202: \"Surprise\" Quiz 1 scheduled for unknown date next week",
  "2026-02-06"
);

// ================= INIT =================
window.addEventListener("DOMContentLoaded", () => {
  renderGeneralLinks(".general", linksData.general);
  renderCourseLinks(".links", linksData.courses);
  renderUpdates();
  renderLocalClips();
});

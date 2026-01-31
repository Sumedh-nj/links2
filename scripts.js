<<<<<<< HEAD
// ================= LINKS DATA =================
=======
8.3// ====== Links Data ======
>>>>>>> 8b939b65b350687244cd42b6a3c7d310bd85b4fa
const linksData = {
  general: {
    ERP: "https://iitdadierp.iitd.ac.in/student/login",
    Teams: "https://teams.microsoft.com/",
    Outlook: "https://outlook.office.com/",
    Blackboard: "https://iida.blackboard.com/ultra/course",
    TimeTable: "file:///C:/Users/sumed/AppData/Local/Packages/5319275A.WhatsAppDesktop_cv1g1gvanyjgm/LocalState/sessions/9E31299E24A5A650AB1943C959BB6F966C723F1E/transfers/2026-05/V2%20-%20B.Tech%20EEN%20-%20Semester%204.pdf"
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
// Local vertical clips (idk1.mp4 ... idk16.mp4)
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

// ================= RENDER UPDATES =================
function renderUpdates() {
  const now = new Date();
  const grouped = {};

  updatesData.forEach(([category, text, expiry]) => {
    if (!grouped[category]) grouped[category] = [];
    grouped[category].push([text, expiry]);
  });

  for (const [category, items] of Object.entries(grouped)) {
    items.sort((a, b) => new Date(a[1]) - new Date(b[1]));
    const container = document.getElementById(category + "-box");
    if (!container) continue;

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
  }
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


<<<<<<< HEAD
addUpdate(
  "quizzes",
  "AENL200: Quiz 1 scheduled for Monday 02/02/2026",
  "2026-02-02"
);

addUpdate(
  "quizzes",
  "AENL202: \"Suprise\" Quiz 1 scheduled for Unknown date next week",
  "2026-02-06"
);

// ================= INIT =================
=======
//Updates:



















// ====== Initialize Page ======
>>>>>>> 8b939b65b350687244cd42b6a3c7d310bd85b4fa
window.addEventListener("DOMContentLoaded", () => {
  renderGeneralLinks(".general", linksData.general);
  renderCourseLinks(".links", linksData.courses);
  renderUpdates();
  renderLocalClips();
});

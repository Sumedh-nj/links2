// ====== Links Data ======
const linksData = {
  general: {
    ERP: "https://iitdadierp.iitd.ac.in/student/login",
    Teams: "https://teams.microsoft.com/",
    Outlook: "https://outlook.office.com/",
    Blackboard: "https://iida.blackboard.com/ultra/course",
    TimeTable: "https://abudhabi.iitd.ac.in/uploaded_files/B.Tech.%202nd%20year%20EEN%20Sem%201_2025-26.pdf"
  },
  courses: {
    "AENL220 (Heat)": {
      "Lecture slides": "https://iitdabudhabi.sharepoint.com/sites/AENL220_jacpcl/Class%20Materials/Forms/AllItems.aspx",
      Quiz: "https://iitdabudhabi.sharepoint.com/:f:/s/AENL220_jacpcl/Ene8Rq62J5JEonz9fQsD5BUBIJLmyXtU-onfgvHZgCNK4g?e=T6SezX",
      Tutorials: "https://iitdabudhabi.sharepoint.com/:f:/s/AENL220_jacpcl/EtURNCymC25FqStyIHHQjH8BzKEl9InbYIHEWA3reHm2CQ?e=w8iQBg"
    },
    "AAPL105 (Mech)": {
      Blackboard: "https://iida.blackboard.com/ultra/courses/_38_1/outline"
    },
    "AENL210 (Thermo)": {
      Blackboard : "https://iida.blackboard.com/ultra/courses/_39_1/outline",
      Lectures: "https://iitdabudhabi-my.sharepoint.com/:f:/g/personal/kkant_iitdabudhabi_ac_ae/Enl1qAazZR9BiFn9yuRHZl4Be2lylwrBb1NKZ_ew9EDn7Q?e=JzixUb",
      "Assig/Quiz/Tut": "https://iitdabudhabi-my.sharepoint.com/:f:/g/personal/kkant_iitdabudhabi_ac_ae/EmyiV-znPk9NtH9FoIu7GREBj0c8bxilcB5rOI_EQgTnkA?e=MfniI6",
      "Assig/Quiz/Tut (Solution)": "https://iitdabudhabi-my.sharepoint.com/:f:/g/personal/kkant_iitdabudhabi_ac_ae/Es8ZXG4JDGJBl8iwEl7fmHwBu-cJIzobmNyaq4GFLzK5NQ?e=IBLE0E"
    },
    "AENL222 (Electro & Micro)": {
      Onedrive: "https://iitdabudhabi-my.sharepoint.com/personal/anandarup_iitdabudhabi_ac_ae/_layouts/15/onedrive.aspx?id=/personal/anandarup_iitdabudhabi_ac_ae/Documents/AENL222_for_sharing&ga=1",
      "Lectures (Slides)": "https://iitdabudhabi-my.sharepoint.com/:f:/r/personal/anandarup_iitdabudhabi_ac_ae/Documents/AENL222_for_sharing/lecture_slides?csf=1&web=1&e=mHx3jp",
      "Lectures (Vids)": "https://iitdabudhabi-my.sharepoint.com/:f:/r/personal/anandarup_iitdabudhabi_ac_ae/Documents/AENL222_for_sharing/lecture_videos?csf=1&web=1&e=hZFX1z",
      "Problem Sheets": "https://iitdabudhabi-my.sharepoint.com/:f:/r/personal/anandarup_iitdabudhabi_ac_ae/Documents/AENL222_for_sharing/problem_sheet?csf=1&web=1&e=1TktU9"
    },
    "AENL338 (AI)": {
      Blackboard: "https://iida.blackboard.com/ultra/courses/_6_1/outline"
    }
  }
};

// ====== Updates Data ======
const updatesData = [];

// ====== Helper to Add Update ======
function addUpdate(category, text, expiry) {
  updatesData.push([category, text, expiry]);
}

// ====== Render General Links ======
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

// ====== Render Course Links ======
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

// ====== Render Updates ======
function renderUpdates() {
  const now = new Date();

  // group updates by category
  const grouped = {};
  updatesData.forEach(([category, text, expiry]) => {
    if (!grouped[category]) grouped[category] = [];
    grouped[category].push([text, expiry]);
  });

  // sort inside each category
  for (const [category, items] of Object.entries(grouped)) {
    items.sort((a, b) => new Date(a[1]) - new Date(b[1]));
    const container = document.getElementById(category + "-box");
    if (!container) continue;

    items.forEach(([text, expiry]) => {
      const parts = String(expiry).split('-').map(Number);
      if (parts.length !== 3) return;
      const [y, m, d] = parts;
      const expiryExclusive = new Date(y, m - 1, d + 1, 0, 0, 0, 0);
      if (now < expiryExclusive) {
        const p = document.createElement("p");
        p.textContent = text;
        container.appendChild(p);
      }
    });
  }
}

// ====== Theme Toggle ======
const toggleBtn = document.getElementById("theme-toggle");
const currentTheme = localStorage.getItem("theme");
if (currentTheme) document.documentElement.setAttribute("data-theme", currentTheme);

toggleBtn.addEventListener("click", () => {
  const theme = document.documentElement.getAttribute("data-theme");
  const newTheme = theme === "light" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", newTheme);
  localStorage.setItem("theme", newTheme);
});

// ====== Updates ======

addUpdate("timetable","AENL220: Thursday tutorial will be held in the first half, ie. classes will start from 9 AM","2026-09-25");
addUpdate("assignments","AAPL105: Assignment 7 to be submitted on Monday 10/11/2025 by 5:00 pm","2025-11-10")
addUpdate("assignments","AENL210: Assignment 6 and Tutorial 9 to be submitted on Friday 7th November by 11:30 AM","2025-11-07")
addUpdate("quizzes","AENL210: Quiz 6 to be held on Friday 7th November in the 11:30 AM buffer class","2025-11-07")

// ====== Initialize Page ======
window.addEventListener("DOMContentLoaded", () => {
  renderGeneralLinks(".general", linksData.general);
  renderCourseLinks(".links", linksData.courses);
  renderUpdates();
});

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
      "Check Outlook": "https://outlook.office.com/"
    },
    "AENL210 (Thermo)": {
      Onedrive: "https://iitdabudhabi-my.sharepoint.com/personal/kkant_iitdabudhabi_ac_ae/_layouts/15/onedrive.aspx?id=/personal/kkant_iitdabudhabi_ac_ae/Documents/AENL%20210/Regular_course_material&ga=1",
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
const updatesData = [
  ["assignments", "AAPL105 (Mech): Assignment 3 submission by 19/09/2025", "2025-09-19"],
  ["assignments", "AENL210 (Thermo): Assignment 2 and 3 submission by 18/09/2025", "2025-09-18"],
  ["assignments", "AENL220 (Heat): Assignment 2 submission on teams by 19/09/2025", "2025-09-19"],
  ["quizzes", "AENL222: Quiz based on the portions covered till September 11th will be held on 18/09/2025", "2025-09-18"]
];

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
  now.setSeconds(0, 0);

  updatesData.forEach(([category, text, expiry]) => {
    const expiryDate = new Date(expiry);
    expiryDate.setHours(0, 0, 0, 0); // expires exactly at midnight

    if (now < expiryDate) {
      const container = document.getElementById(category + "-box");
      if (container) {
        const p = document.createElement("p");
        p.textContent = text;
        container.appendChild(p);
      }
    }
  });
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


//Updates:
addUpdate("timetable","AAPL105+AENL220: Timings swapped, AENL210 lecture at 10 am, AAPL105 lecture at 11 am for 16/09/2025 ","2025-09-16")





















// ====== Initialize Page ======
window.addEventListener("DOMContentLoaded", () => {
  renderGeneralLinks(".general", linksData.general);
  renderCourseLinks(".links", linksData.courses);
  renderUpdates();
});

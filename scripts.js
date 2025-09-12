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
      "Teams Files": "https://iitdabudhabi.sharepoint.com/sites/AENL220_jacpcl/Shared%20Documents/Forms/AllItems.aspx?id=/sites/AENL220_jacpcl/Shared%20Documents/General&p=true&ga=1",
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
  },

 updates: [
  { text: "Assignment 3 deadline approaching", expiry: "2025-09-20T17:00:00" }
]
};



function renderLinks1(thing, data) {
  const container = document.querySelector(thing);

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
// For general links in .box2
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

function renderUpdates(selector, updates) {
  const container = document.querySelector(selector);
  if (!container) return;

  const now = new Date();

  updates.forEach(update => {
    const expiryDateTime = new Date(update.expiry);
    if (now <= expiryDateTime) {
      const p = document.createElement("p");
      p.textContent = update.text;
      container.appendChild(p);
    }
  });
}
const toggleBtn = document.getElementById("theme-toggle");

// Initialize theme from system preference
const currentTheme = localStorage.getItem("theme");
if (currentTheme) {
    document.documentElement.setAttribute("data-theme", currentTheme);
}

toggleBtn.addEventListener("click", () => {
    const theme = document.documentElement.getAttribute("data-theme");
    const newTheme = theme === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);

  
});

// Set initial icon



window.addEventListener("DOMContentLoaded", () => {
  renderGeneralLinks(".general", linksData.general );   // general links
  renderLinks1(".links", linksData.courses);  // course links
  renderUpdates(".updates", linksData.updates); // updates
});



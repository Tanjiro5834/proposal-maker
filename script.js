(function () {
  "use strict";

  // =========================================
  // CONSTANTS & DEFAULT CONTENT
  // =========================================
  const STORAGE_KEYS = {
    STATE: "proposal_maker_state_v1",
    SCHOOLS: "proposal_maker_saved_schools_v1"
  };

  const DEFAULT_CONTENT = {
    subject: "Proposal for Custom Software and Website Development Services",
    intro:
      "Good day! My name is Nathaniel Coronacion, a freelance software engineer based in Imus, Cavite. I am writing to offer my services in designing and building the software systems your school needs to run more efficiently.",
    about:
      "I am a Computer Science graduate of STI College Bacoor with about three years of freelance experience and more than 15 shipped projects across web, desktop, and mobile. I was also the champion of CodeFest 2023 (mobile app development). I have worked on a school's systems directly: I built a school website from scratch during my backend engineering internship at The Thomas Aquinas Institute of Learning (TAIL), so I understand how schools operate and what they need from their software.",
    services: [
      "School website: a modern, mobile-friendly site with announcements, admissions information, and a contact page, plus an admin panel so your staff can update content without a developer.",
      "Student information system: records, enrollment, class lists, and reports.",
      "Grading and attendance systems: faster encoding, automatic computation, and printable reports.",
      "Online enrollment and registration: forms, requirements tracking, and an admin review dashboard.",
      "E-learning platform: lessons, assignments, quizzes, and student progress tracking.",
      "Inventory and library systems: tracking of school assets, equipment, and books.",
      "Maintenance and support: bug fixes, updates, hosting setup, and staff training."
    ].join("\n"),
    why: [
      "Built for your workflow: every system is designed around how your school actually operates, not a generic template.",
      "Secure and reliable: student and staff records stay protected, only authorized staff can access them, and every system is tested with your team before turnover.",
      "Clear process: requirements meeting, written quotation, regular progress demos, user testing, deployment, and turnover with documentation.",
      "Affordable: pricing is based on scope, with no hidden fees."
    ].join("\n"),
    terms: [
      "A written quotation and signed service agreement before work begins.",
      "A downpayment before development, with the remaining balance paid by milestone or upon delivery.",
      "Free bug fixes for 30 days after turnover. Support and new features after that period are covered by a separate, agreed maintenance fee."
    ].join("\n"),
    nextStep:
      "I would be glad to meet with you, in person or online, to understand your school's needs and prepare a free, no-obligation quotation. You may view my previous work at nathanielcoronacion.com and my code at github.com/Tanjiro5834.",
    closing:
      "Thank you for your time and consideration. I look forward to the opportunity to work with {{school}}.",
    signature: [
      "Respectfully yours,",
      "",
      "Nathaniel Coronacion",
      "Freelance Software Engineer",
      "0998 348 4889",
      "[Email Address]",
      "nathanielcoronacion.com",
      "linkedin.com/in/nathaniel-coronacion"
    ].join("\n")
  };

  // =========================================
  // DOM REFERENCES
  // =========================================
  const fields = {
    date: document.getElementById("input-date"),
    recipientName: document.getElementById("input-recipient-name"),
    position: document.getElementById("input-position"),
    schoolName: document.getElementById("input-school-name"),
    schoolAddress: document.getElementById("input-school-address"),
    dear: document.getElementById("input-dear"),
    subject: document.getElementById("input-subject"),
    intro: document.getElementById("input-intro"),
    about: document.getElementById("input-about"),
    services: document.getElementById("input-services"),
    why: document.getElementById("input-why"),
    terms: document.getElementById("input-terms"),
    nextStep: document.getElementById("input-next-step"),
    closing: document.getElementById("input-closing"),
    signature: document.getElementById("input-signature")
  };

  const letterPage = document.getElementById("letter-page");
  const savedSchoolsList = document.getElementById("saved-schools-list");
  const savedCountEl = document.getElementById("saved-count");
  const toastEl = document.getElementById("toast");

  let savedSchools = [];
  let toastTimeout = null;

  // =========================================
  // UTILITIES: ESCAPING, FORMATTING, STORAGE
  // =========================================
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function applyPlaceholders(text) {
    const schoolVal = fields.schoolName.value.trim() || "your school";
    return String(text).replace(/\{\{\s*school\s*\}\}/gi, schoolVal);
  }

  function formatDateDisplay(isoDate) {
    if (!isoDate) return "";
    const parts = isoDate.split("-");
    if (parts.length !== 3) return isoDate;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const dateObj = new Date(year, month, day);
    if (isNaN(dateObj.getTime())) return isoDate;
    return dateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  }

  function getTodayIso() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function showToast(message) {
    toastEl.textContent = message;
    toastEl.classList.add("show");
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toastEl.classList.remove("show");
    }, 2500);
  }

  function saveStateToStorage() {
    const state = {};
    Object.keys(fields).forEach((key) => {
      state[key] = fields[key].value;
    });
    try {
      localStorage.setItem(STORAGE_KEYS.STATE, JSON.stringify(state));
    } catch (err) {
      // Fail silently if storage quota exceeded or disabled
    }
  }

  function loadStateFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.STATE);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (err) {
      return null;
    }
  }

  function saveSchoolsToStorage() {
    try {
      localStorage.setItem(STORAGE_KEYS.SCHOOLS, JSON.stringify(savedSchools));
    } catch (err) {
      showToast("Unable to save to browser storage.");
    }
  }

  function loadSchoolsFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SCHOOLS);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      return [];
    }
  }

  // =========================================
  // PREVIEW RENDERING
  // =========================================
  function parseLines(rawText) {
    return applyPlaceholders(rawText)
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  }

  function renderBullets(lines, boldBeforeColon = false) {
    if (lines.length === 0) return "";
    const itemsHtml = lines
      .map((line) => {
        if (boldBeforeColon) {
          const colonIdx = line.indexOf(":");
          if (colonIdx > 0) {
            const label = escapeHtml(line.slice(0, colonIdx + 1));
            const rest = escapeHtml(line.slice(colonIdx + 1));
            return `<li><strong>${label}</strong>${rest}</li>`;
          }
        }
        return `<li>${escapeHtml(line)}</li>`;
      })
      .join("");
    return `<ul class="letter-list">${itemsHtml}</ul>`;
  }

  function renderPreview() {
    const htmlParts = [];

    // 1. Date (optional)
    const formattedDate = formatDateDisplay(fields.date.value);
    if (formattedDate) {
      htmlParts.push(`<div class="letter-date">${escapeHtml(formattedDate)}</div>`);
    }

    // 2. Recipient Block (skip empty fields)
    const recipientLines = [];
    if (fields.recipientName.value.trim()) {
      recipientLines.push(`<div>${escapeHtml(fields.recipientName.value.trim())}</div>`);
    }
    if (fields.position.value.trim()) {
      recipientLines.push(`<div>${escapeHtml(fields.position.value.trim())}</div>`);
    }
    if (fields.schoolName.value.trim()) {
      recipientLines.push(`<div>${escapeHtml(fields.schoolName.value.trim())}</div>`);
    }
    if (fields.schoolAddress.value.trim()) {
      const addressSubLines = fields.schoolAddress.value
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
      addressSubLines.forEach((addrLine) => {
        recipientLines.push(`<div>${escapeHtml(addrLine)}</div>`);
      });
    }
    if (recipientLines.length > 0) {
      htmlParts.push(`<div class="letter-recipient">${recipientLines.join("")}</div>`);
    }

    // 3. Subject Line
    const subjectText = applyPlaceholders(fields.subject.value).trim();
    if (subjectText) {
      htmlParts.push(`<div class="letter-subject">Subject: ${escapeHtml(subjectText)}</div>`);
    }

    // 4. Salutation
    const dearName = fields.dear.value.trim() || "Sir/Madam";
    htmlParts.push(`<div class="letter-salutation">Dear ${escapeHtml(dearName)},</div>`);

    // 5. Intro Paragraph
    const introText = applyPlaceholders(fields.intro.value).trim();
    if (introText) {
      htmlParts.push(`<p class="letter-paragraph">${escapeHtml(introText)}</p>`);
    }

    // 6. About Me
    const aboutText = applyPlaceholders(fields.about.value).trim();
    if (aboutText) {
      htmlParts.push(`<h3 class="letter-heading">About Me</h3>`);
      htmlParts.push(`<p class="letter-paragraph">${escapeHtml(aboutText)}</p>`);
    }

    // 7. Services Offered
    const serviceLines = parseLines(fields.services.value);
    if (serviceLines.length > 0) {
      htmlParts.push(`<h3 class="letter-heading">Services Offered</h3>`);
      htmlParts.push(renderBullets(serviceLines, false));
    }

    // 8. Why Work With Me
    const whyLines = parseLines(fields.why.value);
    if (whyLines.length > 0) {
      htmlParts.push(`<h3 class="letter-heading">Why Work With Me</h3>`);
      htmlParts.push(renderBullets(whyLines, true));
    }

    // 9. Proposed Terms
    const termLines = parseLines(fields.terms.value);
    if (termLines.length > 0) {
      htmlParts.push(`<h3 class="letter-heading">Proposed Terms</h3>`);
      htmlParts.push(renderBullets(termLines, false));
    }

    // 10. Next Step
    const nextStepText = applyPlaceholders(fields.nextStep.value).trim();
    if (nextStepText) {
      htmlParts.push(`<h3 class="letter-heading">Next Step</h3>`);
      htmlParts.push(`<p class="letter-paragraph">${escapeHtml(nextStepText)}</p>`);
    }

    // 11. Closing Line
    const closingText = applyPlaceholders(fields.closing.value).trim();
    if (closingText) {
      htmlParts.push(`<p class="letter-closing">${escapeHtml(closingText)}</p>`);
    }

    // 12. Signature Block
    const signatureText = applyPlaceholders(fields.signature.value).trim();
    if (signatureText) {
      htmlParts.push(`<div class="letter-signature">${escapeHtml(signatureText)}</div>`);
    }

    letterPage.innerHTML = htmlParts.join("");
  }

  // =========================================
  // PLAIN TEXT GENERATOR (FOR CLIPBOARD)
  // =========================================
  function generatePlainText() {
    const blocks = [];

    const formattedDate = formatDateDisplay(fields.date.value);
    if (formattedDate) blocks.push(formattedDate);

    const recipientLines = [];
    if (fields.recipientName.value.trim()) recipientLines.push(fields.recipientName.value.trim());
    if (fields.position.value.trim()) recipientLines.push(fields.position.value.trim());
    if (fields.schoolName.value.trim()) recipientLines.push(fields.schoolName.value.trim());
    if (fields.schoolAddress.value.trim()) {
      fields.schoolAddress.value
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .forEach((l) => recipientLines.push(l));
    }
    if (recipientLines.length > 0) blocks.push(recipientLines.join("\n"));

    const subjectText = applyPlaceholders(fields.subject.value).trim();
    if (subjectText) blocks.push(`Subject: ${subjectText}`);

    const dearName = fields.dear.value.trim() || "Sir/Madam";
    blocks.push(`Dear ${dearName},`);

    const introText = applyPlaceholders(fields.intro.value).trim();
    if (introText) blocks.push(introText);

    const aboutText = applyPlaceholders(fields.about.value).trim();
    if (aboutText) blocks.push(`About Me\n${aboutText}`);

    const serviceLines = parseLines(fields.services.value);
    if (serviceLines.length > 0) {
      blocks.push(`Services Offered\n${serviceLines.map((l) => `• ${l}`).join("\n")}`);
    }

    const whyLines = parseLines(fields.why.value);
    if (whyLines.length > 0) {
      blocks.push(`Why Work With Me\n${whyLines.map((l) => `• ${l}`).join("\n")}`);
    }

    const termLines = parseLines(fields.terms.value);
    if (termLines.length > 0) {
      blocks.push(`Proposed Terms\n${termLines.map((l) => `• ${l}`).join("\n")}`);
    }

    const nextStepText = applyPlaceholders(fields.nextStep.value).trim();
    if (nextStepText) blocks.push(`Next Step\n${nextStepText}`);

    const closingText = applyPlaceholders(fields.closing.value).trim();
    if (closingText) blocks.push(closingText);

    const signatureText = applyPlaceholders(fields.signature.value).trim();
    if (signatureText) blocks.push(signatureText);

    return blocks.join("\n\n");
  }

  // =========================================
  // SAVED SCHOOLS MANAGEMENT
  // =========================================
  function renderSavedSchools() {
    savedCountEl.textContent = String(savedSchools.length);

    if (savedSchools.length === 0) {
      savedSchoolsList.innerHTML = `<li class="empty-state">No saved schools yet. Fill in details above and click "Save This School".</li>`;
      return;
    }

    savedSchoolsList.innerHTML = savedSchools
      .map((school, index) => {
        const title = escapeHtml(school.schoolName || school.recipientName || "Unnamed School");
        const subParts = [school.recipientName, school.position].filter(Boolean);
        const sub = escapeHtml(subParts.join(" — ") || "No contact name");

        return `
          <li class="saved-school-item">
            <button type="button" class="saved-school-load" data-index="${index}">
              <span class="school-title">${title}</span>
              <span class="school-sub">${sub}</span>
            </button>
            <button type="button" class="btn-delete-school" data-index="${index}" aria-label="Delete ${title}" title="Delete">&times;</button>
          </li>
        `;
      })
      .join("");
  }

  function handleSaveSchool() {
    const entry = {
      recipientName: fields.recipientName.value.trim(),
      position: fields.position.value.trim(),
      schoolName: fields.schoolName.value.trim(),
      schoolAddress: fields.schoolAddress.value.trim(),
      dear: fields.dear.value.trim()
    };

    if (!entry.schoolName && !entry.recipientName) {
      showToast("Enter at least a School Name or Recipient Name first.");
      fields.schoolName.focus();
      return;
    }

    // Update existing entry if school name matches, otherwise prepend
    const existingIndex = savedSchools.findIndex(
      (s) =>
        s.schoolName &&
        entry.schoolName &&
        s.schoolName.toLowerCase() === entry.schoolName.toLowerCase()
    );

    if (existingIndex >= 0) {
      savedSchools[existingIndex] = entry;
      showToast("Updated saved school details.");
    } else {
      savedSchools.unshift(entry);
      showToast("School saved to list.");
    }

    saveSchoolsToStorage();
    renderSavedSchools();
  }

  function loadSchoolIntoForm(index) {
    const entry = savedSchools[index];
    if (!entry) return;

    fields.recipientName.value = entry.recipientName || "";
    fields.position.value = entry.position || "";
    fields.schoolName.value = entry.schoolName || "";
    fields.schoolAddress.value = entry.schoolAddress || "";
    fields.dear.value = entry.dear || "";

    saveStateToStorage();
    renderPreview();
    showToast(`Loaded ${entry.schoolName || entry.recipientName}`);
  }

  function deleteSavedSchool(index) {
    savedSchools.splice(index, 1);
    saveSchoolsToStorage();
    renderSavedSchools();
    showToast("Removed school from list.");
  }

  // =========================================
  // EVENT BINDINGS & INITIALIZATION
  // =========================================
  function handleFieldChange() {
    saveStateToStorage();
    renderPreview();
  }

  function init() {
    // Set default mobile view
    document.body.setAttribute("data-mobile-view", "edit");

    // Restore state or apply defaults
    const savedState = loadStateFromStorage();
    if (savedState) {
      Object.keys(fields).forEach((key) => {
        if (typeof savedState[key] === "string") {
          fields[key].value = savedState[key];
        } else if (DEFAULT_CONTENT[key] !== undefined) {
          fields[key].value = DEFAULT_CONTENT[key];
        }
      });
    } else {
      Object.keys(DEFAULT_CONTENT).forEach((key) => {
        fields[key].value = DEFAULT_CONTENT[key];
      });
    }

    // Restore saved schools
    savedSchools = loadSchoolsFromStorage();
    renderSavedSchools();

    // Attach live input listeners
    Object.values(fields).forEach((inputEl) => {
      inputEl.addEventListener("input", handleFieldChange);
    });

    // Date buttons
    document.getElementById("btn-date-today").addEventListener("click", () => {
      fields.date.value = getTodayIso();
      handleFieldChange();
    });

    document.getElementById("btn-date-clear").addEventListener("click", () => {
      fields.date.value = "";
      handleFieldChange();
    });

    // Clear recipient (Section 1 only)
    document.getElementById("btn-clear-recipient").addEventListener("click", () => {
      fields.date.value = "";
      fields.recipientName.value = "";
      fields.position.value = "";
      fields.schoolName.value = "";
      fields.schoolAddress.value = "";
      fields.dear.value = "";
      handleFieldChange();
      fields.recipientName.focus();
      showToast("Recipient fields cleared.");
    });

    // Reset content to default (Section 2 only)
    document.getElementById("btn-reset-content").addEventListener("click", () => {
      const confirmed = window.confirm(
        "Reset all letter content back to the default template? Your recipient details and saved schools will remain intact."
      );
      if (!confirmed) return;

      Object.keys(DEFAULT_CONTENT).forEach((key) => {
        fields[key].value = DEFAULT_CONTENT[key];
      });
      handleFieldChange();
      showToast("Letter content reset to default.");
    });

    // Save school button
    document.getElementById("btn-save-school").addEventListener("click", handleSaveSchool);

    // Saved schools delegation (load / delete)
    savedSchoolsList.addEventListener("click", (e) => {
      const loadBtn = e.target.closest(".saved-school-load");
      if (loadBtn) {
        const idx = parseInt(loadBtn.getAttribute("data-index"), 10);
        loadSchoolIntoForm(idx);
        return;
      }

      const delBtn = e.target.closest(".btn-delete-school");
      if (delBtn) {
        const idx = parseInt(delBtn.getAttribute("data-index"), 10);
        deleteSavedSchool(idx);
      }
    });

    // Copy as plain text
    document.getElementById("btn-copy").addEventListener("click", async () => {
      const text = generatePlainText();
      try {
        await navigator.clipboard.writeText(text);
        showToast("Copied letter to clipboard!");
      } catch (err) {
        // Fallback for older browsers or non-HTTPS contexts
        const tempArea = document.createElement("textarea");
        tempArea.value = text;
        tempArea.style.position = "fixed";
        tempArea.style.opacity = "0";
        document.body.appendChild(tempArea);
        tempArea.select();
        document.execCommand("copy");
        document.body.removeChild(tempArea);
        showToast("Copied letter to clipboard!");
      }
    });

    // Print / Save as PDF
    document.getElementById("btn-print").addEventListener("click", () => {
      const originalTitle = document.title;
      const schoolName = fields.schoolName.value.trim();
      document.title = schoolName ? `Proposal - ${schoolName}` : "Proposal Letter";
      window.print();
      document.title = originalTitle;
    });

    // Mobile Tabs
    const tabEdit = document.getElementById("tab-edit");
    const tabPreview = document.getElementById("tab-preview");

    tabEdit.addEventListener("click", () => {
      document.body.setAttribute("data-mobile-view", "edit");
      tabEdit.classList.add("active");
      tabEdit.setAttribute("aria-pressed", "true");
      tabPreview.classList.remove("active");
      tabPreview.setAttribute("aria-pressed", "false");
    });

    tabPreview.addEventListener("click", () => {
      document.body.setAttribute("data-mobile-view", "preview");
      tabPreview.classList.add("active");
      tabPreview.setAttribute("aria-pressed", "true");
      tabEdit.classList.remove("active");
      tabEdit.setAttribute("aria-pressed", "false");
    });

    // Initial render
    renderPreview();
  }

  init();
})();

/* =========================================================
   SCHOLARLINK
   ADMIN DOCUMENT VERIFICATION
   Firestore + Supabase Storage
========================================================= */

import { auth, db } from "../firebase.js";
import { supabase } from "../supabase.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* =========================================================
   GLOBAL STATE
========================================================= */

const state = {
  currentAdmin: null,
  applicants: [],
  documents: [],
  selectedDocument: null,
  selectedApplicantUid: null,
  previewRotation: 0,
  previewZoom: 1
};

const REQUIREMENT_LABELS = {
  birthCertificate: "PSA Birth Certificate",
  goodMoral: "Good Moral Certificate",
  bir: "Barangay / Indigency Certificate",
  barangayCertificate: "Barangay Certificate",
  reportCard: "Report Card",
  grades: "Grades",
  cor: "Certificate of Registration",
  certificateOfEnrollment: "Certificate of Enrollment",
  registrationCertificate: "Registration Certificate",
  schoolId: "School ID",
  validId: "Valid ID",
  other: "Other Requirement"
};

const STATUS_LABELS = {
  pending: "Pending",
  verified: "Verified",
  rejected: "Rejected",
  resubmit: "Resubmission"
};

/* =========================================================
   DOM HELPERS
========================================================= */

const $ = (selector, parent = document) =>
  parent.querySelector(selector);

const $$ = (selector, parent = document) =>
  [...parent.querySelectorAll(selector)];

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[character]);
}

function getDate(value) {
  if (!value) return null;

  if (typeof value.toDate === "function") {
    return value.toDate();
  }

  if (typeof value === "object" && value.seconds) {
    return new Date(value.seconds * 1000);
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(value) {
  const date = getDate(value);

  if (!date) return "—";

  return date.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

function formatDateTime(value) {
  const date = getDate(value);

  if (!date) return "—";

  return date.toLocaleString("en-PH", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

function normalizeStatus(value) {
  const status = String(value || "pending")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  if (["verified", "approved", "accepted"].includes(status)) {
    return "verified";
  }

  if (["rejected", "declined"].includes(status)) {
    return "rejected";
  }

  if ([
    "resubmit",
    "resubmission",
    "request_resubmission",
    "needs_resubmission"
  ].includes(status)) {
    return "resubmit";
  }

  return "pending";
}

function statusLabel(status) {
  return STATUS_LABELS[normalizeStatus(status)] || "Pending";
}

function showMessage(message, type = "info") {
  let toast = $("#verificationToast");

  if (!toast) {
    toast = document.createElement("div");
    toast.id = "verificationToast";
    toast.setAttribute("role", "status");

    Object.assign(toast.style, {
      position: "fixed",
      right: "24px",
      bottom: "24px",
      zIndex: "99999",
      maxWidth: "360px",
      padding: "14px 18px",
      borderRadius: "10px",
      color: "#fff",
      fontSize: "14px",
      boxShadow: "0 8px 24px rgba(0,0,0,.18)"
    });

    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.style.background =
    type === "error" ? "#dc2626" :
    type === "success" ? "#15803d" :
    "#1d4ed8";

  toast.style.display = "block";

  clearTimeout(toast._timeout);

  toast._timeout = setTimeout(() => {
    toast.style.display = "none";
  }, 3500);
}

/* =========================================================
   APPLICANT DATA HELPERS
========================================================= */

function getApplicantName(application, user = {}) {
  const personal =
    application.personalInfo ||
    application.personal ||
    {};

  const firstName =
    personal.firstName ||
    application.firstName ||
    user.firstName ||
    "";

  const middleName =
    personal.middleName ||
    application.middleName ||
    user.middleName ||
    "";

  const lastName =
    personal.lastName ||
    application.lastName ||
    user.lastName ||
    "";

  return application.fullName ||
    application.applicantName ||
    personal.fullName ||
    [firstName, middleName, lastName].filter(Boolean).join(" ") ||
    user.fullName ||
    user.name ||
    user.displayName ||
    user.email ||
    "Unnamed Applicant";
}

function getApplicantId(application) {
  return application.applicantId ||
    application.applicationNumber ||
    application.referenceNumber ||
    "Not assigned";
}

function getRequirementMap(application) {
  const files = application.files || {};

  /*
   * Applicant requirements only.
   * Do not use files.scholarDocuments on this page.
   */
  return files.requirements ||
    files.applicationDocuments ||
    {};
}

function getRequirementLabel(key, file = {}) {
  return file.documentName ||
    file.label ||
    file.documentTypeLabel ||
    REQUIREMENT_LABELS[key] ||
    key.replace(/([A-Z])/g, " $1")
      .replace(/^./, character => character.toUpperCase());
}

function getStoragePath(file) {
  if (typeof file === "string") {
    return file;
  }

  return file?.storagePath ||
    file?.path ||
    file?.filePath ||
    file?.supabasePath ||
    file?.objectPath ||
    "";
}

function getFileName(file) {
  if (typeof file === "string") {
    return file.split("/").pop() || "Uploaded document";
  }

  return file?.originalName ||
    file?.fileName ||
    file?.name ||
    getStoragePath(file).split("/").pop() ||
    "Uploaded document";
}

function isUploadedFile(file) {
  if (typeof file === "string") {
    return file.trim().length > 0;
  }

  if (!file || typeof file !== "object") {
    return false;
  }

  return Boolean(
    getStoragePath(file) ||
    file.fileName ||
    file.originalName ||
    file.url ||
    file.downloadURL
  );
}

function getFileStatus(file) {
  if (!file || typeof file !== "object") {
    return "pending";
  }

  return normalizeStatus(
    file.verificationStatus ||
    file.reviewStatus ||
    file.status ||
    "pending"
  );
}

function createRequirementEntry(uid, key, file, applicant) {
  return {
    id: `${uid}__${key}`,
    uid,
    requirementKey: key,
    requirement: file,
    applicantName: applicant.name,
    applicantId: applicant.applicantId,
    documentName: getRequirementLabel(key, file),
    fileName: getFileName(file),
    storagePath: getStoragePath(file),
    status: getFileStatus(file),
    submittedAt:
      file?.uploadedAt ||
      file?.submittedAt ||
      applicant.application.updatedAt ||
      applicant.application.createdAt ||
      null,
    remarks: file?.adminRemarks || file?.remarks || "",
    history: Array.isArray(file?.verificationHistory)
      ? file.verificationHistory
      : []
  };
}

/* =========================================================
   ADMIN AUTHENTICATION
========================================================= */

onAuthStateChanged(auth, async user => {
  if (!user) {
    window.location.href = "../login.html";
    return;
  }

  try {
    const userSnapshot = await getDoc(
      doc(db, "users", user.uid)
    );

    if (!userSnapshot.exists()) {
      showMessage("Admin account information was not found.", "error");
      await signOut(auth);
      window.location.href = "../login.html";
      return;
    }

    const userData = userSnapshot.data();

    if (String(userData.role || "").toLowerCase() !== "admin") {
      showMessage("Unauthorized access. Admin account required.", "error");
      await signOut(auth);
      window.location.href = "../login.html";
      return;
    }

    state.currentAdmin = {
      uid: user.uid,
      name: userData.fullName ||
        userData.name ||
        user.email ||
        "Administrator",
      email: user.email || ""
    };

    const year = $("#currentYear");

    if (year) {
      year.textContent = new Date().getFullYear();
    }

    setupEventListeners();

    await loadDocuments();
    await updateNotificationBadge();

  } catch (error) {
    console.error("Admin authentication error:", error);
    showMessage("Unable to verify your admin account.", "error");
  }
});

/* =========================================================
   LOAD APPLICANTS
   ONE ROW PER APPLICANT
========================================================= */

async function loadDocuments() {
  const tableBody = $(".verification-table tbody");

  if (tableBody) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" class="loading-cell">
          Loading applicant documents...
        </td>
      </tr>
    `;
  }

  try {
    const [applicationsSnapshot, usersSnapshot] = await Promise.all([
      getDocs(collection(db, "applications")),
      getDocs(collection(db, "users"))
    ]);

    const usersByUid = new Map();

    usersSnapshot.forEach(userSnapshot => {
      usersByUid.set(userSnapshot.id, userSnapshot.data());
    });

    const applicants = [];
    const allDocuments = [];

    applicationsSnapshot.forEach(applicationSnapshot => {
      const uid = applicationSnapshot.id;
      const application = applicationSnapshot.data();
      const user = usersByUid.get(uid) || {};

      const role = String(user.role || "").toLowerCase();

      const applicationStatus = String(
        application.status ||
        application.applicationStatus ||
        ""
      ).toLowerCase();

      /*
       * Exclude confirmed scholars.
       */
      const isConfirmedScholar =
        role === "scholar" ||
        application.scholarConfirmed === true ||
        applicationStatus === "scholar_confirmed";

      if (isConfirmedScholar) return;

      /*
       * Exclude explicitly non-applicant roles.
       */
      if (role && role !== "applicant") return;

      const applicant = {
        uid,
        name: getApplicantName(application, user),
        applicantId: getApplicantId(application),
        application,
        user,
        requirements: []
      };

      const requirements = getRequirementMap(application);

      Object.entries(requirements).forEach(([key, file]) => {
        if (!isUploadedFile(file)) return;

        const requirement = createRequirementEntry(
          uid,
          key,
          file,
          applicant
        );

        applicant.requirements.push(requirement);
        allDocuments.push(requirement);
      });

      /*
       * Show applicants with uploaded requirements only.
       */
      if (applicant.requirements.length > 0) {
        applicants.push(applicant);
      }
    });

    applicants.sort((a, b) => a.name.localeCompare(b.name));

    state.applicants = applicants;
    state.documents = allDocuments;

    populateFilterOptions();
    renderSummary();
    renderDocumentTable();
    resetDocumentDetails();

  } catch (error) {
    console.error("Error loading applicant documents:", error);

    if (tableBody) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" class="error-cell">
            Failed to load applicant documents. Check Firestore permissions.
          </td>
        </tr>
      `;
    }

    showMessage("Failed to load applicant documents.", "error");
  }
}

/* =========================================================
   SUMMARY CARDS
========================================================= */

function renderSummary() {
  const cards = $$(".summary-cards .summary-card");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const verifiedToday = state.documents.filter(item => {
    if (item.status !== "verified") return false;

    const date = getDate(
      item.requirement?.verifiedAt ||
      item.requirement?.updatedAt
    );

    return date && date >= today;
  }).length;

  const pendingToday = state.documents.filter(item => {
    if (item.status !== "pending") return false;

    const date = getDate(item.submittedAt);

    return date && date >= today;
  }).length;

  /*
   * Card order follows the updated HTML:
   * Pending, Verified, Rejected, Resubmission,
   * Verified Today, Pending Today, Scholar Docs, Applicant Docs.
   *
   * Scholar Documents is always zero on this applicant-only page.
   */
  const counts = [
    state.documents.filter(item => item.status === "pending").length,
    state.documents.filter(item => item.status === "verified").length,
    state.documents.filter(item => item.status === "rejected").length,
    state.documents.filter(item => item.status === "resubmit").length,
    verifiedToday,
    pendingToday,
    0,
    state.documents.length
  ];

  cards.forEach((card, index) => {
    const heading = $("h2", card);

    if (heading) {
      heading.textContent = counts[index] ?? 0;
    }
  });
}

/* =========================================================
   FILTER OPTIONS
========================================================= */

function populateFilterOptions() {
  const selects = $$(".toolbar select");

  const applicantSelect = selects[0];
  const documentSelect = selects[1];
  const statusSelect = selects[2];

  if (applicantSelect) {
    const previous = applicantSelect.value;

    applicantSelect.innerHTML = `
      <option value="">All Applicants</option>
      ${[...new Set(state.applicants.map(item => item.name))]
        .sort()
        .map(name => `
          <option value="${escapeHTML(name)}">
            ${escapeHTML(name)}
          </option>
        `).join("")}
    `;

    if ([...applicantSelect.options].some(
      option => option.value === previous
    )) {
      applicantSelect.value = previous;
    }
  }

  if (documentSelect) {
    const previous = documentSelect.value;

    const names = [
      ...new Set(state.documents.map(item => item.documentName))
    ].sort();

    documentSelect.innerHTML = `
      <option value="">All Document Types</option>
      ${names.map(name => `
        <option value="${escapeHTML(name)}">
          ${escapeHTML(name)}
        </option>
      `).join("")}
    `;

    if ([...documentSelect.options].some(
      option => option.value === previous
    )) {
      documentSelect.value = previous;
    }
  }

  if (statusSelect) {
    const previous = statusSelect.value;

    statusSelect.innerHTML = `
      <option value="">All Statuses</option>
      <option value="pending">Pending</option>
      <option value="verified">Verified</option>
      <option value="rejected">Rejected</option>
      <option value="resubmit">Resubmission</option>
    `;

    if ([...statusSelect.options].some(
      option => option.value === previous
    )) {
      statusSelect.value = previous;
    }
  }
}

/* =========================================================
   FILTERED APPLICANTS
========================================================= */

function getFilteredApplicants() {
  const search = (
    $(".toolbar input[type='search']")?.value || ""
  ).trim().toLowerCase();

  const selects = $$(".toolbar select");

  const selectedApplicant = selects[0]?.value || "";
  const selectedDocument = selects[1]?.value || "";
  const selectedStatus = selects[2]?.value || "";

  return state.applicants.map(applicant => {
    const matchingRequirements = applicant.requirements.filter(file => {
      if (
        selectedDocument &&
        file.documentName !== selectedDocument
      ) {
        return false;
      }

      if (
        selectedStatus &&
        file.status !== selectedStatus
      ) {
        return false;
      }

      return true;
    });

    return {
      ...applicant,
      filteredRequirements: matchingRequirements
    };
  }).filter(applicant => {
    if (
      selectedApplicant &&
      applicant.name !== selectedApplicant
    ) {
      return false;
    }

    if (applicant.filteredRequirements.length === 0) {
      return false;
    }

    const searchable = [
      applicant.name,
      applicant.applicantId,
      ...applicant.requirements.map(file => file.documentName),
      ...applicant.requirements.map(file => file.fileName)
    ].join(" ").toLowerCase();

    return !search || searchable.includes(search);
  });
}

/* =========================================================
   RENDER TABLE
   ONE ROW PER APPLICANT
========================================================= */

function renderDocumentTable() {
  const tableBody = $(".verification-table tbody");

  if (!tableBody) return;

  const applicants = getFilteredApplicants();

  if (!applicants.length) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-cell">
          No applicant documents match your search or filters.
        </td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = applicants.map(applicant => {
    const requirements = applicant.filteredRequirements;

    const pending = requirements.filter(
      file => file.status === "pending"
    ).length;

    const verified = requirements.filter(
      file => file.status === "verified"
    ).length;

    const rejected = requirements.filter(
      file => file.status === "rejected"
    ).length;

    const resubmit = requirements.filter(
      file => file.status === "resubmit"
    ).length;

    let overallStatus = "pending";

    if (rejected > 0) {
      overallStatus = "rejected";
    } else if (resubmit > 0) {
      overallStatus = "resubmit";
    } else if (pending === 0 && verified > 0) {
      overallStatus = "verified";
    }

    const latestDate = requirements
      .map(file => getDate(file.submittedAt))
      .filter(Boolean)
      .sort((a, b) => b - a)[0];

    return `
      <tr data-applicant-uid="${escapeHTML(applicant.uid)}">

        <td>
          <strong>${escapeHTML(applicant.applicantId)}</strong>
        </td>

        <td>
          <div class="document-user">
            <strong>${escapeHTML(applicant.name)}</strong>
            <small>Applicant</small>
          </div>
        </td>

        <td>
          <div class="document-name">
            <strong>${requirements.length} requirement(s)</strong>
            <small>
              ${pending} pending · ${verified} verified
              ${rejected ? ` · ${rejected} rejected` : ""}
              ${resubmit ? ` · ${resubmit} for resubmission` : ""}
            </small>
          </div>
        </td>

        <td>${escapeHTML(formatDate(latestDate))}</td>

        <td>
          <span class="status-badge status-${overallStatus}">
            ${escapeHTML(statusLabel(overallStatus))}
          </span>
        </td>

        <td>
          <button type="button"
            class="btn-view"
            data-action="view-applicant"
            data-uid="${escapeHTML(applicant.uid)}">
            View Requirements
          </button>
        </td>

      </tr>
    `;
  }).join("");
}

/* =========================================================
   REQUIREMENT LIST FOR SELECTED APPLICANT
========================================================= */

function renderApplicantRequirements(applicant) {
  state.selectedApplicantUid = applicant.uid;

  const infoTable = $(".document-info-card table");

  if (!infoTable) return;

  infoTable.innerHTML = `
    <tbody>
      <tr>
        <th>Applicant</th>
        <td>${escapeHTML(applicant.name)}</td>
      </tr>

      <tr>
        <th>Applicant ID</th>
        <td>${escapeHTML(applicant.applicantId)}</td>
      </tr>

      <tr>
        <th>Total Requirements</th>
        <td>${applicant.requirements.length}</td>
      </tr>

      <tr>
        <th>Requirements</th>
        <td>
          <div class="applicant-requirements-list">
            ${applicant.requirements.map(file => `
              <div class="requirement-item"
                style="display:flex;justify-content:space-between;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid #e5e7eb">

                <div>
                  <strong>${escapeHTML(file.documentName)}</strong>
                  <br>
                  <small>${escapeHTML(file.fileName)}</small>
                  <br>
                  <span class="status-badge status-${escapeHTML(file.status)}">
                    ${escapeHTML(statusLabel(file.status))}
                  </span>
                </div>

                <button type="button"
                  class="btn-view"
                  data-action="view-requirement"
                  data-id="${escapeHTML(file.id)}">
                  Review
                </button>

              </div>
            `).join("")}
          </div>
        </td>
      </tr>
    </tbody>
  `;
}

/* =========================================================
   SELECT A SINGLE REQUIREMENT
========================================================= */

async function selectDocument(id) {
  const item = state.documents.find(file => file.id === id);

  if (!item) {
    showMessage("Document record not found.", "error");
    return;
  }

  state.selectedDocument = item;
  state.selectedApplicantUid = item.uid;
  state.previewRotation = 0;
  state.previewZoom = 1;

  const applicant = state.applicants.find(
    entry => entry.uid === item.uid
  );

  if (applicant) {
    renderApplicantRequirements(applicant);
  }

  renderDocumentDetails(item);

  await loadDocumentPreview(item);
}

/* =========================================================
   SUPABASE PRIVATE FILE PREVIEW
========================================================= */

async function loadDocumentPreview(item) {
  const preview = $(".document-preview");

  if (!preview) return;

  preview.innerHTML = `
    <p class="preview-message">Loading document preview...</p>
  `;

  try {
    let url = "";

    if (item.storagePath) {
      const { data, error } = await supabase
        .storage
        .from("requirements")
        .createSignedUrl(item.storagePath, 300);

      if (error) throw error;

      url = data?.signedUrl || "";

    } else if (
      item.requirement?.url ||
      item.requirement?.downloadURL
    ) {
      url =
        item.requirement.url ||
        item.requirement.downloadURL;
    }

    if (!url) {
      preview.innerHTML = `
        <p class="preview-message">
          No accessible file path was found for this document.
        </p>
      `;
      return;
    }

    const extension = item.fileName
      .split(".")
      .pop()
      .toLowerCase();

    if (["jpg", "jpeg", "png", "webp", "gif"].includes(extension)) {
      preview.innerHTML = `
        <img class="preview-file"
          src="${escapeHTML(url)}"
          alt="${escapeHTML(item.documentName)}"
          style="max-width:100%;max-height:500px;object-fit:contain;
          transform:rotate(${state.previewRotation}deg) scale(${state.previewZoom})">
      `;

    } else if (extension === "pdf") {
      preview.innerHTML = `
        <iframe class="preview-file preview-pdf"
          src="${escapeHTML(url)}"
          title="${escapeHTML(item.documentName)}"
          style="width:100%;height:500px;border:0">
        </iframe>
      `;

    } else {
      preview.innerHTML = `
        <div class="preview-message">
          <p>Preview is unavailable for this file type.</p>
          <a href="${escapeHTML(url)}"
             target="_blank"
             rel="noopener noreferrer">
            Open document
          </a>
        </div>
      `;
    }

    const downloadButton = $(".preview-tools .btn-download");

    if (downloadButton) {
      downloadButton.dataset.url = url;
      downloadButton.dataset.filename = item.fileName;
    }

  } catch (error) {
    console.error("Document preview error:", error);

    preview.innerHTML = `
      <p class="preview-message">
        Unable to open this file. Check the Supabase Storage path and access policies.
      </p>
    `;
  }
}

/* =========================================================
   DETAILS AND VERIFICATION HISTORY
========================================================= */

function renderDocumentDetails(item) {
  const infoTable = $(".document-info-card table");

  if (infoTable) {
    const applicant = state.applicants.find(
      entry => entry.uid === item.uid
    );

    const requirements = applicant?.requirements || [];

    infoTable.innerHTML = `
      <tbody>
        <tr>
          <th>Applicant</th>
          <td>${escapeHTML(item.applicantName)}</td>
        </tr>

        <tr>
          <th>Applicant ID</th>
          <td>${escapeHTML(item.applicantId)}</td>
        </tr>

        <tr>
          <th>Selected Document</th>
          <td>${escapeHTML(item.documentName)}</td>
        </tr>

        <tr>
          <th>File Name</th>
          <td>${escapeHTML(item.fileName)}</td>
        </tr>

        <tr>
          <th>Uploaded</th>
          <td>${escapeHTML(formatDateTime(item.submittedAt))}</td>
        </tr>

        <tr>
          <th>Document Status</th>
          <td>${escapeHTML(statusLabel(item.status))}</td>
        </tr>

        <tr>
          <th>All Requirements</th>
          <td>
            <div class="applicant-requirements-list">
              ${requirements.map(file => `
                <div class="requirement-item"
                  style="display:flex;justify-content:space-between;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #e5e7eb">

                  <div>
                    <strong>${escapeHTML(file.documentName)}</strong>
                    <br>
                    <small>${escapeHTML(file.fileName)}</small>
                    <br>
                    <span class="status-badge status-${escapeHTML(file.status)}">
                      ${escapeHTML(statusLabel(file.status))}
                    </span>
                  </div>

                  <button type="button"
                    class="btn-view"
                    data-action="view-requirement"
                    data-id="${escapeHTML(file.id)}">
                    Review
                  </button>

                </div>
              `).join("")}
            </div>
          </td>
        </tr>
      </tbody>
    `;
  }

  const decisionSelect = $("#verificationDecision");
  const remarksField = $("#verificationRemarks");

  if (decisionSelect) {
    decisionSelect.value = item.status;
  }

  if (remarksField) {
    remarksField.value = item.remarks || "";
  }

  const historyList = $(".history-card ul");

  if (historyList) {
    const history = [...item.history].sort((a, b) => {
      const dateA = getDate(
        a.createdAt || a.verifiedAt
      )?.getTime() || 0;

      const dateB = getDate(
        b.createdAt || b.verifiedAt
      )?.getTime() || 0;

      return dateB - dateA;
    });

    historyList.innerHTML = history.length
      ? history.map(entry => `
          <li>
            <strong>
              ${escapeHTML(statusLabel(entry.status || entry.action))}
            </strong>

            <p>
              ${escapeHTML(entry.remarks || entry.adminRemarks || "No remarks")}
            </p>

            <small>
              ${escapeHTML(entry.adminName || entry.verifiedByName || "Administrator")}
              · ${escapeHTML(formatDateTime(entry.createdAt || entry.verifiedAt))}
            </small>
          </li>
        `).join("")
      : `
          <li class="empty-history">
            No verification history for this document yet.
          </li>
        `;
  }
}

function resetDocumentDetails() {
  state.selectedDocument = null;
  state.selectedApplicantUid = null;

  const preview = $(".document-preview");

  if (preview) {
    preview.innerHTML = `
      <p class="preview-message">
        Select an applicant and choose a requirement to review.
      </p>
    `;
  }

  const infoTable = $(".document-info-card table");

  if (infoTable) {
    infoTable.innerHTML = `
      <tbody>
        <tr><th>Applicant</th><td>—</td></tr>
        <tr><th>Applicant ID</th><td>—</td></tr>
        <tr><th>Requirements</th><td>—</td></tr>
      </tbody>
    `;
  }

  if ($("#verificationDecision")) {
    $("#verificationDecision").value = "pending";
  }

  if ($("#verificationRemarks")) {
    $("#verificationRemarks").value = "";
  }

  const historyList = $(".history-card ul");

  if (historyList) {
    historyList.innerHTML = `
      <li class="empty-history">
        Select a document to view its history.
      </li>
    `;
  }
}

/* =========================================================
   SAVE VERIFICATION
========================================================= */

async function saveVerification(status) {
  const item = state.selectedDocument;

  if (!item) {
    showMessage("Choose a requirement first.", "error");
    return;
  }

  if (!["verified", "rejected", "resubmit"].includes(status)) {
    showMessage("Invalid verification decision.", "error");
    return;
  }

  const remarks = (
    $("#verificationRemarks")?.value || ""
  ).trim();

  if (
    ["rejected", "resubmit"].includes(status) &&
    !remarks
  ) {
    showMessage(
      "Please enter remarks for rejected or resubmitted documents.",
      "error"
    );

    $("#verificationRemarks")?.focus();
    return;
  }

  const buttons = $$(".verification-buttons button");

  buttons.forEach(button => {
    button.disabled = true;
  });

  try {
    const applicationRef = doc(
      db,
      "applications",
      item.uid
    );

    const applicationSnapshot = await getDoc(applicationRef);

    if (!applicationSnapshot.exists()) {
      throw new Error("The applicant application record was not found.");
    }

    const application = applicationSnapshot.data();

    /*
     * Recheck scholar status before modifying the application.
     */
    const userSnapshot = await getDoc(
      doc(db, "users", item.uid)
    );

    const latestUser = userSnapshot.exists()
      ? userSnapshot.data()
      : {};

    if (
      String(latestUser.role || "").toLowerCase() === "scholar" ||
      application.scholarConfirmed === true ||
      String(application.status || "").toLowerCase() === "scholar_confirmed"
    ) {
      throw new Error("This account is now a confirmed scholar. Refresh the page.");
    }

    const requirements = getRequirementMap(application);
    const currentFile = requirements[item.requirementKey];

    if (!currentFile || typeof currentFile !== "object") {
      throw new Error(
        "The requirement record is missing or has an unsupported format."
      );
    }

    const historyEntry = {
      status,
      remarks,
      adminUid: state.currentAdmin.uid,
      adminName: state.currentAdmin.name,
      createdAt: new Date().toISOString()
    };

    const updatedFile = {
      ...currentFile,
      status,
      verificationStatus: status,
      adminRemarks: remarks,
      verifiedAt: new Date().toISOString(),
      verifiedBy: state.currentAdmin.uid,
      verifiedByName: state.currentAdmin.name,
      verificationHistory: [
        ...(Array.isArray(currentFile.verificationHistory)
          ? currentFile.verificationHistory
          : []),
        historyEntry
      ]
    };

    /*
     * Only the selected requirement is updated.
     */
    await updateDoc(applicationRef, {
      [`files.requirements.${item.requirementKey}`]: updatedFile,
      updatedAt: serverTimestamp()
    });

    try {
      await createApplicantNotification(item, status, remarks);
    } catch (notificationError) {
      console.warn(
        "Verification saved, but notification creation failed:",
        notificationError
      );
    }

    showMessage(
      `${item.documentName}: ${statusLabel(status)}.`,
      "success"
    );

    await loadDocuments();

    const updatedApplicant = state.applicants.find(
      applicant => applicant.uid === item.uid
    );

    if (updatedApplicant) {
      renderApplicantRequirements(updatedApplicant);
    }

    await selectDocument(item.id);
    await updateNotificationBadge();

  } catch (error) {
    console.error("Verification save error:", error);

    showMessage(
      error.message || "Unable to save verification status.",
      "error"
    );

  } finally {
    buttons.forEach(button => {
      button.disabled = false;
    });
  }
}

/* =========================================================
   NOTIFY APPLICANT
========================================================= */

async function createApplicantNotification(item, status, remarks) {
  const content = {
    verified: {
      title: "Document Verified",
      message: `Your ${item.documentName} has been verified.`
    },

    rejected: {
      title: "Document Rejected",
      message: `Your ${item.documentName} was rejected. Please review the administrator's remarks.`
    },

    resubmit: {
      title: "Document Resubmission Required",
      message: `Please resubmit your ${item.documentName} after reviewing the administrator's remarks.`
    }
  }[status];

  await addDoc(collection(db, "notifications"), {
    recipientUid: item.uid,
    userId: item.uid,
    recipientName: item.applicantName,
    recipientType: "applicant",
    category: "document_verification",
    priority: status === "verified" ? "normal" : "high",
    title: content.title,
    message: remarks
      ? `${content.message} Remarks: ${remarks}`
      : content.message,
    read: false,
    important: status !== "verified",
    dashboardNotification: true,
    emailNotification: false,
    createdBy: state.currentAdmin.uid,
    createdByEmail: state.currentAdmin.email,
    createdAt: serverTimestamp()
  });
}

/* =========================================================
   PREVIEW TOOLS
========================================================= */

function updateImageTransform() {
  const image = $(".document-preview img.preview-file");

  if (!image) return;

  image.style.transform =
    `rotate(${state.previewRotation}deg) scale(${state.previewZoom})`;
}

function setupPreviewTools() {
  $(".btn-zoom-in")?.addEventListener("click", () => {
    state.previewZoom = Math.min(state.previewZoom + 0.1, 2.5);
    updateImageTransform();
  });

  $(".btn-zoom-out")?.addEventListener("click", () => {
    state.previewZoom = Math.max(state.previewZoom - 0.1, 0.5);
    updateImageTransform();
  });

  $(".btn-rotate")?.addEventListener("click", () => {
    state.previewRotation = (state.previewRotation + 90) % 360;
    updateImageTransform();
  });

  $(".preview-tools .btn-download")?.addEventListener("click", event => {
    const url = event.currentTarget.dataset.url;

    if (!url) {
      showMessage("Select a document first.", "error");
      return;
    }

    window.open(url, "_blank", "noopener,noreferrer");
  });
}

/* =========================================================
   PAGE EVENT LISTENERS
========================================================= */

function setupEventListeners() {
  const tableBody = $(".verification-table tbody");

  tableBody?.addEventListener("click", async event => {
    const button = event.target.closest("button[data-action]");

    if (!button) return;

    const action = button.dataset.action;

    if (action === "view-applicant") {
      const applicant = state.applicants.find(
        item => item.uid === button.dataset.uid
      );

      if (!applicant) {
        showMessage("Applicant record not found.", "error");
        return;
      }

      renderApplicantRequirements(applicant);

      if (applicant.requirements.length > 0) {
        await selectDocument(applicant.requirements[0].id);
      }

      return;
    }

    if (action === "view-requirement") {
      await selectDocument(button.dataset.id);
      return;
    }

    if (["verify", "reject", "resubmit"].includes(action)) {
      await selectDocument(button.dataset.id);

      if (action === "verify") {
        await saveVerification("verified");
      } else if (action === "reject") {
        await saveVerification("rejected");
      } else {
        await saveVerification("resubmit");
      }
    }
  });

  $$(".toolbar input, .toolbar select").forEach(control => {
    control.addEventListener("input", renderDocumentTable);
    control.addEventListener("change", renderDocumentTable);
  });

  $(".toolbar .btn-export")?.addEventListener(
    "click",
    exportDocuments
  );

  $$(".verification-buttons button").forEach(button => {
    button.addEventListener("click", async () => {
      const label = button.textContent.trim().toLowerCase();

      if (label.includes("verify") || label.includes("approve")) {
        await saveVerification("verified");
      } else if (label.includes("reject")) {
        await saveVerification("rejected");
      } else if (label.includes("resubmit")) {
        await saveVerification("resubmit");
      }
    });
  });

  $(".notification-btn")?.addEventListener("click", () => {
    window.location.href = "notifications.html";
  });

  $("#logoutBtn")?.addEventListener("click", logoutAdmin);

  $$(".logout-btn, [data-action='logout']").forEach(button => {
    button.addEventListener("click", event => {
      event.preventDefault();
      logoutAdmin();
    });
  });

  const sidebarToggle = $(
    "#sidebarToggle, .sidebar-toggle, .menu-toggle"
  );

  sidebarToggle?.addEventListener("click", () => {
    $(".sidebar")?.classList.toggle("active");
  });

  setupPreviewTools();
}

/* =========================================================
   EXPORT APPLICANT DOCUMENTS
========================================================= */

function exportDocuments() {
  const applicants = getFilteredApplicants();

  if (!applicants.length) {
    showMessage("No applicant documents available to export.", "error");
    return;
  }

  const rows = [[
    "Applicant Name",
    "Applicant ID",
    "Document",
    "File Name",
    "Status",
    "Date Uploaded",
    "Admin Remarks"
  ]];

  applicants.forEach(applicant => {
    applicant.filteredRequirements.forEach(file => {
      rows.push([
        applicant.name,
        applicant.applicantId,
        file.documentName,
        file.fileName,
        statusLabel(file.status),
        formatDateTime(file.submittedAt),
        file.remarks
      ]);
    });
  });

  const csv = rows.map(row =>
    row.map(value =>
      `"${String(value ?? "").replace(/"/g, '""')}"`
    ).join(",")
  ).join("\r\n");

  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download =
    `scholarlink-applicant-documents-${new Date().toISOString().slice(0, 10)}.csv`;

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);

  showMessage("Applicant document list exported successfully.", "success");
}

/* =========================================================
   NOTIFICATION BADGE
========================================================= */

async function updateNotificationBadge() {
  const badge = $(".notification-btn .badge");

  if (!badge || !state.currentAdmin) return;

  try {
    const snapshot = await getDocs(collection(db, "notifications"));

    const unreadCount = snapshot.docs.filter(notification => {
      const data = notification.data();

      return (
        (data.recipientUid === state.currentAdmin.uid ||
          data.userId === state.currentAdmin.uid) &&
        data.read !== true
      );
    }).length;

    badge.textContent = unreadCount;
    badge.hidden = unreadCount === 0;

  } catch (error) {
    console.warn("Could not load notification badge:", error);
    badge.hidden = true;
  }
}

/* =========================================================
   LOGOUT
========================================================= */

async function logoutAdmin() {
  try {
    await signOut(auth);
    window.location.href = "../login.html";
  } catch (error) {
    console.error("Logout error:", error);
    showMessage("Unable to log out. Please try again.", "error");
  }
}

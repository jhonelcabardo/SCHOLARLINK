
/* =========================================================
   SCHOLARLINK — MONITORING SCHOLARS
   Firebase Auth + Firestore
   SDK VERSION: 10.7.1
========================================================= */

import { auth, db } from "../firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
    collection,
    getDocs,
    getDoc,
    doc,
    updateDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";


/* =========================================================
   STATE
========================================================= */

let scholars = [];
let users = [];
let applications = [];
let notifications = [];
let monitoringRecords = [];
let selectedScholar = null;


/* =========================================================
   HELPERS
========================================================= */

const $ = id => document.getElementById(id);

function normalize(value) {
    return String(value ?? "").trim().toLowerCase();
}

function setText(id, value) {
    const element = $(id);
    if (element) element.textContent = value ?? "—";
}

function firstValue(...values) {
    return values.find(value =>
        value !== undefined &&
        value !== null &&
        String(value).trim() !== ""
    );
}

function asObject(value) {
    return value && typeof value === "object" && !Array.isArray(value)
        ? value
        : {};
}

function getName(data) {
    data = asObject(data);

    const personal = asObject(
        data.personalInformation ||
        data.personal_info ||
        data.personal
    );

    const firstName = firstValue(
        data.firstName,
        data.first_name,
        personal.firstName,
        personal.first_name
    );

    const middleName = firstValue(
        data.middleName,
        data.middle_name,
        personal.middleName,
        personal.middle_name
    );

    const lastName = firstValue(
        data.lastName,
        data.last_name,
        personal.lastName,
        personal.last_name
    );

    const suffix = firstValue(
        data.suffix,
        personal.suffix
    );

    const combinedName = [
        firstName,
        middleName,
        lastName,
        suffix
    ].filter(Boolean).join(" ");

    return firstValue(
        data.fullName,
        data.fullname,
        data.displayName,
        data.name,
        personal.fullName,
        personal.fullname,
        combinedName
    ) || "Unnamed Scholar";
}

function toDate(value) {
    if (!value) return null;

    if (typeof value.toDate === "function") {
        return value.toDate();
    }

    if (typeof value.seconds === "number") {
        return new Date(value.seconds * 1000);
    }

    const date = new Date(value);

    return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(value) {
    const date = toDate(value);

    return date
        ? date.toLocaleDateString("en-PH", {
            year: "numeric",
            month: "short",
            day: "numeric"
        })
        : "—";
}

function getStatus(...sources) {
    for (const sourceValue of sources) {
        const source = asObject(sourceValue);

        const status = firstValue(
            source.status,
            source.scholarStatus,
            source.scholar_status,
            source.applicationStatus
        );

        if (status) return normalize(status);
    }

    return "not set";
}

function getSchool(scholar, user, application) {
    scholar = asObject(scholar);
    user = asObject(user);
    application = asObject(application);

    return firstValue(
        scholar.schoolName,
        scholar.school,
        scholar.school_name,
        user.schoolName,
        user.school,
        application.schoolName,
        application.school,
        asObject(application.educationalInformation).schoolName,
        asObject(application.education).schoolName
    ) || "—";
}

function getCourse(scholar, user, application) {
    scholar = asObject(scholar);
    user = asObject(user);
    application = asObject(application);

    return firstValue(
        scholar.course,
        scholar.courseName,
        scholar.program,
        user.course,
        user.courseName,
        user.program,
        application.course,
        application.courseName,
        application.program,
        asObject(application.educationalInformation).course
    ) || "—";
}

function getYearLevel(scholar, user, application) {
    scholar = asObject(scholar);
    user = asObject(user);
    application = asObject(application);

    return firstValue(
        scholar.yearLevel,
        scholar.year_level,
        scholar.year,
        user.yearLevel,
        user.year_level,
        application.yearLevel,
        application.year_level,
        asObject(application.educationalInformation).yearLevel
    ) || "—";
}

function getGPA(scholar, user, application) {
    scholar = asObject(scholar);
    user = asObject(user);
    application = asObject(application);

    return firstValue(
        scholar.gpa,
        scholar.GPA,
        scholar.gwa,
        user.gpa,
        user.GPA,
        user.gwa,
        application.gpa,
        application.GPA,
        application.gwa,
        asObject(application.educationalInformation).gpa
    ) ?? null;
}

function getDocumentStatus(scholar, application, key) {
    scholar = asObject(scholar);
    application = asObject(application);

    const scholarDocs = asObject(
        asObject(scholar.files).scholarDocuments ||
        scholar.scholarDocuments ||
        scholar.documents
    );

    const applicationDocs = asObject(
        asObject(application.files).scholarDocuments ||
        application.scholarDocuments ||
        application.documents
    );

    const aliases = key === "grades"
        ? ["grades", "grade", "gradesStatus", "gradeStatus"]
        : ["cor", "COR", "corStatus", "certificateOfRegistration"];

    for (const source of [
        scholar, scholarDocs, application, applicationDocs
    ]) {
        for (const alias of aliases) {
            const value = source[alias];

            if (value === undefined || value === null || value === "") {
                continue;
            }

            if (typeof value === "object") {
                const objectValue = asObject(value);

                return firstValue(
                    objectValue.status,
                    objectValue.verificationStatus,
                    objectValue.state
                ) || (
                    objectValue.url || objectValue.downloadURL
                        ? "submitted"
                        : "pending"
                );
            }

            return String(value);
        }
    }

    return "No Data";
}


/* =========================================================
   BUILD RECORD
========================================================= */

function buildRecord(scholarValue, userValue, applicationValue) {
    const scholar = asObject(scholarValue);
    const user = asObject(userValue);
    const application = asObject(applicationValue);

    const uid = firstValue(
        scholar.uid,
        user.uid,
        application.uid
    ) || "";

    const scholarName = getName(scholar);
    const userName = getName(user);
    const applicationName = getName(application);

    const name =
        scholarName !== "Unnamed Scholar"
            ? scholarName
            : userName !== "Unnamed Scholar"
                ? userName
                : applicationName;

    return {
        uid,

        scholarId: firstValue(
            scholar.scholarId,
            scholar.scholar_id,
            scholar.studentId,
            scholar.idNumber,
            uid
        ) || "—",

        name,
        school: getSchool(scholar, user, application),
        course: getCourse(scholar, user, application),
        yearLevel: getYearLevel(scholar, user, application),
        gpa: getGPA(scholar, user, application),
        status: getStatus(scholar, user, application),
        grades: getDocumentStatus(scholar, application, "grades"),
        cor: getDocumentStatus(scholar, application, "cor"),

        scholarship: firstValue(
            scholar.scholarshipProgram,
            scholar.scholarship,
            application.scholarshipProgram,
            application.scholarship
        ) || "—",

        image: firstValue(
            scholar.photoURL,
            scholar.photoUrl,
            scholar.profilePicture,
            user.photoURL,
            user.photoUrl,
            user.profilePicture
        ) || "",

        dateApproved: firstValue(
            scholar.confirmedAt,
            scholar.dateApproved,
            application.confirmedAt,
            application.dateApproved
        ) || null,

        rawScholar: scholar,
        rawUser: user,
        rawApplication: application
    };
}


/* =========================================================
   SAFE COLLECTION READER
   Document ID is kept as the authoritative UID.
========================================================= */

async function readCollection(collectionName) {
    const snapshot = await getDocs(
        collection(db, collectionName)
    );

    return snapshot.docs.map(item => {
        const data = asObject(item.data());

        return {
            ...data,
            uid: item.id
        };
    });
}


/* =========================================================
   ERROR DISPLAY
========================================================= */

function escapeHTML(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function showError(message) {
    console.error("[ScholarLink Monitoring]", message);

    const tbody = $("scholarTableBody");

    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="10" style="text-align:center;padding:24px;">
                    ${escapeHTML(message)}
                </td>
            </tr>
        `;
    }
}


/* =========================================================
   AUTHENTICATION
========================================================= */

onAuthStateChanged(auth, async user => {
    if (!user) {
        window.location.href = "../login.html";
        return;
    }

    try {
        console.log("Monitoring: signed in", user.uid);

        const adminSnapshot = await getDoc(
            doc(db, "users", user.uid)
        );

        if (!adminSnapshot.exists()) {
            showError(
                "Admin profile not found in users/{uid}. Check the signed-in account."
            );
            return;
        }

        const adminData = asObject(adminSnapshot.data());

        if (normalize(adminData.role) !== "admin") {
            showError("Administrator access required.");
            return;
        }

        setText(
            "adminName",
            getName(adminData) !== "Unnamed Scholar"
                ? getName(adminData)
                : user.email || "Administrator"
        );

        await loadMonitoringData();

    } catch (error) {
        console.error("Authentication / Firestore error:", error);

        showError(
            `Unable to load monitoring data: ${error.message || error}`
        );
    }
});


/* =========================================================
   LOAD FIRESTORE DATA
========================================================= */

async function loadMonitoringData() {
    try {
        scholars = await readCollection("scholars");
        console.log("Firestore scholars:", scholars.length, scholars);

        users = await readCollection("users");
        console.log("Firestore users:", users.length);

        applications = await readCollection("applications");
        console.log("Firestore applications:", applications.length);

        try {
            notifications = await readCollection("notifications");
            console.log("Firestore notifications:", notifications.length);
        } catch (error) {
            console.warn("Notifications unavailable:", error.message);
            notifications = [];
        }

        const usersByUid = new Map(
            users.map(item => [item.uid, item])
        );

        const applicationsByUid = new Map(
            applications.map(item => [item.uid, item])
        );

        const recordsByUid = new Map();

        // Every scholars document becomes a monitoring record.
        for (const scholar of scholars) {
            if (!scholar || !scholar.uid) continue;

            const user = usersByUid.get(scholar.uid) || null;
            const application =
                applicationsByUid.get(scholar.uid) || null;

            recordsByUid.set(
                scholar.uid,
                buildRecord(scholar, user, application)
            );
        }

        /*
          Include users clearly identified as scholars when they
          do not already have a corresponding scholars document.
        */

        for (const user of users) {
            if (!user || !user.uid) continue;

            const role = normalize(user.role);
            const status = getStatus(user);

            const isScholar =
                role === "scholar" ||
                role === "scholars" ||
                user.isScholar === true ||
                user.scholar === true ||
                [
                    "active",
                    "suspended",
                    "graduated",
                    "at risk",
                    "at-risk"
                ].includes(status);

            if (!isScholar || recordsByUid.has(user.uid)) continue;

            const application =
                applicationsByUid.get(user.uid) || null;

            recordsByUid.set(
                user.uid,
                buildRecord(user, user, application)
            );
        }

        monitoringRecords = [...recordsByUid.values()];

        window.scholarMonitoringData = monitoringRecords;

        console.log(
            "Final monitoring records:",
            monitoringRecords.length,
            monitoringRecords
        );

        updateDashboardCards();
        populateFilters();
        renderTable(monitoringRecords);
        renderNotifications();

    } catch (error) {
        console.error("Firestore load failed:", error);

        showError(
            `Could not read Firestore data: ${error.message || error}`
        );
    }
}


/* =========================================================
   DASHBOARD CARDS
========================================================= */

function isActive(record) {
    return ["active", "ongoing", "approved"].includes(record.status);
}

function isSuspended(record) {
    return record.status.includes("suspend");
}

function isGraduated(record) {
    return record.status.includes("graduat");
}

function isAtRisk(record) {
    return record.status.includes("risk") ||
        record.status.includes("probation");
}

function updateDashboardCards() {
    const total = monitoringRecords.length;

    const active = monitoringRecords.filter(isActive).length;

    const pendingRequirements = monitoringRecords.filter(record => {
        const grades = normalize(record.grades);
        const cor = normalize(record.cor);

        return [
            "pending",
            "missing",
            "incomplete",
            "not submitted"
        ].some(term => grades.includes(term) || cor.includes(term));
    }).length;

    const atRisk = monitoringRecords.filter(isAtRisk).length;
    const suspended = monitoringRecords.filter(isSuspended).length;
    const graduated = monitoringRecords.filter(isGraduated).length;

    const gpas = monitoringRecords
        .map(record => Number(record.gpa))
        .filter(value => Number.isFinite(value) && value > 0);

    const averageGPA = gpas.length
        ? (
            gpas.reduce((sum, value) => sum + value, 0) /
            gpas.length
        ).toFixed(2)
        : "—";

    const completed = monitoringRecords.filter(record =>
        ["verified", "approved", "complete", "completed"]
            .includes(normalize(record.grades)) &&
        ["verified", "approved", "complete", "completed"]
            .includes(normalize(record.cor))
    ).length;

    setText("totalScholars", total);
    setText("activeScholars", active);
    setText("pendingRequirements", pendingRequirements);
    setText("atRiskScholars", atRisk);
    setText("suspendedScholars", suspended);
    setText("graduatedScholars", graduated);
    setText("averageGPA", averageGPA);
    setText(
        "requirementsCompleted",
        total ? `${completed}/${total}` : "—"
    );
    setText(
        "scholarCount",
        `${total} scholar${total === 1 ? "" : "s"}`
    );
}


/* =========================================================
   FILTERS
========================================================= */

function populateFilters() {
    populateSelect("schoolFilter", "school");
    populateSelect("courseFilter", "course");
}

function populateSelect(id, property) {
    const select = $(id);
    if (!select) return;

    const currentValue = select.value;

    const values = [...new Set(
        monitoringRecords
            .map(record => record[property])
            .filter(value => value && value !== "—")
    )].sort();

    select.innerHTML = "";

    const optionLabel = property === "school"
        ? "All Schools"
        : "All Courses";

    const allOption = document.createElement("option");
    allOption.value = "";
    allOption.textContent = optionLabel;
    select.appendChild(allOption);

    for (const value of values) {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = value;
        select.appendChild(option);
    }

    if (values.includes(currentValue)) {
        select.value = currentValue;
    }
}

function applyFilters() {
    const search = normalize($("scholarSearch")?.value);
    const status = normalize($("statusFilter")?.value);
    const school = $("schoolFilter")?.value || "";
    const course = $("courseFilter")?.value || "";

    const filtered = monitoringRecords.filter(record => {
        const matchesSearch = !search || [
            record.name,
            record.scholarId,
            record.school,
            record.course,
            record.scholarship
        ].some(value => normalize(value).includes(search));

        const matchesStatus = !status || record.status === status;
        const matchesSchool = !school || record.school === school;
        const matchesCourse = !course || record.course === course;

        return matchesSearch &&
            matchesStatus &&
            matchesSchool &&
            matchesCourse;
    });

    renderTable(filtered);
}


/* =========================================================
   SCHOLAR TABLE
========================================================= */

function renderTable(records) {
    const tbody = $("scholarTableBody");
    if (!tbody) return;

    if (!records.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="10" style="text-align:center;padding:24px;">
                    No scholar records found.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = records.map(record => {
        const statusClass = normalize(record.status)
            .replace(/[^a-z0-9]+/g, "-");

        return `
            <tr>
                <td>${escapeHTML(record.scholarId)}</td>
                <td>${escapeHTML(record.name)}</td>
                <td>${escapeHTML(record.school)}</td>
                <td>${escapeHTML(record.course)}</td>
                <td>${escapeHTML(record.yearLevel)}</td>
                <td>${escapeHTML(record.gpa ?? "—")}</td>
                <td>
                    <span class="status-badge ${escapeHTML(statusClass)}">
                        ${escapeHTML(record.status)}
                    </span>
                </td>
                <td>${escapeHTML(record.grades)}</td>
                <td>${escapeHTML(record.cor)}</td>
                <td>
                    <button
                        type="button"
                        class="view-scholar-btn"
                        data-uid="${escapeHTML(record.uid)}">
                        View
                    </button>
                </td>
            </tr>
        `;
    }).join("");

    tbody.querySelectorAll(".view-scholar-btn").forEach(button => {
        button.addEventListener("click", () => {
            const record = monitoringRecords.find(
                item => item.uid === button.dataset.uid
            );

            if (record) showScholarDetails(record);
        });
    });
}


/* =========================================================
   SCHOLAR DETAILS
========================================================= */

function showScholarDetails(record) {
    selectedScholar = record;

    const details = $("scholar-details");

    if (details) {
        details.style.display = "block";
    }

    setText("detailName", record.name);
    setText("detailScholarId", record.scholarId);
    setText("detailSchool", record.school);
    setText("detailCourse", record.course);
    setText("detailYear", record.yearLevel);
    setText("detailScholarship", record.scholarship);
    setText("detailStatus", record.status);
    setText("detailDateApproved", formatDate(record.dateApproved));
    setText("detailRenewal", record.rawScholar?.renewalStatus || "—");
    setText("detailGPA", record.gpa ?? "—");
    setText("detailGrades", record.grades);
    setText("detailCOR", record.cor);

    const photo = $("detailPhoto");

    if (photo) {
        photo.onerror = () => {
            photo.removeAttribute("src");
            photo.style.display = "none";
        };

        if (record.image) {
            photo.src = record.image;
            photo.style.display = "";
        } else {
            photo.removeAttribute("src");
            photo.style.display = "none";
        }
    }

    const remarks = $("remarksTextarea");

    if (remarks) {
        remarks.value =
            record.rawScholar?.remarks ||
            record.rawUser?.remarks ||
            "";
    }

    details?.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}


/* =========================================================
   SAVE REMARKS
========================================================= */

async function saveRemarks() {
    if (!selectedScholar) {
        alert("Select a scholar first.");
        return;
    }

    const remarks = $("remarksTextarea")?.value?.trim() || "";

    try {
        await updateDoc(
            doc(db, "scholars", selectedScholar.uid),
            {
                remarks,
                updatedAt: serverTimestamp()
            }
        );

        selectedScholar.rawScholar.remarks = remarks;

        alert("Remarks saved successfully.");

    } catch (error) {
        console.error("Save remarks failed:", error);
        alert(`Could not save remarks: ${error.message}`);
    }
}


/* =========================================================
   EXPORT CSV
========================================================= */

function exportCSV() {
    const rows = [
        [
            "Scholar ID",
            "Name",
            "School",
            "Course",
            "Year Level",
            "GPA",
            "Status",
            "Grades",
            "COR"
        ],
        ...monitoringRecords.map(record => [
            record.scholarId,
            record.name,
            record.school,
            record.course,
            record.yearLevel,
            record.gpa ?? "",
            record.status,
            record.grades,
            record.cor
        ])
    ];

    const csv = rows.map(row =>
        row.map(value =>
            `"${String(value ?? "").replaceAll('"', '""')}"`
        ).join(",")
    ).join("\r\n");

    const blob = new Blob(
        ["\uFEFF" + csv],
        { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "scholar-monitoring.csv";
    link.click();

    URL.revokeObjectURL(url);
}


/* =========================================================
   NOTIFICATIONS
========================================================= */

function renderNotifications() {
    const list = $("notificationsList");
    if (!list) return;

    if (!notifications.length) {
        list.innerHTML = "<p>No notifications available.</p>";
        return;
    }

    list.innerHTML = notifications.slice(0, 10).map(item => `
        <div class="notification-item">
            <strong>${escapeHTML(
                firstValue(item.title, item.subject, "Notification")
            )}</strong>
            <p>${escapeHTML(
                firstValue(item.message, item.body, item.description, "")
            )}</p>
            <small>${escapeHTML(formatDate(item.createdAt))}</small>
        </div>
    `).join("");
}


/* =========================================================
   UI EVENTS
========================================================= */

function setupEvents() {
    $("menuToggle")?.addEventListener("click", () => {
        document.querySelector(".sidebar")?.classList.toggle("show");
    });

    $("scholarSearch")?.addEventListener("input", applyFilters);
    $("statusFilter")?.addEventListener("change", applyFilters);
    $("schoolFilter")?.addEventListener("change", applyFilters);
    $("courseFilter")?.addEventListener("change", applyFilters);

    $("exportButton")?.addEventListener("click", exportCSV);
    $("saveRemarksButton")?.addEventListener("click", saveRemarks);

    $("notificationButton")?.addEventListener("click", () => {
        $("notificationsList")?.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });
    });

    $("quickSuspend")?.addEventListener("click", async () => {
        if (!selectedScholar) {
            alert("Select a scholar first.");
            return;
        }

        if (!confirm(`Suspend ${selectedScholar.name}?`)) return;

        try {
            await updateDoc(
                doc(db, "scholars", selectedScholar.uid),
                {
                    status: "suspended",
                    updatedAt: serverTimestamp()
                }
            );

            alert("Scholar status updated.");
            await loadMonitoringData();

        } catch (error) {
            console.error("Suspend failed:", error);
            alert(`Unable to update status: ${error.message}`);
        }
    });

    $("quickRenew")?.addEventListener("click", () => {
        alert("Please use the scholarship renewal workflow to renew this scholar.");
    });

    $("quickNotify")?.addEventListener("click", () => {
        alert("Use the Notifications page to send an official notification.");
    });

    $("quickAnnouncement")?.addEventListener("click", () => {
        window.location.href = "announcements.html";
    });

    $("quickEdit")?.addEventListener("click", () => {
        alert("Edit this scholar from the official scholar management page.");
    });
}

setupEvents();

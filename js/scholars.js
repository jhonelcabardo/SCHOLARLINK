/*=========================================
  SCHOLARLINK
  ADMIN SCHOLARS
  FIRESTORE VERSION
=========================================*/

import { auth, db } from "../firebase.js";

import {
    collection,
    getDocs,
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";


/*=========================================
  GLOBAL DATA
=========================================*/

let scholars = [];


/*=========================================
  DOM READY
=========================================*/

document.addEventListener("DOMContentLoaded", function () {

    console.log("Scholar Management Ready");

    setupMobileSidebar();
    setupNotifications();
    setupLogout();

});


/*=========================================
  AUTHENTICATION
=========================================*/

onAuthStateChanged(auth, async function (user) {

    if (!user) {

        console.warn("No authenticated user.");

        window.location.href = "../index.html";

        return;
    }

    try {

        /*==============================
          CHECK ADMIN ACCOUNT
        ==============================*/

        const userRef = doc(db, "users", user.uid);

        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {

            alert("User account information was not found.");

            await signOut(auth);

            window.location.href = "../index.html";

            return;
        }

        const userData = userSnap.data();

        if (userData.role !== "admin") {

            alert("Unauthorized access.");

            await signOut(auth);

            window.location.href = "../index.html";

            return;
        }

        console.log("Admin authenticated.");

        /*==============================
          LOAD SCHOLARS
        ==============================*/

        await loadScholars();

    } catch (error) {

        console.error("Authentication error:", error);

        showTableMessage(
            "Unable to verify your account. Please try again.",
            true
        );

    }

});


/*=========================================
  LOAD SCHOLARS FROM FIRESTORE
=========================================*/

async function loadScholars() {

    const tableBody = document.getElementById("scholarsTableBody");

    if (tableBody) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="loading-row">
                    <i class="fas fa-spinner fa-spin"></i>
                    Loading scholars...
                </td>
            </tr>
        `;

    }

    try {

        console.log("Loading scholars from Firestore...");

        const scholarsRef = collection(db, "scholars");

        const snapshot = await getDocs(scholarsRef);

        scholars = [];

        snapshot.forEach(function (docSnapshot) {

            const data = docSnapshot.data();

            scholars.push({

                uid: docSnapshot.id,

                ...data

            });

        });

        console.log("Scholars loaded:", scholars);

        renderScholars(scholars);

        updateStatistics(scholars);

        setupSearchAndFilter();

    } catch (error) {

        console.error("Error loading scholars:", error);

        showTableMessage(
            "Failed to load scholars from the database.",
            true
        );

    }

}


/*=========================================
  RENDER SCHOLARS
=========================================*/

function renderScholars(data) {

    const tableBody = document.getElementById("scholarsTableBody");

    if (!tableBody) {

        console.error(
            "Element #scholarsTableBody was not found."
        );

        return;
    }

    tableBody.innerHTML = "";

    if (!data || data.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-row">

                    <div class="empty-state">

                        <i class="fas fa-user-graduate"></i>

                        <h3>No Approved Scholars</h3>

                        <p>
                            Scholars who are confirmed by the administrator
                            will automatically appear here.
                        </p>

                    </div>

                </td>
            </tr>
        `;

        return;
    }


    data.forEach(function (scholar) {

        /*==============================
          SCHOLAR INFORMATION
        ==============================*/

const scholarId =
    scholar.scholarId ||
    scholar.scholarID ||
    "Not Assigned";

        const fullName =
            scholar.fullName ||
            buildFullName(
                scholar.personalInformation ||
                scholar.personalInfo ||
                scholar
            );

        const school =
            scholar.schoolName ||
            scholar.school ||
            scholar.academicInformation?.schoolName ||
            scholar.educationalInformation?.schoolName ||
            "---";

        const course =
            scholar.course ||
            scholar.program ||
            scholar.academicInformation?.course ||
            scholar.academicInformation?.program ||
            scholar.educationalInformation?.course ||
            "---";

        const yearLevel =
            scholar.yearLevel ||
            scholar.year ||
            scholar.academicInformation?.yearLevel ||
            scholar.educationalInformation?.yearLevel ||
            "---";

        const status =
            scholar.status ||
            scholar.scholarStatus ||
            "Active";


        /*==============================
          STATUS CLASS
        ==============================*/

        const statusClass = getStatusClass(status);


        /*==============================
          TABLE ROW
        ==============================*/

        const row = document.createElement("tr");

        row.dataset.status = String(status).toLowerCase();

        row.innerHTML = `

            <td>
                ${escapeHTML(scholarId)}
            </td>

            <td>
                ${escapeHTML(fullName)}
            </td>

            <td>
                ${escapeHTML(school)}
            </td>

            <td>
                ${escapeHTML(course)}
            </td>

            <td>
                ${escapeHTML(yearLevel)}
            </td>

            <td>

                <span class="${statusClass}">
                    ${escapeHTML(formatStatus(status))}
                </span>

            </td>

            <td>

                <div class="action-buttons">

                    <a
                        href="scholar-profile.html?id=${encodeURIComponent(scholar.uid)}"
                        class="btn-view"
                        title="View Profile"
                    >
                        <i class="fas fa-eye"></i>
                    </a>


                    <a
                        href="grade-cor-verification.html?id=${encodeURIComponent(scholar.uid)}"
                        class="btn-grade"
                        title="Grades"
                    >
                        <i class="fas fa-graduation-cap"></i>
                    </a>


                    <a
                        href="grade-cor-verification.html?id=${encodeURIComponent(scholar.uid)}"
                        class="btn-cor"
                        title="Certificate of Registration"
                    >
                        <i class="fas fa-file-lines"></i>
                    </a>


                    <a
                        href="qr-management.html?id=${encodeURIComponent(scholar.uid)}"
                        class="btn-qr"
                        title="QR Code"
                    >
                        <i class="fas fa-qrcode"></i>
                    </a>


                    <a
                        href="monitoring-scholars.html?id=${encodeURIComponent(scholar.uid)}"
                        class="btn-monitor"
                        title="Monitor Scholar"
                    >
                        <i class="fas fa-chart-line"></i>
                    </a>

                </div>

            </td>

        `;

        tableBody.appendChild(row);

    });


    setupActionButtons();

}


/*=========================================
  BUILD FULL NAME
=========================================*/

function buildFullName(data) {

    if (!data) {

        return "---";

    }


    if (data.fullName) {

        return data.fullName;

    }


    const firstName =
        data.firstName ||
        data.first_name ||
        "";

    const middleName =
        data.middleName ||
        data.middle_name ||
        "";

    const lastName =
        data.lastName ||
        data.last_name ||
        "";

    const suffix =
        data.suffix ||
        "";


    const parts = [
        firstName,
        middleName,
        lastName,
        suffix
    ].filter(Boolean);


    if (parts.length > 0) {

        return parts.join(" ");

    }


    return "---";

}


/*=========================================
  STATUS CLASS
=========================================*/

function getStatusClass(status) {

    const normalized =
        String(status)
            .toLowerCase()
            .replace(/\s+/g, "_");


    switch (normalized) {

        case "active":
        case "approved":
        case "scholar":
        case "scholar_confirmed":

            return "active-status";


        case "at_risk":
        case "atrisk":

            return "risk-status";


        case "graduated":
        case "graduate":

            return "graduate-status";


        case "suspended":
        case "inactive":

            return "suspended-status";


        default:

            return "active-status";

    }

}


/*=========================================
  FORMAT STATUS
=========================================*/

function formatStatus(status) {

    if (!status) {

        return "Active";

    }


    return String(status)
        .replace(/_/g, " ")
        .replace(/\b\w/g, function (letter) {

            return letter.toUpperCase();

        });

}


/*=========================================
  SEARCH + FILTER
=========================================*/

function setupSearchAndFilter() {

    const searchInput =
        document.querySelector(".search-box input");

    const filter =
        document.querySelector(".search-section select");


    if (searchInput) {

        searchInput.addEventListener("input", applyFilters);

    }


    if (filter) {

        filter.addEventListener("change", applyFilters);

    }

}


/*=========================================
  APPLY SEARCH + STATUS FILTER
=========================================*/

function applyFilters() {

    const searchInput =
        document.querySelector(".search-box input");

    const filter =
        document.querySelector(".search-section select");


    const keyword =
        searchInput
            ? searchInput.value.toLowerCase().trim()
            : "";


    const selectedStatus =
        filter
            ? filter.value.toLowerCase().trim()
            : "all status";


    const rows =
        document.querySelectorAll("#scholarsTableBody tr");


    let visibleCount = 0;


    rows.forEach(function (row) {

        if (
            row.classList.contains("empty-row")
            ||
            row.querySelector(".empty-state")
        ) {

            return;

        }


        const rowText =
            row.innerText.toLowerCase();


        const rowStatus =
            row.dataset.status || "";


        const matchesSearch =
            rowText.includes(keyword);


        let matchesStatus = true;


        if (selectedStatus !== "all status") {

            matchesStatus =
                rowStatus === selectedStatus;

        }


        if (matchesSearch && matchesStatus) {

            row.style.display = "";

            visibleCount++;

        } else {

            row.style.display = "none";

        }

    });


    showNoResultsMessage(visibleCount);

}


/*=========================================
  NO SEARCH RESULTS
=========================================*/

function showNoResultsMessage(count) {

    const tableBody =
        document.getElementById("scholarsTableBody");


    if (!tableBody) {

        return;

    }


    let noResults =
        document.getElementById("noSearchResults");


    if (count === 0 && scholars.length > 0) {

        if (!noResults) {

            noResults = document.createElement("tr");

            noResults.id = "noSearchResults";

            noResults.innerHTML = `
                <td colspan="7" class="empty-row">

                    <div class="empty-state">

                        <i class="fas fa-search"></i>

                        <h3>No Scholars Found</h3>

                        <p>
                            No scholar matches your search or selected status.
                        </p>

                    </div>

                </td>
            `;

            tableBody.appendChild(noResults);

        }

    } else {

        if (noResults) {

            noResults.remove();

        }

    }

}


/*=========================================
  UPDATE STATISTICS
=========================================*/

function updateStatistics(data) {

    const total =
        data.length;


    let active = 0;
    let atRisk = 0;
    let suspended = 0;
    let graduated = 0;


    data.forEach(function (scholar) {

        const status =
            String(
                scholar.status ||
                scholar.scholarStatus ||
                "active"
            )
            .toLowerCase()
            .replace(/\s+/g, "_");


        if (
            status === "active" ||
            status === "approved" ||
            status === "scholar" ||
            status === "scholar_confirmed"
        ) {

            active++;

        }


        if (
            status === "at_risk" ||
            status === "atrisk"
        ) {

            atRisk++;

        }


        if (
            status === "suspended" ||
            status === "inactive"
        ) {

            suspended++;

        }


        if (
            status === "graduated" ||
            status === "graduate"
        ) {

            graduated++;

        }

    });


    /*==============================
      SUMMARY CARDS
    ==============================*/

    setText("totalScholars", total);

    setText("activeScholars", active);

    setText("atRiskScholars", atRisk);

    setText("suspendedScholars", suspended);


    /*==============================
      STATISTICS PANEL
    ==============================*/

    setText("statsTotal", total);

    setText("statsActive", active);

    setText("statsAtRisk", atRisk);

    setText("statsSuspended", suspended);

    setText("statsGraduated", graduated);

}


/*=========================================
  SET TEXT HELPER
=========================================*/

function setText(id, value) {

    const element =
        document.getElementById(id);


    if (element) {

        element.textContent = value;

    }

}


/*=========================================
  FALLBACK SCHOLAR ID
=========================================*/




/*=========================================
  ESCAPE HTML
=========================================*/

function escapeHTML(value) {

    if (value === null || value === undefined) {

        return "";

    }


    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/*=========================================
  ACTION BUTTONS
=========================================*/

function setupActionButtons() {

    document
        .querySelectorAll(".btn-view")
        .forEach(function (button) {

            button.addEventListener("click", function (e) {

                e.preventDefault();

                window.location.href =
                    button.getAttribute("href");

            });

        });


    document
        .querySelectorAll(".btn-grade")
        .forEach(function (button) {

            button.addEventListener("click", function (e) {

                e.preventDefault();

                window.location.href =
                    button.getAttribute("href");

            });

        });


    document
        .querySelectorAll(".btn-cor")
        .forEach(function (button) {

            button.addEventListener("click", function (e) {

                e.preventDefault();

                window.location.href =
                    button.getAttribute("href");

            });

        });


    document
        .querySelectorAll(".btn-qr")
        .forEach(function (button) {

            button.addEventListener("click", function (e) {

                e.preventDefault();

                window.location.href =
                    button.getAttribute("href");

            });

        });


    document
        .querySelectorAll(".btn-monitor")
        .forEach(function (button) {

            button.addEventListener("click", function (e) {

                e.preventDefault();

                window.location.href =
                    button.getAttribute("href");

            });

        });

}


/*=========================================
  MOBILE SIDEBAR
=========================================*/

function setupMobileSidebar() {

    const menuToggle =
        document.getElementById("menuToggle");

    const sidebar =
        document.querySelector(".sidebar");


    if (menuToggle && sidebar) {

        menuToggle.addEventListener("click", function () {

            sidebar.classList.toggle("show");

        });

    }

}


/*=========================================
  NOTIFICATIONS
=========================================*/

function setupNotifications() {

    const notificationBtn =
        document.querySelector(".notification-btn");


    if (notificationBtn) {

        notificationBtn.addEventListener("click", function () {

            window.location.href =
                "notifications.html";

        });

    }

}


/*=========================================
  LOGOUT
=========================================*/

function setupLogout() {

    const logout =
        document.querySelector(".logout a");


    if (!logout) {

        return;

    }


    logout.addEventListener("click", async function (e) {

        e.preventDefault();


        const confirmed =
            confirm("Are you sure you want to logout?");


        if (!confirmed) {

            return;

        }


        try {

            await signOut(auth);

            window.location.href =
                "../index.html";

        } catch (error) {

            console.error(
                "Logout error:",
                error
            );

            window.location.href =
                "../scholars.html";

        }

    });

}


/*=========================================
  TABLE MESSAGE
=========================================*/

function showTableMessage(message, error = false) {

    const tableBody =
        document.getElementById("scholarsTableBody");


    if (!tableBody) {

        return;

    }


    tableBody.innerHTML = `

        <tr>

            <td colspan="7" class="empty-row">

                <div class="empty-state">

                    <i class="fas ${
                        error
                            ? "fa-circle-exclamation"
                            : "fa-user-graduate"
                    }"></i>

                    <h3>
                        ${escapeHTML(message)}
                    </h3>

                </div>

            </td>

        </tr>

    `;

}
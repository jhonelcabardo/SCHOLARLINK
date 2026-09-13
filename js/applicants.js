/*=========================================
  SCHOLARLINK
  ADMIN APPLICANTS
  FIRESTORE CONNECTED VERSION
=========================================*/

import { auth, db } from "../firebase.js";

import {
    collection,
    getDocs,
    doc,
    getDoc,
    updateDoc,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";


/*=========================================
  GLOBAL DATA
=========================================*/

let applicants = [];


/*=========================================
  DOM READY
=========================================*/

document.addEventListener("DOMContentLoaded", function () {

    console.log("Applicants Module Ready");

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

        window.location.href ="../login/index.html";
        return;
    }


    try {

        /*==============================
          CHECK ADMIN
        ==============================*/

        const userRef = doc(
            db,
            "users",
            user.uid
        );


        const userSnap = await getDoc(
            userRef
        );


        if (!userSnap.exists()) {

            alert(
                "User account information was not found."
            );

            await signOut(auth);

             window.location.href = "../login/index.html";
            return;
        }


        const userData =
            userSnap.data();


        if (userData.role !== "admin") {

            alert(
                "Unauthorized access."
            );

            await signOut(auth);

             window.location.href =   "../login/index.html";

            return;
        }


        console.log(
            "Admin authenticated."
        );


        /*==============================
          LOAD APPLICANTS
        ==============================*/

        await loadApplicants();

    }

    catch (error) {

        console.error(
            "Authentication error:",
            error
        );

        showTableMessage(
            "Unable to verify your account.",
            true
        );
    }

});


/*=========================================
  LOAD APPLICANTS
=========================================*/

async function loadApplicants() {

    const tableBody =
        document.getElementById(
            "applicantsTableBody"
        );


    if (tableBody) {

        tableBody.innerHTML = `

            <tr>

                <td
                    colspan="7"
                    class="loading-row"
                >

                    <i
                        class="fas fa-spinner fa-spin"
                    ></i>

                    Loading applicants...

                </td>

            </tr>

        `;
    }


    try {

        console.log(
            "Loading applications from Firestore..."
        );


        /*==============================
          GET APPLICATIONS
        ==============================*/

        const applicationsRef =
            collection(
                db,
                "applications"
            );


        const snapshot =
            await getDocs(
                applicationsRef
            );


        applicants = [];


        /*==============================
          READ EACH APPLICATION
        ==============================*/

        snapshot.forEach(
            function (docSnapshot) {

                const data =
                    docSnapshot.data();


                applicants.push({

                    uid:
                        docSnapshot.id,

                    ...data

                });

            }
        );


        /*================================
          SORT BY REAL APPLICANT ID
          APP-2026-0001
          APP-2026-0002
          APP-2026-0003
        =================================*/

        applicants.sort(
            function (a, b) {

                const idA =
                    extractApplicantNumber(
                        a.applicantId
                    );

                const idB =
                    extractApplicantNumber(
                        b.applicantId
                    );

                return idA - idB;
            }
        );


        console.log(
            "Applicants loaded:",
            applicants
        );


        /*==============================
          DISPLAY
        ==============================*/

        renderApplicants(
            applicants
        );


        /*==============================
          STATISTICS
        ==============================*/

        updateStatistics(
            applicants
        );


        /*==============================
          SEARCH + FILTER
        ==============================*/

        setupSearchAndFilter();

    }

    catch (error) {

        console.error(
            "Error loading applicants:",
            error
        );


        showTableMessage(
            "Failed to load applicants from Firestore.",
            true
        );

    }

}


/*=========================================
  EXTRACT NUMBER FROM APPLICANT ID
=========================================*/

function extractApplicantNumber(applicantId) {

    if (!applicantId) {
        return 999999;
    }


    const match =
        String(applicantId).match(
            /(\d+)$/
        );


    if (!match) {
        return 999999;
    }


    return Number(
        match[1]
    );

}


/*=========================================
  RENDER APPLICANTS
=========================================*/

function renderApplicants(data) {

    const tableBody =
        document.getElementById(
            "applicantsTableBody"
        );


    if (!tableBody) {

        console.error(
            "Element #applicantsTableBody was not found."
        );

        return;
    }


    tableBody.innerHTML = "";


    /*==============================
      EMPTY
    ==============================*/

    if (
        !data ||
        data.length === 0
    ) {

        tableBody.innerHTML = `

            <tr>

                <td
                    colspan="7"
                    class="empty-row"
                >

                    <div
                        class="empty-state"
                    >

                        <i
                            class="fas fa-users"
                        ></i>

                        <h3>
                            No Applicants Found
                        </h3>

                        <p>
                            Applicants who submit
                            scholarship applications
                            will automatically appear here.
                        </p>

                    </div>

                </td>

            </tr>

        `;

        return;
    }


    /*==============================
      CREATE ROWS
    ==============================*/

    data.forEach(
        function (applicant) {

            /*==========================
              PERSONAL INFORMATION
            ==========================*/

            const personal =
                applicant.personalInformation ||
                applicant.personalInfo ||
                {};


            /*==========================
              ACADEMIC INFORMATION
            ==========================*/

            const academic =
                applicant.academicInformation ||
                applicant.educationalInformation ||
                {};


            /*==========================
              REAL APPLICANT ID
            ==========================*/

            const applicantId =
                applicant.applicantId ||
                applicant.applicationId ||
                personal.applicantId ||
                personal.applicationId ||
                "Not Assigned";


            /*==========================
              FULL NAME
            ==========================*/

            const fullName =
                applicant.fullName ||
                personal.fullName ||
                buildFullName(
                    personal
                );


            /*==========================
              SCHOOL
            ==========================*/

            const school =
                applicant.schoolName ||
                applicant.school ||
                academic.schoolName ||
                academic.school ||
                "---";


            /*==========================
              SCHOLARSHIP
            ==========================*/

            const scholarship =
                applicant.scholarshipName ||
                applicant.scholarshipProgram ||
                applicant.programName ||
                applicant.scholarship ||
                "Scholarship Program";


            /*==========================
              DATE APPLIED
            ==========================*/

            const dateApplied =
                formatDate(
                    applicant.submittedAt ||
                    applicant.dateSubmitted ||
                    applicant.createdAt
                );


            /*==========================
              STATUS
            ==========================*/

            const status =
                applicant.status ||
                applicant.applicationStatus ||
                "pending";


            /*==========================
              STATUS CLASS
            ==========================*/

            const statusClass =
                getStatusClass(
                    status
                );


            /*==========================
              CREATE ROW
            ==========================*/

            const row =
                document.createElement(
                    "tr"
                );


            row.dataset.uid =
                applicant.uid;


            row.dataset.status =
                normalizeStatus(
                    status
                );


            row.innerHTML = `

                <td>

                    ${escapeHTML(
                        applicantId
                    )}

                </td>


                <td>

                    ${escapeHTML(
                        fullName
                    )}

                </td>


                <td>

                    ${escapeHTML(
                        school
                    )}

                </td>


                <td>

                    ${escapeHTML(
                        scholarship
                    )}

                </td>


                <td>

                    ${escapeHTML(
                        dateApplied
                    )}

                </td>


                <td>

                    <span
                        class="${statusClass}"
                    >

                        ${escapeHTML(
                            formatStatus(status)
                        )}

                    </span>

                </td>


                <td>

                    <div
                        class="action-buttons"
                    >

                        <!-- VIEW APPLICATION -->

                        <a
                            href="application-review.html?id=${encodeURIComponent(applicant.uid)}"
                            class="btn-view"
                            title="View Application"
                        >

                            <i
                                class="fas fa-eye"
                            ></i>

                        </a>


                        <!-- VIEW REQUIREMENTS -->

                        <a
                            href="requirements.html?id=${encodeURIComponent(applicant.uid)}"
                            class="btn-docs"
                            title="View Requirements"
                        >

                            <i
                                class="fas fa-folder-open"
                            ></i>

                        </a>


                        <!-- APPROVE -->

                        <button
                            type="button"
                            class="btn-approve"
                            data-uid="${escapeHTML(applicant.uid)}"
                            title="Approve Applicant"
                        >

                            <i
                                class="fas fa-check"
                            ></i>

                        </button>


                        <!-- REJECT -->

                        <button
                            type="button"
                            class="btn-reject"
                            data-uid="${escapeHTML(applicant.uid)}"
                            title="Reject Applicant"
                        >

                            <i
                                class="fas fa-times"
                            ></i>

                        </button>


                        <!-- REVISION -->

                        <button
                            type="button"
                            class="btn-revision"
                            data-uid="${escapeHTML(applicant.uid)}"
                            title="Request Revision"
                        >

                            <i
                                class="fas fa-rotate-left"
                            ></i>

                        </button>

                    </div>

                </td>

            `;


            tableBody.appendChild(
                row
            );

        }
    );


    /*==============================
      ACTION BUTTONS
    ==============================*/

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
        data.firstName || "";


    const middleName =
        data.middleName || "";


    const lastName =
        data.lastName || "";


    const suffix =
        data.suffix || "";


    const parts = [

        firstName,
        middleName,
        lastName,
        suffix

    ].filter(
        Boolean
    );


    if (
        parts.length > 0
    ) {

        return parts.join(
            " "
        );

    }


    return "---";

}


/*=========================================
  NORMALIZE STATUS
=========================================*/

function normalizeStatus(status) {

    return String(
        status || "pending"
    )
        .toLowerCase()
        .replace(
            /\s+/g,
            "_"
        );

}


/*=========================================
  GET STATUS CLASS
=========================================*/

function getStatusClass(status) {

    const normalized =
        normalizeStatus(
            status
        );


    switch (
        normalized
    ) {

        case "approved":
        case "active":
        case "passed":
        case "qualified":

            return "approved";


        case "under_review":
        case "review":
        case "reviewing":

            return "review";


        case "revision":
        case "needs_revision":
        case "correction":

            return "revision";


        case "rejected":
        case "failed":
        case "not_selected":

            return "rejected";


        case "pending":
        default:

            return "pending";

    }

}


/*=========================================
  FORMAT STATUS
=========================================*/

function formatStatus(status) {

    if (!status) {
        return "Pending";
    }


    return String(status)

        .replace(
            /_/g,
            " "
        )

        .replace(
            /\b\w/g,
            function (letter) {

                return letter.toUpperCase();

            }
        );

}


/*=========================================
  FORMAT DATE
=========================================*/

function formatDate(timestamp) {

    if (!timestamp) {
        return "---";
    }


    try {

        let date;


        /*==============================
          FIRESTORE TIMESTAMP
        ==============================*/

        if (
            timestamp &&
            typeof timestamp.toDate === "function"
        ) {

            date =
                timestamp.toDate();

        }


        /*==============================
          JAVASCRIPT DATE
        ==============================*/

        else if (
            timestamp instanceof Date
        ) {

            date =
                timestamp;

        }


        /*==============================
          STRING / NUMBER
        ==============================*/

        else {

            date =
                new Date(
                    timestamp
                );

        }


        if (
            isNaN(
                date.getTime()
            )
        ) {

            return "---";

        }


        return date.toLocaleDateString(
            "en-US",
            {
                month: "short",
                day: "2-digit",
                year: "numeric"
            }
        );


    }

    catch (error) {

        console.error(
            "Date formatting error:",
            error
        );

        return "---";

    }

}


/*=========================================
  SEARCH + FILTER
=========================================*/

function setupSearchAndFilter() {

    const searchInput =
        document.querySelector(
            ".search-box input"
        );


    const filter =
        document.querySelector(
            ".search-section select"
        );


    if (searchInput) {

        searchInput.removeEventListener(
            "input",
            applyFilters
        );


        searchInput.addEventListener(
            "input",
            applyFilters
        );

    }


    if (filter) {

        filter.removeEventListener(
            "change",
            applyFilters
        );


        filter.addEventListener(
            "change",
            applyFilters
        );

    }

}


/*=========================================
  APPLY SEARCH + FILTER
=========================================*/

function applyFilters() {

    const searchInput =
        document.querySelector(
            ".search-box input"
        );


    const filter =
        document.querySelector(
            ".search-section select"
        );


    const keyword =
        searchInput
            ? searchInput.value
                .toLowerCase()
                .trim()
            : "";


    const selectedStatus =
        filter
            ? normalizeStatus(
                filter.value
            )
            : "all_status";


    const rows =
        document.querySelectorAll(
            "#applicantsTableBody tr"
        );


    let visibleCount = 0;


    rows.forEach(
        function (row) {

            if (
                row.querySelector(
                    ".empty-state"
                )
            ) {

                return;

            }


            if (
                row.id ===
                "noApplicantResults"
            ) {

                return;

            }


            const rowText =
                row.innerText
                    .toLowerCase();


            const rowStatus =
                row.dataset.status ||
                "";


            const matchesSearch =
                rowText.includes(
                    keyword
                );


            let matchesStatus =
                true;


            if (
                selectedStatus !==
                "all_status"
            ) {

                matchesStatus =
                    rowStatus ===
                    selectedStatus;

            }


            if (
                matchesSearch &&
                matchesStatus
            ) {

                row.style.display =
                    "";

                visibleCount++;

            }

            else {

                row.style.display =
                    "none";

            }

        }
    );


    showNoResultsMessage(
        visibleCount
    );

}


/*=========================================
  NO SEARCH RESULTS
=========================================*/

function showNoResultsMessage(count) {

    const tableBody =
        document.getElementById(
            "applicantsTableBody"
        );


    if (!tableBody) {
        return;
    }


    let message =
        document.getElementById(
            "noApplicantResults"
        );


    if (
        count === 0 &&
        applicants.length > 0
    ) {

        if (!message) {

            message =
                document.createElement(
                    "tr"
                );


            message.id =
                "noApplicantResults";


            message.innerHTML = `

                <td
                    colspan="7"
                    class="empty-row"
                >

                    <div
                        class="empty-state"
                    >

                        <i
                            class="fas fa-search"
                        ></i>

                        <h3>
                            No Applicants Found
                        </h3>

                        <p>
                            No applicant matches
                            your search or selected status.
                        </p>

                    </div>

                </td>

            `;


            tableBody.appendChild(
                message
            );

        }

    }

    else {

        if (message) {
            message.remove();
        }

    }

}


/*=========================================
  UPDATE STATISTICS
=========================================*/

function updateStatistics(data) {

    let pending = 0;
    let approved = 0;
    let rejected = 0;
    let revision = 0;


    data.forEach(
        function (applicant) {

            const status =
                normalizeStatus(
                    applicant.status ||
                    applicant.applicationStatus ||
                    "pending"
                );


            /*========================
              PENDING
            ========================*/

            if (
                status === "pending" ||
                status === "submitted"
            ) {

                pending++;

            }


            /*========================
              APPROVED
            ========================*/

            if (
                status === "approved" ||
                status === "active" ||
                status === "passed" ||
                status === "qualified"
            ) {

                approved++;

            }


            /*========================
              REJECTED
            ========================*/

            if (
                status === "rejected" ||
                status === "failed" ||
                status === "not_selected"
            ) {

                rejected++;

            }


            /*========================
              REVISION
            ========================*/

            if (
                status === "revision" ||
                status === "needs_revision" ||
                status === "correction"
            ) {

                revision++;

            }

        }
    );


    /*==============================
      SUMMARY CARDS
    ==============================*/

    setText(
        "pendingApplicants",
        pending
    );


    setText(
        "approvedApplicants",
        approved
    );


    setText(
        "rejectedApplicants",
        rejected
    );


    setText(
        "revisionApplicants",
        revision
    );


    /*==============================
      STATISTICS PANEL
    ==============================*/

    setText(
        "statsTotalApplicants",
        data.length
    );


    setText(
        "statsPending",
        pending
    );


    setText(
        "statsApproved",
        approved
    );


    setText(
        "statsRejected",
        rejected
    );


    setText(
        "statsRevision",
        revision
    );

}


/*=========================================
  SET TEXT
=========================================*/

function setText(id, value) {

    const element =
        document.getElementById(
            id
        );


    if (element) {

        element.textContent =
            value;

    }

}


/*=========================================
  ACTION BUTTONS
=========================================*/

function setupActionButtons() {

    /*=====================================
      VIEW APPLICATION
    =====================================*/

    document
        .querySelectorAll(
            ".btn-view"
        )
        .forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function (e) {

                        e.preventDefault();

                        const url =
                            button.getAttribute(
                                "href"
                            );


                        if (url) {

                            window.location.href =
                                url;

                        }

                    }
                );

            }
        );


    /*=====================================
      VIEW REQUIREMENTS
    =====================================*/

    document
        .querySelectorAll(
            ".btn-docs"
        )
        .forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function (e) {

                        e.preventDefault();

                        const url =
                            button.getAttribute(
                                "href"
                            );


                        if (url) {

                            window.location.href =
                                url;

                        }

                    }
                );

            }
        );


    /*=====================================
      APPROVE
    =====================================*/

    document
        .querySelectorAll(
            ".btn-approve"
        )
        .forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    async function () {

                        const uid =
                            button.dataset.uid;


                        if (!uid) {

                            alert(
                                "Applicant ID is missing."
                            );

                            return;
                        }


                        const confirmed =
                            confirm(
                                "Approve this applicant?"
                            );


                        if (!confirmed) {
                            return;
                        }


                        await updateApplicationStatus(
                            uid,
                            "approved"
                        );

                    }
                );

            }
        );


    /*=====================================
      REJECT
    =====================================*/

    document
        .querySelectorAll(
            ".btn-reject"
        )
        .forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    async function () {

                        const uid =
                            button.dataset.uid;


                        if (!uid) {

                            alert(
                                "Applicant ID is missing."
                            );

                            return;
                        }


                        const confirmed =
                            confirm(
                                "Reject this applicant?"
                            );


                        if (!confirmed) {
                            return;
                        }


                        await updateApplicationStatus(
                            uid,
                            "rejected"
                        );

                    }
                );

            }
        );


    /*=====================================
      REQUEST REVISION
    =====================================*/

    document
        .querySelectorAll(
            ".btn-revision"
        )
        .forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    async function () {

                        const uid =
                            button.dataset.uid;


                        if (!uid) {

                            alert(
                                "Applicant ID is missing."
                            );

                            return;
                        }


                        const confirmed =
                            confirm(
                                "Request revision from this applicant?"
                            );


                        if (!confirmed) {
                            return;
                        }


                        await updateApplicationStatus(
                            uid,
                            "revision"
                        );

                    }
                );

            }
        );

}


/*=========================================
  UPDATE APPLICATION STATUS
=========================================*/

async function updateApplicationStatus(
    uid,
    newStatus
) {

    try {

        console.log(
            "Updating application:",
            uid,
            newStatus
        );


        const applicationRef =
            doc(
                db,
                "applications",
                uid
            );


        const applicationSnap =
            await getDoc(
                applicationRef
            );


        if (
            !applicationSnap.exists()
        ) {

            alert(
                "Application record was not found."
            );

            return;
        }


        /*==============================
          UPDATE FIRESTORE
        ==============================*/

        await updateDoc(
            applicationRef,
            {

                status:
                    newStatus,

                applicationStatus:
                    newStatus,

                updatedAt:
                    serverTimestamp(),

                reviewedAt:
                    serverTimestamp(),

                reviewedBy:
                    auth.currentUser.uid

            }
        );


        /*==============================
          NOTIFICATION MESSAGE
        ==============================*/

        let notificationTitle =
            "Application Update";


        let notificationMessage =
            "Your scholarship application has been updated.";


        if (
            newStatus ===
            "approved"
        ) {

            notificationTitle =
                "Application Approved";


            notificationMessage =
                "Your scholarship application has been approved and will proceed to the next stage.";

        }


        if (
            newStatus ===
            "rejected"
        ) {

            notificationTitle =
                "Application Rejected";


            notificationMessage =
                "Your scholarship application was not approved.";

        }


        if (
            newStatus ===
            "revision"
        ) {

            notificationTitle =
                "Application Revision Required";


            notificationMessage =
                "Your scholarship application requires revision. Please review your application and submit the necessary corrections.";

        }


        /*==============================
          CREATE NOTIFICATION
        ==============================*/

        try {

            await addDoc(
                collection(
                    db,
                    "notifications"
                ),
                {

                    userId:
                        uid,

                    title:
                        notificationTitle,

                    message:
                        notificationMessage,

                    type:
                        "application",

                    read:
                        false,

                    createdAt:
                        serverTimestamp(),

                    createdBy:
                        auth.currentUser.uid

                }
            );

        }

        catch (notificationError) {

            console.warn(
                "Notification could not be created:",
                notificationError
            );

        }


        /*==============================
          SUCCESS
        ==============================*/

        if (
            newStatus ===
            "approved"
        ) {

            alert(
                "Applicant approved successfully."
            );

        }


        if (
            newStatus ===
            "rejected"
        ) {

            alert(
                "Applicant rejected successfully."
            );

        }


        if (
            newStatus ===
            "revision"
        ) {

            alert(
                "Revision request sent successfully."
            );

        }


        /*==============================
          RELOAD DATA
        ==============================*/

        await loadApplicants();

    }

    catch (error) {

        console.error(
            "Error updating application:",
            error
        );


        alert(
            "Failed to update the application. Please try again."
        );

    }

}


/*=========================================
  MOBILE SIDEBAR
=========================================*/

function setupMobileSidebar() {

    const menuToggle =
        document.getElementById(
            "menuToggle"
        );


    const sidebar =
        document.querySelector(
            ".sidebar"
        );


    if (
        menuToggle &&
        sidebar
    ) {

        menuToggle.addEventListener(
            "click",
            function () {

                sidebar.classList.toggle(
                    "show"
                );

            }
        );

    }

}


/*=========================================
  NOTIFICATIONS
=========================================*/

function setupNotifications() {

    const notificationBtn =
        document.querySelector(
            ".notification-btn"
        );


    if (notificationBtn) {

        notificationBtn.addEventListener(
            "click",
            function () {

                window.location.href =
                    "notifications.html";

            }
        );

    }

}


/*=========================================
  LOGOUT
=========================================*/

function setupLogout() {

    const logout =
        document.querySelector(
            ".logout a"
        );


    if (!logout) {
        return;
    }


    logout.addEventListener(
        "click",
        async function (e) {

            e.preventDefault();


            const confirmed =
                confirm(
                    "Are you sure you want to logout?"
                );


            if (!confirmed) {
                return;
            }


            try {

                await signOut(
                    auth
                );


                 window.location.href =
                        "../login/index.html";

            }

            catch (error) {

                console.error(
                    "Logout error:",
                    error
                );


              window.location.href =
                        "../login/index.html";
            }

        }
    );

}


/*=========================================
  TABLE MESSAGE
=========================================*/

function showTableMessage(
    message,
    error = false
) {

    const tableBody =
        document.getElementById(
            "applicantsTableBody"
        );


    if (!tableBody) {
        return;
    }


    tableBody.innerHTML = `

        <tr>

            <td
                colspan="7"
                class="empty-row"
            >

                <div
                    class="empty-state"
                >

                    <i class="fas ${
                        error
                            ? "fa-circle-exclamation"
                            : "fa-users"
                    }"></i>

                    <h3>

                        ${escapeHTML(
                            message
                        )}

                    </h3>

                </div>

            </td>

        </tr>

    `;

}


/*=========================================
  ESCAPE HTML
=========================================*/

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}
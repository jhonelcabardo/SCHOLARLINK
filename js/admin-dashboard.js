/*=========================================================
  SCHOLARLINK
  ADMIN DASHBOARD
  FIRESTORE CONNECTED VERSION
=========================================================*/

import {
    auth,
    db
} from "../firebase.js";


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



/*=========================================================
  GLOBAL DATA
=========================================================*/

let applications = [];
let scholars = [];
let announcements = [];
let notifications = [];



/*=========================================================
  DOM READY
=========================================================*/

document.addEventListener(
    "DOMContentLoaded",
    function () {

        console.log(
            "ScholarLink Admin Dashboard Ready"
        );


        setupMobileSidebar();

        setupNotificationsButton();

        setupLogout();

    }
);



/*=========================================================
  AUTHENTICATION
=========================================================*/

onAuthStateChanged(
    auth,
    async function (user) {

        if (!user) {

            window.location.href =
                "../login/index.html";

            return;
        }


        try {

            /*=============================================
              GET ADMIN USER
            =============================================*/

            const userRef =
                doc(
                    db,
                    "users",
                    user.uid
                );


            const userSnap =
                await getDoc(
                    userRef
                );


            if (!userSnap.exists()) {

                alert(
                    "Administrator account was not found."
                );


                await signOut(auth);


                window.location.href =
                    "../login/index.html";


                return;

            }


            const userData =
                userSnap.data();


            /*=============================================
              CHECK ROLE
            =============================================*/

            if (
                userData.role !==
                "admin"
            ) {

                alert(
                    "Unauthorized access."
                );


                await signOut(auth);


                window.location.href =
                    "../login/index.html";


                return;

            }


            console.log(
                "Admin authenticated:",
                user.email
            );


            /*=============================================
              LOAD DASHBOARD
            =============================================*/

            await loadDashboard();


        }

        catch (error) {

            console.error(
                "Dashboard authentication error:",
                error
            );


            showDashboardError(
                "Unable to load dashboard data."
            );

        }

    }
);



/*=========================================================
  LOAD DASHBOARD
=========================================================*/

async function loadDashboard() {

    try {

        await Promise.all([

            loadApplications(),

            loadScholars(),

            loadAnnouncements(),

            loadNotifications()

        ]);


        updateDashboardCards();

        renderRecentApplications();

        renderNotifications();

        renderAnnouncements();

        renderSystemActivity();


        console.log(
            "Dashboard data loaded successfully."
        );

    }

    catch (error) {

        console.error(
            "Dashboard loading error:",
            error
        );


        showDashboardError(
            "Some dashboard information could not be loaded."
        );

    }

}



/*=========================================================
  LOAD APPLICATIONS
=========================================================*/

async function loadApplications() {

    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "applications"
                )
            );


        applications = [];


        snapshot.forEach(
            function (docSnapshot) {

                applications.push({

                    uid:
                        docSnapshot.id,

                    ...docSnapshot.data()

                });

            }
        );


        console.log(
            "Applications:",
            applications
        );

    }

    catch (error) {

        console.error(
            "Error loading applications:",
            error
        );


        applications = [];

    }

}



/*=========================================================
  LOAD SCHOLARS
=========================================================*/

async function loadScholars() {

    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "scholars"
                )
            );


        scholars = [];


        snapshot.forEach(
            function (docSnapshot) {

                scholars.push({

                    uid:
                        docSnapshot.id,

                    ...docSnapshot.data()

                });

            }
        );


        console.log(
            "Scholars:",
            scholars
        );

    }

    catch (error) {

        console.error(
            "Error loading scholars:",
            error
        );


        scholars = [];

    }

}



/*=========================================================
  LOAD ANNOUNCEMENTS
=========================================================*/

async function loadAnnouncements() {

    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "announcements"
                )
            );


        announcements = [];


        snapshot.forEach(
            function (docSnapshot) {

                announcements.push({

                    id:
                        docSnapshot.id,

                    ...docSnapshot.data()

                });

            }
        );


        announcements.sort(
            function (a, b) {

                return getTimestamp(
                    b.createdAt ||
                    b.publishedAt ||
                    b.date
                ) -
                getTimestamp(
                    a.createdAt ||
                    a.publishedAt ||
                    a.date
                );

            }
        );


        console.log(
            "Announcements:",
            announcements
        );

    }

    catch (error) {

        console.error(
            "Error loading announcements:",
            error
        );


        announcements = [];

    }

}



/*=========================================================
  LOAD NOTIFICATIONS
=========================================================*/

async function loadNotifications() {

    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "notifications"
                )
            );


        notifications = [];


        snapshot.forEach(
            function (docSnapshot) {

                notifications.push({

                    id:
                        docSnapshot.id,

                    ...docSnapshot.data()

                });

            }
        );


        notifications.sort(
            function (a, b) {

                return getTimestamp(
                    b.createdAt
                ) -
                getTimestamp(
                    a.createdAt
                );

            }
        );


        console.log(
            "Notifications:",
            notifications
        );

    }

    catch (error) {

        console.error(
            "Error loading notifications:",
            error
        );


        notifications = [];

    }

}



/*=========================================================
  UPDATE DASHBOARD CARDS
=========================================================*/

function updateDashboardCards() {


    /*=============================================
      TOTAL APPLICANTS
    =============================================*/

    const totalApplicants =
        applications.length;


    setText(
        "totalApplicants",
        totalApplicants
    );


    /*=============================================
      TOTAL SCHOLARS
    =============================================*/

    const totalScholars =
        scholars.length;


    setText(
        "totalScholars",
        totalScholars
    );


    /*=============================================
      ACTIVE SCHOLARS
    =============================================*/

    const activeScholars =
        scholars.filter(
            function (scholar) {

                const status =
                    normalizeStatus(
                        scholar.status ||
                        scholar.scholarStatus
                    );


                return (
                    status === "active"
                );

            }
        ).length;


    setText(
        "activeScholars",
        activeScholars
    );


    /*=============================================
      PENDING APPLICATIONS
    =============================================*/

    const pendingApplications =
        applications.filter(
            function (application) {

                const status =
                    normalizeStatus(
                        application.status ||
                        application.applicationStatus
                    );


                return (

                    status ===
                    "pending"

                    ||

                    status ===
                    "submitted"

                    ||

                    status ===
                    "under_review"

                    ||

                    status ===
                    "review"

                    ||

                    status ===
                    "reviewing"

                );

            }
        ).length;


    setText(
        "pendingApplications",
        pendingApplications
    );


    /*=============================================
      APPROVED APPLICATIONS
    =============================================*/

    const approvedApplications =
        applications.filter(
            function (application) {

                const status =
                    normalizeStatus(
                        application.status ||
                        application.applicationStatus
                    );


                return (

                    status ===
                    "approved"

                    ||

                    status ===
                    "passed"

                    ||

                    status ===
                    "active"

                    ||

                    status ===
                    "scholar_confirmed"

                );

            }
        ).length;


    setText(
        "approvedApplications",
        approvedApplications
    );


    /*=============================================
      ANNOUNCEMENTS
    =============================================*/

    setText(
        "totalAnnouncements",
        announcements.length
    );


    /*=============================================
      UNREAD NOTIFICATIONS
    =============================================*/

    const unreadNotifications =
        notifications.filter(
            function (notification) {

                return (
                    notification.read !==
                    true
                );

            }
        ).length;


    setText(
        "unreadNotifications",
        unreadNotifications
    );


    /*=============================================
      AT RISK SCHOLARS
    =============================================*/

    const atRiskScholars =
        scholars.filter(
            function (scholar) {

                const status =
                    normalizeStatus(
                        scholar.monitoringStatus ||
                        scholar.riskStatus ||
                        scholar.status ||
                        scholar.scholarStatus
                    );


                return (

                    status ===
                    "at_risk"

                    ||

                    status ===
                    "atrisk"

                    ||

                    status ===
                    "warning"

                    ||

                    status ===
                    "probation"

                );

            }
        ).length;


    setText(
        "atRiskScholars",
        atRiskScholars
    );


    /*=============================================
      DOCUMENTS
    =============================================*/

    const pendingDocuments =
        calculatePendingDocuments();


    setText(
        "pendingDocuments",
        pendingDocuments
    );

}



/*=========================================================
  CALCULATE PENDING DOCUMENTS
=========================================================*/

function calculatePendingDocuments() {

    let count = 0;


    applications.forEach(
        function (application) {

            const files =
                application.files ||
                {};


            const requirements =
                files.requirements ||
                application.requirements ||
                {};


            if (
                !requirements ||
                typeof requirements !==
                "object"
            ) {

                return;

            }


            Object.keys(
                requirements
            ).forEach(
                function (key) {

                    const requirement =
                        requirements[key];


                    if (
                        !requirement
                    ) {

                        return;

                    }


                    /*=====================================
                      CHECK VERIFICATION STATUS
                    =====================================*/

                    const verificationStatus =
                        normalizeStatus(
                            requirement.verificationStatus ||
                            requirement.status ||
                            ""
                        );


                    if (

                        verificationStatus ===
                        ""

                        ||

                        verificationStatus ===
                        "pending"

                        ||

                        verificationStatus ===
                        "for_review"

                        ||

                        verificationStatus ===
                        "review"

                    ) {

                        count++;

                    }

                }
            );

        }
    );


    return count;

}



/*=========================================================
  RECENT APPLICATIONS
=========================================================*/

function renderRecentApplications() {

    const tableBody =
        document.getElementById(
            "recentApplicationsBody"
        );


    if (!tableBody) {
        return;
    }


    if (
        applications.length ===
        0
    ) {

        tableBody.innerHTML = `

            <tr>

                <td
                    colspan="6"
                    style="text-align:center;"
                >

                    No applications found.

                </td>

            </tr>

        `;

        return;

    }


    const recent =
        [...applications]
            .sort(
                function (a, b) {

                    return getTimestamp(
                        b.submittedAt ||
                        b.dateSubmitted ||
                        b.createdAt
                    ) -

                    getTimestamp(
                        a.submittedAt ||
                        a.dateSubmitted ||
                        a.createdAt
                    );

                }
            )
            .slice(
                0,
                5
            );


    tableBody.innerHTML = "";


    recent.forEach(
        function (application) {

            const personal =
                application.personalInformation ||
                application.personalInfo ||
                {};


            const academic =
                application.academicInformation ||
                application.educationalInformation ||
                {};


            const applicantId =
                application.applicantId ||
                personal.applicantId ||
                "Not Assigned";


            const fullName =
                application.fullName ||
                personal.fullName ||
                buildFullName(
                    personal
                );


            const school =
                application.schoolName ||
                application.school ||
                academic.schoolName ||
                academic.school ||
                "---";


            const scholarship =
                application.scholarshipName ||
                application.scholarshipProgram ||
                application.programName ||
                application.scholarship ||
                "Scholarship Program";


            const status =
                application.status ||
                application.applicationStatus ||
                "pending";


            const row =
                document.createElement(
                    "tr"
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

                    <span
                        class="${getStatusClass(status)}"
                    >

                        ${escapeHTML(
                            formatStatus(status)
                        )}

                    </span>

                </td>

                <td>

                    <a
                        href="application-review.html?id=${encodeURIComponent(application.uid)}"
                        class="view-btn"
                    >

                        View

                    </a>

                </td>

            `;


            tableBody.appendChild(
                row
            );

        }
    );

}



/*=========================================================
  RECENT NOTIFICATIONS
=========================================================*/

function renderNotifications() {

    const container =
        document.getElementById(
            "dashboardNotifications"
        );


    if (!container) {
        return;
    }


    if (
        notifications.length ===
        0
    ) {

        container.innerHTML = `

            <div class="notification-item">

                <i class="fas fa-bell-slash"></i>

                <div>

                    <h4>No Notifications</h4>

                    <p>
                        There are no notifications yet.
                    </p>

                    <small>
                        No recent activity
                    </small>

                </div>

            </div>

        `;

        return;

    }


    const recent =
        notifications.slice(
            0,
            4
        );


    container.innerHTML = "";


    recent.forEach(
        function (notification) {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "notification-item";


            item.innerHTML = `

                <i class="fas fa-bell"></i>

                <div>

                    <h4>
                        ${escapeHTML(
                            notification.title ||
                            "Notification"
                        )}
                    </h4>

                    <p>
                        ${escapeHTML(
                            notification.message ||
                            "You have a new notification."
                        )}
                    </p>

                    <small>
                        ${formatRelativeTime(
                            notification.createdAt
                        )}
                    </small>

                </div>

            `;


            container.appendChild(
                item
            );

        }
    );

}



/*=========================================================
  ANNOUNCEMENTS
=========================================================*/

function renderAnnouncements() {

    const container =
        document.getElementById(
            "dashboardAnnouncements"
        );


    if (!container) {
        return;
    }


    if (
        announcements.length ===
        0
    ) {

        container.innerHTML = `

            <div class="announcement-item">

                <h4>
                    No Announcements
                </h4>

                <p>
                    No published announcements yet.
                </p>

            </div>

        `;

        return;

    }


    const recent =
        announcements.slice(
            0,
            3
        );


    container.innerHTML = "";


    recent.forEach(
        function (announcement) {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "announcement-item";


            item.innerHTML = `

                <h4>
                    ${escapeHTML(
                        announcement.title ||
                        announcement.name ||
                        "Announcement"
                    )}
                </h4>

                <p>
                    ${escapeHTML(
                        announcement.message ||
                        announcement.description ||
                        announcement.content ||
                        ""
                    )}
                </p>

            `;


            container.appendChild(
                item
            );

        }
    );

}



/*=========================================================
  SYSTEM ACTIVITY
=========================================================*/

function renderSystemActivity() {

    const container =
        document.getElementById(
            "dashboardActivity"
        );


    if (!container) {
        return;
    }


    const activities = [];


    /*=============================================
      APPLICATION ACTIVITY
    =============================================*/

    applications
        .sort(
            function (a, b) {

                return getTimestamp(
                    b.updatedAt ||
                    b.submittedAt ||
                    b.createdAt
                ) -

                getTimestamp(
                    a.updatedAt ||
                    a.submittedAt ||
                    a.createdAt
                );

            }
        )
        .slice(
            0,
            5
        )
        .forEach(
            function (application) {

                const personal =
                    application.personalInformation ||
                    {};


                const name =
                    application.fullName ||
                    personal.fullName ||
                    buildFullName(
                        personal
                    );


                const status =
                    application.status ||
                    "pending";


                const applicantId =
                    application.applicantId ||
                    "Application";


                activities.push({

                    time:
                        application.updatedAt ||
                        application.submittedAt ||
                        application.createdAt,

                    text:
                        `${name} — ${applicantId} is ${formatStatus(status)}.`

                });

            }
        );


    /*=============================================
      ANNOUNCEMENT ACTIVITY
    =============================================*/

    announcements
        .slice(
            0,
            3
        )
        .forEach(
            function (announcement) {

                activities.push({

                    time:
                        announcement.createdAt ||
                        announcement.publishedAt,

                    text:
                        `Announcement published: ${
                            announcement.title ||
                            "New announcement"
                        }.`

                });

            }
        );


    /*=============================================
      NOTIFICATION ACTIVITY
    =============================================*/

    notifications
        .slice(
            0,
            3
        )
        .forEach(
            function (notification) {

                activities.push({

                    time:
                        notification.createdAt,

                    text:
                        `Notification created: ${
                            notification.title ||
                            "Application update"
                        }.`

                });

            }
        );


    /*=============================================
      SORT
    =============================================*/

    activities.sort(
        function (a, b) {

            return getTimestamp(
                b.time
            ) -

            getTimestamp(
                a.time
            );

        }
    );


    const latest =
        activities.slice(
            0,
            5
        );


    if (
        latest.length ===
        0
    ) {

        container.innerHTML = `

            <li>
                No system activity yet.
            </li>

        `;

        return;

    }


    container.innerHTML = "";


    latest.forEach(
        function (activity) {

            const li =
                document.createElement(
                    "li"
                );


            li.innerHTML = `

                <strong>
                    ${formatTime(
                        activity.time
                    )}
                </strong>

                — ${escapeHTML(
                    activity.text
                )}

            `;


            container.appendChild(
                li
            );

        }
    );

}



/*=========================================================
  NORMALIZE STATUS
=========================================================*/

function normalizeStatus(status) {

    return String(
        status || ""
    )
        .toLowerCase()
        .trim()
        .replace(
            /\s+/g,
            "_"
        );

}



/*=========================================================
  STATUS CLASS
=========================================================*/

function getStatusClass(status) {

    const normalized =
        normalizeStatus(
            status
        );


    switch (
        normalized
    ) {

        case "approved":
        case "passed":
        case "active":
        case "scholar_confirmed":

            return "approved";


        case "under_review":
        case "review":
        case "reviewing":
        case "qualified":
        case "exam_scheduled":
        case "exam_taken":

            return "review";


        case "revision":
        case "needs_revision":
        case "correction":

            return "revision";


        case "rejected":
        case "failed":
        case "not_selected":

            return "rejected";


        default:

            return "pending";

    }

}



/*=========================================================
  FORMAT STATUS
=========================================================*/

function formatStatus(status) {

    if (!status) {
        return "Pending";
    }


    return String(
        status
    )
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



/*=========================================================
  BUILD FULL NAME
=========================================================*/

function buildFullName(data) {

    if (!data) {
        return "---";
    }


    if (data.fullName) {
        return data.fullName;
    }


    const parts = [

        data.firstName,

        data.middleName,

        data.lastName,

        data.suffix

    ].filter(
        Boolean
    );


    return parts.length
        ? parts.join(" ")
        : "---";

}



/*=========================================================
  FIRESTORE TIMESTAMP
=========================================================*/

function getTimestamp(value) {

    if (!value) {
        return 0;
    }


    try {

        if (
            typeof value.toMillis ===
            "function"
        ) {

            return value.toMillis();

        }


        if (
            typeof value.toDate ===
            "function"
        ) {

            return value.toDate().getTime();

        }


        if (
            value.seconds !==
            undefined
        ) {

            return Number(
                value.seconds
            ) * 1000;

        }


        const date =
            new Date(
                value
            );


        if (
            !isNaN(
                date.getTime()
            )
        ) {

            return date.getTime();

        }

    }

    catch (error) {

        console.warn(
            "Timestamp error:",
            error
        );

    }


    return 0;

}



/*=========================================================
  RELATIVE TIME
=========================================================*/

function formatRelativeTime(value) {

    const timestamp =
        getTimestamp(
            value
        );


    if (!timestamp) {
        return "Recently";
    }


    const difference =
        Date.now() -
        timestamp;


    const minutes =
        Math.floor(
            difference /
            60000
        );


    if (
        minutes <
        1
    ) {

        return "Just now";

    }


    if (
        minutes <
        60
    ) {

        return `${minutes} minute${
            minutes === 1
                ? ""
                : "s"
        } ago`;

    }


    const hours =
        Math.floor(
            minutes /
            60
        );


    if (
        hours <
        24
    ) {

        return `${hours} hour${
            hours === 1
                ? ""
                : "s"
        } ago`;

    }


    const days =
        Math.floor(
            hours /
            24
        );


    if (
        days <
        30
    ) {

        return `${days} day${
            days === 1
                ? ""
                : "s"
        } ago`;

    }


    return new Date(
        timestamp
    ).toLocaleDateString(
        "en-US",
        {
            month: "short",
            day: "numeric",
            year: "numeric"
        }
    );

}



/*=========================================================
  FORMAT TIME
=========================================================*/

function formatTime(value) {

    const timestamp =
        getTimestamp(
            value
        );


    if (!timestamp) {
        return "--:--";
    }


    return new Date(
        timestamp
    ).toLocaleTimeString(
        "en-US",
        {
            hour: "2-digit",
            minute: "2-digit"
        }
    );

}



/*=========================================================
  SET TEXT
=========================================================*/

function setText(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (element) {

        element.textContent =
            value;

    }

}



/*=========================================================
  NOTIFICATION BUTTON
=========================================================*/

function setupNotificationsButton() {

    const button =
        document.querySelector(
            ".notification-btn"
        );


    if (!button) {
        return;
    }


    button.addEventListener(
        "click",
        function () {

            window.location.href =
                "notifications.html";

        }
    );

}



/*=========================================================
  MOBILE SIDEBAR
=========================================================*/

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
        !menuToggle ||
        !sidebar
    ) {

        return;

    }


    menuToggle.addEventListener(
        "click",
        function () {

            sidebar.classList.toggle(
                "show"
            );

        }
    );

}



/*=========================================================
  LOGOUT
=========================================================*/

function setupLogout() {

    const logoutLink =
        document.getElementById(
            "logoutLink"
        );


    const logoutModal =
        document.getElementById(
            "logoutModal"
        );


    const cancelLogout =
        document.getElementById(
            "cancelLogout"
        );


    const confirmLogout =
        document.getElementById(
            "confirmLogout"
        );


    if (logoutLink) {

        logoutLink.addEventListener(
            "click",
            function (event) {

                event.preventDefault();


                if (logoutModal) {

                    logoutModal.classList.add(
                        "active"
                    );

                }

            }
        );

    }


    if (cancelLogout) {

        cancelLogout.addEventListener(
            "click",
            function () {

                if (logoutModal) {

                    logoutModal.classList.remove(
                        "active"
                    );

                }

            }
        );

    }


    if (confirmLogout) {

        confirmLogout.addEventListener(
            "click",
            async function () {

                try {

                    confirmLogout.disabled =
                        true;


                    confirmLogout.textContent =
                        "Logging out...";


                    await signOut(
                        auth
                    );


                    localStorage.removeItem(
                        "scholarLinkLoggedIn"
                    );

                    localStorage.removeItem(
                        "scholarLinkRole"
                    );

                    localStorage.removeItem(
                        "scholarLinkUID"
                    );

                    localStorage.removeItem(
                        "scholarLinkEmail"
                    );


                    window.location.href =
                        "../login/index.html";

                }

                catch (error) {

                    console.error(
                        "Logout error:",
                        error
                    );


                    alert(
                        "Error logging out. Please try again."
                    );


                    confirmLogout.disabled =
                        false;


                    confirmLogout.textContent =
                        "Logout";

                }

            }
        );

    }


    if (logoutModal) {

        logoutModal.addEventListener(
            "click",
            function (event) {

                if (
                    event.target ===
                    logoutModal
                ) {

                    logoutModal.classList.remove(
                        "active"
                    );

                }

            }
        );

    }


    document.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key ===
                "Escape" &&
                logoutModal &&
                logoutModal.classList.contains(
                    "active"
                )
            ) {

                logoutModal.classList.remove(
                    "active"
                );

            }

        }
    );

}



/*=========================================================
  ERROR MESSAGE
=========================================================*/

function showDashboardError(
    message
) {

    console.error(
        message
    );

}



/*=========================================================
  ESCAPE HTML
=========================================================*/

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
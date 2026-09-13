/* =========================================================
   SCHOLARLINK
   ADMIN APPLICATIONS
========================================================= */


import {
    auth,
    db
} from "../firebase.js";


import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";


import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";



/* =========================================================
   ELEMENTS
========================================================= */

const tableBody =
    document.getElementById(
        "applicationsTableBody"
    );


const searchInput =
    document.getElementById(
        "searchApplication"
    );


const statusFilter =
    document.getElementById(
        "statusFilter"
    );


const menuToggle =
    document.getElementById(
        "menuToggle"
    );


const sidebar =
    document.querySelector(
        ".sidebar"
    );


const notificationBtn =
    document.getElementById(
        "notificationBtn"
    );


const logoutLink =
    document.getElementById(
        "logoutLink"
    );



/* =========================================================
   APPLICATION DATA
========================================================= */

let applications = [];



/* =========================================================
   AUTHENTICATION
========================================================= */

onAuthStateChanged(
    auth,
    async (user) => {

        if (!user) {

            window.location.href =
                "../login/index.html";

            return;

        }


        console.log(
            "Admin Applications User:",
            user.uid
        );


        await loadApplications();

    }
);



/* =========================================================
   LOAD APPLICATIONS
========================================================= */

async function loadApplications() {

    try {

        console.log(
            "Loading applications from Firestore..."
        );


        const snapshot =
            await getDocs(
                collection(
                    db,
                    "applications"
                )
            );


        applications = [];


        snapshot.forEach(
            (documentSnapshot) => {

                applications.push({

                    id:
                        documentSnapshot.id,

                    ...documentSnapshot.data()

                });

            }
        );


        console.log(
            "Applications loaded:",
            applications
        );


        renderApplications();

    }

    catch (error) {

        console.error(
            "Error loading applications:",
            error
        );


        tableBody.innerHTML = `

            <tr>

                <td colspan="7">

                    <div class="empty-state error-state">

                        <i class="fas fa-triangle-exclamation"></i>

                        <h3>
                            Failed to load applications
                        </h3>

                        <p>
                            ${escapeHtml(error.message)}
                        </p>

                    </div>

                </td>

            </tr>

        `;

    }

}



/* =========================================================
   RENDER APPLICATIONS
========================================================= */

function renderApplications() {

    const search =
        searchInput
            .value
            .toLowerCase()
            .trim();


    const selectedStatus =
        statusFilter.value;


    const filtered =
        applications.filter(
            (application) => {


                const personal =
                    application.personalInformation ||
                    {};


                const academic =
                    application.academicInformation ||
                    {};


                const applicantId =
                    String(
                        application.applicantId ||
                        application.id ||
                        ""
                    );


                const firstName =
                    String(
                        personal.firstName ||
                        ""
                    );


                const lastName =
                    String(
                        personal.lastName ||
                        ""
                    );


                const email =
                    String(
                        personal.email ||
                        application.email ||
                        ""
                    );


                const fullName =
                    `${firstName} ${lastName}`
                        .trim()
                        .toLowerCase();


                const status =
                    application.status ||
                    "submitted";


                const searchMatch =

                    !search ||

                    applicantId
                        .toLowerCase()
                        .includes(search) ||

                    fullName
                        .includes(search) ||

                    email
                        .toLowerCase()
                        .includes(search);


                const statusMatch =

                    selectedStatus === "all" ||

                    status === selectedStatus;


                return (
                    searchMatch &&
                    statusMatch
                );

            }
        );



    /* =====================================================
       NO RESULTS
    ===================================================== */

    if (
        filtered.length === 0
    ) {

        tableBody.innerHTML = `

            <tr>

                <td colspan="7">

                    <div class="empty-state">

                        <i class="fas fa-folder-open"></i>

                        <h3>
                            No applications found
                        </h3>

                        <p>
                            No applications match your search or filter.
                        </p>

                    </div>

                </td>

            </tr>

        `;

        return;

    }



    /* =====================================================
       TABLE
    ===================================================== */

    tableBody.innerHTML =

        filtered.map(
            (application) => {


                const personal =
                    application.personalInformation ||
                    {};


                const academic =
                    application.academicInformation ||
                    {};


                const firstName =
                    personal.firstName ||
                    "";


                const lastName =
                    personal.lastName ||
                    "";


                const fullName =
                    `${firstName} ${lastName}`
                        .trim() ||
                    "Unknown Applicant";


                const school =
                    academic.schoolName ||
                    "---";


                const studentId =
                    academic.studentId ||
                    "---";


                const status =
                    application.status ||
                    "submitted";


                const applicationId =
                    application.applicantId ||
                    application.id ||
                    "---";


                const submittedDate =
                    formatDate(
                        application.submittedAt
                    );


                const statusLabel =
                    getStatusLabel(
                        status
                    );



                return `

                    <tr>

                        <td>

                            <strong>

                                ${escapeHtml(
                                    applicationId
                                )}

                            </strong>

                        </td>


                        <td>

                            ${escapeHtml(
                                fullName
                            )}

                        </td>


                        <td>

                            ${escapeHtml(
                                school
                            )}

                        </td>


                        <td>

                            ${escapeHtml(
                                studentId
                            )}

                        </td>


                        <td>

                            ${submittedDate}

                        </td>


                        <td>

                            <span class="status ${escapeHtml(status)}">

                                ${statusLabel}

                            </span>

                        </td>


                        <td>

                            <button
                                type="button"
                                class="view-btn"
                                data-id="${escapeHtml(application.id)}">

                                <i class="fas fa-eye"></i>

                                View

                            </button>

                        </td>

                    </tr>

                `;

            }
        ).join("");



    /* =====================================================
       VIEW BUTTONS
    ===================================================== */

    document
        .querySelectorAll(
            ".view-btn"
        )
        .forEach(
            (button) => {

                button.addEventListener(
                    "click",
                    function () {

                        const applicationId =
                            this.dataset.id;


                        console.log(
                            "Opening application:",
                            applicationId
                        );


                        window.location.href =
                            `application-review.html?id=${encodeURIComponent(applicationId)}`;

                    }
                );

            }
        );

}



/* =========================================================
   STATUS LABEL
========================================================= */

function getStatusLabel(status) {

    switch (status) {

        case "submitted":

            return "Pending Review";


        case "approved":

            return "Approved";


        case "rejected":

            return "Rejected";


        case "needs_correction":

            return "Needs Correction";


        default:

            return status || "Unknown";

    }

}



/* =========================================================
   DATE FORMAT
========================================================= */

function formatDate(timestamp) {

    if (!timestamp) {

        return "---";

    }


    try {

        let date;


        if (
            timestamp &&
            typeof timestamp.toDate === "function"
        ) {

            date =
                timestamp.toDate();

        }

        else {

            date =
                new Date(timestamp);

        }


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return "---";

        }


        return date.toLocaleDateString(
            "en-US",
            {
                year: "numeric",
                month: "short",
                day: "numeric"
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



/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(value) {

    return String(value)

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            '"',
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );

}



/* =========================================================
   SEARCH
========================================================= */

if (searchInput) {

    searchInput.addEventListener(
        "input",
        renderApplications
    );

}



/* =========================================================
   FILTER
========================================================= */

if (statusFilter) {

    statusFilter.addEventListener(
        "change",
        renderApplications
    );

}



/* =========================================================
   MOBILE SIDEBAR
========================================================= */

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



/* =========================================================
   NOTIFICATIONS
========================================================= */

if (notificationBtn) {

    notificationBtn.addEventListener(
        "click",
        function () {

            window.location.href =
                "notifications.html";

        }
    );

}



/* =========================================================
   LOGOUT
========================================================= */

if (logoutLink) {

    logoutLink.addEventListener(
        "click",
        async function (event) {

            event.preventDefault();


            const confirmLogout =
                confirm(
                    "Are you sure you want to logout?"
                );


            if (!confirmLogout) {

                return;

            }


            try {

                const {
                    signOut
                } = await import(
                    "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js"
                );


                await signOut(auth);


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

            }

        }
    );

}


console.log(
    "ScholarLink Applications page ready."
);
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

    getDocs,

    doc,

    writeBatch,

    serverTimestamp

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
   EXAM RESULT IMPORT ELEMENTS
========================================================= */


const examResultFile =

    document.getElementById(
        "examResultFile"
    );



const selectedExamFile =

    document.getElementById(
        "selectedExamFile"
    );



const processExamResultsBtn =

    document.getElementById(
        "processExamResults"
    );



const examImportStatus =

    document.getElementById(
        "examImportStatus"
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

                            <span
                                class="status ${escapeHtml(status)}"
                            >

                                ${statusLabel}

                            </span>

                        </td>



                        <td>

                            <button
                                type="button"
                                class="view-btn"
                                data-id="${escapeHtml(application.id)}"
                            >

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


        case "exam_taken":

            return "Exam Taken";


        case "passed":

            return "PASSED";


        case "failed":

            return "FAILED";


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



/* =========================================================
   =========================================================
   EXAM RESULT IMPORT
   =========================================================
========================================================= */



/* =========================================================
   FILE SELECTED
========================================================= */


if (examResultFile) {


    examResultFile.addEventListener(

        "change",

        function () {


            const file =

                this.files[0];


            if (!file) {


                selectedExamFile.innerHTML = `

                    <i class="fas fa-file"></i>

                    No file selected

                `;


                selectedExamFile.classList.remove(
                    "file-selected"
                );


                return;

            }



            selectedExamFile.innerHTML = `

                <i class="fas fa-file-excel"></i>

                ${escapeHtml(file.name)}

            `;


            selectedExamFile.classList.add(
                "file-selected"
            );

        }

    );

}



/* =========================================================
   SHOW IMPORT STATUS
========================================================= */


function showExamImportStatus(
    message,
    type = "success"
) {


    if (!examImportStatus) {

        return;

    }


    examImportStatus.className =

        `exam-import-status show ${type}`;


    examImportStatus.innerHTML =

        message;

}



/* =========================================================
   NORMALIZE APPLICANT ID
========================================================= */


function normalizeApplicantId(value) {


    if (

        value === undefined ||

        value === null

    ) {

        return "";

    }


    return String(value)

        .trim()

        .toUpperCase();

}



/* =========================================================
   FIND APPLICANT ID COLUMN
========================================================= */


function getApplicantIdFromRow(row) {


    const possibleKeys = [

        "Applicant ID",

        "ApplicantId",

        "ApplicantID",

        "applicantId",

        "applicant_id",

        "APPLICANT ID",

        "ID",

        "Id",

        "id"

    ];


    for (

        const key of possibleKeys

    ) {


        if (

            Object.prototype.hasOwnProperty.call(
                row,
                key
            )

        ) {


            const value =

                normalizeApplicantId(
                    row[key]
                );


            if (value) {

                return value;

            }

        }

    }


    return "";

}



/* =========================================================
   READ EXCEL / CSV FILE
========================================================= */


async function readExamResultFile(file) {


    if (!file) {

        throw new Error(
            "Please select a CSV or Excel file."
        );

    }


    if (
        typeof XLSX === "undefined"
    ) {

        throw new Error(
            "Excel reader library failed to load. Please refresh the page."
        );

    }


    const allowedExtensions = [

        ".csv",

        ".xlsx",

        ".xls"

    ];


    const fileName =

        file.name.toLowerCase();


    const validExtension =

        allowedExtensions.some(

            extension =>

                fileName.endsWith(extension)

        );


    if (!validExtension) {

        throw new Error(
            "Please upload a CSV, XLSX, or XLS file."
        );

    }


    const arrayBuffer =

        await file.arrayBuffer();


    const workbook =

        XLSX.read(

            arrayBuffer,

            {
                type: "array"
            }

        );


    if (

        !workbook.SheetNames ||

        workbook.SheetNames.length === 0

    ) {

        throw new Error(
            "The uploaded file does not contain a worksheet."
        );

    }


    const firstSheetName =

        workbook.SheetNames[0];


    const worksheet =

        workbook.Sheets[
            firstSheetName
        ];


    const rows =

        XLSX.utils.sheet_to_json(

            worksheet,

            {
                defval: ""
            }

        );


    if (!rows.length) {

        throw new Error(
            "The uploaded file is empty."
        );

    }


    const passedApplicantIds = new Set();


    rows.forEach(

        row => {


            const applicantId =

                getApplicantIdFromRow(row);


            if (applicantId) {

                passedApplicantIds.add(
                    applicantId
                );

            }

        }

    );


    if (
        passedApplicantIds.size === 0
    ) {

        throw new Error(
            "No Applicant ID was found. Please check the column name in your file."
        );

    }


    return {

        rows,

        passedApplicantIds

    };

}



/* =========================================================
   DETERMINE IF APPLICANT TOOK EXAM
========================================================= */


function hasTakenExam(application) {


    /*
       We support several possible field names
       so this will work with different versions
       of your Firestore application structure.
    */


    const examTakenValues = [

        application.examTaken,

        application.hasTakenExam,

        application.examCompleted,

        application.examStatus,

        application.exam_status,

        application.status

    ];


    for (

        const value of examTakenValues

    ) {


        if (

            value === true

        ) {

            return true;

        }


        if (

            typeof value === "string"

        ) {


            const normalized =

                value
                    .trim()
                    .toLowerCase();


            if (

                normalized === "exam_taken" ||

                normalized === "exam taken" ||

                normalized === "taken" ||

                normalized === "completed" ||

                normalized === "exam_completed"

            ) {

                return true;

            }

        }

    }


    return false;

}



/* =========================================================
   PROCESS EXAM RESULTS
========================================================= */


async function processExamResults() {


    if (!examResultFile) {

        return;

    }


    const file =

        examResultFile.files[0];


    if (!file) {


        showExamImportStatus(

            `
                <i class="fas fa-triangle-exclamation"></i>
                Please select the passed applicants file first.
            `,

            "warning"

        );


        return;

    }



    const confirmed =

        confirm(

            "This will automatically mark exam takers as PASSED or FAILED based on the uploaded Applicant IDs.\n\nContinue?"

        );


    if (!confirmed) {

        return;

    }



    try {


        processExamResultsBtn.disabled = true;


        processExamResultsBtn.innerHTML = `

            <i class="fas fa-spinner fa-spin"></i>

            Processing...

        `;


        showExamImportStatus(

            `
                <i class="fas fa-spinner fa-spin"></i>
                Reading exam result file...
            `,

            "warning"

        );



        /* =================================================
           READ FILE
        ================================================= */


        const {

            passedApplicantIds

        } = await readExamResultFile(file);



        console.log(
            "Passed Applicant IDs:",
            passedApplicantIds
        );



        /* =================================================
           GET EXAM TAKERS
        ================================================= */


        const examTakers =

            applications.filter(

                application =>

                    hasTakenExam(application)

            );



        if (
            examTakers.length === 0
        ) {


            throw new Error(

                "No applicants who took the exam were found in Firestore. Check the exam status field first."

            );

        }



        /* =================================================
           PREPARE RESULTS
        ================================================= */


        const results = [];


        examTakers.forEach(

            application => {


                const applicantId =

                    normalizeApplicantId(

                        application.applicantId

                    );


                if (!applicantId) {

                    return;

                }


                const passed =

                    passedApplicantIds.has(
                        applicantId
                    );


                results.push({

                    application,

                    applicantId,

                    result:
                        passed
                            ? "passed"
                            : "failed"

                });

            }

        );



        if (
            results.length === 0
        ) {

            throw new Error(

                "No exam takers have a valid Applicant ID."

            );

        }



        /* =================================================
           CONFIRM SUMMARY
        ================================================= */


        const passedCount =

            results.filter(

                item =>

                    item.result === "passed"

            ).length;


        const failedCount =

            results.filter(

                item =>

                    item.result === "failed"

            ).length;



        const finalConfirm =

            confirm(

                `Exam Result Summary\n\n` +

                `Exam Takers: ${results.length}\n` +

                `PASSED: ${passedCount}\n` +

                `FAILED: ${failedCount}\n\n` +

                `Continue updating Firestore?`

            );


        if (!finalConfirm) {

            return;

        }



        /* =================================================
           FIRESTORE BATCH UPDATE
        ================================================= */


        const chunkSize = 400;


        for (

            let start = 0;

            start < results.length;

            start += chunkSize

        ) {


            const chunk =

                results.slice(
                    start,
                    start + chunkSize
                );


            const batch =

                writeBatch(db);


            chunk.forEach(

                item => {


                    const applicationRef =

                        doc(

                            db,

                            "applications",

                            item.application.id

                        );


                    batch.update(

                        applicationRef,

                        {

                            status:
                                item.result,

                            examResult:
                                item.result,

                            examStatus:
                                item.result,

                            examResultUpdatedAt:
                                serverTimestamp()

                        }

                    );

                }

            );


            await batch.commit();

        }



        /* =================================================
           UPDATE LOCAL DATA
        ================================================= */


        results.forEach(

            item => {


                const localApplication =

                    applications.find(

                        application =>

                            application.id ===
                            item.application.id

                    );


                if (localApplication) {


                    localApplication.status =
                        item.result;


                    localApplication.examResult =
                        item.result;


                    localApplication.examStatus =
                        item.result;

                }

            }

        );



        renderApplications();



        /* =================================================
           SUCCESS MESSAGE
        ================================================= */


        showExamImportStatus(

            `

                <strong>
                    <i class="fas fa-circle-check"></i>
                    Exam results processed successfully!
                </strong>

                <br>

                ${results.length} exam taker(s) processed.

                <br>

                <strong>
                    PASSED:
                </strong>
                ${passedCount}

                &nbsp;&nbsp;

                <strong>
                    FAILED:
                </strong>
                ${failedCount}

            `,

            "success"

        );


        /* =================================================
           RESET FILE INPUT
        ================================================= */


        examResultFile.value = "";


        selectedExamFile.innerHTML = `

            <i class="fas fa-file"></i>

            No file selected

        `;


        selectedExamFile.classList.remove(
            "file-selected"
        );

    }


    catch (error) {


        console.error(
            "Exam result import error:",
            error
        );


        showExamImportStatus(

            `

                <strong>
                    <i class="fas fa-circle-exclamation"></i>
                    Failed to process exam results.
                </strong>

                <br>

                ${escapeHtml(
                    error.message
                )}

            `,

            "error"

        );

    }


    finally {


        processExamResultsBtn.disabled = false;


        processExamResultsBtn.innerHTML = `

            <i class="fas fa-check-double"></i>

            Process Exam Results

        `;

    }

}



/* =========================================================
   PROCESS BUTTON
========================================================= */


if (processExamResultsBtn) {


    processExamResultsBtn.addEventListener(

        "click",

        processExamResults

    );

}



/* =========================================================
   READY
========================================================= */


console.log(
    "ScholarLink Applications page ready."
);


console.log(
    "Exam Result Import feature ready."
);
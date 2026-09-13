/* =========================================================
   SCHOLARLINK
   APPLICATION STATUS
========================================================= */

/* =========================================================
   FIREBASE
========================================================= */

import {
    auth,
    db
} from "../firebase.js";

/* =========================================================
   SUPABASE
========================================================= */

import {
    supabase
} from "../supabase.js";

/* =========================================================
   FIREBASE AUTH
========================================================= */

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

/* =========================================================
   FIRESTORE
========================================================= */

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";


/* =========================================================
   ELEMENT HELPER
========================================================= */

function getElement(id) {
    return document.getElementById(id);
}


/* =========================================================
   SET TEXT
========================================================= */

function setText(id, value) {

    const element = getElement(id);

    if (!element) {
        return;
    }

    if (
        value !== undefined &&
        value !== null &&
        value !== ""
    ) {
        element.textContent = value;
    } else {
        element.textContent = "---";
    }
}


/* =========================================================
   DATE FORMAT
========================================================= */

function formatDate(value) {

    if (!value) {
        return "---";
    }

    try {

        let date;

        /* Firebase Timestamp */
        if (
            typeof value === "object" &&
            typeof value.toDate === "function"
        ) {
            date = value.toDate();
        }

        /* JavaScript Date */
        else if (value instanceof Date) {
            date = value;
        }

        /* Firestore Timestamp object */
        else if (
            typeof value === "object" &&
            typeof value.seconds === "number"
        ) {
            date = new Date(
                value.seconds * 1000
            );
        }

        /* String / Number */
        else {
            date = new Date(value);
        }

        if (
            !date ||
            isNaN(date.getTime())
        ) {
            return "---";
        }

        return date.toLocaleDateString(
            "en-US",
            {
                month: "long",
                day: "numeric",
                year: "numeric"
            }
        );

    } catch (error) {

        console.error(
            "Date formatting error:",
            error
        );

        return "---";
    }
}


/* =========================================================
   GET APPLICATION ID
========================================================= */

function getApplicationId(
    application,
    uid
) {

    if (
        application &&
        application.applicantId
    ) {
        return application.applicantId;
    }

    if (
        application &&
        application.applicationId
    ) {
        return application.applicationId;
    }

    if (uid) {
        return (
            "APP-" +
            uid
                .substring(0, 8)
                .toUpperCase()
        );
    }

    return "---";
}


/* =========================================================
   UPDATE CURRENT STATUS
========================================================= */

function updateCurrentStatus(
    title,
    description
) {

    setText(
        "currentStatus",
        title
    );

    setText(
        "statusDescription",
        description
    );
}


/* =========================================================
   RESET STEP
========================================================= */

function resetStep(id) {

    const step = getElement(id);

    if (!step) {
        return;
    }

    step.classList.remove(
        "completed",
        "active",
        "failed"
    );
}


/* =========================================================
   SET STEP COMPLETED
========================================================= */

function setCompleted(id) {

    const step = getElement(id);

    if (!step) {
        return;
    }

    step.classList.remove(
        "active",
        "failed"
    );

    step.classList.add(
        "completed"
    );
}


/* =========================================================
   SET STEP ACTIVE
========================================================= */

function setActive(id) {

    const step = getElement(id);

    if (!step) {
        return;
    }

    step.classList.remove(
        "completed",
        "failed"
    );

    step.classList.add(
        "active"
    );
}


/* =========================================================
   SET STEP FAILED
========================================================= */

function setFailed(id) {

    const step = getElement(id);

    if (!step) {
        return;
    }

    step.classList.remove(
        "active",
        "completed"
    );

    step.classList.add(
        "failed"
    );
}


/* =========================================================
   SET BADGE
========================================================= */

function setBadge(
    id,
    text,
    type = "pending"
) {

    const badge = getElement(id);

    if (!badge) {
        return;
    }

    badge.textContent = text;

    badge.className = "status-badge";

    if (type === "completed") {

        badge.classList.add(
            "completed-badge"
        );

    }

    else if (type === "scheduled") {

        badge.classList.add(
            "scheduled-badge"
        );

    }

    else if (type === "passed") {

        badge.classList.add(
            "passed-badge"
        );

    }

    else if (type === "failed") {

        badge.classList.add(
            "failed-badge"
        );

    }

    else {

        badge.classList.add(
            "pending-badge"
        );
    }
}


/* =========================================================
   LOAD APPLICANT PHOTO
========================================================= */

async function loadApplicantPhoto(
    application,
    uid
) {

    const image =
        getElement(
            "applicantPhoto"
        );

    const defaultIcon =
        getElement(
            "defaultApplicantIcon"
        );

    if (!image) {

        console.warn(
            "Applicant photo element not found."
        );

        return;
    }

    /* =====================================================
       APPLICATION FILE STRUCTURE

       applications/{uid}

       files: {
           applicantPhoto: {
               fileName: "...",
               storagePath: "uid/profile.jpg",
               uploadedAt: "..."
           }
       }
    ===================================================== */

    const photo =
        application?.files?.applicantPhoto ||
        null;


    /* =====================================================
       NO PHOTO
    ===================================================== */

    if (
        !photo ||
        !photo.storagePath
    ) {

        image.style.display = "none";

        if (defaultIcon) {
            defaultIcon.style.display = "block";
        }

        console.log(
            "No applicant photo found."
        );

        return;
    }


    /* =====================================================
       LOAD PHOTO FROM PRIVATE SUPABASE BUCKET
    ===================================================== */

    try {

        console.log(
            "Loading applicant photo:",
            photo.storagePath
        );

        const {
            data,
            error
        } =
            await supabase.storage
                .from("applicant-photos")
                .createSignedUrl(
                    photo.storagePath,
                    300
                );


        /* =================================================
           SUPABASE ERROR
        ================================================= */

        if (error) {

            console.error(
                "Applicant photo URL error:",
                error
            );

            image.style.display = "none";

            if (defaultIcon) {
                defaultIcon.style.display = "block";
            }

            return;
        }


        /* =================================================
           SIGNED URL SUCCESS
        ================================================= */

        if (
            data &&
            data.signedUrl
        ) {

            image.src =
                data.signedUrl;

            image.style.display =
                "block";

            image.style.visibility =
                "visible";

            image.style.opacity =
                "1";

            if (defaultIcon) {
                defaultIcon.style.display =
                    "none";
            }

            console.log(
                "Applicant photo displayed successfully."
            );
        }

    } catch (error) {

        console.error(
            "Applicant photo loading error:",
            error
        );

        image.style.display =
            "none";

        if (defaultIcon) {
            defaultIcon.style.display =
                "block";
        }
    }
}


/* =========================================================
   BUILD FULL NAME
========================================================= */

function buildFullName(
    personalInformation,
    application
) {

    const firstName =
        personalInformation.firstName ||
        application.firstName ||
        "";

    const middleName =
        personalInformation.middleName ||
        application.middleName ||
        "";

    const lastName =
        personalInformation.lastName ||
        application.lastName ||
        "";

    const suffix =
        personalInformation.suffix ||
        application.suffix ||
        "";

    const parts = [
        firstName,
        middleName,
        lastName,
        suffix
    ].filter(
        value =>
            value &&
            value.trim &&
            value.trim() !== ""
    );

    if (parts.length > 0) {
        return parts.join(" ");
    }

    return "---";
}


/* =========================================================
   GET FULL NAME FROM USER
========================================================= */

function getFullName(userData) {

    if (!userData) {
        return "---";
    }

    const firstName =
        userData.firstName ||
        "";

    const middleName =
        userData.middleName ||
        "";

    const lastName =
        userData.lastName ||
        "";

    const suffix =
        userData.suffix ||
        "";

    const fullName = [
        firstName,
        middleName,
        lastName,
        suffix
    ]
        .filter(
            value =>
                value &&
                value.trim &&
                value.trim() !== ""
        )
        .join(" ");

    return (
        fullName ||
        userData.fullName ||
        "---"
    );
}


/* =========================================================
   BUILD ADDRESS
========================================================= */

function buildAddress(
    personalInformation
) {

    if (!personalInformation) {
        return "---";
    }

    const parts = [
        personalInformation.completeAddress,
        personalInformation.barangay,
        personalInformation.municipalityCity,
        personalInformation.city,
        personalInformation.province,
        personalInformation.zipCode
    ].filter(
        value =>
            value !== undefined &&
            value !== null &&
            String(value).trim() !== ""
    );

    if (parts.length === 0) {
        return "---";
    }

    return parts.join(", ");
}


/* =========================================================
   LOAD USER APPLICATION
========================================================= */

async function loadApplication(user) {

    try {

        if (!user) {
            return;
        }

        const uid =
            user.uid;


        /* =================================================
           DEBUG - CHECK CURRENT USER AND APPLICATION
        ================================================= */

        console.log(
            "================================="
        );

        console.log(
            "STATUS PAGE USER UID:",
            uid
        );

        const testRef =
            doc(
                db,
                "applications",
                uid
            );

        const testSnap =
            await getDoc(
                testRef
            );

        console.log(
            "APPLICATION EXISTS:",
            testSnap.exists()
        );

        if (testSnap.exists()) {

            console.log(
                "APPLICATION DATA:",
                testSnap.data()
            );

        } else {

            console.error(
                "NO APPLICATION DOCUMENT FOUND:",
                uid
            );
        }

        console.log(
            "================================="
        );


        /* =================================================
           USER DOCUMENT
        ================================================= */

        const userRef =
            doc(
                db,
                "users",
                uid
            );

        const userSnapshot =
            await getDoc(
                userRef
            );

        let userData = {};

        if (
            userSnapshot.exists()
        ) {

            userData =
                userSnapshot.data();
        }


        /* =================================================
           APPLICATION DOCUMENT
        ================================================= */

        const applicationRef =
            doc(
                db,
                "applications",
                uid
            );

        const applicationSnapshot =
            await getDoc(
                applicationRef
            );


        /* =================================================
           NO APPLICATION
        ================================================= */

        if (
            !applicationSnapshot.exists()
        ) {

            updateCurrentStatus(
                "NO APPLICATION FOUND",
                "We could not find a scholarship application associated with this account."
            );

            setText(
                "applicationId",
                "---"
            );

            setText(
                "dateSubmitted",
                "---"
            );

            setText(
                "fullName",
                getFullName(
                    userData
                )
            );

            setText(
                "email",
                user.email ||
                userData.email ||
                "---"
            );

            return;
        }


        /* =================================================
           APPLICATION DATA
        ================================================= */

        const application =
            applicationSnapshot.data();

        console.log(
            "Application loaded:",
            application
        );


        /* =================================================
           APPLICATION ID
        ================================================= */

        const applicationId =
            getApplicationId(
                application,
                uid
            );

        setText(
            "applicationId",
            applicationId
        );


        /* =================================================
           SUBMITTED DATE
        ================================================= */

        const submittedDate =
            application.submittedAt ||
            application.createdAt ||
            application.updatedAt;

        setText(
            "dateSubmitted",
            formatDate(
                submittedDate
            )
        );


        /* =================================================
           PERSONAL INFORMATION
        ================================================= */

        const personalInformation =
            application.personalInformation ||
            {};


        /* =================================================
           ACADEMIC INFORMATION
        ================================================= */

        const academicInformation =
            application.academicInformation ||
            application.educationalInformation ||
            {};


        /* =================================================
           FULL NAME
        ================================================= */

        const fullName =
            buildFullName(
                personalInformation,
                application
            );

        setText(
            "fullName",
            fullName
        );


        /* =================================================
           EMAIL
        ================================================= */

        const email =
            personalInformation.email ||
            application.email ||
            userData.email ||
            user.email ||
            "---";

        setText(
            "email",
            email
        );


        /* =================================================
           SCHOOL
        ================================================= */

        const schoolName =
            academicInformation.schoolName ||
            academicInformation.school ||
            application.schoolName ||
            "---";

        setText(
            "schoolName",
            schoolName
        );


        /* =================================================
           STUDENT ID / LRN
        ================================================= */

        const studentId =
            academicInformation.studentId ||
            academicInformation.studentID ||
            academicInformation.lrn ||
            application.studentId ||
            application.studentID ||
            application.lrn ||
            "---";

        setText(
            "studentId",
            studentId
        );


        /* =================================================
           GRADUATION YEAR
        ================================================= */

        const graduationYear =
            academicInformation.expectedGraduationYear ||
            academicInformation.graduationYear ||
            application.expectedGraduationYear ||
            application.graduationYear ||
            "---";

        setText(
            "graduationYear",
            graduationYear
        );


        /* =================================================
           ADDRESS
        ================================================= */

        const address =
            personalInformation.completeAddress ||
            personalInformation.address ||
            application.address ||
            buildAddress(
                personalInformation
            );

        setText(
            "address",
            address
        );


        /* =================================================
           LOAD APPLICANT PHOTO
        ================================================= */

        await loadApplicantPhoto(
            application,
            uid
        );


        /* =================================================
           LOAD APPLICATION STATUS
        ================================================= */

        loadApplicationStatus(
            application,
            userData
        );

    }

    catch (error) {

        console.error(
            "Application status error:",
            error
        );

        updateCurrentStatus(
            "UNABLE TO LOAD STATUS",
            "There was a problem loading your application status. Please refresh the page."
        );
    }
}


/* =========================================================
   LOAD APPLICATION STATUS
========================================================= */

function loadApplicationStatus(
    application,
    userData
) {

    const status =
        String(
            application.status ||
            userData.applicationStatus ||
            "pending"
        )
            .toLowerCase()
            .replace(
                /\s+/g,
                "_"
            );


    const examStatus =
        String(
            application.examStatus ||
            ""
        )
            .toLowerCase()
            .replace(
                /\s+/g,
                "_"
            );


    const examResult =
        String(
            application.examResult ||
            application.result ||
            ""
        )
            .toLowerCase()
            .replace(
                /\s+/g,
                "_"
            );


    const scholarConfirmed =
        application.scholarConfirmed === true ||
        userData.scholarConfirmed === true;


    /* =====================================================
       RESET ALL STEPS
    ===================================================== */

    const stepIds = [
        "stepScreening",
        "stepExam",
        "stepResult",
        "stepConfirmation",
        "stepScholarAccount"
    ];

    stepIds.forEach(
        resetStep
    );


    /* =====================================================
       RESET BADGES
    ===================================================== */

    setBadge(
        "screeningBadge",
        "PENDING",
        "pending"
    );

    setBadge(
        "examBadge",
        "PENDING",
        "pending"
    );

    setBadge(
        "resultBadge",
        "PENDING",
        "pending"
    );

    setBadge(
        "confirmationBadge",
        "PENDING",
        "pending"
    );

    setBadge(
        "accountBadge",
        "PENDING",
        "pending"
    );


    /* =====================================================
       SUBMITTED / PENDING
    ===================================================== */

    if (
        status === "submitted" ||
        status === "pending" ||
        status === "pending_review" ||
        status === "for_review"
    ) {

        setActive(
            "stepScreening"
        );

        setBadge(
            "screeningBadge",
            "PENDING REVIEW",
            "pending"
        );

        updateCurrentStatus(
            "PENDING REVIEW",
            "Your application has been submitted and is waiting for administrator review."
        );

        setText(
            "screeningDescription",
            "Your application is currently being reviewed by the administrator."
        );

        return;
    }


    /* =====================================================
       UNDER REVIEW
    ===================================================== */

    if (
        status === "under_review" ||
        status === "reviewing" ||
        status === "screening"
    ) {

        setActive(
            "stepScreening"
        );

        setBadge(
            "screeningBadge",
            "UNDER REVIEW",
            "pending"
        );

        updateCurrentStatus(
            "APPLICATION UNDER REVIEW",
            "Your application is currently being reviewed by the scholarship administrator."
        );

        setText(
            "screeningDescription",
            "The administrator is checking your application and submitted requirements."
        );

        return;
    }


    /* =====================================================
       SCREENING PASSED / QUALIFIED
    ===================================================== */

    if (
        status === "qualified" ||
        status === "screening_passed" ||
        status === "exam_qualified"
    ) {

        setCompleted(
            "stepScreening"
        );

        setActive(
            "stepExam"
        );

        setBadge(
            "screeningBadge",
            "PASSED",
            "completed"
        );

        setBadge(
            "examBadge",
            "WAITING FOR SCHEDULE",
            "pending"
        );

        updateCurrentStatus(
            "QUALIFIED FOR EXAM",
            "Congratulations! Your application passed the initial screening."
        );

        setText(
            "screeningDescription",
            "Your application passed the initial screening."
        );

        setText(
            "examDescription",
            "You qualified for the examination. Please wait for the administrator to provide your examination schedule."
        );

        return;
    }


    /* =====================================================
       EXAM SCHEDULED
    ===================================================== */

    if (
        status === "exam_scheduled" ||
        examStatus === "scheduled"
    ) {

        setCompleted(
            "stepScreening"
        );

        setActive(
            "stepExam"
        );

        setBadge(
            "screeningBadge",
            "PASSED",
            "completed"
        );

        setBadge(
            "examBadge",
            "SCHEDULED",
            "scheduled"
        );


        if (
            application.examDate
        ) {

            setText(
                "examDate",
                formatDate(
                    application.examDate
                )
            );
        }


        if (
            application.examTime
        ) {

            setText(
                "examTime",
                application.examTime
            );
        }


        if (
            application.examVenue
        ) {

            setText(
                "examVenue",
                application.examVenue
            );
        }


        const examLink =
            application.examLink;

        const examLinkBtn =
            getElement(
                "examLinkBtn"
            );

        if (
            examLink &&
            examLinkBtn
        ) {

            examLinkBtn.style.display =
                "inline-flex";

            examLinkBtn.onclick =
                () => {

                    window.open(
                        examLink,
                        "_blank"
                    );
                };
        }


        updateCurrentStatus(
            "EXAM SCHEDULED",
            "You qualified for the examination. Please check the exam date, time, and venue below."
        );

        return;
    }


    /* =====================================================
       EXAM TAKEN
    ===================================================== */

    if (
        status === "exam_taken" ||
        examStatus === "taken"
    ) {

        setCompleted(
            "stepScreening"
        );

        setCompleted(
            "stepExam"
        );

        setActive(
            "stepResult"
        );

        setBadge(
            "screeningBadge",
            "COMPLETED",
            "completed"
        );

        setBadge(
            "examBadge",
            "COMPLETED",
            "completed"
        );

        setBadge(
            "resultBadge",
            "PENDING",
            "pending"
        );

        updateCurrentStatus(
            "EXAM TAKEN",
            "Your examination has been completed. Please wait for the administrator to record the result."
        );

        setText(
            "examDescription",
            "Your examination has been completed."
        );

        setText(
            "resultDescription",
            "The administrator is currently processing your examination result."
        );

        return;
    }


    /* =====================================================
       PASSED
    ===================================================== */

    if (
        examResult === "passed" ||
        status === "passed"
    ) {

        setCompleted(
            "stepScreening"
        );

        setCompleted(
            "stepExam"
        );

        setCompleted(
            "stepResult"
        );

        setBadge(
            "screeningBadge",
            "COMPLETED",
            "completed"
        );

        setBadge(
            "examBadge",
            "COMPLETED",
            "completed"
        );

        setBadge(
            "resultBadge",
            "PASSED",
            "passed"
        );

        setText(
            "resultDescription",
            "Congratulations! You passed the examination."
        );


        /* =================================================
           SCHOLAR CONFIRMED
        ================================================= */

        if (
            scholarConfirmed ||
            status === "scholar_confirmed" ||
            status === "active"
        ) {

            setCompleted(
                "stepConfirmation"
            );

            setCompleted(
                "stepScholarAccount"
            );

            setBadge(
                "confirmationBadge",
                "CONFIRMED",
                "completed"
            );

            setBadge(
                "accountBadge",
                "ACTIVE",
                "completed"
            );

            updateCurrentStatus(
                "SCHOLAR ACCOUNT ACTIVATED",
                "Congratulations! Your scholarship account has been activated."
            );

            setText(
                "confirmationDescription",
                "The administrator has confirmed you as a scholar."
            );

            setText(
                "accountDescription",
                "Your scholar account is active and ready to use."
            );

            return;
        }


        /* =================================================
           WAITING FOR CONFIRMATION
        ================================================= */

        setActive(
            "stepConfirmation"
        );

        setBadge(
            "confirmationBadge",
            "PENDING",
            "pending"
        );

        updateCurrentStatus(
            "PASSED - FOR CONFIRMATION",
            "Congratulations! You passed the examination. Please wait for the administrator to confirm your scholarship."
        );

        setText(
            "confirmationDescription",
            "You passed the examination. The administrator must confirm your scholarship."
        );

        return;
    }


    /* =====================================================
       FAILED EXAM
    ===================================================== */

    if (
        examResult === "failed" ||
        status === "failed"
    ) {

        setCompleted(
            "stepScreening"
        );

        setCompleted(
            "stepExam"
        );

        setFailed(
            "stepResult"
        );

        setBadge(
            "screeningBadge",
            "COMPLETED",
            "completed"
        );

        setBadge(
            "examBadge",
            "COMPLETED",
            "completed"
        );

        setBadge(
            "resultBadge",
            "FAILED",
            "failed"
        );

        updateCurrentStatus(
            "NOT SELECTED",
            "Unfortunately, you did not pass the examination."
        );

        setText(
            "resultDescription",
            "You did not pass the examination and were not selected for the scholarship."
        );

        return;
    }


    /* =====================================================
       SCHOLAR CONFIRMED
    ===================================================== */

    if (
        status === "scholar_confirmed"
    ) {

        setCompleted(
            "stepScreening"
        );

        setCompleted(
            "stepExam"
        );

        setCompleted(
            "stepResult"
        );

        setCompleted(
            "stepConfirmation"
        );

        setBadge(
            "screeningBadge",
            "COMPLETED",
            "completed"
        );

        setBadge(
            "examBadge",
            "COMPLETED",
            "completed"
        );

        setBadge(
            "resultBadge",
            "PASSED",
            "passed"
        );

        setBadge(
            "confirmationBadge",
            "CONFIRMED",
            "completed"
        );

        setActive(
            "stepScholarAccount"
        );

        updateCurrentStatus(
            "SCHOLAR CONFIRMED",
            "The administrator has confirmed your scholarship. Your account is being activated."
        );

        return;
    }


    /* =====================================================
       ACTIVE SCHOLAR
    ===================================================== */

    if (
        status === "active"
    ) {

        setCompleted(
            "stepScreening"
        );

        setCompleted(
            "stepExam"
        );

        setCompleted(
            "stepResult"
        );

        setCompleted(
            "stepConfirmation"
        );

        setCompleted(
            "stepScholarAccount"
        );

        setBadge(
            "screeningBadge",
            "COMPLETED",
            "completed"
        );

        setBadge(
            "examBadge",
            "COMPLETED",
            "completed"
        );

        setBadge(
            "resultBadge",
            "PASSED",
            "passed"
        );

        setBadge(
            "confirmationBadge",
            "CONFIRMED",
            "completed"
        );

        setBadge(
            "accountBadge",
            "ACTIVE",
            "completed"
        );

        updateCurrentStatus(
            "SCHOLAR ACCOUNT ACTIVATED",
            "Congratulations! Your scholarship account is active."
        );

        setText(
            "accountDescription",
            "Your scholar account is active and ready to use."
        );

        return;
    }


    /* =====================================================
       DEFAULT
    ===================================================== */

    setActive(
        "stepScreening"
    );

    setBadge(
        "screeningBadge",
        "PENDING REVIEW",
        "pending"
    );

    updateCurrentStatus(
        "PENDING REVIEW",
        "Your application has been submitted and is waiting for administrator review."
    );
}


/* =========================================================
   AUTH STATE
========================================================= */

onAuthStateChanged(
    auth,
    async (user) => {

        if (!user) {

            console.warn(
                "No authenticated applicant."
            );

            window.location.href =
                "registration.html";

            return;
        }


        /* =============================================
           LOAD APPLICATION
        ============================================= */

        await loadApplication(
            user
        );
    }
);
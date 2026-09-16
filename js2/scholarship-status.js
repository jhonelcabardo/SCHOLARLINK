/*=========================================================
  SCHOLARLINK
  Scholarship Status JavaScript
==========================================================*/

import { auth, db } from "../firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
    doc,
    getDoc,
    collection,
    query,
    where,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";


/*=========================================================
  GLOBAL DATA
==========================================================*/

let currentUser = null;
let currentUserData = {};
let currentApplication = {};
let currentScholar = {};


/*=========================================================
  DOM READY
==========================================================*/

document.addEventListener("DOMContentLoaded", () => {

    console.log("Scholarship Status Loaded");

    initializePrintButton();
    initializeDownloadButton();
    initializeSidebar();
    initializeCardAnimations();
    initializeBenefitEffects();
    initializeTableEffects();
    initializeTimelineEffects();

});


/*=========================================================
  FIREBASE AUTH
==========================================================*/

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        console.warn("No authenticated user.");

        window.location.href = "../login/index.html";

        return;
    }

    currentUser = user;

    console.log("Authenticated User:", user.uid);

    try {

        await loadScholarData();

        updateScholarshipStatusPage();

    } catch (error) {

        console.error(
            "Error loading scholarship status:",
            error
        );

        showLoadError();

    }

});


/*=========================================================
  LOAD SCHOLAR DATA
==========================================================*/

async function loadScholarData() {

    const uid = currentUser.uid;

    /*-------------------------------------------------------
      USERS
    -------------------------------------------------------*/

    try {

        const userSnap = await getDoc(
            doc(db, "users", uid)
        );

        if (userSnap.exists()) {

            currentUserData = {
                id: userSnap.id,
                ...userSnap.data()
            };

        }

    } catch (error) {

        console.warn(
            "Unable to load users document:",
            error
        );

    }


    /*-------------------------------------------------------
      APPLICATIONS
    -------------------------------------------------------*/

    try {

        const applicationSnap = await getDoc(
            doc(db, "applications", uid)
        );

        if (applicationSnap.exists()) {

            currentApplication = {
                id: applicationSnap.id,
                ...applicationSnap.data()
            };

        }

    } catch (error) {

        console.warn(
            "Unable to load applications document:",
            error
        );

    }


    /*-------------------------------------------------------
      SCHOLARS
    -------------------------------------------------------*/

    try {

        const scholarSnap = await getDoc(
            doc(db, "scholars", uid)
        );

        if (scholarSnap.exists()) {

            currentScholar = {
                id: scholarSnap.id,
                ...scholarSnap.data()
            };

        }

    } catch (error) {

        console.warn(
            "Direct scholar lookup failed:",
            error
        );

    }


    /*-------------------------------------------------------
      FALLBACK:
      scholars where userId == Firebase UID
    -------------------------------------------------------*/

    if (Object.keys(currentScholar).length === 0) {

        try {

            const scholarQuery = query(
                collection(db, "scholars"),
                where("userId", "==", uid)
            );

            const scholarSnapshot =
                await getDocs(scholarQuery);

            if (!scholarSnapshot.empty) {

                const scholarDoc =
                    scholarSnapshot.docs[0];

                currentScholar = {
                    id: scholarDoc.id,
                    ...scholarDoc.data()
                };

            }

        } catch (error) {

            console.warn(
                "Scholar userId lookup failed:",
                error
            );

        }

    }


    console.log("User Data:", currentUserData);
    console.log("Application Data:", currentApplication);
    console.log("Scholar Data:", currentScholar);

}


/*=========================================================
  MAIN PAGE UPDATE
==========================================================*/

function updateScholarshipStatusPage() {

    updateProfile();

    updateSummaryCards();

    updateAcademicInformation();

    updateScholarshipProgress();

    updateTimeline();

    updateAcademicStanding();

    updateCompliance();

    updateBenefits();

    updateAdminRemarks();

    updateScholarshipHistory();

    updateStatusMessage();

}


/*=========================================================
  PROFILE
==========================================================*/

function updateProfile() {

    const fullName = getScholarName();

    const scholarId = getScholarId();

    const profileImage =
        currentScholar.profilePhoto ||
        currentScholar.photoURL ||
        currentScholar.photo ||
        currentScholar.image ||
        currentApplication.profilePhoto ||
        currentApplication.photoURL ||
        currentApplication.photo ||
        currentUserData.profilePhoto ||
        currentUserData.photoURL ||
        currentUserData.photo ||
        "images/user.png";


    /* Top profile */

    setText(
        ".profile-top h4",
        fullName
    );

    setText(
        ".profile-top small",
        scholarId
    );


    const profileImg =
        document.querySelector(".profile-top img");

    if (profileImg) {

        profileImg.src = profileImage;

        profileImg.onerror = () => {

            profileImg.src = "images/user.png";

        };

    }


    /* Compatibility with newer HTML */

    setText(
        "#headerScholarName",
        fullName
    );

    setText(
        "#headerScholarId",
        scholarId
    );

    const avatar =
        document.getElementById("profileAvatar");

    if (avatar) {

        avatar.src = profileImage;

    }

}


/*=========================================================
  SCHOLAR NAME
==========================================================*/

function getScholarName() {

    const source =
        currentScholar.fullName ||
        currentScholar.name
            ? currentScholar
            : (
                currentApplication.fullName ||
                currentApplication.name
                    ? currentApplication
                    : currentUserData
            );


    if (source.fullName) {

        return source.fullName;

    }


    if (source.name) {

        return source.name;

    }


    const firstName =
        source.firstName ||
        source.firstname ||
        "";

    const middleName =
        source.middleName ||
        source.middlename ||
        "";

    const lastName =
        source.lastName ||
        source.lastname ||
        "";

    const suffix =
        source.suffix ||
        "";


    const name = [
        firstName,
        middleName,
        lastName,
        suffix
    ]
        .filter(Boolean)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();


    return name || "Not available";

}


/*=========================================================
  SCHOLAR ID
==========================================================*/

function getScholarId() {

    return (
        currentScholar.scholarId ||
        currentScholar.scholarID ||
        currentApplication.scholarId ||
        currentApplication.scholarID ||
        currentUserData.scholarId ||
        currentUserData.scholarID ||
        "Not assigned"
    );

}


/*=========================================================
  SCHOLARSHIP PROGRAM
==========================================================*/

function getScholarshipProgram() {

    return (
        currentScholar.scholarshipProgram ||
        currentScholar.program ||
        currentScholar.scholarshipName ||
        currentApplication.scholarshipProgram ||
        currentApplication.program ||
        currentApplication.scholarshipName ||
        currentUserData.scholarshipProgram ||
        currentUserData.program ||
        "Not available"
    );

}


/*=========================================================
  SCHOLARSHIP STATUS
==========================================================*/

function getScholarStatus() {

    return (
        currentScholar.scholarStatus ||
        currentScholar.status ||
        currentApplication.scholarStatus ||
        currentApplication.applicationStatus ||
        currentApplication.status ||
        currentUserData.scholarStatus ||
        currentUserData.applicationStatus ||
        currentUserData.status ||
        "Not available"
    );

}


/*=========================================================
  SUMMARY CARDS
==========================================================*/

function updateSummaryCards() {

    const scholarId = getScholarId();

    const scholarName = getScholarName();

    const program = getScholarshipProgram();

    const status = getScholarStatus();


    /* Existing HTML */

    setText(
        ".summary-card:nth-child(1) h2",
        scholarId
    );

    setText(
        ".summary-card:nth-child(2) h2",
        scholarName
    );

    setText(
        ".summary-card:nth-child(3) h2",
        program
    );

    setText(
        ".active-card h2",
        formatStatus(status)
    );


    /* New ID compatibility */

    setText(
        "#scholarId",
        scholarId
    );

    setText(
        "#scholarName",
        scholarName
    );

    setText(
        "#scholarshipProgram",
        program
    );

    setText(
        "#scholarshipStatus",
        formatStatus(status)
    );


    const statusCard =
        document.querySelector(".active-card");

    if (statusCard) {

        statusCard.classList.remove(
            "status-active",
            "status-pending",
            "status-rejected"
        );


        const normalized =
            normalizeStatus(status);


        if (
            normalized.includes("active") ||
            normalized.includes("approved") ||
            normalized.includes("verified") ||
            normalized.includes("passed")
        ) {

            statusCard.classList.add(
                "status-active"
            );

        } else if (
            normalized.includes("reject") ||
            normalized.includes("fail")
        ) {

            statusCard.classList.add(
                "status-rejected"
            );

        } else {

            statusCard.classList.add(
                "status-pending"
            );

        }

    }

}


/*=========================================================
  ACADEMIC INFORMATION
==========================================================*/

function updateAcademicInformation() {

    const schoolYear =
        getFirstValue(
            currentScholar,
            currentApplication,
            currentUserData,
            [
                "schoolYear",
                "academicYear",
                "school_year"
            ]
        );


    const semester =
        getFirstValue(
            currentScholar,
            currentApplication,
            currentUserData,
            [
                "semester",
                "term"
            ]
        );


    const school =
        getFirstValue(
            currentScholar,
            currentApplication,
            currentUserData,
            [
                "schoolName",
                "school",
                "school_name"
            ]
        );


    const course =
        getFirstValue(
            currentScholar,
            currentApplication,
            currentUserData,
            [
                "course",
                "courseName",
                "programCourse"
            ]
        );


    const yearLevel =
        getFirstValue(
            currentScholar,
            currentApplication,
            currentUserData,
            [
                "yearLevel",
                "year",
                "level"
            ]
        );


    /* Existing HTML */

    setText(
        ".academic-overview .overview-box:nth-child(1) p",
        schoolYear || "Not available"
    );

    setText(
        ".academic-overview .overview-box:nth-child(2) p",
        semester || "Not available"
    );

    setText(
        ".academic-overview .overview-box:nth-child(3) p",
        school || "Not available"
    );

    setText(
        ".academic-overview .overview-box:nth-child(4) p",
        course || "Not available"
    );

    setText(
        ".academic-overview .overview-box:nth-child(5) p",
        yearLevel || "Not available"
    );


    /* New ID compatibility */

    setText(
        "#schoolYear",
        schoolYear || "Not available"
    );

    setText(
        "#semester",
        semester || "Not available"
    );

    setText(
        "#schoolName",
        school || "Not available"
    );

    setText(
        "#course",
        course || "Not available"
    );

    setText(
        "#yearLevel",
        yearLevel || "Not available"
    );

}


/*=========================================================
  ACADEMIC SUBMISSION STATUS
==========================================================*/

function getGradesData() {

    return (
        currentScholar.grades ||
        currentApplication.grades ||
        currentScholar.academicSubmissions?.grades ||
        currentApplication.academicSubmissions?.grades ||
        currentScholar.files?.scholarDocuments?.grades ||
        currentApplication.files?.scholarDocuments?.grades ||
        null
    );

}


function getCorData() {

    return (
        currentScholar.cor ||
        currentApplication.cor ||
        currentScholar.COR ||
        currentApplication.COR ||
        currentScholar.academicSubmissions?.cor ||
        currentApplication.academicSubmissions?.cor ||
        currentScholar.files?.scholarDocuments?.cor ||
        currentApplication.files?.scholarDocuments?.cor ||
        null
    );

}


/*=========================================================
  DOCUMENT STATUS
==========================================================*/

function getDocumentStatus(...objects) {

    for (const obj of objects) {

        if (!obj) continue;


        if (typeof obj === "string") {

            return obj;

        }


        if (obj.status) {

            return obj.status;

        }


        if (obj.verificationStatus) {

            return obj.verificationStatus;

        }


        if (obj.reviewStatus) {

            return obj.reviewStatus;

        }


        if (obj.approvalStatus) {

            return obj.approvalStatus;

        }


        if (obj.verified === true) {

            return "verified";

        }


        if (obj.approved === true) {

            return "approved";

        }


        if (obj.completed === true) {

            return "completed";

        }


        if (
            obj.url ||
            obj.downloadURL ||
            obj.storagePath ||
            obj.path ||
            obj.fileURL ||
            obj.fileUrl
        ) {

            return "submitted";

        }

    }


    return "pending";

}


/*=========================================================
  CHECK IF COMPLETE
==========================================================*/

function isCompletedStatus(status) {

    const normalized =
        normalizeStatus(status);


    return (
        normalized.includes("verified") ||
        normalized.includes("approved") ||
        normalized.includes("completed") ||
        normalized.includes("complete")
    );

}


/*=========================================================
  SCHOLARSHIP PROGRESS
==========================================================*/

function updateScholarshipProgress() {

    const gradesData = getGradesData();

    const corData = getCorData();


    const gradesStatus =
        getDocumentStatus(gradesData);

    const corStatus =
        getDocumentStatus(corData);


    let completed = 0;

    const totalRequirements = 2;


    if (isCompletedStatus(gradesStatus)) {

        completed++;

    }


    if (isCompletedStatus(corStatus)) {

        completed++;

    }


    const percentage =
        Math.round(
            (completed / totalRequirements) * 100
        );


    /* Existing progress */

    const progressText =
        document.querySelector(
            ".progress-circle span"
        );


    if (progressText) {

        animateProgress(
            progressText,
            percentage
        );

    }


    /* New IDs */

    setText(
        "#requirementsProgress",
        percentage + "%"
    );


    const requirementsTitle =
        document.getElementById(
            "requirementsTitle"
        );


    const requirementsMessage =
        document.getElementById(
            "requirementsMessage"
        );


    if (requirementsTitle) {

        requirementsTitle.textContent =
            percentage === 100
                ? "Requirements Completed"
                : "Requirements Progress";

    }


    if (requirementsMessage) {

        if (percentage === 100) {

            requirementsMessage.textContent =
                "All academic requirements for this semester have been successfully submitted and verified.";

        } else {

            requirementsMessage.textContent =
                `${completed} of ${totalRequirements} academic requirements have been completed. Please submit the remaining requirements through Academic Submission.`;

        }

    }


    const badge =
        document.querySelector(
            ".progress-info .badge"
        );


    if (badge) {

        badge.className =
            "badge " +
            (
                percentage === 100
                    ? "success"
                    : "pending"
            );


        badge.textContent =
            percentage === 100
                ? "Requirements Complete"
                : "Requirements Pending";

    }

}


/*=========================================================
  PROGRESS ANIMATION
==========================================================*/

function animateProgress(element, target) {

    let value = 0;

    const oldTimer =
        element.dataset.progressTimer;

    if (oldTimer) {

        clearInterval(
            Number(oldTimer)
        );

    }


    const timer =
        setInterval(() => {

            value++;

            element.textContent =
                value + "%";


            if (value >= target) {

                clearInterval(timer);

                element.dataset.progressTimer =
                    "";

            }

        }, 15);


    element.dataset.progressTimer =
        String(timer);

}


/*=========================================================
  TIMELINE
==========================================================*/

function updateTimeline() {

    const gradesStatus =
        getDocumentStatus(
            getGradesData()
        );


    const corStatus =
        getDocumentStatus(
            getCorData()
        );


    const orientationStatus =
        getFirstValue(
            currentScholar,
            currentApplication,
            currentUserData,
            [
                "orientationStatus",
                "orientation"
            ]
        ) || "pending";


    const scholarshipStatus =
        getScholarStatus();


    const timelineItems =
        document.querySelectorAll(
            ".timeline-item"
        );


    if (timelineItems.length < 5) {

        return;

    }


    /*-------------------------------------------------------
      APPROVED
    -------------------------------------------------------*/

    updateTimelineItem(
        timelineItems[0],
        isApprovedScholar(),
        "Approved as Scholar",
        getDateFromSources(
            "approvalDate",
            "approvedDate",
            "scholarApprovedDate"
        )
    );


    /*-------------------------------------------------------
      ORIENTATION
    -------------------------------------------------------*/

    updateTimelineItem(
        timelineItems[1],
        isCompletedStatus(
            orientationStatus
        ),
        "Orientation Completed",
        getDateFromSources(
            "orientationDate",
            "orientationCompletedDate"
        )
    );


    /*-------------------------------------------------------
      COR
    -------------------------------------------------------*/

    updateTimelineItem(
        timelineItems[2],
        isCompletedStatus(
            corStatus
        ),
        "COR Submitted",
        getDocumentDate(
            getCorData()
        )
    );


    /*-------------------------------------------------------
      GRADES
    -------------------------------------------------------*/

    updateTimelineItem(
        timelineItems[3],
        isCompletedStatus(
            gradesStatus
        ),
        "Grades Submitted",
        getDocumentDate(
            getGradesData()
        )
    );


    /*-------------------------------------------------------
      VERIFIED
    -------------------------------------------------------*/

    const verified =
        (
            isCompletedStatus(
                gradesStatus
            ) &&
            isCompletedStatus(
                corStatus
            ) &&
            (
                normalizeStatus(
                    scholarshipStatus
                ).includes("active") ||
                normalizeStatus(
                    scholarshipStatus
                ).includes("verified") ||
                normalizeStatus(
                    scholarshipStatus
                ).includes("approved")
            )
        );


    updateTimelineItem(
        timelineItems[4],
        verified,
        "Scholarship Verified",
        getDateFromSources(
            "verificationDate",
            "verifiedDate",
            "scholarshipVerifiedDate"
        )
    );

}


/*=========================================================
  UPDATE TIMELINE ITEM
==========================================================*/

function updateTimelineItem(
    item,
    completed,
    title,
    date
) {

    if (!item) return;


    const circle =
        item.querySelector(".circle");

    const heading =
        item.querySelector("h4");

    const small =
        item.querySelector("small");


    if (heading) {

        heading.textContent =
            title;

    }


    if (small) {

        small.textContent =
            date
                ? formatDate(date)
                : (
                    completed
                        ? "Completed"
                        : "Pending"
                );

    }


    if (circle) {

        circle.classList.toggle(
            "active",
            completed
        );

    }


    item.classList.toggle(
        "completed",
        completed
    );

}


/*=========================================================
  APPROVED CHECK
==========================================================*/

function isApprovedScholar() {

    const status =
        normalizeStatus(
            getScholarStatus()
        );


    return (
        status.includes("active") ||
        status.includes("approved") ||
        status.includes("verified") ||
        currentScholar.approved === true
    );

}


/*=========================================================
  ACADEMIC STANDING
==========================================================*/

function updateAcademicStanding() {

    const latestGPA =
        getLatestGPA();


    const requiredGPA =
        getRequiredGPA();


    let result =
        "Not available";


    if (
        latestGPA !== null &&
        requiredGPA !== null
    ) {

        result =
            latestGPA <= requiredGPA
                ? "PASSED"
                : "FAILED";

    }


    /* Existing HTML */

    setText(
        ".standing-box:nth-child(1) h2",
        latestGPA !== null
            ? formatGPA(latestGPA)
            : "Not available"
    );


    setText(
        ".standing-box:nth-child(2) h2",
        requiredGPA !== null
            ? formatGPA(requiredGPA)
            : "Not available"
    );


    const resultElement =
        document.querySelector(
            ".standing-box:nth-child(3) h2"
        );


    if (resultElement) {

        resultElement.textContent =
            result;


        resultElement.classList.remove(
            "passed",
            "failed"
        );


        if (result === "PASSED") {

            resultElement.classList.add(
                "passed"
            );

        } else if (result === "FAILED") {

            resultElement.classList.add(
                "failed"
            );

        }

    }


    /* New IDs */

    setText(
        "#latestGPA",
        latestGPA !== null
            ? formatGPA(latestGPA)
            : "Not available"
    );

    setText(
        "#requiredGPA",
        requiredGPA !== null
            ? formatGPA(requiredGPA)
            : "Not available"
    );

    setText(
        "#academicResult",
        result
    );


    updateAcademicRemarks(
        result,
        latestGPA,
        requiredGPA
    );

}


/*=========================================================
  GET GPA
==========================================================*/

function getLatestGPA() {

    const possibleValues = [

        currentScholar.latestGPA,

        currentScholar.gpa,

        currentScholar.GPA,

        currentScholar.generalAverage,

        currentScholar.academicInfo?.latestGPA,

        currentScholar.academicInfo?.gpa,

        currentScholar.academicInfo?.generalAverage,

        currentApplication.latestGPA,

        currentApplication.gpa,

        currentApplication.GPA,

        currentApplication.generalAverage,

        currentApplication.academicInfo?.latestGPA,

        currentApplication.academicInfo?.gpa,

        currentApplication.academicInfo?.generalAverage,

        getGradesData()?.latestGPA,

        getGradesData()?.gpa,

        getGradesData()?.GPA,

        getGradesData()?.generalAverage

    ];


    for (const value of possibleValues) {

        const number =
            parseGPA(value);

        if (number !== null) {

            return number;

        }

    }


    return null;

}


/*=========================================================
  REQUIRED GPA
==========================================================*/

function getRequiredGPA() {

    const values = [

        currentScholar.requiredGPA,

        currentScholar.minimumGPA,

        currentScholar.minGPA,

        currentScholar.academicRequirements?.requiredGPA,

        currentApplication.requiredGPA,

        currentApplication.minimumGPA,

        currentApplication.minGPA,

        currentApplication.academicRequirements?.requiredGPA

    ];


    for (const value of values) {

        const number =
            parseGPA(value);

        if (number !== null) {

            return number;

        }

    }


    return null;

}


/*=========================================================
  GPA PARSER
==========================================================*/

function parseGPA(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return null;

    }


    const number =
        Number(
            String(value)
                .replace(",", ".")
                .trim()
        );


    return Number.isFinite(number)
        ? number
        : null;

}


/*=========================================================
  GPA FORMAT
==========================================================*/

function formatGPA(value) {

    return Number(value).toFixed(2);

}


/*=========================================================
  ACADEMIC REMARKS
==========================================================*/

function updateAcademicRemarks(
    result,
    latestGPA,
    requiredGPA
) {

    const remarks =
        document.querySelector(
            ".academic-overview"
        );


    const title =
        document.querySelector(
            ".remarks.success-box strong"
        );


    const message =
        document.querySelector(
            ".remarks.success-box p"
        );


    const icon =
        document.querySelector(
            ".remarks.success-box i"
        );


    const newTitle =
        document.getElementById(
            "academicRemarksTitle"
        );


    const newMessage =
        document.getElementById(
            "academicRemarksMessage"
        );


    if (result === "PASSED") {

        if (title) {

            title.textContent =
                "Excellent Academic Standing";

        }

        if (message) {

            message.textContent =
                "You have maintained the required GPA. Continue submitting all semester requirements on time.";

        }

        if (icon) {

            icon.className =
                "fas fa-circle-check";

        }

    } else if (result === "FAILED") {

        if (title) {

            title.textContent =
                "Academic Requirement Not Met";

        }

        if (message) {

            message.textContent =
                "Your latest GPA does not meet the required scholarship GPA. Please review your academic standing and scholarship requirements.";

        }

        if (icon) {

            icon.className =
                "fas fa-circle-exclamation";

        }

    } else {

        if (title) {

            title.textContent =
                "Academic Standing";

        }

        if (message) {

            message.textContent =
                "Academic GPA information is not yet available.";

        }

    }


    if (newTitle) {

        newTitle.textContent =
            result === "PASSED"
                ? "Excellent Academic Standing"
                : "Academic Standing";

    }


    if (newMessage) {

        newMessage.textContent =
            result === "PASSED"
                ? "You have maintained the required GPA."
                : "Academic GPA information is not yet available.";

    }

}


/*=========================================================
  COMPLIANCE CHECKLIST
==========================================================*/

function updateCompliance() {

    const corStatus =
        getDocumentStatus(
            getCorData()
        );


    const gradesStatus =
        getDocumentStatus(
            getGradesData()
        );


    const orientationStatus =
        getFirstValue(
            currentScholar,
            currentApplication,
            currentUserData,
            [
                "orientationStatus",
                "orientation"
            ]
        ) || "pending";


    const attendanceStatus =
        getFirstValue(
            currentScholar,
            currentApplication,
            currentUserData,
            [
                "attendanceStatus",
                "attendance"
            ]
        ) || "pending";


    const renewalStatus =
        getFirstValue(
            currentScholar,
            currentApplication,
            currentUserData,
            [
                "renewalStatus",
                "renewal"
            ]
        ) || "upcoming";


    updateComplianceRow(
        0,
        corStatus
    );


    updateComplianceRow(
        1,
        gradesStatus
    );


    updateComplianceRow(
        2,
        orientationStatus
    );


    updateComplianceRow(
        3,
        attendanceStatus
    );


    updateComplianceRow(
        4,
        renewalStatus
    );


    /* New IDs */

    setStatus(
        "#corStatus",
        corStatus
    );

    setStatus(
        "#gradesStatus",
        gradesStatus
    );

    setStatus(
        "#orientationStatus",
        orientationStatus
    );

    setStatus(
        "#attendanceStatus",
        attendanceStatus
    );

    setStatus(
        "#renewalStatus",
        renewalStatus
    );

}


/*=========================================================
  COMPLIANCE ROW
==========================================================*/

function updateComplianceRow(
    index,
    status
) {

    const rows =
        document.querySelectorAll(
            ".checklist-table tbody tr"
        );


    const row = rows[index];

    if (!row) return;


    const badge =
        row.querySelector(".badge");

    if (!badge) return;


    badge.textContent =
        formatStatus(status);


    badge.className =
        "badge " +
        getStatusClass(status);

}


/*=========================================================
  GENERIC STATUS ELEMENT
==========================================================*/

function setStatus(
    selector,
    status
) {

    const element =
        document.querySelector(selector);


    if (!element) return;


    element.textContent =
        formatStatus(status);


    element.className =
        "badge " +
        getStatusClass(status);

}


/*=========================================================
  STATUS CLASS
==========================================================*/

function getStatusClass(status) {

    const normalized =
        normalizeStatus(status);


    if (
        normalized.includes("verified") ||
        normalized.includes("approved") ||
        normalized.includes("active") ||
        normalized.includes("completed") ||
        normalized.includes("complete") ||
        normalized.includes("passed") ||
        normalized.includes("submitted")
    ) {

        return "success";

    }


    if (
        normalized.includes("reject") ||
        normalized.includes("failed") ||
        normalized.includes("fail") ||
        normalized.includes("denied")
    ) {

        return "rejected";

    }


    return "pending";

}


/*=========================================================
  STATUS FORMAT
==========================================================*/

function formatStatus(status) {

    if (
        status === null ||
        status === undefined ||
        status === ""
    ) {

        return "Not available";

    }


    const text =
        String(status)
            .replace(/_/g, " ")
            .replace(/-/g, " ")
            .trim();


    return text
        .replace(/\b\w/g, letter =>
            letter.toUpperCase()
        );

}


/*=========================================================
  NORMALIZE STATUS
==========================================================*/

function normalizeStatus(status) {

    return String(
        status || ""
    )
        .toLowerCase()
        .trim();

}


/*=========================================================
  SCHOLARSHIP BENEFITS
==========================================================*/

function updateBenefits() {

    const benefits =
        currentScholar.benefits ||
        currentApplication.benefits ||
        currentScholar.scholarshipBenefits ||
        currentApplication.scholarshipBenefits ||
        {};


    const allowance =
        benefits.allowance ||
        currentScholar.allowance ||
        currentApplication.allowance;


    const bookAllowance =
        benefits.bookAllowance ||
        currentScholar.bookAllowance ||
        currentApplication.bookAllowance;


    const tuition =
        benefits.tuition ||
        currentScholar.tuition ||
        currentApplication.tuition;


    const allowanceAmount =
        typeof allowance === "object"
            ? (
                allowance.amount ||
                allowance.value
            )
            : allowance;


    const allowanceFrequency =
        typeof allowance === "object"
            ? (
                allowance.frequency ||
                allowance.period
            )
            : null;


    const bookValue =
        typeof bookAllowance === "object"
            ? (
                bookAllowance.amount ||
                bookAllowance.value ||
                bookAllowance.status
            )
            : bookAllowance;


    const bookFrequency =
        typeof bookAllowance === "object"
            ? (
                bookAllowance.frequency ||
                bookAllowance.period
            )
            : null;


    const tuitionValue =
        typeof tuition === "object"
            ? (
                tuition.coverage ||
                tuition.amount ||
                tuition.status
            )
            : tuition;


    const tuitionDescription =
        typeof tuition === "object"
            ? (
                tuition.description ||
                tuition.details
            )
            : null;


    /* New IDs */

    setText(
        "#allowanceAmount",
        allowanceAmount
            ? formatMoney(allowanceAmount)
            : "Not available"
    );


    setText(
        "#allowanceFrequency",
        allowanceFrequency ||
        "Not available"
    );


    setText(
        "#bookAllowance",
        bookValue ||
        "Not available"
    );


    setText(
        "#bookFrequency",
        bookFrequency ||
        "Not available"
    );


    setText(
        "#tuitionCoverage",
        tuitionValue ||
        "Not available"
    );


    setText(
        "#tuitionDescription",
        tuitionDescription ||
        "Not available"
    );


    /* Existing HTML */

    const benefitCards =
        document.querySelectorAll(
            ".benefit-card"
        );


    if (benefitCards.length >= 3) {

        const allowanceHeading =
            benefitCards[0].querySelector("h2");

        const allowanceParagraph =
            benefitCards[0].querySelector("p");


        if (allowanceHeading) {

            allowanceHeading.textContent =
                allowanceAmount
                    ? formatMoney(allowanceAmount)
                    : "Not available";

        }


        if (allowanceParagraph) {

            allowanceParagraph.textContent =
                allowanceFrequency ||
                "Not available";

        }


        const bookHeading =
            benefitCards[1].querySelector("h2");

        const bookParagraph =
            benefitCards[1].querySelector("p");


        if (bookHeading) {

            bookHeading.textContent =
                bookValue ||
                "Not available";

        }


        if (bookParagraph) {

            bookParagraph.textContent =
                bookFrequency ||
                "Not available";

        }


        const tuitionHeading =
            benefitCards[2].querySelector("h2");

        const tuitionParagraph =
            benefitCards[2].querySelector("p");


        if (tuitionHeading) {

            tuitionHeading.textContent =
                tuitionValue ||
                "Not available";

        }


        if (tuitionParagraph) {

            tuitionParagraph.textContent =
                tuitionDescription ||
                "Not available";

        }

    }

}


/*=========================================================
  MONEY FORMAT
==========================================================*/

function formatMoney(value) {

    if (value === null || value === undefined) {

        return "Not available";

    }


    const numeric =
        Number(
            String(value)
                .replace(/[₱,\s]/g, "")
        );


    if (Number.isFinite(numeric)) {

        return "₱" +
            numeric.toLocaleString(
                "en-PH",
                {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }
            );

    }


    return String(value);

}


/*=========================================================
  ADMIN REMARKS
==========================================================*/

function updateAdminRemarks() {

    const remarks =
        currentScholar.adminRemarks ||
        currentScholar.administratorRemarks ||
        currentScholar.remarks ||
        currentScholar.adminComment ||
        currentApplication.adminRemarks ||
        currentApplication.administratorRemarks ||
        currentApplication.remarks ||
        currentApplication.adminComment ||
        null;


    const remarksDate =
        currentScholar.adminRemarksDate ||
        currentScholar.remarksDate ||
        currentScholar.updatedAt ||
        currentApplication.adminRemarksDate ||
        currentApplication.remarksDate ||
        currentApplication.updatedAt ||
        null;


    const title =
        document.querySelector(
            ".remarks-box h3"
        );


    const message =
        document.querySelector(
            ".remarks-box p"
        );


    const dateElement =
        document.querySelector(
            ".remarks-box small"
        );


    const icon =
        document.querySelector(
            ".remarks-box > i"
        );


    if (remarks) {

        if (title) {

            title.textContent =
                "Administrator Remarks";

        }


        if (message) {

            message.textContent =
                String(remarks);

        }


        if (dateElement) {

            dateElement.textContent =
                remarksDate
                    ? "Last Updated: " +
                      formatDate(remarksDate)
                    : "Last Updated: Not available";

        }


    } else {

        if (title) {

            title.textContent =
                "Administrator Remarks";

        }


        if (message) {

            message.textContent =
                "No administrator remarks available.";

        }


        if (dateElement) {

            dateElement.textContent =
                "Last Updated: Not available";

        }


        if (icon) {

            icon.className =
                "fas fa-comments";

        }

    }


    /* New IDs */

    setText(
        "#adminRemarksTitle",
        remarks
            ? "Administrator Remarks"
            : "No Administrator Remarks"
    );


    setText(
        "#adminRemarksMessage",
        remarks ||
        "No administrator remarks available."
    );


    setText(
        "#adminRemarksDate",
        remarksDate
            ? "Last Updated: " +
              formatDate(remarksDate)
            : "Last Updated: Not available"
    );

}


/*=========================================================
  SCHOLARSHIP HISTORY
==========================================================*/

function updateScholarshipHistory() {

    const tbody =
        document.getElementById(
            "scholarshipHistoryBody"
        ) ||
        document.querySelector(
            ".history-table tbody"
        );


    if (!tbody) return;


    tbody.innerHTML = "";


    const history =
        currentScholar.scholarshipHistory ||
        currentScholar.history ||
        currentScholar.statusHistory ||
        currentApplication.scholarshipHistory ||
        currentApplication.history ||
        currentApplication.statusHistory ||
        null;


    if (
        Array.isArray(history) &&
        history.length > 0
    ) {

        history.forEach(record => {

            addHistoryRow(
                tbody,
                record
            );

        });

        return;

    }


    /*-------------------------------------------------------
      If no separate history exists,
      use current Firestore record only.
    -------------------------------------------------------*/

    const currentSchoolYear =
        getFirstValue(
            currentScholar,
            currentApplication,
            currentUserData,
            [
                "schoolYear",
                "academicYear"
            ]
        );


    const currentSemester =
        getFirstValue(
            currentScholar,
            currentApplication,
            currentUserData,
            [
                "semester",
                "term"
            ]
        );


    const currentStatus =
        getScholarStatus();


    const currentGPA =
        getLatestGPA();


    const currentRemarks =
        currentScholar.remarks ||
        currentApplication.remarks ||
        "";


    if (
        currentSchoolYear ||
        currentSemester ||
        currentStatus !== "Not available"
    ) {

        addHistoryRow(
            tbody,
            {
                schoolYear:
                    currentSchoolYear ||
                    "Not available",

                semester:
                    currentSemester ||
                    "Not available",

                status:
                    currentStatus,

                gpa:
                    currentGPA,

                remarks:
                    currentRemarks ||
                    "Current scholarship record"
            }
        );

    } else {

        const row =
            document.createElement("tr");


        const cell =
            document.createElement("td");

        cell.colSpan = 5;

        cell.textContent =
            "No scholarship history available.";

        row.appendChild(cell);

        tbody.appendChild(row);

    }

}


/*=========================================================
  ADD HISTORY ROW
==========================================================*/

function addHistoryRow(
    tbody,
    record
) {

    const row =
        document.createElement("tr");


    const schoolYear =
        record.schoolYear ||
        record.academicYear ||
        "Not available";


    const semester =
        record.semester ||
        record.term ||
        "Not available";


    const status =
        record.status ||
        record.scholarshipStatus ||
        "Not available";


    const gpa =
        parseGPA(
            record.gpa ||
            record.GPA ||
            record.generalAverage
        );


    const remarks =
        record.remarks ||
        record.comment ||
        "Not available";


    appendTextCell(
        row,
        schoolYear
    );


    appendTextCell(
        row,
        semester
    );


    const statusCell =
        document.createElement("td");


    const badge =
        document.createElement("span");


    badge.className =
        "badge " +
        getStatusClass(status);


    badge.textContent =
        formatStatus(status);


    statusCell.appendChild(
        badge
    );


    row.appendChild(
        statusCell
    );


    appendTextCell(
        row,
        gpa !== null
            ? formatGPA(gpa)
            : "Not available"
    );


    appendTextCell(
        row,
        remarks
    );


    tbody.appendChild(row);

}


/*=========================================================
  TABLE CELL HELPER
==========================================================*/

function appendTextCell(
    row,
    value
) {

    const cell =
        document.createElement("td");


    cell.textContent =
        value;


    row.appendChild(
        cell
    );

}


/*=========================================================
  STATUS MESSAGE
==========================================================*/

function updateStatusMessage() {

    const status =
        normalizeStatus(
            getScholarStatus()
        );


    if (
        status.includes("active") ||
        status.includes("approved") ||
        status.includes("verified")
    ) {

        console.log(
            "Scholarship Status: ACTIVE / APPROVED"
        );

    } else if (
        status.includes("reject") ||
        status.includes("failed")
    ) {

        console.log(
            "Scholarship Status: REJECTED / FAILED"
        );

    } else {

        console.log(
            "Scholarship Status: PENDING"
        );

    }

}


/*=========================================================
  PRINT STATUS
==========================================================*/

function initializePrintButton() {

    const printBtn =
        document.querySelector(
            "#printStatusBtn"
        ) ||
        document.querySelector(
            ".btn-primary"
        );


    if (!printBtn) return;


    printBtn.addEventListener(
        "click",
        () => {

            window.print();

        }
    );

}


/*=========================================================
  DOWNLOAD REPORT
==========================================================*/

function initializeDownloadButton() {

    const downloadBtn =
        document.querySelector(
            "#downloadReportBtn"
        ) ||
        document.querySelector(
            ".btn-success"
        );


    if (!downloadBtn) return;


    downloadBtn.addEventListener(
        "click",
        downloadScholarshipReport
    );

}


/*=========================================================
  DOWNLOAD SCHOLARSHIP REPORT
==========================================================*/

function downloadScholarshipReport() {

    const scholarName =
        getScholarName();


    const scholarId =
        getScholarId();


    const program =
        getScholarshipProgram();


    const status =
        formatStatus(
            getScholarStatus()
        );


    const schoolYear =
        getFirstValue(
            currentScholar,
            currentApplication,
            currentUserData,
            [
                "schoolYear",
                "academicYear"
            ]
        ) ||
        "Not available";


    const semester =
        getFirstValue(
            currentScholar,
            currentApplication,
            currentUserData,
            [
                "semester",
                "term"
            ]
        ) ||
        "Not available";


    const school =
        getFirstValue(
            currentScholar,
            currentApplication,
            currentUserData,
            [
                "schoolName",
                "school"
            ]
        ) ||
        "Not available";


    const course =
        getFirstValue(
            currentScholar,
            currentApplication,
            currentUserData,
            [
                "course",
                "courseName"
            ]
        ) ||
        "Not available";


    const yearLevel =
        getFirstValue(
            currentScholar,
            currentApplication,
            currentUserData,
            [
                "yearLevel",
                "year"
            ]
        ) ||
        "Not available";


    const gpa =
        getLatestGPA();


    const requiredGPA =
        getRequiredGPA();


    const gradesStatus =
        formatStatus(
            getDocumentStatus(
                getGradesData()
            )
        );


    const corStatus =
        formatStatus(
            getDocumentStatus(
                getCorData()
            )
        );


    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>ScholarLink Scholarship Report</title>

<style>

body {
    font-family: Arial, sans-serif;
    padding: 40px;
    color: #222;
}

h1 {
    text-align: center;
    margin-bottom: 5px;
}

.subtitle {
    text-align: center;
    color: #666;
    margin-bottom: 30px;
}

.section {
    margin-bottom: 25px;
}

.section h2 {
    border-bottom: 2px solid #ddd;
    padding-bottom: 8px;
}

table {
    width: 100%;
    border-collapse: collapse;
}

td,
th {
    border: 1px solid #ddd;
    padding: 10px;
    text-align: left;
}

th {
    background: #f5f5f5;
}

.status {
    font-weight: bold;
}

.footer {
    margin-top: 40px;
    text-align: center;
    color: #777;
    font-size: 12px;
}

</style>
</head>

<body>

<h1>SCHOLARLINK</h1>

<div class="subtitle">
Scholarship Management System
</div>

<div class="section">

<h2>Scholar Information</h2>

<table>

<tr>
<th>Scholar Name</th>
<td>${escapeHTML(scholarName)}</td>
</tr>

<tr>
<th>Scholar ID</th>
<td>${escapeHTML(scholarId)}</td>
</tr>

<tr>
<th>Scholarship Program</th>
<td>${escapeHTML(program)}</td>
</tr>

<tr>
<th>Status</th>
<td class="status">${escapeHTML(status)}</td>
</tr>

</table>

</div>


<div class="section">

<h2>Academic Information</h2>

<table>

<tr>
<th>School Year</th>
<td>${escapeHTML(schoolYear)}</td>
</tr>

<tr>
<th>Semester</th>
<td>${escapeHTML(semester)}</td>
</tr>

<tr>
<th>School</th>
<td>${escapeHTML(school)}</td>
</tr>

<tr>
<th>Course</th>
<td>${escapeHTML(course)}</td>
</tr>

<tr>
<th>Year Level</th>
<td>${escapeHTML(yearLevel)}</td>
</tr>

</table>

</div>


<div class="section">

<h2>Academic Standing</h2>

<table>

<tr>
<th>Latest GPA</th>
<td>
${
    gpa !== null
        ? escapeHTML(formatGPA(gpa))
        : "Not available"
}
</td>
</tr>

<tr>
<th>Required GPA</th>
<td>
${
    requiredGPA !== null
        ? escapeHTML(formatGPA(requiredGPA))
        : "Not available"
}
</td>
</tr>

<tr>
<th>Result</th>
<td>
${
    gpa !== null && requiredGPA !== null
        ? (
            gpa <= requiredGPA
                ? "PASSED"
                : "FAILED"
        )
        : "Not available"
}
</td>
</tr>

</table>

</div>


<div class="section">

<h2>Academic Submission</h2>

<table>

<tr>
<th>Grades</th>
<td>${escapeHTML(gradesStatus)}</td>
</tr>

<tr>
<th>COR</th>
<td>${escapeHTML(corStatus)}</td>
</tr>

</table>

</div>


<div class="footer">

Generated by ScholarLink Scholarship Management System

</div>

</body>
</html>
`;


    const blob =
        new Blob(
            [html],
            {
                type: "text/html"
            }
        );


    const url =
        URL.createObjectURL(blob);


    const link =
        document.createElement("a");


    link.href = url;

    link.download =
        `Scholarship-Report-${sanitizeFileName(
            scholarId
        )}.html`;


    document.body.appendChild(
        link
    );


    link.click();


    document.body.removeChild(
        link
    );


    URL.revokeObjectURL(
        url
    );


    console.log(
        "Scholarship report downloaded."
    );

}


/*=========================================================
  ESCAPE HTML
==========================================================*/

function escapeHTML(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/*=========================================================
  SANITIZE FILE NAME
==========================================================*/

function sanitizeFileName(value) {

    return String(value || "Scholar")
        .replace(
            /[<>:"/\\|?*]+/g,
            "-"
        );

}


/*=========================================================
  SIDEBAR
==========================================================*/

function initializeSidebar() {

    const menuItems =
        document.querySelectorAll(
            ".menu li"
        );


    menuItems.forEach(item => {

        item.addEventListener(
            "click",
            () => {

                menuItems.forEach(
                    i =>
                        i.classList.remove(
                            "active"
                        )
                );


                item.classList.add(
                    "active"
                );

            }
        );

    });


    /*-------------------------------------------------------
      LOGOUT
    -------------------------------------------------------*/

    const logout =
        document.getElementById(
            "sidebarlogout"
        );


    if (logout) {

        logout.addEventListener(
            "click",
            async event => {

                event.preventDefault();


                try {

                    await signOut(auth);

                    window.location.href =
                        "../login/index.html";

                } catch (error) {

                    console.error(
                        "Logout failed:",
                        error
                    );

                    alert(
                        "Unable to logout. Please try again."
                    );

                }

            }
        );

    }

}


/*=========================================================
  CARD ANIMATION
==========================================================*/

function initializeCardAnimations() {

    const cards =
        document.querySelectorAll(
            ".summary-card, .card, .benefit-card"
        );


    cards.forEach(
        (card, index) => {

            card.style.opacity = "0";

            card.style.transform =
                "translateY(20px)";


            setTimeout(
                () => {

                    card.style.transition =
                        ".5s";


                    card.style.opacity =
                        "1";


                    card.style.transform =
                        "translateY(0)";

                },
                index * 120
            );

        }
    );

}


/*=========================================================
  BENEFIT CARD EFFECT
==========================================================*/

function initializeBenefitEffects() {

    const benefitCards =
        document.querySelectorAll(
            ".benefit-card"
        );


    benefitCards.forEach(card => {

        card.addEventListener(
            "mouseenter",
            () => {

                card.style.transform =
                    "translateY(-8px)";

            }
        );


        card.addEventListener(
            "mouseleave",
            () => {

                card.style.transform =
                    "translateY(0)";

            }
        );

    });

}


/*=========================================================
  TABLE ROW EFFECT
==========================================================*/

function initializeTableEffects() {

    const rows =
        document.querySelectorAll(
            "table tbody tr"
        );


    rows.forEach(row => {

        row.addEventListener(
            "mouseenter",
            () => {

                row.style.background =
                    "#EEF5FF";

            }
        );


        row.addEventListener(
            "mouseleave",
            () => {

                row.style.background =
                    "";

            }
        );

    });

}


/*=========================================================
  TIMELINE EFFECT
==========================================================*/

function initializeTimelineEffects() {

    const timeline =
        document.querySelectorAll(
            ".timeline-item"
        );


    timeline.forEach(
        (item, index) => {

            item.style.opacity = "0";

            item.style.transform =
                "translateX(-20px)";


            setTimeout(
                () => {

                    item.style.transition =
                        ".5s";


                    item.style.opacity =
                        "1";


                    item.style.transform =
                        "translateX(0)";

                },
                index * 300
            );

        }
    );

}


/*=========================================================
  GET FIRST VALUE
==========================================================*/

function getFirstValue(
    ...args
) {

    const fields =
        args.pop();


    for (const source of args) {

        if (!source) continue;


        for (const field of fields) {

            const value =
                getNestedValue(
                    source,
                    field
                );


            if (
                value !== undefined &&
                value !== null &&
                value !== ""
            ) {

                return value;

            }

        }

    }


    return null;

}


/*=========================================================
  NESTED VALUE
==========================================================*/

function getNestedValue(
    object,
    path
) {

    return path
        .split(".")
        .reduce(
            (current, key) =>
                current?.[key],
            object
        );

}


/*=========================================================
  DOCUMENT DATE
==========================================================*/

function getDocumentDate(
    documentData
) {

    if (!documentData) {

        return null;

    }


    if (typeof documentData !== "object") {

        return null;

    }


    return (
        documentData.submittedAt ||
        documentData.uploadedAt ||
        documentData.verifiedAt ||
        documentData.approvedAt ||
        documentData.updatedAt ||
        documentData.createdAt ||
        null
    );

}


/*=========================================================
  DATE FROM SOURCES
==========================================================*/

function getDateFromSources(
    ...fields
) {

    return getFirstValue(
        currentScholar,
        currentApplication,
        currentUserData,
        fields
    );

}


/*=========================================================
  FORMAT FIRESTORE DATE
==========================================================*/

function formatDate(value) {

    if (!value) {

        return "Not available";

    }


    let date;


    /* Firestore Timestamp */

    if (
        typeof value === "object" &&
        typeof value.toDate === "function"
    ) {

        date =
            value.toDate();

    }

    /* JavaScript Date */

    else if (
        value instanceof Date
    ) {

        date = value;

    }

    /* Timestamp object */

    else if (
        typeof value === "object" &&
        value.seconds
    ) {

        date =
            new Date(
                value.seconds * 1000
            );

    }

    /* String / number */

    else {

        date =
            new Date(value);

    }


    if (
        !date ||
        Number.isNaN(
            date.getTime()
        )
    ) {

        return String(value);

    }


    return date.toLocaleDateString(
        "en-US",
        {
            month: "long",
            day: "numeric",
            year: "numeric"
        }
    );

}


/*=========================================================
  SET TEXT
==========================================================*/

function setText(
    selector,
    value
) {

    const element =
        document.querySelector(
            selector
        );


    if (!element) return;


    element.textContent =
        value !== undefined &&
        value !== null &&
        value !== ""
            ? value
            : "Not available";

}


/*=========================================================
  LOAD ERROR
==========================================================*/

function showLoadError() {

    console.error(
        "Scholarship Status could not be loaded."
    );


    const status =
        document.querySelector(
            ".active-card h2"
        );


    if (status) {

        status.textContent =
            "Unavailable";

    }


    const message =
        document.querySelector(
            ".progress-info p"
        );


    if (message) {

        message.textContent =
            "Unable to load your scholarship information. Please refresh the page or contact the administrator.";

    }

}


/*=========================================================
  END
==========================================================*/

console.log(
    "ScholarLink Scholarship Status JS Ready."
);
/*=========================================================
  SCHOLARLINK
  SCHOLAR DASHBOARD - FULL FIREBASE + SUPABASE VERSION
=========================================================*/

import { auth, db } from "../firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
    doc,
    getDoc,
    collection,
    getDocs,
    updateDoc,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { supabase } from "../supabase.js";


/*=========================================================
  GLOBAL
=========================================================*/

let currentUser = null;
let currentUserData = {};
let currentApplication = {};
let currentScholar = {};


/*=========================================================
  DOM READY
=========================================================*/

document.addEventListener("DOMContentLoaded", () => {

    console.log("ScholarLink Home Ready");

    setupSidebar();
    setupQuickActions();
    setupLogout();
    setupUploads();
    setupQRButtons();
    setupCardAnimation();

});


/*=========================================================
  AUTHENTICATION
=========================================================*/

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        console.log("No authenticated user.");

        window.location.href = "../login/index.html";

        return;
    }

    currentUser = user;

    console.log(
        "Logged-in Scholar UID:",
        user.uid
    );

    try {

        /*
         * IMPORTANT:
         * Correct function name is loadScholarDashboard()
         */
        await loadScholarDashboard(user.uid);

    } catch (error) {

        console.error(
            "Dashboard loading error:",
            error
        );

        showDashboardError();

    }

});


/*=========================================================
  LOAD DASHBOARD
=========================================================*/

async function loadScholarDashboard(uid) {

    /*------------------------------------------
      LOAD USER
    ------------------------------------------*/

    const userSnap = await getDoc(
        doc(db, "users", uid)
    );

    if (!userSnap.exists()) {

        console.error(
            "User document not found."
        );

        alert(
            "Your account information could not be found."
        );

        await signOut(auth);

        window.location.href =
            "../login/index.html";

        return;
    }

    currentUserData = userSnap.data();


    /*------------------------------------------
      CHECK SCHOLAR ROLE
    ------------------------------------------*/

    const role = String(
        currentUserData.role || ""
    ).toLowerCase();

    const scholarConfirmed =
        currentUserData.scholarConfirmed === true;

    const scholarStatus =
        String(
            currentUserData.scholarStatus ||
            currentUserData.applicationStatus ||
            ""
        ).toLowerCase();

    const isActiveScholar =
        role === "scholar" &&
        (
            scholarConfirmed ||
            scholarStatus === "active" ||
            scholarStatus === "confirmed"
        );


    if (
        role !== "scholar" ||
        !isActiveScholar
    ) {

        console.warn(
            "Unauthorized scholar account."
        );

        alert(
            "Your account is not authorized as an active scholar."
        );

        await signOut(auth);

        window.location.href =
            "../login/index.html";

        return;
    }


    /*------------------------------------------
      LOAD APPLICATION
    ------------------------------------------*/

    const applicationSnap = await getDoc(
        doc(
            db,
            "applications",
            uid
        )
    );

    if (applicationSnap.exists()) {

        currentApplication =
            applicationSnap.data();

    } else {

        currentApplication = {};

    }


    /*------------------------------------------
      LOAD SCHOLAR RECORD
    ------------------------------------------*/

    const scholarSnap = await getDoc(
        doc(
            db,
            "scholars",
            uid
        )
    );

    if (scholarSnap.exists()) {

        currentScholar =
            scholarSnap.data();

    } else {

        currentScholar = {};

    }


    console.log(
        "User:",
        currentUserData
    );

    console.log(
        "Application:",
        currentApplication
    );

    console.log(
        "Scholar:",
        currentScholar
    );


    /*------------------------------------------
      UPDATE DASHBOARD
    ------------------------------------------*/

    updateScholarHeader();

    updateStatistics();

    await loadApplicantPhoto();

    await loadNotifications();

    await loadAnnouncements();

    updateSubmissionStatus();

    updateSchedule();

    updateQRCode();

    await loadRecentActivity();

}


/*=========================================================
  FULL NAME
=========================================================*/

function getFullName() {

    const personal =
        currentApplication.personalInformation ||
        currentApplication.personal_info ||
        {};

    const first =
        personal.firstName ||
        personal.firstname ||
        currentUserData.firstName ||
        "";

    const middle =
        personal.middleName ||
        personal.middlename ||
        currentUserData.middleName ||
        "";

    const last =
        personal.lastName ||
        personal.lastname ||
        currentUserData.lastName ||
        "";

    const suffix =
        personal.suffix ||
        currentUserData.suffix ||
        "";

    const assembled =
        [
            first,
            middle,
            last,
            suffix
        ]
            .filter(Boolean)
            .join(" ")
            .trim();

    return (
        currentScholar.fullName ||
        currentScholar.name ||
        currentUserData.fullName ||
        currentUserData.name ||
        assembled ||
        currentUser?.displayName ||
        "Scholar"
    );

}


/*=========================================================
  SCHOLAR ID
=========================================================*/

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
  SCHOLAR STATUS
=========================================================*/

function getScholarStatus() {

    return (
        currentScholar.scholarStatus ||
        currentScholar.status ||
        currentApplication.scholarStatus ||
        currentApplication.status ||
        currentUserData.scholarStatus ||
        currentUserData.applicationStatus ||
        "Active"
    );

}


/*=========================================================
  UPDATE HEADER
=========================================================*/

function updateScholarHeader() {

    const name =
        getFullName();

    const scholarId =
        getScholarId();


    const welcome =
        document.querySelector(
            ".topbar h1"
        );

    if (welcome) {

        welcome.innerHTML =
            `Welcome, ${escapeHtml(name)}! 👋`;

    }


    const profileName =
        document.getElementById(
            "headerScholarId"
        );

    if (profileName) {

        profileName.textContent =
            scholarId;

    }


    const profileProgram =
        document.getElementById(
            "headerProgram"
        );

    if (profileProgram) {

        profileProgram.textContent =
            getScholarshipProgram();

    }


    const qrTitle =
        document.getElementById(
            "qrScholarId"
        );

    if (qrTitle) {

        qrTitle.textContent =
            scholarId;

    }

}


/*=========================================================
  SCHOLARSHIP PROGRAM
=========================================================*/

function getScholarshipProgram() {

    const scholarship =
        currentApplication.scholarshipInformation ||
        currentApplication.scholarship_info ||
        {};

    return (
        currentScholar.scholarshipProgram ||
        currentScholar.program ||
        currentApplication.scholarshipProgram ||
        scholarship.scholarshipProgram ||
        scholarship.program ||
        "Scholarship Program"
    );

}


/*=========================================================
  STATISTICS
=========================================================*/

function updateStatistics() {

    const status =
        String(getScholarStatus())
            .replace(/_/g, " ")
            .replace(
                /\b\w/g,
                c => c.toUpperCase()
            );


    const statusCard =
        document.getElementById(
            "scholarStatus"
        );

    if (statusCard) {

        statusCard.textContent =
            status;

    }


    const academic =
        currentApplication.academicInformation ||
        currentApplication.academic_info ||
        {};


    const latestGPA =
        currentScholar.latestGPA ||
        currentScholar.gpa ||
        currentScholar.GPA ||
        currentApplication.latestGPA ||
        academic.gpa ||
        academic.GPA ||
        academic.generalAverage ||
        academic.general_average ||
        "Not available";


    const gpaCard =
        document.getElementById(
            "latestGPA"
        );

    if (gpaCard) {

        gpaCard.textContent =
            latestGPA;

    }


    const gradesStatus =
        getDocumentStatus(
            currentScholar.grades,
            currentApplication.grades,
            currentApplication.files?.scholarDocuments?.grades
        );


    const gradesCard =
        document.getElementById(
            "gradesStatus"
        );

    if (gradesCard) {

        gradesCard.textContent =
            formatStatus(gradesStatus);

    }


    const corStatus =
        getDocumentStatus(
            currentScholar.cor,
            currentApplication.cor,
            currentApplication.files?.scholarDocuments?.cor
        );


    const corCard =
        document.getElementById(
            "corStatus"
        );

    if (corCard) {

        corCard.textContent =
            formatStatus(corStatus);

    }


    const qrCard =
        document.getElementById(
            "qrStatus"
        );

    if (qrCard) {

        qrCard.textContent =
            "Active";

    }

}


/*=========================================================
  DOCUMENT STATUS
=========================================================*/

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


        if (obj.verified === true) {

            return "verified";

        }


        if (
            obj.url ||
            obj.storagePath ||
            obj.path
        ) {

            return "submitted";

        }

    }


    return "pending";

}


/*=========================================================
  FORMAT STATUS
=========================================================*/

function formatStatus(status) {

    return String(
        status || "pending"
    )
        .replace(/_/g, " ")
        .replace(
            /\b\w/g,
            c => c.toUpperCase()
        );

}


/*=========================================================
  LOAD APPLICANT PHOTO
=========================================================*/

async function loadApplicantPhoto() {

    const photo =
        currentApplication.files?.applicantPhoto ||
        currentApplication.applicantPhoto ||
        currentScholar.applicantPhoto ||
        currentUserData.photo ||
        null;


    if (!photo) {

        return;

    }


    let path =
        photo.storagePath ||
        photo.storage_path ||
        photo.path ||
        photo.filePath ||
        photo.file_path ||
        "";


    if (!path) {

        return;

    }


    path =
        normalizeStoragePath(
            path
        );


    try {

        const {
            data,
            error
        } =
            await supabase.storage
                .from("applicant-photos")
                .createSignedUrl(
                    path,
                    300
                );


        if (error) {

            console.error(
                "Photo URL error:",
                error
            );

            return;

        }


        if (!data?.signedUrl) {

            return;

        }


        const images =
            document.querySelectorAll(
                ".profile img, #profileAvatar, .profile-photo, .scholar-photo"
            );


        images.forEach(img => {

            img.src =
                data.signedUrl;

        });

    } catch (error) {

        console.error(
            "Applicant photo error:",
            error
        );

    }

}


/*=========================================================
  STORAGE PATH NORMALIZER
=========================================================*/

function normalizeStoragePath(path) {

    if (!path) return "";

    path =
        String(path).trim();

    path =
        path.replace(
            /^\/+/,
            ""
        );


    path =
        path.replace(
            /^applicant-photos\//,
            ""
        );


    if (
        path.includes(
            "/storage/v1/object/"
        )
    ) {

        try {

            const url =
                new URL(path);

            const marker =
                "/storage/v1/object/";

            const index =
                url.pathname.indexOf(
                    marker
                );


            if (index !== -1) {

                let remaining =
                    url.pathname.substring(
                        index +
                        marker.length
                    );


                remaining =
                    remaining.replace(
                        /^sign\/?/,
                        ""
                    );


                remaining =
                    remaining.replace(
                        /^public\/?/,
                        ""
                    );


                const parts =
                    remaining.split("/");


                if (
                    parts[0] ===
                    "applicant-photos"
                ) {

                    parts.shift();

                }


                path =
                    parts.join("/");

            }

        } catch (error) {

            console.warn(
                "Could not parse storage URL.",
                error
            );

        }

    }


    return path;

}


/*=========================================================
  NOTIFICATIONS
=========================================================*/

async function loadNotifications() {

    const container =
        document.getElementById(
            "dashboardNotifications"
        );


    if (!container) return;


    container.innerHTML = "";


    let notifications = [];


    try {

        const snap =
            await getDocs(
                collection(
                    db,
                    "notifications"
                )
            );


        snap.forEach(
            docSnap => {

                const data =
                    docSnap.data();


                const recipient =
                    data.userId ||
                    data.recipientId ||
                    data.scholarId ||
                    data.uid ||
                    data.applicantId;


                if (
                    !recipient ||
                    recipient ===
                    currentUser.uid
                ) {

                    notifications.push({
                        id: docSnap.id,
                        ...data
                    });

                }

            }
        );


        notifications.sort(
            (a, b) => {

                return (
                    getTimestamp(
                        b.createdAt
                    ) -
                    getTimestamp(
                        a.createdAt
                    )
                );

            }
        );


        notifications =
            notifications.slice(
                0,
                3
            );

    } catch (error) {

        console.error(
            "Notification loading error:",
            error
        );

    }


    if (!notifications.length) {

        container.innerHTML = `
            <div class="notification-item">

                <i class="fas fa-circle-info"></i>

                <div>

                    <h4>
                        No notifications
                    </h4>

                    <p>
                        You're all caught up.
                    </p>

                </div>

            </div>
        `;

        return;

    }


    notifications.forEach(
        notification => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "notification-item";


            const title =
                notification.title ||
                notification.subject ||
                "Notification";


            const message =
                notification.message ||
                notification.description ||
                "";


            item.innerHTML = `
                <i class="fas fa-bell"></i>

                <div>

                    <h4>
                        ${escapeHtml(title)}
                    </h4>

                    <p>
                        ${escapeHtml(message)}
                    </p>

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

async function loadAnnouncements() {

    const container =
        document.getElementById(
            "dashboardAnnouncements"
        );


    if (!container) return;


    container.innerHTML = "";


    let announcements = [];


    try {

        const snap =
            await getDocs(
                collection(
                    db,
                    "announcements"
                )
            );


        snap.forEach(
            docSnap => {

                const data =
                    docSnap.data();


                const status =
                    String(
                        data.status ||
                        "published"
                    ).toLowerCase();


                if (
                    status !== "published" &&
                    status !== "active"
                ) {

                    return;

                }


                /*
                 * Audience filtering
                 */
                const audience =
                    String(
                        data.audience ||
                        data.recipient ||
                        data.recipients ||
                        "all"
                    ).toLowerCase();


                const isScholarAnnouncement =
                    audience === "all" ||
                    audience === "everyone" ||
                    audience === "scholar" ||
                    audience === "scholars" ||
                    audience === "all_scholars" ||
                    audience === "approved_scholars" ||
                    audience === "approved_scholar" ||
                    audience === "approved_scholars_only" ||
                    audience === "all_users" ||
                    audience === "all users" ||
                    audience.includes("scholar");


                if (
                    !isScholarAnnouncement
                ) {

                    return;

                }


                /*
                 * End date
                 */
                if (data.endDate) {

                    const end =
                        new Date(
                            data.endDate
                        ).getTime();


                    if (
                        end &&
                        Date.now() > end
                    ) {

                        return;

                    }

                }


                announcements.push({
                    id: docSnap.id,
                    ...data
                });

            }
        );


        announcements.sort(
            (a, b) => {

                return (
                    getTimestamp(
                        b.createdAt ||
                        b.publishDate
                    ) -
                    getTimestamp(
                        a.createdAt ||
                        a.publishDate
                    )
                );

            }
        );


        announcements =
            announcements.slice(
                0,
                3
            );

    } catch (error) {

        console.error(
            "Announcement loading error:",
            error
        );

    }


    if (!announcements.length) {

        container.innerHTML = `
            <div class="announcement-item">

                <h4>
                    No announcements
                </h4>

                <p>
                    No new announcements at this time.
                </p>

            </div>
        `;

        return;

    }


    announcements.forEach(
        announcement => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "announcement-item";


            item.innerHTML = `
                <h4>
                    ${escapeHtml(
                        announcement.title ||
                        "Announcement"
                    )}
                </h4>

                <p>
                    ${escapeHtml(
                        announcement.message ||
                        announcement.description ||
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
  SUBMISSION STATUS
=========================================================*/

function updateSubmissionStatus() {

    const gradesStatus =
        getDocumentStatus(
            currentScholar.grades,
            currentApplication.grades,
            currentApplication.files?.scholarDocuments?.grades
        );


    const corStatus =
        getDocumentStatus(
            currentScholar.cor,
            currentApplication.cor,
            currentApplication.files?.scholarDocuments?.cor
        );


    const scholarshipStatus =
        getScholarStatus();


    setElementText(
        "gradesStatus",
        formatStatus(gradesStatus)
    );


    setElementText(
        "corStatus",
        formatStatus(corStatus)
    );


    setElementText(
        "scholarStatus",
        formatStatus(scholarshipStatus)
    );


    setStatusCell(
        document.getElementById(
            "gradesStatusTable"
        ),
        gradesStatus
    );


    setStatusCell(
        document.getElementById(
            "corStatusTable"
        ),
        corStatus
    );


    setStatusCell(
        document.getElementById(
            "scholarshipStatusTable"
        ),
        scholarshipStatus
    );

}


/*=========================================================
  STATUS CELL
=========================================================*/

function setStatusCell(
    cell,
    status
) {

    if (!cell) return;


    const formatted =
        formatStatus(status);


    cell.textContent =
        formatted;


    cell.className =
        getStatusClass(status);

}


/*=========================================================
  STATUS CLASS
=========================================================*/

function getStatusClass(status) {

    const value =
        String(status || "")
            .toLowerCase();


    if (
        value.includes("verified") ||
        value.includes("approved") ||
        value.includes("active") ||
        value.includes("submitted") ||
        value.includes("passed")
    ) {

        return "verified";

    }


    if (
        value.includes("reject") ||
        value.includes("failed")
    ) {

        return "rejected";

    }


    return "pending";

}


/*=========================================================
  SCHEDULE
=========================================================*/

function updateSchedule() {

    const list =
        document.getElementById(
            "dashboardSchedule"
        );


    if (!list) return;


    list.innerHTML = "";


    const schedules = [];


    /*------------------------------------------
      EXAM
    ------------------------------------------*/

    if (
        currentApplication.examDate ||
        currentApplication.examSchedule
    ) {

        schedules.push({

            title:
                "Scholarship Exam",

            date:
                currentApplication.examDate ||
                currentApplication.examSchedule

        });

    }


    /*------------------------------------------
      EXAM TIME
    ------------------------------------------*/

    if (
        currentApplication.examTime
    ) {

        schedules.push({

            title:
                `Exam Time: ${currentApplication.examTime}`,

            date:
                currentApplication.examDate ||
                "Scheduled"

        });

    }


    /*------------------------------------------
      EXAM VENUE
    ------------------------------------------*/

    if (
        currentApplication.examVenue
    ) {

        schedules.push({

            title:
                `Venue: ${currentApplication.examVenue}`,

            date:
                currentApplication.examDate ||
                "Scheduled"

        });

    }


    /*------------------------------------------
      CUSTOM SCHEDULE
    ------------------------------------------*/

    const customSchedules =
        currentScholar.schedules ||
        currentApplication.schedules ||
        [];


    if (
        Array.isArray(
            customSchedules
        )
    ) {

        customSchedules.forEach(
            schedule => {

                schedules.push({

                    title:
                        schedule.title ||
                        schedule.name ||
                        "Schedule",

                    date:
                        schedule.date ||
                        schedule.datetime ||
                        ""

                });

            }
        );

    }


    if (!schedules.length) {

        list.innerHTML = `
            <li>
                No upcoming schedules
                <span>—</span>
            </li>
        `;

        return;

    }


    schedules
        .slice(0, 5)
        .forEach(
            schedule => {

                const li =
                    document.createElement(
                        "li"
                    );


                li.innerHTML = `
                    ${escapeHtml(
                        schedule.title
                    )}

                    <span>
                        ${escapeHtml(
                            formatDate(
                                schedule.date
                            )
                        )}
                    </span>
                `;


                list.appendChild(
                    li
                );

            }
        );

}


/*=========================================================
  QR CODE
=========================================================*/

function updateQRCode() {

    const qrImage =
        document.getElementById(
            "scholarQR"
        );


    const qrId =
        document.getElementById(
            "qrScholarId"
        );


    const qrPath =
        currentScholar.qrCodePath ||
        currentScholar.qrPath ||
        currentUserData.qrCodePath ||
        currentApplication.qrCodePath;


    if (qrId) {

        qrId.textContent =
            getScholarId();

    }


    if (!qrPath) {

        console.log(
            "No QR storage path found."
        );

        return;

    }


    const path =
        normalizeStoragePath(
            qrPath
        );


    loadQRFromStorage(
        path,
        qrImage
    );

}


/*=========================================================
  LOAD QR
=========================================================*/

async function loadQRFromStorage(
    path,
    imageElement
) {

    if (
        !path ||
        !imageElement
    ) {

        return;

    }


    try {

        const {
            data,
            error
        } =
            await supabase.storage
                .from("applicant-photos")
                .createSignedUrl(
                    path,
                    300
                );


        if (error) {

            console.error(
                "QR loading error:",
                error
            );

            return;

        }


        if (data?.signedUrl) {

            imageElement.src =
                data.signedUrl;

        }

    } catch (error) {

        console.error(
            "QR storage error:",
            error
        );

    }

}


/*=========================================================
  RECENT ACTIVITY
=========================================================*/

async function loadRecentActivity() {

    const list =
        document.getElementById(
            "recentActivity"
        );


    if (!list) return;


    list.innerHTML = "";


    const activities = [];


    /*------------------------------------------
      APPLICATION
    ------------------------------------------*/

    if (
        currentApplication.createdAt
    ) {

        activities.push({

            text:
                "Scholarship application submitted.",

            date:
                currentApplication.createdAt

        });

    }


    /*------------------------------------------
      UPDATED APPLICATION
    ------------------------------------------*/

    if (
        currentApplication.updatedAt
    ) {

        activities.push({

            text:
                "Scholarship application updated.",

            date:
                currentApplication.updatedAt

        });

    }


    /*------------------------------------------
      GRADES
    ------------------------------------------*/

    if (
        currentApplication.grades ||
        currentScholar.grades ||
        currentApplication.files?.scholarDocuments?.grades
    ) {

        const grades =
            currentApplication.grades ||
            currentScholar.grades ||
            currentApplication.files?.scholarDocuments?.grades;


        activities.push({

            text:
                "Grades submission recorded.",

            date:
                grades?.uploadedAt ||
                currentApplication.updatedAt

        });

    }


    /*------------------------------------------
      COR
    ------------------------------------------*/

    if (
        currentApplication.cor ||
        currentScholar.cor ||
        currentApplication.files?.scholarDocuments?.cor
    ) {

        const cor =
            currentApplication.cor ||
            currentScholar.cor ||
            currentApplication.files?.scholarDocuments?.cor;


        activities.push({

            text:
                "COR submission recorded.",

            date:
                cor?.uploadedAt ||
                currentApplication.updatedAt

        });

    }


    /*------------------------------------------
      SCHOLAR CONFIRMATION
    ------------------------------------------*/

    if (
        currentApplication.scholarConfirmed === true ||
        currentUserData.scholarConfirmed === true
    ) {

        activities.push({

            text:
                "Scholar account activated.",

            date:
                currentScholar.createdAt ||
                currentApplication.updatedAt

        });

    }


    activities.sort(
        (a, b) => {

            return (
                getTimestamp(b.date) -
                getTimestamp(a.date)
            );

        }
    );


    if (!activities.length) {

        list.innerHTML = `
            <li>
                No recent activity.
                <span>—</span>
            </li>
        `;

        return;

    }


    activities
        .slice(0, 5)
        .forEach(
            activity => {

                const li =
                    document.createElement(
                        "li"
                    );


                li.innerHTML = `
                    ${escapeHtml(
                        activity.text
                    )}

                    <span>
                        ${escapeHtml(
                            relativeDate(
                                activity.date
                            )
                        )}
                    </span>
                `;


                list.appendChild(
                    li
                );

            }
        );

}


/*=========================================================
  UPLOAD GRADES / COR
=========================================================*/

function setupUploads() {

    const gradesInput =
        document.getElementById(
            "gradesFile"
        );


    const corInput =
        document.getElementById(
            "corFile"
        );


    const gradesButton =
        document.getElementById(
            "uploadGradesBtn"
        );


    const corButton =
        document.getElementById(
            "uploadCORBtn"
        );


    if (
        gradesButton &&
        gradesInput
    ) {

        gradesButton.addEventListener(
            "click",
            async () => {

                if (
                    !gradesInput.files ||
                    !gradesInput.files.length
                ) {

                    alert(
                        "Please select your grades file first."
                    );

                    return;

                }


                try {

                    gradesButton.disabled =
                        true;

                    gradesButton.innerHTML =
                        "Uploading...";


                    await uploadScholarDocument(
                        gradesInput.files[0],
                        "grades"
                    );


                    gradesInput.value = "";


                    alert(
                        "Grades uploaded successfully."
                    );


                    await loadScholarDashboard(
                        currentUser.uid
                    );

                } catch (error) {

                    console.error(
                        "Grades upload error:",
                        error
                    );

                    alert(
                        error.message ||
                        "Grades upload failed."
                    );

                } finally {

                    gradesButton.disabled =
                        false;

                    gradesButton.innerHTML =
                        `<i class="fas fa-upload"></i>
                         Upload Grades`;

                }

            }
        );

    }


    if (
        corButton &&
        corInput
    ) {

        corButton.addEventListener(
            "click",
            async () => {

                if (
                    !corInput.files ||
                    !corInput.files.length
                ) {

                    alert(
                        "Please select your COR file first."
                    );

                    return;

                }


                try {

                    corButton.disabled =
                        true;

                    corButton.innerHTML =
                        "Uploading...";


                    await uploadScholarDocument(
                        corInput.files[0],
                        "cor"
                    );


                    corInput.value = "";


                    alert(
                        "Certificate of Registration uploaded successfully."
                    );


                    await loadScholarDashboard(
                        currentUser.uid
                    );

                } catch (error) {

                    console.error(
                        "COR upload error:",
                        error
                    );

                    alert(
                        error.message ||
                        "COR upload failed."
                    );

                } finally {

                    corButton.disabled =
                        false;

                    corButton.innerHTML =
                        `<i class="fas fa-upload"></i>
                         Upload COR`;

                }

            }
        );

    }

}


/*=========================================================
  UPLOAD SCHOLAR DOCUMENT
=========================================================*/

async function uploadScholarDocument(
    file,
    documentType
) {

    if (!currentUser) {

        throw new Error(
            "You are not logged in."
        );

    }


    const allowedTypes = [

        "application/pdf",

        "image/jpeg",

        "image/png"

    ];


    if (
        !allowedTypes.includes(
            file.type
        )
    ) {

        throw new Error(
            "Only PDF, JPG, JPEG, and PNG files are allowed."
        );

    }


    const maxSize =
        10 * 1024 * 1024;


    if (
        file.size > maxSize
    ) {

        throw new Error(
            "File size must not exceed 10MB."
        );

    }


    /*------------------------------------------
      STORAGE PATH
    ------------------------------------------*/

    const extension =
        getFileExtension(
            file.name
        );


    const path =
        `${currentUser.uid}/${documentType}_${Date.now()}.${extension}`;


    const {
        error: uploadError
    } =
        await supabase.storage
            .from("requirements")
            .upload(
                path,
                file,
                {
                    upsert: true,
                    contentType: file.type
                }
            );


    if (uploadError) {

        console.error(
            "Supabase upload error:",
            uploadError
        );

        throw new Error(
            "Unable to upload the file. Please check your storage configuration."
        );

    }


    /*------------------------------------------
      FIRESTORE METADATA
    ------------------------------------------*/

    const documentData = {

        name:
            file.name,

        originalName:
            file.name,

        storagePath:
            path,

        bucket:
            "requirements",

        contentType:
            file.type,

        size:
            file.size,

        status:
            "pending",

        verificationStatus:
            "pending",

        uploadedAt:
            new Date().toISOString()

    };


    const existingFiles =
        currentApplication.files ||
        {};


    const currentDocuments =
        existingFiles.scholarDocuments ||
        {};


    currentDocuments[documentType] =
        documentData;


    const updatedFiles = {

        ...existingFiles,

        scholarDocuments:
            currentDocuments

    };


    await updateDoc(

        doc(
            db,
            "applications",
            currentUser.uid
        ),

        {

            files:
                updatedFiles,

            [`files.scholarDocuments.${documentType}`]:
                documentData,

            updatedAt:
                serverTimestamp()

        }

    );


    /*
     * Try to notify admin.
     * If Firestore rules do not allow this,
     * it will not break the upload.
     */

    try {

        await addDoc(

            collection(
                db,
                "notifications"
            ),

            {

                userId:
                    currentUser.uid,

                applicantId:
                    currentUser.uid,

                title:
                    documentType === "grades"
                        ? "Grades Submitted"
                        : "COR Submitted",

                message:
                    documentType === "grades"
                        ? "A scholar has submitted grades for verification."
                        : "A scholar has submitted a Certificate of Registration for verification.",

                type:
                    "document_submission",

                documentType:
                    documentType,

                read:
                    false,

                createdAt:
                    serverTimestamp()

            }

        );

    } catch (notificationError) {

        console.warn(
            "Admin notification could not be created:",
            notificationError
        );

    }

}


/*=========================================================
  QR BUTTONS
=========================================================*/

function setupQRButtons() {

    const viewQR =
        document.getElementById(
            "viewQRBtn"
        );


    if (viewQR) {

        viewQR.addEventListener(
            "click",
            () => {

                window.location.href =
                    "qr-code.html";

            }
        );

    }


    const downloadQR =
        document.getElementById(
            "downloadQRBtn"
        );


    if (downloadQR) {

        downloadQR.addEventListener(
            "click",
            downloadQRCode
        );

    }

}


/*=========================================================
  DOWNLOAD QR
=========================================================*/

async function downloadQRCode() {

    const image =
        document.getElementById(
            "scholarQR"
        );


    if (
        !image ||
        !image.src
    ) {

        alert(
            "QR Code is not available."
        );

        return;

    }


    try {

        const response =
            await fetch(
                image.src
            );


        if (!response.ok) {

            throw new Error(
                "Unable to download QR."
            );

        }


        const blob =
            await response.blob();


        const url =
            URL.createObjectURL(
                blob
            );


        const link =
            document.createElement(
                "a"
            );


        link.href =
            url;


        link.download =
            `${getScholarId()}-QR.png`;


        document.body.appendChild(
            link
        );


        link.click();


        link.remove();


        URL.revokeObjectURL(
            url
        );

    } catch (error) {

        console.error(
            "QR download error:",
            error
        );

        alert(
            "Unable to download the QR Code."
        );

    }

}


/*=========================================================
  QUICK ACTIONS
=========================================================*/

function setupQuickActions() {

    const actionCards =
        document.querySelectorAll(
            ".action-card"
        );


    actionCards.forEach(
        card => {

            card.addEventListener(
                "click",
                event => {

                    const link =
                        card.getAttribute(
                            "href"
                        );


                    /*
                     * Let normal HTML links work.
                     */
                    if (link) {

                        return;

                    }

                }
            );

        }
    );

}


/*=========================================================
  SIDEBAR
=========================================================*/

function setupSidebar() {

    const menuItems =
        document.querySelectorAll(
            ".menu li"
        );


    const currentPage =
        window.location.pathname
            .split("/")
            .pop()
            .toLowerCase();


    menuItems.forEach(
        item => {

            const link =
                item.querySelector(
                    "a"
                );


            if (!link) return;


            const href =
                link.getAttribute(
                    "href"
                ) || "";


            const linkPage =
                href
                    .split("/")
                    .pop()
                    .toLowerCase();


            /*
             * Do NOT activate logout.
             */
            if (
                link.id ===
                "sidebarlogout"
            ) {

                return;

            }


            item.classList.remove(
                "active"
            );


            if (
                linkPage &&
                linkPage === currentPage
            ) {

                item.classList.add(
                    "active"
                );

            }

        }
    );

}


/*=========================================================
  LOGOUT
=========================================================*/

function setupLogout() {

    /*
     * IMPORTANT:
     * Your HTML uses lowercase:
     *
     * id="sidebarlogout"
     *
     * IDs are case-sensitive.
     */
    const logout =
        document.getElementById(
            "sidebarlogout"
        );


    const modal =
        document.getElementById(
            "logoutModal"
        );


    const cancel =
        document.getElementById(
            "cancelLogout"
        );


    const confirm =
        document.getElementById(
            "confirmLogout"
        );


    if (!logout) {

        console.error(
            "Logout button not found: #sidebarlogout"
        );

        return;

    }


    if (!modal) {

        console.error(
            "Logout modal not found: #logoutModal"
        );

        return;

    }


    /*------------------------------------------
      OPEN MODAL
    ------------------------------------------*/

    logout.addEventListener(
        "click",
        event => {

            event.preventDefault();

            modal.classList.add(
                "active"
            );

        }
    );


    /*------------------------------------------
      CANCEL
    ------------------------------------------*/

    if (cancel) {

        cancel.addEventListener(
            "click",
            () => {

                modal.classList.remove(
                    "active"
                );

            }
        );

    }


    /*------------------------------------------
      CONFIRM LOGOUT
    ------------------------------------------*/

    if (confirm) {

        confirm.addEventListener(
            "click",
            async () => {

                try {

                    confirm.disabled =
                        true;

                    confirm.textContent =
                        "Logging out...";


                    /*
                     * Clear local application
                     * storage first.
                     */
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


                    /*
                     * IMPORTANT:
                     * Firebase session is
                     * actually terminated here.
                     */
                    await signOut(auth);


                    console.log(
                        "Scholar successfully logged out."
                    );


                    /*
                     * IMPORTANT:
                     * Do NOT redirect to Home.html.
                     *
                     * Home.html is the dashboard.
                     *
                     * Go back to your actual
                     * login page.
                     */
                    window.location.href =
                        "../login/index.html";

                } catch (error) {

                    console.error(
                        "Logout error:",
                        error
                    );


                    confirm.disabled =
                        false;


                    confirm.textContent =
                        "Logout";


                    alert(
                        "Unable to logout. Please try again."
                    );

                }

            }
        );

    }


    /*------------------------------------------
      CLICK OUTSIDE MODAL
    ------------------------------------------*/

    modal.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                modal
            ) {

                modal.classList.remove(
                    "active"
                );

            }

        }
    );


    /*------------------------------------------
      ESC KEY
    ------------------------------------------*/

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape" &&
                modal.classList.contains(
                    "active"
                )
            ) {

                modal.classList.remove(
                    "active"
                );

            }

        }
    );

}


/*=========================================================
  CARD ANIMATION
=========================================================*/

function setupCardAnimation() {

    const cards =
        document.querySelectorAll(
            ".card, .dashboard-card, .action-card"
        );


    cards.forEach(
        (card, index) => {

            card.style.opacity =
                "0";

            card.style.transform =
                "translateY(20px)";


            setTimeout(
                () => {

                    card.style.transition =
                        "0.5s ease";

                    card.style.opacity =
                        "1";

                    card.style.transform =
                        "translateY(0)";

                },
                index * 80
            );


            card.addEventListener(
                "mouseenter",
                () => {

                    card.style.transform =
                        "translateY(-5px)";

                }
            );


            card.addEventListener(
                "mouseleave",
                () => {

                    card.style.transform =
                        "translateY(0)";

                }
            );

        }
    );

}


/*=========================================================
  ERROR DISPLAY
=========================================================*/

function showDashboardError() {

    const welcome =
        document.querySelector(
            ".topbar h1"
        );


    if (welcome) {

        welcome.textContent =
            "Unable to load dashboard";

    }

}


/*=========================================================
  SET ELEMENT TEXT
=========================================================*/

function setElementText(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (element) {

        element.textContent =
            value ?? "—";

    }

}


/*=========================================================
  TIMESTAMP HELPER
=========================================================*/

function getTimestamp(value) {

    if (!value) return 0;


    if (
        typeof value.toMillis ===
        "function"
    ) {

        return value.toMillis();

    }


    if (
        value.seconds !== undefined
    ) {

        return (
            value.seconds * 1000
        );

    }


    if (
        value instanceof Date
    ) {

        return value.getTime();

    }


    const parsed =
        new Date(
            value
        ).getTime();


    return isNaN(parsed)
        ? 0
        : parsed;

}


/*=========================================================
  DATE FORMAT
=========================================================*/

function formatDate(value) {

    const timestamp =
        getTimestamp(value);


    if (!timestamp) {

        return "—";

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
  RELATIVE DATE
=========================================================*/

function relativeDate(value) {

    const timestamp =
        getTimestamp(value);


    if (!timestamp) {

        return "Recently";

    }


    const diff =
        Date.now() -
        timestamp;


    const minutes =
        Math.floor(
            diff / 60000
        );


    if (minutes < 1) {

        return "Just now";

    }


    if (minutes < 60) {

        return `${minutes} min ago`;

    }


    const hours =
        Math.floor(
            minutes / 60
        );


    if (hours < 24) {

        return `${hours} hr ago`;

    }


    const days =
        Math.floor(
            hours / 24
        );


    if (days < 7) {

        return `${days} day${days > 1 ? "s" : ""} ago`;

    }


    return formatDate(
        value
    );

}


/*=========================================================
  FILE EXTENSION
=========================================================*/

function getFileExtension(
    filename
) {

    const parts =
        String(filename)
            .split(".");


    return (
        parts.length > 1
            ? parts.pop().toLowerCase()
            : "file"
    );

}


/*=========================================================
  HTML ESCAPE
=========================================================*/

function escapeHtml(
    value
) {

    return String(
        value ?? ""
    )
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
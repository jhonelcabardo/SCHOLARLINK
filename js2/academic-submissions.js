/* =========================================================
   SCHOLARLINK
   ACADEMIC SUBMISSIONS
   grades + COR
========================================================= */

import { auth, db } from "../firebase.js";

import {
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
    doc,
    getDoc,
    collection,
    query,
    where,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* =========================================================
   PAGE
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    console.log(
        "ScholarLink Academic Submissions Loaded"
    );


    /* =====================================================
       CURRENT YEAR
    ====================================================== */

    const footerYear =
        document.getElementById("footerYear");

    if (footerYear) {

        footerYear.textContent =
            new Date().getFullYear();

    }


    /* =====================================================
       ELEMENTS
    ====================================================== */

    const tabs =
        document.querySelectorAll(
            ".submission-tab"
        );

    const panels =
        document.querySelectorAll(
            ".submission-panel"
        );


    /* =====================================================
       TAB COMPATIBILITY
    ====================================================== */

    tabs.forEach(tab => {

        tab.addEventListener(
            "click",
            () => {

                const target =
                    tab.dataset.target;


                tabs.forEach(item => {

                    item.classList.remove(
                        "active"
                    );

                });


                panels.forEach(panel => {

                    panel.classList.remove(
                        "active"
                    );

                });


                tab.classList.add(
                    "active"
                );


                const targetPanel =
                    document.getElementById(
                        target
                    );


                if (targetPanel) {

                    targetPanel.classList.add(
                        "active"
                    );

                }

            }
        );

    });


    /* =====================================================
       MOBILE SIDEBAR
    ====================================================== */

    const menuToggle =
        document.getElementById(
            "menuToggle"
        );


    const sidebar =
        document.getElementById(
            "sidebar"
        );


    const sidebarOverlay =
        document.getElementById(
            "sidebarOverlay"
        );


    function closeSidebar() {

        sidebar?.classList.remove(
            "open"
        );

        sidebarOverlay?.classList.remove(
            "show"
        );

    }


    function openSidebar() {

        sidebar?.classList.add(
            "open"
        );

        sidebarOverlay?.classList.add(
            "show"
        );

    }


    if (menuToggle) {

        menuToggle.addEventListener(
            "click",
            () => {

                if (
                    sidebar?.classList.contains(
                        "open"
                    )
                ) {

                    closeSidebar();

                } else {

                    openSidebar();

                }

            }
        );

    }


    if (sidebarOverlay) {

        sidebarOverlay.addEventListener(
            "click",
            closeSidebar
        );

    }


    sidebar
        ?.querySelectorAll("a")
        .forEach(link => {

            link.addEventListener(
                "click",
                closeSidebar
            );

        });


    /* =====================================================
       CURRENT USER
    ====================================================== */
        let currentUser = null;

   onAuthStateChanged(auth, async user => {

    if (!user) {
        window.location.href =
            "../login/index.html";

        return;
    }

    currentUser = user;

    console.log(
        "Authenticated scholar:",
        user.uid
    );

    await loadUserDisplay();
}
);

    

    /* =====================================================
   USER DISPLAY
====================================================== */

async function loadUserDisplay() {

    if (!currentUser) {
        return;
    }

    const name =
        currentUser.displayName ||
        currentUser.email?.split("@")[0] ||
        "Scholar";

    const email =
        currentUser.email || "";

    const photo =
        currentUser.photoURL || "";

    const uid =
        currentUser.uid || "";


    /* =================================================
       ELEMENTS
    ================================================= */

    const topScholarName =
        document.getElementById(
            "topScholarName"
        );

    const topScholarId =
        document.getElementById(
            "topScholarId"
        );

    const topProfilePhoto =
        document.getElementById(
            "topProfilePhoto"
        );

    const gradesSubmittedBy =
        document.getElementById(
            "gradesSubmittedBy"
        );

    const gradesScholarId =
        document.getElementById(
            "gradesScholarId"
        );

    const corScholarName =
        document.getElementById(
            "corScholarName"
        );

    const corScholarId =
        document.getElementById(
            "corScholarId"
        );

    const studentId =
        document.getElementById(
            "studentId"
        );


    /* =================================================
       DEFAULT VALUES
    ================================================= */

    let scholarId = "";
    let actualStudentId = "";


    /* =================================================
       FIND SCHOLAR RECORD
       scholars collection
       userId == Firebase UID
    ================================================= */

    try {

        const scholarsRef =
            collection(db, "scholars");

        const scholarQuery =
            query(
                scholarsRef,
                where("userId", "==", uid)
            );

        const scholarSnapshot =
            await getDocs(scholarQuery);


        if (!scholarSnapshot.empty) {

            const scholarDoc =
                scholarSnapshot.docs[0];

            const scholarData =
                scholarDoc.data();


            scholarId =
                scholarData.scholarId ||
                scholarData.applicantId ||
                "";

            actualStudentId =
                scholarData.studentId ||
                "";

            console.log(
                "Scholar record found:",
                scholarData
            );

            console.log(
                "Scholar ID:",
                scholarId
            );

        }

    } catch (error) {

        console.error(
            "Error loading scholar record:",
            error
        );
    }


    /* =================================================
       FALLBACK: USERS COLLECTION
       users/{Firebase UID}
    ================================================= */

    if (!scholarId || !actualStudentId) {

        try {

            const userRef =
                doc(
                    db,
                    "users",
                    uid
                );

            const userSnapshot =
                await getDoc(userRef);


            if (userSnapshot.exists()) {

                const userData =
                    userSnapshot.data();


                if (!scholarId) {

                    scholarId =
                        userData.scholarId ||
                        userData.applicantId ||
                        "";
                }


                if (!actualStudentId) {

                    actualStudentId =
                        userData.studentId ||
                        "";
                }


                console.log(
                    "User record found:",
                    userData
                );

            }

        } catch (error) {

            console.error(
                "Error loading user record:",
                error
            );
        }
    }


    /* =================================================
       NAME
    ================================================= */

    if (topScholarName) {

        topScholarName.textContent =
            name;
    }


    /* =================================================
       PROFILE PHOTO
    ================================================= */

    if (
        topProfilePhoto &&
        photo
    ) {

        topProfilePhoto.src =
            photo;
    }


    /* =================================================
       SCHOLAR ID
       IMPORTANT:
       DO NOT USE FIREBASE UID
    ================================================= */

    if (topScholarId) {

        topScholarId.textContent =
            scholarId || "—";
    }


    /* =================================================
       GRADES
    ================================================= */

    if (gradesSubmittedBy) {

        gradesSubmittedBy.value =
            name;
    }


    if (gradesScholarId) {

        gradesScholarId.value =
            scholarId || "";
    }


    /* =================================================
       COR
    ================================================= */

    if (corScholarName) {

        corScholarName.value =
            name;
    }


    if (corScholarId) {

        corScholarId.value =
            scholarId || "";
    }


    /* =================================================
       STUDENT ID
    ================================================= */

    if (studentId) {

        studentId.value =
            actualStudentId || "";
    }


    /* =================================================
       DEBUG
    ================================================= */

    console.log(
        "Scholar email:",
        email
    );

    console.log(
        "Firebase UID:",
        uid
    );

    console.log(
        "Displayed Scholar ID:",
        scholarId || "NOT FOUND"
    );

    console.log(
        "Displayed Student ID:",
        actualStudentId || "NOT FOUND"
    );
}

    /* =====================================================
       COMMON FILE VALIDATION
    ====================================================== */

    function validatePDF(file) {

        if (!file) {

            alert(
                "Please select a PDF file."
            );

            return false;

        }


        const isPDF =
            file.type ===
                "application/pdf" ||
            file.name
                .toLowerCase()
                .endsWith(".pdf");


        if (!isPDF) {

            alert(
                "Only PDF files are allowed."
            );

            return false;

        }


        const maxSize =
            10 * 1024 * 1024;


        if (
            file.size >
            maxSize
        ) {

            alert(
                "Maximum file size is 10MB."
            );

            return false;

        }


        return true;

    }


    /* =====================================================
       FILE SIZE
    ====================================================== */

    function formatFileSize(bytes) {

        if (!bytes) {

            return "0 KB";

        }


        const mb =
            bytes /
            (1024 * 1024);


        if (mb >= 1) {

            return (
                mb.toFixed(2) +
                " MB"
            );

        }


        return (
            (bytes / 1024)
                .toFixed(0) +
            " KB"
        );

    }


    /* =====================================================
       DATE
    ====================================================== */

    function formatDate(date) {

        if (!date) {

            return "—";

        }


        return new Intl.DateTimeFormat(
            "en-US",
            {
                month: "short",
                day: "numeric",
                year: "numeric"
            }
        ).format(date);

    }


    /* =====================================================
       SELECTED FILE
    ====================================================== */

    function showSelectedFile(
        file,
        elementId
    ) {

        const element =
            document.getElementById(
                elementId
            );


        if (!element) {

            return;

        }


        const span =
            element.querySelector(
                "span"
            );


        if (!file) {

            if (span) {

                span.textContent =
                    "No file selected";

            }

            return;

        }


        if (span) {

            span.textContent =
                file.name +
                " • " +
                formatFileSize(
                    file.size
                );

        }

    }


    /* =====================================================
       GRADES FILE
    ====================================================== */

    const gradesFile =
        document.getElementById(
            "gradesFile"
        );


    if (gradesFile) {

        gradesFile.addEventListener(
            "change",
            () => {

                const file =
                    gradesFile.files[0];


                if (!file) {

                    return;

                }


                if (
                    !validatePDF(file)
                ) {

                    gradesFile.value =
                        "";

                    showSelectedFile(
                        null,
                        "gradesSelectedFile"
                    );

                    return;

                }


                showSelectedFile(
                    file,
                    "gradesSelectedFile"
                );

            }
        );

    }


    /* =====================================================
       COR FILE
    ====================================================== */

    const corFile =
        document.getElementById(
            "corFile"
        );


    if (corFile) {

        corFile.addEventListener(
            "change",
            () => {

                const file =
                    corFile.files[0];


                if (!file) {

                    return;

                }


                if (
                    !validatePDF(file)
                ) {

                    corFile.value =
                        "";

                    showSelectedFile(
                        null,
                        "corSelectedFile"
                    );

                    return;

                }


                showSelectedFile(
                    file,
                    "corSelectedFile"
                );

            }
        );

    }


    /* =====================================================
       DRAG & DROP
    ====================================================== */

    function setupDragDrop(
        dropArea,
        input
    ) {

        if (
            !dropArea ||
            !input
        ) {

            return;

        }


        [
            "dragenter",
            "dragover"
        ].forEach(
            eventName => {

                dropArea.addEventListener(
                    eventName,
                    event => {

                        event.preventDefault();

                        event.stopPropagation();

                        dropArea.classList.add(
                            "drag-over"
                        );

                    }
                );

            }
        );


        [
            "dragleave",
            "drop"
        ].forEach(
            eventName => {

                dropArea.addEventListener(
                    eventName,
                    event => {

                        event.preventDefault();

                        event.stopPropagation();

                        dropArea.classList.remove(
                            "drag-over"
                        );

                    }
                );

            }
        );


        dropArea.addEventListener(
            "drop",
            event => {

                const files =
                    event.dataTransfer.files;


                if (
                    !files ||
                    !files.length
                ) {

                    return;

                }


                const file =
                    files[0];


                if (
                    !validatePDF(file)
                ) {

                    return;

                }


                try {

                    const dataTransfer =
                        new DataTransfer();


                    dataTransfer.items.add(
                        file
                    );


                    input.files =
                        dataTransfer.files;

                } catch (error) {

                    console.warn(
                        "Browser does not allow assigning dropped file.",
                        error
                    );

                }


                const selectedId =
                    input.id ===
                        "gradesFile"
                        ? "gradesSelectedFile"
                        : "corSelectedFile";


                showSelectedFile(
                    file,
                    selectedId
                );

            }
        );

    }


    setupDragDrop(
        document.getElementById(
            "gradesDropArea"
        ),
        gradesFile
    );


    setupDragDrop(
        document.getElementById(
            "corDropArea"
        ),
        corFile
    );


    /* =====================================================
       SIMULATED UPLOAD
       
       IMPORTANT:
       This preserves your current behavior.
       Permanent storage is not added here.
    ====================================================== */

    function simulateUpload() {

        return new Promise(
            resolve => {

                setTimeout(
                    resolve,
                    700
                );

            }
        );

    }


    /* =====================================================
       HISTORY
    ====================================================== */

    function addHistoryRow(
        bodyId,
        documentName,
        file,
        statusText = "Submitted"
    ) {

        const body =
            document.getElementById(
                bodyId
            );


        if (
            !body ||
            !file
        ) {

            return;

        }


        const placeholder =
            body.querySelector(
                ".history-placeholder"
            );


        if (placeholder) {

            placeholder.remove();

        }


        const row =
            document.createElement(
                "tr"
            );


        row.innerHTML = `
            <td>
                ${formatDate(new Date())}
            </td>

            <td>
                ${escapeHtml(documentName)}
            </td>

            <td>
                ${escapeHtml(file.name)}
            </td>

            <td>
                <span class="status-badge pending">
                    ${escapeHtml(statusText)}
                </span>
            </td>

            <td>
                <button
                    type="button"
                    class="view-btn history-view">
                    View
                </button>
            </td>
        `;


        body.prepend(row);

    }


    /* =====================================================
       HTML ESCAPE
    ====================================================== */

    function escapeHtml(value) {

        return String(value)
            .replace(
                /[&<>"']/g,
                character => {

                    const map = {

                        "&":
                            "&amp;",

                        "<":
                            "&lt;",

                        ">":
                            "&gt;",

                        '"':
                            "&quot;",

                        "'":
                            "&#039;"

                    };


                    return map[
                        character
                    ];

                }
            );

    }


    /* =====================================================
       GRADES UPLOAD
    ====================================================== */

    const uploadGradesBtn =
        document.getElementById(
            "uploadGradesBtn"
        );


    if (uploadGradesBtn) {

        uploadGradesBtn.addEventListener(
            "click",
            async () => {

                if (!currentUser) {

                    alert(
                        "Please login first."
                    );

                    return;

                }


                const file =
                    gradesFile?.files[0];


                if (
                    !validatePDF(file)
                ) {

                    return;

                }


                uploadGradesBtn.disabled =
                    true;


                uploadGradesBtn.innerHTML =
                    `
                    <i class="fas fa-spinner fa-spin"></i>
                    Uploading...
                    `;


                try {

                    await simulateUpload();


                    updateGradesUI(
                        file
                    );


                    addHistoryRow(
                        "gradesHistoryBody",
                        "Grades",
                        file
                    );


                    alert(
                        "Grades file selected successfully.\n\n" +
                        "The file is ready for submission."
                    );

                } catch (error) {

                    console.error(
                        "Grades upload error:",
                        error
                    );


                    alert(
                        "Unable to upload grades. Please try again."
                    );

                } finally {

                    uploadGradesBtn.disabled =
                        false;


                    uploadGradesBtn.innerHTML =
                        `
                        <i class="fas fa-cloud-arrow-up"></i>
                        Submit Grades
                        `;

                }

            }
        );

    }


    /* =====================================================
       COR UPLOAD
    ====================================================== */

    const uploadCorBtn =
        document.getElementById(
            "uploadCorBtn"
        );


    if (uploadCorBtn) {

        uploadCorBtn.addEventListener(
            "click",
            async () => {

                if (!currentUser) {

                    alert(
                        "Please login first."
                    );

                    return;

                }


                const file =
                    corFile?.files[0];


                if (
                    !validatePDF(file)
                ) {

                    return;

                }


                uploadCorBtn.disabled =
                    true;


                uploadCorBtn.innerHTML =
                    `
                    <i class="fas fa-spinner fa-spin"></i>
                    Uploading...
                    `;


                try {

                    await simulateUpload();


                    updateCorUI(
                        file
                    );


                    addHistoryRow(
                        "corHistoryBody",
                        "COR",
                        file
                    );


                    alert(
                        "COR file selected successfully.\n\n" +
                        "The file is ready for submission."
                    );

                } catch (error) {

                    console.error(
                        "COR upload error:",
                        error
                    );


                    alert(
                        "Unable to upload COR. Please try again."
                    );

                } finally {

                    uploadCorBtn.disabled =
                        false;


                    uploadCorBtn.innerHTML =
                        `
                        <i class="fas fa-cloud-arrow-up"></i>
                        Submit COR
                        `;

                }

            }
        );

    }


    /* =====================================================
       UPDATE GRADES UI
    ====================================================== */

    function updateGradesUI(file) {

        const now =
            new Date();


        const status =
            document.getElementById(
                "gradesStatus"
            );


        const verification =
            document.getElementById(
                "gradesVerification"
            );


        const fileName =
            document.getElementById(
                "gradesFileName"
            );


        const fileDate =
            document.getElementById(
                "gradesFileDate"
            );


        const fileSize =
            document.getElementById(
                "gradesFileSize"
            );


        const fileStatus =
            document.getElementById(
                "gradesFileStatus"
            );


        const submissionDate =
            document.getElementById(
                "gradesSubmissionDate"
            );


        const submissionStatus =
            document.getElementById(
                "gradesSubmissionStatus"
            );


        const visibleStatus =
            document.getElementById(
                "gradesStatusVisible"
            );


        const visibleDate =
            document.getElementById(
                "gradesDateVisible"
            );


        if (status) {

            status.textContent =
                "Submitted";

        }


        if (verification) {

            verification.textContent =
                "Waiting";

        }


        if (fileName) {

            fileName.textContent =
                file.name;

        }


        if (fileDate) {

            fileDate.textContent =
                "Uploaded: " +
                formatDate(now);

        }


        if (fileSize) {

            fileSize.textContent =
                "File Size: " +
                formatFileSize(
                    file.size
                );

        }


        if (fileStatus) {

            fileStatus.textContent =
                "SUBMITTED";

            fileStatus.className =
                "status-badge submitted";

        }


        if (submissionDate) {

            submissionDate.value =
                formatDate(now);

        }


        if (submissionStatus) {

            submissionStatus.value =
                "Submitted";

        }


        if (visibleStatus) {

            visibleStatus.textContent =
                "Submitted";

            visibleStatus.className =
                "status-text submitted-text";

        }


        if (visibleDate) {

            visibleDate.textContent =
                formatDate(now);

        }


        activateTimeline(
            "gradesTimeline",
            1
        );

    }


    /* =====================================================
       UPDATE COR UI
    ====================================================== */

    function updateCorUI(file) {

        const now =
            new Date();


        const status =
            document.getElementById(
                "corStatus"
            );


        const verification =
            document.getElementById(
                "corVerification"
            );


        const fileName =
            document.getElementById(
                "corFileName"
            );


        const fileDate =
            document.getElementById(
                "corFileDate"
            );


        const fileSize =
            document.getElementById(
                "corFileSize"
            );


        const fileStatus =
            document.getElementById(
                "corFileStatus"
            );


        const submissionDate =
            document.getElementById(
                "corSubmissionDate"
            );


        const submissionStatus =
            document.getElementById(
                "corSubmissionStatus"
            );


        const uploadedDate =
            document.getElementById(
                "corUploadedDate"
            );


        const visibleStatus =
            document.getElementById(
                "corStatusVisible"
            );


        const visibleDate =
            document.getElementById(
                "corDateVisible"
            );


        if (status) {

            status.textContent =
                "Submitted";

        }


        if (verification) {

            verification.textContent =
                "Waiting";

        }


        if (fileName) {

            fileName.textContent =
                file.name;

        }


        if (fileDate) {

            fileDate.textContent =
                "Uploaded: " +
                formatDate(now);

        }


        if (fileSize) {

            fileSize.textContent =
                "File Size: " +
                formatFileSize(
                    file.size
                );

        }


        if (fileStatus) {

            fileStatus.textContent =
                "SUBMITTED";

            fileStatus.className =
                "status-badge submitted";

        }


        if (submissionDate) {

            submissionDate.value =
                formatDate(now);

        }


        if (submissionStatus) {

            submissionStatus.value =
                "Submitted";

        }


        if (uploadedDate) {

            uploadedDate.textContent =
                formatDate(now);

        }


        if (visibleStatus) {

            visibleStatus.textContent =
                "Submitted";

            visibleStatus.className =
                "status-text submitted-text";

        }


        if (visibleDate) {

            visibleDate.textContent =
                formatDate(now);

        }

    }


    /* =====================================================
       TIMELINE
    ====================================================== */

    function activateTimeline(
        timelineId,
        activeIndex
    ) {

        const timeline =
            document.getElementById(
                timelineId
            );


        if (!timeline) {

            return;

        }


        const items =
            timeline.querySelectorAll(
                ".timeline-item"
            );


        items.forEach(
            (item, index) => {

                const circle =
                    item.querySelector(
                        ".circle"
                    );


                if (
                    index <= activeIndex
                ) {

                    item.classList.add(
                        "active"
                    );


                    if (circle) {

                        circle.classList.add(
                            "active"
                        );

                    }

                }

            }
        );

    }


    /* =====================================================
       REPLACE
    ====================================================== */

    const replaceGradesBtn =
        document.getElementById(
            "replaceGradesBtn"
        );


    if (replaceGradesBtn) {

        replaceGradesBtn.addEventListener(
            "click",
            () => {

                if (gradesFile) {

                    gradesFile.click();

                }

            }
        );

    }


    const replaceCorBtn =
        document.getElementById(
            "replaceCorBtn"
        );


    if (replaceCorBtn) {

        replaceCorBtn.addEventListener(
            "click",
            () => {

                if (corFile) {

                    corFile.click();

                }

            }
        );

    }


    /* =====================================================
       DELETE GRADES
    ====================================================== */

    const deleteGradesBtn =
        document.getElementById(
            "deleteGradesBtn"
        );


    if (deleteGradesBtn) {

        deleteGradesBtn.addEventListener(
            "click",
            () => {

                const confirmed =
                    confirm(
                        "Delete your submitted grades?"
                    );


                if (!confirmed) {

                    return;

                }


                if (gradesFile) {

                    gradesFile.value =
                        "";

                }


                showSelectedFile(
                    null,
                    "gradesSelectedFile"
                );


                const fileName =
                    document.getElementById(
                        "gradesFileName"
                    );


                const status =
                    document.getElementById(
                        "gradesStatus"
                    );


                const fileStatus =
                    document.getElementById(
                        "gradesFileStatus"
                    );


                const visibleStatus =
                    document.getElementById(
                        "gradesStatusVisible"
                    );


                const visibleDate =
                    document.getElementById(
                        "gradesDateVisible"
                    );


                const fileDate =
                    document.getElementById(
                        "gradesFileDate"
                    );


                const fileSize =
                    document.getElementById(
                        "gradesFileSize"
                    );


                const verification =
                    document.getElementById(
                        "gradesVerification"
                    );


                if (fileName) {

                    fileName.textContent =
                        "No grades file uploaded";

                }


                if (fileDate) {

                    fileDate.textContent =
                        "No submission yet.";

                }


                if (fileSize) {

                    fileSize.textContent =
                        "File Size: —";

                }


                if (verification) {

                    verification.textContent =
                        "Waiting";

                }


                if (status) {

                    status.textContent =
                        "Pending";

                }


                if (fileStatus) {

                    fileStatus.textContent =
                        "PENDING";

                    fileStatus.className =
                        "status-badge pending";

                }


                if (visibleStatus) {

                    visibleStatus.textContent =
                        "Pending";

                    visibleStatus.className =
                        "status-text pending-text";

                }


                if (visibleDate) {

                    visibleDate.textContent =
                        "—";

                }


                alert(
                    "Grades submission removed from the current page."
                );

            }
        );

    }


    /* =====================================================
       DELETE COR
    ====================================================== */

    const deleteCorBtn =
        document.getElementById(
            "deleteCorBtn"
        );


    if (deleteCorBtn) {

        deleteCorBtn.addEventListener(
            "click",
            () => {

                const confirmed =
                    confirm(
                        "Delete your uploaded COR?"
                    );


                if (!confirmed) {

                    return;

                }


                if (corFile) {

                    corFile.value =
                        "";

                }


                showSelectedFile(
                    null,
                    "corSelectedFile"
                );


                const fileName =
                    document.getElementById(
                        "corFileName"
                    );


                const status =
                    document.getElementById(
                        "corStatus"
                    );


                const fileStatus =
                    document.getElementById(
                        "corFileStatus"
                    );


                const visibleStatus =
                    document.getElementById(
                        "corStatusVisible"
                    );


                const visibleDate =
                    document.getElementById(
                        "corDateVisible"
                    );


                const fileDate =
                    document.getElementById(
                        "corFileDate"
                    );


                const fileSize =
                    document.getElementById(
                        "corFileSize"
                    );


                const verification =
                    document.getElementById(
                        "corVerification"
                    );


                if (fileName) {

                    fileName.textContent =
                        "No COR file uploaded";

                }


                if (fileDate) {

                    fileDate.textContent =
                        "No submission yet.";

                }


                if (fileSize) {

                    fileSize.textContent =
                        "File Size: —";

                }


                if (verification) {

                    verification.textContent =
                        "Waiting";

                }


                if (status) {

                    status.textContent =
                        "Pending";

                }


                if (fileStatus) {

                    fileStatus.textContent =
                        "PENDING";

                    fileStatus.className =
                        "status-badge pending";

                }


                if (visibleStatus) {

                    visibleStatus.textContent =
                        "Pending";

                    visibleStatus.className =
                        "status-text pending-text";

                }


                if (visibleDate) {

                    visibleDate.textContent =
                        "—";

                }


                alert(
                    "COR submission removed from the current page."
                );

            }
        );

    }


    /* =====================================================
       VIEW BUTTONS
    ====================================================== */

    document.addEventListener(
        "click",
        event => {

            const viewButton =
                event.target.closest(
                    ".view-btn"
                );


            if (!viewButton) {

                return;

            }


            alert(
                "Opening submitted PDF..."
            );

        }
    );


    /* =====================================================
       DOWNLOAD FILE
    ====================================================== */

    function downloadFile(
        input,
        message
    ) {

        if (
            !input ||
            !input.files.length
        ) {

            alert(message);

            return;

        }


        const file =
            input.files[0];


        const url =
            URL.createObjectURL(
                file
            );


        const link =
            document.createElement(
                "a"
            );


        link.href =
            url;


        link.download =
            file.name;


        document.body.appendChild(
            link
        );


        link.click();


        link.remove();


        URL.revokeObjectURL(
            url
        );

    }


    /* =====================================================
       DOWNLOAD GRADES
    ====================================================== */

    const downloadGradesBtn =
        document.getElementById(
            "downloadGradesBtn"
        );


    if (downloadGradesBtn) {

        downloadGradesBtn.addEventListener(
            "click",
            () => {

                downloadFile(
                    gradesFile,
                    "No grades PDF is available."
                );

            }
        );

    }


    /* =====================================================
       DOWNLOAD COR
    ====================================================== */

    const downloadCorBtn =
        document.getElementById(
            "downloadCorBtn"
        );


    if (downloadCorBtn) {

        downloadCorBtn.addEventListener(
            "click",
            () => {

                downloadFile(
                    corFile,
                    "No COR PDF is available."
                );

            }
        );

    }


    /* =====================================================
       DOWNLOAD COPY
    ====================================================== */

    const downloadGradesCopyBtn =
        document.getElementById(
            "downloadGradesCopyBtn"
        );


    if (downloadGradesCopyBtn) {

        downloadGradesCopyBtn.addEventListener(
            "click",
            () => {

                downloadGradesBtn?.click();

            }
        );

    }


    const downloadCorCopyBtn =
        document.getElementById(
            "downloadCorCopyBtn"
        );


    if (downloadCorCopyBtn) {

        downloadCorCopyBtn.addEventListener(
            "click",
            () => {

                downloadCorBtn?.click();

            }
        );

    }


    /* =====================================================
       PRINT
    ====================================================== */

    const printGradesBtn =
        document.getElementById(
            "printGradesBtn"
        );


    if (printGradesBtn) {

        printGradesBtn.addEventListener(
            "click",
            () => {

                window.print();

            }
        );

    }


    const printCorBtn =
        document.getElementById(
            "printCorBtn"
        );


    if (printCorBtn) {

        printCorBtn.addEventListener(
            "click",
            () => {

                window.print();

            }
        );

    }


    /* =====================================================
       LOGOUT
    ====================================================== */

    const logoutLink =
    document.getElementById(
        "sidebarlogout"
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


    /* =====================================================
       OPEN LOGOUT
    ====================================================== */

    if (
        logoutLink &&
        logoutModal
    ) {

        logoutLink.addEventListener(
            "click",
            event => {

                event.preventDefault();


                logoutModal.classList.add(
                    "active"
                );


                document.body.style.overflow =
                    "hidden";

            }
        );

    }


    /* =====================================================
       CANCEL LOGOUT
    ====================================================== */

    if (
        cancelLogout &&
        logoutModal
    ) {

        cancelLogout.addEventListener(
            "click",
            () => {

                logoutModal.classList.remove(
                    "active"
                );


                document.body.style.overflow =
                    "";

            }
        );

    }


    /* =====================================================
       CLOSE MODAL OUTSIDE
    ====================================================== */

    if (logoutModal) {

        logoutModal.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                        logoutModal ||
                    event.target.classList.contains(
                        "logout-overlay"
                    )
                ) {

                    logoutModal.classList.remove(
                        "active"
                    );


                    document.body.style.overflow =
                        "";

                }

            }
        );

    }


    /* =====================================================
       CONFIRM LOGOUT
    ====================================================== */

    if (
        confirmLogout &&
        logoutModal
    ) {

        confirmLogout.addEventListener(
            "click",
            async () => {

                try {

                    confirmLogout.disabled =
                        true;


                    confirmLogout.classList.add(
                        "loading"
                    );


                    confirmLogout.textContent =
                        "Logging out...";


                    await signOut(
                        auth
                    );


                    localStorage.clear();

                    sessionStorage.clear();


                    window.location.href =
                        "../login/index.html";

                } catch (error) {

                    console.error(
                        "Logout error:",
                        error
                    );


                    confirmLogout.disabled =
                        false;


                    confirmLogout.classList.remove(
                        "loading"
                    );


                    confirmLogout.textContent =
                        "Logout";


                    alert(
                        "Unable to logout. Please try again."
                    );

                }

            }
        );

    }


    /* =====================================================
       RESPONSIVE CLEANUP
    ====================================================== */

    window.addEventListener(
        "resize",
        () => {

            if (
                window.innerWidth >
                760
            ) {

                closeSidebar();

            }

        }
    );


    /* =====================================================
       PAGE READY
    ====================================================== */

    console.log(
        "ScholarLink Academic Submissions Ready"
    );

});
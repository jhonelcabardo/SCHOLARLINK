/* =========================================================
   SCHOLARLINK
   MY QR CODE
   FIREBASE + REAL SCHOLAR DATA
========================================================= */

import {
    auth,
    db
} from "../firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";


/* =========================================================
   GLOBAL DATA
========================================================= */

let currentUser = null;
let currentScholar = {};
let currentQRToken = "";
let currentScholarId = "";
let currentScholarName = "";


/* =========================================================
   DOM READY
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    setupSidebar();
    setupQRButtons();
    setupLogout();
    setupQRModal();

    console.log("ScholarLink My QR Code loaded.");

});


/* =========================================================
   AUTHENTICATION
========================================================= */

onAuthStateChanged(auth, async (user) => {

    if (!user) {
        redirectToLogin();
        return;
    }

    currentUser = user;

    try {

        await loadScholarData(user.uid);

    } catch (error) {

        console.error(
            "Scholar QR loading error:",
            error
        );

        showError(
            "Unable to load your Scholar QR Code.",
            error.message || "An unexpected error occurred."
        );

    }

});


/* =========================================================
   LOAD SCHOLAR DATA
========================================================= */

async function loadScholarData(uid) {

    showLoading();


    /* =====================================================
       LOAD USER
    ===================================================== */

    const userRef = doc(
        db,
        "users",
        uid
    );

    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {

        await signOut(auth);

        redirectToLogin();

        return;

    }

    const userData = userSnap.data();


    /* =====================================================
       SECURITY CHECK
       ONLY SCHOLAR CAN ACCESS QR PAGE
    ===================================================== */

    const role = String(
        userData.role || ""
    ).toLowerCase();

    const scholarConfirmed =
        userData.scholarConfirmed === true;

    const scholarStatus = String(
        userData.scholarStatus || ""
    ).toLowerCase();

    const userStatus = String(
        userData.status || ""
    ).toLowerCase();


    const isActiveScholar =
        role === "scholar" &&
        (
            scholarConfirmed === true ||
            scholarStatus === "active" ||
            scholarStatus === "confirmed" ||
            userStatus === "active"
        );


    if (!isActiveScholar) {

        showError(
            "Scholar QR Code Unavailable",
            "Only an active Scholar account can access the permanent QR Code."
        );

        return;

    }


    /* =====================================================
       LOAD SCHOLAR RECORD
    ===================================================== */

    const scholarRef = doc(
        db,
        "scholars",
        uid
    );

    const scholarSnap = await getDoc(
        scholarRef
    );


    if (!scholarSnap.exists()) {

        showError(
            "Scholar Record Not Found",
            "Your Scholar record has not been created yet. Please contact the Scholarship Office."
        );

        return;

    }


    currentScholar = scholarSnap.data();


    /* =====================================================
       GET QR TOKEN
    ===================================================== */

    currentQRToken =
        currentScholar.qrToken ||
        "";


    /* =====================================================
       GET SCHOLAR ID
    ===================================================== */

    currentScholarId =
        currentScholar.scholarId ||
        userData.scholarId ||
        "";


    if (!currentScholarId) {

        showError(
            "Scholar ID Not Found",
            "Your Scholar ID has not been assigned."
        );

        return;

    }


    /* =====================================================
       GET QR TOKEN VALIDATION
    ===================================================== */

    if (!currentQRToken) {

        showError(
            "QR Token Not Found",
            "Your permanent QR token has not been assigned. Please contact the Scholarship Office."
        );

        return;

    }


    /* =====================================================
       GET SCHOLAR NAME
    ===================================================== */

    currentScholarName = getFullName(
        currentScholar,
        userData
    );


    /* =====================================================
       UPDATE PAGE
    ===================================================== */

    updateHeader();

    updateSummary();

    updateScholarInformation();

    updatePhoto();


    /* =====================================================
       GENERATE ACTUAL QR CODE
    ===================================================== */

    generateQR(
        "scholarQR",
        currentQRToken,
        360
    );


    hideLoading();

}


/* =========================================================
   GET FULL NAME
========================================================= */

function getFullName(
    scholar,
    userData
) {

    if (scholar.fullName) {
        return scholar.fullName;
    }

    if (scholar.name) {
        return scholar.name;
    }


    const firstName =
        scholar.firstName ||
        userData.firstName ||
        "";

    const middleName =
        scholar.middleName ||
        userData.middleName ||
        "";

    const lastName =
        scholar.lastName ||
        userData.lastName ||
        "";

    const suffix =
        scholar.suffix ||
        userData.suffix ||
        "";


    return [
        firstName,
        middleName,
        lastName,
        suffix
    ]
        .filter(Boolean)
        .join(" ")
        .trim() || "Scholar";

}


/* =========================================================
   UPDATE HEADER
========================================================= */

function updateHeader() {

    setText(
        "headerName",
        currentScholarName
    );

    setText(
        "headerScholarId",
        currentScholarId
    );

}


/* =========================================================
   UPDATE SUMMARY
========================================================= */

function updateSummary() {

    const status = getStatus();

    const dateIssued = getDateIssued();


    setText(
        "qrStatus",
        formatStatus(status)
    );


    setText(
        "summaryScholarId",
        currentScholarId
    );


    setText(
        "dateIssued",
        dateIssued
    );


    setText(
        "securityStatus",
        currentQRToken
            ? "Verified"
            : "Unavailable"
    );

}


/* =========================================================
   UPDATE SCHOLAR INFORMATION
========================================================= */

function updateScholarInformation() {

    const school = getSchool();

    const course = getCourse();

    const yearLevel = getYearLevel();

    const status = getStatus();

    const dateIssued = getDateIssued();


    /* =====================================================
       MAIN QR CARD
    ===================================================== */

    setText(
        "scholarName",
        currentScholarName
    );


    setText(
        "mainScholarId",
        currentScholarId
    );


    setText(
        "schoolName",
        school
    );


    setText(
        "course",
        course
    );


    setText(
        "yearLevel",
        yearLevel
    );


    setText(
        "accountStatus",
        formatStatus(status)
    );


    /* =====================================================
       INFORMATION FIELDS
    ===================================================== */

    setInputValue(
        "infoScholarId",
        currentScholarId
    );


    setInputValue(
        "infoFullName",
        currentScholarName
    );


    setInputValue(
        "infoSchool",
        school
    );


    setInputValue(
        "infoCourse",
        course
    );


    setInputValue(
        "infoYearLevel",
        yearLevel
    );


    setInputValue(
        "infoQRStatus",
        formatStatus(status)
    );


    setInputValue(
        "infoDateIssued",
        dateIssued
    );


    setInputValue(
        "infoSecurity",
        currentQRToken
            ? "Verified"
            : "Unavailable"
    );


    setInputValue(
        "infoVerification",
        currentQRToken
            ? "Verified"
            : "Unavailable"
    );

}


/* =========================================================
   SCHOOL
========================================================= */

function getSchool() {

    return (
        currentScholar.schoolName ||
        currentScholar.school ||
        currentScholar.academicInformation?.schoolName ||
        currentScholar.educationalInformation?.schoolName ||
        "Not available"
    );

}


/* =========================================================
   COURSE
========================================================= */

function getCourse() {

    return (
        currentScholar.course ||
        currentScholar.program ||
        currentScholar.academicInformation?.course ||
        currentScholar.academicInformation?.program ||
        currentScholar.educationalInformation?.course ||
        "Not available"
    );

}


/* =========================================================
   YEAR LEVEL
========================================================= */

function getYearLevel() {

    return (
        currentScholar.yearLevel ||
        currentScholar.year ||
        currentScholar.academicInformation?.yearLevel ||
        currentScholar.educationalInformation?.yearLevel ||
        "Not available"
    );

}


/* =========================================================
   STATUS
========================================================= */

function getStatus() {

    return (
        currentScholar.status ||
        currentScholar.scholarStatus ||
        currentScholar.accountStatus ||
        "active"
    );

}


/* =========================================================
   DATE ISSUED
========================================================= */

function getDateIssued() {

    const timestamp =
        currentScholar.confirmedAt ||
        currentScholar.createdAt ||
        currentScholar.dateIssued;


    if (!timestamp) {
        return "Not available";
    }


    try {

        let date;


        /* Firebase Timestamp */

        if (
            typeof timestamp.toDate === "function"
        ) {

            date = timestamp.toDate();

        }


        /* Firestore timestamp object */

        else if (
            timestamp.seconds
        ) {

            date = new Date(
                timestamp.seconds * 1000
            );

        }


        /* Normal date/string */

        else {

            date = new Date(timestamp);

        }


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return "Not available";

        }


        return date.toLocaleDateString(
            "en-US",
            {
                month: "short",
                day: "2-digit",
                year: "numeric"
            }
        );

    } catch (error) {

        console.warn(
            "Date formatting error:",
            error
        );

        return "Not available";

    }

}


/* =========================================================
   GENERATE QR CODE
========================================================= */

function generateQR(
    elementId,
    value,
    size = 360
) {

    const element =
        document.getElementById(
            elementId
        );


    if (!element) {

        console.warn(
            `QR element #${elementId} was not found.`
        );

        return;

    }


    if (!value) {

        element.innerHTML = `
            <div class="qr-error">
                QR Code unavailable
            </div>
        `;

        return;

    }


    /* Check QRCode library */

    if (
        typeof window.QRCode === "undefined"
    ) {

        console.error(
            "QRCode library is not loaded."
        );

        element.innerHTML = `
            <div class="qr-error">
                QR Code library not loaded.
            </div>
        `;

        return;

    }


    element.innerHTML = "";


    try {

        new window.QRCode(
            element,
            {
                text: value,

                width: size,

                height: size,

                colorDark: "#111827",

                colorLight: "#ffffff",

                correctLevel:
                    window.QRCode.CorrectLevel.H
            }
        );

    } catch (error) {

        console.error(
            "QR generation error:",
            error
        );

        element.innerHTML = `
            <div class="qr-error">
                Unable to generate QR Code.
            </div>
        `;

    }

}


/* =========================================================
   QR BUTTONS
========================================================= */

function setupQRButtons() {

    const viewBtn =
        document.getElementById(
            "viewQRBtn"
        );


    const downloadBtn =
        document.getElementById(
            "downloadQRBtn"
        );


    const printBtn =
        document.getElementById(
            "printQRBtn"
        );


    if (viewBtn) {

        viewBtn.addEventListener(
            "click",
            openQRModal
        );

    }


    if (downloadBtn) {

        downloadBtn.addEventListener(
            "click",
            downloadQRCode
        );

    }


    if (printBtn) {

        printBtn.addEventListener(
            "click",
            printQRCode
        );

    }

}


/* =========================================================
   OPEN QR MODAL
========================================================= */

function openQRModal() {

    if (!currentQRToken) {

        alert(
            "QR Code is not available."
        );

        return;

    }


    const modal =
        document.getElementById(
            "qrModal"
        );


    const modalQR =
        document.getElementById(
            "modalQRCode"
        );


    if (!modal || !modalQR) {

        console.warn(
            "QR modal elements not found."
        );

        return;

    }


    if (
        typeof window.QRCode === "undefined"
    ) {

        alert(
            "QR Code library is not loaded."
        );

        return;

    }


    modalQR.innerHTML = "";


    new window.QRCode(
        modalQR,
        {
            text: currentQRToken,

            width: 430,

            height: 430,

            colorDark: "#111827",

            colorLight: "#ffffff",

            correctLevel:
                window.QRCode.CorrectLevel.H
        }
    );


    setText(
        "modalScholarName",
        currentScholarName
    );


    setText(
        "modalScholarId",
        currentScholarId
    );


    modal.classList.add(
        "active"
    );

}


/* =========================================================
   QR MODAL
========================================================= */

function setupQRModal() {

    const modal =
        document.getElementById(
            "qrModal"
        );


    const closeBtn =
        document.getElementById(
            "closeQRModal"
        );


    const modalDownload =
        document.getElementById(
            "modalDownloadBtn"
        );


    if (closeBtn) {

        closeBtn.addEventListener(
            "click",
            () => {

                if (modal) {

                    modal.classList.remove(
                        "active"
                    );

                }

            }
        );

    }


    if (modal) {

        modal.addEventListener(
            "click",
            event => {

                if (
                    event.target === modal
                ) {

                    modal.classList.remove(
                        "active"
                    );

                }

            }
        );

    }


    if (modalDownload) {

        modalDownload.addEventListener(
            "click",
            downloadQRCode
        );

    }


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape" &&
                modal?.classList.contains(
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


/* =========================================================
   DOWNLOAD QR CODE
========================================================= */

function downloadQRCode() {

    const qrContainer =
        document.getElementById(
            "scholarQR"
        );


    if (!qrContainer) {

        alert(
            "QR Code is not available."
        );

        return;

    }


    const canvas =
        qrContainer.querySelector(
            "canvas"
        );


    const image =
        qrContainer.querySelector(
            "img"
        );


    let source = null;


    if (canvas) {

        source =
            canvas.toDataURL(
                "image/png"
            );

    }

    else if (image) {

        source =
            image.src;

    }


    if (!source) {

        alert(
            "QR Code image could not be created."
        );

        return;

    }


    const link =
        document.createElement(
            "a"
        );


    link.href = source;


    link.download =
        `${currentScholarId}-QR.png`;


    document.body.appendChild(
        link
    );


    link.click();


    link.remove();

}


/* =========================================================
   PRINT QR CODE
========================================================= */

function printQRCode() {

    if (!currentQRToken) {

        alert(
            "QR Code is not available."
        );

        return;

    }


    const qrCanvas =
        document
            .getElementById(
                "scholarQR"
            )
            ?.querySelector(
                "canvas"
            );


    if (!qrCanvas) {

        alert(
            "QR Code is not ready yet."
        );

        return;

    }


    const printWindow =
        window.open(
            "",
            "_blank",
            "width=700,height=800"
        );


    if (!printWindow) {

        alert(
            "Please allow pop-ups to print the QR Code."
        );

        return;

    }


    const qrImage =
        qrCanvas.toDataURL(
            "image/png"
        );


    printWindow.document.write(`
        <!DOCTYPE html>

        <html>

        <head>

            <title>
                ${escapeHtml(currentScholarId)} - QR Code
            </title>

            <style>

                body {
                    font-family: Arial, sans-serif;
                    text-align: center;
                    padding: 40px;
                }

                img {
                    width: 400px;
                    height: 400px;
                }

                h1 {
                    margin-bottom: 10px;
                }

                h2 {
                    margin: 10px 0;
                }

                p {
                    margin: 6px 0;
                }

            </style>

        </head>

        <body>

            <h1>ScholarLink</h1>

            <img
                src="${qrImage}"
                alt="Scholar QR Code"
            >

            <h2>
                ${escapeHtml(currentScholarName)}
            </h2>

            <p>
                Scholar ID:
                ${escapeHtml(currentScholarId)}
            </p>

            <p>
                Permanent Scholar QR Code
            </p>

        </body>

        </html>
    `);


    printWindow.document.close();

    printWindow.focus();


    setTimeout(
        () => {
            printWindow.print();
        },
        300
    );

}


/* =========================================================
   PHOTO
========================================================= */

function updatePhoto() {

    const photoPath =
        currentScholar.photoUrl ||
        currentScholar.photo ||
        currentScholar.profilePhoto ||
        currentScholar.profileImage ||
        "";


    if (!photoPath) {

        console.log(
            "No scholar photo found."
        );

        return;

    }


    const images =
        document.querySelectorAll(
            "#headerPhoto, #scholarPhoto"
        );


    images.forEach(
        image => {

            image.src =
                photoPath;


            image.onerror = () => {

                console.warn(
                    "Scholar photo could not be loaded:",
                    photoPath
                );

            };

        }
    );

}


/* =========================================================
   SIDEBAR
========================================================= */

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


            if (!link) {
                return;
            }


            const href =
                link.getAttribute(
                    "href"
                ) || "";


            const page =
                href
                    .split("/")
                    .pop()
                    .toLowerCase();


            item.classList.remove(
                "active"
            );


            if (
                page === currentPage
            ) {

                item.classList.add(
                    "active"
                );

            }

        }
    );

}


/* =========================================================
   LOGOUT
========================================================= */

function setupLogout() {

    const logoutButton =
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


    const confirmButton =
        document.getElementById(
            "confirmLogout"
        );


    /* =====================================================
       OPEN LOGOUT MODAL
    ===================================================== */

    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            event => {

                event.preventDefault();


                if (modal) {

                    modal.classList.add(
                        "active"
                    );

                }

            }
        );

    }


    /* =====================================================
       CANCEL LOGOUT
    ===================================================== */

    if (cancel) {

        cancel.addEventListener(
            "click",
            () => {

                if (modal) {

                    modal.classList.remove(
                        "active"
                    );

                }

            }
        );

    }


    /* =====================================================
       CONFIRM LOGOUT
    ===================================================== */

    if (confirmButton) {

        confirmButton.addEventListener(
            "click",
            async () => {

                try {

                    confirmButton.disabled =
                        true;


                    confirmButton.textContent =
                        "Logging out...";


                    await signOut(
                        auth
                    );


                    localStorage.clear();

                    sessionStorage.clear();


                    window.location.replace(
                        "../login/index.html"
                    );

                }

                catch (error) {

                    console.error(
                        "Logout error:",
                        error
                    );


                    confirmButton.disabled =
                        false;


                    confirmButton.textContent =
                        "Logout";


                    alert(
                        "Unable to logout. Please try again."
                    );

                }

            }
        );

    }


    /* =====================================================
       CLOSE MODAL WHEN CLICKING OUTSIDE
    ===================================================== */

    if (modal) {

        modal.addEventListener(
            "click",
            event => {

                if (
                    event.target === modal
                ) {

                    modal.classList.remove(
                        "active"
                    );

                }

            }
        );

    }

}


/* =========================================================
   SHOW LOADING
========================================================= */

function showLoading() {

    const loading =
        document.getElementById(
            "pageLoading"
        );


    const content =
        document.getElementById(
            "qrPageContent"
        );


    const error =
        document.getElementById(
            "pageError"
        );


    if (loading) {

        loading.style.display =
            "flex";

    }


    if (content) {

        content.style.display =
            "none";

    }


    if (error) {

        error.style.display =
            "none";

    }

}


/* =========================================================
   HIDE LOADING
========================================================= */

function hideLoading() {

    const loading =
        document.getElementById(
            "pageLoading"
        );


    const content =
        document.getElementById(
            "qrPageContent"
        );


    if (loading) {

        loading.style.display =
            "none";

    }


    if (content) {

        content.style.display =
            "block";

    }

}


/* =========================================================
   SHOW ERROR
========================================================= */

function showError(
    title,
    message
) {

    const loading =
        document.getElementById(
            "pageLoading"
        );


    const content =
        document.getElementById(
            "qrPageContent"
        );


    const error =
        document.getElementById(
            "pageError"
        );


    if (loading) {

        loading.style.display =
            "none";

    }


    if (content) {

        content.style.display =
            "none";

    }


    if (error) {

        error.style.display =
            "flex";

    }


    setText(
        "errorTitle",
        title
    );


    setText(
        "errorMessage",
        message
    );

}


/* =========================================================
   TEXT HELPER
========================================================= */

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
            value ?? "--";

    }

}


/* =========================================================
   INPUT HELPER
========================================================= */

function setInputValue(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (element) {

        element.value =
            value ?? "";

    }

}


/* =========================================================
   FORMAT STATUS
========================================================= */

function formatStatus(
    status
) {

    return String(
        status || "Active"
    )
        .replace(
            /_/g,
            " "
        )
        .replace(
            /\b\w/g,
            letter =>
                letter.toUpperCase()
        );

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(
    value
) {

    return String(
        value ?? ""
    )
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


/* =========================================================
   REDIRECT TO LOGIN
========================================================= */

function redirectToLogin() {

    window.location.replace(
        "../login/index.html"
    );

}
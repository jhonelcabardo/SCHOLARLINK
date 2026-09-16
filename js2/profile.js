/* =========================================
   SCHOLARLINK
   SCHOLAR MY PROFILE
   FIREBASE + SUPABASE INTEGRATION
========================================= */

import { auth, db } from "../firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
    doc,
    getDoc,
    updateDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { supabase } from "../supabase.js";


/* =========================================
   CONSTANTS
========================================= */

const PHOTO_BUCKET = "applicant-photos";

const DEFAULT_PHOTO =
    "../images/user.png";


/* =========================================
   GLOBAL DATA
========================================= */

let currentUser = null;

let userData = {};

let applicationData = {};

let scholarData = {};


/* =========================================
   DOM ELEMENTS
========================================= */

const loadingOverlay =
    document.getElementById(
        "loadingOverlay"
    );

const saveFeedback =
    document.getElementById(
        "saveFeedback"
    );


/* -----------------------------------------
   TOP PROFILE
----------------------------------------- */

const profileAvatar =
    document.getElementById(
        "profileAvatar"
    );

const profileAvatarLarge =
    document.getElementById(
        "profileAvatarLarge"
    );

const displayName =
    document.getElementById(
        "displayName"
    );

const displayScholarId =
    document.getElementById(
        "displayScholarId"
    );


/* -----------------------------------------
   PROFILE HEADER
----------------------------------------- */

const profileFullName =
    document.getElementById(
        "profileFullName"
    );

const profileScholarshipType =
    document.getElementById(
        "profileScholarshipType"
    );

const profileStatus =
    document.getElementById(
        "profileStatus"
    );


/* -----------------------------------------
   SCHOLAR INFORMATION
----------------------------------------- */

const scholarIdDisplay =
    document.getElementById(
        "scholarIdDisplay"
    );

const dateApprovedDisplay =
    document.getElementById(
        "dateApprovedDisplay"
    );

const statusDisplay =
    document.getElementById(
        "statusDisplay"
    );

const schoolDisplay =
    document.getElementById(
        "schoolDisplay"
    );


/* =========================================
   AUTHENTICATION
========================================= */

onAuthStateChanged(
    auth,
    async (user) => {

        /* ---------------------------------
           NO USER
        --------------------------------- */

        if (!user) {

            window.location.href =
                "../login/index.html";

            return;
        }


        /* ---------------------------------
           SAVE CURRENT USER
        --------------------------------- */

        currentUser = user;


        console.log(
            "Scholar authenticated:",
            user.uid
        );

        console.log(
            "Scholar email:",
            user.email
        );


        try {

            /* -----------------------------
               LOAD PROFILE
            ----------------------------- */

            await loadScholarProfile(
                user.uid
            );


        } catch (error) {

            console.error(
                "Profile loading error:",
                error
            );


            showFeedback(
                "Unable to load your profile.",
                "error"
            );


        } finally {

            /* -----------------------------
               HIDE LOADING
            ----------------------------- */

            if (loadingOverlay) {

                loadingOverlay.classList.remove(
                    "show"
                );

            }

        }

    }
);


/* =========================================
   LOAD SCHOLAR PROFILE
========================================= */

async function loadScholarProfile(uid) {

    console.log(
        "================================="
    );

    console.log(
        "LOADING SCHOLAR PROFILE"
    );

    console.log(
        "UID:",
        uid
    );

    console.log(
        "================================="
    );


    /* =====================================
       USERS/{UID}
    ===================================== */

    const userRef =
        doc(
            db,
            "users",
            uid
        );


    const userSnap =
        await getDoc(
            userRef
        );


    if (userSnap.exists()) {

        userData =
            userSnap.data();


        console.log(
            "users/{UID} loaded:",
            userData
        );


    } else {

        console.warn(
            "users/{UID} does not exist."
        );


        userData = {};

    }


    /* =====================================
       SCHOLARS/{UID}
    ===================================== */

    const scholarRef =
        doc(
            db,
            "scholars",
            uid
        );


    const scholarSnap =
        await getDoc(
            scholarRef
        );


    if (scholarSnap.exists()) {

        scholarData =
            scholarSnap.data();


        console.log(
            "scholars/{UID} loaded:",
            scholarData
        );


    } else {

        console.warn(
            "scholars/{UID} does not exist."
        );


        scholarData = {};

    }


    /* =====================================
       APPLICATIONS/{UID}
    ===================================== */

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


    if (applicationSnap.exists()) {

        applicationData =
            applicationSnap.data();


        console.log(
            "applications/{UID} loaded:",
            applicationData
        );


    } else {

        console.warn(
            "applications/{UID} does not exist."
        );


        applicationData = {};

    }


    /* =====================================
       BUILD PROFILE DATA
    ===================================== */

    const profileData =
        buildProfileData();


    console.log(
        "FINAL PROFILE DATA:",
        profileData
    );


    /* =====================================
       DISPLAY PROFILE
    ===================================== */

    populateProfile(
        profileData
    );


    /* =====================================
       LOAD PHOTO
    ===================================== */

    await loadApplicantPhoto();

}


/* =========================================
   BUILD PROFILE DATA
========================================= */

function buildProfileData() {

    /* =====================================
       PERSONAL INFORMATION
    ===================================== */

    const personal =
        applicationData
            .personalInformation || {};


    /* =====================================
       EDUCATIONAL INFORMATION
       Only used to retrieve School.
       It will NOT be displayed as a section.
    ===================================== */

    const educational =
        applicationData
            .educationalInformation || {};


    /* =====================================
       FULL NAME
    ===================================== */

    const firstName =
        personal.firstName ||
        userData.firstName ||
        scholarData.firstName ||
        "";


    const middleName =
        personal.middleName ||
        userData.middleName ||
        scholarData.middleName ||
        "";


    const lastName =
        personal.lastName ||
        userData.lastName ||
        scholarData.lastName ||
        "";


    const suffix =
        personal.suffix ||
        userData.suffix ||
        scholarData.suffix ||
        "";


    const generatedFullName =
        [
            firstName,
            middleName,
            lastName,
            suffix
        ]
            .filter(Boolean)
            .join(" ");


    const fullName =
        personal.fullName ||
        userData.fullName ||
        scholarData.fullName ||
        generatedFullName ||
        currentUser?.displayName ||
        currentUser?.email ||
        "Scholar";


    /* =====================================
       SCHOLAR ID
    ===================================== */

    const scholarId =
        scholarData.scholarId ||
        userData.scholarId ||
        applicationData.scholarId ||
        "Not assigned";


    /* =====================================
       DATE APPROVED
    ===================================== */

    const dateApproved =
        scholarData.dateApproved ||
        scholarData.confirmedAt ||
        applicationData.dateApproved ||
        applicationData.confirmedAt ||
        "";


    /* =====================================
       SCHOLAR STATUS
    ===================================== */

    const status =
        scholarData.status ||
        userData.status ||
        userData.scholarStatus ||
        applicationData.status ||
        "Active";


    /* =====================================
       SCHOOL
    ===================================== */

    const school =
        educational.schoolName ||
        educational.school ||
        scholarData.school ||
        userData.school ||
        "Not specified";


    /* =====================================
       DATE OF BIRTH
    ===================================== */

    const birthDate =
        personal.dateOfBirth ||
        personal.birthDate ||
        userData.dateOfBirth ||
        userData.birthDate ||
        scholarData.birthDate ||
        "";


    /* =====================================
       SEX
    ===================================== */

    const gender =
        personal.sex ||
        personal.gender ||
        userData.sex ||
        userData.gender ||
        scholarData.gender ||
        "";


    /* =====================================
       CIVIL STATUS
    ===================================== */

    const civilStatus =
        personal.civilStatus ||
        userData.civilStatus ||
        scholarData.civilStatus ||
        "";


    /* =====================================
       CONTACT NUMBER
    ===================================== */

    const contactNumber =
        personal.contactNumber ||
        userData.contactNumber ||
        userData.phoneNumber ||
        scholarData.contactNumber ||
        "";


    /* =====================================
       EMAIL
    ===================================== */

    const email =
        userData.email ||
        currentUser?.email ||
        scholarData.email ||
        "";


    /* =====================================
       COMPLETE ADDRESS
    ===================================== */

    const address =
        personal.completeAddress ||
        personal.address ||
        userData.address ||
        scholarData.address ||
        "";


    /* =====================================
       RETURN FINAL DATA
    ===================================== */

    return {

        fullName,

        scholarId,

        dateApproved,

        status,

        school,

        birthDate,

        gender,

        civilStatus,

        contactNumber,

        email,

        address

    };

}


/* =========================================
   POPULATE PROFILE
========================================= */

function populateProfile(data) {


    /* =====================================
       PROFILE HEADER
    ===================================== */

    if (displayName) {

        displayName.textContent =
            data.fullName ||
            "Scholar";

    }


    if (displayScholarId) {

        displayScholarId.textContent =
            data.scholarId ||
            "Not assigned";

    }


    if (profileFullName) {

        profileFullName.textContent =
            data.fullName ||
            "Scholar";

    }


    /*
       Keep "Scholar" in the profile header.
       Scholarship Program is no longer
       displayed in Scholar Information.
    */

    if (profileScholarshipType) {

        profileScholarshipType.textContent =
            "Scholar";

    }


    if (profileStatus) {

        profileStatus.textContent =
            String(
                data.status ||
                "Active"
            )
                .replaceAll(
                    "_",
                    " "
                )
                .toUpperCase();

    }


    /* =====================================
       SCHOLAR INFORMATION
    ===================================== */

    if (scholarIdDisplay) {

        scholarIdDisplay.textContent =
            data.scholarId ||
            "Not assigned";

    }


    if (dateApprovedDisplay) {

        dateApprovedDisplay.textContent =
            formatDate(
                data.dateApproved
            );

    }


    if (statusDisplay) {

        statusDisplay.textContent =
            String(
                data.status ||
                "Active"
            )
                .replaceAll(
                    "_",
                    " "
                )
                .toUpperCase();

    }


    if (schoolDisplay) {

        schoolDisplay.textContent =
            data.school ||
            "Not specified";

    }


    /* =====================================
       PERSONAL INFORMATION
    ===================================== */

    setValue(
        "fullName",
        data.fullName
    );


    setValue(
        "birthDate",
        formatDate(
            data.birthDate
        )
    );


    setValue(
        "age",
        calculateAge(
            data.birthDate
        )
    );


    setValue(
        "gender",
        data.gender
    );


    setValue(
        "civilStatus",
        data.civilStatus
    );


    setValue(
        "contactNumber",
        data.contactNumber
    );


    setValue(
        "email",
        data.email
    );


    setValue(
        "address",
        data.address
    );

}


/* =========================================
   LOAD APPLICANT PHOTO
   KEEP APPLICANT PHOTO AFTER BECOMING SCHOLAR
========================================= */

async function loadApplicantPhoto() {

    try {

        let storagePath = null;


        /* =================================
           1. APPLICANT PHOTO FROM APPLICATION
        ================================= */

        const applicantPhoto =
            applicationData?.files?.applicantPhoto;

        if (applicantPhoto) {

            storagePath =
                applicantPhoto.storagePath ||
                applicantPhoto.storage_path ||
                applicantPhoto.path ||
                applicantPhoto.filePath ||
                applicantPhoto.file_path ||
                applicantPhoto.url ||
                applicantPhoto.downloadURL ||
                applicantPhoto.publicUrl ||
                null;

        }


        /* =================================
           2. FALLBACK:
              SCHOLAR PHOTO
        ================================= */

        if (!storagePath) {

            const scholarPhoto =
                scholarData?.applicantPhoto ||
                scholarData?.photo ||
                scholarData?.profilePhoto ||
                scholarData?.photoURL;

            if (
                typeof scholarPhoto === "string"
            ) {

                storagePath =
                    scholarPhoto;

            } else if (scholarPhoto) {

                storagePath =
                    scholarPhoto.storagePath ||
                    scholarPhoto.storage_path ||
                    scholarPhoto.path ||
                    scholarPhoto.filePath ||
                    scholarPhoto.file_path ||
                    scholarPhoto.url ||
                    scholarPhoto.downloadURL ||
                    scholarPhoto.publicUrl ||
                    null;

            }

        }


        /* =================================
           3. FALLBACK:
              USER PHOTO
        ================================= */

        if (!storagePath) {

            const userPhoto =
                userData?.photo ||
                userData?.profilePhoto ||
                userData?.photoURL;

            if (
                typeof userPhoto === "string"
            ) {

                storagePath =
                    userPhoto;

            } else if (userPhoto) {

                storagePath =
                    userPhoto.storagePath ||
                    userPhoto.storage_path ||
                    userPhoto.path ||
                    userPhoto.filePath ||
                    userPhoto.file_path ||
                    userPhoto.url ||
                    userPhoto.downloadURL ||
                    userPhoto.publicUrl ||
                    null;

            }

        }


        /* =================================
           4. NO PHOTO FOUND
        ================================= */

        if (!storagePath) {

            console.warn(
                "No applicant/scholar photo found."
            );

            /*
             * Don't repeatedly request a
             * missing user.png file.
             */
            if (profileAvatar) {
                profileAvatar.removeAttribute("src");
                profileAvatar.style.visibility =
                    "hidden";
            }

            if (profileAvatarLarge) {
                profileAvatarLarge.removeAttribute("src");
                profileAvatarLarge.style.visibility =
                    "hidden";
            }

            return;

        }


        console.log(
            "Applicant/Scholar photo storage path:",
            storagePath
        );


        /* =================================
           5. CLEAN SUPABASE PATH
        ================================= */

        storagePath =
            normalizeStoragePath(
                storagePath
            );


        console.log(
            "Final Supabase photo path:",
            storagePath
        );


        /* =================================
           6. CREATE SIGNED URL
        ================================= */

        const {
            data,
            error
        } =
            await supabase
                .storage
                .from(
                    PHOTO_BUCKET
                )
                .createSignedUrl(
                    storagePath,
                    3600
                );


        if (error) {

            console.error(
                "Photo signed URL error:",
                error
            );

            return;

        }


        if (!data?.signedUrl) {

            console.warn(
                "No signed URL returned for applicant photo."
            );

            return;

        }


        console.log(
            "Applicant photo loaded successfully."
        );


        /* =================================
           7. DISPLAY SAME PHOTO
              ON PROFILE
        ================================= */

        setProfileImage(
            data.signedUrl
        );


    } catch (error) {

        console.error(
            "Load applicant photo error:",
            error
        );

    }

}

/* =========================================
   NORMALIZE SUPABASE PATH
========================================= */

function normalizeStoragePath(path) {

    if (!path) {

        return "";

    }


    let cleanPath =
        String(path).trim();


    /* =====================================
       REMOVE LEADING SLASH
    ===================================== */

    cleanPath =
        cleanPath.replace(
            /^\/+/,
            ""
        );


    /* =====================================
       FULL SUPABASE URL
    ===================================== */

    if (
        cleanPath.startsWith(
            "http://"
        ) ||
        cleanPath.startsWith(
            "https://"
        )
    ) {

        try {

            const url =
                new URL(
                    cleanPath
                );


            const marker =
                "/storage/v1/object/";


            const index =
                url.pathname.indexOf(
                    marker
                );


            if (index !== -1) {

                cleanPath =
                    url.pathname.substring(
                        index +
                        marker.length
                    );


                cleanPath =
                    cleanPath.replace(
                        /^sign\/?/,
                        ""
                    );


                cleanPath =
                    cleanPath.replace(
                        /^authenticated\/?/,
                        ""
                    );


                cleanPath =
                    cleanPath.replace(
                        /^public\/?/,
                        ""
                    );

            }


        } catch (error) {

            console.warn(
                "Could not parse photo URL."
            );

        }

    }


    /* =====================================
       REMOVE BUCKET PREFIX
    ===================================== */

    if (
        cleanPath.startsWith(
            `${PHOTO_BUCKET}/`
        )
    ) {

        cleanPath =
            cleanPath.substring(
                PHOTO_BUCKET.length + 1
            );

    }


    return cleanPath;

}


/* =========================================
   SET PROFILE IMAGE
========================================= */

function setProfileImage(url) {

    /* -------------------------------------
       TOP PROFILE IMAGE
    ------------------------------------- */

    if (profileAvatar) {

        profileAvatar.src =
            url;


        profileAvatar.onerror =
            () => {

                profileAvatar.src =
                    DEFAULT_PHOTO;

            };

    }


    /* -------------------------------------
       LARGE PROFILE IMAGE
    ------------------------------------- */

    if (profileAvatarLarge) {

        profileAvatarLarge.src =
            url;


        profileAvatarLarge.onerror =
            () => {

                profileAvatarLarge.src =
                    DEFAULT_PHOTO;

            };

    }

}


/* =========================================
   SAVE PROFILE
========================================= */

document
    .getElementById(
        "saveProfileBtn"
    )
    ?.addEventListener(
        "click",
        async () => {

            /* -----------------------------
               CHECK LOGIN
            ----------------------------- */

            if (!currentUser) {

                showFeedback(
                    "You are not logged in.",
                    "error"
                );

                return;

            }


            const button =
                document.getElementById(
                    "saveProfileBtn"
                );


            if (!button) {

                return;

            }


            const original =
                button.innerHTML;


            try {

                /* -------------------------
                   LOADING BUTTON
                ------------------------- */

                button.disabled =
                    true;


                button.innerHTML = `
                    <i class="fas fa-spinner fa-spin"></i>
                    Saving...
                `;


                /* -------------------------
                   GET VALUES
                ------------------------- */

                const contactNumber =
                    document
                        .getElementById(
                            "contactNumber"
                        )
                        ?.value
                        .trim() || "";


                const address =
                    document
                        .getElementById(
                            "address"
                        )
                        ?.value
                        .trim() || "";


                /* -------------------------
                   UPDATE DATA
                ------------------------- */

                const updates = {

                    contactNumber,

                    address,

                    updatedAt:
                        serverTimestamp()

                };


                /* =================================
                   SAVE TO USERS/{UID}
                ================================= */

                await updateDoc(

                    doc(
                        db,
                        "users",
                        currentUser.uid
                    ),

                    updates

                );


                /* =================================
                   SAVE TO APPLICATIONS/{UID}
                ================================= */

                await updateDoc(

                    doc(
                        db,
                        "applications",
                        currentUser.uid
                    ),

                    {

                        "personalInformation.contactNumber":
                            contactNumber,

                        "personalInformation.completeAddress":
                            address,

                        updatedAt:
                            serverTimestamp()

                    }

                );


                /* =================================
                   UPDATE LOCAL DATA
                ================================= */

                userData.contactNumber =
                    contactNumber;


                userData.address =
                    address;


                applicationData
                    .personalInformation =
                    applicationData
                        .personalInformation ||
                    {};


                applicationData
                    .personalInformation
                    .contactNumber =
                    contactNumber;


                applicationData
                    .personalInformation
                    .completeAddress =
                    address;


                /* =================================
                   REFRESH PROFILE
                ================================= */

                const updatedProfile =
                    buildProfileData();


                populateProfile(
                    updatedProfile
                );


                /* =================================
                   SUCCESS
                ================================= */

                showFeedback(
                    "Profile updated successfully!",
                    "success"
                );


            } catch (error) {

                console.error(
                    "Save profile error:",
                    error
                );


                showFeedback(
                    "Unable to save profile: " +
                    error.message,
                    "error"
                );


            } finally {

                button.disabled =
                    false;


                button.innerHTML =
                    original;

            }

        }
    );


/* =========================================
   CHANGE PASSWORD
========================================= */

window.changePassword =
    function () {

        window.location.href =
            "../login/index.html";

    };


/* =========================================
   PRINT PROFILE
========================================= */

window.printProfile =
    function () {

        window.print();

    };


/* =========================================
   CALCULATE AGE
========================================= */

function calculateAge(
    dateValue
) {

    if (!dateValue) {

        return "";

    }


    try {

        /* -----------------------------
           FIRESTORE TIMESTAMP
        ----------------------------- */

        if (
            typeof dateValue ===
                "object" &&
            typeof dateValue.toDate ===
                "function"
        ) {

            dateValue =
                dateValue.toDate();

        }


        const birth =
            new Date(
                dateValue
            );


        if (
            Number.isNaN(
                birth.getTime()
            )
        ) {

            return "";

        }


        const today =
            new Date();


        let calculatedAge =
            today.getFullYear() -
            birth.getFullYear();


        const month =
            today.getMonth() -
            birth.getMonth();


        if (
            month < 0 ||
            (
                month === 0 &&
                today.getDate() <
                birth.getDate()
            )
        ) {

            calculatedAge--;

        }


        return calculatedAge >= 0
            ? String(calculatedAge)
            : "";

    } catch {

        return "";

    }

}


/* =========================================
   FORMAT DATE
========================================= */

function formatDate(
    value
) {

    if (!value) {

        return "N/A";

    }


    try {

        /* -----------------------------
           FIRESTORE TIMESTAMP
        ----------------------------- */

        if (
            typeof value ===
                "object" &&
            typeof value.toDate ===
                "function"
        ) {

            return value
                .toDate()
                .toLocaleDateString(
                    "en-US",
                    {
                        year:
                            "numeric",

                        month:
                            "long",

                        day:
                            "numeric"
                    }
                );

        }


        const date =
            new Date(
                value
            );


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return String(
                value
            );

        }


        return date
            .toLocaleDateString(
                "en-US",
                {
                    year:
                        "numeric",

                    month:
                        "long",

                    day:
                        "numeric"
                }
            );


    } catch {

        return String(
            value
        );

    }

}


/* =========================================
   SET INPUT VALUE
========================================= */

function setValue(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (!element) {

        return;

    }


    element.value =
        value ?? "";

}


/* =========================================
   FEEDBACK
========================================= */

function showFeedback(
    message,
    type
) {

    if (!saveFeedback) {

        return;

    }


    saveFeedback.textContent =
        message;


    saveFeedback.className =
        `save-feedback ${type}`;


    saveFeedback.style.display =
        "block";


    setTimeout(
        () => {

            saveFeedback.style.display =
                "none";

        },
        4000
    );

}


/* =========================================
   SIDEBAR ACTIVE MENU
========================================= */

const currentPage =
    window.location.pathname
        .split("/")
        .pop()
        .toLowerCase();


document
    .querySelectorAll(
        ".menu li"
    )
    .forEach(
        item => {

            const link =
                item.querySelector(
                    "a"
                );


            if (!link) {

                return;

            }


            const linkPage =
                link
                    .getAttribute(
                        "href"
                    )
                    ?.split("/")
                    .pop()
                    .toLowerCase();


            item.classList.remove(
                "active"
            );


            if (
                linkPage ===
                currentPage
            ) {

                item.classList.add(
                    "active"
                );

            }

        }
    );


/* =========================================
   LOGOUT
   CUSTOM MODAL ONLY
========================================= */

const logoutLink =
    document.getElementById("logoutLink") ||
    document.getElementById("sidebarlogout");

const logoutModal =
    document.getElementById("logoutModal");

const cancelLogout =
    document.getElementById("cancelLogout");

const confirmLogout =
    document.getElementById("confirmLogout");


/* =========================================
   OPEN LOGOUT MODAL
========================================= */

if (logoutLink) {

    logoutLink.addEventListener(
        "click",
        (event) => {

            event.preventDefault();
            event.stopPropagation();

            /*
             * IMPORTANT:
             * Do NOT use window.confirm().
             * Always use the custom logout modal.
             */

            if (logoutModal) {

                logoutModal.classList.add("active");

                /*
                 * Make sure the modal is centered
                 * on the screen.
                 */
                logoutModal.style.position = "fixed";
                logoutModal.style.inset = "0";
                logoutModal.style.width = "100%";
                logoutModal.style.height = "100%";
                logoutModal.style.display = "flex";
                logoutModal.style.alignItems = "center";
                logoutModal.style.justifyContent = "center";
                logoutModal.style.zIndex = "99999";

                return;
            }

            /*
             * If the modal cannot be found,
             * do nothing instead of showing
             * the browser confirm popup.
             */
            console.error(
                "Logout modal (#logoutModal) was not found."
            );

        }
    );

}


/* =========================================
   CLOSE LOGOUT MODAL
========================================= */

function closeLogoutModal() {

    if (!logoutModal) {
        return;
    }

    logoutModal.classList.remove("active");

    logoutModal.style.display = "";

}


/* =========================================
   CANCEL LOGOUT
========================================= */

if (cancelLogout) {

    cancelLogout.addEventListener(
        "click",
        (event) => {

            event.preventDefault();
            event.stopPropagation();

            closeLogoutModal();

        }
    );

}


/* =========================================
   CONFIRM LOGOUT
========================================= */

if (confirmLogout) {

    confirmLogout.addEventListener(
        "click",
        async (event) => {

            event.preventDefault();
            event.stopPropagation();

            await performLogout();

        }
    );

}


/* =========================================
   PERFORM LOGOUT
========================================= */

async function performLogout() {

    try {

        /*
         * Prevent multiple clicks
         */
        if (confirmLogout) {

            confirmLogout.disabled = true;

            confirmLogout.innerHTML =
                `<i class="fas fa-spinner fa-spin"></i> Logging out...`;

        }


        /*
         * Firebase logout
         */
        await signOut(auth);


        /*
         * Clear ScholarLink local storage
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
         * Clear ScholarLink session storage
         */
        sessionStorage.removeItem(
            "scholarLinkLoggedIn"
        );

        sessionStorage.removeItem(
            "scholarLinkRole"
        );

        sessionStorage.removeItem(
            "scholarLinkUID"
        );

        sessionStorage.removeItem(
            "scholarLinkEmail"
        );


        /*
         * Close custom modal
         */
        closeLogoutModal();


        /*
         * Redirect to login
         */
        window.location.replace(
            "../login/index.html"
        );


    } catch (error) {

        console.error(
            "Logout error:",
            error
        );


        /*
         * Restore button
         */
        if (confirmLogout) {

            confirmLogout.disabled = false;

            confirmLogout.innerHTML =
                "Logout";

        }


        showFeedback(
            "Unable to logout. Please try again.",
            "error"
        );

    }

}


/* =========================================
   CLOSE MODAL WHEN CLICKING OUTSIDE
========================================= */

if (logoutModal) {

    logoutModal.addEventListener(
        "click",
        (event) => {

            if (
                event.target ===
                logoutModal
            ) {

                closeLogoutModal();

            }

        }
    );

}


/* =========================================
   ESCAPE KEY
========================================= */

document.addEventListener(
    "keydown",
    (event) => {

        if (
            event.key === "Escape" &&
            logoutModal &&
            logoutModal.classList.contains("active")
        ) {

            closeLogoutModal();

        }

    }
);
/* =========================================
   INPUT HIGHLIGHT
========================================= */

document
    .querySelectorAll(
        "input"
    )
    .forEach(
        input => {

            /* -----------------------------
               READONLY INPUTS
            ----------------------------- */

            if (
                input.hasAttribute(
                    "readonly"
                )
            ) {

                return;

            }


            /* -----------------------------
               FOCUS
            ----------------------------- */

            input.addEventListener(
                "focus",
                function () {

                    this.style.borderColor =
                        "#2F80ED";

                }
            );


            /* -----------------------------
               BLUR
            ----------------------------- */

            input.addEventListener(
                "blur",
                function () {

                    this.style.borderColor =
                        "";

                }
            );

        }
    );


/* =========================================
   CARD ANIMATION
========================================= */

document
    .querySelectorAll(
        ".card"
    )
    .forEach(
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
                index * 100
            );

        }
    );


/* =========================================
   CTRL + S
========================================= */

document.addEventListener(
    "keydown",
    event => {

        if (
            (
                event.ctrlKey ||
                event.metaKey
            ) &&
            event.key.toLowerCase() ===
            "s"
        ) {

            event.preventDefault();


            document
                .getElementById(
                    "saveProfileBtn"
                )
                ?.click();

        }

    }
);
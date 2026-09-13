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
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { supabase } from "../supabase.js";


/* =========================================
   CONSTANTS
========================================= */

const PHOTO_BUCKET = "applicant-photos";
const DEFAULT_PHOTO = "../images/user.png";


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
    document.getElementById("loadingOverlay");

const saveFeedback =
    document.getElementById("saveFeedback");

const profileAvatar =
    document.getElementById("profileAvatar");

const profileAvatarLarge =
    document.getElementById("profileAvatarLarge");

const displayName =
    document.getElementById("displayName");

const displayScholarId =
    document.getElementById("displayScholarId");

const profileFullName =
    document.getElementById("profileFullName");

const profileScholarshipType =
    document.getElementById("profileScholarshipType");

const profileStatus =
    document.getElementById("profileStatus");

const scholarIdDisplay =
    document.getElementById("scholarIdDisplay");

const scholarshipProgramDisplay =
    document.getElementById("scholarshipProgramDisplay");

const statusDisplay =
    document.getElementById("statusDisplay");

const schoolDisplay =
    document.getElementById("schoolDisplay");


/* =========================================
   AUTHENTICATION
========================================= */

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.href = "../login/index.html";

        return;
    }

    currentUser = user;

    console.log("Scholar authenticated:", user.uid);
    console.log("Scholar email:", user.email);

    try {

        await loadScholarProfile(user.uid);

    } catch (error) {

        console.error("Profile loading error:", error);

        showFeedback(
            "Unable to load your profile.",
            "error"
        );

    } finally {

        if (loadingOverlay) {
            loadingOverlay.classList.remove("show");
        }

    }

});


/* =========================================
   LOAD SCHOLAR PROFILE
========================================= */

async function loadScholarProfile(uid) {

    console.log("=================================");
    console.log("LOADING SCHOLAR PROFILE");
    console.log("UID:", uid);
    console.log("=================================");


    /* -------------------------------------
       USERS/{UID}
    ------------------------------------- */

    const userRef = doc(db, "users", uid);

    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {

        userData = userSnap.data();

        console.log("users/{UID} loaded:", userData);

    } else {

        console.warn("users/{UID} does not exist.");

        userData = {};
    }


    /* -------------------------------------
       SCHOLARS/{UID}
    ------------------------------------- */

    const scholarRef = doc(db, "scholars", uid);

    const scholarSnap = await getDoc(scholarRef);

    if (scholarSnap.exists()) {

        scholarData = scholarSnap.data();

        console.log("scholars/{UID} loaded:", scholarData);

    } else {

        console.warn("scholars/{UID} does not exist.");

        scholarData = {};
    }


    /* -------------------------------------
       APPLICATIONS/{UID}
    ------------------------------------- */

    const applicationRef = doc(db, "applications", uid);

    const applicationSnap =
        await getDoc(applicationRef);

    if (applicationSnap.exists()) {

        applicationData = applicationSnap.data();

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


    /* -------------------------------------
       BUILD PROFILE
    ------------------------------------- */

    const profileData =
        buildProfileData();

    console.log(
        "FINAL PROFILE DATA:",
        profileData
    );


    /* -------------------------------------
       DISPLAY PROFILE
    ------------------------------------- */

    populateProfile(profileData);


    /* -------------------------------------
       LOAD PHOTO
    ------------------------------------- */

    await loadApplicantPhoto();


    /* -------------------------------------
       LOAD REQUIREMENTS
    ------------------------------------- */

    await loadDocuments(uid);

}


/* =========================================
   BUILD PROFILE DATA
========================================= */

function buildProfileData() {

    const personal =
        applicationData.personalInformation || {};

    const educational =
        applicationData.educationalInformation || {};

    const family =
        applicationData.familyInformation || {};

    const household =
        applicationData.householdInformation || {};

    const emergency =
        applicationData.emergencyContact ||
        userData.emergencyContact ||
        scholarData.emergencyContact ||
        {};


    /* -------------------------------------
       NAME
    ------------------------------------- */

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


    /* -------------------------------------
       SCHOLAR ID
    ------------------------------------- */

    const scholarId =
        scholarData.scholarId ||
        userData.scholarId ||
        applicationData.scholarId ||
        "Not assigned";


    /* -------------------------------------
       SCHOOL
    ------------------------------------- */

    const school =
        educational.schoolName ||
        educational.school ||
        scholarData.school ||
        userData.school ||
        "";

    const schoolAddress =
        educational.schoolAddress ||
        scholarData.schoolAddress ||
        userData.schoolAddress ||
        "";

    const studentId =
        educational.studentId ||
        educational.studentID ||
        educational.lrn ||
        scholarData.studentId ||
        userData.studentId ||
        "";

    const course =
        educational.course ||
        educational.program ||
        educational.degree ||
        scholarData.course ||
        userData.course ||
        "";

    const yearLevel =
        educational.yearLevel ||
        educational.year ||
        scholarData.yearLevel ||
        userData.yearLevel ||
        "";

    const semester =
        educational.semester ||
        scholarData.semester ||
        userData.semester ||
        "";

    const gpa =
        educational.generalAverage ||
        educational.gpa ||
        educational.GPA ||
        scholarData.gpa ||
        userData.gpa ||
        "";

    const graduation =
        educational.expectedGraduationYear ||
        educational.graduationYear ||
        scholarData.graduation ||
        userData.graduation ||
        "";


    /* -------------------------------------
       SCHOLARSHIP
    ------------------------------------- */

    const scholarshipProgram =
        scholarData.scholarshipProgram ||
        applicationData.scholarshipProgram ||
        applicationData.scholarshipName ||
        userData.scholarshipProgram ||
        "";

    const scholarshipType =
        scholarData.scholarshipType ||
        applicationData.scholarshipType ||
        userData.scholarshipType ||
        "";

    const benefactor =
        scholarData.benefactor ||
        applicationData.benefactor ||
        "City Government of Naga";

    const status =
        scholarData.status ||
        userData.scholarStatus ||
        userData.applicationStatus ||
        "Active";

    const dateApproved =
        scholarData.dateApproved ||
        scholarData.confirmedAt ||
        applicationData.confirmedAt ||
        "";

    const schoolYear =
        scholarData.schoolYear ||
        userData.schoolYear ||
        "";

    const startDate =
        scholarData.startDate ||
        "";

    const remarks =
        scholarData.remarks ||
        "";


    /* -------------------------------------
       PERSONAL
    ------------------------------------- */

    const birthDate =
        personal.dateOfBirth ||
        personal.birthDate ||
        userData.dateOfBirth ||
        userData.birthDate ||
        scholarData.birthDate ||
        "";

    const gender =
        personal.sex ||
        personal.gender ||
        userData.sex ||
        userData.gender ||
        scholarData.gender ||
        "";

    const civilStatus =
        personal.civilStatus ||
        userData.civilStatus ||
        scholarData.civilStatus ||
        "";

    const citizenship =
        personal.citizenship ||
        userData.citizenship ||
        scholarData.citizenship ||
        "";

    const birthplace =
        personal.birthplace ||
        userData.birthplace ||
        scholarData.birthplace ||
        "";

    const contactNumber =
        personal.contactNumber ||
        userData.contactNumber ||
        userData.phoneNumber ||
        scholarData.contactNumber ||
        "";

    const email =
        userData.email ||
        currentUser?.email ||
        scholarData.email ||
        "";

    const address =
        personal.completeAddress ||
        personal.address ||
        userData.address ||
        scholarData.address ||
        "";


    /* -------------------------------------
       FAMILY
    ------------------------------------- */

    const father =
        family.father || {};

    const mother =
        family.mother || {};

    const guardianData =
        family.guardian || {};


    const fatherName =
        father.fullName ||
        family.fatherName ||
        scholarData.fatherName ||
        "";

    const fatherOccupation =
        father.occupation ||
        family.fatherOccupation ||
        scholarData.fatherOccupation ||
        "";

    const motherName =
        mother.fullName ||
        family.motherName ||
        scholarData.motherName ||
        "";

    const motherOccupation =
        mother.occupation ||
        family.motherOccupation ||
        scholarData.motherOccupation ||
        "";

    const guardian =
        guardianData.fullName ||
        family.guardianName ||
        scholarData.guardian ||
        "";

    const familyIncome =
        household.totalMonthlyHouseholdIncome ||
        family.totalMonthlyIncome ||
        family.monthlyIncome ||
        scholarData.familyIncome ||
        "";


    /* -------------------------------------
       EMERGENCY
    ------------------------------------- */

    const emergencyContact =
        emergency.name ||
        emergency.contactPerson ||
        scholarData.emergencyContact ||
        userData.emergencyContact ||
        "";

    const emergencyRelationship =
        emergency.relationship ||
        scholarData.emergencyRelationship ||
        userData.emergencyRelationship ||
        "";

    const emergencyNumber =
        emergency.contactNumber ||
        emergency.phone ||
        scholarData.emergencyNumber ||
        userData.emergencyNumber ||
        "";

    const emergencyAddress =
        emergency.address ||
        scholarData.emergencyAddress ||
        userData.emergencyAddress ||
        "";


    return {

        fullName,
        scholarId,

        scholarshipProgram,
        scholarshipType,
        benefactor,
        status,
        dateApproved,
        schoolYear,
        startDate,
        remarks,

        birthDate,
        gender,
        civilStatus,
        citizenship,
        birthplace,
        contactNumber,
        email,
        address,

        school,
        schoolAddress,
        studentId,
        course,
        yearLevel,
        semester,
        gpa,
        graduation,

        fatherName,
        fatherOccupation,
        motherName,
        motherOccupation,
        guardian,
        familyIncome,

        emergencyContact,
        emergencyRelationship,
        emergencyNumber,
        emergencyAddress
    };

}


/* =========================================
   POPULATE PROFILE
========================================= */

function populateProfile(data) {


    /* -------------------------------------
       HEADER
    ------------------------------------- */

    displayName.textContent =
        data.fullName;

    displayScholarId.textContent =
        data.scholarId;

    profileFullName.textContent =
        data.fullName;

    profileScholarshipType.textContent =
        data.scholarshipType ||
        data.scholarshipProgram ||
        "Scholar";

    profileStatus.textContent =
        String(data.status || "Active")
            .replaceAll("_", " ")
            .toUpperCase();


    /* -------------------------------------
       SCHOLAR SUMMARY
    ------------------------------------- */

    scholarIdDisplay.textContent =
        data.scholarId;

    scholarshipProgramDisplay.textContent =
        data.scholarshipProgram ||
        "Not specified";

    statusDisplay.textContent =
        String(data.status || "Active")
            .replaceAll("_", " ")
            .toUpperCase();

    schoolDisplay.textContent =
        data.school ||
        "Not specified";


    /* -------------------------------------
       PERSONAL INFORMATION
    ------------------------------------- */

    setValue("fullName", data.fullName);

    setValue("birthDate", data.birthDate);

    setValue(
        "age",
        calculateAge(data.birthDate)
    );

    setValue("gender", data.gender);

    setValue(
        "civilStatus",
        data.civilStatus
    );

    setValue(
        "citizenship",
        data.citizenship
    );

    setValue(
        "birthplace",
        data.birthplace
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


    /* -------------------------------------
       EDUCATIONAL INFORMATION
    ------------------------------------- */

    setValue(
        "schoolName",
        data.school
    );

    setValue(
        "schoolAddress",
        data.schoolAddress
    );

    setValue(
        "studentId",
        data.studentId
    );

    setValue(
        "course",
        data.course
    );

    setValue(
        "yearLevel",
        data.yearLevel
    );

    setValue(
        "semester",
        data.semester
    );

    setValue(
        "gpa",
        data.gpa
    );

    setValue(
        "graduation",
        data.graduation
    );


    /* -------------------------------------
       SCHOLARSHIP INFORMATION
    ------------------------------------- */

    setValue(
        "scholarshipProgram",
        data.scholarshipProgram
    );

    setValue(
        "scholarshipType",
        data.scholarshipType
    );

    setValue(
        "benefactor",
        data.benefactor
    );

    setValue(
        "dateApproved",
        formatDate(data.dateApproved)
    );

    setValue(
        "scholarshipStatus",
        String(data.status || "Active")
            .replaceAll("_", " ")
            .toUpperCase()
    );

    setValue(
        "schoolYear",
        data.schoolYear
    );

    setValue(
        "startDate",
        formatDate(data.startDate)
    );

    setValue(
        "remarks",
        data.remarks
    );


    /* -------------------------------------
       FAMILY INFORMATION
    ------------------------------------- */

    setValue(
        "fatherName",
        data.fatherName
    );

    setValue(
        "fatherOccupation",
        data.fatherOccupation
    );

    setValue(
        "motherName",
        data.motherName
    );

    setValue(
        "motherOccupation",
        data.motherOccupation
    );

    setValue(
        "guardian",
        data.guardian
    );

    setValue(
        "familyIncome",
        data.familyIncome
    );


    /* -------------------------------------
       EMERGENCY CONTACT
    ------------------------------------- */

    setValue(
        "emergencyContact",
        data.emergencyContact
    );

    setValue(
        "emergencyRelationship",
        data.emergencyRelationship
    );

    setValue(
        "emergencyNumber",
        data.emergencyNumber
    );

    setValue(
        "emergencyAddress",
        data.emergencyAddress
    );


    /* -------------------------------------
       ACCOUNT INFORMATION
    ------------------------------------- */

    setValue(
        "username",
        data.scholarId
    );

    setValue(
        "accountEmail",
        data.email
    );

    setValue(
        "lastLogin",
        currentUser?.metadata?.lastSignInTime ||
        "Available after login"
    );

    setValue(
        "accountStatus",
        "Active"
    );


    /* -------------------------------------
       QR SCHOLAR ID
    ------------------------------------- */

    setValueText(
        "qrScholarId",
        data.scholarId
    );

}


/* =========================================
   LOAD APPLICANT PHOTO
========================================= */

async function loadApplicantPhoto() {

    try {

        let storagePath = null;


        /* -------------------------------------
           APPLICATION PHOTO
        ------------------------------------- */

        const applicantPhoto =
            applicationData?.files?.applicantPhoto;


        if (applicantPhoto) {

            storagePath =
                applicantPhoto.storagePath ||
                applicantPhoto.storage_path ||
                applicantPhoto.path ||
                applicantPhoto.filePath ||
                applicantPhoto.file_path ||
                null;
        }


        /* -------------------------------------
           USER PHOTO FALLBACK
        ------------------------------------- */

        if (!storagePath) {

            const userPhoto =
                userData?.photo ||
                userData?.profilePhoto ||
                userData?.photoURL;

            if (typeof userPhoto === "string") {

                storagePath = userPhoto;

            } else if (userPhoto) {

                storagePath =
                    userPhoto.storagePath ||
                    userPhoto.storage_path ||
                    userPhoto.path ||
                    null;
            }
        }


        if (!storagePath) {

            console.warn(
                "No applicant photo storage path found."
            );

            setProfileImage(DEFAULT_PHOTO);

            return;
        }


        console.log(
            "Applicant photo storage path:",
            storagePath
        );


        /* -------------------------------------
           CLEAN PATH
        ------------------------------------- */

        storagePath =
            normalizeStoragePath(storagePath);


        console.log(
            "Final Supabase photo path:",
            storagePath
        );


        /* -------------------------------------
           SIGNED URL
        ------------------------------------- */

        const {
            data,
            error
        } = await supabase
            .storage
            .from(PHOTO_BUCKET)
            .createSignedUrl(
                storagePath,
                3600
            );


        if (error) {

            console.error(
                "Photo signed URL error:",
                error
            );

            setProfileImage(DEFAULT_PHOTO);

            return;
        }


        if (!data?.signedUrl) {

            setProfileImage(DEFAULT_PHOTO);

            return;
        }


        console.log(
            "Profile photo loaded successfully."
        );


        setProfileImage(
            data.signedUrl
        );


    } catch (error) {

        console.error(
            "Load photo error:",
            error
        );

        setProfileImage(
            DEFAULT_PHOTO
        );
    }

}


/* =========================================
   NORMALIZE SUPABASE PATH
========================================= */

function normalizeStoragePath(path) {

    if (!path) return "";

    let cleanPath =
        String(path).trim();


    /* Remove leading slash */

    cleanPath =
        cleanPath.replace(/^\/+/, "");


    /* If full Supabase URL */

    if (
        cleanPath.startsWith("http://") ||
        cleanPath.startsWith("https://")
    ) {

        try {

            const url =
                new URL(cleanPath);

            const marker =
                "/storage/v1/object/";

            const index =
                url.pathname.indexOf(marker);

            if (index !== -1) {

                cleanPath =
                    url.pathname.substring(
                        index + marker.length
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


    /* Remove bucket prefix */

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

    if (profileAvatar) {

        profileAvatar.src = url;

        profileAvatar.onerror =
            () => {

                profileAvatar.src =
                    DEFAULT_PHOTO;

            };
    }


    if (profileAvatarLarge) {

        profileAvatarLarge.src = url;

        profileAvatarLarge.onerror =
            () => {

                profileAvatarLarge.src =
                    DEFAULT_PHOTO;

            };
    }
}


/* =========================================
   LOAD DOCUMENTS
========================================= */

async function loadDocuments(uid) {

    const tbody =
        document.getElementById(
            "documentsBody"
        );

    if (!tbody) return;


    const requirements =
        applicationData?.files?.requirements ||
        applicationData?.requirements ||
        {};


    const entries =
        Object.entries(requirements);


    if (!entries.length) {

        tbody.innerHTML = `
            <tr>
                <td colspan="4"
                    style="
                        text-align:center;
                        color:#6b7280;
                        padding:20px;
                    ">
                    No documents available.
                </td>
            </tr>
        `;

        return;
    }


    let html = "";


    for (
        const [key, value]
        of entries
    ) {

        if (!value) continue;


        const documentName =
            value.name ||
            value.documentName ||
            value.label ||
            formatDocumentName(key);


        const status =
            value.status ||
            value.verificationStatus ||
            "Pending";


        const date =
            value.uploadedAt ||
            value.submittedAt ||
            value.createdAt ||
            applicationData.dateSubmitted ||
            null;


        const storagePath =
            value.storagePath ||
            value.storage_path ||
            value.path ||
            value.filePath ||
            value.file_path ||
            null;


        const safeStatus =
            String(status);


        html += `
            <tr>

                <td>
                    <strong>
                        ${escapeHtml(documentName)}
                    </strong>
                </td>

                <td>
                    ${escapeHtml(
                        formatDate(date)
                    )}
                </td>

                <td>
                    <span class="${
                        safeStatus.toLowerCase()
                            .includes("verified")
                            ? "verified"
                            : "pending"
                    }">
                        ${escapeHtml(safeStatus)}
                    </span>
                </td>

                <td>
                    ${
                        storagePath
                        ?
                        `
                        <button
                            class="btn-view"
                            data-storage-path="${escapeHtml(storagePath)}"
                            type="button">
                            <i class="fas fa-eye"></i>
                            View
                        </button>
                        `
                        :
                        "N/A"
                    }
                </td>

            </tr>
        `;
    }


    if (!html) {

        html = `
            <tr>
                <td colspan="4"
                    style="
                        text-align:center;
                        color:#6b7280;
                        padding:20px;
                    ">
                    No documents available.
                </td>
            </tr>
        `;
    }


    tbody.innerHTML = html;


    /* -------------------------------------
       VIEW DOCUMENT
    ------------------------------------- */

    tbody
        .querySelectorAll(".btn-view")
        .forEach(button => {

            button.addEventListener(
                "click",
                async () => {

                    const path =
                        button.dataset.storagePath;

                    await openDocument(path);
                }
            );

        });

}


/* =========================================
   OPEN DOCUMENT
========================================= */

async function openDocument(path) {

    if (!path) {

        showFeedback(
            "Document path is missing.",
            "error"
        );

        return;
    }


    try {

        const cleanPath =
            normalizeStoragePath(
                path
            );


        const {
            data,
            error
        } = await supabase
            .storage
            .from("requirements")
            .createSignedUrl(
                cleanPath,
                300
            );


        if (error) {

            console.error(
                "Document signed URL error:",
                error
            );

            showFeedback(
                "Unable to open this document.",
                "error"
            );

            return;
        }


        if (!data?.signedUrl) {

            showFeedback(
                "Unable to open this document.",
                "error"
            );

            return;
        }


        window.open(
            data.signedUrl,
            "_blank"
        );

    } catch (error) {

        console.error(
            "Open document error:",
            error
        );

        showFeedback(
            "Unable to open this document.",
            "error"
        );
    }

}


/* =========================================
   SAVE PROFILE
========================================= */

document
    .getElementById("saveProfileBtn")
    ?.addEventListener(
        "click",
        async () => {

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

            const original =
                button.innerHTML;


            try {

                button.disabled = true;

                button.innerHTML = `
                    <i class="fas fa-spinner fa-spin"></i>
                    Saving...
                `;


                const updates = {

                    contactNumber:
                        document.getElementById(
                            "contactNumber"
                        )?.value.trim() || "",

                    address:
                        document.getElementById(
                            "address"
                        )?.value.trim() || "",

                    emergencyContact:
                        document.getElementById(
                            "emergencyContact"
                        )?.value.trim() || "",

                    emergencyRelationship:
                        document.getElementById(
                            "emergencyRelationship"
                        )?.value.trim() || "",

                    emergencyNumber:
                        document.getElementById(
                            "emergencyNumber"
                        )?.value.trim() || "",

                    emergencyAddress:
                        document.getElementById(
                            "emergencyAddress"
                        )?.value.trim() || "",

                    updatedAt:
                        serverTimestamp()
                };


                /* --------------------------------
                   SAVE TO USERS/{UID}
                -------------------------------- */

                await updateDoc(
                    doc(
                        db,
                        "users",
                        currentUser.uid
                    ),
                    updates
                );


                /* --------------------------------
                   SAVE TO APPLICATIONS/{UID}
                -------------------------------- */

                await updateDoc(
                    doc(
                        db,
                        "applications",
                        currentUser.uid
                    ),
                    {

                        "personalInformation.contactNumber":
                            updates.contactNumber,

                        "personalInformation.completeAddress":
                            updates.address,

                        "emergencyContact.name":
                            updates.emergencyContact,

                        "emergencyContact.relationship":
                            updates.emergencyRelationship,

                        "emergencyContact.contactNumber":
                            updates.emergencyNumber,

                        "emergencyContact.address":
                            updates.emergencyAddress,

                        updatedAt:
                            serverTimestamp()
                    }
                );


                /* Update local data */

                userData.contactNumber =
                    updates.contactNumber;

                userData.address =
                    updates.address;

                applicationData
                    .personalInformation =
                    applicationData
                        .personalInformation || {};

                applicationData
                    .personalInformation
                    .contactNumber =
                    updates.contactNumber;

                applicationData
                    .personalInformation
                    .completeAddress =
                    updates.address;


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

                button.disabled = false;

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
   VIEW QR
========================================= */

window.viewQR =
    function () {

        const scholarId =
            document.getElementById(
                "qrScholarId"
            )?.textContent || "";

        alert(
            "Your permanent ScholarLink QR Code\n\n" +
            "Scholar ID: " +
            scholarId
        );

    };


/* =========================================
   DOWNLOAD QR
========================================= */

window.downloadQR =
    function () {

        const qrImage =
            document.querySelector(
                ".qr-image"
            );

        if (!qrImage) {

            alert(
                "QR Code is not available."
            );

            return;
        }


        const link =
            document.createElement("a");

        link.href =
            qrImage.src;

        link.download =
            "ScholarLink-QR-Code.png";

        link.click();

    };


/* =========================================
   CALCULATE AGE
========================================= */

function calculateAge(dateValue) {

    if (!dateValue) {

        return "";
    }


    const birth =
        new Date(dateValue);


    if (Number.isNaN(
        birth.getTime()
    )) {

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
}


/* =========================================
   FORMAT DATE
========================================= */

function formatDate(value) {

    if (!value) return "N/A";


    try {

        if (
            typeof value === "object" &&
            typeof value.toDate === "function"
        ) {

            return value
                .toDate()
                .toLocaleDateString();
        }


        const date =
            new Date(value);


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return String(value);
        }


        return date.toLocaleDateString();

    } catch {

        return String(value);
    }

}


/* =========================================
   FORMAT DOCUMENT NAME
========================================= */

function formatDocumentName(key) {

    return String(key)
        .replace(/_/g, " ")
        .replace(/-/g, " ")
        .replace(/\b\w/g, letter =>
            letter.toUpperCase()
        );

}


/* =========================================
   SET INPUT VALUE
========================================= */

function setValue(id, value) {

    const element =
        document.getElementById(id);

    if (!element) return;

    element.value =
        value ?? "";

}


/* =========================================
   SET TEXT
========================================= */

function setValueText(id, value) {

    const element =
        document.getElementById(id);

    if (!element) return;

    element.textContent =
        value ?? "";

}


/* =========================================
   ESCAPE HTML
========================================= */

function escapeHtml(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* =========================================
   FEEDBACK
========================================= */

function showFeedback(
    message,
    type
) {

    if (!saveFeedback) return;


    saveFeedback.textContent =
        message;

    saveFeedback.className =
        `save-feedback ${type}`;

    saveFeedback.style.display =
        "block";


    setTimeout(() => {

        saveFeedback.style.display =
            "none";

    }, 4000);

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
    .querySelectorAll(".menu li")
    .forEach(item => {

        const link =
            item.querySelector("a");

        if (!link) return;


        const linkPage =
            link
                .getAttribute("href")
                ?.split("/")
                .pop()
                .toLowerCase();


        item.classList.remove(
            "active"
        );


        if (
            linkPage === currentPage
        ) {

            item.classList.add(
                "active"
            );
        }

    });


/* =========================================
   LOGOUT
========================================= */

document
    .getElementById("logoutLink")
    ?.addEventListener(
        "click",
        async (event) => {

            event.preventDefault();


            const confirmed =
                confirm(
                    "Are you sure you want to logout?"
                );


            if (!confirmed) return;


            try {

                await signOut(auth);

                window.location.href =
                    "../login/index.html";

            } catch (error) {

                console.error(
                    "Logout error:",
                    error
                );

                showFeedback(
                    "Unable to logout.",
                    "error"
                );
            }

        }
    );


/* =========================================
   INPUT HIGHLIGHT
========================================= */

document
    .querySelectorAll("input")
    .forEach(input => {

        if (
            input.hasAttribute(
                "readonly"
            )
        ) return;


        input.addEventListener(
            "focus",
            function () {

                this.style.borderColor =
                    "#2F80ED";

            }
        );


        input.addEventListener(
            "blur",
            function () {

                this.style.borderColor =
                    "";

            }
        );

    });


/* =========================================
   CARD ANIMATION
========================================= */

document
    .querySelectorAll(".card")
    .forEach(
        (card, index) => {

            card.style.opacity =
                "0";

            card.style.transform =
                "translateY(20px)";


            setTimeout(() => {

                card.style.transition =
                    "0.5s ease";

                card.style.opacity =
                    "1";

                card.style.transform =
                    "translateY(0)";

            }, index * 100);

        }
    );


/* =========================================
   CTRL + S
========================================= */

document.addEventListener(
    "keydown",
    event => {

        if (
            (event.ctrlKey ||
             event.metaKey) &&
            event.key.toLowerCase() === "s"
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
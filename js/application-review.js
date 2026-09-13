/* =========================================================
   SCHOLARLINK
   APPLICATION REVIEW
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
    getDoc,
    updateDoc,
    setDoc,
    runTransaction,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";


import {
    supabase
} from "../supabase.js";



/* =========================================================
   GET APPLICATION ID
========================================================= */

const urlParams =
    new URLSearchParams(
        window.location.search
    );


const applicationId =
    urlParams.get("id");



/* =========================================================
   ELEMENTS
========================================================= */

const loadingState =
    document.getElementById(
        "loadingState"
    );


const errorState =
    document.getElementById(
        "errorState"
    );


const errorMessage =
    document.getElementById(
        "errorMessage"
    );


const applicationContent =
    document.getElementById(
        "applicationContent"
    );


const applicationStatus =
    document.getElementById(
        "applicationStatus"
    );


const qualifyBtn =
    document.getElementById(
        "qualifyBtn"
    );


const correctionBtn =
    document.getElementById(
        "correctionBtn"
    );


const rejectBtn =
    document.getElementById(
        "rejectBtn"
    );


const initialActions =
    document.getElementById(
        "initialActions"
    );


const examScheduleSection =
    document.getElementById(
        "examScheduleSection"
    );


const examDate =
    document.getElementById(
        "examDate"
    );


const examTime =
    document.getElementById(
        "examTime"
    );


const examVenue =
    document.getElementById(
        "examVenue"
    );


const examLink =
    document.getElementById(
        "examLink"
    );


const scheduleExamBtn =
    document.getElementById(
        "scheduleExamBtn"
    );


const cancelScheduleBtn =
    document.getElementById(
        "cancelScheduleBtn"
    );


const examActions =
    document.getElementById(
        "examActions"
    );


const examTakenBtn =
    document.getElementById(
        "examTakenBtn"
    );


const passedBtn =
    document.getElementById(
        "passedBtn"
    );


const failedBtn =
    document.getElementById(
        "failedBtn"
    );


const confirmScholarSection =
    document.getElementById(
        "confirmScholarSection"
    );


const confirmScholarBtn =
    document.getElementById(
        "confirmScholarBtn"
    );


const decisionMessage =
    document.getElementById(
        "decisionMessage"
    );



/* =========================================================
   CURRENT DATA
========================================================= */

let currentApplication = null;

let currentAdmin = null;



/* =========================================================
   AUTH
========================================================= */

onAuthStateChanged(
    auth,
    async (user) => {

        if (!user) {

            window.location.href =
                "../login/index.html";

            return;

        }


        if (!applicationId) {

            showError(
                "No application ID was provided."
            );

            return;

        }


        currentAdmin = user;


        await loadApplication(
            applicationId
        );

    }
);



/* =========================================================
   LOAD APPLICATION
========================================================= */

async function loadApplication(
    id
) {

    try {

        showLoading();


        /* =================================================
           CHECK ADMIN
        ================================================= */

        const adminRef =
            doc(
                db,
                "users",
                auth.currentUser.uid
            );


        const adminSnapshot =
            await getDoc(
                adminRef
            );


        if (
            !adminSnapshot.exists()
        ) {

            throw new Error(
                "Administrator account was not found."
            );

        }


        const adminData =
            adminSnapshot.data();


        if (
            adminData.role !== "admin"
        ) {

            throw new Error(
                "You do not have administrator permission."
            );

        }



        /* =================================================
           LOAD APPLICATION
        ================================================= */

        const applicationRef =
            doc(
                db,
                "applications",
                id
            );


        const applicationSnapshot =
            await getDoc(
                applicationRef
            );


        if (
            !applicationSnapshot.exists()
        ) {

            throw new Error(
                "Application not found."
            );

        }


        currentApplication =
            applicationSnapshot.data();


        console.log(
            "Application Review:",
            currentApplication
        );


        renderApplication(
            currentApplication
        );


        await loadApplicantPhoto(
            currentApplication
        );


        await loadRequirements(
            currentApplication
        );


        setupWorkflowUI(
            currentApplication
        );


        hideLoading();

    }

    catch (error) {

        console.error(
            "Application review error:",
            error
        );


        showError(
            error.message
        );

    }

}



/* =========================================================
   RENDER APPLICATION
========================================================= */

function renderApplication(
    application
) {

    const personal =
        application.personalInformation ||
        {};


    const academic =
        application.academicInformation ||
        {};


    const family =
        application.familyInformation ||
        {};


    const household =
        application.householdInformation ||
        {};


    const father =
        family.father ||
        {};


    const mother =
        family.mother ||
        {};


    const guardian =
        family.guardian ||
        {};



    /* =================================================
       SUMMARY
    ================================================= */

    setText(
        "applicationId",
        application.applicantId ||
        applicationId
    );


    setText(
        "dateSubmitted",
        formatDate(
            application.submittedAt
        )
    );


    setText(
        "summaryStatus",
        getStatusLabel(
            application.status
        )
    );


    setText(
        "applicantEmail",
        personal.email ||
        application.email ||
        auth.currentUser?.email ||
        "---"
    );



    /* =================================================
       PERSONAL
    ================================================= */

    const fullName =
        [
            personal.firstName,
            personal.middleName,
            personal.lastName,
            personal.suffix
        ]
        .filter(Boolean)
        .join(" ");


    setText(
        "fullName",
        fullName ||
        "---"
    );


    setText(
        "dateOfBirth",
        personal.dateOfBirth ||
        "---"
    );


    setText(
        "age",
        personal.age ||
        "---"
    );


    setText(
        "sex",
        personal.sex ||
        "---"
    );


    setText(
        "civilStatus",
        personal.civilStatus ||
        "---"
    );


    setText(
        "citizenship",
        personal.citizenship ||
        "---"
    );


    setText(
        "birthplace",
        personal.birthplace ||
        "---"
    );


    setText(
        "contactNumber",
        personal.contactNumber ||
        "---"
    );


    setText(
        "completeAddress",
        buildAddress(
            personal
        )
    );



    /* =================================================
       EDUCATION
    ================================================= */

    setText(
        "schoolName",
        academic.schoolName ||
        "---"
    );


    setText(
        "studentId",
        academic.studentId ||
        academic.studentIdLrn ||
        "---"
    );


    setText(
        "generalAverage",
        academic.generalAverage ||
        academic.gpa ||
        "---"
    );


    setText(
        "graduationYear",
        academic.graduationYear ||
        "---"
    );


    setText(
        "schoolAddress",
        academic.schoolAddress ||
        "---"
    );



    /* =================================================
       FATHER
    ================================================= */

    setText(
        "fatherName",
        father.name ||
        father.fullName ||
        "---"
    );


    setText(
        "fatherOccupation",
        father.occupation ||
        "---"
    );


    setText(
        "fatherEmployer",
        father.employer ||
        "---"
    );


    setText(
        "fatherIncome",
        father.monthlyIncome ||
        "---"
    );


    setText(
        "fatherContact",
        father.contactNumber ||
        "---"
    );



    /* =================================================
       MOTHER
    ================================================= */

    setText(
        "motherName",
        mother.name ||
        mother.fullName ||
        "---"
    );


    setText(
        "motherOccupation",
        mother.occupation ||
        "---"
    );


    setText(
        "motherEmployer",
        mother.employer ||
        "---"
    );


    setText(
        "motherIncome",
        mother.monthlyIncome ||
        "---"
    );


    setText(
        "motherContact",
        mother.contactNumber ||
        "---"
    );



    /* =================================================
       GUARDIAN
    ================================================= */

    setText(
        "guardianName",
        guardian.name ||
        guardian.fullName ||
        "---"
    );


    setText(
        "guardianRelationship",
        guardian.relationship ||
        "---"
    );


    setText(
        "guardianOccupation",
        guardian.occupation ||
        "---"
    );


    setText(
        "guardianIncome",
        guardian.monthlyIncome ||
        "---"
    );


    setText(
        "guardianContact",
        guardian.contactNumber ||
        "---"
    );



    /* =================================================
       HOUSEHOLD
    ================================================= */

    setText(
        "familyMembers",
        household.familyMembers ??
        household.numberOfFamilyMembers ??
        "---"
    );


    setText(
        "siblings",
        household.siblings ??
        household.numberOfSiblings ??
        "---"
    );


    setText(
        "siblingsStudying",
        household.siblingsStudying ??
        household.numberOfSiblingsStudying ??
        "---"
    );


    setText(
        "householdIncome",
        household.totalMonthlyHouseholdIncome ??
        "---"
    );


    setText(
        "housingStatus",
        household.housingStatus ||
        "---"
    );


    setText(
        "incomeSource",
        household.incomeSource ||
        "---"
    );



    /* =================================================
       REASON
    ================================================= */

    setText(
        "reasonForApplying",
        application.reasonForApplying ||
        "No reason provided."
    );


    updateStatusDisplay(
        application.status ||
        "submitted"
    );

}



/* =========================================================
   LOAD APPLICANT PHOTO
========================================================= */

async function loadApplicantPhoto(
    application
) {

    const photo =
        application?.files?.applicantPhoto;


    const image =
        document.getElementById(
            "applicantPhoto"
        );


    const placeholder =
        document.getElementById(
            "photoPlaceholder"
        );


    if (
        !photo ||
        !photo.storagePath
    ) {

        return;

    }


    try {

        const {
            data,
            error
        } =
            await supabase.storage
                .from(
                    "applicant-photos"
                )
                .createSignedUrl(
                    photo.storagePath,
                    600
                );


        if (error) {

            throw error;

        }


        if (
            !data ||
            !data.signedUrl
        ) {

            throw new Error(
                "No signed URL returned."
            );

        }


        image.src =
            data.signedUrl;


        image.style.display =
            "block";


        placeholder.style.display =
            "none";

    }

    catch (error) {

        console.error(
            "Applicant photo error:",
            error
        );

    }

}



/* =========================================================
   LOAD REQUIREMENTS
========================================================= */

async function loadRequirements(
    application
) {

    const container =
        document.getElementById(
            "requirementsList"
        );


    container.innerHTML = "";


    const requirements =
        application?.files?.requirements;


    if (
        !requirements ||
        typeof requirements !== "object"
    ) {

        showNoRequirements(
            container
        );

        return;

    }


    const entries =
        Object.entries(
            requirements
        );


    if (
        entries.length === 0
    ) {

        showNoRequirements(
            container
        );

        return;

    }


    for (
        const [key, file]
        of entries
    ) {

        if (
            !file ||
            !file.storagePath
        ) {

            continue;

        }


        const item =
            createRequirementItem(
                key,
                file
            );


        container.appendChild(
            item
        );


        await createRequirementUrl(
            item,
            file.storagePath
        );

    }

}



/* =========================================================
   NO REQUIREMENTS
========================================================= */

function showNoRequirements(
    container
) {

    container.innerHTML = `

        <div class="no-requirements">

            <i class="fas fa-folder-open"></i>

            <div>
                No submitted requirements found.
            </div>

        </div>

    `;

}



/* =========================================================
   CREATE REQUIREMENT ITEM
========================================================= */

function createRequirementItem(
    key,
    file
) {

    const item =
        document.createElement(
            "div"
        );


    item.className =
        "requirement-item";


    const info =
        document.createElement(
            "div"
        );


    info.className =
        "requirement-info";


    const icon =
        document.createElement(
            "div"
        );


    icon.className =
        "requirement-icon";


    icon.innerHTML =
        `<i class="fas fa-file-image"></i>`;


    const text =
        document.createElement(
            "div"
        );


    const name =
        document.createElement(
            "div"
        );


    name.className =
        "requirement-name";


    name.textContent =
        formatRequirementName(
            key
        );


    const filename =
        document.createElement(
            "div"
        );


    filename.className =
        "requirement-file";


    filename.textContent =
        file.fileName ||
        file.name ||
        getFileName(
            file.storagePath
        );


    text.appendChild(
        name
    );


    text.appendChild(
        filename
    );


    info.appendChild(
        icon
    );


    info.appendChild(
        text
    );


    const action =
        document.createElement(
            "div"
        );


    action.className =
        "requirement-action";


    const button =
        document.createElement(
            "a"
        );


    button.className =
        "view-file-btn";


    button.target =
        "_blank";


    button.rel =
        "noopener noreferrer";


    button.innerHTML =
        `<i class="fas fa-eye"></i> View File`;


    action.appendChild(
        button
    );


    item.appendChild(
        info
    );


    item.appendChild(
        action
    );


    return item;

}



/* =========================================================
   CREATE SIGNED URL
========================================================= */

async function createRequirementUrl(
    item,
    storagePath
) {

    const button =
        item.querySelector(
            ".view-file-btn"
        );


    try {

        const {
            data,
            error
        } =
            await supabase.storage
                .from(
                    "requirements"
                )
                .createSignedUrl(
                    storagePath,
                    600
                );


        if (error) {

            throw error;

        }


        if (
            !data ||
            !data.signedUrl
        ) {

            throw new Error(
                "No signed URL returned."
            );

        }


        button.href =
            data.signedUrl;

    }

    catch (error) {

        console.error(
            "Requirement URL error:",
            error
        );


        button.removeAttribute(
            "href"
        );


        button.textContent =
            "File unavailable";

    }

}



/* =========================================================
   QUALIFY FOR EXAM
========================================================= */

qualifyBtn.addEventListener(
    "click",
    async () => {

        if (!currentApplication) {
            return;
        }


        const confirmed =
            confirm(
                "Qualify this applicant for the scholarship examination?"
            );


        if (!confirmed) {
            return;
        }


        await updateApplication(
            {
                status: "qualified",
                reviewMessage:
                    "Your application has passed the initial review. You are qualified to take the scholarship examination."
            },
            "Applicant qualified for examination."
        );


        showScheduleSection();

    }
);



/* =========================================================
   NEEDS CORRECTION
========================================================= */

correctionBtn.addEventListener(
    "click",
    async () => {

        if (!currentApplication) {
            return;
        }


        const reason =
            prompt(
                "Enter the correction needed:"
            );


        if (reason === null) {
            return;
        }


        const cleanReason =
            reason.trim();


        if (!cleanReason) {

            alert(
                "Please provide the correction message."
            );

            return;

        }


        await updateApplication(
            {
                status: "needs_correction",
                reviewMessage:
                    cleanReason
            },
            "Correction needed."
        );

    }
);



/* =========================================================
   REJECT
========================================================= */

rejectBtn.addEventListener(
    "click",
    async () => {

        if (!currentApplication) {
            return;
        }


        const reason =
            prompt(
                "Enter the reason for rejecting this application:"
            );


        if (reason === null) {
            return;
        }


        const cleanReason =
            reason.trim();


        if (!cleanReason) {

            alert(
                "Please provide a rejection reason."
            );

            return;

        }


        const confirmed =
            confirm(
                "Are you sure you want to reject this application?"
            );


        if (!confirmed) {
            return;
        }


        await updateApplication(
            {
                status: "rejected",
                reviewMessage:
                    cleanReason
            },
            "Application rejected."
        );

    }
);






/* =========================================================
   CANCEL SCHEDULE
========================================================= */

cancelScheduleBtn.addEventListener(
    "click",
    () => {

        examScheduleSection.style.display =
            "none";


        if (initialActions) {

            initialActions.style.display =
                "flex";

        }

    }
);



/* =========================================================
   SCHEDULE EXAM
========================================================= */

scheduleExamBtn.addEventListener(
    "click",
    async () => {

        const date =
            examDate.value.trim();


        const time =
            examTime.value.trim();


        const venue =
            examVenue.value.trim();


        const link =
            examLink.value.trim();


        if (!date) {

            alert(
                "Please select the exam date."
            );

            return;

        }


        if (!time) {

            alert(
                "Please select the exam time."
            );

            return;

        }


        if (!venue) {

            alert(
                "Please enter the exam venue."
            );

            return;

        }


        const confirmed =
            confirm(
                `Schedule the examination on ${date} at ${time} in ${venue}?`
            );


        if (!confirmed) {
            return;
        }


        await updateApplication(
            {
                status: "exam_scheduled",

                examStatus: "scheduled",

                examDate: date,

                examTime: time,

                examVenue: venue,

                examLink: link || "",

                reviewMessage:
                    `Your scholarship examination has been scheduled on ${date} at ${time}. Venue: ${venue}.`
            },

            "Examination scheduled successfully."
        );


        currentApplication.examDate =
            date;

        currentApplication.examTime =
            time;

        currentApplication.examVenue =
            venue;

        currentApplication.examLink =
            link;


        examScheduleSection.style.display =
            "none";


        showExamActions();

    }
);



/* =========================================================
   MARK EXAM TAKEN
========================================================= */

examTakenBtn.addEventListener(
    "click",
    async () => {

        if (!currentApplication) {
            return;
        }


        const confirmed =
            confirm(
                "Mark this applicant's examination as taken?"
            );


        if (!confirmed) {
            return;
        }


        await updateApplication(
            {
                status: "exam_taken",

                examStatus: "taken",

                examTakenAt:
                    serverTimestamp(),

                reviewMessage:
                    "Your examination has been recorded as completed."
            },

            "Examination marked as taken."
        );


        currentApplication.status =
            "exam_taken";


        currentApplication.examStatus =
            "taken";


        showExamActions();

    }
);



/* =========================================================
   PASSED
========================================================= */

passedBtn.addEventListener(
    "click",
    async () => {

        if (!currentApplication) {
            return;
        }


        const confirmed =
            confirm(
                "Record this applicant as PASSED?"
            );


        if (!confirmed) {
            return;
        }


        await updateApplication(
            {
                status: "passed",

                examStatus: "completed",

                examResult: "passed",

                resultRecordedAt:
                    serverTimestamp(),

                reviewMessage:
                    "Congratulations! You passed the scholarship examination. Please wait for scholar confirmation."
            },

            "Applicant passed the examination."
        );


        currentApplication.status =
            "passed";


        currentApplication.examResult =
            "passed";


        showConfirmScholar();

    }
);



/* =========================================================
   FAILED
========================================================= */

failedBtn.addEventListener(
    "click",
    async () => {

        if (!currentApplication) {
            return;
        }


        const confirmed =
            confirm(
                "Record this applicant as FAILED?"
            );


        if (!confirmed) {
            return;
        }


        await updateApplication(
            {
                status: "failed",

                examStatus: "completed",

                examResult: "failed",

                resultRecordedAt:
                    serverTimestamp(),

                reviewMessage:
                    "You were not selected for the scholarship based on the examination result."
            },

            "Applicant failed the examination."
        );


        currentApplication.status =
            "failed";


        currentApplication.examResult =
            "failed";


        hideAllWorkflowActions();

    }
);

/* =========================================================
   GENERATE UNIQUE SCHOLAR ID
========================================================= */

async function generateScholarId() {

    const currentYear =
        new Date().getFullYear();

    const counterRef =
        doc(
            db,
            "systemCounters",
            `scholarIdCounter_${currentYear}`
        );


    const scholarNumber =
        await runTransaction(
            db,
            async (transaction) => {

                const counterSnapshot =
                    await transaction.get(
                        counterRef
                    );


                let nextNumber = 1;


                if (
                    counterSnapshot.exists()
                ) {

                    const counterData =
                        counterSnapshot.data();

                    nextNumber =
                        Number(
                            counterData.value || 0
                        ) + 1;
                }


                transaction.set(
                    counterRef,
                    {
                        value: nextNumber,
                        year: currentYear,
                        updatedAt:
                            serverTimestamp()
                    },
                    {
                        merge: true
                    }
                );


                return nextNumber;
            }
        );


    return `SCH-${currentYear}-${String(
        scholarNumber
    ).padStart(4, "0")}`;
}



/* =========================================================
   GENERATE UNIQUE QR TOKEN
========================================================= */

function generateQRToken() {

    const randomPart =
        crypto.randomUUID()
            .replace(/-/g, "")
            .substring(0, 20)
            .toUpperCase();


    return `SLK-${randomPart}`;
}

/* =========================================================
   CONFIRM SCHOLAR
========================================================= */

confirmScholarBtn.addEventListener(
    "click",
    async () => {

        if (!currentApplication) {
            return;
        }


        const confirmed =
            confirm(
                "Confirm this applicant as an official Scholar and activate the Scholar account?"
            );


        if (!confirmed) {
            return;
        }


        try {

            disableAllButtons();


            decisionMessage.textContent =
                "Creating Scholar ID, QR token, and activating account...";


            /* =================================================
               FIREBASE UID
            ================================================= */

            const uid =
                applicationId;


            if (!uid) {

                throw new Error(
                    "Applicant Firebase UID was not found."
                );

            }


            /* =================================================
               GET USER DATA
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


            if (!userSnapshot.exists()) {

                throw new Error(
                    "Applicant user account was not found."
                );

            }


            const userData =
                userSnapshot.data();



            /* =================================================
               GET EXISTING SCHOLAR RECORD
            ================================================= */

            const scholarRef =
                doc(
                    db,
                    "scholars",
                    uid
                );


            const existingScholarSnapshot =
                await getDoc(
                    scholarRef
                );


            let scholarId;
            let qrToken;


            /*
             * If scholar record already exists,
             * preserve its existing ID and QR token.
             *
             * This prevents generating a new ID/QR
             * when the Confirm Scholar button is clicked again.
             */

            if (
                existingScholarSnapshot.exists()
            ) {

                const existingScholar =
                    existingScholarSnapshot.data();


                scholarId =
                    existingScholar.scholarId ||
                    await generateScholarId();


                qrToken =
                    existingScholar.qrToken ||
                    generateQRToken();

            }

            else {

                scholarId =
                    await generateScholarId();


                qrToken =
                    generateQRToken();

            }



            /* =================================================
               GET APPLICATION INFORMATION
            ================================================= */

            const personal =
                currentApplication
                    ?.personalInformation ||
                {};


            const academic =
                currentApplication
                    ?.academicInformation ||
                {};


            const family =
                currentApplication
                    ?.familyInformation ||
                {};


            const household =
                currentApplication
                    ?.householdInformation ||
                {};


            const fullName =
                [
                    personal.firstName,
                    personal.middleName,
                    personal.lastName,
                    personal.suffix
                ]
                .filter(Boolean)
                .join(" ");



            /* =================================================
               CREATE / UPDATE SCHOLAR RECORD
            ================================================= */

            await setDoc(
                scholarRef,
                {

                    /* =========================
                       IDENTIFICATION
                    ========================= */

                    uid:
                        uid,

                    userId:
                        uid,

                    applicationId:
                        uid,

                    scholarId:
                        scholarId,

                    qrToken:
                        qrToken,

                    applicantId:
                        currentApplication.applicantId ||
                        "",


                    /* =========================
                       PERSONAL INFORMATION
                    ========================= */

                    firstName:
                        personal.firstName ||
                        "",

                    middleName:
                        personal.middleName ||
                        "",

                    lastName:
                        personal.lastName ||
                        "",

                    suffix:
                        personal.suffix ||
                        "",

                    fullName:
                        fullName,

                    dateOfBirth:
                        personal.dateOfBirth ||
                        "",

                    age:
                        personal.age ||
                        "",

                    sex:
                        personal.sex ||
                        "",

                    civilStatus:
                        personal.civilStatus ||
                        "",

                    citizenship:
                        personal.citizenship ||
                        "",

                    birthplace:
                        personal.birthplace ||
                        "",

                    contactNumber:
                        personal.contactNumber ||
                        "",

                    email:
                        personal.email ||
                        userData.email ||
                        "",


                    /* =========================
                       ADDRESS
                    ========================= */

                    completeAddress:
                        personal.completeAddress ||
                        "",

                    barangay:
                        personal.barangay ||
                        "",

                    municipalityCity:
                        personal.municipalityCity ||
                        "",

                    province:
                        personal.province ||
                        "",

                    zipCode:
                        personal.zipCode ||
                        "",


                    /* =========================
                       EDUCATIONAL INFORMATION
                    ========================= */

                    schoolName:
                        academic.schoolName ||
                        "",

                    schoolAddress:
                        academic.schoolAddress ||
                        "",

                    studentId:
                        academic.studentId ||
                        academic.studentIdLrn ||
                        "",

                    generalAverage:
                        academic.generalAverage ||
                        academic.gpa ||
                        "",

                    graduationYear:
                        academic.graduationYear ||
                        "",


                    /* =========================
                       FAMILY INFORMATION
                    ========================= */

                    familyInformation:
                        family,


                    /* =========================
                       HOUSEHOLD INFORMATION
                    ========================= */

                    householdInformation:
                        household,


                    /* =========================
                       SCHOLAR STATUS
                    ========================= */

                    status:
                        "active",

                    scholarStatus:
                        "active",

                    accountStatus:
                        "active",


                    /* =========================
                       CONFIRMATION
                    ========================= */

                    confirmedAt:
                        serverTimestamp(),

                    confirmedBy:
                        auth.currentUser.uid,

                    createdAt:
                        existingScholarSnapshot.exists()
                            ? (
                                existingScholarSnapshot
                                    .data()
                                    .createdAt ||
                                serverTimestamp()
                            )
                            : serverTimestamp(),

                    updatedAt:
                        serverTimestamp()

                },

                {
                    merge:
                        true
                }
            );



            /* =================================================
               UPDATE APPLICATION
            ================================================= */

            const applicationRef =
                doc(
                    db,
                    "applications",
                    uid
                );


            await updateDoc(
                applicationRef,
                {

                    status:
                        "scholar_confirmed",

                    scholarConfirmed:
                        true,

                    scholarId:
                        scholarId,

                    qrToken:
                        qrToken,

                    scholarStatus:
                        "active",

                    examResult:
                        "passed",

                    confirmedAt:
                        serverTimestamp(),

                    confirmedBy:
                        auth.currentUser.uid,

                    updatedAt:
                        serverTimestamp(),

                    reviewMessage:
                        "Congratulations! You are now an official Scholar. Your Scholar account has been activated."

                }
            );



            /* =================================================
               UPDATE USER ACCOUNT
            ================================================= */

            await updateDoc(
                userRef,
                {

                    role:
                        "scholar",

                    scholarId:
                        scholarId,

                    applicationStatus:
                        "scholar_confirmed",

                    scholarConfirmed:
                        true,

                    scholarStatus:
                        "active",

                    updatedAt:
                        serverTimestamp()

                }
            );



            /* =================================================
               CREATE SCHOLAR NOTIFICATION
            ================================================= */

            try {

                await createNotification(
                    uid,

                    "Scholar Account Activated",

                    `Congratulations! You are now an official Scholar. Your Scholar ID is ${scholarId}. Your Scholar account is now active.`,

                    "success"
                );

            }

            catch (
                notificationError
            ) {

                /*
                 * Notification failure should not cancel
                 * the successful Scholar activation.
                 */

                console.warn(
                    "Scholar notification could not be created:",
                    notificationError
                );

            }



            /* =================================================
               UPDATE LOCAL APPLICATION
            ================================================= */

            currentApplication.status =
                "scholar_confirmed";


            currentApplication.scholarConfirmed =
                true;


            currentApplication.scholarId =
                scholarId;


            currentApplication.qrToken =
                qrToken;


            currentApplication.scholarStatus =
                "active";


            updateStatusDisplay(
                "scholar_confirmed"
            );


            hideAllWorkflowActions();


            decisionMessage.textContent =
                `Scholar confirmed successfully. Scholar ID: ${scholarId}`;


            decisionMessage.style.color =
                "#059669";


            alert(
                `Scholar confirmed successfully!\n\n` +
                `Scholar ID: ${scholarId}\n\n` +
                `The Scholar account is now active.`
            );

        }

        catch (error) {

            console.error(
                "Confirm scholar error:",
                error
            );


            decisionMessage.textContent =
                "Failed to confirm scholar: " +
                error.message;


            decisionMessage.style.color =
                "#dc2626";


            enableAllButtons();

        }

    }
);


/* =========================================================
   GENERIC APPLICATION UPDATE
========================================================= */

async function updateApplication(
    data,
    successMessage
) {

    try {

        disableAllButtons();


        decisionMessage.textContent =
            "Updating application...";


        const applicationRef =
            doc(
                db,
                "applications",
                applicationId
            );


        await updateDoc(
            applicationRef,
            {

                ...data,

                reviewedAt:
                    serverTimestamp(),

                reviewedBy:
                    auth.currentUser.uid,

                updatedAt:
                    serverTimestamp()

            }
        );



        /* =============================================
           UPDATE USER
        ============================================= */

        const userRef =
            doc(
                db,
                "users",
                applicationId
            );


        const userSnapshot =
            await getDoc(
                userRef
            );


        if (userSnapshot.exists()) {

            const newUserStatus =
                data.status;


            await updateDoc(
                userRef,
                {

                    applicationStatus:
                        newUserStatus,

                    updatedAt:
                        serverTimestamp()

                }
            );

        }



        /* =============================================
           NOTIFICATION MESSAGE
        ============================================= */

        let title =
            "Application Update";


        let type =
            "application";


        let notificationMessage =
            data.reviewMessage ||
            successMessage;



        if (
            data.status ===
            "qualified"
        ) {

            title =
                "Qualified for Examination";

            type =
                "success";

        }


        else if (
            data.status ===
            "exam_scheduled"
        ) {

            title =
                "Examination Scheduled";

            type =
                "success";

        }


        else if (
            data.status ===
            "exam_taken"
        ) {

            title =
                "Examination Completed";

            type =
                "information";

        }


        else if (
            data.status ===
            "passed"
        ) {

            title =
                "Examination Result";

            type =
                "success";

        }


        else if (
            data.status ===
            "failed"
        ) {

            title =
                "Examination Result";

            type =
                "error";

        }


        else if (
            data.status ===
            "needs_correction"
        ) {

            title =
                "Correction Needed";

            type =
                "warning";

        }


        else if (
            data.status ===
            "rejected"
        ) {

            title =
                "Application Rejected";

            type =
                "error";

        }



        await createNotification(
            applicationId,

            title,

            notificationMessage,

            type
        );



        /* =============================================
           UPDATE LOCAL
        ============================================= */

        Object.assign(
            currentApplication,
            data
        );


        updateStatusDisplay(
            data.status
        );


        decisionMessage.textContent =
            successMessage;


        decisionMessage.style.color =
            "#059669";


        enableAllButtons();


        console.log(
            "Application updated:",
            data
        );

    }

    catch (error) {

        console.error(
            "Application update error:",
            error
        );


        decisionMessage.textContent =
            "Failed to update application: " +
            error.message;


        decisionMessage.style.color =
            "#dc2626";


        enableAllButtons();

    }

}



/* =========================================================
   CREATE NOTIFICATION
========================================================= */

async function createNotification(
    userId,
    title,
    message,
    type
) {

    const notificationId =
        `${userId}_${Date.now()}`;


    const notificationRef =
        doc(
            db,
            "notifications",
            notificationId
        );


    await setDoc(
        notificationRef,
        {

            userId:
                userId,

            applicationId:
                applicationId,

            title:
                title,

            message:
                message,

            type:
                type,

            read:
                false,

            createdAt:
                serverTimestamp()

        }
    );

}



/* =========================================================
   SETUP WORKFLOW UI
========================================================= */

function setupWorkflowUI(
    application
) {

    const status =
        String(
            application.status ||
            "submitted"
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


    const result =
        String(
            application.examResult ||
            ""
        )
        .toLowerCase()
        .replace(
            /\s+/g,
            "_"
        );



    /* =============================================
       PENDING
    ============================================= */

    if (
        status === "submitted" ||
        status === "pending" ||
        status === "pending_review" ||
        status === "for_review"
    ) {

        showInitialActions();

        return;

    }



    /* =============================================
       QUALIFIED
    ============================================= */

    if (
        status === "qualified" ||
        status === "exam_qualified"
    ) {

        showScheduleSection();

        return;

    }



    /* =============================================
       EXAM SCHEDULED
    ============================================= */

    if (
        status === "exam_scheduled" ||
        examStatus === "scheduled"
    ) {

        showExamActions();

        return;

    }



    /* =============================================
       EXAM TAKEN
    ============================================= */

    if (
        status === "exam_taken" ||
        examStatus === "taken"
    ) {

        showExamActions();

        return;

    }



    /* =============================================
       PASSED
    ============================================= */

    if (
        status === "passed" ||
        result === "passed"
    ) {

        showConfirmScholar();

        return;

    }



    /* =============================================
       FAILED
    ============================================= */

    if (
        status === "failed" ||
        result === "failed"
    ) {

        hideAllWorkflowActions();

        return;

    }



    /* =============================================
       ACTIVE SCHOLAR
    ============================================= */

    if (
        status === "active" ||
        status === "scholar_confirmed"
    ) {

        hideAllWorkflowActions();

        return;

    }



    /* =============================================
       CORRECTION / REJECTED
    ============================================= */

    if (
        status === "needs_correction" ||
        status === "rejected"
    ) {

        showInitialActions();

        return;

    }


    showInitialActions();

}



/* =========================================================
   SHOW INITIAL ACTIONS
========================================================= */

function showInitialActions() {

    hideAllWorkflowActions();


    if (initialActions) {

        initialActions.style.display =
            "flex";

    }

}



/* =========================================================
   SHOW EXAM SCHEDULE
========================================================= */

function showScheduleSection() {

    hideAllWorkflowActions();


    if (examScheduleSection) {

        examScheduleSection.style.display =
            "block";

    }


    if (initialActions) {

        initialActions.style.display =
            "none";

    }


    if (currentApplication) {

        examDate.value =
            currentApplication.examDate ||
            "";


        examTime.value =
            currentApplication.examTime ||
            "";


        examVenue.value =
            currentApplication.examVenue ||
            "";


        examLink.value =
            currentApplication.examLink ||
            "";

    }

}



/* =========================================================
   SHOW EXAM ACTIONS
========================================================= */

function showExamActions() {

    hideAllWorkflowActions();


    if (examActions) {

        examActions.style.display =
            "block";

    }


    if (
        currentApplication?.examResult ===
        "passed"
    ) {

        showConfirmScholar();

    }

}



/* =========================================================
   SHOW CONFIRM SCHOLAR
========================================================= */

function showConfirmScholar() {

    hideAllWorkflowActions();


    if (confirmScholarSection) {

        confirmScholarSection.style.display =
            "block";

    }

}



/* =========================================================
   HIDE ALL WORKFLOW ACTIONS
========================================================= */

function hideAllWorkflowActions() {

    if (initialActions) {

        initialActions.style.display =
            "none";

    }


    if (examScheduleSection) {

        examScheduleSection.style.display =
            "none";

    }


    if (examActions) {

        examActions.style.display =
            "none";

    }


    if (confirmScholarSection) {

        confirmScholarSection.style.display =
            "none";

    }

}



/* =========================================================
   DISABLE ALL BUTTONS
========================================================= */

function disableAllButtons() {

    const buttons =
        document.querySelectorAll(
            ".decision-btn"
        );


    buttons.forEach(
        button => {

            button.disabled =
                true;

        }
    );

}



/* =========================================================
   ENABLE ALL BUTTONS
========================================================= */

function enableAllButtons() {

    const buttons =
        document.querySelectorAll(
            ".decision-btn"
        );


    buttons.forEach(
        button => {

            button.disabled =
                false;

        }
    );

}



/* =========================================================
   UPDATE STATUS DISPLAY
========================================================= */

function updateStatusDisplay(
    status
) {

    const label =
        getStatusLabel(
            status
        );


    applicationStatus.textContent =
        label;


    const cleanStatus =
        String(
            status ||
            "submitted"
        )
        .toLowerCase()
        .replace(
            /\s+/g,
            "_"
        );


    applicationStatus.className =
        `review-status ${cleanStatus}`;


    setText(
        "summaryStatus",
        label
    );

}



/* =========================================================
   STATUS LABEL
========================================================= */

function getStatusLabel(
    status
) {

    switch (
        String(
            status ||
            ""
        )
        .toLowerCase()
        .replace(
            /\s+/g,
            "_"
        )
    ) {

        case "submitted":
        case "pending":
        case "pending_review":
        case "for_review":

            return "Pending Review";


        case "qualified":
        case "exam_qualified":

            return "Qualified for Exam";


        case "exam_scheduled":

            return "Exam Scheduled";


        case "exam_taken":

            return "Exam Taken";


        case "passed":
        case "passed_for_confirmation":

            return "Passed - For Confirmation";


        case "scholar_confirmed":

            return "Scholar Confirmed";


        case "active":

            return "Scholar Account Activated";


        case "failed":

            return "Not Selected";


        case "needs_correction":

            return "Needs Correction";


        case "rejected":

            return "Rejected";


        default:

            return status ||
                "Unknown";

    }

}



/* =========================================================
   BUILD ADDRESS
========================================================= */

function buildAddress(
    personal
) {

    const addressParts = [

        personal.completeAddress,

        personal.barangay,

        personal.municipalityCity,

        personal.province,

        personal.zipCode

    ];


    const filtered =
        addressParts.filter(
            value =>
                value !== undefined &&
                value !== null &&
                String(value).trim() !== ""
        );


    if (
        filtered.length > 0
    ) {

        return filtered.join(
            ", "
        );

    }


    return "---";

}



/* =========================================================
   REQUIREMENT NAME
========================================================= */

function formatRequirementName(
    value
) {

    return String(value)

        .replace(
            /[_-]+/g,
            " "
        )

        .replace(
            /([a-z])([A-Z])/g,
            "$1 $2"
        )

        .replace(
            /\b\w/g,
            letter =>
                letter.toUpperCase()
        );

}



/* =========================================================
   FILE NAME
========================================================= */

function getFileName(
    path
) {

    if (!path) {

        return "Uploaded file";

    }


    return String(path)
        .split("/")
        .pop();

}



/* =========================================================
   DATE FORMAT
========================================================= */

function formatDate(
    timestamp
) {

    if (!timestamp) {

        return "---";

    }


    try {

        const date =
            typeof timestamp.toDate ===
            "function"

                ? timestamp.toDate()

                : new Date(
                    timestamp
                );


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

                year:
                    "numeric",

                month:
                    "long",

                day:
                    "numeric",

                hour:
                    "numeric",

                minute:
                    "2-digit"

            }
        );

    }

    catch {

        return "---";

    }

}



/* =========================================================
   SET TEXT
========================================================= */

function setText(
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


    element.textContent =
        value === undefined ||
        value === null ||
        value === ""

            ? "---"

            : String(value);

}



/* =========================================================
   LOADING
========================================================= */

function showLoading() {

    loadingState.style.display =
        "block";


    errorState.style.display =
        "none";


    applicationContent.style.display =
        "none";

}


function hideLoading() {

    loadingState.style.display =
        "none";


    errorState.style.display =
        "none";


    applicationContent.style.display =
        "block";

}


function showError(
    message
) {

    loadingState.style.display =
        "none";


    applicationContent.style.display =
        "none";


    errorState.style.display =
        "block";


    errorMessage.textContent =
        message ||
        "Unknown error.";

}



/* =========================================================
   MOBILE SIDEBAR
========================================================= */

const menuToggle =
    document.getElementById(
        "menuToggle"
    );


const sidebar =
    document.querySelector(
        ".sidebar"
    );


if (
    menuToggle &&
    sidebar
) {

    menuToggle.addEventListener(
        "click",
        () => {

            sidebar.classList.toggle(
                "show"
            );

        }
    );

}



/* =========================================================
   NOTIFICATION BUTTON
========================================================= */

const notificationBtn =
    document.getElementById(
        "notificationBtn"
    );


if (
    notificationBtn
) {

    notificationBtn.addEventListener(
        "click",
        () => {

            window.location.href =
                "notifications.html";

        }
    );

}



/* =========================================================
   LOGOUT
========================================================= */

const logoutLink =
    document.getElementById(
        "logoutLink"
    );


if (
    logoutLink
) {

    logoutLink.addEventListener(
        "click",
        async (event) => {

            event.preventDefault();


            const confirmed =
                confirm(
                    "Are you sure you want to logout?"
                );


            if (!confirmed) {
                return;
            }


            try {

                await signOut(
                    auth
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
                    "Unable to logout."
                );

            }

        }
    );

}


console.log(
    "ScholarLink Application Review Ready."
);
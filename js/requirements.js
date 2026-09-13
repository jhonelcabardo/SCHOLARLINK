/*=========================================================
  SCHOLARLINK
  ADMIN REQUIREMENTS
  FIREBASE + SUPABASE CONNECTED
=========================================================*/

import { auth, db } from "../firebase.js";

import {
    collection,
    getDocs,
    getDoc,
    doc,
    updateDoc,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import { supabase } from "../supabase.js";


/*=========================================================
  GLOBAL VARIABLES
=========================================================*/

let applications = [];
let requirementRecords = [];

let selectedRequirement = null;


/*=========================================================
  DOM READY
=========================================================*/

document.addEventListener("DOMContentLoaded", function () {

    console.log(
        "ScholarLink Requirements Module Loaded"
    );

    setupMobileSidebar();
    setupNotifications();
    setupLogout();

});


/*=========================================================
  AUTHENTICATION
=========================================================*/

onAuthStateChanged(
    auth,
    async function (user) {

        if (!user) {

            window.location.href =
                "../index.html";

            return;
        }


        try {

            const userRef =
                doc(
                    db,
                    "users",
                    user.uid
                );


            const userSnap =
                await getDoc(
                    userRef
                );


            if (!userSnap.exists()) {

                alert(
                    "Administrator account was not found."
                );

                await signOut(auth);

                window.location.href =
                    "../index.html";

                return;
            }


            const userData =
                userSnap.data();


            if (
                userData.role !==
                "admin"
            ) {

                alert(
                    "You are not authorized to access this page."
                );

                await signOut(auth);

                window.location.href =
                    "../index.html";

                return;
            }


            console.log(
                "Admin authenticated."
            );


            await loadRequirements();


        }

        catch (error) {

            console.error(
                "Authentication error:",
                error
            );

            showTableMessage(
                "Unable to verify administrator account.",
                true
            );

        }

    }
);


/*=========================================================
  LOAD REQUIREMENTS
=========================================================*/

async function loadRequirements() {

    const tableBody =
        document.getElementById(
            "requirementsTableBody"
        );


    if (tableBody) {

        tableBody.innerHTML = `

            <tr>

                <td
                    colspan="6"
                    style="text-align:center;"
                >

                    <i class="fas fa-spinner fa-spin"></i>

                    Loading requirements...

                </td>

            </tr>

        `;

    }


    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "applications"
                )
            );


        applications = [];

        requirementRecords = [];


        snapshot.forEach(
            function (docSnapshot) {

                applications.push({

                    uid:
                        docSnapshot.id,

                    ...docSnapshot.data()

                });

            }
        );


        /*=================================================
          EXTRACT REQUIREMENTS FROM EACH APPLICATION
        =================================================*/

        applications.forEach(
            function (application) {

                extractApplicationRequirements(
                    application
                );

            }
        );


        console.log(
            "Requirement records:",
            requirementRecords
        );


        renderRequirements();

        updateRequirementStatistics();

        setupSearchAndFilter();

        renderRecentActivity();


    }

    catch (error) {

        console.error(
            "Error loading requirements:",
            error
        );


        showTableMessage(
            "Failed to load requirements from Firestore.",
            true
        );

    }

}


/*=========================================================
  EXTRACT APPLICATION REQUIREMENTS
=========================================================*/

function extractApplicationRequirements(
    application
) {

    const personal =
        application.personalInformation ||
        application.personalInfo ||
        {};


    const files =
        application.files ||
        {};


    const requirements =
        files.requirements ||
        application.requirements ||
        {};


    if (
        !requirements ||
        typeof requirements !== "object"
    ) {

        return;

    }


    const applicantId =
        application.applicantId ||
        application.applicationId ||
        personal.applicantId ||
        personal.applicationId ||
        "Not Assigned";


    const applicantName =
        application.fullName ||
        personal.fullName ||
        buildFullName(
            personal
        );


    Object.keys(
        requirements
    ).forEach(
        function (requirementKey) {

            const requirement =
                requirements[
                    requirementKey
                ];


            if (
                !requirement
            ) {

                return;

            }


            /*
             * Support both:
             *
             * requirements: {
             *    birthCertificate: {
             *       storagePath: "...",
             *       status: "pending"
             *    }
             * }
             *
             * and simple string paths.
             */

            let requirementData;


            if (
                typeof requirement ===
                "string"
            ) {

                requirementData = {

                    storagePath:
                        requirement

                };

            }

            else {

                requirementData = {
                    ...requirement
                };

            }


            requirementRecords.push({

                applicationUid:
                    application.uid,

                applicantId:
                    applicantId,

                applicantName:
                    applicantName,

                requirementKey:
                    requirementKey,

                requirement:
                    requirementData

            });

        }
    );

}


/*=========================================================
  RENDER REQUIREMENTS
=========================================================*/

function renderRequirements() {

    const tableBody =
        document.getElementById(
            "requirementsTableBody"
        );


    if (!tableBody) {

        console.error(
            "#requirementsTableBody not found."
        );

        return;

    }


    tableBody.innerHTML = "";


    if (
        requirementRecords.length ===
        0
    ) {

        tableBody.innerHTML = `

            <tr>

                <td
                    colspan="6"
                    style="text-align:center;padding:40px;"
                >

                    <i
                        class="fas fa-folder-open"
                        style="font-size:30px;margin-bottom:10px;"
                    ></i>

                    <br>

                    No uploaded requirements found.

                </td>

            </tr>

        `;

        return;

    }


    requirementRecords.forEach(
        function (record, index) {

            const requirement =
                record.requirement;


            const status =
                getRequirementStatus(
                    requirement
                );


            const submittedDate =
                formatDate(
                    requirement.submittedAt ||
                    requirement.uploadedAt ||
                    requirement.createdAt
                );


            const row =
                document.createElement(
                    "tr"
                );


            row.dataset.index =
                index;


            row.dataset.uid =
                record.applicationUid;


            row.dataset.status =
                normalizeStatus(
                    status
                );


            row.innerHTML = `

                <td>

                    ${escapeHTML(
                        record.applicantId
                    )}

                </td>


                <td>

                    ${escapeHTML(
                        record.applicantName
                    )}

                </td>


                <td>

                    ${escapeHTML(
                        formatRequirementName(
                            record.requirementKey
                        )
                    )}

                </td>


                <td>

                    ${escapeHTML(
                        submittedDate
                    )}

                </td>


                <td>

                    <span
                        class="${getStatusClass(status)}"
                    >

                        ${escapeHTML(
                            formatStatus(status)
                        )}

                    </span>

                </td>


                <td
                    class="action-buttons"
                >

                    <button
                        class="btn-view"
                        type="button"
                        data-index="${index}"
                        title="View Document"
                    >

                        <i class="fas fa-eye"></i>

                    </button>


                    <button
                        class="btn-download"
                        type="button"
                        data-index="${index}"
                        title="Download Document"
                    >

                        <i class="fas fa-download"></i>

                    </button>


                    <button
                        class="btn-verify"
                        type="button"
                        data-index="${index}"
                        title="Verify Requirement"
                    >

                        <i class="fas fa-check"></i>

                    </button>


                    <button
                        class="btn-reject"
                        type="button"
                        data-index="${index}"
                        title="Reject Requirement"
                    >

                        <i class="fas fa-times"></i>

                    </button>


                    <button
                        class="btn-resubmit"
                        type="button"
                        data-index="${index}"
                        title="Request Resubmission"
                    >

                        <i class="fas fa-rotate-right"></i>

                    </button>

                </td>

            `;


            tableBody.appendChild(
                row
            );

        }
    );


    setupRequirementButtons();

}


/*=========================================================
  REQUIREMENT STATUS
=========================================================*/

function getRequirementStatus(
    requirement
) {

    if (!requirement) {
        return "pending";
    }


    return (
        requirement.verificationStatus ||
        requirement.status ||
        "pending"
    );

}


/*=========================================================
  VIEW DOCUMENT
=========================================================*/

async function viewDocument(
    record
) {

    try {

        const path =
            getStoragePath(
                record.requirement
            );


        if (!path) {

            alert(
                "The document storage path was not found."
            );

            return;

        }


        const bucket =
            getStorageBucket(
                record.requirement
            );


        const signedUrl =
            await createSignedUrl(
                bucket,
                path
            );


        if (!signedUrl) {

            alert(
                "Unable to open the document."
            );

            return;

        }


        window.open(
            signedUrl,
            "_blank"
        );

    }

    catch (error) {

        console.error(
            "View document error:",
            error
        );


        alert(
            "Unable to open this document."
        );

    }

}


/*=========================================================
  DOWNLOAD DOCUMENT
=========================================================*/

async function downloadDocument(
    record
) {

    try {

        const path =
            getStoragePath(
                record.requirement
            );


        if (!path) {

            alert(
                "The document storage path was not found."
            );

            return;

        }


        const bucket =
            getStorageBucket(
                record.requirement
            );


        const signedUrl =
            await createSignedUrl(
                bucket,
                path
            );


        if (!signedUrl) {

            alert(
                "Unable to download the document."
            );

            return;

        }


        const link =
            document.createElement(
                "a"
            );


        link.href =
            signedUrl;


        link.target =
            "_blank";


        link.download =
            getFileName(
                path
            );


        document.body.appendChild(
            link
        );


        link.click();


        link.remove();

    }

    catch (error) {

        console.error(
            "Download document error:",
            error
        );


        alert(
            "Unable to download this document."
        );

    }

}


/*=========================================================
  CREATE SUPABASE SIGNED URL
=========================================================*/

async function createSignedUrl(bucket, path) {

    try {

        if (!path) {

            throw new Error(
                "Storage path is empty."
            );

        }


        let cleanPath =
            String(path).trim();


        /*
        =========================================
        REMOVE SUPABASE STORAGE PREFIXES
        =========================================
        */

        cleanPath =
            cleanPath.replace(
                /^\/+/,
                ""
            );


        /*
        Example:

        requirements/UID/file.jpg

        becomes:

        UID/file.jpg
        */

        if (
            cleanPath.startsWith(
                "requirements/"
            )
        ) {

            cleanPath =
                cleanPath.substring(
                    "requirements/".length
                );

        }


        /*
        =========================================
        IF FULL SUPABASE URL WAS SAVED
        =========================================
        */

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


                const markerIndex =
                    url.pathname.indexOf(
                        marker
                    );


                if (
                    markerIndex !==
                    -1
                ) {

                    let storagePart =
                        url.pathname.substring(
                            markerIndex +
                            marker.length
                        );


                    /*
                    Remove public/sign path
                    */

                    storagePart =
                        storagePart.replace(
                            /^signed\//,
                            ""
                        );


                    storagePart =
                        storagePart.replace(
                            /^public\//,
                            ""
                        );


                    storagePart =
                        storagePart.replace(
                            /^authenticated\//,
                            ""
                        );


                    /*
                    Remove bucket name
                    */

                    if (
                        storagePart.startsWith(
                            `${bucket}/`
                        )
                    ) {

                        storagePart =
                            storagePart.substring(
                                bucket.length + 1
                            );

                    }


                    cleanPath =
                        storagePart;

                }

            }

            catch (urlError) {

                console.warn(
                    "Could not parse storage URL:",
                    urlError
                );

            }

        }


        console.log(
            "Opening Supabase document:",
            {
                bucket: bucket,
                path: cleanPath
            }
        );


        /*
        =========================================
        CREATE SIGNED URL
        =========================================
        */

        const {
            data,
            error
        } =
            await supabase.storage
                .from(bucket)
                .createSignedUrl(
                    cleanPath,
                    300
                );


        if (error) {

            console.error(
                "Supabase signed URL error:",
                error
            );


            console.error(
                "Bucket:",
                bucket
            );


            console.error(
                "Path:",
                cleanPath
            );


            throw error;

        }


        if (
            !data ||
            !data.signedUrl
        ) {

            throw new Error(
                "Supabase did not return a signed URL."
            );

        }


        return data.signedUrl;

    }

    catch (error) {

        console.error(
            "createSignedUrl failed:",
            error
        );


        return null;

    }

}


/*=========================================================
  GET STORAGE PATH
=========================================================*/

function getStoragePath(requirement) {

    if (!requirement) {
        return null;
    }


    /*
    =========================================
    POSSIBLE FIRESTORE FIELD NAMES
    =========================================
    */

    const path =
        requirement.storagePath ||

        requirement.storage_path ||

        requirement.path ||

        requirement.filePath ||

        requirement.file_path ||

        requirement.url ||

        requirement.fileUrl ||

        requirement.fileURL ||

        null;


    if (!path) {

        console.error(
            "No storage path found:",
            requirement
        );

        return null;

    }


    return String(
        path
    ).trim();

}


/*=========================================================
  GET STORAGE BUCKET
=========================================================*/

function getStorageBucket(
    requirement
) {

    if (
        requirement &&
        requirement.bucket
    ) {

        return requirement.bucket;

    }


    return "requirements";

}


/*=========================================================
  GET FILE NAME
=========================================================*/

function getFileName(
    path
) {

    if (!path) {
        return "document";
    }


    const parts =
        String(
            path
        ).split("/");


    return parts[
        parts.length - 1
    ] || "document";

}


/*=========================================================
  SETUP REQUIREMENT BUTTONS
=========================================================*/

function setupRequirementButtons() {


    /*=============================================
      VIEW
    =============================================*/

    document
        .querySelectorAll(
            ".btn-view"
        )
        .forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    async function () {

                        const index =
                            Number(
                                button.dataset.index
                            );


                        const record =
                            requirementRecords[
                                index
                            ];


                        if (!record) {
                            return;
                        }


                        selectedRequirement =
                            record;


                        await viewDocument(
                            record
                        );

                    }
                );

            }
        );


    /*=============================================
      DOWNLOAD
    =============================================*/

    document
        .querySelectorAll(
            ".btn-download"
        )
        .forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    async function () {

                        const index =
                            Number(
                                button.dataset.index
                            );


                        const record =
                            requirementRecords[
                                index
                            ];


                        if (!record) {
                            return;
                        }


                        await downloadDocument(
                            record
                        );

                    }
                );

            }
        );


    /*=============================================
      VERIFY
    =============================================*/

    document
        .querySelectorAll(
            ".btn-verify"
        )
        .forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    async function () {

                        const index =
                            Number(
                                button.dataset.index
                            );


                        const record =
                            requirementRecords[
                                index
                            ];


                        if (!record) {
                            return;
                        }


                        const confirmed =
                            confirm(
                                `Verify ${formatRequirementName(
                                    record.requirementKey
                                )} for ${
                                    record.applicantName
                                }?`
                            );


                        if (!confirmed) {
                            return;
                        }


                        await updateRequirementStatus(
                            record,
                            "verified"
                        );

                    }
                );

            }
        );


    /*=============================================
      REJECT
    =============================================*/

    document
        .querySelectorAll(
            ".btn-reject"
        )
        .forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    async function () {

                        const index =
                            Number(
                                button.dataset.index
                            );


                        const record =
                            requirementRecords[
                                index
                            ];


                        if (!record) {
                            return;
                        }


                        const confirmed =
                            confirm(
                                `Reject ${formatRequirementName(
                                    record.requirementKey
                                )}?`
                            );


                        if (!confirmed) {
                            return;
                        }


                        await updateRequirementStatus(
                            record,
                            "rejected"
                        );

                    }
                );

            }
        );


    /*=============================================
      RESUBMISSION
    =============================================*/

    document
        .querySelectorAll(
            ".btn-resubmit"
        )
        .forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    async function () {

                        const index =
                            Number(
                                button.dataset.index
                            );


                        const record =
                            requirementRecords[
                                index
                            ];


                        if (!record) {
                            return;
                        }


                        const confirmed =
                            confirm(
                                `Request resubmission of ${formatRequirementName(
                                    record.requirementKey
                                )}?`
                            );


                        if (!confirmed) {
                            return;
                        }


                        await updateRequirementStatus(
                            record,
                            "resubmission"
                        );

                    }
                );

            }
        );

}


/*=========================================================
  UPDATE REQUIREMENT STATUS
=========================================================*/

async function updateRequirementStatus(
    record,
    newStatus
) {

    try {

        const applicationRef =
            doc(
                db,
                "applications",
                record.applicationUid
            );


        const applicationSnap =
            await getDoc(
                applicationRef
            );


        if (
            !applicationSnap.exists()
        ) {

            alert(
                "Application record was not found."
            );

            return;

        }


        const applicationData =
            applicationSnap.data();


        const files =
            applicationData.files ||
            {};


        const requirements =
            files.requirements ||
            applicationData.requirements ||
            {};


        const requirement =
            requirements[
                record.requirementKey
            ];


        if (
            !requirement
        ) {

            alert(
                "Requirement record was not found."
            );

            return;

        }


        const updatedRequirement = {

            ...(typeof requirement ===
                "object"
                ? requirement
                : {
                    storagePath:
                        requirement
                }
            ),

            verificationStatus:
                newStatus,

            status:
                newStatus,

            reviewedAt:
                new Date().toISOString(),

            reviewedBy:
                auth.currentUser.uid

        };


        const updatedRequirements = {

            ...requirements,

            [record.requirementKey]:
                updatedRequirement

        };


        /*=============================================
          SAVE FIRESTORE
        =============================================*/

        await updateDoc(
            applicationRef,
            {

                "files.requirements":
                    updatedRequirements,

                updatedAt:
                    serverTimestamp()

            }
        );


        /*=============================================
          CREATE APPLICANT NOTIFICATION
        =============================================*/

        let title =
            "Requirement Update";


        let message =
            "One of your submitted requirements has been updated.";


        if (
            newStatus ===
            "verified"
        ) {

            title =
                "Requirement Verified";


            message =
                `${formatRequirementName(
                    record.requirementKey
                )} has been verified successfully.`;

        }


        if (
            newStatus ===
            "rejected"
        ) {

            title =
                "Requirement Rejected";


            message =
                `${formatRequirementName(
                    record.requirementKey
                )} was rejected. Please review the administrator's remarks and submit a correct document.`;

        }


        if (
            newStatus ===
            "resubmission"
        ) {

            title =
                "Document Resubmission Required";


            message =
                `Please resubmit your ${formatRequirementName(
                    record.requirementKey
                )}. The administrator requested a corrected document.`;

        }


        try {

            await addDoc(
                collection(
                    db,
                    "notifications"
                ),
                {

                    userId:
                        record.applicationUid,

                    title:
                        title,

                    message:
                        message,

                    type:
                        "requirement",

                    requirement:
                        record.requirementKey,

                    applicationId:
                        record.applicationUid,

                    read:
                        false,

                    createdAt:
                        serverTimestamp(),

                    createdBy:
                        auth.currentUser.uid

                }
            );

        }

        catch (notificationError) {

            console.warn(
                "Notification creation failed:",
                notificationError
            );

        }


        /*=============================================
          SUCCESS MESSAGE
        =============================================*/

        if (
            newStatus ===
            "verified"
        ) {

            alert(
                "Requirement verified successfully."
            );

        }


        if (
            newStatus ===
            "rejected"
        ) {

            alert(
                "Requirement rejected and applicant notified."
            );

        }


        if (
            newStatus ===
            "resubmission"
        ) {

            alert(
                "Resubmission request sent to the applicant."
            );

        }


        await loadRequirements();

    }

    catch (error) {

        console.error(
            "Requirement update error:",
            error
        );


        alert(
            "Failed to update requirement."
        );

    }

}


/*=========================================================
  SEARCH AND FILTER
=========================================================*/

function setupSearchAndFilter() {

    const searchInput =
        document.querySelector(
            ".search-box input"
        );


    const filter =
        document.querySelector(
            ".search-section select"
        );


    if (searchInput) {

        searchInput.addEventListener(
            "input",
            applyFilters
        );

    }


    if (filter) {

        filter.addEventListener(
            "change",
            applyFilters
        );

    }

}


/*=========================================================
  APPLY FILTER
=========================================================*/

function applyFilters() {

    const searchInput =
        document.querySelector(
            ".search-box input"
        );


    const filter =
        document.querySelector(
            ".search-section select"
        );


    const keyword =
        searchInput
            ? searchInput.value
                .toLowerCase()
                .trim()
            : "";


    const selectedStatus =
        filter
            ? normalizeStatus(
                filter.value
            )
            : "all_status";


    const rows =
        document.querySelectorAll(
            "#requirementsTableBody tr"
        );


    rows.forEach(
        function (row) {

            if (
                !row.dataset.uid
            ) {

                return;

            }


            const text =
                row.innerText
                    .toLowerCase();


            const rowStatus =
                row.dataset.status ||
                "";


            const searchMatch =
                text.includes(
                    keyword
                );


            const statusMatch =
                selectedStatus ===
                "all_status"

                ||

                rowStatus ===
                selectedStatus;


            row.style.display =
                searchMatch &&
                statusMatch
                    ? ""
                    : "none";

        }
    );

}


/*=========================================================
  UPDATE STATISTICS
=========================================================*/

function updateRequirementStatistics() {

    let total = 0;

    let verified = 0;

    let pending = 0;

    let resubmission = 0;


    requirementRecords.forEach(
        function (record) {

            total++;


            const status =
                normalizeStatus(
                    getRequirementStatus(
                        record.requirement
                    )
                );


            if (
                status ===
                "verified"
            ) {

                verified++;

            }

            else if (
                status ===
                "resubmission"

                ||

                status ===
                "needs_revision"

                ||

                status ===
                "revision"

                ||

                status ===
                "rejected"
            ) {

                resubmission++;

            }

            else {

                pending++;

            }

        }
    );


    /*=============================================
      TOP SUMMARY CARDS
    =============================================*/

    setText(
        "totalDocuments",
        total
    );


    setText(
        "verifiedDocuments",
        verified
    );


    setText(
        "pendingDocuments",
        pending
    );


    setText(
        "resubmissionDocuments",
        resubmission
    );


    /*=============================================
      VERIFICATION SUMMARY
    =============================================*/

    setText(
        "summaryTotalRequirements",
        total
    );


    setText(
        "summaryVerified",
        verified
    );


    setText(
        "summaryPending",
        pending
    );


    setText(
        "summaryResubmission",
        resubmission
    );

}


/*=========================================================
  RECENT ACTIVITY
=========================================================*/

function renderRecentActivity() {

    const container =
        document.getElementById(
            "verificationActivity"
        );


    if (!container) {
        return;
    }


    const activities = [];


    requirementRecords.forEach(
        function (record) {

            const requirement =
                record.requirement;


            const status =
                getRequirementStatus(
                    requirement
                );


            const time =
                requirement.reviewedAt ||
                requirement.updatedAt ||
                requirement.submittedAt ||
                requirement.uploadedAt ||
                requirement.createdAt;


            activities.push({

                applicant:
                    record.applicantName,

                requirement:
                    formatRequirementName(
                        record.requirementKey
                    ),

                status:
                    status,

                time:
                    time

            });

        }
    );


    activities.sort(
        function (a, b) {

            return getTimestamp(
                b.time
            ) -
            getTimestamp(
                a.time
            );

        }
    );


    const latest =
        activities.slice(
            0,
            5
        );


    if (
        latest.length ===
        0
    ) {

        container.innerHTML = `

            <div class="activity-item">

                <i class="fas fa-folder-open"></i>

                <div>

                    <h4>
                        No verification activity
                    </h4>

                    <p>
                        No requirement activity available yet.
                    </p>

                </div>

            </div>

        `;

        return;

    }


    container.innerHTML = "";


    latest.forEach(
        function (activity) {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "activity-item";


            const status =
                normalizeStatus(
                    activity.status
                );


            let icon =
                "fa-clock";


            if (
                status ===
                "verified"
            ) {

                icon =
                    "fa-circle-check";

            }

            else if (
                status ===
                "rejected"
            ) {

                icon =
                    "fa-circle-xmark";

            }

            else if (
                status ===
                "resubmission"
            ) {

                icon =
                    "fa-rotate-right";

            }


            item.innerHTML = `

                <i class="fas ${icon}"></i>

                <div>

                    <h4>
                        ${escapeHTML(
                            formatRequirementName(
                                activity.requirement
                            )
                        )}
                    </h4>

                    <p>

                        ${escapeHTML(
                            activity.applicant
                        )}

                        — 

                        ${escapeHTML(
                            formatStatus(
                                activity.status
                            )
                        )}

                    </p>

                    <small>

                        ${formatRelativeTime(
                            activity.time
                        )}

                    </small>

                </div>

            `;


            container.appendChild(
                item
            );

        }
    );

}


/*=========================================================
  FORMAT REQUIREMENT NAME
=========================================================*/

function formatRequirementName(
    key
) {

    if (!key) {
        return "Requirement";
    }


    return String(key)

        .replace(
            /([a-z])([A-Z])/g,
            "$1 $2"
        )

        .replace(
            /[_-]+/g,
            " "
        )

        .replace(
            /\b\w/g,
            function (letter) {

                return letter.toUpperCase();

            }
        );

}


/*=========================================================
  BUILD FULL NAME
=========================================================*/

function buildFullName(
    data
) {

    if (!data) {
        return "---";
    }


    if (data.fullName) {
        return data.fullName;
    }


    const parts = [

        data.firstName,

        data.middleName,

        data.lastName,

        data.suffix

    ].filter(
        Boolean
    );


    return parts.length
        ? parts.join(" ")
        : "---";

}


/*=========================================================
  NORMALIZE STATUS
=========================================================*/

function normalizeStatus(
    status
) {

    return String(
        status || ""
    )
        .toLowerCase()
        .trim()
        .replace(
            /\s+/g,
            "_"
        );

}


/*=========================================================
  STATUS CLASS
=========================================================*/

function getStatusClass(
    status
) {

    const normalized =
        normalizeStatus(
            status
        );


    if (
        normalized ===
        "verified"
    ) {

        return "verified";

    }


    if (
        normalized ===
        "rejected"
    ) {

        return "rejected";

    }


    if (
        normalized ===
        "resubmission"

        ||

        normalized ===
        "needs_revision"

        ||

        normalized ===
        "revision"
    ) {

        return "rejected";

    }


    return "pending";

}


/*=========================================================
  FORMAT STATUS
=========================================================*/

function formatStatus(
    status
) {

    if (!status) {
        return "Pending";
    }


    return String(
        status
    )

        .replace(
            /_/g,
            " "
        )

        .replace(
            /\b\w/g,
            function (letter) {

                return letter.toUpperCase();

            }
        );

}


/*=========================================================
  FORMAT DATE
=========================================================*/

function formatDate(
    value
) {

    const timestamp =
        getTimestamp(
            value
        );


    if (!timestamp) {
        return "---";
    }


    return new Date(
        timestamp
    ).toLocaleDateString(
        "en-US",
        {
            month:
                "short",

            day:
                "numeric",

            year:
                "numeric"
        }
    );

}


/*=========================================================
  GET TIMESTAMP
=========================================================*/

function getTimestamp(
    value
) {

    if (!value) {
        return 0;
    }


    try {

        if (
            typeof value.toMillis ===
            "function"
        ) {

            return value.toMillis();

        }


        if (
            typeof value.toDate ===
            "function"
        ) {

            return value.toDate()
                .getTime();

        }


        if (
            value.seconds !==
            undefined
        ) {

            return Number(
                value.seconds
            ) * 1000;

        }


        const date =
            new Date(
                value
            );


        return isNaN(
            date.getTime()
        )
            ? 0
            : date.getTime();

    }

    catch {

        return 0;

    }

}


/*=========================================================
  RELATIVE TIME
=========================================================*/

function formatRelativeTime(
    value
) {

    const timestamp =
        getTimestamp(
            value
        );


    if (!timestamp) {
        return "Recently";
    }


    const difference =
        Date.now() -
        timestamp;


    const minutes =
        Math.floor(
            difference /
            60000
        );


    if (
        minutes <
        1
    ) {

        return "Just now";

    }


    if (
        minutes <
        60
    ) {

        return `${minutes} minute${
            minutes === 1
                ? ""
                : "s"
        } ago`;

    }


    const hours =
        Math.floor(
            minutes /
            60
        );


    if (
        hours <
        24
    ) {

        return `${hours} hour${
            hours === 1
                ? ""
                : "s"
        } ago`;

    }


    const days =
        Math.floor(
            hours /
            24
        );


    return `${days} day${
        days === 1
            ? ""
            : "s"
    } ago`;

}


/*=========================================================
  SET TEXT
=========================================================*/

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
            value;

    }

}


/*=========================================================
  NOTIFICATIONS
=========================================================*/

function setupNotifications() {

    const button =
        document.querySelector(
            ".notification-btn"
        );


    if (!button) {
        return;
    }


    button.addEventListener(
        "click",
        function () {

            window.location.href =
                "notifications.html";

        }
    );

}


/*=========================================================
  MOBILE SIDEBAR
=========================================================*/

function setupMobileSidebar() {

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
            function () {

                sidebar.classList.toggle(
                    "show"
                );

            }
        );

    }

}


/*=========================================================
  LOGOUT
=========================================================*/

function setupLogout() {

    const logout =
        document.querySelector(
            ".logout a"
        );


    if (!logout) {
        return;
    }


    logout.addEventListener(
        "click",
        async function (event) {

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
                    "../index.html";

            }

            catch (error) {

                console.error(
                    "Logout error:",
                    error
                );


                alert(
                    "Logout failed."
                );

            }

        }
    );

}


/*=========================================================
  TABLE MESSAGE
=========================================================*/

function showTableMessage(
    message,
    isError = false
) {

    const tableBody =
        document.getElementById(
            "requirementsTableBody"
        );


    if (!tableBody) {
        return;
    }


    tableBody.innerHTML = `

        <tr>

            <td
                colspan="6"
                style="text-align:center;padding:40px;"
            >

                <i
                    class="fas ${
                        isError
                            ? "fa-circle-exclamation"
                            : "fa-folder-open"
                    }"
                ></i>

                <br><br>

                ${escapeHTML(
                    message
                )}

            </td>

        </tr>

    `;

}


/*=========================================================
  ESCAPE HTML
=========================================================*/

function escapeHTML(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(
        value
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


/*=========================================================
  FINISHED
=========================================================*/

console.log(
    "ScholarLink Requirements Module Ready"
);
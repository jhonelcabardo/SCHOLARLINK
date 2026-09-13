// ============================================================
// SCHOLARLINK - BACKUP & RECOVERY
// SECURITY CONTROL #8
// ============================================================


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
    getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";


// ============================================================
// ELEMENTS
// ============================================================

const backupBtn =
    document.getElementById("backupBtn");

const status =
    document.getElementById("status");


// ============================================================
// COLLECTIONS TO BACKUP
// ============================================================

const collectionsToBackup = [

    "users",

    "applications",

    "scholars",

    "scholarshipPrograms",

    "notifications",

    "security_logs"

];


// ============================================================
// STATUS MESSAGE
// ============================================================

function showStatus(text) {

    if (status) {

        status.textContent = text;

    }

}


// ============================================================
// CHECK ADMIN
// ============================================================

async function checkAdmin(user) {

    if (!user) {

        return false;

    }


    const userRef =
        doc(
            db,
            "users",
            user.uid
        );


    const userSnapshot =
        await getDoc(userRef);


    if (!userSnapshot.exists()) {

        return false;

    }


    const userData =
        userSnapshot.data();


    return userData.role === "admin";

}


// ============================================================
// GET FIRESTORE COLLECTION
// ============================================================

async function getCollectionData(
    collectionName
) {

    const snapshot =
        await getDocs(
            collection(
                db,
                collectionName
            )
        );


    const data = [];


    snapshot.forEach((document) => {

        data.push({

            id:
                document.id,

            ...document.data()

        });

    });


    return data;

}


// ============================================================
// CONVERT FIRESTORE TIMESTAMP
// ============================================================

function cleanData(data) {

    if (
        data === null ||
        data === undefined
    ) {

        return data;

    }


    if (
        typeof data === "object" &&
        typeof data.toDate === "function"
    ) {

        return data
            .toDate()
            .toISOString();

    }


    if (Array.isArray(data)) {

        return data.map(
            item =>
                cleanData(item)
        );

    }


    if (typeof data === "object") {

        const result = {};


        for (
            const key in data
        ) {

            result[key] =
                cleanData(
                    data[key]
                );

        }


        return result;

    }


    return data;

}


// ============================================================
// CREATE BACKUP
// ============================================================

async function createBackup() {

    try {

        const user =
            auth.currentUser;


        if (!user) {

            showStatus(
                "❌ You must be logged in."
            );

            return;

        }


        // ====================================================
        // CHECK ADMIN
        // ====================================================

        const isAdmin =
            await checkAdmin(user);


        if (!isAdmin) {

            showStatus(
                "❌ Access denied. Admin only."
            );

            return;

        }


        backupBtn.disabled =
            true;


        showStatus(
            "Creating backup..."
        );


        // ====================================================
        // BACKUP INFORMATION
        // ====================================================

        const backup = {

            system:
                "SCHOLARLINK",

            backupType:
                "Manual Admin Backup",

            version:
                "1.0",

            createdAt:
                new Date().toISOString(),

            createdBy:
                user.uid,

            recoverySupported:
                true,

            collections: {}

        };


        // ====================================================
        // BACKUP EACH COLLECTION
        // ====================================================

        for (
            const collectionName
            of collectionsToBackup
        ) {

            showStatus(
                `Backing up ${collectionName}...`
            );


            const data =
                await getCollectionData(
                    collectionName
                );


            backup.collections[
                collectionName
            ] =
                cleanData(data);

        }


        // ====================================================
        // CREATE JSON
        // ====================================================

        const json =
            JSON.stringify(
                backup,
                null,
                2
            );


        const blob =
            new Blob(
                [json],
                {
                    type:
                        "application/json"
                }
            );


        const url =
            URL.createObjectURL(
                blob
            );


        const link =
            document.createElement(
                "a"
            );


        const date =
            new Date()
                .toISOString()
                .replace(
                    /[:.]/g,
                    "-"
                );


        link.href =
            url;


        link.download =
            `scholarlink-backup-${date}.json`;


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


        // ====================================================
        // SUCCESS
        // ====================================================

        showStatus(
            "✅ Backup successfully created and downloaded."
        );


        console.log(
            "SCHOLARLINK backup created successfully."
        );


    } catch (error) {

        console.error(
            "Backup Error:",
            error
        );


        showStatus(
            "❌ Backup failed: " +
            error.message
        );


    } finally {

        backupBtn.disabled =
            false;

    }

}


// ============================================================
// RECOVERY SECTION
// ============================================================

function createRecoveryInterface() {

    // Do not create duplicate interface.
    if (
        document.getElementById(
            "recoverySection"
        )
    ) {

        return;

    }


    const recoverySection =
        document.createElement(
            "div"
        );


    recoverySection.id =
        "recoverySection";


    recoverySection.style.marginTop =
        "30px";

    recoverySection.style.padding =
        "25px";

    recoverySection.style.border =
        "1px solid #e5e7eb";

    recoverySection.style.borderRadius =
        "12px";

    recoverySection.style.background =
        "#f8fafc";


    recoverySection.innerHTML = `

        <h2 style="margin-bottom:10px;">
            🔄 Recovery Verification
        </h2>

        <p style="color:#64748b; margin-bottom:15px;">
            Select a SCHOLARLINK backup JSON file to verify
            that the backup contains recoverable system data.
        </p>

        <input
            type="file"
            id="recoveryFile"
            accept=".json,application/json"
            style="margin-bottom:15px;"
        >

        <button
            id="verifyRecoveryBtn"
            type="button"
            style="
                background:#16a34a;
                color:white;
                border:none;
                padding:12px 18px;
                border-radius:8px;
                cursor:pointer;
                font-size:14px;
            "
        >
            Verify Backup
        </button>

        <div
            id="recoveryResult"
            style="
                margin-top:18px;
                padding:15px;
                border-radius:8px;
                background:white;
                color:#334155;
                display:none;
            "
        ></div>

        <div
            style="
                margin-top:20px;
                padding:15px;
                background:#fff7ed;
                border-left:4px solid #f97316;
                border-radius:6px;
            "
        >

            <strong>
                Recovery Procedure
            </strong>

            <ol style="
                margin-top:10px;
                padding-left:20px;
                line-height:1.7;
            ">

                <li>
                    Select the latest SCHOLARLINK backup JSON file.
                </li>

                <li>
                    Click "Verify Backup" to check the backup contents.
                </li>

                <li>
                    Confirm that the required collections and records
                    are present.
                </li>

                <li>
                    Keep the verified backup file in the
                    SCHOLARLINK_BACKUPS/Firestore folder.
                </li>

                <li>
                    If data recovery is required, the administrator
                    can use the verified backup as the recovery source
                    through the authorized database recovery process.
                </li>

                <li>
                    Applicant photos and requirements are maintained
                    separately in the Supabase storage backup folders.
                </li>

            </ol>

        </div>

    `;


    // Add after the existing status element.
    if (status) {

        status.parentNode.appendChild(
            recoverySection
        );

    } else {

        document.body.appendChild(
            recoverySection
        );

    }


    const recoveryFile =
        document.getElementById(
            "recoveryFile"
        );


    const verifyRecoveryBtn =
        document.getElementById(
            "verifyRecoveryBtn"
        );


    const recoveryResult =
        document.getElementById(
            "recoveryResult"
        );


    // ========================================================
    // VERIFY RECOVERY FILE
    // ========================================================

    verifyRecoveryBtn.addEventListener(
        "click",
        async function () {

            try {

                if (
                    !recoveryFile.files ||
                    recoveryFile.files.length === 0
                ) {

                    recoveryResult.style.display =
                        "block";


                    recoveryResult.innerHTML =
                        "❌ Please select a backup JSON file.";


                    return;

                }


                const file =
                    recoveryFile.files[0];


                // Check file extension.
                if (
                    !file.name
                        .toLowerCase()
                        .endsWith(".json")
                ) {

                    recoveryResult.style.display =
                        "block";


                    recoveryResult.innerHTML =
                        "❌ Invalid file. Please select a JSON backup file.";


                    return;

                }


                const text =
                    await file.text();


                let backup;


                try {

                    backup =
                        JSON.parse(text);

                } catch (error) {

                    recoveryResult.style.display =
                        "block";


                    recoveryResult.innerHTML =
                        "❌ The selected file is not valid JSON.";


                    return;

                }


                // =================================================
                // VALIDATE BACKUP STRUCTURE
                // =================================================

                if (
                    !backup ||
                    backup.system !== "SCHOLARLINK" ||
                    !backup.collections
                ) {

                    recoveryResult.style.display =
                        "block";


                    recoveryResult.innerHTML = `
                        ❌ Invalid SCHOLARLINK backup.<br><br>
                        The required backup structure was not found.
                    `;


                    return;

                }


                // =================================================
                // COUNT RECORDS
                // =================================================

                let totalRecords =
                    0;


                let collectionResults =
                    "";


                for (
                    const collectionName
                    of collectionsToBackup
                ) {

                    const records =
                        Array.isArray(
                            backup.collections[
                                collectionName
                            ]
                        )
                            ? backup.collections[
                                collectionName
                            ]
                            : [];


                    totalRecords +=
                        records.length;


                    collectionResults += `
                        <li>
                            <strong>
                                ${collectionName}
                            </strong>:
                            ${records.length} record(s)
                        </li>
                    `;

                }


                // =================================================
                // SHOW RECOVERY RESULT
                // =================================================

                recoveryResult.style.display =
                    "block";


                recoveryResult.innerHTML = `

                    <h3 style="color:#15803d;">
                        ✅ Backup Verified
                    </h3>

                    <p>
                        <strong>System:</strong>
                        ${backup.system}
                    </p>

                    <p>
                        <strong>Backup Type:</strong>
                        ${backup.backupType || "Not specified"}
                    </p>

                    <p>
                        <strong>Created:</strong>
                        ${backup.createdAt || "Not specified"}
                    </p>

                    <p>
                        <strong>Total Records:</strong>
                        ${totalRecords}
                    </p>

                    <h4 style="margin-top:15px;">
                        Available Data:
                    </h4>

                    <ul style="
                        line-height:1.7;
                        padding-left:20px;
                    ">

                        ${collectionResults}

                    </ul>

                    <p style="
                        margin-top:15px;
                        color:#166534;
                    ">

                        The backup file is structurally valid
                        and contains data that can be used as
                        a recovery source.

                    </p>

                `;


                console.log(
                    "Backup recovery verification successful."
                );


            } catch (error) {

                console.error(
                    "Recovery Verification Error:",
                    error
                );


                recoveryResult.style.display =
                    "block";


                recoveryResult.innerHTML =
                    "❌ Recovery verification failed: " +
                    error.message;

            }

        }
    );

}


// ============================================================
// BUTTON - CREATE BACKUP
// ============================================================

if (backupBtn) {

    backupBtn.addEventListener(
        "click",
        createBackup
    );

}


// ============================================================
// AUTH CHECK
// ============================================================

onAuthStateChanged(
    auth,
    async (user) => {

        if (!user) {

            showStatus(
                "❌ Please login as administrator."
            );


            if (backupBtn) {

                backupBtn.disabled =
                    true;

            }


            return;

        }


        try {

            const isAdmin =
                await checkAdmin(user);


            if (!isAdmin) {

                showStatus(
                    "❌ Access denied. Administrator only."
                );


                if (backupBtn) {

                    backupBtn.disabled =
                        true;

                }


                return;

            }


            showStatus(
                "✅ Administrator verified. Ready to create backup."
            );


            // =================================================
            // ENABLE RECOVERY VERIFICATION
            // =================================================

            createRecoveryInterface();


        } catch (error) {

            console.error(
                "Admin verification error:",
                error
            );


            showStatus(
                "❌ Unable to verify administrator."
            );


            if (backupBtn) {

                backupBtn.disabled =
                    true;

            }

        }

    }
);
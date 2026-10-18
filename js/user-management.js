/* =========================================================
   SCHOLARLINK
   USER MANAGEMENT
   FIREBASE AUTH + FIRESTORE
   DYNAMIC VERSION
========================================================= */

import {
    auth,
    db
} from "../firebase.js";


import {
    onAuthStateChanged,
    signOut,
    sendPasswordResetEmail,
    createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";


import {
    collection,
    getDocs,
    getDoc,
    doc,
    updateDoc,
    setDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";


/* =========================================================
   GLOBAL DATA
========================================================= */

let currentAdmin = null;
let currentAdminData = {};

let allUsers = [];
let allScholars = [];
let allApplications = [];
let allLogs = [];
let allNotifications = [];

let selectedUser = null;


/* =========================================================
   DOM READY
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        setupSidebar();

        setupFilters();

        setupButtons();

        setupModals();

        console.log(
            "ScholarLink User Management Ready"
        );

    }
);


/* =========================================================
   AUTHENTICATION
========================================================= */

onAuthStateChanged(
    auth,
    async function (user) {

        if (!user) {

            window.location.href =
                "../login/index.html";

            return;

        }


        currentAdmin = user;


        try {

            await verifyAdministrator();

            await loadAllData();

        }

        catch (error) {

            console.error(
                "User Management Error:",
                error
            );

            showToast(
                "Unable to load user management data.",
                "error"
            );

        }

    }
);


/* =========================================================
   VERIFY ADMIN
========================================================= */

async function verifyAdministrator() {

    const userRef =
        doc(
            db,
            "users",
            currentAdmin.uid
        );


    const userSnap =
        await getDoc(
            userRef
        );


    if (!userSnap.exists()) {

        await signOut(auth);

        window.location.href =
            "../login/index.html";

        return;

    }


    currentAdminData =
        userSnap.data();


    if (
        String(
            currentAdminData.role || ""
        ).toLowerCase() !== "admin"
    ) {

        alert(
            "Unauthorized access."
        );

        await signOut(auth);

        window.location.href =
            "../login/index.html";

        return;

    }


    document.getElementById(
        "adminName"
    ).textContent =
        getUserDisplayName(
            currentAdminData
        );

}


/* =========================================================
   LOAD EVERYTHING
========================================================= */

async function loadAllData() {

    showTableLoading();


    await Promise.all([
        loadUsers(),
        loadScholars(),
        loadApplications(),
        loadSecurityLogs(),
        loadNotifications()
    ]);


    enrichUsers();


    updateSummaryCards();


    renderUsers(
        getFilteredUsers()
    );


    updateNotificationBadge();

}


/* =========================================================
   LOAD USERS
========================================================= */

async function loadUsers() {

    const snapshot =
        await getDocs(
            collection(
                db,
                "users"
            )
        );


    allUsers = [];


    snapshot.forEach(
        function (item) {

            allUsers.push({

                uid:
                    item.id,

                ...item.data()

            });

        }
    );


    console.log(
        "Users loaded:",
        allUsers
    );

}


/* =========================================================
   LOAD SCHOLARS
========================================================= */

async function loadScholars() {

    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "scholars"
                )
            );


        allScholars = [];


        snapshot.forEach(
            function (item) {

                allScholars.push({

                    uid:
                        item.id,

                    ...item.data()

                });

            }
        );

    }

    catch (error) {

        console.warn(
            "Unable to load scholars:",
            error
        );

        allScholars = [];

    }

}


/* =========================================================
   LOAD APPLICATIONS
========================================================= */

async function loadApplications() {

    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "applications"
                )
            );


        allApplications = [];


        snapshot.forEach(
            function (item) {

                allApplications.push({

                    uid:
                        item.id,

                    ...item.data()

                });

            }
        );

    }

    catch (error) {

        console.warn(
            "Unable to load applications:",
            error
        );

        allApplications = [];

    }

}


/* =========================================================
   LOAD SECURITY LOGS
========================================================= */

async function loadSecurityLogs() {

    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "security_logs"
                )
            );


        allLogs = [];


        snapshot.forEach(
            function (item) {

                allLogs.push({

                    id:
                        item.id,

                    ...item.data()

                });

            }
        );


        allLogs.sort(
            function (a, b) {

                return getTimestamp(
                    b.createdAt
                ) -
                getTimestamp(
                    a.createdAt
                );

            }
        );

    }

    catch (error) {

        console.warn(
            "Unable to load security logs:",
            error
        );

        allLogs = [];

    }

}


/* =========================================================
   LOAD NOTIFICATIONS
========================================================= */

async function loadNotifications() {

    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "notifications"
                )
            );


        allNotifications = [];


        snapshot.forEach(
            function (item) {

                allNotifications.push({

                    id:
                        item.id,

                    ...item.data()

                });

            }
        );

    }

    catch (error) {

        console.warn(
            "Unable to load notifications:",
            error
        );

        allNotifications = [];

    }

}


/* =========================================================
   ENRICH USERS
========================================================= */

function enrichUsers() {

    allUsers =
        allUsers.map(
            function (user) {

                const scholar =
                    allScholars.find(
                        function (item) {

                            return item.uid === user.uid;

                        }
                    );


                const application =
                    allApplications.find(
                        function (item) {

                            return item.uid === user.uid;

                        }
                    );


                return {

                    ...user,

                    scholarData:
                        scholar || null,

                    applicationData:
                        application || null

                };

            }
        );

}


/* =========================================================
   SUMMARY CARDS
========================================================= */

function updateSummaryCards() {

    const total =
        allUsers.length;


    const admins =
        allUsers.filter(
            function (user) {

                return normalizeRole(
                    user.role
                ) === "admin";

            }
        ).length;


    const applicants =
        allUsers.filter(
            function (user) {

                return normalizeRole(
                    user.role
                ) === "applicant";

            }
        ).length;


    const scholars =
        allUsers.filter(
            function (user) {

                return normalizeRole(
                    user.role
                ) === "scholar";

            }
        ).length;


    const active =
        allUsers.filter(
            function (user) {

                return normalizeStatus(
                    user.status
                ) === "active";

            }
        ).length;


    const inactive =
        allUsers.filter(
            function (user) {

                return normalizeStatus(
                    user.status
                ) === "inactive";

            }
        ).length;


    const suspended =
        allUsers.filter(
            function (user) {

                return normalizeStatus(
                    user.status
                ) === "suspended";

            }
        ).length;


    const today =
        countTodayLogins();


    setText(
        "totalUsers",
        total
    );

    setText(
        "totalAdmins",
        admins
    );

    setText(
        "totalApplicants",
        applicants
    );

    setText(
        "totalScholars",
        scholars
    );

    setText(
        "activeUsers",
        active
    );

    setText(
        "inactiveUsers",
        inactive
    );

    setText(
        "suspendedUsers",
        suspended
    );

    setText(
        "todayLogins",
        today
    );

}


/* =========================================================
   TODAY LOGIN COUNT
========================================================= */

function countTodayLogins() {

    const start =
        new Date();

    start.setHours(
        0,
        0,
        0,
        0
    );


    return allLogs.filter(
        function (log) {

            const type =
                String(
                    log.type ||
                    log.action ||
                    log.event ||
                    ""
                ).toLowerCase();


            if (
                !type.includes("login")
            ) {

                return false;

            }


            const time =
                getTimestamp(
                    log.createdAt ||
                    log.timestamp
                );


            return (
                time >= start.getTime()
            );

        }
    ).length;

}


/* =========================================================
   RENDER USERS
========================================================= */

function renderUsers(
    users
) {

    const tbody =
        document.getElementById(
            "usersTableBody"
        );


    tbody.innerHTML = "";


    if (
        !users.length
    ) {

        tbody.innerHTML = `

            <tr>

                <td
                    colspan="8"
                    class="empty-row"
                >

                    <i class="fas fa-users-slash"></i>

                    <h3>
                        No users found
                    </h3>

                    <p>
                        No account matches your current search or filters.
                    </p>

                </td>

            </tr>

        `;


        setText(
            "displayedCount",
            0
        );

        return;

    }


    users.forEach(
        function (user) {

            tbody.appendChild(
                createUserRow(user)
            );

        }
    );


    setText(
        "displayedCount",
        users.length
    );


    attachRowActions();

}


/* =========================================================
   CREATE USER ROW
========================================================= */

function createUserRow(
    user
) {

    const tr =
        document.createElement(
            "tr"
        );


    const role =
        normalizeRole(
            user.role
        );


    const status =
        normalizeStatus(
            user.status
        );


    const displayName =
        getUserDisplayName(
            user
        );


    const email =
        user.email ||
        "";


    const humanId =
        getHumanUserId(
            user
        );


    const loginMethod =
        getLoginMethod(
            user
        );


    const lastLogin =
        getLastLogin(
            user
        );


    const image =
        getUserImage(
            user
        );


    const roleClass =
        getRoleClass(
            role
        );


    const statusClass =
        getStatusClass(
            status
        );


    const actionButton =
        status === "suspended"
            ? `
                <button
                    class="btn-enable"
                    data-action="enable"
                    data-uid="${escapeHtml(user.uid)}"
                    title="Activate"
                >
                    <i class="fas fa-lock-open"></i>
                </button>
              `
            : `
                <button
                    class="btn-disable"
                    data-action="disable"
                    data-uid="${escapeHtml(user.uid)}"
                    title="Suspend"
                >
                    <i class="fas fa-lock"></i>
                </button>
              `;


    tr.innerHTML = `

        <td>

            <strong>
                ${escapeHtml(humanId)}
            </strong>

        </td>


        <td>

            <div class="user-info">

                <img
                    src="${escapeHtml(image)}"
                    alt="User"
                    onerror="this.src='../images/admin.png'"
                >

                <div>

                    <h4>
                        ${escapeHtml(displayName)}
                    </h4>

                    <span>
                        ${escapeHtml(
                            getRoleLabel(role)
                        )}
                    </span>

                </div>

            </div>

        </td>


        <td>

            ${escapeHtml(email || "No email")}

        </td>


        <td>

            <span class="${roleClass}">

                ${escapeHtml(
                    getRoleLabel(role)
                )}

            </span>

        </td>


        <td>

            <span class="${statusClass}">

                ${escapeHtml(
                    getStatusLabel(status)
                )}

            </span>

        </td>


        <td>

            ${escapeHtml(loginMethod)}

        </td>


        <td>

            ${escapeHtml(lastLogin)}

        </td>


        <td>

            <div class="table-actions">

                <button
                    class="btn-view"
                    data-action="view"
                    data-uid="${escapeHtml(user.uid)}"
                    title="View"
                >

                    <i class="fas fa-eye"></i>

                </button>


                <button
                    class="btn-edit"
                    data-action="edit"
                    data-uid="${escapeHtml(user.uid)}"
                    title="Edit"
                >

                    <i class="fas fa-pen"></i>

                </button>


                <button
                    class="btn-reset"
                    data-action="reset"
                    data-uid="${escapeHtml(user.uid)}"
                    title="Send Password Reset"
                >

                    <i class="fas fa-key"></i>

                </button>


                ${actionButton}

            </div>

        </td>

    `;


    return tr;

}


/* =========================================================
   ROW ACTIONS
========================================================= */

function attachRowActions() {

    document
        .querySelectorAll(
            "[data-action]"
        )
        .forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    async function () {

                        const uid =
                            this.dataset.uid;

                        const action =
                            this.dataset.action;


                        const user =
                            allUsers.find(
                                function (item) {

                                    return item.uid === uid;

                                }
                            );


                        if (!user) {

                            return;

                        }


                        if (
                            action === "view"
                        ) {

                            selectUser(
                                user
                            );

                        }


                        if (
                            action === "edit"
                        ) {

                            openEditModal(
                                user
                            );

                        }


                        if (
                            action === "reset"
                        ) {

                            await sendResetEmail(
                                user
                            );

                        }


                        if (
                            action === "disable"
                        ) {

                            await changeUserStatus(
                                user,
                                "suspended"
                            );

                        }


                        if (
                            action === "enable"
                        ) {

                            await changeUserStatus(
                                user,
                                "active"
                            );

                        }

                    }
                );

            }
        );

}


/* =========================================================
   SELECT USER
========================================================= */

async function selectUser(
    user
) {

    selectedUser =
        user;


    renderUserDetails(
        user
    );


    await renderLoginHistory(
        user
    );

}


/* =========================================================
   RENDER DETAILS
========================================================= */

function renderUserDetails(
    user
) {

    const role =
        normalizeRole(
            user.role
        );


    const status =
        normalizeStatus(
            user.status
        );


    const name =
        getUserDisplayName(
            user
        );


    const humanId =
        getHumanUserId(
            user
        );


    setText(
        "detailName",
        name
    );


    setText(
        "detailUserId",
        `User ID : ${humanId}`
    );


    setText(
        "detailFullName",
        name
    );


    setText(
        "detailEmail",
        user.email || "—"
    );


    setText(
        "detailContact",
        getContact(
            user
        )
    );


    setText(
        "detailAddress",
        getAddress(
            user
        )
    );


    setText(
        "detailCreated",
        formatDate(
            user.createdAt ||
            user.accountCreatedAt
        )
    );


    const roleElement =
        document.getElementById(
            "detailRole"
        );


    roleElement.innerHTML = `

        <span class="${getRoleClass(role)}">

            ${escapeHtml(
                getRoleLabel(role)
            )}

        </span>

    `;


    const statusElement =
        document.getElementById(
            "detailStatus"
        );


    statusElement.innerHTML = `

        <span class="${getStatusClass(status)}">

            ${escapeHtml(
                getStatusLabel(status)
            )}

        </span>

    `;


    document.getElementById(
        "detailProfileImage"
    ).src =
        getUserImage(
            user
        );


    setText(
        "accountUsername",
        user.username ||
        user.userName ||
        user.email ||
        "—"
    );


    setText(
        "accountEmail",
        user.email ||
        "—"
    );


    setText(
        "accountRole",
        getRoleLabel(role)
    );


    document.getElementById(
        "accountStatus"
    ).innerHTML = `

        <span class="${getStatusClass(status)}">

            ${escapeHtml(
                getStatusLabel(status)
            )}

        </span>

    `;


    setText(
        "passwordChanged",
        formatDate(
            user.passwordChangedAt
        )
    );


    setText(
        "twoFactor",
        user.twoFactorEnabled === true
            ? "Enabled"
            : "Not Enabled"
    );


    renderPermissions(
        role
    );


    renderQrInformation(
        user
    );


    renderActivity(
        user
    );


    document.getElementById(
        "adminNotes"
    ).value =
        user.adminNotes ||
        "";

}


/* =========================================================
   LOGIN HISTORY
========================================================= */

async function renderLoginHistory(
    user
) {

    const tbody =
        document.getElementById(
            "loginHistoryBody"
        );


    const logs =
        allLogs
            .filter(
                function (log) {

                    return (
                        log.uid === user.uid ||
                        log.userId === user.uid ||
                        log.actorUid === user.uid
                    );

                }
            )
            .slice(
                0,
                10
            );


    tbody.innerHTML = "";


    if (
        !logs.length
    ) {

        tbody.innerHTML = `

            <tr>

                <td colspan="3">

                    No login history recorded.

                </td>

            </tr>

        `;

        return;

    }


    logs.forEach(
        function (log) {

            const tr =
                document.createElement(
                    "tr"
                );


            const method =
                log.method ||
                log.loginMethod ||
                "Password";


            const success =
                log.success !== false &&
                !String(
                    log.status || ""
                ).toLowerCase().includes(
                    "fail"
                );


            tr.innerHTML = `

                <td>

                    ${escapeHtml(
                        formatDateTime(
                            log.createdAt ||
                            log.timestamp
                        )
                    )}

                </td>


                <td>

                    ${escapeHtml(
                        method
                    )}

                </td>


                <td>

                    <span class="${
                        success
                            ? "badge-success"
                            : "badge-warning"
                    }">

                        ${
                            success
                                ? "Success"
                                : "Failed Attempt"
                        }

                    </span>

                </td>

            `;


            tbody.appendChild(
                tr
            );

        }
    );

}


/* =========================================================
   PERMISSIONS
========================================================= */

function renderPermissions(
    role
) {

    const list =
        document.getElementById(
            "permissionsList"
        );


    let permissions = [];


    if (
        role === "admin"
    ) {

        permissions = [

            "Dashboard Access",
            "Applicants",
            "Applications",
            "Scholars",
            "Requirements",
            "Announcements",
            "Notification Management",
            "Monitoring Scholars",
            "User Management",
            "Document Verification",
            "Grade & COR Verification",
            "Reports",
            "Settings"

        ];

    }


    else if (
        role === "scholar"
    ) {

        permissions = [

            "Scholar Dashboard",
            "View Scholarship Status",
            "Submit COR",
            "Submit Grades",
            "View Notifications",
            "View Announcements",
            "QR Login"

        ];

    }


    else {

        permissions = [

            "Applicant Dashboard",
            "Submit Scholarship Application",
            "Upload Requirements",
            "View Application Status",
            "View Notifications",
            "View Announcements"

        ];

    }


    list.innerHTML =
        permissions
            .map(
                function (permission) {

                    return `

                        <li>
                            <i class="fas fa-circle-check"></i>
                            ${escapeHtml(permission)}
                        </li>

                    `;

                }
            )
            .join("");

}


/* =========================================================
   QR INFORMATION
========================================================= */

function renderQrInformation(
    user
) {

    const scholar =
        user.scholarData;


    if (
        !scholar ||
        normalizeRole(
            user.role
        ) !== "scholar"
    ) {

        setText(
            "qrStatus",
            "Not Available"
        );

        setText(
            "lastQrLogin",
            "—"
        );

        setText(
            "totalQrLogins",
            "—"
        );

        return;

    }


    const qrToken =
        scholar.qrToken;


    setText(
        "qrStatus",
        scholar.status === "active" &&
        qrToken
            ? "Active"
            : "Inactive"
    );


    const qrLogs =
        allLogs.filter(
            function (log) {

                return (
                    (
                        log.uid === user.uid ||
                        log.userId === user.uid
                    ) &&
                    String(
                        log.method ||
                        log.loginMethod ||
                        ""
                    ).toLowerCase()
                    .includes("qr")
                );

            }
        );


    setText(
        "lastQrLogin",
        qrLogs.length
            ? formatDateTime(
                qrLogs[0].createdAt ||
                qrLogs[0].timestamp
              )
            : "No QR login recorded"
    );


    setText(
        "totalQrLogins",
        qrLogs.length
    );

}


/* =========================================================
   ACTIVITY
========================================================= */

function renderActivity(
    user
) {

    const list =
        document.getElementById(
            "activityList"
        );


    const activities = [];


    if (
        user.lastLogin
    ) {

        activities.push(
            "Logged in successfully"
        );

    }


    if (
        user.updatedAt
    ) {

        activities.push(
            "Account information updated"
        );

    }


    if (
        user.applicationData
    ) {

        activities.push(
            "Has a scholarship application"
        );

    }


    if (
        user.scholarData
    ) {

        activities.push(
            "Confirmed as Scholar"
        );

    }


    const notificationCount =
        allNotifications.filter(
            function (notification) {

                return (
                    notification.recipientUid ===
                    user.uid
                );

            }
        ).length;


    if (
        notificationCount > 0
    ) {

        activities.push(
            `${notificationCount} notification(s) received`
        );

    }


    if (
        !activities.length
    ) {

        activities.push(
            "No activity recorded"
        );

    }


    list.innerHTML =
        activities
            .map(
                function (activity) {

                    return `

                        <li>

                            <i class="fas fa-circle-check"></i>

                            ${escapeHtml(activity)}

                        </li>

                    `;

                }
            )
            .join("");

}


/* =========================================================
   FILTERS
========================================================= */

function setupFilters() {

    document
        .getElementById(
            "searchInput"
        )
        .addEventListener(
            "input",
            refreshUserTable
        );


    document
        .getElementById(
            "roleFilter"
        )
        .addEventListener(
            "change",
            refreshUserTable
        );


    document
        .getElementById(
            "statusFilter"
        )
        .addEventListener(
            "change",
            refreshUserTable
        );

}


function refreshUserTable() {

    renderUsers(
        getFilteredUsers()
    );

}


function getFilteredUsers() {

    const search =
        String(
            document.getElementById(
                "searchInput"
            ).value
        )
        .trim()
        .toLowerCase();


    const role =
        document.getElementById(
            "roleFilter"
        ).value;


    const status =
        document.getElementById(
            "statusFilter"
        ).value;


    return allUsers.filter(
        function (user) {

            const name =
                getUserDisplayName(
                    user
                ).toLowerCase();


            const email =
                String(
                    user.email || ""
                ).toLowerCase();


            const id =
                getHumanUserId(
                    user
                ).toLowerCase();


            const matchesSearch =
                !search ||
                name.includes(search) ||
                email.includes(search) ||
                id.includes(search);


            const matchesRole =
                role === "all" ||
                normalizeRole(
                    user.role
                ) === role;


            const matchesStatus =
                status === "all" ||
                normalizeStatus(
                    user.status
                ) === status;


            return (
                matchesSearch &&
                matchesRole &&
                matchesStatus
            );

        }
    );

}


/* =========================================================
   ADD USER
========================================================= */

async function createUser(
    event
) {

    event.preventDefault();


    const name =
        document.getElementById(
            "newUserName"
        ).value.trim();


    const email =
        document.getElementById(
            "newUserEmail"
        ).value.trim();


    const password =
        document.getElementById(
            "newUserPassword"
        ).value;


    const role =
        document.getElementById(
            "newUserRole"
        ).value;


    if (
        !name ||
        !email ||
        !password
    ) {

        showToast(
            "Please complete all fields.",
            "error"
        );

        return;

    }


    if (
        password.length < 6
    ) {

        showToast(
            "Password must contain at least 6 characters.",
            "error"
        );

        return;

    }


    try {

        /*
         * IMPORTANT:
         * Creating another Firebase Auth account with the
         * same auth instance signs the admin out.
         *
         * Therefore this function is intentionally blocked
         * unless your project uses a backend/secondary Firebase
         * app for administrator account creation.
         */

        showToast(
            "For security, new Firebase Auth accounts should be created through your admin backend.",
            "error"
        );

        console.warn(
            "Admin account creation requires Firebase Admin SDK or secondary Firebase app."
        );

        return;

    }

    catch (error) {

        console.error(
            "Create user error:",
            error
        );

        showToast(
            getFirebaseErrorMessage(error),
            "error"
        );

    }

}


/* =========================================================
   EDIT USER
========================================================= */

async function saveEditedUser(
    event
) {

    event.preventDefault();


    const uid =
        document.getElementById(
            "editUserUid"
        ).value;


    if (!uid) {

        return;

    }


    const name =
        document.getElementById(
            "editUserName"
        ).value.trim();


    const contact =
        document.getElementById(
            "editUserContact"
        ).value.trim();


    const address =
        document.getElementById(
            "editUserAddress"
        ).value.trim();


    const role =
        document.getElementById(
            "editUserRole"
        ).value;


    const status =
        document.getElementById(
            "editUserStatus"
        ).value;


    try {

        await updateDoc(
            doc(
                db,
                "users",
                uid
            ),
            {

                fullName:
                    name,

                name:
                    name,

                contactNumber:
                    contact,

                address:
                    address,

                role:
                    role,

                status:
                    status,

                updatedAt:
                    serverTimestamp(),

                updatedBy:
                    currentAdmin.uid

            }
        );


        showToast(
            "User information updated successfully.",
            "success"
        );


        closeModal(
            "editUserModal"
        );


        await loadAllData();


        const updated =
            allUsers.find(
                function (item) {

                    return item.uid === uid;

                }
            );


        if (
            updated
        ) {

            selectUser(
                updated
            );

        }

    }

    catch (error) {

        console.error(
            "Edit user error:",
            error
        );

        showToast(
            getFirebaseErrorMessage(error),
            "error"
        );

    }

}


/* =========================================================
   OPEN EDIT
========================================================= */

function openEditModal(
    user
) {

    selectedUser =
        user;


    document.getElementById(
        "editUserUid"
    ).value =
        user.uid;


    document.getElementById(
        "editUserName"
    ).value =
        getUserDisplayName(
            user
        );


    document.getElementById(
        "editUserContact"
    ).value =
        getContact(
            user
        ) === "—"
            ? ""
            : getContact(user);


    document.getElementById(
        "editUserAddress"
    ).value =
        getAddress(
            user
        ) === "—"
            ? ""
            : getAddress(user);


    document.getElementById(
        "editUserRole"
    ).value =
        normalizeRole(
            user.role
        );


    document.getElementById(
        "editUserStatus"
    ).value =
        normalizeStatus(
            user.status
        );


    openModal(
        "editUserModal"
    );

}


/* =========================================================
   SEND PASSWORD RESET
========================================================= */

async function sendResetEmail(
    user
) {

    if (
        !user.email
    ) {

        showToast(
            "This user does not have an email address.",
            "error"
        );

        return;

    }


    const confirmed =
        confirm(
            `Send a password reset email to ${user.email}?`
        );


    if (!confirmed) {

        return;

    }


    try {

        await sendPasswordResetEmail(
            auth,
            user.email
        );


        showToast(
            "Password reset email sent successfully.",
            "success"
        );

    }

    catch (error) {

        console.error(
            "Password reset error:",
            error
        );

        showToast(
            getFirebaseErrorMessage(error),
            "error"
        );

    }

}


/* =========================================================
   CHANGE STATUS
========================================================= */

async function changeUserStatus(
    user,
    newStatus
) {

    if (
        user.uid === currentAdmin.uid &&
        newStatus !== "active"
    ) {

        showToast(
            "You cannot suspend your own administrator account.",
            "error"
        );

        return;

    }


    const label =
        newStatus === "suspended"
            ? "suspend"
            : "activate";


    const confirmed =
        confirm(
            `Are you sure you want to ${label} ${getUserDisplayName(user)}?`
        );


    if (!confirmed) {

        return;

    }


    try {

        await updateDoc(
            doc(
                db,
                "users",
                user.uid
            ),
            {

                status:
                    newStatus,

                updatedAt:
                    serverTimestamp(),

                updatedBy:
                    currentAdmin.uid

            }
        );


        /*
         * If this is a scholar and account is being suspended,
         * also reflect the status in scholars/{uid}.
         */

        if (
            normalizeRole(
                user.role
            ) === "scholar" &&
            user.scholarData
        ) {

            try {

                await updateDoc(
                    doc(
                        db,
                        "scholars",
                        user.uid
                    ),
                    {

                        status:
                            newStatus === "active"
                                ? "active"
                                : "suspended",

                        updatedAt:
                            serverTimestamp()

                    }
                );

            }

            catch (error) {

                console.warn(
                    "Scholar status sync failed:",
                    error
                );

            }

        }


        showToast(
            `User account ${label}d successfully.`,
            "success"
        );


        await loadAllData();

    }

    catch (error) {

        console.error(
            "Status update error:",
            error
        );

        showToast(
            getFirebaseErrorMessage(error),
            "error"
        );

    }

}


/* =========================================================
   DELETE / REMOVE USER RECORD
========================================================= */

async function removeUserRecord() {

    if (
        !selectedUser
    ) {

        showToast(
            "Please select a user first.",
            "error"
        );

        return;

    }


    if (
        selectedUser.uid ===
        currentAdmin.uid
    ) {

        showToast(
            "You cannot remove your own administrator record.",
            "error"
        );

        return;

    }


    const confirmed =
        confirm(
            `Remove the Firestore user record for ${getUserDisplayName(selectedUser)}?`
        );


    if (!confirmed) {

        return;

    }


    try {

        /*
         * This deletes only the Firestore user document.
         * It does NOT delete Firebase Authentication account.
         *
         * Actual Firebase Auth deletion requires Admin SDK/backend.
         */

        await deleteDoc(
            doc(
                db,
                "users",
                selectedUser.uid
            )
        );


        showToast(
            "Firestore user record removed.",
            "success"
        );


        selectedUser =
            null;


        clearDetails();


        await loadAllData();

    }

    catch (error) {

        console.error(
            "Remove user error:",
            error
        );

        showToast(
            getFirebaseErrorMessage(error),
            "error"
        );

    }

}


/* =========================================================
   SAVE ADMIN NOTES
========================================================= */

async function saveAdminNotes() {

    if (
        !selectedUser
    ) {

        showToast(
            "Please select a user first.",
            "error"
        );

        return;

    }


    const notes =
        document.getElementById(
            "adminNotes"
        ).value;


    try {

        await updateDoc(
            doc(
                db,
                "users",
                selectedUser.uid
            ),
            {

                adminNotes:
                    notes,

                notesUpdatedAt:
                    serverTimestamp(),

                notesUpdatedBy:
                    currentAdmin.uid

            }
        );


        selectedUser.adminNotes =
            notes;


        showToast(
            "Administrator notes saved.",
            "success"
        );

    }

    catch (error) {

        console.error(
            "Notes error:",
            error
        );

        showToast(
            getFirebaseErrorMessage(error),
            "error"
        );

    }

}


/* =========================================================
   QUICK ACTIONS
========================================================= */

function setupQuickActions() {

    document
        .getElementById(
            "detailResetPasswordBtn"
        )
        .addEventListener(
            "click",
            async function () {

                if (
                    selectedUser
                ) {

                    await sendResetEmail(
                        selectedUser
                    );

                }

            }
        );


    document
        .getElementById(
            "saveNotesBtn"
        )
        .addEventListener(
            "click",
            saveAdminNotes
        );


    document
        .getElementById(
            "sendNotificationBtn"
        )
        .addEventListener(
            "click",
            function () {

                if (
                    !selectedUser
                ) {

                    showToast(
                        "Select a user first.",
                        "error"
                    );

                    return;

                }


                window.location.href =
                    `notifications.html?uid=${encodeURIComponent(selectedUser.uid)}`;

            }
        );


    document
        .getElementById(
            "activateAccountBtn"
        )
        .addEventListener(
            "click",
            async function () {

                if (
                    selectedUser
                ) {

                    await changeUserStatus(
                        selectedUser,
                        "active"
                    );

                }

            }
        );


    document
        .getElementById(
            "suspendAccountBtn"
        )
        .addEventListener(
            "click",
            async function () {

                if (
                    selectedUser
                ) {

                    await changeUserStatus(
                        selectedUser,
                        "suspended"
                    );

                }

            }
        );


    document
        .getElementById(
            "editUserBtn"
        )
        .addEventListener(
            "click",
            function () {

                if (
                    selectedUser
                ) {

                    openEditModal(
                        selectedUser
                    );

                }

            }
        );


    document
        .getElementById(
            "deleteUserBtn"
        )
        .addEventListener(
            "click",
            removeUserRecord
        );

}


/* =========================================================
   EXPORT USERS
========================================================= */

function exportUsers() {

    const users =
        getFilteredUsers();


    if (
        !users.length
    ) {

        showToast(
            "There are no users to export.",
            "error"
        );

        return;

    }


    const header = [

        "User ID",
        "Full Name",
        "Email",
        "Role",
        "Status",
        "Login Method",
        "Last Login"

    ];


    const rows =
        users.map(
            function (user) {

                return [

                    getHumanUserId(user),

                    getUserDisplayName(user),

                    user.email || "",

                    getRoleLabel(
                        normalizeRole(
                            user.role
                        )
                    ),

                    getStatusLabel(
                        normalizeStatus(
                            user.status
                        )
                    ),

                    getLoginMethod(user),

                    getLastLogin(user)

                ];

            }
        );


    const csv =
        [
            header,
            ...rows
        ]
        .map(
            function (row) {

                return row
                    .map(
                        function (value) {

                            return `"${String(value)
                                .replaceAll('"', '""')}"`;

                        }
                    )
                    .join(",");

            }
        )
        .join("\n");


    const blob =
        new Blob(
            [csv],
            {
                type:
                    "text/csv;charset=utf-8;"
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


    link.href =
        url;


    link.download =
        `ScholarLink_Users_${new Date()
            .toISOString()
            .slice(0,10)}.csv`;


    link.click();


    URL.revokeObjectURL(
        url
    );


    showToast(
        "User list exported successfully.",
        "success"
    );

}


/* =========================================================
   NOTIFICATION BADGE
========================================================= */

function updateNotificationBadge() {

    const unread =
        allNotifications.filter(
            function (notification) {

                return (
                    notification.read === false ||
                    notification.read === undefined
                );

            }
        ).length;


    setText(
        "notificationBadge",
        unread
    );

}


/* =========================================================
   SIDEBAR
========================================================= */

function setupSidebar() {

    const toggle =
        document.getElementById(
            "menuToggle"
        );


    const sidebar =
        document.getElementById(
            "sidebar"
        );


    if (
        toggle &&
        sidebar
    ) {

        toggle.addEventListener(
            "click",
            function () {

                sidebar.classList.toggle(
                    "open"
                );

            }
        );

    }


    document
        .querySelectorAll(
            ".sidebar .menu a"
        )
        .forEach(
            function (link) {

                link.addEventListener(
                    "click",
                    function () {

                        if (
                            window.innerWidth <= 992
                        ) {

                            sidebar.classList.remove(
                                "open"
                            );

                        }

                    }
                );

            }
        );

}


/* =========================================================
   BUTTONS
========================================================= */

function setupButtons() {

    document
        .getElementById(
            "exportUsersBtn"
        )
        .addEventListener(
            "click",
            exportUsers
        );


    document
        .getElementById(
            "addUserBtn"
        )
        .addEventListener(
            "click",
            function () {

                openModal(
                    "addUserModal"
                );

            }
        );


    document
        .getElementById(
            "notificationBtn"
        )
        .addEventListener(
            "click",
            function () {

                window.location.href =
                    "notifications.html";

            }
        );


    document
        .getElementById(
            "sidebarLogout"
        )
        .addEventListener(
            "click",
            async function (event) {

                event.preventDefault();


                const confirmed =
                    confirm(
                        "Are you sure you want to logout?"
                    );


                if (
                    !confirmed
                ) {

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
                        error
                    );

                }

            }
        );


    setupQuickActions();

}


/* =========================================================
   MODALS
========================================================= */

function setupModals() {

    document
        .getElementById(
            "closeAddUser"
        )
        .addEventListener(
            "click",
            function () {

                closeModal(
                    "addUserModal"
                );

            }
        );


    document
        .getElementById(
            "cancelAddUser"
        )
        .addEventListener(
            "click",
            function () {

                closeModal(
                    "addUserModal"
                );

            }
        );


    document
        .getElementById(
            "closeEditUser"
        )
        .addEventListener(
            "click",
            function () {

                closeModal(
                    "editUserModal"
                );

            }
        );


    document
        .getElementById(
            "cancelEditUser"
        )
        .addEventListener(
            "click",
            function () {

                closeModal(
                    "editUserModal"
                );

            }
        );


    document
        .getElementById(
            "addUserForm"
        )
        .addEventListener(
            "submit",
            createUser
        );


    document
        .getElementById(
            "editUserForm"
        )
        .addEventListener(
            "submit",
            saveEditedUser
        );


    document
        .querySelectorAll(
            ".modal"
        )
        .forEach(
            function (modal) {

                modal.addEventListener(
                    "click",
                    function (event) {

                        if (
                            event.target === modal
                        ) {

                            modal.classList.remove(
                                "show"
                            );

                        }

                    }
                );

            }
        );

}


/* =========================================================
   CLEAR DETAILS
========================================================= */

function clearDetails() {

    setText(
        "detailName",
        "Select a user"
    );

    setText(
        "detailUserId",
        "User ID : —"
    );

    setText(
        "detailFullName",
        "—"
    );

    setText(
        "detailEmail",
        "—"
    );

    setText(
        "detailContact",
        "—"
    );

    setText(
        "detailAddress",
        "—"
    );

    setText(
        "detailCreated",
        "—"
    );

    setText(
        "accountUsername",
        "—"
    );

    setText(
        "accountEmail",
        "—"
    );

    setText(
        "accountRole",
        "—"
    );

    setText(
        "passwordChanged",
        "—"
    );

    setText(
        "qrStatus",
        "—"
    );

    setText(
        "lastQrLogin",
        "—"
    );

    setText(
        "totalQrLogins",
        "—"
    );

    document.getElementById(
        "adminNotes"
    ).value = "";

}


/* =========================================================
   HELPER FUNCTIONS
========================================================= */

function normalizeRole(
    role
) {

    const value =
        String(
            role || ""
        )
        .trim()
        .toLowerCase();


    if (
        value === "administrator"
    ) {

        return "admin";

    }


    return value || "applicant";

}


function normalizeStatus(
    status
) {

    const value =
        String(
            status || ""
        )
        .trim()
        .toLowerCase();


    if (
        value === "disabled"
    ) {

        return "suspended";

    }


    if (
        value === "pending verification"
    ) {

        return "pending";

    }


    return value || "active";

}


function getRoleLabel(
    role
) {

    if (
        role === "admin"
    ) {

        return "Administrator";

    }


    if (
        role === "scholar"
    ) {

        return "Scholar";

    }


    return "Applicant";

}


function getStatusLabel(
    status
) {

    if (
        status === "suspended"
    ) {

        return "Suspended";

    }


    if (
        status === "inactive"
    ) {

        return "Inactive";

    }


    if (
        status === "pending"
    ) {

        return "Pending Verification";

    }


    return "Active";

}


function getRoleClass(
    role
) {

    if (
        role === "admin"
    ) {

        return "role-admin";

    }


    if (
        role === "scholar"
    ) {

        return "role-scholar";

    }


    return "role-applicant";

}


function getStatusClass(
    status
) {

    if (
        status === "suspended"
    ) {

        return "status-suspended";

    }


    if (
        status === "inactive"
    ) {

        return "status-inactive";

    }


    if (
        status === "pending"
    ) {

        return "status-pending";

    }


    return "status-active";

}


function getUserDisplayName(
    user
) {

    return (
        user.fullName ||
        user.name ||
        user.displayName ||
        buildNameFromApplication(
            user.applicationData
        ) ||
        user.email ||
        "Unnamed User"
    );

}


function buildNameFromApplication(
    application
) {

    if (
        !application
    ) {

        return "";

    }


    const personal =
        application.personalInformation ||
        application.personal_info ||
        application.personal ||
        {};


    const parts = [

        personal.firstName,

        personal.middleName,

        personal.lastName,

        personal.suffix

    ];


    return parts
        .filter(
            function (part) {

                return (
                    part !== undefined &&
                    part !== null &&
                    String(part).trim() !== ""
                );

            }
        )
        .join(" ")
        .trim();

}


function getHumanUserId(
    user
) {

    const role =
        normalizeRole(
            user.role
        );


    if (
        role === "admin"
    ) {

        return (
            user.adminId ||
            user.userId ||
            `ADM-${String(user.uid).slice(0,6).toUpperCase()}`
        );

    }


    if (
        role === "scholar"
    ) {

        return (
            user.scholarId ||
            user.scholarData?.scholarId ||
            `SCH-${String(user.uid).slice(0,6).toUpperCase()}`
        );

    }


    return (
        user.applicantId ||
        user.applicationData?.applicantId ||
        `APP-${String(user.uid).slice(0,6).toUpperCase()}`
    );

}


function getContact(
    user
) {

    return (
        user.contactNumber ||
        user.contact ||
        user.phone ||
        getNestedPersonalValue(
            user,
            "contactNumber"
        ) ||
        "—"
    );

}


function getAddress(
    user
) {

    return (
        user.address ||
        user.completeAddress ||
        getNestedPersonalValue(
            user,
            "completeAddress"
        ) ||
        "—"
    );

}


function getNestedPersonalValue(
    user,
    field
) {

    const application =
        user.applicationData;


    const personal =
        application?.personalInformation ||
        application?.personal_info ||
        application?.personal ||
        {};


    return (
        personal[field] ||
        ""
    );

}


function getUserImage(
    user
) {

    return (
        user.photoURL ||
        user.photoUrl ||
        user.profilePhoto ||
        user.photo ||
        "../images/admin.png"
    );

}


function getLoginMethod(
    user
) {

    const role =
        normalizeRole(
            user.role
        );


    if (
        role === "scholar" &&
        user.scholarData?.qrToken
    ) {

        return "Email / QR Login";

    }


    return "Email Login";

}


function getLastLogin(
    user
) {

    return formatDateTime(
        user.lastLogin ||
        user.lastLoginAt ||
        user.lastLoginTimestamp
    );

}


function getTimestamp(
    value
) {

    if (
        !value
    ) {

        return 0;

    }


    if (
        typeof value.toMillis === "function"
    ) {

        return value.toMillis();

    }


    if (
        value.seconds
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


    if (
        typeof value === "number"
    ) {

        return value;

    }


    const parsed =
        new Date(
            value
        );


    return isNaN(
        parsed.getTime()
    )
        ? 0
        : parsed.getTime();

}


function formatDate(
    value
) {

    const timestamp =
        getTimestamp(
            value
        );


    if (
        !timestamp
    ) {

        return "—";

    }


    return new Intl.DateTimeFormat(
        "en-US",
        {
            month: "short",
            day: "2-digit",
            year: "numeric"
        }
    ).format(
        new Date(timestamp)
    );

}


function formatDateTime(
    value
) {

    const timestamp =
        getTimestamp(
            value
        );


    if (
        !timestamp
    ) {

        return "Never";

    }


    return new Intl.DateTimeFormat(
        "en-US",
        {
            month: "short",
            day: "2-digit",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit"
        }
    ).format(
        new Date(timestamp)
    );

}


function setText(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (
        element
    ) {

        element.textContent =
            value;

    }

}


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


function openModal(
    id
) {

    const modal =
        document.getElementById(
            id
        );


    if (
        modal
    ) {

        modal.classList.add(
            "show"
        );

    }

}


function closeModal(
    id
) {

    const modal =
        document.getElementById(
            id
        );


    if (
        modal
    ) {

        modal.classList.remove(
            "show"
        );

    }

}


function showTableLoading() {

    const tbody =
        document.getElementById(
            "usersTableBody"
        );


    tbody.innerHTML = `

        <tr>

            <td
                colspan="8"
                class="loading-row"
            >

                <i class="fas fa-spinner fa-spin"></i>

                Loading users from Firestore...

            </td>

        </tr>

    `;

}


function showToast(
    message,
    type = "success"
) {

    const toast =
        document.getElementById(
            "toast"
        );


    const messageElement =
        document.getElementById(
            "toastMessage"
        );


    messageElement.textContent =
        message;


    toast.className =
        `toast ${type} show`;


    setTimeout(
        function () {

            toast.classList.remove(
                "show"
            );

        },
        3500
    );

}


function getFirebaseErrorMessage(
    error
) {

    if (
        error?.code ===
        "auth/user-not-found"
    ) {

        return "User account was not found.";

    }


    if (
        error?.code ===
        "auth/invalid-email"
    ) {

        return "Invalid email address.";

    }


    if (
        error?.code ===
        "auth/too-many-requests"
    ) {

        return "Too many requests. Please try again later.";

    }


    if (
        error?.code ===
        "permission-denied"
    ) {

        return "Firestore permission denied. Check your Firebase security rules.";

    }


    return (
        error?.message ||
        "An unexpected error occurred."
    );

}
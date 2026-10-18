/*=========================================================
  SCHOLARLINK
  NOTIFICATION MANAGEMENT
  FIRESTORE CONNECTED VERSION
=========================================================*/

import {
    auth,
    db
} from "../firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
    collection,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    orderBy,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";


/*=========================================================
  GLOBAL DATA
=========================================================*/

let currentAdmin = null;

let users = [];
let notifications = [];

let selectedNotificationId = null;


/*=========================================================
  DOM READY
=========================================================*/

document.addEventListener("DOMContentLoaded", function () {

    console.log(
        "ScholarLink Notification Management Loaded"
    );

    setupMobileSidebar();

    setupActiveSidebar();

    setupLogout();

    setupForm();

    setupTemplates();

    setupSearch();

    setupHistoryActions();

    setupAnimations();

});


/*=========================================================
  AUTHENTICATION
=========================================================*/

onAuthStateChanged(
    auth,
    async function (user) {

        if (!user) {

            window.location.href =
                "../login/index.html";

            return;

        }

        try {

            console.log(
                "Checking administrator account..."
            );

            const userRef =
                doc(
                    db,
                    "users",
                    user.uid
                );

            const userSnapshot =
                await getDoc(
                    userRef
                );


            if (!userSnapshot.exists()) {

                alert(
                    "Administrator account was not found."
                );

                await signOut(auth);

                window.location.href =
                    "../login/index.html";

                return;

            }


            const userData =
                userSnapshot.data();


            if (
                String(userData.role || "")
                    .toLowerCase() !== "admin"
            ) {

                alert(
                    "Unauthorized access."
                );

                await signOut(auth);

                window.location.href =
                    "../login/index.html";

                return;

            }


            currentAdmin = {
                uid: user.uid,
                email: user.email || "",
                ...userData
            };


            console.log(
                "Administrator authenticated:",
                currentAdmin
            );


            /*
              LOAD REAL FIRESTORE DATA
            */

            await Promise.all([
                loadUsers(),
                loadNotifications()
            ]);


            updateSummary();

            populateRecipients();

            renderNotificationHistory();

            console.log(
                "Notification Management Ready."
            );


        }

        catch (error) {

            console.error(
                "Notification authentication error:",
                error
            );

            alert(
                "Unable to load notification management."
            );

        }

    }
);


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
  ACTIVE SIDEBAR
=========================================================*/

function setupActiveSidebar() {

    const menuItems =
        document.querySelectorAll(
            ".menu li"
        );


    menuItems.forEach(
        function (item) {

            const link =
                item.querySelector("a");

            if (!link) return;


            link.addEventListener(
                "click",
                function () {

                    menuItems.forEach(
                        function (menu) {

                            menu.classList.remove(
                                "active"
                            );

                        }
                    );


                    item.classList.add(
                        "active"
                    );

                }
            );

        }
    );

}


/*=========================================================
  GET FORM ELEMENTS
=========================================================*/

function getFormElements() {

    const selects =
        document.querySelectorAll(
            ".notification-form select"
        );


    return {

        recipientType:
            document.getElementById(
                "recipientType"
            ),

        recipientName:
            document.getElementById(
                "recipientName"
            ),

        category:
            document.getElementById(
                "notificationCategory"
            ) ||
            selects[2],

        priority:
            document.getElementById(
                "notificationPriority"
            ) ||
            selects[3],

        title:
            document.getElementById(
                "notificationTitle"
            ) ||
            document.querySelector(
                '.notification-form input[type="text"]'
            ),

        message:
            document.getElementById(
                "notificationMessage"
            ) ||
            document.querySelector(
                ".notification-form textarea"
            ),

        attachment:
            document.getElementById(
                "notificationAttachment"
            ) ||
            document.querySelector(
                '.notification-form input[type="file"]'
            ),

        dashboardNotification:
            document.getElementById(
                "sendDashboardNotification"
            ) ||
            document.querySelector(
                '.check-group input[type="checkbox"]'
            ),

        emailNotification:
            document.getElementById(
                "sendEmailNotification"
            ) ||
            document.querySelectorAll(
                '.check-group input[type="checkbox"]'
            )[1],

        templateBtn:
            document.querySelector(
                ".btn-template"
            ),

        previewBtn:
            document.querySelector(
                ".btn-preview"
            ),

        sendBtn:
            document.querySelector(
                ".btn-send"
            )

    };

}


/*=========================================================
  FORM SETUP
=========================================================*/

function setupForm() {

    const elements =
        getFormElements();


    if (
        elements.recipientType
    ) {

        elements.recipientType.addEventListener(
            "change",
            function () {

                populateRecipients();

            }
        );

    }


    /*
      PREVIEW
    */

    if (
        elements.previewBtn
    ) {

        elements.previewBtn.addEventListener(
            "click",
            function () {

                previewNotification();

            }
        );

    }


    /*
      SEND
    */

    if (
        elements.sendBtn
    ) {

        elements.sendBtn.addEventListener(
            "click",
            async function () {

                await sendNotification();

            }
        );

    }


    /*
      SAVE DRAFT LOCALLY
    */

    if (
        elements.title
    ) {

        elements.title.addEventListener(
            "input",
            saveDraft
        );

    }


    if (
        elements.message
    ) {

        elements.message.addEventListener(
            "input",
            saveDraft
        );

    }


    loadDraft();

}


/*=========================================================
  LOAD USERS FROM FIRESTORE
=========================================================*/

async function loadUsers() {

    try {

        console.log(
            "Loading users..."
        );


        const snapshot =
            await getDocs(
                collection(
                    db,
                    "users"
                )
            );


        users = [];


        snapshot.forEach(
            function (documentSnapshot) {

                const data =
                    documentSnapshot.data();


                const role =
                    String(
                        data.role || ""
                    ).toLowerCase();


                /*
                  ONLY APPLICANTS AND SCHOLARS
                */

                if (
                    role === "applicant" ||
                    role === "scholar"
                ) {

                    users.push({

                        uid:
                            documentSnapshot.id,

                        ...data

                    });

                }

            }
        );


        /*
          SORT BY NAME
        */

        users.sort(
            function (a, b) {

                return getUserName(a)
                    .localeCompare(
                        getUserName(b)
                    );

            }
        );


        console.log(
            "Users loaded:",
            users.length
        );


    }

    catch (error) {

        console.error(
            "Unable to load users:",
            error
        );

        alert(
            "Unable to load applicants and scholars."
        );

    }

}


/*=========================================================
  GET USER NAME
=========================================================*/

function getUserName(user) {

    return (
        user.fullName ||
        user.name ||
        user.displayName ||
        [
            user.firstName,
            user.middleName,
            user.lastName
        ]
            .filter(Boolean)
            .join(" ") ||
        user.email ||
        "Unnamed User"
    );

}


/*=========================================================
  GET USER ROLE
=========================================================*/

function getUserRole(user) {

    return String(
        user.role || ""
    ).toLowerCase();

}


/*=========================================================
  POPULATE RECIPIENT DROPDOWN
=========================================================*/

function populateRecipients() {

    const elements =
        getFormElements();


    const recipientType =
        elements.recipientType;

    const recipientName =
        elements.recipientName;


    if (
        !recipientType ||
        !recipientName
    ) {

        return;

    }


    const selectedType =
        recipientType.value
            .trim()
            .toLowerCase();


    recipientName.innerHTML = "";


    /*
      DEFAULT
    */

    const defaultOption =
        document.createElement(
            "option"
        );

    defaultOption.value = "";

    defaultOption.textContent =
        "Select User";

    recipientName.appendChild(
        defaultOption
    );


    /*
      ALL APPLICANTS
    */

    if (
        selectedType ===
        "all applicants"
    ) {

        const option =
            document.createElement(
                "option"
            );

        option.value =
            "ALL_APPLICANTS";

        option.textContent =
            "All Applicants";

        recipientName.appendChild(
            option
        );

        recipientName.value =
            "ALL_APPLICANTS";

        return;

    }


    /*
      ALL SCHOLARS
    */

    if (
        selectedType ===
        "all scholars"
    ) {

        const option =
            document.createElement(
                "option"
            );

        option.value =
            "ALL_SCHOLARS";

        option.textContent =
            "All Scholars";

        recipientName.appendChild(
            option
        );

        recipientName.value =
            "ALL_SCHOLARS";

        return;

    }


    /*
      EVERYONE
    */

    if (
        selectedType ===
        "everyone"
    ) {

        const option =
            document.createElement(
                "option"
            );

        option.value =
            "EVERYONE";

        option.textContent =
            "Everyone";

        recipientName.appendChild(
            option
        );

        recipientName.value =
            "EVERYONE";

        return;

    }


    /*
      SINGLE APPLICANT
    */

    if (
        selectedType ===
        "applicant"
    ) {

        users
            .filter(
                function (user) {

                    return (
                        getUserRole(user) ===
                        "applicant"
                    );

                }
            )
            .forEach(
                function (user) {

                    addRecipientOption(
                        recipientName,
                        user
                    );

                }
            );

        return;

    }


    /*
      SINGLE SCHOLAR
    */

    if (
        selectedType ===
        "scholar"
    ) {

        users
            .filter(
                function (user) {

                    return (
                        getUserRole(user) ===
                        "scholar"
                    );

                }
            )
            .forEach(
                function (user) {

                    addRecipientOption(
                        recipientName,
                        user
                    );

                }
            );

        return;

    }

}


/*=========================================================
  ADD RECIPIENT OPTION
=========================================================*/

function addRecipientOption(
    select,
    user
) {

    const option =
        document.createElement(
            "option"
        );


    option.value =
        user.uid;


    option.textContent =
        getUserName(user);


    select.appendChild(
        option
    );

}


/*=========================================================
  NOTIFICATION TEMPLATES
=========================================================*/

const templates = {

    "Missing Requirements": {

        title:
            "Incomplete Requirements",

        message:
`Your scholarship application is incomplete.

Please upload the missing requirements before the deadline.

Failure to comply may result in the rejection of your application.`

    },


    "Application Approved": {

        title:
            "Application Approved",

        message:
`Congratulations!

Your scholarship application has been approved.

Please wait for the next announcement regarding the orientation schedule.`

    },


    "Application Rejected": {

        title:
            "Application Rejected",

        message:
`We regret to inform you that your scholarship application has not been approved.

Please contact the Scholarship Office for more information.`

    },


    "Grade Verification": {

        title:
            "Submit Grades",

        message:
`Please upload your grades before the deadline to maintain your scholarship eligibility.`

    },


    "COR Verification": {

        title:
            "Submit COR",

        message:
`Please upload your Certificate of Registration (COR) as soon as possible.`

    },


    "Scholarship Reminder": {

        title:
            "Scholarship Reminder",

        message:
`This is a reminder regarding your scholarship responsibilities.

Please make sure that all required submissions are completed on time.`

    },


    "Interview Schedule": {

        title:
            "Interview Schedule",

        message:
`You have been scheduled for a scholarship interview.

Please check the provided schedule and attend on time.`

    },


    "Orientation": {

        title:
            "Scholarship Orientation",

        message:
`You are invited to attend the scholarship orientation.

Please wait for the official schedule and venue details.`

    }

};


/*=========================================================
  USE TEMPLATE BUTTON
=========================================================*/

function setupTemplates() {

    const elements =
        getFormElements();


    if (
        elements.templateBtn
    ) {

        elements.templateBtn.addEventListener(
            "click",
            function () {

                const category =
                    elements.category
                        ? elements.category.value
                        : "";


                const template =
                    templates[category];


                if (!template) {

                    alert(
                        "No template available for this category."
                    );

                    return;

                }


                if (
                    elements.title
                ) {

                    elements.title.value =
                        template.title;

                }


                if (
                    elements.message
                ) {

                    elements.message.value =
                        template.message;

                }


                saveDraft();


            }
        );

    }


    /*
      QUICK TEMPLATE CARDS
    */

    document
        .querySelectorAll(
            ".btn-template-use"
        )
        .forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        const card =
                            button.closest(
                                ".template-card"
                            );


                        if (!card) return;


                        const heading =
                            card.querySelector(
                                "h3"
                            );


                        if (!heading) return;


                        const templateName =
                            heading.textContent
                                .trim();


                        const template =
                            templates[
                                templateName
                            ];


                        if (!template) {

                            alert(
                                "Template is not available."
                            );

                            return;

                        }


                        const elements =
                            getFormElements();


                        elements.title.value =
                            template.title;


                        elements.message.value =
                            template.message;


                        saveDraft();


                        window.scrollTo({
                            top: 0,
                            behavior: "smooth"
                        });


                    }
                );

            }
        );

}


/*=========================================================
  PREVIEW NOTIFICATION
=========================================================*/

function previewNotification() {

    const elements =
        getFormElements();


    const recipientText =
        elements.recipientName
            ?.selectedOptions?.[0]
            ?.textContent ||
        "No recipient selected";


    const title =
        elements.title
            ?.value
            ?.trim() ||
        "No title";


    const message =
        elements.message
            ?.value
            ?.trim() ||
        "No message";


    alert(
        "NOTIFICATION PREVIEW\n\n" +

        "Recipient:\n" +
        recipientText +

        "\n\nTitle:\n" +
        title +

        "\n\nMessage:\n\n" +
        message
    );

}


/*=========================================================
  SEND NOTIFICATION
=========================================================*/

async function sendNotification() {

    const elements =
        getFormElements();


    if (!currentAdmin) {

        alert(
            "Administrator authentication is not ready."
        );

        return;

    }


    const recipientType =
        elements.recipientType
            ?.value
            ?.trim();


    const recipientUid =
        elements.recipientName
            ?.value
            ?.trim();


    const category =
        elements.category
            ?.value
            ?.trim() ||
        "General Announcement";


    const priority =
        elements.priority
            ?.value
            ?.trim() ||
        "Normal";


    const title =
        elements.title
            ?.value
            ?.trim();


    const message =
        elements.message
            ?.value
            ?.trim();


    /*
      VALIDATION
    */

    if (
        !recipientType ||
        recipientType ===
        "Select Recipient"
    ) {

        alert(
            "Please select a recipient type."
        );

        return;

    }


    if (
        !recipientUid
    ) {

        alert(
            "Please select a recipient."
        );

        return;

    }


    if (
        !title
    ) {

        alert(
            "Please enter notification title."
        );

        return;

    }


    if (
        !message
    ) {

        alert(
            "Please enter notification message."
        );

        return;

    }


    /*
      CONFIRM
    */

    const recipientLabel =
        elements.recipientName
            ?.selectedOptions?.[0]
            ?.textContent ||
        "selected recipients";


    const confirmed =
        confirm(
            "Send this notification to:\n\n" +
            recipientLabel +
            "\n\nContinue?"
        );


    if (!confirmed) {

        return;

    }


    /*
      DISABLE BUTTON
    */

    if (
        elements.sendBtn
    ) {

        elements.sendBtn.disabled =
            true;

        elements.sendBtn.innerHTML =
            '<i class="fas fa-spinner fa-spin"></i> Sending...';

    }


    try {

        /*
          DETERMINE ACTUAL RECIPIENTS
        */

        const recipients =
            getSelectedRecipients(
                recipientType,
                recipientUid
            );


        if (
            recipients.length === 0
        ) {

            throw new Error(
                "No valid recipients found."
            );

        }


        /*
          CREATE ONE FIRESTORE DOCUMENT
          PER RECIPIENT
        */

        let sentCount = 0;


        for (
            const recipient
            of recipients
        ) {

            await addDoc(
                collection(
                    db,
                    "notifications"
                ),
                {

                    recipientUid:
                        recipient.uid,

                    /*
                      userId included for compatibility
                      with existing scholar notification page.
                    */

                    userId:
                        recipient.uid,

                    recipientName:
                        getUserName(
                            recipient
                        ),

                    recipientType:
                        getUserRole(
                            recipient
                        ),

                    category:
                        category,

                    priority:
                        priority,

                    title:
                        title,

                    message:
                        message,

                    read:
                        false,

                    important:
                        priority !==
                        "Normal",

                    dashboardNotification:
                        elements
                            .dashboardNotification
                            ? elements
                                .dashboardNotification
                                .checked
                            : true,

                    emailNotification:
                        elements
                            .emailNotification
                            ? elements
                                .emailNotification
                                .checked
                            : false,

                    attachmentName:
                        elements
                            .attachment
                            ?.files?.[0]
                            ?.name ||
                        null,

                    createdBy:
                        currentAdmin.uid,

                    createdByEmail:
                        currentAdmin.email,

                    createdAt:
                        serverTimestamp()

                }
            );


            sentCount++;

        }


        /*
          SUCCESS
        */

        alert(
            `Notification sent successfully to ${sentCount} recipient${sentCount !== 1 ? "s" : ""}.`
        );


        /*
          CLEAR FORM
        */

        clearNotificationForm();


        /*
          CLEAR DRAFT
        */

        localStorage.removeItem(
            "notifyTitle"
        );

        localStorage.removeItem(
            "notifyMessage"
        );


        /*
          RELOAD ACTUAL FIRESTORE DATA
        */

        await loadNotifications();

        updateSummary();

        renderNotificationHistory();


    }

    catch (error) {

        console.error(
            "Send notification error:",
            error
        );


        alert(
            "Unable to send notification.\n\n" +
            error.message
        );

    }


    finally {

        if (
            elements.sendBtn
        ) {

            elements.sendBtn.disabled =
                false;

            elements.sendBtn.innerHTML =
                '<i class="fas fa-paper-plane"></i> Send Notification';

        }

    }

}


/*=========================================================
  GET SELECTED RECIPIENTS
=========================================================*/

function getSelectedRecipients(
    recipientType,
    recipientUid
) {

    const type =
        recipientType
            .toLowerCase();


    /*
      ALL APPLICANTS
    */

    if (
        type ===
        "all applicants"
    ) {

        return users.filter(
            function (user) {

                return (
                    getUserRole(user) ===
                    "applicant"
                );

            }
        );

    }


    /*
      ALL SCHOLARS
    */

    if (
        type ===
        "all scholars"
    ) {

        return users.filter(
            function (user) {

                return (
                    getUserRole(user) ===
                    "scholar"
                );

            }
        );

    }


    /*
      EVERYONE
    */

    if (
        type ===
        "everyone"
    ) {

        return users.filter(
            function (user) {

                return (
                    getUserRole(user) ===
                    "applicant" ||
                    getUserRole(user) ===
                    "scholar"
                );

            }
        );

    }


    /*
      SINGLE USER
    */

    const selectedUser =
        users.find(
            function (user) {

                return (
                    user.uid ===
                    recipientUid
                );

            }
        );


    if (
        selectedUser
    ) {

        return [
            selectedUser
        ];

    }


    return [];

}


/*=========================================================
  LOAD NOTIFICATIONS
=========================================================*/

async function loadNotifications() {

    try {

        console.log(
            "Loading notification history..."
        );


        const notificationQuery =
            query(
                collection(
                    db,
                    "notifications"
                ),
                orderBy(
                    "createdAt",
                    "desc"
                )
            );


        const snapshot =
            await getDocs(
                notificationQuery
            );


        notifications = [];


        snapshot.forEach(
            function (documentSnapshot) {

                const data =
                    documentSnapshot.data();


                /*
                  ONLY NOTIFICATIONS CREATED
                  BY CURRENT ADMIN
                */

                if (
                    data.createdBy ===
                    currentAdmin?.uid
                ) {

                    notifications.push({

                        id:
                            documentSnapshot.id,

                        ...data

                    });

                }

            }
        );


        /*
          If orderBy fails because old
          documents don't have createdAt,
          fallback handled below.
        */


        console.log(
            "Notifications loaded:",
            notifications.length
        );


    }

    catch (error) {

        console.warn(
            "Ordered notification query failed. Using fallback.",
            error
        );


        try {

            const snapshot =
                await getDocs(
                    collection(
                        db,
                        "notifications"
                    )
                );


            notifications = [];


            snapshot.forEach(
                function (documentSnapshot) {

                    const data =
                        documentSnapshot.data();


                    if (
                        data.createdBy ===
                        currentAdmin?.uid
                    ) {

                        notifications.push({

                            id:
                                documentSnapshot.id,

                            ...data

                        });

                    }

                }
            );


            notifications.sort(
                function (a, b) {

                    return (
                        getTimestampMillis(
                            b.createdAt
                        ) -
                        getTimestampMillis(
                            a.createdAt
                        )
                    );

                }
            );


        }

        catch (fallbackError) {

            console.error(
                "Unable to load notifications:",
                fallbackError
            );

            notifications = [];

        }

    }

}


/*=========================================================
  UPDATE SUMMARY
=========================================================*/

function updateSummary() {

    /*
      TOTAL SENT
    */

    const totalSent =
        notifications.length;


    /*
      READ
    */

    const readCount =
        notifications.filter(
            function (notification) {

                return (
                    notification.read ===
                    true
                );

            }
        ).length;


    /*
      UNREAD
    */

    const unreadCount =
        notifications.filter(
            function (notification) {

                return (
                    notification.read !==
                    true
                );

            }
        ).length;


    /*
      UNIQUE RECIPIENTS
    */

    const recipientSet =
        new Set();


    notifications.forEach(
        function (notification) {

            if (
                notification.recipientUid
            ) {

                recipientSet.add(
                    notification.recipientUid
                );

            }

        }
    );


    const recipientCount =
        recipientSet.size;


    /*
      UPDATE HTML
    */

    const summaryCards =
        document.querySelectorAll(
            ".summary-card"
        );


    if (
        summaryCards[0]
    ) {

        const value =
            summaryCards[0]
                .querySelector("h2");

        if (value) {

            value.textContent =
                totalSent;

        }

    }


    if (
        summaryCards[1]
    ) {

        const value =
            summaryCards[1]
                .querySelector("h2");

        if (value) {

            value.textContent =
                readCount;

        }

    }


    if (
        summaryCards[2]
    ) {

        const value =
            summaryCards[2]
                .querySelector("h2");

        if (value) {

            value.textContent =
                unreadCount;

        }

    }


    if (
        summaryCards[3]
    ) {

        const value =
            summaryCards[3]
                .querySelector("h2");

        if (value) {

            value.textContent =
                recipientCount;

        }

    }

}


/*=========================================================
  RENDER HISTORY
=========================================================*/

function renderNotificationHistory() {

    const tableBody =
        document.querySelector(
            ".notification-history tbody"
        );


    if (!tableBody) {

        return;

    }


    tableBody.innerHTML = "";


    if (
        notifications.length === 0
    ) {

        const row =
            document.createElement(
                "tr"
            );


        row.innerHTML = `
            <td
                colspan="6"
                style="
                    text-align:center;
                    padding:30px;
                    color:#777;
                "
            >
                <i class="fas fa-bell-slash"></i>
                <br>
                No notifications sent yet.
            </td>
        `;


        tableBody.appendChild(
            row
        );

        return;

    }


    notifications.forEach(
        function (notification) {

            const row =
                document.createElement(
                    "tr"
                );


            const recipientName =
                notification.recipientName ||
                "Unknown Recipient";


            const category =
                notification.category ||
                "General Announcement";


            const title =
                notification.title ||
                "Notification";


            const isRead =
                notification.read ===
                true;


            const statusClass =
                isRead
                    ? "read"
                    : "unread";


            const statusText =
                isRead
                    ? "Read"
                    : "Unread";


            const date =
                formatDate(
                    notification.createdAt
                );


            row.dataset.notificationId =
                notification.id;


            row.innerHTML = `

                <td>
                    ${escapeHTML(
                        recipientName
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        category
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        title
                    )}
                </td>

                <td>

                    <span class="status ${statusClass}">
                        ${statusText}
                    </span>

                </td>

                <td>
                    ${escapeHTML(
                        date
                    )}
                </td>

                <td>

                    <button
                        class="btn-view"
                        type="button"
                        data-action="view"
                        data-id="${notification.id}"
                    >
                        <i class="fas fa-eye"></i>
                    </button>

                    <button
                        class="btn-copy"
                        type="button"
                        data-action="copy"
                        data-id="${notification.id}"
                    >
                        <i class="fas fa-copy"></i>
                    </button>

                    <button
                        class="btn-delete"
                        type="button"
                        data-action="delete"
                        data-id="${notification.id}"
                    >
                        <i class="fas fa-trash"></i>
                    </button>

                </td>

            `;


            tableBody.appendChild(
                row
            );

        }
    );

}


/*=========================================================
  HISTORY ACTIONS
=========================================================*/

function setupHistoryActions() {

    const tableBody =
        document.querySelector(
            ".notification-history tbody"
        );


    if (!tableBody) {

        return;

    }


    tableBody.addEventListener(
        "click",
        async function (event) {

            const button =
                event.target.closest(
                    "button[data-action]"
                );


            if (!button) {

                return;

            }


            const action =
                button.dataset.action;


            const id =
                button.dataset.id;


            const notification =
                notifications.find(
                    function (item) {

                        return (
                            item.id ===
                            id
                        );

                    }
                );


            if (!notification) {

                return;

            }


            /*
              VIEW
            */

            if (
                action === "view"
            ) {

                viewNotification(
                    notification
                );

                return;

            }


            /*
              COPY
            */

            if (
                action === "copy"
            ) {

                copyNotification(
                    notification
                );

                return;

            }


            /*
              DELETE
            */

            if (
                action === "delete"
            ) {

                await deleteNotification(
                    notification
                );

            }

        }
    );

}


/*=========================================================
  VIEW NOTIFICATION
=========================================================*/

function viewNotification(
    notification
) {

    alert(

        "NOTIFICATION DETAILS\n\n" +

        "Recipient: " +
        (
            notification.recipientName ||
            "Unknown"
        ) +

        "\n\nCategory: " +
        (
            notification.category ||
            "General"
        ) +

        "\n\nPriority: " +
        (
            notification.priority ||
            "Normal"
        ) +

        "\n\nTitle: " +
        (
            notification.title ||
            ""
        ) +

        "\n\nMessage:\n\n" +
        (
            notification.message ||
            ""
        ) +

        "\n\nStatus: " +
        (
            notification.read === true
                ? "Read"
                : "Unread"
        ) +

        "\n\nDate: " +
        formatDate(
            notification.createdAt
        )

    );

}


/*=========================================================
  COPY NOTIFICATION
=========================================================*/

function copyNotification(
    notification
) {

    const elements =
        getFormElements();


    /*
      Find recipient by UID
    */

    if (
        elements.recipientType &&
        elements.recipientName
    ) {

        const role =
            String(
                notification.recipientType ||
                ""
            ).toLowerCase();


        if (
            role === "applicant"
        ) {

            elements.recipientType.value =
                "Applicant";

        }

        else if (
            role === "scholar"
        ) {

            elements.recipientType.value =
                "Scholar";

        }


        populateRecipients();


        if (
            notification.recipientUid
        ) {

            elements.recipientName.value =
                notification.recipientUid;

        }

    }


    if (
        elements.category
    ) {

        elements.category.value =
            notification.category ||
            "";

    }


    if (
        elements.priority
    ) {

        elements.priority.value =
            notification.priority ||
            "Normal";

    }


    if (
        elements.title
    ) {

        elements.title.value =
            notification.title ||
            "";

    }


    if (
        elements.message
    ) {

        elements.message.value =
            notification.message ||
            "";

    }


    saveDraft();


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });


    alert(
        "Notification copied to the form."
    );

}


/*=========================================================
  DELETE NOTIFICATION
=========================================================*/

async function deleteNotification(
    notification
) {

    const confirmed =
        confirm(
            "Delete this notification?\n\n" +
            "This will permanently remove it from Firestore."
        );


    if (!confirmed) {

        return;

    }


    try {

        await deleteDoc(
            doc(
                db,
                "notifications",
                notification.id
            )
        );


        notifications =
            notifications.filter(
                function (item) {

                    return (
                        item.id !==
                        notification.id
                    );

                }
            );


        updateSummary();

        renderNotificationHistory();


        alert(
            "Notification deleted successfully."
        );

    }

    catch (error) {

        console.error(
            "Delete notification error:",
            error
        );


        alert(
            "Unable to delete notification."
        );

    }

}


/*=========================================================
  SEARCH HISTORY
=========================================================*/

function setupSearch() {

    const search =
        document.querySelector(
            ".search-history"
        );


    if (!search) {

        return;

    }


    search.addEventListener(
        "input",
        function () {

            const keyword =
                this.value
                    .toLowerCase()
                    .trim();


            const rows =
                document.querySelectorAll(
                    ".notification-history tbody tr"
                );


            rows.forEach(
                function (row) {

                    const text =
                        row.textContent
                            .toLowerCase();


                    row.style.display =
                        text.includes(
                            keyword
                        )
                            ? ""
                            : "none";

                }
            );

        }
    );

}


/*=========================================================
  SAVE DRAFT
=========================================================*/

function saveDraft() {

    const elements =
        getFormElements();


    if (
        elements.title
    ) {

        localStorage.setItem(
            "notifyTitle",
            elements.title.value
        );

    }


    if (
        elements.message
    ) {

        localStorage.setItem(
            "notifyMessage",
            elements.message.value
        );

    }

}


/*=========================================================
  LOAD DRAFT
=========================================================*/

function loadDraft() {

    const elements =
        getFormElements();


    const savedTitle =
        localStorage.getItem(
            "notifyTitle"
        );


    const savedMessage =
        localStorage.getItem(
            "notifyMessage"
        );


    if (
        savedTitle &&
        elements.title
    ) {

        elements.title.value =
            savedTitle;

    }


    if (
        savedMessage &&
        elements.message
    ) {

        elements.message.value =
            savedMessage;

    }

}


/*=========================================================
  CLEAR FORM
=========================================================*/

function clearNotificationForm() {

    const elements =
        getFormElements();


    if (
        elements.title
    ) {

        elements.title.value =
            "";

    }


    if (
        elements.message
    ) {

        elements.message.value =
            "";

    }


    if (
        elements.recipientType
    ) {

        elements.recipientType.value =
            "";

    }


    populateRecipients();


    if (
        elements.category
    ) {

        elements.category.selectedIndex =
            0;

    }


    if (
        elements.priority
    ) {

        elements.priority.selectedIndex =
            0;

    }


    if (
        elements.attachment
    ) {

        elements.attachment.value =
            "";

    }

}


/*=========================================================
  FORMAT FIRESTORE TIMESTAMP
=========================================================*/

function getTimestampMillis(
    timestamp
) {

    if (!timestamp) {

        return 0;

    }


    if (
        typeof timestamp.toMillis ===
        "function"
    ) {

        return timestamp.toMillis();

    }


    if (
        timestamp.seconds
    ) {

        return (
            timestamp.seconds *
            1000
        );

    }


    if (
        timestamp instanceof Date
    ) {

        return timestamp.getTime();

    }


    const parsed =
        new Date(
            timestamp
        );


    return isNaN(
        parsed.getTime()
    )
        ? 0
        : parsed.getTime();

}


/*=========================================================
  FORMAT DATE
=========================================================*/

function formatDate(
    timestamp
) {

    const milliseconds =
        getTimestampMillis(
            timestamp
        );


    if (!milliseconds) {

        return "—";

    }


    const date =
        new Date(
            milliseconds
        );


    return date.toLocaleDateString(
        "en-US",
        {
            month: "short",
            day: "2-digit",
            year: "numeric"
        }
    );

}


/*=========================================================
  ESCAPE HTML
=========================================================*/

function escapeHTML(
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


/*=========================================================
  ANIMATIONS
=========================================================*/

function setupAnimations() {

    document
        .querySelectorAll(
            ".card,.summary-card,.template-card"
        )
        .forEach(
            function (card, index) {

                card.style.opacity =
                    "0";

                card.style.transform =
                    "translateY(20px)";


                setTimeout(
                    function () {

                        card.style.transition =
                            ".5s";

                        card.style.opacity =
                            "1";

                        card.style.transform =
                            "translateY(0)";

                    },
                    index * 100
                );

            }
        );

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
                    "../login/index.html";

            }

            catch (error) {

                console.error(
                    "Logout error:",
                    error
                );

                alert(
                    "Unable to logout. Please try again."
                );

            }

        }
    );

}
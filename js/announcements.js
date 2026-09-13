/*=========================================
  SCHOLARLINK
  ADMIN ANNOUNCEMENTS
  FIRESTORE CONNECTED
=========================================*/

import { auth, db } from "../firebase.js";

/*
  IMPORTANT:
  Your ScholarLink project uses Firebase 10.7.1.
  Do NOT mix another Firebase SDK version here.
*/

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
    collection,
    addDoc,
    getDocs,
    getDoc,
    doc,
    updateDoc,
    deleteDoc,
    query,
    orderBy,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";


document.addEventListener("DOMContentLoaded", function () {

    console.log("ScholarLink Admin Announcements Loaded");


    /*=========================================
      ELEMENTS
    =========================================*/

    const menuToggle =
        document.getElementById("menuToggle");

    const sidebar =
        document.querySelector(".sidebar");


    const searchInput =
        document.querySelector(".search-box input");


    const filterSelect =
        document.querySelector(
            ".search-section select"
        );


    const formSection =
        document.querySelector(
            ".announcement-form"
        );


    const titleInput =
        formSection?.querySelector(
            'input[type="text"]'
        );


    const contentInput =
        formSection?.querySelector(
            "textarea"
        );


    const dateInputs =
        formSection?.querySelectorAll(
            'input[type="date"]'
        );


    const publishDateInput =
        dateInputs?.[0];


    const expirationDateInput =
        dateInputs?.[1];


    const formSelects =
        formSection?.querySelectorAll(
            "select"
        );


    const audienceSelect =
        formSelects?.[0];


    const prioritySelect =
        formSelects?.[1];


    const imageInput =
        formSection?.querySelector(
            'input[type="file"]'
        );


    const pinCheckbox =
        formSection?.querySelector(
            'input[type="checkbox"]'
        );


    const saveBtn =
        formSection?.querySelector(
            ".btn-save"
        );


    const previewBtn =
        formSection?.querySelector(
            ".btn-preview"
        );


    const publishBtn =
        formSection?.querySelector(
            ".btn-publish"
        );


    /*
      Your table may have different classes.
      This finds the first tbody inside the
      announcement list/card.
    */

    const tableBody =
        document.querySelector(
            ".announcement-list tbody"
        ) ||
        document.querySelector(
            ".list-card tbody"
        ) ||
        document.querySelector(
            "table tbody"
        );


    /*=========================================
      VARIABLES
    =========================================*/

    let announcements = [];

    let editingId = null;


    /*=========================================
      MOBILE SIDEBAR
    =========================================*/

    if (menuToggle && sidebar) {

        menuToggle.addEventListener(
            "click",
            function () {

                sidebar.classList.toggle(
                    "show"
                );

            }
        );

    }


    /*=========================================
      ACTIVE SIDEBAR
    =========================================*/

    const menuItems =
        document.querySelectorAll(
            ".menu li"
        );


    const currentPage =
        window.location.pathname
            .split("/")
            .pop()
            .toLowerCase();


    menuItems.forEach(function (item) {

        const link =
            item.querySelector("a");


        if (!link) return;


        const linkPage =
            link.getAttribute("href")
                ?.split("/")
                .pop()
                .toLowerCase();


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

    });


    /*=========================================
      AUTHENTICATION
    =========================================*/

    onAuthStateChanged(
        auth,
        async function (user) {

            if (!user) {

                console.warn(
                    "No logged-in user."
                );


                window.location.href =
                    "../index.html";


                return;

            }


            console.log(
                "Logged in admin:",
                user.uid
            );


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
                        "Administrator account not found."
                    );


                    await signOut(auth);


                    window.location.href =
                        "../index.html";


                    return;

                }


                const userData =
                    userSnap.data();


                console.log(
                    "Admin user data:",
                    userData
                );


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


                /*
                  Admin verified.
                  Load announcements.
                */

                await loadAnnouncements();


            } catch (error) {

                console.error(
                    "Admin authentication error:",
                    error
                );


                alert(
                    "Unable to verify administrator account.\n\n" +
                    error.message
                );

            }

        }
    );


    /*=========================================
      LOAD ANNOUNCEMENTS
    =========================================*/

    async function loadAnnouncements() {

        try {

            console.log(
                "Loading announcements..."
            );


            const announcementsRef =
                collection(
                    db,
                    "announcements"
                );


            const announcementQuery =
                query(
                    announcementsRef,
                    orderBy(
                        "createdAt",
                        "desc"
                    )
                );


            const snapshot =
                await getDocs(
                    announcementQuery
                );


            announcements = [];


            snapshot.forEach(
                function (docSnap) {

                    announcements.push({

                        id:
                            docSnap.id,

                        ...docSnap.data()

                    });

                }
            );


            console.log(
                "Announcements loaded:",
                announcements
            );


            renderAnnouncements();

            updateSummary();


        } catch (error) {

            console.error(
                "Error loading announcements:",
                error
            );


            /*
              If old documents do not have
              createdAt, load without orderBy.
            */

            try {

                const snapshot =
                    await getDocs(
                        collection(
                            db,
                            "announcements"
                        )
                    );


                announcements = [];


                snapshot.forEach(
                    function (docSnap) {

                        announcements.push({

                            id:
                                docSnap.id,

                            ...docSnap.data()

                        });

                    }
                );


                announcements.sort(
                    function (a, b) {

                        return (
                            getDateValue(
                                b.createdAt
                            ) -
                            getDateValue(
                                a.createdAt
                            )
                        );

                    }
                );


                renderAnnouncements();

                updateSummary();


            } catch (secondError) {

                console.error(
                    "Fallback announcement error:",
                    secondError
                );


                if (tableBody) {

                    tableBody.innerHTML = `
                        <tr>
                            <td
                                colspan="6"
                                style="
                                    text-align:center;
                                    padding:30px;
                                "
                            >
                                Unable to load announcements.
                            </td>
                        </tr>
                    `;

                }

            }

        }

    }


    /*=========================================
      RENDER ANNOUNCEMENTS
    =========================================*/

    function renderAnnouncements() {

        if (!tableBody) {

            console.warn(
                "Announcement table body not found."
            );

            return;

        }


        const keyword =
            searchInput?.value
                ?.toLowerCase()
                .trim() || "";


        const filterValue =
            filterSelect?.value
                ?.toLowerCase()
                .trim() || "all";


        const filtered =
            announcements.filter(
                function (item) {

                    const title =
                        String(
                            item.title || ""
                        ).toLowerCase();


                    const content =
                        String(
                            item.content || ""
                        ).toLowerCase();


                    const audience =
                        String(
                            item.audience || ""
                        ).toLowerCase();


                    const priority =
                        String(
                            item.priority || ""
                        ).toLowerCase();


                    const status =
                        String(
                            item.status || ""
                        ).toLowerCase();


                    const matchesSearch =
                        !keyword ||
                        title.includes(
                            keyword
                        ) ||
                        content.includes(
                            keyword
                        ) ||
                        audience.includes(
                            keyword
                        ) ||
                        priority.includes(
                            keyword
                        );


                    let matchesFilter =
                        true;


                    if (
                        filterValue !==
                        "all"
                    ) {

                        if (
                            filterValue ===
                            "pinned"
                        ) {

                            matchesFilter =
                                item.pinned ===
                                true;

                        } else {

                            matchesFilter =
                                status ===
                                filterValue;

                        }

                    }


                    return (
                        matchesSearch &&
                        matchesFilter
                    );

                }
            );


        if (
            filtered.length ===
            0
        ) {

            tableBody.innerHTML = `
                <tr>
                    <td
                        colspan="6"
                        style="
                            text-align:center;
                            padding:35px;
                        "
                    >
                        No announcements found.
                    </td>
                </tr>
            `;


            return;

        }


        tableBody.innerHTML =
            filtered.map(
                function (item) {

                    const audience =
                        formatAudience(
                            item.audience
                        );


                    const priority =
                        String(
                            item.priority ||
                            "normal"
                        ).toLowerCase();


                    const status =
                        String(
                            item.status ||
                            "draft"
                        ).toLowerCase();


                    const priorityClass =
                        priority ===
                        "urgent"
                            ? "priority-urgent"
                            : priority ===
                              "important"
                                ? "priority-important"
                                : "priority-normal";


                    const statusClass =
                        status ===
                        "published"
                            ? "status-published"
                            : "status-draft";


                    return `

                        <tr
                            data-id="${escapeHTML(
                                item.id
                            )}"
                        >

                            <td>
                                ${escapeHTML(
                                    item.title ||
                                    "Untitled Announcement"
                                )}
                            </td>


                            <td>
                                ${escapeHTML(
                                    audience
                                )}
                            </td>


                            <td>

                                <span
                                    class="${priorityClass}"
                                >
                                    ${capitalize(
                                        priority
                                    )}
                                </span>

                            </td>


                            <td>
                                ${formatDate(
                                    item.publishDate
                                )}
                            </td>


                            <td>

                                <span
                                    class="${statusClass}"
                                >
                                    ${capitalize(
                                        status
                                    )}
                                </span>

                            </td>


                            <td
                                class="action-buttons"
                            >

                                <button
                                    type="button"
                                    class="btn-view"
                                    data-id="${escapeHTML(
                                        item.id
                                    )}"
                                    title="View"
                                >
                                    <i
                                        class="fas fa-eye"
                                    ></i>
                                </button>


                                <button
                                    type="button"
                                    class="btn-edit"
                                    data-id="${escapeHTML(
                                        item.id
                                    )}"
                                    title="Edit"
                                >
                                    <i
                                        class="fas fa-pen"
                                    ></i>
                                </button>


                                <button
                                    type="button"
                                    class="btn-pin"
                                    data-id="${escapeHTML(
                                        item.id
                                    )}"
                                    title="${
                                        item.pinned === true
                                            ? "Unpin"
                                            : "Pin"
                                    }"
                                >
                                    <i
                                        class="fas fa-thumbtack"
                                    ></i>
                                </button>


                                <button
                                    type="button"
                                    class="btn-delete"
                                    data-id="${escapeHTML(
                                        item.id
                                    )}"
                                    title="Delete"
                                >
                                    <i
                                        class="fas fa-trash"
                                    ></i>
                                </button>

                            </td>

                        </tr>

                    `;

                }
            ).join("");


        attachTableActions();

    }


    /*=========================================
      TABLE ACTIONS
    =========================================*/

    function attachTableActions() {

        document
            .querySelectorAll(
                ".btn-view"
            )
            .forEach(
                function (button) {

                    button.addEventListener(
                        "click",
                        function () {

                            viewAnnouncement(
                                button.dataset.id
                            );

                        }
                    );

                }
            );


        document
            .querySelectorAll(
                ".btn-edit"
            )
            .forEach(
                function (button) {

                    button.addEventListener(
                        "click",
                        function () {

                            editAnnouncement(
                                button.dataset.id
                            );

                        }
                    );

                }
            );


        document
            .querySelectorAll(
                ".btn-pin"
            )
            .forEach(
                function (button) {

                    button.addEventListener(
                        "click",
                        function () {

                            togglePin(
                                button.dataset.id
                            );

                        }
                    );

                }
            );


        document
            .querySelectorAll(
                ".btn-delete"
            )
            .forEach(
                function (button) {

                    button.addEventListener(
                        "click",
                        function () {

                            deleteAnnouncement(
                                button.dataset.id
                            );

                        }
                    );

                }
            );

    }


    /*=========================================
      NEW ANNOUNCEMENT
    =========================================*/

    const createBtn =
        document.querySelector(
            ".btn-create"
        );


    if (createBtn) {

        createBtn.addEventListener(
            "click",
            function () {

                resetForm();


                if (formSection) {

                    formSection.scrollIntoView({
                        behavior:
                            "smooth",

                        block:
                            "start"
                    });

                }

            }
        );

    }


    /*=========================================
      SAVE DRAFT
    =========================================*/

    if (saveBtn) {

        saveBtn.addEventListener(
            "click",
            async function () {

                await saveAnnouncement(
                    "draft"
                );

            }
        );

    }


    /*=========================================
      PUBLISH
    =========================================*/

    if (publishBtn) {

        publishBtn.addEventListener(
            "click",
            async function () {

                await saveAnnouncement(
                    "published"
                );

            }
        );

    }


    /*=========================================
      SAVE ANNOUNCEMENT
    =========================================*/

    async function saveAnnouncement(
        status
    ) {

        const title =
            titleInput?.value
                .trim() || "";


        const content =
            contentInput?.value
                .trim() || "";


        const publishDate =
            publishDateInput?.value ||
            "";


        const expirationDate =
            expirationDateInput?.value ||
            "";


        const audience =
            audienceSelect?.value ||
            "all";


        const priority =
            prioritySelect?.value ||
            "normal";


        const pinned =
            pinCheckbox?.checked ||
            false;


        /*-------------------------------------
          VALIDATION
        -------------------------------------*/

        if (!title) {

            alert(
                "Please enter an announcement title."
            );


            if (titleInput) {

                titleInput.focus();

            }


            return;

        }


        if (!content) {

            alert(
                "Please enter announcement content."
            );


            if (contentInput) {

                contentInput.focus();

            }


            return;

        }


        if (
            status === "published" &&
            !publishDate
        ) {

            alert(
                "Please select a publish date."
            );


            if (publishDateInput) {

                publishDateInput.focus();

            }


            return;

        }


        if (
            publishDate &&
            expirationDate &&
            expirationDate <
                publishDate
        ) {

            alert(
                "Expiration date cannot be earlier than publish date."
            );


            return;

        }


        const currentUser =
            auth.currentUser;


        if (!currentUser) {

            alert(
                "Your session has expired. Please login again."
            );


            return;

        }


        /*-------------------------------------
          CONFIRM PUBLISH
        -------------------------------------*/

        if (
            status ===
            "published"
        ) {

            const confirmed =
                confirm(
                    editingId
                        ? "Update and publish this announcement?"
                        : "Publish this announcement?"
                );


            if (!confirmed) {

                return;

            }

        }


        try {

            if (publishBtn) {

                publishBtn.disabled =
                    true;

            }


            if (saveBtn) {

                saveBtn.disabled =
                    true;

            }


            /*-------------------------------------
              ANNOUNCEMENT DATA
            -------------------------------------*/

            const announcementData = {

                title:
                    title,

                content:
                    content,

                publishDate:
                    publishDate,

                expirationDate:
                    expirationDate,

                audience:
                    audience,

                priority:
                    priority,

                pinned:
                    pinned,

                status:
                    status,

                updatedAt:
                    serverTimestamp()

            };


            /*-------------------------------------
              UPDATE EXISTING
            -------------------------------------*/

            if (editingId) {

                const announcementRef =
                    doc(
                        db,
                        "announcements",
                        editingId
                    );


                await updateDoc(
                    announcementRef,
                    announcementData
                );


                alert(
                    status ===
                    "published"
                        ? "Announcement published successfully."
                        : "Draft updated successfully."
                );

            }


            /*-------------------------------------
              CREATE NEW
            -------------------------------------*/

            else {

                await addDoc(
                    collection(
                        db,
                        "announcements"
                    ),
                    {

                        ...announcementData,

                        createdBy:
                            currentUser.uid,

                        createdByEmail:
                            currentUser.email ||
                            "",

                        createdAt:
                            serverTimestamp()

                    }
                );


                alert(
                    status ===
                    "published"
                        ? "Announcement published successfully."
                        : "Draft saved successfully."
                );

            }


            /*-------------------------------------
              RESET
            -------------------------------------*/

            resetForm();


            /*-------------------------------------
              RELOAD
            -------------------------------------*/

            await loadAnnouncements();


        } catch (error) {

            console.error(
                "Announcement save error:",
                error
            );


            if (
                error.code ===
                "permission-denied"
            ) {

                alert(
                    "Permission denied.\n\n" +
                    "Please add the announcements rule to Firestore Rules."
                );

            } else {

                alert(
                    "Unable to save announcement.\n\n" +
                    error.message
                );

            }

        } finally {

            if (publishBtn) {

                publishBtn.disabled =
                    false;

            }


            if (saveBtn) {

                saveBtn.disabled =
                    false;

            }

        }

    }


    /*=========================================
      VIEW ANNOUNCEMENT
    =========================================*/

    function viewAnnouncement(id) {

        const item =
            announcements.find(
                function (announcement) {

                    return (
                        announcement.id ===
                        id
                    );

                }
            );


        if (!item) {

            return;

        }


        alert(

            "ANNOUNCEMENT\n\n" +

            "Title: " +
            (
                item.title ||
                "-"
            ) +

            "\n\nAudience: " +
            formatAudience(
                item.audience
            ) +

            "\nPriority: " +
            capitalize(
                item.priority ||
                "normal"
            ) +

            "\nPublish Date: " +
            formatDate(
                item.publishDate
            ) +

            "\nExpiration Date: " +
            formatDate(
                item.expirationDate
            ) +

            "\nStatus: " +
            capitalize(
                item.status ||
                "draft"
            ) +

            "\n\n" +

            (
                item.content ||
                ""
            )

        );

    }


    /*=========================================
      EDIT ANNOUNCEMENT
    =========================================*/

    function editAnnouncement(id) {

        const item =
            announcements.find(
                function (announcement) {

                    return (
                        announcement.id ===
                        id
                    );

                }
            );


        if (!item) {

            return;

        }


        editingId =
            id;


        if (titleInput) {

            titleInput.value =
                item.title ||
                "";

        }


        if (contentInput) {

            contentInput.value =
                item.content ||
                "";

        }


        if (publishDateInput) {

            publishDateInput.value =
                item.publishDate ||
                "";

        }


        if (expirationDateInput) {

            expirationDateInput.value =
                item.expirationDate ||
                "";

        }


        if (audienceSelect) {

            audienceSelect.value =
                item.audience ||
                "all";

        }


        if (prioritySelect) {

            prioritySelect.value =
                item.priority ||
                "normal";

        }


        if (pinCheckbox) {

            pinCheckbox.checked =
                item.pinned === true;

        }


        if (publishBtn) {

            publishBtn.innerHTML = `
                <i class="fas fa-paper-plane"></i>
                Update & Publish
            `;

        }


        if (formSection) {

            formSection.scrollIntoView({

                behavior:
                    "smooth",

                block:
                    "start"

            });

        }

    }


    /*=========================================
      PIN / UNPIN
    =========================================*/

    async function togglePin(id) {

        const item =
            announcements.find(
                function (announcement) {

                    return (
                        announcement.id ===
                        id
                    );

                }
            );


        if (!item) {

            return;

        }


        try {

            const announcementRef =
                doc(
                    db,
                    "announcements",
                    id
                );


            await updateDoc(
                announcementRef,
                {

                    pinned:
                        item.pinned !== true,

                    updatedAt:
                        serverTimestamp()

                }
            );


            await loadAnnouncements();


        } catch (error) {

            console.error(
                "Pin error:",
                error
            );


            alert(
                "Unable to update pin status.\n\n" +
                error.message
            );

        }

    }


    /*=========================================
      DELETE
    =========================================*/

    async function deleteAnnouncement(
        id
    ) {

        const item =
            announcements.find(
                function (announcement) {

                    return (
                        announcement.id ===
                        id
                    );

                }
            );


        if (!item) {

            return;

        }


        const confirmed =
            confirm(
                `Delete "${
                    item.title ||
                    "this announcement"
                }"?`
            );


        if (!confirmed) {

            return;

        }


        try {

            await deleteDoc(
                doc(
                    db,
                    "announcements",
                    id
                )
            );


            alert(
                "Announcement deleted successfully."
            );


            await loadAnnouncements();


        } catch (error) {

            console.error(
                "Delete error:",
                error
            );


            alert(
                "Unable to delete announcement.\n\n" +
                error.message
            );

        }

    }


    /*=========================================
      SEARCH
    =========================================*/

    if (searchInput) {

        searchInput.addEventListener(
            "input",
            function () {

                renderAnnouncements();

            }
        );

    }


    /*=========================================
      FILTER
    =========================================*/

    if (filterSelect) {

        filterSelect.addEventListener(
            "change",
            function () {

                renderAnnouncements();

            }
        );

    }


    /*=========================================
      PREVIEW
    =========================================*/

    if (previewBtn) {

        previewBtn.addEventListener(
            "click",
            function () {

                const title =
                    titleInput?.value
                        .trim() ||
                    "No Title";


                const content =
                    contentInput?.value
                        .trim() ||
                    "No Content";


                const audience =
                    formatAudience(
                        audienceSelect?.value
                    );


                const priority =
                    capitalize(
                        prioritySelect?.value ||
                        "normal"
                    );


                alert(

                    "ANNOUNCEMENT PREVIEW\n\n" +

                    "Title: " +
                    title +

                    "\n\nAudience: " +
                    audience +

                    "\nPriority: " +
                    priority +

                    "\n\n" +

                    content

                );

            }
        );

    }


    /*=========================================
      RESET FORM
    =========================================*/

    function resetForm() {

        editingId =
            null;


        if (titleInput) {

            titleInput.value =
                "";

        }


        if (contentInput) {

            contentInput.value =
                "";

        }


        if (publishDateInput) {

            publishDateInput.value =
                "";

        }


        if (expirationDateInput) {

            expirationDateInput.value =
                "";

        }


        if (audienceSelect) {

            audienceSelect.value =
                "all";

        }


        if (prioritySelect) {

            prioritySelect.value =
                "normal";

        }


        if (pinCheckbox) {

            pinCheckbox.checked =
                false;

        }


        if (imageInput) {

            imageInput.value =
                "";

        }


        if (publishBtn) {

            publishBtn.innerHTML = `
                <i class="fas fa-paper-plane"></i>
                Publish
            `;

        }

    }


    /*=========================================
      UPDATE SUMMARY
    =========================================*/

    function updateSummary() {

        const total =
            announcements.length;


        const published =
            announcements.filter(
                function (item) {

                    return (
                        String(
                            item.status ||
                            ""
                        ).toLowerCase() ===
                        "published"
                    );

                }
            ).length;


        const drafts =
            announcements.filter(
                function (item) {

                    return (
                        String(
                            item.status ||
                            ""
                        ).toLowerCase() ===
                        "draft"
                    );

                }
            ).length;


        const pinned =
            announcements.filter(
                function (item) {

                    return (
                        item.pinned ===
                        true
                    );

                }
            ).length;


        const summaryCards =
            document.querySelectorAll(
                ".summary-card"
            );


        if (
            summaryCards[0]
        ) {

            const value =
                summaryCards[0]
                    .querySelector(
                        "h2"
                    );


            if (value) {

                value.textContent =
                    total;

            }

        }


        if (
            summaryCards[1]
        ) {

            const value =
                summaryCards[1]
                    .querySelector(
                        "h2"
                    );


            if (value) {

                value.textContent =
                    published;

            }

        }


        if (
            summaryCards[2]
        ) {

            const value =
                summaryCards[2]
                    .querySelector(
                        "h2"
                    );


            if (value) {

                value.textContent =
                    drafts;

            }

        }


        if (
            summaryCards[3]
        ) {

            const value =
                summaryCards[3]
                    .querySelector(
                        "h2"
                    );


            if (value) {

                value.textContent =
                    pinned;

            }

        }

    }


    /*=========================================
      NOTIFICATION BUTTON
    =========================================*/

    const notificationBtn =
        document.querySelector(
            ".notification-btn"
        );


    if (notificationBtn) {

        notificationBtn.addEventListener(
            "click",
            function () {

                window.location.href =
                    "notifications.html";

            }
        );

    }


    /*=========================================
      LOGOUT
    =========================================*/

    const logout =
        document.querySelector(
            ".logout a"
        );


    if (logout) {

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



                } catch (error) {

                    console.error(
                        "Logout error:",
                        error
                    );


                    alert(
                        "Unable to logout.\n\n" +
                        error.message
                    );

                }

            }
        );

    }


    /*=========================================
      HELPERS
    =========================================*/

    function formatAudience(
        value
    ) {

        const map = {

            all:
                "All Users",

            applicants:
                "Applicants Only",

            scholars:
                "Scholars Only",

            admins:
                "Administrators Only"

        };


        return (
            map[value] ||
            value ||
            "All Users"
        );

    }


    function capitalize(
        value
    ) {

        if (!value) {

            return "";

        }


        const text =
            String(value);


        return (
            text
                .charAt(0)
                .toUpperCase() +
            text
                .slice(1)
        );

    }


    function formatDate(
        value
    ) {

        if (!value) {

            return "-";

        }


        let date;


        if (
            typeof value ===
                "object" &&
            value?.toDate
        ) {

            date =
                value.toDate();

        } else {

            date =
                new Date(value);

        }


        if (
            isNaN(
                date.getTime()
            )
        ) {

            return String(
                value
            );

        }


        return date.toLocaleDateString(
            "en-US",
            {

                month:
                    "long",

                day:
                    "2-digit",

                year:
                    "numeric"

            }
        );

    }


    function getDateValue(
        value
    ) {

        if (!value) {

            return 0;

        }


        if (
            typeof value ===
                "object" &&
            value?.toDate
        ) {

            return value
                .toDate()
                .getTime();

        }


        const date =
            new Date(value);


        if (
            isNaN(
                date.getTime()
            )
        ) {

            return 0;

        }


        return date.getTime();

    }


    function escapeHTML(
        value
    ) {

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


    /*=========================================
      CARD ANIMATION
    =========================================*/

    const cards =
        document.querySelectorAll(
            ".summary-card, .form-card, .list-card"
        );


    cards.forEach(
        function (card, index) {

            card.style.opacity =
                "0";


            card.style.transform =
                "translateY(20px)";


            setTimeout(
                function () {

                    card.style.transition =
                        "0.5s ease";


                    card.style.opacity =
                        "1";


                    card.style.transform =
                        "translateY(0)";

                },
                index * 120
            );

        }
    );


    console.log(
        "ScholarLink Admin Announcements Ready"
    );

});
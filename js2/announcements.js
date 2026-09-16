/*=========================================
  SCHOLARLINK
  SCHOLAR ANNOUNCEMENTS
  FIRESTORE CONNECTED
=========================================*/

import { auth, db } from "../firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
    collection,
    getDocs,
    getDoc,
    doc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";


document.addEventListener("DOMContentLoaded", function () {

    console.log("Scholar Announcements Loaded");


    /*=========================================
      ELEMENTS
    =========================================*/

    const searchInput =
        document.getElementById("announcementSearch");

    const announcementList =
        document.getElementById("announcementList");

    const historyBody =
        document.getElementById("announcementHistory");

    const pinnedBox =
        document.getElementById("pinnedAnnouncement");

    const pinnedTitle =
        document.getElementById("pinnedTitle");

    const pinnedMessage =
        document.getElementById("pinnedMessage");

    const pinnedDate =
        document.getElementById("pinnedDate");

    const profileName =
        document.getElementById("profileName");

    const scholarId =
        document.getElementById("scholarId");

    const profileAvatar =
        document.getElementById("profileAvatar");


    let announcements = [];


    /*=========================================
      AUTH CHECK
    =========================================*/

    onAuthStateChanged(
        auth,
        async function (user) {

            if (!user) {

                console.log(
                    "No logged-in scholar."
                );

                window.location.href =
                    "../index.html";

                return;

            }


            console.log(
                "Scholar UID:",
                user.uid
            );


            try {

                /*--------------------------------
                  GET USER
                --------------------------------*/

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

                    throw new Error(
                        "User profile not found."
                    );

                }


                const userData =
                    userSnap.data();


                console.log(
                    "Scholar user data:",
                    userData
                );


                /*
                  Make sure this account is
                  actually a scholar.
                */

                const role =
                    String(
                        userData.role || ""
                    ).toLowerCase();


                const isScholar =
                    role === "scholar" ||
                    userData.scholarConfirmed === true ||
                    userData.scholarStatus === "active";


                if (!isScholar) {

                    alert(
                        "Your account is not authorized for the scholar portal."
                    );

                    return;

                }


                /*--------------------------------
                  DISPLAY PROFILE
                --------------------------------*/

                displayProfile(
                    userData
                );


                /*--------------------------------
                  LOAD ANNOUNCEMENTS
                --------------------------------*/

                await loadAnnouncements(
                    user.uid
                );


            } catch (error) {

                console.error(
                    "Scholar announcement error:",
                    error
                );


                showLoadError(
                    error
                );

            }

        }
    );


    /*=========================================
      LOAD ANNOUNCEMENTS
    =========================================*/

    async function loadAnnouncements(
        uid
    ) {

        try {

            console.log(
                "Loading announcements..."
            );


            /*
              IMPORTANT:
              We intentionally DO NOT use
              orderBy("createdAt") here.

              This prevents errors when an
              old announcement has no createdAt.
            */

            const snapshot =
                await getDocs(
                    collection(
                        db,
                        "announcements"
                    )
                );


            console.log(
                "Total announcements in Firestore:",
                snapshot.size
            );


            announcements = [];


            snapshot.forEach(
                function (docSnap) {

                    const data =
                        docSnap.data();


                    const audience =
                        String(
                            data.audience ||
                            "all"
                        )
                        .toLowerCase()
                        .trim();


                    /*
                      Scholar can receive:

                      all
                      scholars
                      scholar
                      everyone
                      all_scholars
                      approved_scholars
                      approved_scholars_only
                    */

                                const isForScholar =
                    audience === "all" ||
                    audience === "everyone" ||
                    audience === "scholar" ||
                    audience === "scholars" ||
                    audience === "all_scholars" ||
                    audience === "approved_scholar" ||
                    audience === "approved_scholars" ||
                    audience === "approved_scholars_only" ||
                    audience === "all users" ||
                    audience === "all_users" ||
                    audience.includes("scholar");


                if (!isForScholar) {
                    return;
                }


                    /*
                      Only published announcements
                      should appear.
                    */

                    const status =
                    String(
                        data.status || ""
                    )
                    .toLowerCase()
                    .trim();


                const isPublished =
                    status === "" ||
                    status === "published" ||
                    status === "publish" ||
                    status === "active";


                if (!isPublished) {
                    return;
                }


                    /*
                      Check expiration date.
                    */

                    if (
                        data.expirationDate &&
                        isExpired(
                            data.expirationDate
                        )
                    ) {

                        return;

                    }


                    announcements.push({

                        id:
                            docSnap.id,

                        ...data

                    });

                }
            );


            /*
              Sort newest first.

              We use createdAt if available.
              Otherwise publishDate.
            */

            announcements.sort(
                function (a, b) {

                    return (
                        getDateValue(
                            b.createdAt ||
                            b.publishDate
                        ) -

                        getDateValue(
                            a.createdAt ||
                            a.publishDate
                        )
                    );

                }
            );


            console.log(
                "Scholar announcements:",
                announcements
            );


            renderAnnouncements();

            updateSummary();

            renderPinned();

            renderHistory();

            updateCategories();


        } catch (error) {

            console.error(
                "Unable to load announcements:",
                error
            );


            showLoadError(
                error
            );

        }

    }


    /*=========================================
      DISPLAY PROFILE
    =========================================*/

    function displayProfile(
        userData
    ) {

        const firstName =
            userData.firstName ||
            userData.personalInformation?.firstName ||
            "";


        const middleName =
            userData.middleName ||
            userData.personalInformation?.middleName ||
            "";


        const lastName =
            userData.lastName ||
            userData.personalInformation?.lastName ||
            "";


        let fullName =
            userData.fullName ||
            userData.name ||
            "";


        if (!fullName) {

            fullName = [

                firstName,
                middleName,
                lastName

            ]
            .filter(Boolean)
            .join(" ");

        }


        if (profileName) {

            profileName.textContent =
                fullName ||
                "Scholar";

        }


        const savedScholarId =
            userData.scholarId ||
            userData.scholarID ||
            userData.applicantId ||
            "Scholar";


        if (scholarId) {

            scholarId.textContent =
                savedScholarId;

        }


        const photo =
            userData.photoURL ||
            userData.photoUrl ||
            userData.photo ||
            userData.profilePhoto ||
            userData.profileImage;


        if (
            photo &&
            profileAvatar
        ) {

            profileAvatar.src =
                photo;

        }

    }


    /*=========================================
      RENDER LATEST ANNOUNCEMENTS
    =========================================*/

    function renderAnnouncements() {

        if (!announcementList) {

            return;

        }


        const keyword =
            searchInput?.value
                ?.toLowerCase()
                .trim() || "";


        const filtered =
            announcements.filter(
                function (item) {

                    const title =
                        String(
                            item.title ||
                            ""
                        ).toLowerCase();


                    const content =
                        String(
                            item.content ||
                            ""
                        ).toLowerCase();


                    return (
                        !keyword ||
                        title.includes(
                            keyword
                        ) ||
                        content.includes(
                            keyword
                        )
                    );

                }
            );


        if (
            filtered.length ===
            0
        ) {

            announcementList.innerHTML = `

                <div class="announcement-card">

                    <div
                        style="
                            text-align:center;
                            padding:35px;
                        "
                    >

                        <i
                            class="fas fa-bullhorn"
                            style="
                                font-size:35px;
                                margin-bottom:15px;
                            "
                        ></i>

                        <h2>
                            No Announcements
                        </h2>

                        <p>
                            There are no announcements
                            available for you at this time.
                        </p>

                    </div>

                </div>

            `;

            return;

        }


        announcementList.innerHTML =
            filtered.map(
                function (item) {

                    const priority =
                        String(
                            item.priority ||
                            "normal"
                        ).toLowerCase();


                    const priorityText =
                        capitalize(
                            priority
                        );


                    return `

                        <article
                            class="announcement-card"
                            data-id="${escapeHTML(
                                item.id
                            )}"
                        >

                            <div
                                class="announcement-header"
                            >

                                <span
                                    class="badge"
                                >
                                    ${priority === "urgent"
                                        ? "🚨 URGENT"
                                        : priority === "important"
                                            ? "⚠️ IMPORTANT"
                                            : "📢 ANNOUNCEMENT"
                                    }
                                </span>


                                <small>

                                    ${formatDate(
                                        item.publishDate ||
                                        item.createdAt
                                    )}

                                </small>

                            </div>


                            <h2>

                                ${escapeHTML(
                                    item.title ||
                                    "Untitled Announcement"
                                )}

                            </h2>


                            <p>

                                ${escapeHTML(
                                    item.content ||
                                    ""
                                )}

                            </p>


                            <div
                                class="announcement-meta"
                            >

                                ${
                                    item.time
                                        ? `
                                            <span>
                                                <i class="fas fa-clock"></i>
                                                ${escapeHTML(
                                                    item.time
                                                )}
                                            </span>
                                          `
                                        : ""
                                }


                                ${
                                    item.venue
                                        ? `
                                            <span>
                                                <i class="fas fa-location-dot"></i>
                                                ${escapeHTML(
                                                    item.venue
                                                )}
                                            </span>
                                          `
                                        : ""
                                }


                                <span>

                                    <i
                                        class="fas fa-flag"
                                    ></i>

                                    ${priorityText}

                                </span>

                            </div>


                            <button
                                type="button"
                                class="read-btn"
                                data-id="${escapeHTML(
                                    item.id
                                )}"
                            >

                                Read More

                            </button>

                        </article>

                    `;

                }
            )
            .join("");


        /*
          Read more buttons
        */

        document
            .querySelectorAll(
                ".read-btn"
            )
            .forEach(
                function (button) {

                    button.addEventListener(
                        "click",
                        function () {

                            showAnnouncement(
                                button.dataset.id
                            );

                        }
                    );

                }
            );

    }


    /*=========================================
      PINNED ANNOUNCEMENT
    =========================================*/

    function renderPinned() {

        if (!pinnedBox) {

            return;

        }


        const pinned =
            announcements.find(
                function (item) {

                    return (
                        item.pinned ===
                        true
                    );

                }
            );


        if (!pinned) {

            pinnedBox.style.display =
                "none";

            return;

        }


        pinnedBox.style.display =
            "block";


        if (pinnedTitle) {

            pinnedTitle.textContent =
                pinned.title ||
                "Announcement";

        }


        if (pinnedMessage) {

            pinnedMessage.textContent =
                pinned.content ||
                "";

        }


        if (pinnedDate) {

            pinnedDate.textContent =
                formatDate(
                    pinned.publishDate ||
                    pinned.createdAt
                );

        }

    }


    /*=========================================
      HISTORY
    =========================================*/

    function renderHistory() {

        if (!historyBody) {

            return;

        }


        if (
            announcements.length ===
            0
        ) {

            historyBody.innerHTML = `

                <tr>

                    <td
                        colspan="4"
                        style="
                            text-align:center;
                            padding:25px;
                        "
                    >

                        No announcement history.

                    </td>

                </tr>

            `;

            return;

        }


        historyBody.innerHTML =
            announcements.map(
                function (item) {

                    return `

                        <tr>

                            <td>

                                ${formatDate(
                                    item.publishDate ||
                                    item.createdAt
                                )}

                            </td>


                            <td>

                                ${escapeHTML(
                                    item.title ||
                                    "Untitled"
                                )}

                            </td>


                            <td>

                                ${formatAudience(
                                    item.audience
                                )}

                            </td>


                            <td>

                                <span>

                                    Published

                                </span>

                            </td>

                        </tr>

                    `;

                }
            )
            .join("");

    }


    /*=========================================
      SUMMARY
    =========================================*/

    function updateSummary() {

        const total =
            announcements.length;


        const pinned =
            announcements.filter(
                function (item) {

                    return (
                        item.pinned ===
                        true
                    );

                }
            ).length;


        const currentMonth =
            new Date().getMonth();


        const currentYear =
            new Date().getFullYear();


        const thisMonth =
            announcements.filter(
                function (item) {

                    const value =
                        item.publishDate ||
                        item.createdAt;


                    const date =
                        getDateObject(
                            value
                        );


                    return (
                        date &&
                        date.getMonth() ===
                            currentMonth &&
                        date.getFullYear() ===
                            currentYear
                    );

                }
            ).length;


        const unread =
            getUnreadCount();


        setText(
            "totalAnnouncements",
            total
        );


        setText(
            "pinnedAnnouncements",
            pinned
        );


        setText(
            "unreadAnnouncements",
            unread
        );


        setText(
            "monthAnnouncements",
            thisMonth
        );

    }


    /*=========================================
      UNREAD
    =========================================*/

    function getUnreadCount() {

        const readIds =
            JSON.parse(
                localStorage.getItem(
                    "scholarReadAnnouncements"
                ) || "[]"
            );


        return announcements.filter(
            function (item) {

                return !readIds.includes(
                    item.id
                );

            }
        ).length;

    }


    /*=========================================
      READ ANNOUNCEMENT
    =========================================*/

    function showAnnouncement(id) {

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


        markAsRead(
            item.id
        );


        alert(

            "ANNOUNCEMENT\n\n" +

            (
                item.title ||
                "Untitled"
            ) +

            "\n\n" +

            (
                item.content ||
                ""
            ) +

            "\n\nDate: " +

            formatDate(
                item.publishDate ||
                item.createdAt
            ) +

            (
                item.time
                    ? "\nTime: " +
                      item.time
                    : ""
            ) +

            (
                item.venue
                    ? "\nVenue: " +
                      item.venue
                    : ""
            )

        );


        updateSummary();

    }


    /*=========================================
      MARK AS READ
    =========================================*/

    function markAsRead(id) {

        const key =
            "scholarReadAnnouncements";


        const existing =
            JSON.parse(
                localStorage.getItem(
                    key
                ) || "[]"
            );


        if (
            !existing.includes(
                id
            )
        ) {

            existing.push(
                id
            );

        }


        localStorage.setItem(
            key,
            JSON.stringify(
                existing
            )
        );

    }


    /*=========================================
      CATEGORIES
    =========================================*/

    function updateCategories() {

        let general = 0;

        let events = 0;

        let scholarship = 0;

        let documents = 0;


        announcements.forEach(
            function (item) {

                const category =
                    String(
                        item.category ||
                        ""
                    ).toLowerCase();


                if (
                    category.includes(
                        "event"
                    )
                ) {

                    events++;

                } else if (
                    category.includes(
                        "scholarship"
                    )
                ) {

                    scholarship++;

                } else if (
                    category.includes(
                        "document"
                    )
                ) {

                    documents++;

                } else {

                    general++;

                }

            }
        );


        setText(
            "generalCount",
            general +
            " Announcements"
        );


        setText(
            "eventCount",
            events +
            " Announcements"
        );


        setText(
            "scholarshipCount",
            scholarship +
            " Announcements"
        );


        setText(
            "documentCount",
            documents +
            " Announcements"
        );

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
  SCHOLAR LOGOUT MODAL
=========================================*/

const logoutLink =
    document.getElementById("sidebarlogout");

const logoutModal =
    document.getElementById("logoutModal");

const cancelLogout =
    document.getElementById("cancelLogout");

const confirmLogout =
    document.getElementById("confirmLogout");


/*=========================================
  OPEN LOGOUT MODAL
=========================================*/

if (logoutLink && logoutModal) {

    logoutLink.addEventListener(
        "click",
        function (event) {

            event.preventDefault();

            logoutModal.classList.add(
                "active"
            );

            document.body.style.overflow =
                "hidden";

        }
    );

}


/*=========================================
  CANCEL LOGOUT
=========================================*/

if (cancelLogout && logoutModal) {

    cancelLogout.addEventListener(
        "click",
        function () {

            logoutModal.classList.remove(
                "active"
            );

            document.body.style.overflow =
                "";

        }
    );

}


/*=========================================
  CLOSE WHEN CLICKING OVERLAY
=========================================*/

if (logoutModal) {

    logoutModal.addEventListener(
        "click",
        function (event) {

            if (
                event.target === logoutModal ||
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


/*=========================================
  CONFIRM LOGOUT
=========================================*/

if (confirmLogout && logoutModal) {

    confirmLogout.addEventListener(
        "click",
        async function () {

            try {

                /* Prevent double click */

                confirmLogout.disabled =
                    true;

                confirmLogout.classList.add(
                    "loading"
                );

                confirmLogout.textContent =
                    "Logging out...";


                /*--------------------------------
                  FIREBASE SIGN OUT
                --------------------------------*/

                await signOut(auth);


                /*--------------------------------
                  CLEAR TEMPORARY DATA
                --------------------------------*/

                localStorage.clear();

                sessionStorage.clear();


                /*--------------------------------
                  REDIRECT TO INDEX
                --------------------------------*/

               window.location.href =
                        "../login/index.html";


            } catch (error) {

                console.error(
                    "Logout error:",
                    error
                );


                /* Restore button */

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

    /*=========================================
      HELPERS
    =========================================*/

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


    function capitalize(
        value
    ) {

        if (!value) {

            return "";

        }


        const text =
            String(value);


        return (
            text.charAt(0)
                .toUpperCase() +
            text.slice(1)
        );

    }


    function formatAudience(
        value
    ) {

        const map = {

            all:
                "All Users",

            everyone:
                "Everyone",

            scholar:
                "Scholar",

            scholars:
                "Scholars",

            all_scholars:
                "All Scholars",

            approved_scholars:
                "Approved Scholars",

            approved_scholars_only:
                "Approved Scholars"

        };


        return (
            map[value] ||
            value ||
            "All Users"
        );

    }


    function getDateObject(
        value
    ) {

        if (!value) {

            return null;

        }


        if (
            typeof value ===
                "object" &&
            value?.toDate
        ) {

            return value.toDate();

        }


        const date =
            new Date(value);


        if (
            isNaN(
                date.getTime()
            )
        ) {

            return null;

        }


        return date;

    }


    function getDateValue(
        value
    ) {

        const date =
            getDateObject(
                value
            );


        return date
            ? date.getTime()
            : 0;

    }


    function formatDate(
        value
    ) {

        const date =
            getDateObject(
                value
            );


        if (!date) {

            return "-";

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


    function isExpired(
        value
    ) {

        const date =
            getDateObject(
                value
            );


        if (!date) {

            return false;

        }


        /*
          Expiration date is treated as
          valid until the end of that day.
        */

        date.setHours(
            23,
            59,
            59,
            999
        );


        return (
            new Date() >
            date
        );

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


    function showLoadError(
        error
    ) {

        console.error(
            "Scholar announcements failed:",
            error
        );


        if (announcementList) {

            announcementList.innerHTML = `

                <div
                    class="announcement-card"
                >

                    <h2>
                        Unable to Load Announcements
                    </h2>

                    <p>
                        Unable to load announcements.
                    </p>

                </div>

            `;

        }

    }


    console.log(
        "ScholarLink Announcements Ready"
    );

});
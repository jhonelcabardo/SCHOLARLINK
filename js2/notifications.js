/*=========================================
  SCHOLARLINK
  NOTIFICATIONS MODULE
=========================================*/


/*=========================================
  FIREBASE IMPORT
=========================================*/

import { auth } from "../firebase.js";

import {
    signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";


/*=========================================
  DOM CONTENT LOADED
=========================================*/

document.addEventListener("DOMContentLoaded", () => {


    console.log("Notifications Module Loaded");


    /*=========================================
      SEARCH NOTIFICATIONS
    =========================================*/

    const searchInput =
        document.querySelector(".search-box input");

    const notifications =
        document.querySelectorAll(".notification-card");


    if (searchInput) {


        searchInput.addEventListener("keyup", () => {


            const keyword =
                searchInput.value
                    .toLowerCase()
                    .trim();


            notifications.forEach(card => {


                const text =
                    card.textContent
                        .toLowerCase();


                if (text.includes(keyword)) {

                    card.style.display = "flex";

                }

                else {

                    card.style.display = "none";

                }


            });


        });


    }


    /*=========================================
      FILTER BUTTONS
    =========================================*/

    const filterButtons =
        document.querySelectorAll(
            ".filter-buttons button"
        );


    filterButtons.forEach(button => {


        button.addEventListener("click", () => {


            /* Remove active from all */

            filterButtons.forEach(btn => {

                btn.classList.remove(
                    "active-filter"
                );

            });


            /* Add active to clicked button */

            button.classList.add(
                "active-filter"
            );


            const filter =
                button.textContent
                    .trim()
                    .toLowerCase();


            notifications.forEach(card => {


                const text =
                    card.textContent
                        .toLowerCase();


                /*=================================
                  ALL
                =================================*/

                if (filter === "all") {

                    card.style.display = "flex";

                }


                /*=================================
                  UNREAD
                =================================*/

                else if (filter === "unread") {


                    if (
                        card.classList.contains(
                            "unread"
                        )
                    ) {

                        card.style.display = "flex";

                    }

                    else {

                        card.style.display = "none";

                    }


                }


                /*=================================
                  OTHER CATEGORIES
                =================================*/

                else {


                    if (
                        text.includes(filter)
                    ) {

                        card.style.display = "flex";

                    }

                    else {

                        card.style.display = "none";

                    }


                }


            });


        });


    });


    /*=========================================
      VIEW NOTIFICATION
    =========================================*/

    const viewButtons =
        document.querySelectorAll(
            ".view-btn"
        );


    viewButtons.forEach(button => {


        button.addEventListener("click", () => {


            const card =
                button.closest(
                    ".notification-card"
                );


            if (!card) return;


            const titleElement =
                card.querySelector("h3");


            const messageElement =
                card.querySelector("p");


            const title =
                titleElement
                    ? titleElement.textContent.trim()
                    : "Notification";


            const message =
                messageElement
                    ? messageElement.textContent.trim()
                    : "";


            alert(
                title +
                "\n\n" +
                message
            );


        });


    });


    /*=========================================
      MARK AS READ
    =========================================*/

    const readButtons =
        document.querySelectorAll(
            ".read-btn"
        );


    readButtons.forEach(button => {


        button.addEventListener("click", () => {


            const card =
                button.closest(
                    ".notification-card"
                );


            if (!card) return;


            /* Remove unread class */

            card.classList.remove(
                "unread"
            );


            /* Remove button */

            button.remove();


            alert(
                "Notification marked as read."
            );


        });


    });


    /*=========================================
      DELETE NOTIFICATION
    =========================================*/

    const deleteButtons =
        document.querySelectorAll(
            ".delete-btn"
        );


    deleteButtons.forEach(button => {


        button.addEventListener("click", () => {


            const confirmed =
                confirm(
                    "Delete this notification?"
                );


            if (!confirmed) return;


            const card =
                button.closest(
                    ".notification-card"
                );


            if (card) {

                card.remove();

            }


        });


    });


    /*=========================================
      MARK ALL AS READ
    =========================================*/

    const markAllBtn =
        document.querySelector(
            ".btn-primary"
        );


    if (markAllBtn) {


        markAllBtn.addEventListener(
            "click",
            () => {


                /* Remove unread status */

                document
                    .querySelectorAll(
                        ".notification-card.unread"
                    )
                    .forEach(card => {

                        card.classList.remove(
                            "unread"
                        );

                    });


                /* Remove individual read buttons */

                document
                    .querySelectorAll(
                        ".read-btn"
                    )
                    .forEach(btn => {

                        btn.remove();

                    });


                alert(
                    "All notifications marked as read."
                );


            }
        );


    }


    /*=========================================
      DELETE ALL NOTIFICATIONS
    =========================================*/

    const deleteAllBtn =
        document.querySelector(
            ".btn-danger"
        );


    if (deleteAllBtn) {


        deleteAllBtn.addEventListener(
            "click",
            () => {


                const confirmed =
                    confirm(
                        "Delete all notifications?"
                    );


                if (!confirmed) return;


                const notificationList =
                    document.querySelector(
                        ".notification-list"
                    );


                if (notificationList) {

                    notificationList.innerHTML = "";

                }


            }
        );


    }


    /*=========================================
      CARD ANIMATION
    =========================================*/

    const cards =
        document.querySelectorAll(
            ".summary-card, " +
            ".notification-card, " +
            ".card"
        );


    cards.forEach((card, index) => {


        card.style.opacity = "0";

        card.style.transform =
            "translateY(20px)";


        setTimeout(() => {


            card.style.transition =
                ".5s";


            card.style.opacity =
                "1";


            card.style.transform =
                "translateY(0)";


        }, index * 120);


    });


    /*=========================================
      TABLE HOVER
    =========================================*/

    const rows =
        document.querySelectorAll(
            ".history-table tbody tr"
        );


    rows.forEach(row => {


        row.addEventListener(
            "mouseenter",
            () => {


                row.style.background =
                    "#EEF5FF";


            }
        );


        row.addEventListener(
            "mouseleave",
            () => {


                row.style.background =
                    "";


            }
        );


    });


    /*=========================================
      ACTIVE SIDEBAR
    =========================================*/

    const menuItems =
        document.querySelectorAll(
            ".menu li"
        );


    menuItems.forEach(item => {


        item.addEventListener(
            "click",
            () => {


                menuItems.forEach(menu => {

                    menu.classList.remove(
                        "active"
                    );

                });


                item.classList.add(
                    "active"
                );


            }
        );


    });


    /*=========================================
      LOGOUT MODAL ELEMENTS
    =========================================*/

    const logoutLink =
        document.getElementById(
            "sidebarlogout"
        );


    const logoutModal =
        document.getElementById(
            "logoutModal"
        );


    const cancelLogout =
        document.getElementById(
            "cancelLogout"
        );


    const confirmLogout =
        document.getElementById(
            "confirmLogout"
        );


    /*=========================================
      CHECK LOGOUT ELEMENTS
    =========================================*/

    console.log(
        "Logout Link:",
        logoutLink
    );

    console.log(
        "Logout Modal:",
        logoutModal
    );

    console.log(
        "Cancel Button:",
        cancelLogout
    );

    console.log(
        "Confirm Button:",
        confirmLogout
    );


    /*=========================================
      OPEN LOGOUT MODAL
    =========================================*/

    if (
        logoutLink &&
        logoutModal
    ) {


        logoutLink.addEventListener(
            "click",
            event => {


                /* Stop href navigation */

                event.preventDefault();


                /* Show modal */

                logoutModal.classList.add(
                    "active"
                );


                console.log(
                    "Logout confirmation opened."
                );


            }
        );


    }


    /*=========================================
      CANCEL LOGOUT
    =========================================*/

    if (
        cancelLogout &&
        logoutModal
    ) {


        cancelLogout.addEventListener(
            "click",
            () => {


                logoutModal.classList.remove(
                    "active"
                );


                console.log(
                    "Logout cancelled."
                );


            }
        );


    }


    /*=========================================
      CLICK OUTSIDE MODAL
    =========================================*/

    if (logoutModal) {


        logoutModal.addEventListener(
            "click",
            event => {


                if (
                    event.target ===
                    logoutModal
                ) {


                    logoutModal.classList.remove(
                        "active"
                    );


                }


            }
        );


    }


    /*=========================================
      ESC KEY CLOSE MODAL
    =========================================*/

    document.addEventListener(
        "keydown",
        event => {


            if (
                event.key === "Escape" &&
                logoutModal &&
                logoutModal.classList.contains(
                    "active"
                )
            ) {


                logoutModal.classList.remove(
                    "active"
                );


            }


        }
    );


    /*=========================================
      CONFIRM LOGOUT
    =========================================*/

    if (confirmLogout) {


        confirmLogout.addEventListener(
            "click",
            async () => {


                console.log(
                    "Confirm Logout clicked."
                );


                try {


                    /*=================================
                      DISABLE BUTTON
                    =================================*/

                    confirmLogout.disabled =
                        true;


                    confirmLogout.textContent =
                        "Logging out...";


                    /*=================================
                      CLOSE OTHER INTERACTIONS
                    =================================*/

                    if (cancelLogout) {

                        cancelLogout.disabled =
                            true;

                    }


                    /*=================================
                      FIREBASE SIGN OUT
                    =================================*/

                    await signOut(auth);


                    console.log(
                        "Firebase logout successful."
                    );


                    /*=================================
                      REDIRECT TO LOGIN
                    =================================*/

                    window.location.href =
                        "../login/index.html";


                }

                catch (error) {


                    console.error(
                        "Logout Error:",
                        error
                    );


                    /* Re-enable buttons */

                    confirmLogout.disabled =
                        false;


                    confirmLogout.textContent =
                        "Logout";


                    if (cancelLogout) {

                        cancelLogout.disabled =
                            false;

                    }


                    /* Error message */

                    alert(
                        "Unable to logout. " +
                        "Please try again."
                    );


                }


            }
        );


    }


});
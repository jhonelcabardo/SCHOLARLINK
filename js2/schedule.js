/*=========================================
  SCHOLARLINK
  SCHEDULE MODULE
==========================================*/

import { auth } from "../firebase.js";

import {
    signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";


document.addEventListener("DOMContentLoaded", () => {

    console.log("Schedule Module Loaded");


    /*=========================================
      CARD ANIMATION
    =========================================*/

    const cards = document.querySelectorAll(
        ".summary-card, .card, .calendar-date, .reminder-item"
    );

    cards.forEach((card, index) => {

        card.style.opacity = "0";
        card.style.transform = "translateY(20px)";

        setTimeout(() => {

            card.style.transition = ".5s";

            card.style.opacity = "1";
            card.style.transform = "translateY(0)";

        }, index * 100);

    });


    /*=========================================
      CALENDAR CLICK
    =========================================*/

    const dates = document.querySelectorAll(
        ".calendar-date"
    );

    dates.forEach(date => {

        if (!date.classList.contains("empty")) {

            date.addEventListener("click", () => {

                dates.forEach(d => {

                    d.style.outline = "";

                });

                date.style.outline =
                    "3px solid #2F80ED";

            });

        }

    });


    /*=========================================
      REMINDER CLICK
    =========================================*/

    const reminders =
        document.querySelectorAll(
            ".reminder-item"
        );

    reminders.forEach(item => {

        item.addEventListener("click", () => {

            const titleElement =
                item.querySelector("h4");

            if (!titleElement) {
                return;
            }

            const title =
                titleElement.textContent.trim();

            alert(
                "Reminder:\n\n" + title
            );

        });

    });


    /*=========================================
      TIMELINE ANIMATION
    =========================================*/

    const timeline =
        document.querySelectorAll(
            ".timeline-item"
        );

    timeline.forEach((item, index) => {

        item.style.opacity = "0";
        item.style.transform =
            "translateX(-20px)";

        setTimeout(() => {

            item.style.transition = ".5s";

            item.style.opacity = "1";
            item.style.transform =
                "translateX(0)";

        }, index * 200);

    });


    /*=========================================
      PRINT BUTTON
    =========================================*/

    const printButton =
        document.querySelector(".btn-success");

    if (printButton) {

        printButton.addEventListener(
            "click",
            () => {

                window.print();

            }
        );

    }


    /*=========================================
      EXPORT BUTTON
    =========================================*/

    const exportButton =
        document.querySelector(".btn-primary");

    if (exportButton) {

        exportButton.addEventListener(
            "click",
            () => {

                alert(
                    "Schedule exported successfully!"
                );

            }
        );

    }


    /*=========================================
      TABLE HOVER EFFECT
    =========================================*/

    const rows =
        document.querySelectorAll("tbody tr");

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

                row.style.background = "";

            }
        );

    });


    /*=========================================
      ACTIVE SIDEBAR
    =========================================*/

    const menuItems =
        document.querySelectorAll(".menu li");

    const currentPage =
        window.location.pathname
            .split("/")
            .pop()
            .toLowerCase();


    menuItems.forEach(item => {

        const link =
            item.querySelector("a");

        if (!link) {
            return;
        }

        const href =
            link.getAttribute("href");

        if (!href) {
            return;
        }

        const linkPage =
            href
                .split("/")
                .pop()
                .split("?")[0]
                .toLowerCase();


        item.classList.remove("active");


        if (
            linkPage &&
            linkPage === currentPage
        ) {

            item.classList.add("active");

        }


        link.addEventListener(
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
      TODAY'S DATE HIGHLIGHT
    =========================================*/

    const today =
        new Date().getDate();

    dates.forEach(date => {

        if (
            date.classList.contains("empty")
        ) {
            return;
        }

        const text =
            date.textContent.trim();

        /*
         * Get only the first number from
         * calendar date.
         */
        const firstNumber =
            text.match(/^\d+/);

        if (
            firstNumber &&
            Number(firstNumber[0]) === today
        ) {

            date.style.background =
                "#2F80ED";

            date.style.color =
                "#fff";

            date.style.fontWeight =
                "bold";

        }

    });


    /*=========================================
      COORDINATOR CARD HOVER
    =========================================*/

    const coordinator =
        document.querySelector(
            ".coordinator"
        );

    if (coordinator) {

        coordinator.addEventListener(
            "mouseenter",
            () => {

                coordinator.style.transform =
                    "translateY(-5px)";

                coordinator.style.transition =
                    ".3s";

            }
        );

        coordinator.addEventListener(
            "mouseleave",
            () => {

                coordinator.style.transform =
                    "translateY(0)";

            }
        );

    }


    /*=========================================
      LOGOUT
    =========================================*/

    setupLogout();

});


/*=========================================
  LOGOUT FUNCTION
==========================================*/

function setupLogout() {

    console.log(
        "Initializing Schedule logout..."
    );


    /*-----------------------------------------
      GET ELEMENTS
    ------------------------------------------*/

    const logoutButton =
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


    /*-----------------------------------------
      DEBUG
    ------------------------------------------*/

    console.log(
        "Logout button:",
        logoutButton
    );

    console.log(
        "Logout modal:",
        logoutModal
    );

    console.log(
        "Cancel logout:",
        cancelLogout
    );

    console.log(
        "Confirm logout:",
        confirmLogout
    );


    /*-----------------------------------------
      CHECK ELEMENTS
    ------------------------------------------*/

    if (!logoutButton) {

        console.error(
            "ERROR: #sidebarlogout not found."
        );

        return;

    }


    if (!logoutModal) {

        console.error(
            "ERROR: #logoutModal not found."
        );

        return;

    }


    if (!cancelLogout) {

        console.error(
            "ERROR: #cancelLogout not found."
        );

        return;

    }


    if (!confirmLogout) {

        console.error(
            "ERROR: #confirmLogout not found."
        );

        return;

    }


    /*-----------------------------------------
      OPEN LOGOUT MODAL
    ------------------------------------------*/

    logoutButton.addEventListener(
        "click",
        event => {

            event.preventDefault();
            event.stopPropagation();

            console.log(
                "Logout clicked."
            );

            logoutModal.classList.add(
                "show"
            );

            document.body.classList.add(
                "modal-open"
            );

        }
    );


    /*-----------------------------------------
      CANCEL
    ------------------------------------------*/

    cancelLogout.addEventListener(
        "click",
        event => {

            event.preventDefault();
            event.stopPropagation();

            closeLogoutModal();

        }
    );


    /*-----------------------------------------
      CONFIRM LOGOUT
    ------------------------------------------*/

    confirmLogout.addEventListener(
        "click",
        async event => {

            event.preventDefault();
            event.stopPropagation();


            console.log(
                "Confirming logout..."
            );


            /* Disable button */
            confirmLogout.disabled = true;


            const originalText =
                confirmLogout.innerHTML;


            confirmLogout.innerHTML =
                '<i class="fas fa-spinner fa-spin"></i> Logging out...';


            try {

                /*---------------------------------
                  FIREBASE SIGN OUT
                ----------------------------------*/

                await signOut(auth);


                console.log(
                    "Firebase logout successful."
                );


                /*---------------------------------
                  CLEAR LOCAL STORAGE
                ----------------------------------*/

                try {

                    localStorage.removeItem(
                        "user"
                    );

                    localStorage.removeItem(
                        "uid"
                    );

                    localStorage.removeItem(
                        "userRole"
                    );

                    localStorage.removeItem(
                        "scholarId"
                    );

                    localStorage.removeItem(
                        "applicantId"
                    );

                    localStorage.removeItem(
                        "currentUser"
                    );

                    localStorage.removeItem(
                        "currentScholar"
                    );

                    localStorage.removeItem(
                        "currentApplicant"
                    );

                } catch (error) {

                    console.warn(
                        "LocalStorage cleanup warning:",
                        error
                    );

                }


                /*---------------------------------
                  CLEAR SESSION STORAGE
                ----------------------------------*/

                try {

                    sessionStorage.clear();

                } catch (error) {

                    console.warn(
                        "SessionStorage cleanup warning:",
                        error
                    );

                }


                /*---------------------------------
                  SUCCESS MESSAGE
                ----------------------------------*/

                const title =
                    document.getElementById(
                        "logoutTitle"
                    );

                const message =
                    document.getElementById(
                        "logoutMessage"
                    );


                if (title) {

                    title.textContent =
                        "Logged Out Successfully";

                }


                if (message) {

                    message.textContent =
                        "You have been safely logged out of your Scholar account.";

                }


                confirmLogout.innerHTML =
                    '<i class="fas fa-check"></i> Done';


                /*---------------------------------
                  REDIRECT
                ----------------------------------*/

                setTimeout(() => {

                    console.log(
                        "Redirecting to login..."
                    );

                    /*
                     * schedule.html is inside scholar folder.
                     *
                     * If login/index.html is one
                     * level above:
                     *
                     * ../login/index.html
                     */

                    window.location.replace(
                        "../login/index.html"
                    );

                }, 700);


            } catch (error) {

                console.error(
                    "Logout error:",
                    error
                );


                confirmLogout.disabled =
                    false;


                confirmLogout.innerHTML =
                    originalText;


                alert(
                    "Unable to logout.\n\n" +
                    "Please try again.\n\n" +
                    error.message
                );

            }

        }
    );


    /*-----------------------------------------
      CLICK OUTSIDE MODAL
    ------------------------------------------*/

    logoutModal.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                logoutModal
            ) {

                closeLogoutModal();

            }

        }
    );


    /*-----------------------------------------
      ESC KEY
    ------------------------------------------*/

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape" &&
                logoutModal.classList.contains(
                    "show"
                )
            ) {

                closeLogoutModal();

            }

        }
    );


    console.log(
        "Schedule logout initialized successfully."
    );
}


/*=========================================
  CLOSE LOGOUT MODAL
==========================================*/

function closeLogoutModal() {

    const logoutModal =
        document.getElementById(
            "logoutModal"
        );

    if (!logoutModal) {
        return;
    }


    logoutModal.classList.remove(
        "show"
    );

    document.body.classList.remove(
        "modal-open"
    );

}
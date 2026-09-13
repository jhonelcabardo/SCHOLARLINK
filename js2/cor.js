/*=========================================
  SCHOLARLINK
  SUBMIT COR
  cor.js
==========================================*/


import { auth } from "../firebase.js";


import {
    signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";


document.addEventListener(
    "DOMContentLoaded",
    () => {


        console.log(
            "Submit COR Loaded"
        );


        /*=========================================
          FILE INPUT
        =========================================*/


        const fileInput =
            document.querySelector(
                'input[type="file"]'
            );


        const uploadBtn =
            document.querySelector(
                ".upload-btn"
            );


        /*=========================================
          PDF VALIDATION
        =========================================*/


        if (fileInput) {


            fileInput.addEventListener(
                "change",
                function () {


                    const file =
                        this.files[0];


                    if (!file) {

                        return;

                    }


                    /* PDF ONLY */


                    if (
                        file.type !==
                        "application/pdf"
                    ) {


                        alert(
                            "Only PDF files are allowed."
                        );


                        this.value = "";


                        return;

                    }


                    /* MAXIMUM SIZE */


                    if (
                        file.size >
                        10 * 1024 * 1024
                    ) {


                        alert(
                            "Maximum file size is 10MB."
                        );


                        this.value = "";


                        return;

                    }


                    alert(
                        "Selected File:\n\n" +
                        file.name
                    );


                }
            );

        }


        /*=========================================
          UPLOAD COR
        =========================================*/


        if (uploadBtn) {


            uploadBtn.addEventListener(
                "click",
                () => {


                    if (
                        !fileInput ||
                        !fileInput.files.length
                    ) {


                        alert(
                            "Please select your COR PDF."
                        );


                        return;

                    }


                    alert(
                        "Certificate of Registration uploaded successfully!"
                    );


                }
            );

        }


        /*=========================================
          VIEW PDF
        =========================================*/


        const viewButtons =
            document.querySelectorAll(
                ".view-btn"
            );


        viewButtons.forEach(
            button => {


                button.addEventListener(
                    "click",
                    () => {


                        alert(
                            "Opening COR PDF..."
                        );


                    }
                );


            }
        );


        /*=========================================
          DOWNLOAD COR
        =========================================*/


        const primaryButtons =
            document.querySelectorAll(
                ".btn-primary"
            );


        primaryButtons.forEach(
            button => {


                button.addEventListener(
                    "click",
                    () => {


                        if (
                            button.textContent
                                .includes(
                                    "Download"
                                )
                        ) {


                            alert(
                                "Downloading COR..."
                            );


                        }


                    }
                );


            }
        );


        /*=========================================
          REPLACE FILE
        =========================================*/


        const replaceButton =
            document.querySelector(
                ".btn-warning"
            );


        if (replaceButton) {


            replaceButton.addEventListener(
                "click",
                () => {


                    if (fileInput) {


                        fileInput.click();


                    }


                }
            );


        }


        /*=========================================
          DELETE SUBMISSION
        =========================================*/


        const deleteButton =
            document.querySelector(
                ".btn-danger"
            );


        if (deleteButton) {


            deleteButton.addEventListener(
                "click",
                () => {


                    const confirmDelete =
                        confirm(
                            "Delete your uploaded COR?"
                        );


                    if (confirmDelete) {


                        if (fileInput) {


                            fileInput.value =
                                "";

                        }


                        alert(
                            "COR deleted successfully."
                        );


                    }


                }
            );


        }


        /*=========================================
          PRINT RECEIPT
        =========================================*/


        const printButton =
            document.querySelector(
                ".btn-success"
            );


        if (printButton) {


            printButton.addEventListener(
                "click",
                () => {


                    window.print();


                }
            );


        }


        /*=========================================
          CARD ANIMATION
        =========================================*/


        const cards =
            document.querySelectorAll(
                ".summary-card,.upload-card,.card"
            );


        cards.forEach(
            (card, index) => {


                card.style.opacity =
                    "0";


                card.style.transform =
                    "translateY(20px)";


                setTimeout(
                    () => {


                        card.style.transition =
                            ".5s";


                        card.style.opacity =
                            "1";


                        card.style.transform =
                            "translateY(0)";


                    },
                    index * 120
                );


            }
        );


        /*=========================================
          TABLE HOVER
        =========================================*/


        const rows =
            document.querySelectorAll(
                "tbody tr"
            );


        rows.forEach(
            row => {


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


            }
        );


        /*=========================================
          TIMELINE ANIMATION
        =========================================*/


        const timeline =
            document.querySelectorAll(
                ".timeline-item"
            );


        timeline.forEach(
            (item, index) => {


                item.style.opacity =
                    "0";


                item.style.transform =
                    "translateX(-20px)";


                setTimeout(
                    () => {


                        item.style.transition =
                            ".5s";


                        item.style.opacity =
                            "1";


                        item.style.transform =
                            "translateX(0)";


                    },
                    index * 200
                );


            }
        );


        /*=========================================
          ACTIVE SIDEBAR
        =========================================*/


        const menuItems =
            document.querySelectorAll(
                ".menu li"
            );


        menuItems.forEach(
            item => {


                item.addEventListener(
                    "click",
                    () => {


                        menuItems.forEach(
                            menu => {


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


        /*=========================================
          LOGOUT ELEMENTS
        =========================================*/


        const logoutLink =
            document.getElementById(
                "logoutLink"
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
          OPEN LOGOUT MODAL
        =========================================*/


        if (
            logoutLink &&
            logoutModal
        ) {


            logoutLink.addEventListener(
                "click",
                event => {


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


                    document.body.style.overflow =
                        "";


                }
            );


        }


        /*=========================================
          CLOSE MODAL BY CLICKING OVERLAY
        =========================================*/


        if (logoutModal) {


            logoutModal.addEventListener(
                "click",
                event => {


                    if (
                        event.target ===
                            logoutModal ||

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


        if (
            confirmLogout &&
            logoutModal
        ) {


            confirmLogout.addEventListener(
                "click",
                async () => {


                    try {


                        /*------------------------------
                          DISABLE BUTTON
                        ------------------------------*/


                        confirmLogout.disabled =
                            true;


                        confirmLogout.classList.add(
                            "loading"
                        );


                        confirmLogout.textContent =
                            "Logging out...";


                        /*------------------------------
                          FIREBASE SIGN OUT
                        ------------------------------*/


                        await signOut(
                            auth
                        );


                        /*------------------------------
                          CLEAR TEMPORARY DATA
                        ------------------------------*/


                        localStorage.clear();

                        sessionStorage.clear();


                        /*------------------------------
                          REDIRECT TO LOGIN
                        ------------------------------*/


                        window.location.href =
                            "../login/index.html";


                    }

                    catch (error) {


                        console.error(
                            "Logout error:",
                            error
                        );


                        /*------------------------------
                          RESTORE BUTTON
                        ------------------------------*/


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
          READY
        =========================================*/


        console.log(
            "ScholarLink COR Ready"
        );


    }
);
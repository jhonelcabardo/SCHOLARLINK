/*=========================================
SCHOLARLINK
DOCUMENT VERIFICATION
=========================================*/

document.addEventListener("DOMContentLoaded", function () {

    console.log("Document Verification Loaded");

    /*=========================================
      MOBILE SIDEBAR
    =========================================*/

    const menuToggle = document.getElementById("menuToggle");
    const sidebar = document.querySelector(".sidebar");

    if (menuToggle && sidebar) {

        menuToggle.addEventListener("click", function () {

            sidebar.classList.toggle("show");

        });

    }

    /*=========================================
      ACTIVE SIDEBAR
    =========================================*/

    const menuItems = document.querySelectorAll(".menu li");

    menuItems.forEach(function (item) {

        item.addEventListener("click", function () {

            menuItems.forEach(function (menu) {

                menu.classList.remove("active");

            });

            item.classList.add("active");

        });

    });

    /*=========================================
      SEARCH DOCUMENT
    =========================================*/

    const searchInput = document.querySelector(".search-box input");
    const tableRows = document.querySelectorAll("tbody tr");

    if (searchInput) {

        searchInput.addEventListener("keyup", function () {

            const keyword = this.value.toLowerCase();

            tableRows.forEach(function (row) {

                row.style.display = row.innerText.toLowerCase().includes(keyword)
                    ? ""
                    : "none";

            });

        });

    }

    /*=========================================
      FILTER USER TYPE
    =========================================*/

    const filters = document.querySelectorAll(".toolbar select");

    if (filters.length > 0) {

        filters[0].addEventListener("change", function () {

            const value = this.value.toLowerCase();

            tableRows.forEach(function (row) {

                if (value === "all users") {

                    row.style.display = "";

                    return;

                }

                row.style.display = row.innerText.toLowerCase().includes(value)
                    ? ""
                    : "none";

            });

        });

    }

    /*=========================================
      FILTER DOCUMENT TYPE
    =========================================*/

    if (filters.length > 1) {

        filters[1].addEventListener("change", function () {

            const value = this.value.toLowerCase();

            tableRows.forEach(function (row) {

                if (value === "all documents") {

                    row.style.display = "";

                    return;

                }

                row.style.display = row.innerText.toLowerCase().includes(value)
                    ? ""
                    : "none";

            });

        });

    }

    /*=========================================
      FILTER STATUS
    =========================================*/

    if (filters.length > 2) {

        filters[2].addEventListener("change", function () {

            const value = this.value.toLowerCase();

            tableRows.forEach(function (row) {

                if (value === "all status") {

                    row.style.display = "";

                    return;

                }

                row.style.display = row.innerText.toLowerCase().includes(value)
                    ? ""
                    : "none";

            });

        });

    }

    /*=========================================
      DOCUMENT PREVIEW
    =========================================*/

    document.querySelectorAll(".btn-view").forEach(function (button) {

        button.addEventListener("click", function () {

            alert("Opening document preview...");

        });

    });

    /*=========================================
      DOWNLOAD DOCUMENT
    =========================================*/

    document.querySelectorAll(".btn-download").forEach(function (button) {

        button.addEventListener("click", function () {

            alert("Downloading document...");

        });

    });

    /*=========================================
      VERIFY DOCUMENT
    =========================================*/

    document.querySelectorAll(".btn-approve").forEach(function (button) {

        button.addEventListener("click", function () {

            if (confirm("Verify this document?")) {

                alert("Document verified successfully.");

            }

        });

    });

    /*=========================================
      REJECT DOCUMENT
    =========================================*/

    document.querySelectorAll(".btn-reject").forEach(function (button) {

        button.addEventListener("click", function () {

            if (confirm("Reject this document?")) {

                alert("Document rejected.");

            }

        });

    });

    /*=========================================
      REQUEST RESUBMISSION
    =========================================*/

    document.querySelectorAll(".btn-resubmit").forEach(function (button) {

        button.addEventListener("click", function () {

            if (confirm("Request document resubmission?")) {

                alert("Resubmission request sent.");

            }

        });

    });

    /*=========================================
      NOTIFY USER
    =========================================*/

    document.querySelectorAll(".btn-notify").forEach(function (button) {

        button.addEventListener("click", function () {

            window.location.href = "notifications.html";

        });

    });

    /*=========================================
      DOCUMENT PREVIEW TOOLS
    =========================================*/

    const previewImage = document.querySelector(".document-preview img");

    let zoom = 1;
    let rotate = 0;

    const applyTransform = () => {

        if (previewImage) {

            previewImage.style.transform =
                `scale(${zoom}) rotate(${rotate}deg)`;

        }

    };

    const zoomIn = document.querySelector(".btn-zoom-in");

    if (zoomIn) {

        zoomIn.addEventListener("click", function () {

            zoom += 0.2;

            applyTransform();

        });

    }

    const zoomOut = document.querySelector(".btn-zoom-out");

    if (zoomOut) {

        zoomOut.addEventListener("click", function () {

            if (zoom > 0.4) {

                zoom -= 0.2;

                applyTransform();

            }

        });

    }

    const rotateBtn = document.querySelector(".btn-rotate");

    if (rotateBtn) {

        rotateBtn.addEventListener("click", function () {

            rotate += 90;

            applyTransform();

        });

    }

    /*=========================================
      SAVE VERIFICATION
    =========================================*/

    const verifyButtons = document.querySelector(".verification-buttons");

    if (verifyButtons) {

        verifyButtons.addEventListener("click", function () {

            const remarks = document.querySelector(".verification-card textarea");

            if (remarks && remarks.value.trim() === "") {

                alert("Please enter administrator remarks.");

            }

        });

    }

    /*=========================================
      SEND NOTIFICATION
    =========================================*/

    const sendNotification = document.querySelector(".btn-send-notification");

    if (sendNotification) {

        sendNotification.addEventListener("click", function () {

            alert("Notification sent successfully.");

        });

    }

    /*=========================================
      EXPORT REPORT
    =========================================*/

    const exportBtn = document.querySelector(".btn-export");

    if (exportBtn) {

        exportBtn.addEventListener("click", function () {

            alert("Document Verification Report exported.");

        });

    }

    /*=========================================
      QUICK ACTIONS
    =========================================*/

    document.querySelectorAll(".btn-primary").forEach(function (button) {

        button.addEventListener("click", function () {

            alert("Opening full document...");

        });

    });

    document.querySelectorAll(".btn-success").forEach(function (button) {

        button.addEventListener("click", function () {

            if (confirm("Verify all pending documents?")) {

                alert("All pending documents verified.");

            }

        });

    });

    document.querySelectorAll(".btn-warning").forEach(function (button) {

        button.addEventListener("click", function () {

            window.location.href = "notifications.html";

        });

    });

    document.querySelectorAll(".btn-danger").forEach(function (button) {

        button.addEventListener("click", function () {

            if (confirm("Reject selected documents?")) {

                alert("Selected documents rejected.");

            }

        });

    });

    /*=========================================
      NOTIFICATION ICON
    =========================================*/

    const notificationBtn = document.querySelector(".notification-btn");

    if (notificationBtn) {

        notificationBtn.addEventListener("click", function () {

            window.location.href = "notifications.html";

        });

    }

    /*=========================================
      CARD ANIMATION
    =========================================*/

    const cards = document.querySelectorAll(
        ".summary-card, .table-card, .preview-card, .document-info-card, .verification-card, .history-card, .notification-card, .requirements-card, .action-card"
    );

    cards.forEach(function (card, index) {

        card.style.opacity = "0";
        card.style.transform = "translateY(20px)";

        setTimeout(function () {

            card.style.transition = ".5s ease";
            card.style.opacity = "1";
            card.style.transform = "translateY(0)";

        }, index * 120);

    });

    /*=========================================
      LOGOUT
    =========================================*/

    const logout = document.querySelector(".logout a");

    if (logout) {

        logout.addEventListener("click", function (e) {

            if (!confirm("Are you sure you want to logout?")) {

                e.preventDefault();

            }

        });

    }

    console.log("Document Verification Ready");

});
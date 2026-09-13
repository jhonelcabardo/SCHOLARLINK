/*=========================================
SCHOLARLINK
MONITORING SCHOLARS
=========================================*/

document.addEventListener("DOMContentLoaded", function () {

    console.log("Monitoring Scholars Loaded");

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
      SEARCH SCHOLAR
    =========================================*/

    const searchInput = document.querySelector(".search-box input");
    const tableRows = document.querySelectorAll("tbody tr");

    if (searchInput) {

        searchInput.addEventListener("keyup", function () {

            const value = this.value.toLowerCase();

            tableRows.forEach(function (row) {

                row.style.display = row.innerText.toLowerCase().includes(value)
                    ? ""
                    : "none";

            });

        });

    }

    /*=========================================
      FILTER STATUS
    =========================================*/

    const filters = document.querySelectorAll(".toolbar select");

    if (filters.length > 0) {

        filters[0].addEventListener("change", function () {

            const value = this.value.toLowerCase();

            tableRows.forEach(function (row) {

                if (value === "all scholars") {

                    row.style.display = "";
                    return;

                }

                if (row.innerText.toLowerCase().includes(value)) {

                    row.style.display = "";

                } else {

                    row.style.display = "none";

                }

            });

        });

    }

    /*=========================================
      VIEW PROFILE
    =========================================*/

    document.querySelectorAll(".btn-view").forEach(function (button) {

        button.addEventListener("click", function () {

            alert("Opening scholar profile...");

        });

    });

    /*=========================================
      VIEW GRADES
    =========================================*/

    document.querySelectorAll(".btn-grade").forEach(function (button) {

        button.addEventListener("click", function () {

            window.location.href = "grade-cor-verification.html";

        });

    });

    /*=========================================
      VIEW COR
    =========================================*/

    document.querySelectorAll(".btn-cor").forEach(function (button) {

        button.addEventListener("click", function () {

            window.location.href = "grade-cor-verification.html";

        });

    });

    /*=========================================
      SEND NOTIFICATION
    =========================================*/

    document.querySelectorAll(".btn-notify").forEach(function (button) {

        button.addEventListener("click", function () {

            window.location.href = "notifications.html";

        });

    });

    /*=========================================
      SAVE REMARKS
    =========================================*/

    const saveRemarks = document.querySelector(".btn-save");

    if (saveRemarks) {

        saveRemarks.addEventListener("click", function () {

            const remarks = document.querySelector(".remarks-card textarea");

            if (remarks.value.trim() === "") {

                alert("Please enter administrator remarks.");

                return;

            }

            alert("Remarks saved successfully.");

        });

    }

    /*=========================================
      QUICK ACTION BUTTONS
    =========================================*/

    document.querySelectorAll(".btn-primary").forEach(function (button) {

        button.addEventListener("click", function () {

            const action = button.innerText.trim();

            if (action.includes("Notification")) {

                window.location.href = "notifications.html";

            }

            if (action.includes("Announcement")) {

                window.location.href = "announcements.html";

            }

        });

    });

    document.querySelectorAll(".btn-success").forEach(function (button) {

        button.addEventListener("click", function () {

            if (confirm("Renew this scholar?")) {

                alert("Scholar renewed successfully.");

            }

        });

    });

    document.querySelectorAll(".btn-warning").forEach(function (button) {

        button.addEventListener("click", function () {

            alert("Opening scholar information...");

        });

    });

    document.querySelectorAll(".btn-danger").forEach(function (button) {

        button.addEventListener("click", function () {

            if (confirm("Suspend this scholar?")) {

                alert("Scholar has been suspended.");

            }

        });

    });

    /*=========================================
      EXPORT REPORT
    =========================================*/

    const exportBtn = document.querySelector(".btn-export");

    if (exportBtn) {

        exportBtn.addEventListener("click", function () {

            alert("Scholar Monitoring Report exported successfully.");

        });

    }

    /*=========================================
      TABLE HOVER
    =========================================*/

    tableRows.forEach(function (row) {

        row.addEventListener("mouseenter", function () {

            row.style.background = "#EEF5FF";

        });

        row.addEventListener("mouseleave", function () {

            row.style.background = "";

        });

    });

    /*=========================================
      CARD ANIMATION
    =========================================*/

    const cards = document.querySelectorAll(
        ".summary-card, .table-card, .profile-card, .performance-card, .requirements-card, .notifications-card, .announcements-card, .qr-card, .attendance-card, .remarks-card, .timeline-card, .action-card"
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
      NOTIFICATION BUTTON
    =========================================*/

    const notificationBtn = document.querySelector(".notification-btn");

    if (notificationBtn) {

        notificationBtn.addEventListener("click", function () {

            window.location.href = "notifications.html";

        });

    }

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

    console.log("Scholar Monitoring Center Ready");

});
/*=========================================
SCHOLARLINK
GRADE & COR VERIFICATION
=========================================*/

document.addEventListener("DOMContentLoaded", () => {

    console.log("Grade & COR Verification Loaded");

    /*=========================================
    MOBILE SIDEBAR
    =========================================*/

    const menuToggle = document.getElementById("menuToggle");
    const sidebar = document.querySelector(".sidebar");

    if (menuToggle && sidebar) {

        menuToggle.addEventListener("click", () => {

            sidebar.classList.toggle("show");

        });

    }

    /*=========================================
    ACTIVE SIDEBAR
    =========================================*/

    const menuItems = document.querySelectorAll(".menu li");

    menuItems.forEach(item => {

        item.addEventListener("click", () => {

            menuItems.forEach(menu => menu.classList.remove("active"));

            item.classList.add("active");

        });

    });

    /*=========================================
    SEARCH SCHOLAR
    =========================================*/

    const searchInput = document.querySelector(".search-box input");
    const rows = document.querySelectorAll("tbody tr");

    if (searchInput) {

        searchInput.addEventListener("keyup", function () {

            const keyword = this.value.toLowerCase();

            rows.forEach(row => {

                row.style.display = row.innerText.toLowerCase().includes(keyword)
                    ? ""
                    : "none";

            });

        });

    }

    /*=========================================
    FILTERS
    =========================================*/

    const filters = document.querySelectorAll(".toolbar select");

    filters.forEach(filter => {

        filter.addEventListener("change", () => {

            console.log("Filter:", filter.value);

        });

    });

    /*=========================================
    VIEW SCHOLAR
    =========================================*/

    document.querySelectorAll(".btn-view").forEach(button => {

        button.addEventListener("click", () => {

            alert("Opening Scholar Profile...");

        });

    });

    /*=========================================
    VIEW GRADES
    =========================================*/

    document.querySelectorAll(".btn-grades").forEach(button => {

        button.addEventListener("click", () => {

            alert("Opening Grades...");

        });

    });

    /*=========================================
    VIEW COR
    =========================================*/

    document.querySelectorAll(".btn-cor").forEach(button => {

        button.addEventListener("click", () => {

            alert("Opening Certificate of Registration...");

        });

    });

    /*=========================================
    RENEW SCHOLARSHIP
    =========================================*/

    document.querySelectorAll(".btn-renew").forEach(button => {

        button.addEventListener("click", () => {

            if (confirm("Approve scholarship renewal?")) {

                alert("Scholarship renewed successfully.");

            }

        });

    });

    /*=========================================
    HOLD SCHOLARSHIP
    =========================================*/

    document.querySelectorAll(".btn-hold").forEach(button => {

        button.addEventListener("click", () => {

            if (confirm("Put this scholar on hold?")) {

                alert("Scholar placed on hold.");

            }

        });

    });

    /*=========================================
    NOTIFY SCHOLAR
    =========================================*/

    document.querySelectorAll(".btn-notify").forEach(button => {

        button.addEventListener("click", () => {

            window.location.href = "notifications.html";

        });

    });

    /*=========================================
    OPEN GRADE PREVIEW
    =========================================*/

    const openGrades = document.querySelector(".btn-view-grades");

    if (openGrades) {

        openGrades.addEventListener("click", () => {

            alert("Opening uploaded Grades...");

        });

    }

    /*=========================================
    OPEN COR PREVIEW
    =========================================*/

    const openCOR = document.querySelector(".btn-view-cor");

    if (openCOR) {

        openCOR.addEventListener("click", () => {

            alert("Opening uploaded COR...");

        });

    }

    /*=========================================
    VERIFY GRADES
    =========================================*/

    const verifyBtn = document.querySelector(".btn-verify");

    if (verifyBtn) {

        verifyBtn.addEventListener("click", () => {

            alert("Grades verified successfully.");

        });

    }

    /*=========================================
    VERIFY COR
    =========================================*/

    const verifyCOR = document.querySelector(".btn-cor-verify");

    if (verifyCOR) {

        verifyCOR.addEventListener("click", () => {

            alert("Certificate of Registration verified.");

        });

    }

    /*=========================================
    SAVE REMARKS
    =========================================*/

    const remarks = document.querySelector(".verification-card textarea");

    if (remarks) {

        const saved = localStorage.getItem("renewalRemarks");

        if (saved) remarks.value = saved;

        remarks.addEventListener("keyup", () => {

            localStorage.setItem("renewalRemarks", remarks.value);

        });

    }

    /*=========================================
    SEND NOTIFICATION
    =========================================*/

    const sendBtn = document.querySelector(".btn-send");

    if (sendBtn) {

        sendBtn.addEventListener("click", () => {

            alert("Notification sent successfully.");

        });

    }

    /*=========================================
    EXPORT REPORT
    =========================================*/

    const exportBtn = document.querySelector(".btn-export");

    if (exportBtn) {

        exportBtn.addEventListener("click", () => {

            alert("Renewal report exported.");

        });

    }

    /*=========================================
    QUICK ACTIONS
    =========================================*/

    document.querySelectorAll(".btn-primary").forEach(button => {

        button.addEventListener("click", () => {

            alert("Opening Scholar Profile...");

        });

    });

    document.querySelectorAll(".btn-success").forEach(button => {

        button.addEventListener("click", () => {

            if (confirm("Renew scholarship now?")) {

                alert("Scholarship renewed.");

            }

        });

    });

    document.querySelectorAll(".btn-warning").forEach(button => {

        button.addEventListener("click", () => {

            window.location.href = "notifications.html";

        });

    });

    document.querySelectorAll(".btn-danger").forEach(button => {

        button.addEventListener("click", () => {

            if (confirm("Put scholar on hold?")) {

                alert("Scholar is now On Hold.");

            }

        });

    });

    /*=========================================
    NOTIFICATION ICON
    =========================================*/

    const notificationBtn = document.querySelector(".notification-btn");

    if (notificationBtn) {

        notificationBtn.addEventListener("click", () => {

            window.location.href = "notifications.html";

        });

    }

    /*=========================================
    CARD ANIMATION
    =========================================*/

    const cards = document.querySelectorAll(

        ".summary-card, .table-card, .profile-card, .academic-card, .grades-card, .cor-card, .verification-card, .history-card, .notification-card, .action-card"

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

    console.log("Grade & COR Verification Ready");

});
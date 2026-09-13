/*=========================================
SCHOLARLINK
USER MANAGEMENT
=========================================*/

document.addEventListener("DOMContentLoaded", function () {

    console.log("User Management Loaded");

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
      SEARCH USER
    =========================================*/

    const searchInput = document.querySelector(".search-box input");
    const tableRows = document.querySelectorAll("tbody tr");

    if (searchInput) {

        searchInput.addEventListener("keyup", function () {

            const value = this.value.toLowerCase();

            tableRows.forEach(function (row) {

                if (row.innerText.toLowerCase().includes(value)) {

                    row.style.display = "";

                } else {

                    row.style.display = "none";

                }

            });

        });

    }

    /*=========================================
      FILTER ROLE
    =========================================*/

    const filters = document.querySelectorAll(".toolbar select");

    if (filters.length > 0) {

        filters[0].addEventListener("change", function () {

            const role = this.value.toLowerCase();

            tableRows.forEach(function (row) {

                if (role === "all roles") {

                    row.style.display = "";
                    return;

                }

                if (row.innerText.toLowerCase().includes(role)) {

                    row.style.display = "";

                } else {

                    row.style.display = "none";

                }

            });

        });

    }

    /*=========================================
      FILTER STATUS
    =========================================*/

    if (filters.length > 1) {

        filters[1].addEventListener("change", function () {

            const status = this.value.toLowerCase();

            tableRows.forEach(function (row) {

                if (status === "all status") {

                    row.style.display = "";
                    return;

                }

                if (row.innerText.toLowerCase().includes(status)) {

                    row.style.display = "";

                } else {

                    row.style.display = "none";

                }

            });

        });

    }

    /*=========================================
      VIEW USER
    =========================================*/

    document.querySelectorAll(".btn-view").forEach(function (button) {

        button.addEventListener("click", function () {

            alert("Opening user profile...");

        });

    });

    /*=========================================
      EDIT USER
    =========================================*/

    document.querySelectorAll(".btn-edit").forEach(function (button) {

        button.addEventListener("click", function () {

            alert("Opening Edit User page...");

        });

    });

    /*=========================================
      RESET PASSWORD
    =========================================*/

    document.querySelectorAll(".btn-reset").forEach(function (button) {

        button.addEventListener("click", function () {

            if (confirm("Reset this user's password?")) {

                alert("Password reset successfully.");

            }

        });

    });

    /*=========================================
      ENABLE USER
    =========================================*/

    document.querySelectorAll(".btn-enable").forEach(function (button) {

        button.addEventListener("click", function () {

            if (confirm("Activate this account?")) {

                alert("Account activated successfully.");

            }

        });

    });

    /*=========================================
      DISABLE USER
    =========================================*/

    document.querySelectorAll(".btn-disable").forEach(function (button) {

        button.addEventListener("click", function () {

            if (confirm("Disable this account?")) {

                alert("Account disabled successfully.");

            }

        });

    });

    /*=========================================
      ADD USER
    =========================================*/

    const addUser = document.querySelector(".btn-add-user");

    if (addUser) {

        addUser.addEventListener("click", function () {

            alert("Opening Add User form...");

        });

    }

    /*=========================================
      EXPORT USERS
    =========================================*/

    const exportBtn = document.querySelector(".btn-export");

    if (exportBtn) {

        exportBtn.addEventListener("click", function () {

            alert("Users exported successfully.");

        });

    }

    /*=========================================
      RESET PASSWORD FORM
    =========================================*/

    const resetPassword = document.querySelector(".btn-reset-password");

    if (resetPassword) {

        resetPassword.addEventListener("click", function () {

            const passwordFields = document.querySelectorAll(".password-card input");

            if (passwordFields.length < 2) {

                alert("Password fields not found.");
                return;

            }

            const newPassword = passwordFields[0].value.trim();
            const confirmPassword = passwordFields[1].value.trim();

            if (newPassword === "" || confirmPassword === "") {

                alert("Please complete both password fields.");
                return;

            }

            if (newPassword !== confirmPassword) {

                alert("Passwords do not match.");
                return;

            }

            alert("Password changed successfully.");

            passwordFields[0].value = "";
            passwordFields[1].value = "";

        });

    }

    /*=========================================
      SAVE ADMIN NOTES
    =========================================*/

    const saveNotes = document.querySelector(".btn-save");

    if (saveNotes) {

        saveNotes.addEventListener("click", function () {

            const textarea = document.querySelector(".remarks-card textarea");

            if (!textarea || textarea.value.trim() === "") {

                alert("Please enter administrator notes.");

                return;

            }

            localStorage.setItem("adminNotes", textarea.value);

            alert("Administrator notes saved.");

        });

    }

    const notes = document.querySelector(".remarks-card textarea");

    if (notes) {

        const savedNotes = localStorage.getItem("adminNotes");

        if (savedNotes) {

            notes.value = savedNotes;

        }

    }

    /*=========================================
      QUICK ACTION BUTTONS
    =========================================*/

    document.querySelectorAll(".btn-primary").forEach(function (button) {

        button.addEventListener("click", function () {

            alert("Opening Notification Management...");

            window.location.href = "notifications.html";

        });

    });

    document.querySelectorAll(".btn-success").forEach(function (button) {

        button.addEventListener("click", function () {

            alert("Account activated.");

        });

    });

    document.querySelectorAll(".btn-warning").forEach(function (button) {

        button.addEventListener("click", function () {

            alert("Opening Edit User...");

        });

    });

    document.querySelectorAll(".btn-danger").forEach(function (button) {

        button.addEventListener("click", function () {

            if (confirm("Suspend this account?")) {

                alert("User suspended.");

            }

        });

    });

    document.querySelectorAll(".btn-delete").forEach(function (button) {

        button.addEventListener("click", function () {

            if (confirm("Delete this user permanently?")) {

                alert("User deleted.");

            }

        });

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
      CARD ANIMATION
    =========================================*/

    const cards = document.querySelectorAll(
        ".summary-card, .table-card, .profile-card, .account-card, .login-history-card, .permissions-card, .qr-card, .activity-card, .password-card, .remarks-card, .action-card"
    );

    cards.forEach(function (card, index) {

        card.style.opacity = "0";
        card.style.transform = "translateY(20px)";

        setTimeout(function () {

            card.style.transition = ".5s ease";
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

    console.log("ScholarLink User Management Ready");

});
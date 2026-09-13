/*=========================================
SCHOLARLINK
SETTINGS PAGE
=========================================*/

document.addEventListener("DOMContentLoaded", () => {

    console.log("Settings Page Loaded");

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
    SIDEBAR ACTIVE MENU
    =========================================*/

    const sidebarMenu = document.querySelectorAll(".menu li");

    sidebarMenu.forEach(item => {

        item.addEventListener("click", () => {

            sidebarMenu.forEach(menu => menu.classList.remove("active"));

            item.classList.add("active");

        });

    });

    /*=========================================
    SETTINGS NAVIGATION
    =========================================*/

    const settingButtons = document.querySelectorAll(".setting-item");
    const sections = document.querySelectorAll(".settings-section");

    settingButtons.forEach(button => {

        button.addEventListener("click", () => {

            settingButtons.forEach(btn => btn.classList.remove("active"));

            button.classList.add("active");

            const target = button.dataset.target;

            sections.forEach(section => {

                section.classList.remove("active-section");

                if(section.id === target){

                    section.classList.add("active-section");

                }

            });

        });

    });

    /*=========================================
    SAVE BUTTONS
    =========================================*/

    document.querySelectorAll(".btn-save").forEach(button => {

        button.addEventListener("click", () => {

            alert("Settings saved successfully.");

        });

    });

    /*=========================================
    CHANGE PROFILE PHOTO
    =========================================*/

    const photoButton = document.querySelector(".profile-photo button");

    if(photoButton){

        photoButton.addEventListener("click",()=>{

            alert("Open file picker to upload a new profile photo.");

        });

    }

    /*=========================================
    REQUIREMENTS
    =========================================*/

    document.querySelectorAll(".btn-edit").forEach(button=>{

        button.addEventListener("click",()=>{

            alert("Edit requirement.");

        });

    });

    document.querySelectorAll(".btn-delete").forEach(button=>{

        button.addEventListener("click",()=>{

            if(confirm("Delete this requirement?")){

                alert("Requirement deleted.");

            }

        });

    });

    /*=========================================
    ADD REQUIREMENT
    =========================================*/

    document.querySelectorAll(".btn-primary").forEach(button=>{

        if(button.innerText.includes("Requirement")){

            button.addEventListener("click",()=>{

                alert("Open Add Requirement Form.");

            });

        }

    });

    /*=========================================
    TOGGLE NOTIFICATIONS
    =========================================*/

    const toggles=document.querySelectorAll('input[type="checkbox"]');

    toggles.forEach(toggle=>{

        toggle.addEventListener("change",()=>{

            console.log(toggle.checked);

        });

    });

    /*=========================================
    BACKUP
    =========================================*/

    document.querySelectorAll(".btn-success").forEach(button=>{

        if(button.innerText.includes("Backup")){

            button.addEventListener("click",()=>{

                alert("Database backup created successfully.");

            });

        }

    });

    /*=========================================
    RESTORE
    =========================================*/

    document.querySelectorAll(".btn-warning").forEach(button=>{

        if(button.innerText.includes("Restore")){

            button.addEventListener("click",()=>{

                if(confirm("Restore previous backup?")){

                    alert("Backup restored.");

                }

            });

        }

    });

    /*=========================================
    EXPORT DATA
    =========================================*/

    document.querySelectorAll(".btn-primary").forEach(button=>{

        if(button.innerText.includes("Export")){

            button.addEventListener("click",()=>{

                alert("Exporting system data...");

            });

        }

    });

    /*=========================================
    RESET SETTINGS
    =========================================*/

    document.querySelectorAll(".btn-warning").forEach(button=>{

        if(button.innerText.includes("Reset")){

            button.addEventListener("click",()=>{

                if(confirm("Reset all settings to default?")){

                    alert("System settings reset.");

                }

            });

        }

    });

    /*=========================================
    LOGOUT ALL USERS
    =========================================*/

    document.querySelectorAll(".btn-danger").forEach(button=>{

        button.addEventListener("click",()=>{

            if(confirm("Logout all users currently logged in?")){

                alert("All users have been logged out.");

            }

        });

    });

    /*=========================================
    AUTO SAVE FORM
    =========================================*/

    const fields=document.querySelectorAll("input,textarea,select");

    fields.forEach((field,index)=>{

        const key="setting_"+index;

        const value=localStorage.getItem(key);

        if(value!==null){

            if(field.type==="checkbox"){

                field.checked=value==="true";

            }else{

                field.value=value;

            }

        }

        field.addEventListener("change",()=>{

            if(field.type==="checkbox"){

                localStorage.setItem(key,field.checked);

            }else{

                localStorage.setItem(key,field.value);

            }

        });

    });

    /*=========================================
    CARD ANIMATION
    =========================================*/

    const cards=document.querySelectorAll(

        ".settings-card,.profile-photo,.profile-form"

    );

    cards.forEach((card,index)=>{

        card.style.opacity="0";

        card.style.transform="translateY(20px)";

        setTimeout(()=>{

            card.style.transition=".5s";

            card.style.opacity="1";

            card.style.transform="translateY(0)";

        },index*120);

    });

    /*=========================================
    NOTIFICATION ICON
    =========================================*/

    const notification=document.querySelector(".notification-btn");

    if(notification){

        notification.addEventListener("click",()=>{

            window.location.href="notifications.html";

        });

    }

    /*=========================================
    LOGOUT
    =========================================*/

    const logout=document.querySelector(".logout a");

    if(logout){

        logout.addEventListener("click",(e)=>{

            if(!confirm("Are you sure you want to logout?")){

                e.preventDefault();

            }

        });

    }

    console.log("Settings Ready");

});
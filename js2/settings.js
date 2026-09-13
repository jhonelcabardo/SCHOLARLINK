/*=========================================
  SCHOLARLINK
  SETTINGS MODULE
==========================================*/

document.addEventListener("DOMContentLoaded", () => {

    console.log("Settings Module Loaded");

    /*=========================================
      SAVE SETTINGS
    =========================================*/

    const saveBtn = document.querySelector(".btn-primary");

    if (saveBtn) {

        saveBtn.addEventListener("click", () => {

            alert("Settings have been saved successfully!");

        });

    }

    /*=========================================
      RESET SETTINGS
    =========================================*/

    const resetBtn = document.querySelector(".btn-warning");

    if (resetBtn) {

        resetBtn.addEventListener("click", () => {

            if(confirm("Reset all settings?")){

                location.reload();

            }

        });

    }

    /*=========================================
      LOGOUT
    =========================================*/

    const logoutBtn = document.querySelector(".btn-danger");

    if(logoutBtn){

        logoutBtn.addEventListener("click",()=>{

            if(confirm("Are you sure you want to logout?")){

                window.location.href="../index.html";

            }

        });

    }

    /*=========================================
      CHANGE PASSWORD VALIDATION
    =========================================*/

    const passwordInputs = document.querySelectorAll("input[type='password']");

    if(passwordInputs.length >= 3){

        const currentPassword = passwordInputs[0];
        const newPassword = passwordInputs[1];
        const confirmPassword = passwordInputs[2];

        confirmPassword.addEventListener("blur",()=>{

            if(confirmPassword.value==="") return;

            if(newPassword.value!==confirmPassword.value){

                alert("New password and Confirm password do not match.");

                confirmPassword.focus();

            }

        });

    }

    /*=========================================
      SHOW CHANGES
    =========================================*/

    const inputs = document.querySelectorAll("input, select");

    inputs.forEach(input=>{

        input.addEventListener("change",()=>{

            input.style.border="2px solid #27AE60";

        });

    });

    /*=========================================
      DARK MODE (OPTIONAL)
    =========================================*/

    const checkboxes = document.querySelectorAll("input[type='checkbox']");

    checkboxes.forEach(box=>{

        box.addEventListener("change",()=>{

            const label = box.parentElement.querySelector("label");

            if(label && label.textContent.includes("Dark Mode")){

                if(box.checked){

                    document.body.style.background="#121212";
                    document.body.style.color="#ffffff";

                }else{

                    document.body.style.background="#F4F7FB";
                    document.body.style.color="#333";

                }

            }

        });

    });

    /*=========================================
      OFFICE CARD EFFECT
    =========================================*/

    const officeCard=document.querySelector(".office-card");

    if(officeCard){

        officeCard.addEventListener("mouseenter",()=>{

            officeCard.style.transform="translateY(-5px)";

        });

        officeCard.addEventListener("mouseleave",()=>{

            officeCard.style.transform="translateY(0)";

        });

    }

    /*=========================================
      CARD ANIMATION
    =========================================*/

    const cards=document.querySelectorAll(".card");

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
      ACTIVE SIDEBAR
    =========================================*/

    const menuItems=document.querySelectorAll(".menu li");

    menuItems.forEach(item=>{

        item.addEventListener("click",()=>{

            menuItems.forEach(menu=>{

                menu.classList.remove("active");

            });

            item.classList.add("active");

        });

    });

    /*=========================================
      PAGE LOADED MESSAGE
    =========================================*/

    console.log("ScholarLink Settings Ready");

});
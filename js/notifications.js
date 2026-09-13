/*=========================================
SCHOLARLINK
NOTIFICATION MANAGEMENT
=========================================*/

document.addEventListener("DOMContentLoaded", function () {

    console.log("Notification Management Loaded");

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

    menuItems.forEach(function(item){

        item.addEventListener("click",function(){

            menuItems.forEach(function(menu){

                menu.classList.remove("active");

            });

            item.classList.add("active");

        });

    });

    /*=========================================
      FORM ELEMENTS
    =========================================*/

    const recipientType = document.getElementById("recipientType");
    const recipientName = document.getElementById("recipientName");

    const title = document.querySelector('input[type="text"]');
    const message = document.querySelector("textarea");

    const templateBtn = document.querySelector(".btn-template");
    const previewBtn = document.querySelector(".btn-preview");
    const sendBtn = document.querySelector(".btn-send");

    /*=========================================
      NOTIFICATION TEMPLATES
    =========================================*/

    const templates = {

        missing: {

            title: "Incomplete Requirements",

            message:
`Your scholarship application is incomplete.

Please upload the missing requirements before the deadline.

Failure to comply may result in the rejection of your application.`

        },

        approved: {

            title: "Application Approved",

            message:
`Congratulations!

Your scholarship application has been approved.

Please wait for the next announcement regarding the orientation schedule.`

        },

        rejected: {

            title: "Application Rejected",

            message:
`We regret to inform you that your scholarship application has not been approved.

Please contact the Scholarship Office for more information.`

        },

        grades: {

            title: "Submit Grades",

            message:
`Please upload your grades before the deadline to maintain your scholarship eligibility.`

        },

        cor: {

            title: "Submit COR",

            message:
`Please upload your Certificate of Registration (COR) as soon as possible.`

        }

    };

    /*=========================================
      USE TEMPLATE
    =========================================*/

    if(templateBtn){

        templateBtn.addEventListener("click",function(){

            const category=document.querySelectorAll("select")[2].value;

            switch(category){

                case "Missing Requirements":

                    title.value=templates.missing.title;
                    message.value=templates.missing.message;
                    break;

                case "Application Approved":

                    title.value=templates.approved.title;
                    message.value=templates.approved.message;
                    break;

                case "Application Rejected":

                    title.value=templates.rejected.title;
                    message.value=templates.rejected.message;
                    break;

                case "Grade Verification":

                    title.value=templates.grades.title;
                    message.value=templates.grades.message;
                    break;

                case "COR Verification":

                    title.value=templates.cor.title;
                    message.value=templates.cor.message;
                    break;

                default:

                    alert("No template available for this category.");

            }

        });

    }

    /*=========================================
      PREVIEW
    =========================================*/

    if(previewBtn){

        previewBtn.addEventListener("click",function(){

            alert(

                "Recipient : "+recipientName.value+

                "\n\nTitle : "+title.value+

                "\n\nMessage:\n\n"+message.value

            );

        });

    }

    /*=========================================
      SEND NOTIFICATION
    =========================================*/

    if(sendBtn){

        sendBtn.addEventListener("click",function(){

            if(title.value.trim()===""){

                alert("Please enter notification title.");

                return;

            }

            if(message.value.trim()===""){

                alert("Please enter notification message.");

                return;

            }

            alert("Notification sent successfully!");

        });

    }

    /*=========================================
      AUTO SAVE DRAFT
    =========================================*/

    if(title){

        title.addEventListener("keyup",saveDraft);

    }

    if(message){

        message.addEventListener("keyup",saveDraft);

    }

    function saveDraft(){

        localStorage.setItem("notifyTitle",title.value);

        localStorage.setItem("notifyMessage",message.value);

    }

    if(localStorage.getItem("notifyTitle")){

        title.value=localStorage.getItem("notifyTitle");

    }

    if(localStorage.getItem("notifyMessage")){

        message.value=localStorage.getItem("notifyMessage");

    }

    /*=========================================
      SEARCH HISTORY
    =========================================*/

    const search=document.querySelector(".search-history");

    if(search){

        search.addEventListener("keyup",function(){

            const value=this.value.toLowerCase();

            document.querySelectorAll("tbody tr").forEach(function(row){

                if(row.innerText.toLowerCase().includes(value)){

                    row.style.display="";

                }

                else{

                    row.style.display="none";

                }

            });

        });

    }

    /*=========================================
      VIEW
    =========================================*/

    document.querySelectorAll(".btn-view").forEach(function(btn){

        btn.addEventListener("click",function(){

            alert("Opening notification details...");

        });

    });

    /*=========================================
      DUPLICATE
    =========================================*/

    document.querySelectorAll(".btn-copy").forEach(function(btn){

        btn.addEventListener("click",function(){

            const row=btn.closest("tr");

            const cells=row.querySelectorAll("td");

            recipientName.value=cells[0].innerText;

            title.value=cells[2].innerText;

            message.value="Copied from previous notification.";

            window.scrollTo({

                top:0,

                behavior:"smooth"

            });

        });

    });

    /*=========================================
      DELETE
    =========================================*/

    document.querySelectorAll(".btn-delete").forEach(function(btn){

        btn.addEventListener("click",function(){

            if(confirm("Delete this notification?")){

                btn.closest("tr").remove();

            }

        });

    });

    /*=========================================
      QUICK TEMPLATE CARDS
    =========================================*/

    document.querySelectorAll(".btn-template-use").forEach(function(btn){

        btn.addEventListener("click",function(){

            const card=btn.closest(".template-card");

            const text=card.querySelector("h3").innerText;

            alert(text+" template selected.");

        });

    });

    /*=========================================
      CARD ANIMATION
    =========================================*/

    document.querySelectorAll(".card,.summary-card,.template-card").forEach(function(card,index){

        card.style.opacity="0";

        card.style.transform="translateY(20px)";

        setTimeout(function(){

            card.style.transition=".5s";

            card.style.opacity="1";

            card.style.transform="translateY(0)";

        },index*120);

    });

    /*=========================================
      LOGOUT
    =========================================*/

    const logout=document.querySelector(".logout a");

    if(logout){

        logout.addEventListener("click",function(e){

            if(!confirm("Are you sure you want to logout?")){

                e.preventDefault();

            }

        });

    }

    console.log("ScholarLink Notification Management Ready");

});
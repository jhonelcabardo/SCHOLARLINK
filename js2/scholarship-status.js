/*=========================================
  SCHOLARLINK
  Scholarship Status JavaScript
==========================================*/

document.addEventListener("DOMContentLoaded", () => {

    console.log("Scholarship Status Loaded");

    /*=========================================
      PRINT STATUS
    ==========================================*/

    const printBtn = document.querySelector(".btn-primary");

    if (printBtn) {

        printBtn.addEventListener("click", () => {

            window.print();

        });

    }

    /*=========================================
      DOWNLOAD REPORT
    ==========================================*/

    const downloadBtn = document.querySelector(".btn-success");

    if (downloadBtn) {

        downloadBtn.addEventListener("click", () => {

            alert("Scholarship Report Downloaded Successfully!");

        });

    }

    /*=========================================
      ACTIVE SIDEBAR
    ==========================================*/

    const menuItems = document.querySelectorAll(".menu li");

    menuItems.forEach(item => {

        item.addEventListener("click", () => {

            menuItems.forEach(i => i.classList.remove("active"));

            item.classList.add("active");

        });

    });

    /*=========================================
      CARD ANIMATION
    ==========================================*/

    const cards = document.querySelectorAll(".summary-card, .card, .benefit-card");

    cards.forEach((card, index) => {

        card.style.opacity = "0";

        card.style.transform = "translateY(20px)";

        setTimeout(() => {

            card.style.transition = ".5s";

            card.style.opacity = "1";

            card.style.transform = "translateY(0)";

        }, index * 120);

    });

    /*=========================================
      PROGRESS CIRCLE ANIMATION
    ==========================================*/

    const progressText = document.querySelector(".progress-circle span");

    if (progressText) {

        let value = 0;

        const target = 100;

        const timer = setInterval(() => {

            value++;

            progressText.textContent = value + "%";

            if (value >= target) {

                clearInterval(timer);

            }

        }, 15);

    }

    /*=========================================
      BENEFIT CARD EFFECT
    ==========================================*/

    const benefitCards = document.querySelectorAll(".benefit-card");

    benefitCards.forEach(card => {

        card.addEventListener("mouseenter", () => {

            card.style.transform = "translateY(-8px)";

        });

        card.addEventListener("mouseleave", () => {

            card.style.transform = "translateY(0)";

        });

    });

    /*=========================================
      TABLE ROW EFFECT
    ==========================================*/

    const rows = document.querySelectorAll("table tbody tr");

    rows.forEach(row => {

        row.addEventListener("mouseenter", () => {

            row.style.background = "#EEF5FF";

        });

        row.addEventListener("mouseleave", () => {

            row.style.background = "";

        });

    });

    /*=========================================
      TIMELINE EFFECT
    ==========================================*/

    const timeline = document.querySelectorAll(".timeline-item");

    timeline.forEach((item, index) => {

        setTimeout(() => {

            item.style.opacity = "1";

            item.style.transform = "translateX(0)";

        }, index * 300);

    });

    /*=========================================
      STATUS CHECK
    ==========================================*/

    const statusCard = document.querySelector(".active-card h2");

    if (statusCard) {

        if (statusCard.textContent.trim() === "ACTIVE") {

            console.log("Scholarship Active");

        }

    }

});
/* ----------------------------------------------------
   GLOBAL INTERACTION & WIDGET CONTROLLERS
   ---------------------------------------------------- */

document.addEventListener("DOMContentLoaded", () => {
    // Init widgets
    initThemeSwitcher();
    initMobileNav();
    initClientMarquee();
    initStatsCounters();
    initModalControls();
    initScadaChartSimulator();
    
    // Initialize Lucide icons
    if (window.lucide) {
        window.lucide.createIcons();
    }
});

/* =========================================================================
   1. MOBILE NAVBAR MENU TOGGLE
   ========================================================================= */
function initMobileNav() {
    const toggleBtn = document.getElementById("mobile-menu-toggle");
    const navMenu = document.getElementById("nav-links-menu");
    const navLinks = document.querySelectorAll(".nav-link");

    if (!toggleBtn || !navMenu) return;

    toggleBtn.addEventListener("click", () => {
        navMenu.classList.toggle("open");
        const isOpen = navMenu.classList.contains("open");
        
        // Swap menu icon to X icon
        toggleBtn.innerHTML = isOpen 
            ? `<i data-lucide="x"></i>` 
            : `<i data-lucide="menu"></i>`;
        
        window.lucide.createIcons();
    });

    // Close menu when a link is clicked
    navLinks.forEach(link => {
        link.addEventListener("click", () => {
            navMenu.classList.remove("open");
            toggleBtn.innerHTML = `<i data-lucide="menu"></i>`;
            window.lucide.createIcons();
        });
    });

    // Update active state in navbar links on scroll
    const sections = document.querySelectorAll("header, section");
    window.addEventListener("scroll", () => {
        let currentSectionId = "";
        const scrollPosition = window.scrollY + 100; // Offset

        sections.forEach(sec => {
            const top = sec.offsetTop;
            const height = sec.offsetHeight;
            if (scrollPosition >= top && scrollPosition < top + height) {
                currentSectionId = sec.getAttribute("id");
            }
        });

        navLinks.forEach(link => {
            link.classList.remove("active");
            if (link.getAttribute("href") === `#${currentSectionId}`) {
                link.classList.add("active");
            }
        });
    });
}

/* =========================================================================
   2. CLIENT LOGO MARQUEE (DYNAMIC GENERATION)
   ========================================================================= */
function initClientMarquee() {
    const marqueeTrack = document.getElementById("marquee-logos-track");
    if (!marqueeTrack) return;

    // Load top 23 clientele logos from Clearbit API
    const clients = [
        { name: "Reliance Industries", url: "https://logo.clearbit.com/ril.com" },
        { name: "Adani Group", url: "https://logo.clearbit.com/adani.com" },
        { name: "Maruti Suzuki", url: "https://logo.clearbit.com/marutisuzuki.com" },
        { name: "Larsen & Toubro", url: "https://logo.clearbit.com/larsentoubro.com" },
        { name: "L&T Construction", url: "https://logo.clearbit.com/lntecc.com" },
        { name: "Godrej & Boyce", url: "https://logo.clearbit.com/godrej.com" },
        { name: "Hindustan Coca-Cola Beverages", url: "https://logo.clearbit.com/hccb.in" },
        { name: "Cummins", url: "https://logo.clearbit.com/cummins.com" },
        { name: "ITC Hotels", url: "https://logo.clearbit.com/itchotels.in" },
        { name: "Lodha", url: "https://logo.clearbit.com/lodhagroup.in" },
        { name: "Bharat Electronics Limited", url: "https://logo.clearbit.com/bel-india.in" },
        { name: "Godrej Properties", url: "https://logo.clearbit.com/godrejproperties.com" },
        { name: "Shangri-La Hotels", url: "https://logo.clearbit.com/shangri-la.com" },
        { name: "Le Meridien / Marriott", url: "https://logo.clearbit.com/marriott.com" },
        { name: "Shapoorji Pallonji", url: "https://logo.clearbit.com/shapoorjipallonji.com" },
        { name: "Ather Energy", url: "https://logo.clearbit.com/atherenergy.com" },
        { name: "The Leela Palace", url: "https://logo.clearbit.com/theleela.com" },
        { name: "Prestige Group", url: "https://logo.clearbit.com/prestigeconstructions.com" },
        { name: "Sobha", url: "https://logo.clearbit.com/sobha.com" },
        { name: "Brigade Group", url: "https://logo.clearbit.com/brigadegroup.com" },
        { name: "K Raheja Corp", url: "https://logo.clearbit.com/krahejacorp.com" },
        { name: "Kalpataru Projects", url: "https://logo.clearbit.com/kalpataruprojects.com" },
        { name: "Hiranandani Communities", url: "https://logo.clearbit.com/hiranandanicommunities.com" }
    ];

    // Build logo nodes
    let htmlContent = "";
    clients.forEach(c => {
        htmlContent += `<img src="${c.url}" alt="${c.name}" class="client-logo-img" onerror="this.style.display='none'">`;
    });

    // To make it loop infinitely without breaks, duplicate the logo nodes twice
    marqueeTrack.innerHTML = htmlContent + htmlContent + htmlContent;
}

/* =========================================================================
   3. STATS COUNT-UP ANIMATION
   ========================================================================= */
function initStatsCounters() {
    const statsSection = document.getElementById("stats");
    if (!statsSection) return;

    const statElements = document.querySelectorAll(".stat-number");

    ScrollTrigger.create({
        trigger: statsSection,
        start: "top bottom-=100",
        onEnter: () => {
            statElements.forEach(el => {
                const target = parseInt(el.getAttribute("data-target"));
                const tempObj = { val: 0 };
                
                gsap.to(tempObj, {
                    val: target,
                    duration: 2.2,
                    ease: "power2.out",
                    snap: { val: 1 },
                    onUpdate: () => {
                        el.textContent = tempObj.val;
                    }
                });
            });
        }
    });
}

/* =========================================================================
   4. DISCUSSION MODAL ACTIONS
   ========================================================================= */
function initModalControls() {
    const modal = document.getElementById("contact-modal");
    const openButtons = document.querySelectorAll(".btn-trigger-modal");
    const closeBtn = document.getElementById("modal-close");
    const form = document.getElementById("lead-capture-form");
    const successScreen = document.getElementById("modal-success");
    const successClose = document.getElementById("modal-success-close");

    if (!modal) return;

    // Open Modal
    openButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            modal.classList.add("open");
            document.body.style.overflow = "hidden"; // Disable background scrolling
        });
    });

    // Close Modal
    const closeModal = () => {
        modal.classList.remove("open");
        document.body.style.overflow = "";
        // Reset form after close animation completes
        setTimeout(() => {
            form.style.display = "flex";
            successScreen.style.display = "none";
            form.reset();
        }, 500);
    };

    closeBtn.addEventListener("click", closeModal);
    successClose.addEventListener("click", closeModal);

    // Close on overlay click
    modal.addEventListener("click", (e) => {
        if (e.target === modal) closeModal();
    });

    // Form Submit Submission
    form.addEventListener("submit", (e) => {
        e.preventDefault();
        
        // Grab inputs (For production, this would make an AJAX POST)
        const name = document.getElementById("lead-name").value;
        const email = document.getElementById("lead-email").value;
        const division = document.getElementById("lead-division").value;
        
        console.log(`Lead Generated: Name=${name}, Email=${email}, Target=${division}`);

        // Animate success screen transition
        form.style.display = "none";
        successScreen.style.display = "flex";
    });
}

/* =========================================================================
   5. REAL-TIME SCADA TELEMETRY OSCILLOSCOPE (CANVAS DRAWING)
   ========================================================================= */
function initScadaChartSimulator() {
    const canvas = document.getElementById("duton-chart-canvas");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    
    // Fit to container width/height
    let width = canvas.width = canvas.parentElement.clientWidth;
    let height = canvas.height = canvas.parentElement.clientHeight;

    window.addEventListener("resize", () => {
        if (!canvas) return;
        width = canvas.width = canvas.parentElement.clientWidth;
        height = canvas.height = canvas.parentElement.clientHeight;
    });

    const points = [];
    const maxPoints = 60;
    
    // Fill initial grid points
    for (let i = 0; i < maxPoints; i++) {
        points.push(height / 2);
    }

    let timePhase = 0;
    let scrollSpeedTracker = 0;
    let lastScrollY = window.scrollY;

    // Measure scroll speed to dynamically perturb the wave
    window.addEventListener("scroll", () => {
        const currentY = window.scrollY;
        const delta = Math.abs(currentY - lastScrollY);
        scrollSpeedTracker += delta * 0.15;
        lastScrollY = currentY;
    });

    // Theme-dependent colors
    let canvasBg = "#f8f9fb";
    let gridColor = "#e2e8f0";

    function updateColors() {
        const theme = document.body.getAttribute("data-theme") || "light";
        if (theme === "dark") {
            canvasBg = "#1C1C1E";
            gridColor = "#3A3A3E";
        } else {
            canvasBg = "#f8f9fb";
            gridColor = "#e2e8f0";
        }
    }
    
    updateColors();
    document.addEventListener("themechange", updateColors);

    function drawChart() {
        requestAnimationFrame(drawChart);

        // Clear canvas
        ctx.fillStyle = canvasBg;
        ctx.fillRect(0, 0, width, height);

        // Draw grid lines
        ctx.strokeStyle = gridColor;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);

        // Horizontal Grid lines
        for (let y = height / 5; y < height; y += height / 5) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }

        // Vertical Grid lines
        for (let x = width / 6; x < width; x += width / 6) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }

        ctx.setLineDash([]); // Reset line dash style

        // Calculate next wave node with noise + scroll-induced spikes
        timePhase += 0.08;
        const baseFrequency = 0.2;
        const speedPerturbation = Math.min(scrollSpeedTracker * 0.8, 12); // Cap spike influence
        const baseAmplitude = 18 + speedPerturbation * 2;

        const newY = height / 2 + 
            Math.sin(timePhase) * baseAmplitude + 
            Math.cos(timePhase * 2.3) * (baseAmplitude * 0.3) + 
            (Math.random() - 0.5) * (5 + speedPerturbation);

        // Decay scroll speed metric slowly back to 0
        scrollSpeedTracker *= 0.96;

        // Shift points list left and add new
        points.shift();
        points.push(newY);

        // Draw Wave
        ctx.strokeStyle = "#f97316"; // Brand Orange
        ctx.lineWidth = 2.5;
        ctx.shadowBlur = 12;
        ctx.shadowColor = "#f97316";

        ctx.beginPath();
        for (let i = 0; i < maxPoints; i++) {
            const x = (width / (maxPoints - 1)) * i;
            const y = points[i];
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();

        // Draw gradient area under curve
        ctx.shadowBlur = 0; // Disable shadow glow for fill
        ctx.strokeStyle = "transparent";
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();

        const grad = ctx.createLinearGradient(0, height / 2, 0, height);
        grad.addColorStop(0, "rgba(249, 115, 22, 0.15)");
        grad.addColorStop(1, "rgba(249, 115, 22, 0)");
        ctx.fillStyle = grad;
        ctx.fill();
    }

    drawChart();
}

/* =========================================================================
   6. GLOBAL LIGHT/DARK THEME SWITCHER
   ========================================================================= */
function initThemeSwitcher() {
    const switcherBtn = document.getElementById("theme-switcher-btn");
    const heroBgImg = document.getElementById("hero-background-image");
    const coescImg = document.getElementById("solution-coesc-image");
    const footerLogo = document.querySelector(".footer-logo-img");

    if (!switcherBtn) return;

    // Load saved theme or default to light
    let currentTheme = localStorage.getItem("theme") || "light";
    setTheme(currentTheme);

    switcherBtn.addEventListener("click", () => {
        currentTheme = currentTheme === "light" ? "dark" : "light";
        setTheme(currentTheme);
    });

    function setTheme(theme) {
        document.body.setAttribute("data-theme", theme);
        localStorage.setItem("theme", theme);

        // Update image assets reactively
        if (heroBgImg) {
            heroBgImg.src = theme === "dark" ? "assets/digital_twin_dark.png" : "assets/digital_twin_light.png";
        }
        if (coescImg) {
            coescImg.src = theme === "dark" ? "assets/digital_twin_dark.png" : "assets/digital_twin_light.png";
        }
        if (footerLogo) {
            footerLogo.src = theme === "dark" ? "assets/logo_florosense_light.png" : "assets/logo_florosense.png";
        }

        // Broadcast event for Three.js and SCADA Canvas drawing
        const event = new CustomEvent("themechange", { detail: { theme: theme } });
        document.dispatchEvent(event);
    }
}

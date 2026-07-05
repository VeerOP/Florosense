/* ----------------------------------------------------
   COESC PORTAL APPLICATION LOGIC
   ---------------------------------------------------- */

document.addEventListener("DOMContentLoaded", () => {
    initThemeManager();
    initMobileNav();
    initThreeDModel();
    initComplianceWizard();
    initScrollAnimations();
});

/* =========================================================================
   1. THEME MANAGER
   ========================================================================= */
function initThemeManager() {
    const themeSwitcher = document.getElementById("theme-switcher-btn");
    const logoImg = document.querySelector(".navbar-logo-img");

    let activeTheme = localStorage.getItem("theme") || "light";
    setTheme(activeTheme);

    if (themeSwitcher) {
        themeSwitcher.addEventListener("click", () => {
            activeTheme = activeTheme === "light" ? "dark" : "light";
            setTheme(activeTheme);
        });
    }

    function setTheme(theme) {
        document.body.setAttribute("data-theme", theme);
        localStorage.setItem("theme", theme);

        if (logoImg) {
            logoImg.src = theme === "dark" 
                ? "../assets/logo_florosense_light.png" 
                : "../assets/logo_florosense.png";
        }

        const event = new CustomEvent("themechange", { detail: { theme: theme } });
        document.dispatchEvent(event);
    }
}

/* =========================================================================
   2. THREE.JS rotating FRAMEWORK NODE NET
   ========================================================================= */
function initThreeDModel() {
    const canvas = document.getElementById("coesc-3d-canvas");
    if (!canvas) return;

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 8);

    const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = false;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;

    // Node network configuration
    const nodeGroup = new THREE.Group();
    scene.add(nodeGroup);

    const particleCount = 40;
    const particlesGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const nodes = [];

    // Generate random nodes in a sphere shape
    for(let i=0; i<particleCount; i++) {
        const u = Math.random();
        const v = Math.random();
        const theta = u * 2.0 * Math.PI;
        const phi = Math.acos(2.0 * v - 1.0);
        const r = 2.0 + Math.random() * 0.5;

        const x = r * Math.sin(phi) * Math.cos(theta);
        const y = r * Math.sin(phi) * Math.sin(theta);
        const z = r * Math.cos(phi);

        positions[i*3] = x;
        positions[i*3+1] = y;
        positions[i*3+2] = z;

        nodes.push(new THREE.Vector3(x, y, z));
    }

    particlesGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const nodeMaterial = new THREE.PointsMaterial({
        color: 0x2563eb,
        size: 0.12,
        transparent: true,
        opacity: 0.8
    });

    const nodePoints = new THREE.Points(particlesGeo, nodeMaterial);
    nodeGroup.add(nodePoints);

    // Draw connection lines between close nodes
    const lineMaterial = new THREE.LineBasicMaterial({
        color: 0x3b82f6,
        transparent: true,
        opacity: 0.2
    });

    const linePositions = [];
    for(let i=0; i<particleCount; i++) {
        for(let j=i+1; j<particleCount; j++) {
            const dist = nodes[i].distanceTo(nodes[j]);
            if(dist < 1.8) {
                linePositions.push(nodes[i].x, nodes[i].y, nodes[i].z);
                linePositions.push(nodes[j].x, nodes[j].y, nodes[j].z);
            }
        }
    }

    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
    const lines = new THREE.LineSegments(lineGeo, lineMaterial);
    nodeGroup.add(lines);

    // Dynamic scale oscillation representing checks/audits
    let tick = 0;
    function animate() {
        requestAnimationFrame(animate);
        tick++;

        nodeGroup.rotation.y = tick * 0.003;
        nodeGroup.rotation.x = Math.sin(tick * 0.001) * 0.15;

        // Slight breathing effect
        const scale = 1.0 + Math.sin(tick * 0.01) * 0.03;
        nodeGroup.scale.set(scale, scale, scale);

        controls.update();
        renderer.render(scene, camera);
    }
    animate();

    window.addEventListener("resize", () => {
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
    });
}

/* =========================================================================
   3. COMPLIANCE WIZARD QUESTIONNAIRE
   ========================================================================= */
function initComplianceWizard() {
    let currentStep = 1;
    
    // Selections state
    const selections = {
        category: "orange",
        water: "municipal",
        hse: "spcb"
    };

    const steps = document.querySelectorAll(".wizard-step");
    const progressBar = document.getElementById("wizard-progress-bar");
    
    const btnPrev = document.getElementById("wizard-btn-prev");
    const btnNext = document.getElementById("wizard-btn-next");
    const checklistItems = document.getElementById("checklist-items");

    // Category options binding
    bindOptions("opt-cat", (val) => {
        selections.category = val;
        renderChecklist();
    });

    // Water options binding
    bindOptions("opt-water", (val) => {
        selections.water = val;
        renderChecklist();
    });

    // HSE options binding
    bindOptions("opt-hse", (val) => {
        selections.hse = val;
        renderChecklist();
    });

    function bindOptions(className, onSelect) {
        const options = document.querySelectorAll("." + className);
        options.forEach(opt => {
            opt.addEventListener("click", () => {
                options.forEach(o => o.classList.remove("selected"));
                opt.classList.add("selected");
                onSelect(opt.dataset.value);
            });
        });
    }

    // Nav buttons
    if (btnNext) {
        btnNext.addEventListener("click", () => {
            if(currentStep < 3) {
                currentStep++;
                showStep(currentStep);
            }
        });
    }

    if (btnPrev) {
        btnPrev.addEventListener("click", () => {
            if(currentStep > 1) {
                currentStep--;
                showStep(currentStep);
            }
        });
    }

    function showStep(stepNum) {
        steps.forEach(step => step.classList.remove("active"));
        document.getElementById(`step-${stepNum}`).classList.add("active");

        // Progress bar width
        progressBar.style.width = (stepNum === 1 ? 33 : (stepNum === 2 ? 66 : 100)) + "%";

        // Navigation labels
        if(stepNum === 1) {
            btnPrev.style.visibility = "hidden";
        } else {
            btnPrev.style.visibility = "visible";
        }

        if(stepNum === 3) {
            btnNext.innerText = "Completed";
            btnNext.disabled = true;
            btnNext.style.opacity = 0.5;
        } else {
            btnNext.innerText = "Next Step";
            btnNext.disabled = false;
            btnNext.style.opacity = 1.0;
        }
    }

    // Build the checklist based on configuration state
    function renderChecklist() {
        if(!checklistItems) return;

        let html = "";

        // 1. SPCB CTE/CTO Consent (Base item)
        let catColorText = selections.category.toUpperCase();
        let catTimeline = selections.category === "red" ? "90-120 Days" : (selections.category === "orange" ? "60-90 Days" : "30-45 Days");
        let feeLevel = selections.category === "red" ? "High Regulatory CTE/CTO filing fee structure applies." : "Standard state consent fees apply.";

        html += `
            <div class="checklist-item">
                <i data-lucide="file-text" class="checklist-icon"></i>
                <div class="checklist-info">
                    <h4>SPCB Consent CTE & CTO (${catColorText} Category)</h4>
                    <p>State Pollution Control Board Consent to Establish and Consent to Operate applications. Required prior to site construction and plant setup. ${feeLevel}</p>
                    <span class="checklist-time">Processing: ${catTimeline}</span>
                </div>
            </div>
        `;

        // 2. Ground Water Clearance NOC (if borewell groundwater)
        if (selections.water === "borewell") {
            html += `
                <div class="checklist-item">
                    <i data-lucide="droplet" class="checklist-icon"></i>
                    <div class="checklist-info">
                        <h4>CGWA / SGWA Ground Water NOC</h4>
                        <p>Central or State Ground Water Authority clearance certification. Legally mandatory for industrial units withdrawing water from groundwater aquifers.</p>
                        <span class="checklist-time">Processing: 120-180 Days</span>
                    </div>
                </div>
            `;
        }

        // 3. Environmental Clearance EC (if Red category or highly regulated industry)
        if (selections.category === "red") {
            html += `
                <div class="checklist-item">
                    <i data-lucide="shield-alert" class="checklist-icon"></i>
                    <div class="checklist-info">
                        <h4>Environmental Clearance (EC) - SEIAA / MoEFCC</h4>
                        <p>Ministry of Environment, Forest and Climate Change or State authority compliance review. Required for chemical plants, distilleries, and high-impact manufacturing.</p>
                        <span class="checklist-time">Processing: 6-9 Months</span>
                    </div>
                </div>
            `;
        }

        // 4. ESG Audits & Green Building (if requested)
        if (selections.hse === "greenbuilding") {
            html += `
                <div class="checklist-item">
                    <i data-lucide="leaf" class="checklist-icon"></i>
                    <div class="checklist-info">
                        <h4>LEED / IGBC Green Rating Liaisoning</h4>
                        <p>Liaisoning and green certification engineering support for building licenses. Optimization of water balance layouts, energy consumption levels, and carbon footprint audits.</p>
                        <span class="checklist-time">Processing: 3-5 Months</span>
                    </div>
                </div>
            `;
        }

        // 5. Fire Safety and corporate safety audits
        if (selections.hse === "full") {
            html += `
                <div class="checklist-item">
                    <i data-lucide="flame" class="checklist-icon"></i>
                    <div class="checklist-info">
                        <h4>Fire Safety NOC & HSE Risk Auditing</h4>
                        <p>State Fire Force NOC Clearance and hazardous chemicals safety validation checks, including emergency escape route planning and structural stability testing.</p>
                        <span class="checklist-time">Processing: 60-90 Days</span>
                    </div>
                </div>
            `;
        }

        checklistItems.innerHTML = html;
        lucide.createIcons(); // render icons inside dynamically loaded DOM content
    }

    // Initial show/renders
    showStep(1);
    renderChecklist();
}

/* =========================================================================
   4. GSAP SCROLL ANIMATIONS
   ========================================================================= */
function initScrollAnimations() {
    gsap.registerPlugin(ScrollTrigger);

    gsap.fromTo(".hero-badge", 
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }
    );

    gsap.fromTo(".hero-title", 
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, delay: 0.2, ease: "power3.out" }
    );

    gsap.fromTo(".hero-desc", 
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8, delay: 0.4, ease: "power2.out" }
    );

    gsap.fromTo(".hero-ctas", 
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.6, delay: 0.6, ease: "power2.out" }
    );

    gsap.fromTo(".canvas-card-3d", 
        { opacity: 0, scale: 0.95 },
        { opacity: 1, scale: 1.0, duration: 1, delay: 0.5, ease: "power2.out" }
    );

    // Services reveal
    gsap.utils.toArray(".serv-card").forEach((card, index) => {
        gsap.from(card, {
            scrollTrigger: {
                trigger: card,
                start: "top 85%"
            },
            opacity: 0,
            y: 30,
            duration: 0.6,
            delay: index * 0.15,
            ease: "power2.out"
        });
    });

    // Wizard section reveal
    gsap.from(".wizard-card", {
        scrollTrigger: {
            trigger: ".wizard-section",
            start: "top 80%"
        },
        opacity: 0,
        y: 40,
        duration: 0.8,
        ease: "power3.out"
    });
}

/* =========================================================================
   5. MOBILE NAVBAR MENU TOGGLE
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
        
        if (window.lucide) {
            window.lucide.createIcons();
        }
    });

    // Close menu when a link is clicked
    navLinks.forEach(link => {
        link.addEventListener("click", () => {
            navMenu.classList.remove("open");
            toggleBtn.innerHTML = `<i data-lucide="menu"></i>`;
            if (window.lucide) {
                window.lucide.createIcons();
            }
        });
    });
}

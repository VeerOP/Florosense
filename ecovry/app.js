/* ----------------------------------------------------
   ECOVRY PORTAL APPLICATION LOGIC
   ---------------------------------------------------- */

document.addEventListener("DOMContentLoaded", () => {
    initThemeManager();
    initThreeDModel();
    initTimeline();
    initNanobubbleSimulator();
    initRoiCalculator();
    initScrollAnimations();
});

/* =========================================================================
   1. THEME MANAGER (SYNC WITH PARENT LOGIC)
   ========================================================================= */
function initThemeManager() {
    const themeSwitcher = document.getElementById("theme-switcher-btn");
    const logoImg = document.querySelector(".navbar-logo-img");

    // Retrieve active theme from localStorage or default to light
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

        // Notify other assets / canvas objects that theme changed
        const event = new CustomEvent("themechange", { detail: { theme: theme } });
        document.dispatchEvent(event);
    }
}

/* =========================================================================
   2. THREE.JS 3D modular BIOREACTOR RENDERER
   ========================================================================= */
function initThreeDModel() {
    const canvas = document.getElementById("ecovry-3d-canvas");
    if (!canvas) return;

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 4, 10);

    const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Controls
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = false; // Disable zoom to avoid scrolling interference
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.8;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 8, 5);
    scene.add(dirLight);

    const pointLightOrange = new THREE.PointLight(0xf97316, 2, 10);
    pointLightOrange.position.set(-2, 1, 2);
    scene.add(pointLightOrange);

    // Bioreactor Assembly Group
    const reactorGroup = new THREE.Group();
    scene.add(reactorGroup);

    // Foundation Plate
    const baseGeo = new THREE.BoxGeometry(6, 0.2, 3.5);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = -1.2;
    reactorGroup.add(base);

    // Three glass chambers
    const tankMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.25,
        transmission: 0.8,
        roughness: 0.1,
        metalness: 0.1,
        depthWrite: false
    });

    const tankGeo = new THREE.CylinderGeometry(0.8, 0.8, 2.2, 32);

    const tank1 = new THREE.Mesh(tankGeo, tankMaterial);
    tank1.position.set(-1.8, 0, 0);
    reactorGroup.add(tank1);

    const tank2 = new THREE.Mesh(tankGeo, tankMaterial);
    tank2.position.set(0, 0, 0);
    reactorGroup.add(tank2);

    const tank3 = new THREE.Mesh(tankGeo, tankMaterial);
    tank3.position.set(1.8, 0, 0);
    reactorGroup.add(tank3);

    // Liquid inside middle tank (Aeration core)
    const liquidGeo = new THREE.CylinderGeometry(0.76, 0.76, 1.8, 32);
    const liquidMat = new THREE.MeshStandardMaterial({
        color: 0xf97316,
        transparent: true,
        opacity: 0.6,
        roughness: 0.2
    });
    const liquid = new THREE.Mesh(liquidGeo, liquidMat);
    liquid.position.set(0, -0.1, 0);
    reactorGroup.add(liquid);

    // Pipes connecting chambers
    const pipeMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.4, metalness: 0.8 });
    
    // Pipe 1-2
    const pipe12Geo = new THREE.CylinderGeometry(0.12, 0.12, 1.2, 16);
    const pipe12 = new THREE.Mesh(pipe12Geo, pipeMat);
    pipe12.rotation.z = Math.PI / 2;
    pipe12.position.set(-0.9, 0.5, 0);
    reactorGroup.add(pipe12);

    // Pipe 2-3
    const pipe23 = pipe12.clone();
    pipe23.position.set(0.9, -0.5, 0);
    reactorGroup.add(pipe23);

    // Flowing Water Particle System inside chambers and pipes
    const particleCount = 200;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const speeds = new Float32Array(particleCount);

    for(let i=0; i<particleCount; i++) {
        // Initial random placements in assembly
        positions[i*3] = (Math.random() - 0.5) * 4;
        positions[i*3+1] = (Math.random() - 0.5) * 2;
        positions[i*3+2] = (Math.random() - 0.5) * 1.2;
        speeds[i] = 0.02 + Math.random() * 0.03;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const particleMaterial = new THREE.PointsMaterial({
        color: 0x38bdf8,
        size: 0.08,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
    });

    const flowParticles = new THREE.Points(particleGeometry, particleMaterial);
    reactorGroup.add(flowParticles);

    // Speed multiplier driven by service timeline phases
    let flowSpeedMultiplier = 1.0;

    // Animation Loop
    function animate() {
        requestAnimationFrame(animate);

        // Update particle flows
        const posAttr = particleGeometry.attributes.position;
        const array = posAttr.array;

        for (let i = 0; i < particleCount; i++) {
            // Liquid flow simulation path:
            // Go up in Tank 1, cross to Tank 2, go down in Tank 2, cross to Tank 3, go up in Tank 3
            array[i*3+1] += speeds[i] * flowSpeedMultiplier; // rise

            // Reset particle when it escapes tank height
            if(array[i*3+1] > 1.0) {
                array[i*3+1] = -1.0;
                array[i*3] = (Math.random() - 0.5) * 4.5;
            }
        }
        posAttr.needsUpdate = true;

        controls.update();
        renderer.render(scene, camera);
    }

    animate();

    // Listen to service phase selections
    document.addEventListener("phasechange", (e) => {
        const phase = e.detail.phase;
        
        // Speed & intensity scaling per phase
        if (phase === 1) flowSpeedMultiplier = 0.3;
        else if (phase === 2) flowSpeedMultiplier = 0.7;
        else if (phase === 3) flowSpeedMultiplier = 2.4; // Nanobubbles active!
        else if (phase === 4) flowSpeedMultiplier = 1.3; // Optimal running
        else if (phase === 5) flowSpeedMultiplier = 0.9; // Compliance check

        // Material color shifts per phase
        const phaseColors = {
            1: 0x38bdf8, // Deep blue (feasibility audit)
            2: 0x06b6d4, // Cyan (construction)
            3: 0xf97316, // Orange (aeration physics)
            4: 0x10b981, // Emerald Green (operations running)
            5: 0xeab308  // Gold (compliance CTO liaisoning)
        };
        particleMaterial.color.setHex(phaseColors[phase]);

        // Dashboard text values matching simulated service telemetry
        const telemetryDO = document.getElementById("telemetry-do");
        const telemetryFlow = document.getElementById("telemetry-flow");
        const telemetrySLA = document.getElementById("telemetry-sla");

        if (phase === 1) {
            if (telemetryDO) telemetryDO.innerText = "0.0 mg/L";
            if (telemetryFlow) telemetryFlow.innerText = "0 KLD";
            if (telemetrySLA) telemetrySLA.innerText = "Audit Peak";
        } else if (phase === 2) {
            if (telemetryDO) telemetryDO.innerText = "0.1 mg/L";
            if (telemetryFlow) telemetryFlow.innerText = "15 KLD";
            if (telemetrySLA) telemetrySLA.innerText = "Civil Ready";
        } else if (phase === 3) {
            if (telemetryDO) telemetryDO.innerText = "6.4 mg/L";
            if (telemetryFlow) telemetryFlow.innerText = "75 KLD";
            if (telemetrySLA) telemetrySLA.innerText = "OTE 88%";
        } else if (phase === 4) {
            if (telemetryDO) telemetryDO.innerText = "4.2 mg/L";
            if (telemetryFlow) telemetryFlow.innerText = "100 KLD";
            if (telemetrySLA) telemetrySLA.innerText = "100.0%";
        } else if (phase === 5) {
            if (telemetryDO) telemetryDO.innerText = "4.1 mg/L";
            if (telemetryFlow) telemetryFlow.innerText = "100 KLD";
            if (telemetrySLA) telemetrySLA.innerText = "SPCB CTO";
        }
    });

    // Handle Resize
    window.addEventListener("resize", () => {
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
    });
}

/* =========================================================================
   2B. TIMELINE TABS INTERACTIVITY
   ========================================================================= */
function initTimeline() {
    const navButtons = document.querySelectorAll(".timeline-nav-btn");
    const phaseContents = document.querySelectorAll(".timeline-phase-content");

    navButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const phase = btn.getAttribute("data-phase");

            navButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            phaseContents.forEach(content => {
                content.classList.remove("active");
            });

            const activeContent = document.getElementById(`phase-${phase}-content`);
            if (activeContent) {
                activeContent.classList.add("active");
            }

            // Dispatch event to affect Three.js particles speed/color
            const event = new CustomEvent("phasechange", { detail: { phase: parseInt(phase) } });
            document.dispatchEvent(event);
        });
    });
}

/* =========================================================================
   3. NANOBUBBLE PHYSICS SIMULATOR (2D CANVAS)
   ========================================================================= */
function initNanobubbleSimulator() {
    const canvas = document.getElementById("bubble-canvas");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const bubbleSizeSlider = document.getElementById("bubble-size");
    const retentionSlider = document.getElementById("retention-time");
    const bubbleSizeVal = document.getElementById("bubbleSizeVal");
    const retentionVal = document.getElementById("retentionVal");
    
    const oteVal = document.getElementById("ote-val");
    const energySaveVal = document.getElementById("energy-save-val");

    // Canvas size sync
    function resizeCanvas() {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
    }
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Bubble Class
    class Bubble {
        constructor(isNanobubble) {
            this.isNanobubble = isNanobubble;
            this.reset();
        }

        reset() {
            this.x = Math.random() * canvas.width;
            this.y = this.isNanobubble 
                ? Math.random() * canvas.height 
                : canvas.height + Math.random() * 20;
            
            // Traditional bubbles rise fast, Nanobubbles drift horizontally (Brownian)
            if (this.isNanobubble) {
                this.r = 0.5 + Math.random() * 1.2;
                this.vx = (Math.random() - 0.5) * 0.6;
                this.vy = (Math.random() - 0.5) * 0.2 - 0.05; // tiny upward bias
            } else {
                this.r = 3 + Math.random() * 6;
                this.vx = (Math.random() - 0.5) * 0.4;
                this.vy = -(1.5 + Math.random() * 2.5); // fast rise
            }
        }

        update(time, flowStrength) {
            if (this.isNanobubble) {
                // Brownian random walk
                this.vx += (Math.random() - 0.5) * 0.1;
                this.vy += (Math.random() - 0.5) * 0.05;
                
                // Clamp velocities
                this.vx = Math.max(-0.8, Math.min(0.8, this.vx));
                this.vy = Math.max(-0.6, Math.min(0.6, this.vy));
            }

            // Apply fluid current based on mouse drag/move
            this.x += this.vx + flowStrength.x;
            this.y += this.vy + flowStrength.y;

            // Boundaries
            if (this.x < 0) this.x = canvas.width;
            if (this.x > canvas.width) this.x = 0;

            if (this.isNanobubble) {
                if (this.y < 0) this.y = canvas.height;
                if (this.y > canvas.height) this.y = 0;
            } else {
                if (this.y < -10) this.reset();
            }
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
            if (this.isNanobubble) {
                ctx.fillStyle = "rgba(14, 165, 233, 0.6)"; // Sky blue
                ctx.fill();
            } else {
                ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
                ctx.lineWidth = 1;
                ctx.stroke();
                ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
                ctx.fill();
            }
        }
    }

    // Fluid current controller
    let flowStrength = { x: 0, y: 0 };
    canvas.addEventListener("mousemove", (e) => {
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        // Generate current relative to canvas center
        flowStrength.x = (mx - canvas.width / 2) * 0.005;
    });

    canvas.addEventListener("mouseleave", () => {
        gsap.to(flowStrength, { x: 0, y: 0, duration: 1.5 });
    });

    const particles = [];
    const maxParticles = 120;

    // Simulation loop
    function loop(time) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Determine fraction of nanobubbles based on slider
        const sizeMicrons = parseFloat(bubbleSizeSlider.value);
        const isNano = sizeMicrons <= 1.0;

        // Maintain particle counts
        while (particles.length < maxParticles) {
            particles.push(new Bubble(isNano));
        }

        // Check if settings shifted
        particles.forEach(p => {
            if (p.isNanobubble !== isNano) {
                p.isNanobubble = isNano;
                p.reset();
            }
        });

        // Update and draw
        particles.forEach(p => {
            p.update(time, flowStrength);
            p.draw();
        });

        requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);

    // React to Slider adjustments
    function updateMetrics() {
        const size = parseFloat(bubbleSizeSlider.value);
        const retention = parseFloat(retentionSlider.value);

        bubbleSizeVal.innerText = size >= 1000 
            ? `${(size/1000).toFixed(1)} mm` 
            : `${size.toFixed(0)} nm`;

        retentionVal.innerText = retention >= 60 
            ? `${(retention/60).toFixed(1)} Hours` 
            : `${retention.toFixed(0)} Mins`;

        // Calculate OTE% (Oxygen Transfer Efficiency)
        // Drops exponentially from 88% down to 15% as size increases
        let ote = 15;
        if (size <= 200) {
            ote = 88;
        } else if (size <= 1000) {
            // interpolation
            ote = 88 - ((size - 200) / 800) * 45;
        } else {
            ote = 43 - ((size - 1000) / 9000) * 28;
        }
        oteVal.innerText = `${Math.round(ote)}%`;

        // Energy Savings calculations
        let energySave = Math.round((ote - 15) * 0.5);
        energySave = Math.max(0, Math.min(38, energySave));
        energySaveVal.innerText = `${energySave}%`;
    }

    bubbleSizeSlider.addEventListener("input", updateMetrics);
    retentionSlider.addEventListener("input", updateMetrics);
    updateMetrics(); // Initial calculations
}

/* =========================================================================
   4. WATER BALANCE & ROI CALCULATOR
   ========================================================================= */
function initRoiCalculator() {
    const inputCapacity = document.getElementById("calc-capacity");
    const inputOpex = document.getElementById("calc-opex");
    
    const valCapacity = document.getElementById("lbl-capacity");
    const valOpex = document.getElementById("lbl-opex");

    const resRecycled = document.getElementById("res-recycled");
    const resCapexPayback = document.getElementById("res-payback");
    const resSavings = document.getElementById("res-savings");

    function calculate() {
        const cap = parseFloat(inputCapacity.value);
        const tariff = parseFloat(inputOpex.value);

        valCapacity.innerText = `${cap.toLocaleString('en-IN')} KLD`;
        valOpex.innerText = `₹ ${tariff}/kWh`;

        // Math Formulas
        const waterRecycledPerDay = cap * 0.98; // 98% efficiency
        const waterRecycledPerYear = waterRecycledPerDay * 365;

        // Savings model: Water cost savings + energy savings
        // Typical cost of buying tanker water is Rs 100 per KL
        const waterPurchaseCostSaved = waterRecycledPerYear * 110; 
        
        // Energy saved vs traditional treatment
        const energySavedPerYear = cap * 1.2 * 365 * (tariff * 0.35); // 35% savings

        const totalYearlySavings = waterPurchaseCostSaved + energySavedPerYear;

        // Payback timeline
        const extraCapex = cap * 3500; // premium cost of modular nanobubble unit
        const paybackMonths = Math.max(6, Math.ceil((extraCapex / totalYearlySavings) * 12));

        // Format UI
        resRecycled.innerText = `${Math.round(waterRecycledPerYear).toLocaleString('en-IN')} L`;
        resSavings.innerText = `₹ ${Math.round(totalYearlySavings).toLocaleString('en-IN')}`;
        resCapexPayback.innerText = `${paybackMonths} Months`;
    }

    inputCapacity.addEventListener("input", calculate);
    inputOpex.addEventListener("input", calculate);
    calculate();
}

/* =========================================================================
   5. GSAP SCROLL ANIMATIONS
   ========================================================================= */
function initScrollAnimations() {
    // Register ScrollTrigger
    gsap.registerPlugin(ScrollTrigger);

    // Hero fade-in
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

    // Scroll reveal cards
    gsap.utils.toArray(".cap-card").forEach((card, index) => {
        gsap.from(card, {
            scrollTrigger: {
                trigger: card,
                start: "top 85%",
                toggleActions: "play none none none"
            },
            opacity: 0,
            y: 30,
            duration: 0.6,
            delay: index * 0.15,
            ease: "power2.out"
        });
    });

    // Reveal Simulators
    gsap.from(".sim-card", {
        scrollTrigger: {
            trigger: ".sim-section",
            start: "top 80%"
        },
        opacity: 0,
        y: 40,
        duration: 0.8,
        ease: "power3.out"
    });
}

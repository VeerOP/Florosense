/* ----------------------------------------------------
   ECOVRY PORTAL APPLICATION LOGIC
   ---------------------------------------------------- */

document.addEventListener("DOMContentLoaded", () => {
    initThemeManager();
    initMobileNav();
    initThreeDModel();
    initTimeline();
    initNanobubbleSimulator();
    initRoiCalculator();
    initVioletShredderSimulator();
    initScrollAnimations();
});

/* =========================================================================
   1. THEME MANAGER (SYNC WITH PARENT LOGIC)
   ========================================================================= */
function initThemeManager() {
    const themeSwitcher = document.getElementById("theme-switcher-btn");
    const logoImg = document.querySelector(".navbar-logo-img");
    const footerLogo = document.querySelector(".footer-logo-img");

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
        if (footerLogo) {
            footerLogo.src = theme === "dark" 
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

    const parent = canvas.parentElement;
    const width = parent ? parent.clientWidth : canvas.clientWidth;
    const height = parent ? parent.clientHeight : canvas.clientHeight;

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

    // Handle Resize using parent element to prevent layout locking
    window.addEventListener("resize", () => {
        const parent = canvas.parentElement;
        if (!parent) return;
        const w = parent.clientWidth;
        const h = parent.clientHeight;
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
    if (navButtons.length === 0) return;

    let currentPhase = 1;
    let isScrollingProgrammatic = false;

    function setActivePhase(phaseNum) {
        if (currentPhase === phaseNum) return;
        currentPhase = phaseNum;

        navButtons.forEach(b => {
            if (parseInt(b.getAttribute("data-phase")) === phaseNum) {
                b.classList.add("active");
            } else {
                b.classList.remove("active");
            }
        });

        phaseContents.forEach(content => {
            content.classList.remove("active");
        });

        const activeContent = document.getElementById(`phase-${phaseNum}-content`);
        if (activeContent) {
            activeContent.classList.add("active");
        }

        // Dispatch event to affect Three.js particles speed/color
        const event = new CustomEvent("phasechange", { detail: { phase: phaseNum } });
        document.dispatchEvent(event);
    }

    // Register ScrollTrigger and ScrollToPlugin inside GSAP context
    gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

    let pinTrigger = null;

    // Responsive Scroll-Pinning design: only enable on desktop screens where viewport height is comfortable
    const mm = gsap.matchMedia();
    mm.add("(min-width: 992px) and (min-height: 750px)", () => {
        pinTrigger = ScrollTrigger.create({
            trigger: "#capabilities",
            start: "top 80px", // Pin below the sticky header
            end: "+=1800",
            pin: true,
            scrub: true,
            onUpdate: (self) => {
                const p = self.progress;
                let phase = 1;
                if (p < 0.2) phase = 1;
                else if (p < 0.4) phase = 2;
                else if (p < 0.6) phase = 3;
                else if (p < 0.8) phase = 4;
                else phase = 5;

                if (!isScrollingProgrammatic) {
                    setActivePhase(phase);
                }
            }
        });

        return () => {
            if (pinTrigger) pinTrigger.kill();
        };
    });

    // Handle manual tab clicks with programmatic scrolling to matching scroll percentage
    navButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const phaseNum = parseInt(btn.getAttribute("data-phase"));
            setActivePhase(phaseNum);

            if (pinTrigger) {
                isScrollingProgrammatic = true;
                const scrollStep = (pinTrigger.end - pinTrigger.start) / 4;
                const targetScroll = pinTrigger.start + (phaseNum - 1) * scrollStep + 15;

                gsap.to(window, {
                    scrollTo: targetScroll,
                    duration: 0.8,
                    ease: "power2.out",
                    onComplete: () => {
                        isScrollingProgrammatic = false;
                    }
                });
            }
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

    // Canvas size sync using parent boundaries to prevent static size clamping
    function resizeCanvas() {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight || 380;
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
            
            if (this.isNanobubble) {
                this.r = 0.5 + Math.random() * 1.0;
                this.vx = (Math.random() - 0.5) * 0.5;
                this.vy = (Math.random() - 0.5) * 0.15 - 0.05; // tiny upward bias
                
                // Track dynamic suspension lifespan based on retention slider
                const retention = parseFloat(retentionSlider.value);
                if (retention === 3600) {
                    this.maxLifespan = Infinity;
                    this.lifespan = Infinity;
                } else {
                    this.maxLifespan = 120 + (retention * 0.4) + Math.random() * 180;
                    this.lifespan = Math.random() * this.maxLifespan;
                }
            } else {
                // Scale bubble radius dynamically based on size slider
                const sliderVal = parseFloat(bubbleSizeSlider.value);
                const scale = (sliderVal - 1000) / 9000;
                this.r = 3 + scale * 8 + Math.random() * 2;
                this.vx = (Math.random() - 0.5) * 0.4;
                this.vy = -(1.2 + scale * 2.8 + Math.random() * 1.5); // Fast rise for macro
                this.maxLifespan = Infinity;
                this.lifespan = Infinity;
            }
        }

        update(time, flowStrength) {
            if (this.isNanobubble) {
                // Sync lifespan limits if slider changes dynamically
                const retention = parseFloat(retentionSlider.value);
                const wantsInfinity = (retention === 3600);
                const isCurrentlyInfinity = (this.maxLifespan === Infinity);

                if (wantsInfinity !== isCurrentlyInfinity) {
                    if (wantsInfinity) {
                        this.maxLifespan = Infinity;
                        this.lifespan = Infinity;
                    } else {
                        this.maxLifespan = 120 + (retention * 0.4) + Math.random() * 180;
                        this.lifespan = Math.random() * this.maxLifespan;
                    }
                }

                // Decrement lifespan if finite
                if (this.maxLifespan !== Infinity) {
                    this.lifespan--;
                    if (this.lifespan <= 0) {
                        this.reset();
                        return;
                    }
                }

                // Brownian random walk
                this.vx += (Math.random() - 0.5) * 0.08;
                this.vy += (Math.random() - 0.5) * 0.04;
                
                // Clamp velocities
                this.vx = Math.max(-0.6, Math.min(0.6, this.vx));
                this.vy = Math.max(-0.5, Math.min(0.5, this.vy));
            }

            // Apply fluid current based on mouse/touch drag
            this.x += this.vx + flowStrength.x;
            this.y += this.vy + flowStrength.y;

            // Boundaries
            if (this.x < -10) this.x = canvas.width + 10;
            if (this.x > canvas.width + 10) this.x = -10;

            if (this.isNanobubble) {
                if (this.y < -10) this.y = canvas.height + 10;
                if (this.y > canvas.height + 10) this.y = -10;
            } else {
                if (this.y < -15) this.reset();
            }
        }

        draw() {
            let drawRadius = this.r;
            let alpha = 0.5;

            if (this.isNanobubble && this.maxLifespan !== Infinity) {
                const ratio = Math.max(0, Math.min(1, this.lifespan / this.maxLifespan));
                alpha = ratio * 0.5;
                drawRadius = this.r * (0.3 + 0.7 * ratio); // shrink as it dissolves
            }

            ctx.beginPath();
            ctx.arc(this.x, this.y, drawRadius, 0, Math.PI * 2);
            
            if (this.isNanobubble) {
                ctx.fillStyle = `rgba(14, 165, 233, ${alpha})`; // Sky blue with alpha
                ctx.fill();
            } else {
                ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
                ctx.lineWidth = 1.2;
                ctx.stroke();
                ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
                ctx.fill();
                
                // highlight spot
                ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
                ctx.beginPath();
                ctx.arc(this.x - drawRadius * 0.3, this.y - drawRadius * 0.3, drawRadius * 0.15, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    // Interactive mouse/touch fluid current perturbation
    let flowStrength = { x: 0, y: 0 };
    let lastMouse = { x: 0, y: 0 };

    function trackMovement(clientX, clientY) {
        const rect = canvas.getBoundingClientRect();
        const mx = clientX - rect.left;
        const my = clientY - rect.top;
        if (lastMouse.x !== 0) {
            flowStrength.x += (mx - lastMouse.x) * 0.15;
            flowStrength.y += (my - lastMouse.y) * 0.15;
            // Clamp strength
            flowStrength.x = Math.max(-5, Math.min(5, flowStrength.x));
            flowStrength.y = Math.max(-5, Math.min(5, flowStrength.y));
        }
        lastMouse.x = mx;
        lastMouse.y = my;
    }

    canvas.addEventListener("mousemove", (e) => {
        trackMovement(e.clientX, e.clientY);
    });

    canvas.addEventListener("mouseleave", () => {
        gsap.to(flowStrength, { x: 0, y: 0, duration: 1.5 });
        lastMouse = { x: 0, y: 0 };
    });

    canvas.addEventListener("touchmove", (e) => {
        if (e.touches.length > 0) {
            trackMovement(e.touches[0].clientX, e.touches[0].clientY);
        }
    }, { passive: true });

    canvas.addEventListener("touchend", () => {
        gsap.to(flowStrength, { x: 0, y: 0, duration: 1.5 });
        lastMouse = { x: 0, y: 0 };
    });

    const particles = [];
    const maxParticles = 120;

    // Simulation loop
    function loop(time) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Natural decay of fluid current
        flowStrength.x *= 0.95;
        flowStrength.y *= 0.95;

        // Correct size microns conversion (slider value is nm, 1.0 micron is 1000 nm)
        const sizeMicrons = parseFloat(bubbleSizeSlider.value) / 1000.0;
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

        retentionVal.innerText = retention === 3600
            ? "Indefinite suspension"
            : (retention >= 60 
                ? `${(retention/60).toFixed(1)} Hours` 
                : `${retention.toFixed(0)} Mins`);

        // Calculate OTE% (Oxygen Transfer Efficiency)
        let ote = 15;
        if (size <= 200) {
            ote = 88;
        } else if (size <= 1000) {
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
        valOpex.innerText = `₹ ${tariff} / kWh`;

        // Math Formulas
        const waterRecycledPerDay = cap * 0.98; // 98% efficiency
        const waterRecycledPerYear = waterRecycledPerDay * 365; // in KL per year

        // Savings model: Water purchase cost savings + energy savings
        // Typical cost of buying tanker water is Rs 110 per KL
        const waterPurchaseCostSaved = waterRecycledPerYear * 110; 
        
        // Energy saved per year (35% energy offset)
        const energySavedPerYear = cap * 1.2 * 365 * (tariff * 0.35); 

        const totalYearlySavings = waterPurchaseCostSaved + energySavedPerYear;

        // Premium Capex: base equipment setup + volume scaling cost
        const extraCapex = 400000 + (cap * 36000); 
        const paybackMonths = Math.max(3, Math.ceil((extraCapex / totalYearlySavings) * 12));

        // Format UI (Convert KL to Liters by multiplying by 1000)
        resRecycled.innerText = `${Math.round(waterRecycledPerYear * 1000).toLocaleString('en-IN')} L`;
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

/* =========================================================================
   6. MOBILE NAVBAR MENU TOGGLE
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

/* =========================================================================
   7. INTERACTIVE VIOLET SHREDDER AOP SIMULATOR
   ========================================================================= */
function initVioletShredderSimulator() {
    const canvas = document.getElementById('shredder-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // State Management
    let isEcovry = false;
    let transitionT = 0; // 0 = Standard UV, 1 = Violet Shredder
    
    // Dimensions
    let W = canvas.width = canvas.parentElement.clientWidth;
    let H = canvas.height = canvas.parentElement.clientHeight || 380;
    let reactorBounds = { x1: 0, x2: 0, y1: 0, y2: 0 };

    // Entities
    let molecules = [];
    let particles = [];
    let radicals = [];

    // Colors
    const C_BG = '#05050A';
    const C_UV_STD = 'rgba(59, 130, 246, 0.15)'; // Pale blue UV
    const C_UV_ECO = 'rgba(139, 92, 246, 0.4)';  // Intense Violet
    const C_TIO2 = 'rgba(255, 255, 255, 0.3)';   // Grid lines
    const C_DUST = '#00ffff';                    // Destroyed remnants
    
    const TOXIN_COLORS = ['#ef4444', '#f97316', '#a3e635', '#ec4899'];

    // Init Canvas & Resize
    function resize() {
        if (!canvas.parentElement) return;
        W = canvas.width = canvas.parentElement.clientWidth;
        H = canvas.height = canvas.parentElement.clientHeight || 380;
        
        // Define Reactor Zone (Center 40% of screen)
        reactorBounds.x1 = W * 0.3;
        reactorBounds.x2 = W * 0.7;
        reactorBounds.y1 = H * 0.15;
        reactorBounds.y2 = H * 0.85;
    }
    window.addEventListener('resize', resize);
    resize();

    class Molecule {
        constructor() {
            this.reset();
            // Randomize starting x so they don't all spawn at once
            this.x = Math.random() * W * 0.3 - 100; 
        }

        reset() {
            this.x = -100; // Start off-screen left
            this.y = reactorBounds.y1 + 30 + Math.random() * (reactorBounds.y2 - reactorBounds.y1 - 60);
            this.vx = Math.random() * 1.2 + 0.8; // Flow speed
            this.vy = (Math.random() - 0.5) * 0.3;
            
            this.size = Math.random() * 10 + 10; // Large, complex molecules
            this.rotation = Math.random() * Math.PI * 2;
            this.rotSpeed = (Math.random() - 0.5) * 0.04;
            
            this.points = Math.floor(Math.random() * 4) + 5; // 5 to 8 sided polygons
            this.color = TOXIN_COLORS[Math.floor(Math.random() * TOXIN_COLORS.length)];
            
            this.shattered = false;
        }

        update() {
            if (this.shattered) return;

            this.x += this.vx;
            this.y += this.vy;
            this.rotation += this.rotSpeed;

            // Check if in Reactor Zone
            let inReactor = this.x > reactorBounds.x1 && this.x < reactorBounds.x2;
            
            if (inReactor && isEcovry) {
                // Trigger Photocatalytic Destruction!
                this.shatter();
            }

            // Reset if it goes off screen (Standard mode)
            if (this.x > W + 100) {
                this.reset();
            }
        }

        shatter() {
            this.shattered = true;
            // Create dust/remnants
            for (let i = 0; i < 15; i++) {
                particles.push(new Particle(this.x, this.y, this.color));
            }
            // Schedule respawn
            setTimeout(() => this.reset(), Math.random() * 1500 + 400);
        }

        draw() {
            if (this.shattered) return;

            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            
            ctx.beginPath();
            for (let i = 0; i < this.points; i++) {
                let angle = (i / this.points) * Math.PI * 2;
                let rad = this.size * (0.8 + Math.random() * 0.3); 
                let px = Math.cos(angle) * rad;
                let py = Math.sin(angle) * rad;
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            
            ctx.fillStyle = 'rgba(10, 10, 10, 0.85)';
            ctx.fill();
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 2.5;
            
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 8;
            ctx.stroke();
            
            // Draw inner complex bonds (lines)
            ctx.beginPath();
            ctx.moveTo(-this.size/2, 0);
            ctx.lineTo(this.size/2, 0);
            ctx.moveTo(0, -this.size/2);
            ctx.lineTo(0, this.size/2);
            ctx.strokeStyle = 'rgba(255,255,255,0.2)';
            ctx.lineWidth = 1;
            ctx.shadowBlur = 0;
            ctx.stroke();

            ctx.restore();
        }
    }

    class Particle {
        constructor(x, y, origColor) {
            this.x = x;
            this.y = y;
            this.vx = (Math.random() - 0.5) * 6 + 1.5; // Keep moving right generally
            this.vy = (Math.random() - 0.5) * 6;
            this.life = 1.0;
            this.decay = Math.random() * 0.03 + 0.015;
            
            this.color = Math.random() > 0.5 ? origColor : C_DUST;
            this.size = Math.random() * 2.5 + 1;
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;
            this.life -= this.decay;
            
            this.vx *= 0.96;
            this.vy *= 0.96;
        }

        draw() {
            if (this.life <= 0) return;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.globalAlpha = this.life;
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 8;
            ctx.fill();
            ctx.globalAlpha = 1.0;
            ctx.shadowBlur = 0;
        }
    }

    class Radical {
        constructor() {
            this.spawn();
        }
        spawn() {
            this.x = reactorBounds.x1 + Math.random() * (reactorBounds.x2 - reactorBounds.x1);
            this.y = reactorBounds.y1 + Math.random() * (reactorBounds.y2 - reactorBounds.y1);
            this.life = 1.0;
            this.decay = Math.random() * 0.06 + 0.04;
            this.size = Math.random() * 2 + 0.8;
        }
        update() {
            this.life -= this.decay;
            this.x += (Math.random() - 0.5) * 3;
            this.y += (Math.random() - 0.5) * 3;
            if (this.life <= 0) this.spawn();
        }
        draw() {
            if (this.life <= 0) return;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.globalAlpha = this.life;
            ctx.shadowColor = '#8b5cf6';
            ctx.shadowBlur = 12;
            ctx.fill();
            ctx.globalAlpha = 1.0;
            ctx.shadowBlur = 0;
        }
    }

    for (let i = 0; i < 20; i++) molecules.push(new Molecule());
    for (let i = 0; i < 40; i++) radicals.push(new Radical());

    function drawReactor() {
        // Tube Walls
        ctx.strokeStyle = '#27272a';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, reactorBounds.y1);
        ctx.lineTo(W, reactorBounds.y1);
        ctx.moveTo(0, reactorBounds.y2);
        ctx.lineTo(W, reactorBounds.y2);
        ctx.stroke();

        // Reactor Core Glow (Background)
        let coreW = reactorBounds.x2 - reactorBounds.x1;
        let coreH = reactorBounds.y2 - reactorBounds.y1;
        
        let opacityStd = 0.12 * (1 - transitionT);
        let opacityEco = 0.35 * transitionT;

        // Standard Light (Pale Blue)
        if (transitionT < 1) {
            ctx.fillStyle = `rgba(59, 130, 246, ${opacityStd})`;
            ctx.fillRect(reactorBounds.x1, reactorBounds.y1, coreW, coreH);
        }

        // Violet Light (Intense Violet)
        if (transitionT > 0) {
            ctx.fillStyle = `rgba(139, 92, 246, ${opacityEco})`;
            ctx.fillRect(reactorBounds.x1, reactorBounds.y1, coreW, coreH);
            
            // TiO2 Hexagonal Grid Overlay
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.08 * transitionT})`;
            ctx.lineWidth = 1;
            let hexSize = 16;
            ctx.beginPath();
            for (let x = reactorBounds.x1; x < reactorBounds.x2; x += hexSize * 1.5) {
                for (let y = reactorBounds.y1; y < reactorBounds.y2; y += hexSize * Math.sqrt(3)) {
                    ctx.moveTo(x, y);
                    ctx.lineTo(x + hexSize/2, y - hexSize);
                    ctx.lineTo(x + hexSize*1.5, y - hexSize);
                    ctx.lineTo(x + hexSize*2, y);
                    ctx.lineTo(x + hexSize*1.5, y + hexSize);
                    ctx.lineTo(x + hexSize/2, y + hexSize);
                    ctx.lineTo(x, y);
                }
            }
            ctx.stroke();

            // Draw bounding box for the grid
            ctx.strokeStyle = `rgba(139, 92, 246, ${0.7 * transitionT})`;
            ctx.lineWidth = 2.5;
            ctx.strokeRect(reactorBounds.x1, reactorBounds.y1, coreW, coreH);
            
            ctx.shadowColor = '#8b5cf6';
            ctx.shadowBlur = 30 * transitionT;
            ctx.strokeRect(reactorBounds.x1, reactorBounds.y1, coreW, coreH);
            ctx.shadowBlur = 0;
        }
    }

    function animate() {
        ctx.fillStyle = `rgba(5, 5, 10, 0.25)`;
        ctx.fillRect(0, 0, W, H);

        let targetT = isEcovry ? 1.0 : 0.0;
        transitionT += (targetT - transitionT) * 0.08;

        drawReactor();

        if (transitionT > 0.01) {
            radicals.forEach(r => {
                r.update();
                ctx.globalAlpha = transitionT;
                r.draw();
                ctx.globalAlpha = 1.0;
            });
        }

        molecules.forEach(m => { m.update(); m.draw(); });

        for (let i = particles.length - 1; i >= 0; i--) {
            let p = particles[i];
            p.update();
            p.draw();
            if (p.life <= 0) {
                particles.splice(i, 1);
            }
        }

        requestAnimationFrame(animate);
    }

    // UI Integration
    const modeToggle = document.getElementById('shredder-mode-toggle');
    const vBreakdown = document.getElementById('shredder-val-breakdown');
    const vRadicals = document.getElementById('shredder-val-radicals');
    const vSpectrum = document.getElementById('shredder-val-spectrum');
    const vEffluent = document.getElementById('shredder-val-effluent');
    const cardEffluent = document.getElementById('shredder-card-effluent');

    if (modeToggle) {
        modeToggle.addEventListener('click', () => {
            isEcovry = !isEcovry;
            
            if (isEcovry) {
                modeToggle.className = 'shredder-toggle-container state-b';
                
                vBreakdown.innerText = '99.9%';
                vBreakdown.className = 'shredder-metric-val status-violet';
                
                vRadicals.innerText = 'HYPER-ACTIVE';
                vRadicals.className = 'shredder-metric-val status-safe';
                
                vSpectrum.innerText = 'UV + TiO2 Catalysis';
                vSpectrum.className = 'shredder-metric-val status-violet';
                
                vEffluent.innerText = 'H₂O + CO₂ (Pure)';
                vEffluent.className = 'shredder-metric-val status-safe';
                if (cardEffluent) {
                    cardEffluent.className = 'shredder-metric-card border-safe';
                }

                molecules.forEach(m => {
                    if (m.x > reactorBounds.x1 && m.x < reactorBounds.x2 && !m.shattered) {
                        m.shatter();
                    }
                });

            } else {
                modeToggle.className = 'shredder-toggle-container state-a';
                
                vBreakdown.innerText = '0% (Pass-through)';
                vBreakdown.className = 'shredder-metric-val status-danger';
                
                vRadicals.innerText = 'INACTIVE';
                vRadicals.className = 'shredder-metric-val status-off';
                
                vSpectrum.innerText = 'Standard 254nm';
                vSpectrum.className = 'shredder-metric-val text-blue';
                
                vEffluent.innerText = 'Toxic Organics Remain';
                vEffluent.className = 'shredder-metric-val status-danger';
                if (cardEffluent) {
                    cardEffluent.className = 'shredder-metric-card border-danger';
                }
            }
        });
    }

    animate();
}

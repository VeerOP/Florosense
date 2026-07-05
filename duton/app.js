/* ----------------------------------------------------
   DUTON PORTAL APPLICATION LOGIC
   ---------------------------------------------------- */

document.addEventListener("DOMContentLoaded", () => {
    initThemeManager();
    initThreeDModel();
    initCatalog();
    initScadaSimulator();
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
   2. THREE.JS PLC TELEMETRY ASSEMBLY
   ========================================================================= */
function initThreeDModel() {
    const canvas = document.getElementById("duton-3d-canvas");
    if (!canvas) return;

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(2, 3, 7);

    const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = false;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 10, 5);
    scene.add(dirLight);

    // Glowing yellow spotlights
    const spotYellow1 = new THREE.PointLight(0xeab308, 3, 10);
    spotYellow1.position.set(-2, 1, 1);
    scene.add(spotYellow1);

    const spotYellow2 = new THREE.PointLight(0xeab308, 1.5, 8);
    spotYellow2.position.set(2, -1, 1);
    scene.add(spotYellow2);

    // PLC Rack Group
    const plcGroup = new THREE.Group();
    scene.add(plcGroup);

    // 1. Backplane Rail (Aluminium rack)
    const railGeo = new THREE.BoxGeometry(4.2, 1.2, 0.15);
    const railMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 });
    const rail = new THREE.Mesh(railGeo, railMat);
    plcGroup.add(rail);

    // 2. PLC Modules
    const moduleGeometry = new THREE.BoxGeometry(0.4, 1.0, 0.6);
    const modules = [];
    const moduleColors = [
        0x1e293b, // CPU (Dark Slate)
        0x334155, // I/O Module 1
        0x334155, // I/O Module 2
        0x475569, // Communication Module (Ethernet)
        0xeab308  // Power Module (Yellow accents)
    ];

    const leds = [];

    for (let i = 0; i < 5; i++) {
        const mat = new THREE.MeshStandardMaterial({ 
            color: moduleColors[i],
            roughness: 0.4,
            metalness: i === 4 ? 0.3 : 0.6
        });
        const mod = new THREE.Mesh(moduleGeometry, mat);
        // Position side-by-side along the backplane rail
        mod.position.set(-1.6 + i * 0.8, 0, 0.3);
        plcGroup.add(mod);
        modules.push(mod);

        // Add 2 glowing status LEDs to each module
        for (let j = 0; j < 2; j++) {
            const ledGeo = new THREE.SphereGeometry(0.04, 8, 8);
            const ledMat = new THREE.MeshBasicMaterial({ color: 0x10b981 }); // Green default
            const led = new THREE.Mesh(ledGeo, ledMat);
            led.position.set(-1.6 + i * 0.8 + (j === 0 ? -0.1 : 0.1), 0.3, 0.62);
            plcGroup.add(led);
            leds.push({
                mesh: led,
                state: "green",
                blinkTimer: Math.random() * 50
            });
        }
    }

    // Connect modules with animated communication cable links (tubes)
    const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-1.4, -0.2, 0.6),
        new THREE.Vector3(-0.6, -0.4, 0.8),
        new THREE.Vector3(0.2, -0.3, 0.7),
        new THREE.Vector3(1.0, -0.5, 0.9),
        new THREE.Vector3(1.4, -0.2, 0.6)
    ]);
    const tubeGeo = new THREE.TubeGeometry(curve, 32, 0.03, 8, false);
    const tubeMat = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.3 });
    const tube = new THREE.Mesh(tubeGeo, tubeMat);
    plcGroup.add(tube);

    // Animation loop
    let tick = 0;
    function animate() {
        requestAnimationFrame(animate);
        tick++;

        // Blink LEDs randomly
        leds.forEach((led, idx) => {
            led.blinkTimer--;
            if(led.blinkTimer <= 0) {
                // Toggle state
                if(led.state === "off") {
                    led.state = "green";
                    led.mesh.material.color.setHex(0x10b981);
                } else {
                    led.state = "off";
                    led.mesh.material.color.setHex(0x1e293b); // Dark / off
                }
                led.blinkTimer = 20 + Math.random() * 80;
            }
        });

        // Rotate rail group slightly
        plcGroup.rotation.y = Math.sin(tick * 0.005) * 0.2;

        controls.update();
        renderer.render(scene, camera);
    }
    animate();

    // Theme responsive glow adjustment
    document.addEventListener("themechange", (e) => {
        const theme = e.detail.theme;
        if(theme === "dark") {
            spotYellow1.intensity = 4.0;
        } else {
            spotYellow1.intensity = 2.0;
        }
    });

    // Raycasting for interactive hotspots
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const tooltip = document.getElementById("plc-tooltip");
    const tooltipTitle = document.getElementById("tooltip-title");
    const tooltipDesc = document.getElementById("tooltip-desc");
    const tooltipClose = document.getElementById("tooltip-close-btn");
    
    // Map modules to specification data
    const moduleData = [
        {
            title: "DUTON CPU-800 Core",
            desc: "Enterprise central controller module mapping register payloads natively to local databases and Modbus registers. Supporting redundant architectures.",
            processor: "Processor: 120MHz ARM Cortex-M7",
            memory: "Memory: 16MB Flash, 8MB SRAM",
            power: "Power Feed: 24V DC / 1.2A Max"
        },
        {
            title: "DUTON DI-16 Digital Inputs",
            desc: "16-channel discrete digital inputs with complete optocoupler electrical isolation (up to 3.75 kV RMS) preventing signal spikes on the bus.",
            processor: "Channels: 16 Opto-isolated DI",
            memory: "Enclosure: DIN-rail housing",
            power: "Bussing: Backplane Power"
        },
        {
            title: "DUTON AO-08 Analog Outputs",
            desc: "8-channel high-resolution analog current loop outputs (4-20mA / 0-10V) to command chemical dosing pumps, actuators, and blower fan motors.",
            processor: "Channels: 8 DAC Analog Loops",
            memory: "Resolution: 16-bit precision",
            power: "Bussing: Backplane Power"
        },
        {
            title: "DUTON Ethernet-IP Gateway",
            desc: "Dedicated communication interface. Auto-bridges PLC variables to cloud IoT dashboards via industrial MQTT and OPC UA protocols.",
            processor: "Interface: Dual RJ45 Ethernet",
            memory: "Baud: 10/100 Mbps Base-TX",
            power: "Power: 24V DC auxiliary"
        },
        {
            title: "DUTON PM-24V Power Module",
            desc: "Regulated, low-noise power input filtering grid electrical noise and delivering stable 24V supply to controllers.",
            processor: "Input: 85 - 264V AC",
            memory: "Output: 24V DC / 2.5A",
            power: "Efficiency: 92%"
        }
    ];

    function onCanvasClick(event) {
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(modules);

        if (intersects.length > 0) {
            const hitModule = intersects[0].object;
            const idx = modules.indexOf(hitModule);
            
            if (idx !== -1 && tooltip && tooltipTitle && tooltipDesc) {
                const data = moduleData[idx];
                tooltipTitle.innerText = data.title;
                tooltipDesc.innerText = data.desc;
                
                // Add specific specs data parameters
                const specTable = tooltip.querySelector(".tooltip-specs-table");
                if (specTable) {
                    specTable.innerHTML = `
                        <tr><td>Specs 01</td><td>${data.processor}</td></tr>
                        <tr><td>Specs 02</td><td>${data.memory}</td></tr>
                        <tr><td>Specs 03</td><td>${data.power}</td></tr>
                    `;
                }

                // Update specs action data
                const bomBtn = tooltip.querySelector(".spec-add-bom");
                if (bomBtn) {
                    bomBtn.setAttribute("data-item", data.title);
                }

                tooltip.classList.add("active");
                tooltip.style.opacity = "1";
                tooltip.style.transform = "translateY(0)";
            }
        }
    }

    renderer.domElement.addEventListener("click", onCanvasClick);

    if (tooltipClose) {
        tooltipClose.addEventListener("click", () => {
            tooltip.classList.remove("active");
        });
    }

    window.addEventListener("resize", () => {
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
    });
}

/* =========================================================================
   2B. PRODUCT CATALOG NAVIGATION
   ========================================================================= */
function initCatalog() {
    const tabButtons = document.querySelectorAll(".catalog-tab-btn");
    const productContents = document.querySelectorAll(".catalog-product-details");

    tabButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const prod = btn.getAttribute("data-prod");

            tabButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            productContents.forEach(content => {
                content.classList.remove("active");
            });

            const activeContent = document.getElementById(`prod-${prod}-content`);
            if (activeContent) {
                activeContent.classList.add("active");
            }
        });
    });

    // Mock Spec BOM additions & inquires
    document.body.addEventListener("click", (e) => {
        if (e.target && (e.target.classList.contains("btn-add-bom") || e.target.classList.contains("spec-add-bom"))) {
            const itemName = e.target.getAttribute("data-item") || "Selected Module";
            alert(`Success: "${itemName}" added to your custom Bill of Materials spec sheet!`);
        }

        if (e.target && e.target.classList.contains("btn-inquire")) {
            const itemName = e.target.getAttribute("data-item");
            const contactSection = document.querySelector("#contact");
            if (contactSection) {
                contactSection.scrollIntoView({ behavior: "smooth" });
            } else {
                window.location.href = "../index.html#contact";
            }
        }
    });
}

/* =========================================================================
   3. LIVE SCADA & PLC SIMULATOR (CANVAS PLOT)
   ========================================================================= */
function initScadaSimulator() {
    const canvas = document.getElementById("scada-chart");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    
    // UI Elements
    const statusPill = document.getElementById("scada-status");
    const valUptime = document.getElementById("scada-uptime");
    const valState = document.getElementById("scada-state");
    const valTemp = document.getElementById("scada-temp");
    const valVibration = document.getElementById("scada-vibration");

    const btnNormal = document.getElementById("scada-btn-normal");
    const btnSpike = document.getElementById("scada-btn-spike");
    const btnAnomaly = document.getElementById("scada-btn-anomaly");

    // Simulator variables
    let mode = "normal"; // normal, spike, anomaly
    let dataPoints = Array(50).fill(12); // initial history of vibration readings
    let systemUptime = 99.821;
    let temperature = 42.6;
    let vibrationHz = 12.5;

    // Resizing
    function resizeCanvas() {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
    }
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Click Triggers
    if (btnNormal) {
        btnNormal.addEventListener("click", () => {
            mode = "normal";
            setActiveButton(btnNormal);
            updateUIState("OPTIMAL", "green", false);
        });
    }

    if (btnSpike) {
        btnSpike.addEventListener("click", () => {
            mode = "spike";
            setActiveButton(btnSpike);
            updateUIState("SYSTEM OVERLOAD WARNING", "warning", false);
        });
    }

    if (btnAnomaly) {
        btnAnomaly.addEventListener("click", () => {
            mode = "anomaly";
            setActiveButton(btnAnomaly);
            updateUIState("ANOMALY DETECTED", "critical", true);
        });
    }

    function setActiveButton(activeBtn) {
        [btnNormal, btnSpike, btnAnomaly].forEach(btn => {
            if (btn) btn.classList.remove("btn-primary");
            if (btn) btn.classList.add("btn-outline-accent");
        });
        activeBtn.classList.remove("btn-outline-accent");
        activeBtn.classList.add("btn-primary");
    }

    function updateUIState(stateText, stateClass, isAnomaly) {
        valState.innerText = stateText;
        valState.className = "scada-widget-val " + stateClass;

        if (isAnomaly) {
            statusPill.innerHTML = '<span class="status-dot animate-ping" style="background:#EF4444; width:8px; height:8px; border-radius:50%; display:inline-block; margin-right:6px;"></span>ANOMALY';
            statusPill.className = "dashboard-status anomaly";
        } else {
            statusPill.innerHTML = '<span class="status-dot animate-ping" style="background:#10B981; width:8px; height:8px; border-radius:50%; display:inline-block; margin-right:6px;"></span>ACTIVE';
            statusPill.className = "dashboard-status";
        }
    }

    // Main updates loop
    function updateLoop() {
        // Fluctuating variables depending on mode
        let targetTemp = 42.6;
        let targetVib = 12.5;
        let jitter = 0.5;

        if (mode === "normal") {
            targetTemp = 42.6 + Math.sin(Date.now() * 0.001) * 0.8;
            targetVib = 12.5 + Math.random() * 2.0;
            systemUptime += (Math.random() - 0.5) * 0.0001;
            systemUptime = Math.min(100, Math.max(99.8, systemUptime));
        } else if (mode === "spike") {
            targetTemp = 64.2 + Math.sin(Date.now() * 0.003) * 2.1;
            targetVib = 68.4 + Math.random() * 10.0;
            systemUptime -= 0.0005;
        } else if (mode === "anomaly") {
            targetTemp = 82.8 + Math.random() * 3.5;
            targetVib = 142.1 + Math.sin(Date.now() * 0.01) * 15.0;
            systemUptime -= 0.002;
        }

        // Interpolate current values
        temperature += (targetTemp - temperature) * 0.1;
        vibrationHz += (targetVib - vibrationHz) * 0.1;

        // Push new value to history
        dataPoints.shift();
        dataPoints.push(vibrationHz);

        // Update UI HTML
        valUptime.innerText = systemUptime.toFixed(3) + "%";
        valTemp.innerText = temperature.toFixed(1) + "°C";
        valVibration.innerText = Math.round(vibrationHz) + " Hz";

        if(temperature > 75) {
            valTemp.className = "scada-widget-val critical";
        } else if(temperature > 55) {
            valTemp.className = "scada-widget-val warning";
        } else {
            valTemp.className = "scada-widget-val";
        }

        if(vibrationHz > 100) {
            valVibration.className = "scada-widget-val critical";
        } else if(vibrationHz > 50) {
            valVibration.className = "scada-widget-val warning";
        } else {
            valVibration.className = "scada-widget-val";
        }

        drawChart();
        setTimeout(updateLoop, 150);
    }
    updateLoop();

    // Draw Line Chart in Canvas
    function drawChart() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const padding = 10;
        const graphWidth = canvas.width - padding * 2;
        const graphHeight = canvas.height - padding * 2;

        // Draw grids
        ctx.strokeStyle = "rgba(30, 41, 59, 0.4)";
        ctx.lineWidth = 1;
        for(let i=0; i<=4; i++) {
            const y = padding + (graphHeight / 4) * i;
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(canvas.width - padding, y);
            ctx.stroke();
        }

        // Draw telemetry line
        ctx.strokeStyle = mode === "anomaly" 
            ? "#EF4444" 
            : (mode === "spike" ? "#F59E0B" : "#EAB308");
        ctx.lineWidth = 2.5;
        ctx.lineJoin = "round";

        const maxVal = 180; // max expected vibration metric
        ctx.beginPath();
        for (let i = 0; i < dataPoints.length; i++) {
            const x = padding + (graphWidth / (dataPoints.length - 1)) * i;
            const normY = dataPoints[i] / maxVal;
            const y = padding + graphHeight - (normY * graphHeight);

            if(i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();

        // Draw gradient area under line
        const grad = ctx.createLinearGradient(0, padding, 0, canvas.height);
        if (mode === "anomaly") {
            grad.addColorStop(0, "rgba(239, 68, 68, 0.25)");
            grad.addColorStop(1, "rgba(239, 68, 68, 0.0)");
        } else if (mode === "spike") {
            grad.addColorStop(0, "rgba(245, 158, 11, 0.25)");
            grad.addColorStop(1, "rgba(245, 158, 11, 0.0)");
        } else {
            grad.addColorStop(0, "rgba(234, 179, 8, 0.25)");
            grad.addColorStop(1, "rgba(234, 179, 8, 0.0)");
        }

        ctx.fillStyle = grad;
        ctx.lineTo(padding + graphWidth, padding + graphHeight);
        ctx.lineTo(padding, padding + graphHeight);
        ctx.closePath();
        ctx.fill();
    }
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

    // Products reveal
    gsap.utils.toArray(".prod-card").forEach((card, index) => {
        gsap.from(card, {
            scrollTrigger: {
                trigger: card,
                start: "top 85%"
            },
            opacity: 0,
            y: 30,
            duration: 0.6,
            delay: index * 0.12,
            ease: "power2.out"
        });
    });

    // SCADA section reveal
    gsap.from(".scada-dashboard", {
        scrollTrigger: {
            trigger: ".scada-section",
            start: "top 80%"
        },
        opacity: 0,
        y: 40,
        duration: 0.8,
        ease: "power3.out"
    });
}

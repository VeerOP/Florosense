/* ----------------------------------------------------
   THREE.JS VISUALIZATION CORE
   ---------------------------------------------------- */

// Global state hooks for GSAP integration
window.threeState = {
    updateEcovry: null,
    updateDuton: null,
    enableEcovryControls: null
};

// Helper to track canvas visibility and optimize render loops
function observeVisibility(canvas, onVisibleChange) {
    let isVisible = false;
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            isVisible = entry.isIntersecting;
            if (onVisibleChange) onVisibleChange(isVisible);
        });
    }, { threshold: 0.05 });
    observer.observe(canvas);
}

document.addEventListener("DOMContentLoaded", () => {
    // Defer heavy 3D rendering slightly to let the DOM layout and scroll triggers initialize smoothly first
    setTimeout(() => {
        initEcovry3D();
        initDutonTwin();
        initSustainabilityEarth();
    }, 150);
});

/* =========================================================================
   1. ECOVRY 3D SEWAGE TREATMENT PLANT (STP) MODEL
   ========================================================================= */
function initEcovry3D() {
    // Define lightweight scroll integration for drag hint when canvas is replaced by Sketchfab iframe
    window.threeState.updateEcovry = (progress) => {
        const dragHint = document.getElementById("canvas-drag-hint-ecovry");
        if (dragHint) {
            if (progress > 0.95) {
                dragHint.classList.add("visible");
            } else {
                dragHint.classList.remove("visible");
            }
        }
    };

    const canvas = document.getElementById("ecovry-3d-canvas");
    if (!canvas) return;

    let isVisible = false;
    observeVisibility(canvas, (visible) => {
        isVisible = visible;
    });

    // Dimensions
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    
    // Transparent or dark space background depending on theme
    scene.background = null; 

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 5, 12);

    const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);

    const pointLightOrange = new THREE.PointLight(0xf97316, 1.5, 15);
    pointLightOrange.position.set(-3, 2, -2);
    scene.add(pointLightOrange);

    const pointLightBlue = new THREE.PointLight(0x10b981, 1.5, 15);
    pointLightBlue.position.set(3, 2, 2);
    scene.add(pointLightBlue);

    // Assembly Group for all STP parts
    const stpGroup = new THREE.Group();
    scene.add(stpGroup);

    /* --------------------
       STP Component Geometries
       -------------------- */
    
    // 1. Concrete Base Foundation
    const baseGeo = new THREE.BoxGeometry(7, 0.3, 4);
    const baseMat = new THREE.MeshStandardMaterial({
        color: 0x334155,
        roughness: 0.8,
        metalness: 0.2
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = -1.5;
    stpGroup.add(baseMesh);

    // 2. Tank 1 (Primary Settlement - Left)
    const tank1OuterGeo = new THREE.CylinderGeometry(0.8, 0.8, 2.5, 32);
    const tank1OuterMat = new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        roughness: 0.1,
        metalness: 0.9,
        transparent: true,
        opacity: 0.95
    });
    const tank1 = new THREE.Mesh(tank1OuterGeo, tank1OuterMat);
    tank1.position.set(-2, -0.1, 0);
    stpGroup.add(tank1);

    // 3. Tank 2 (Aeration Bioreactor - Center)
    const tank2OuterGeo = new THREE.CylinderGeometry(1.0, 1.0, 2.8, 32);
    const tank2OuterMat = new THREE.MeshPhysicalMaterial({
        color: 0x10b981,
        transparent: true,
        opacity: 0.35,
        transmission: 0.6,
        roughness: 0.1,
        metalness: 0.1,
        depthWrite: false
    });
    const tank2 = new THREE.Mesh(tank2OuterGeo, tank2OuterMat);
    tank2.position.set(0, 0.05, 0);
    stpGroup.add(tank2);

    // Tank 2 Internal Core (Sewage liquid)
    const tank2InnerGeo = new THREE.CylinderGeometry(0.95, 0.95, 2.6, 32);
    const tank2InnerMat = new THREE.MeshStandardMaterial({
        color: 0x047857,
        transparent: true,
        opacity: 0.85,
        roughness: 0.2
    });
    const tank2Inner = new THREE.Mesh(tank2InnerGeo, tank2InnerMat);
    tank2Inner.position.set(0, 0.05, 0);
    stpGroup.add(tank2Inner);

    // 4. Tank 3 (Clarifier / Separation - Right)
    const tank3OuterGeo = new THREE.CylinderGeometry(0.8, 0.8, 2.5, 32);
    const tank3OuterMat = new THREE.MeshStandardMaterial({
        color: 0x10b981,
        roughness: 0.1,
        metalness: 0.9,
        transparent: true,
        opacity: 0.95
    });
    const tank3 = new THREE.Mesh(tank3OuterGeo, tank3OuterMat);
    tank3.position.set(2, -0.1, 0);
    stpGroup.add(tank3);

    // 5. Interconnecting Pipes (Tubes)
    const createPipe = (points, radius = 0.08) => {
        const curve = new THREE.CatmullRomCurve3(points);
        const pipeGeo = new THREE.TubeGeometry(curve, 64, radius, 16, false);
        const pipeMat = new THREE.MeshStandardMaterial({
            color: 0x475569,
            metalness: 0.9,
            roughness: 0.1
        });
        const pipeMesh = new THREE.Mesh(pipeGeo, pipeMat);
        return pipeMesh;
    };

    // Pipe 1: Tank 1 -> Tank 2
    const pipe1 = createPipe([
        new THREE.Vector3(-2, 0.8, 0),
        new THREE.Vector3(-2, 1.2, 0),
        new THREE.Vector3(-1, 1.2, 0),
        new THREE.Vector3(-1, 0.8, 0),
        new THREE.Vector3(0, 0.8, 0)
    ]);
    stpGroup.add(pipe1);

    // Pipe 2: Tank 2 -> Tank 3
    const pipe2 = createPipe([
        new THREE.Vector3(0, 0.5, 0),
        new THREE.Vector3(1, 0.5, 0),
        new THREE.Vector3(1, 1.0, 0),
        new THREE.Vector3(2, 1.0, 0),
        new THREE.Vector3(2, 0.8, 0)
    ]);
    stpGroup.add(pipe2);

    // Pipe 3: Recycled Outflow (Right out)
    const pipe3 = createPipe([
        new THREE.Vector3(2, -0.5, 0),
        new THREE.Vector3(2, -1.0, 0.3),
        new THREE.Vector3(3.5, -1.0, 0.5)
    ]);
    stpGroup.add(pipe3);

    /* --------------------
       Flowing Water Particle Systems
       -------------------- */
    const particleCount = 120;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);

    // Define particle paths corresponding to treatment flow:
    // Path 1 (Tank 1 Inlet): flows into Tank 1
    // Path 2 (Pipe 1): Tank 1 -> Tank 2
    // Path 3 (Tank 2 Aeration): bubbling upwards inside Tank 2
    // Path 4 (Pipe 2): Tank 2 -> Tank 3
    // Path 5 (Pipe 3 Outlet): clean water outflow
    const particlesData = [];

    for (let i = 0; i < particleCount; i++) {
        // Distribute particle duties
        let type = i % 5;
        particlesData.push({
            type: type,
            progress: Math.random(),
            speed: 0.005 + Math.random() * 0.008
        });

        // Set initial positions (dummy)
        particlePositions[i * 3] = 0;
        particlePositions[i * 3 + 1] = 0;
        particlePositions[i * 3 + 2] = 0;

        // Set colors based on treatment stages (grayish-brown -> aeration blue -> pure emerald)
        if (type === 0 || type === 1) { // Dirty inlet/Tank 1
            particleColors[i * 3] = 0.5;     // R
            particleColors[i * 3 + 1] = 0.45;  // G
            particleColors[i * 3 + 2] = 0.35;  // B
        } else if (type === 2 || type === 3) { // Aeration/Transfer
            particleColors[i * 3] = 0.9;
            particleColors[i * 3 + 1] = 0.95;
            particleColors[i * 3 + 2] = 0.95;
        } else { // Clean outlet
            particleColors[i * 3] = 0.06;
            particleColors[i * 3 + 1] = 0.72;
            particleColors[i * 3 + 2] = 0.5;
        }
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

    const particleMat = new THREE.PointsMaterial({
        size: 0.12,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
    });

    const flowParticles = new THREE.Points(particleGeo, particleMat);
    stpGroup.add(flowParticles);

    // OrbitControls for manual drag inspection
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = false; // Prevent zoom hijacking mouse scrolls
    controls.enabled = false; // Disabled by default, GSAP will enable it on pin completion

    /* --------------------
       Responsive Handling
       -------------------- */
    window.addEventListener("resize", () => {
        if (!canvas) return;
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
    });

    /* --------------------
       Animation Update Loop
       -------------------- */
    const clock = new THREE.Clock();

    function animate() {
        requestAnimationFrame(animate);
        if (!isVisible) return;

        const delta = clock.getDelta();
        const time = clock.getElapsedTime();

        // Slow idle rotation of the STP system (will be overridden/added to by scroll)
        if (!controls.enabled) {
            stpGroup.rotation.y = time * 0.1;
        } else {
            controls.update();
        }

        // Bubbling aeration logic (vertical movement in Tank 2)
        const positions = flowParticles.geometry.attributes.position.array;

        for (let i = 0; i < particleCount; i++) {
            const data = particlesData[i];
            data.progress += data.speed;
            if (data.progress > 1.0) data.progress = 0;

            let x = 0, y = 0, z = 0;
            const p = data.progress;

            if (data.type === 0) { // Flows into Tank 1
                x = -2.5 + p * 0.5;
                y = 1.0 - p * 1.5;
                z = (Math.sin(p * 20) * 0.2);
            }
            else if (data.type === 1) { // Pipe 1: Tank 1 -> Tank 2
                // Bezier-like curve points
                if (p < 0.25) {
                    const localP = p / 0.25;
                    x = -2;
                    y = 0.8 + localP * 0.4;
                } else if (p < 0.75) {
                    const localP = (p - 0.25) / 0.5;
                    x = -2 + localP * 2;
                    y = 1.2;
                } else {
                    const localP = (p - 0.75) / 0.25;
                    x = 0;
                    y = 1.2 - localP * 0.4;
                }
                z = 0;
            }
            else if (data.type === 2) { // Bubbling Aeration Tank 2 (Vertical rise)
                const angle = (i * 0.3) + time * 2;
                const r = 0.1 + (i % 5) * 0.15;
                x = Math.cos(angle) * r;
                y = -1.2 + p * 2.5;
                z = Math.sin(angle) * r;
            }
            else if (data.type === 3) { // Pipe 2: Tank 2 -> Tank 3
                if (p < 0.5) {
                    x = p * 2;
                    y = 0.5 + p;
                } else {
                    x = 1 + (p - 0.5) * 2;
                    y = 1.0 - (p - 0.5) * 0.4;
                }
                z = 0;
            }
            else { // Pipe 3 Outlet
                x = 2.0 + p * 1.5;
                y = -0.5 - p * 0.5;
                z = p * 0.5;
            }

            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;
        }

        flowParticles.geometry.attributes.position.needsUpdate = true;
        renderer.render(scene, camera);
    }

    animate();

    /* --------------------
       Scroll Animations Hooks (Called from scroll-animations.js)
       -------------------- */
    window.threeState.updateEcovry = (progress) => {
        // progress maps from 0.0 to 1.0 through the pinned section
        
        // 1. Camera Orbit Rotation
        stpGroup.rotation.y = progress * Math.PI * 2;

        // 2. Camera zoom-in/out
        camera.position.z = 12 - progress * 5;
        camera.position.y = 5 - progress * 3;

        // 3. Exploded / Internal revealing views
        // At progress 0.2 - 0.5, fade Tank 1 & 3 shells to reveal inner pipelines/water flows
        if (progress > 0.2 && progress < 0.8) {
            tank1.material.opacity = 0.2;
            tank3.material.opacity = 0.2;
            tank2.material.opacity = 0.15;
            // Push Tank 1 and 3 outwards slightly for "exploded view"
            const explodeOffset = (progress - 0.2) * 1.5; // Max 0.9 unit explode
            if (explodeOffset > 0 && explodeOffset < 1.0) {
                tank1.position.x = -2 - explodeOffset;
                tank3.position.x = 2 + explodeOffset;
            }
        } else {
            tank1.material.opacity = 0.95;
            tank3.material.opacity = 0.95;
            tank2.material.opacity = 0.35;
            tank1.position.x = -2;
            tank3.position.x = 2;
        }

        // Enable user interaction at the very end of scroll
        const dragHint = document.getElementById("canvas-drag-hint-ecovry");
        if (progress > 0.95) {
            controls.enabled = true;
            if (dragHint) dragHint.classList.add("visible");
        } else {
            controls.enabled = false;
            if (dragHint) dragHint.classList.remove("visible");
        }
    };
}

/* =========================================================================
   2. DUTON PLC DIGITAL TWIN
   ========================================================================= */
function initDutonTwin() {
    const canvas = document.getElementById("duton-twin-canvas");
    if (!canvas) return;

    let isVisible = false;
    observeVisibility(canvas, (visible) => {
        isVisible = visible;
    });

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 8);

    const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xf97316, 1.2);
    dirLight.position.set(5, 5, 5);
    scene.add(dirLight);

    const pointLight = new THREE.PointLight(0x10b981, 1.5, 10);
    pointLight.position.set(-2, 2, 2);
    scene.add(pointLight);

    // Group for Circuit Board/PLC components
    const boardGroup = new THREE.Group();
    scene.add(boardGroup);

    // 1. PCB Base Plate
    const boardGeo = new THREE.BoxGeometry(4, 2.5, 0.1);
    const boardMat = new THREE.MeshStandardMaterial({
        color: 0xf4f4f5,
        roughness: 0.8,
        metalness: 0.1
    });

    // Initialize board material according to active theme
    const initialTheme = document.body.getAttribute("data-theme") || "light";
    if (initialTheme === "dark") {
        boardMat.color.setHex(0x2c2d30);
        boardMat.roughness = 0.5;
        boardMat.metalness = 0.8;
    }

    // React to dynamic theme changes
    document.addEventListener("themechange", (e) => {
        const theme = e.detail.theme;
        if (theme === "dark") {
            boardMat.color.setHex(0x2c2d30);
            boardMat.roughness = 0.5;
            boardMat.metalness = 0.8;
        } else {
            boardMat.color.setHex(0xf4f4f5);
            boardMat.roughness = 0.8;
            boardMat.metalness = 0.1;
        }
    });

    const board = new THREE.Mesh(boardGeo, boardMat);
    boardGroup.add(board);

    // 2. Add glowing grid traces (circuit lines)
    const traceGeo = new THREE.PlaneGeometry(3.8, 2.3);
    const traceMat = new THREE.MeshBasicMaterial({
        color: 0xf97316,
        wireframe: true,
        transparent: true,
        opacity: 0.15
    });
    const traces = new THREE.Mesh(traceGeo, traceMat);
    traces.position.z = 0.06;
    boardGroup.add(traces);

    // 3. Components (Chips, Capacitors, I/O blocks)
    const components = [];
    const compConfigs = [
        { w: 0.8, h: 0.8, d: 0.25, x: -1.2, y: 0.5, color: 0x27272a, label: "MCU" },
        { w: 0.6, h: 0.6, d: 0.2, x: 1.2, y: -0.5, color: 0xf97316, label: "COMM" },
        { w: 0.4, h: 1.2, d: 0.3, x: -0.2, y: -0.3, color: 0x10b981, label: "IO_1" },
        { w: 0.4, h: 1.2, d: 0.3, x: 0.3, y: -0.3, color: 0x10b981, label: "IO_2" }
    ];

    compConfigs.forEach(cfg => {
        const geo = new THREE.BoxGeometry(cfg.w, cfg.h, cfg.d);
        const mat = new THREE.MeshStandardMaterial({
            color: cfg.color,
            roughness: 0.2,
            metalness: 0.9
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(cfg.x, cfg.y, cfg.d / 2 + 0.05);
        boardGroup.add(mesh);
        components.push(mesh);
    });

    // 4. LED Indicator Lights
    const ledCount = 8;
    const leds = [];
    const ledGeo = new THREE.SphereGeometry(0.06, 8, 8);
    const activeLedMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
    const idleLedMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });

    for (let i = 0; i < ledCount; i++) {
        const led = new THREE.Mesh(ledGeo, i % 2 === 0 ? activeLedMat : idleLedMat);
        led.position.set(-1.6 + i * 0.2, 1.0, 0.08);
        boardGroup.add(led);
        leds.push(led);
    }

    // Window Resize
    window.addEventListener("resize", () => {
        if (!canvas) return;
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
    });

    // Rotation Control Hook
    let rotationSpeed = 0.5;
    window.threeState.updateDuton = (progress) => {
        // Boost speed when scrolling
        rotationSpeed = 0.5 + progress * 8.0;
        // Skew board angle based on scroll
        boardGroup.rotation.x = progress * Math.PI * 0.2;
    };

    // Animation loop
    const clock = new THREE.Clock();
    function animate() {
        requestAnimationFrame(animate);
        if (!isVisible) return;
        const time = clock.getElapsedTime();
        const delta = clock.getDelta();

        // Continuous spin
        boardGroup.rotation.y = time * rotationSpeed;

        // Flicker LEDs occasionally
        leds.forEach((led, idx) => {
            if (Math.sin(time * 5 + idx) > 0.8) {
                led.material = activeLedMat;
            } else if (Math.sin(time * 5 + idx) < -0.8) {
                led.material = idleLedMat;
            }
        });

        // Decay speed back to normal
        if (rotationSpeed > 0.5) {
            rotationSpeed -= 0.05;
        }

        renderer.render(scene, camera);
    }
    animate();
}

/* =========================================================================
   3. SUSTAINABILITY EARTH GLOBE
   ========================================================================= */
function initSustainabilityEarth() {
    const canvas = document.getElementById("sustainability-earth-canvas");
    if (!canvas) return;

    let isVisible = false;
    observeVisibility(canvas, (visible) => {
        isVisible = visible;
    });

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 7);

    const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Group
    const earthGroup = new THREE.Group();
    scene.add(earthGroup);

    // 1. Earth Wireframe Sphere
    const sphereGeo = new THREE.SphereGeometry(2.0, 24, 24);
    const sphereMat = new THREE.MeshBasicMaterial({
        color: 0x10b981,
        wireframe: true,
        transparent: true,
        opacity: 0.15
    });
    const earthWireframe = new THREE.Mesh(sphereGeo, sphereMat);
    earthGroup.add(earthWireframe);

    // 2. Earth Particle Points (Continents simulation)
    const pointsCount = 400;
    const pointsGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(pointsCount * 3);

    for (let i = 0; i < pointsCount; i++) {
        // Spherical distribution
        const u = Math.random();
        const v = Math.random();
        const theta = u * 2.0 * Math.PI;
        const phi = Math.acos(2.0 * v - 1.0);
        const r = 2.02; // Slightly larger than wireframe

        positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = r * Math.cos(phi);
    }

    pointsGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const pointsMat = new THREE.PointsMaterial({
        color: 0x10b981,
        size: 0.05,
        transparent: true,
        opacity: 0.7
    });
    const earthPoints = new THREE.Points(pointsGeo, pointsMat);
    earthGroup.add(earthPoints);

    // 3. Orbiting Green/Blue Rings (Flowing data)
    const ringCount = 300;
    const ringGeo = new THREE.BufferGeometry();
    const ringPositions = new Float32Array(ringCount * 3);
    const ringSpeeds = [];

    for (let i = 0; i < ringCount; i++) {
        const theta = (i / ringCount) * Math.PI * 2;
        const r = 2.4 + Math.random() * 0.4;
        
        // Tilt orbit rings slightly
        const tiltX = 0.3;
        const tiltY = 0.5;
        
        ringPositions[i * 3] = Math.cos(theta) * r;
        ringPositions[i * 3 + 1] = Math.sin(theta) * r * Math.cos(tiltX);
        ringPositions[i * 3 + 2] = Math.sin(theta) * r * Math.sin(tiltY);

        ringSpeeds.push(0.01 + Math.random() * 0.02);
    }

    ringGeo.setAttribute('position', new THREE.BufferAttribute(ringPositions, 3));
    const ringMat = new THREE.PointsMaterial({
        color: 0xf97316, // orange particles
        size: 0.03,
        transparent: true,
        opacity: 0.5
    });
    const orbitRing = new THREE.Points(ringGeo, ringMat);
    earthGroup.add(orbitRing);

    // Resize
    window.addEventListener("resize", () => {
        if (!canvas) return;
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
    });

    // Mouse Parallax movement
    let targetX = 0;
    let targetY = 0;
    window.addEventListener("mousemove", (e) => {
        targetX = (e.clientX - window.innerWidth / 2) * 0.0003;
        targetY = (e.clientY - window.innerHeight / 2) * 0.0003;
    });

    // Animation loop
    const clock = new THREE.Clock();
    function animate() {
        requestAnimationFrame(animate);
        if (!isVisible) return;
        const time = clock.getElapsedTime();

        // Slow rotations
        earthGroup.rotation.y = time * 0.06;
        earthGroup.rotation.x = time * 0.02;

        // Orbit ring particles drift
        const ringPosArr = orbitRing.geometry.attributes.position.array;
        for (let i = 0; i < ringCount; i++) {
            // Apply a slight phase shift rotation to each ring particle
            const theta = (i / ringCount) * Math.PI * 2 + time * ringSpeeds[i];
            const r = 2.4 + (i % 10) * 0.04;
            
            ringPosArr[i * 3] = Math.cos(theta) * r;
            ringPosArr[i * 3 + 1] = Math.sin(theta) * r * 0.9; 
            ringPosArr[i * 3 + 2] = Math.sin(theta) * r * 0.4;
        }
        orbitRing.geometry.attributes.position.needsUpdate = true;

        // Smooth mouse parallax
        camera.position.x += (targetX - camera.position.x) * 0.05;
        camera.position.y += (-targetY - camera.position.y) * 0.05;
        camera.lookAt(scene.position);

        renderer.render(scene, camera);
    }
    animate();
}

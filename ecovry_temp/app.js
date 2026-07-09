/* ----------------------------------------------------
   ECOVRY PORTAL APPLICATION LOGIC & SHOWCASE WIDGETS
   ---------------------------------------------------- */

document.addEventListener("DOMContentLoaded", () => {
    initRoiSimulator();
    initBubblePhysicsSimulator();
    initDigestion3D();
    initMbbr3D();
    initMobileNav();
    initBioreactorSlider();
    initVioletShredderSimulator();
});

/* =========================================================================
   1. TCO & LIFE-CYCLE COST CALCULATOR (CHART.JS INTEGRATION)
   ========================================================================= */
function initRoiSimulator() {
    const capacityInput = document.getElementById("capacity");
    const tariffInput = document.getElementById("tariff");
    const capacityVal = document.getElementById("capacityVal");
    const tariffVal = document.getElementById("tariffVal");

    const tradCapexText = document.getElementById("tradCapex");
    const hybCapexText = document.getElementById("hybCapex");
    const tradOpexText = document.getElementById("tradOpex");
    const hybOpexText = document.getElementById("hybOpex");
    const breakevenNotice = document.getElementById("breakevenNotice");

    const chartCanvas = document.getElementById("tcoChart");
    if (!chartCanvas) return;

    let tcoChart = null;

    // Hardcoded Dark theme tokens for TCO Chart
    function getThemeColors() {
        return {
            textColor: "#A1A1AA",
            gridColor: "rgba(255, 255, 255, 0.06)",
            tooltipBg: "#252528",
            tooltipBorder: "#3A3A3E",
            tooltipTitle: "#FFFFFF",
            tooltipBody: "#E4E4E7",
        };
    }

    function calculateData() {
        const capacity = parseFloat(capacityInput.value);
        const tariff = parseFloat(tariffInput.value);

        // Update Slider Labels
        capacityVal.innerText = `${capacity} KLD`;
        tariffVal.innerText = `₹ ${tariff} / kWh`;

        // Mathematical Core Formulas
        const tradCapex = 300000 + (capacity * 8000);
        const hybCapex = 400000 + (capacity * 9500);

        const tradEnergyPerDay = capacity * 1.6;
        const hybEnergyPerDay = capacity * 0.7;

        const tradYearlyOpex = tradEnergyPerDay * 365 * tariff;
        const hybYearlyOpex = hybEnergyPerDay * 365 * tariff;

        // UI Updates with Indian format
        tradCapexText.innerText = `₹ ${tradCapex.toLocaleString('en-IN')}`;
        hybCapexText.innerText = `₹ ${hybCapex.toLocaleString('en-IN')}`;
        tradOpexText.innerText = `₹ ${Math.round(tradYearlyOpex).toLocaleString('en-IN')}`;
        hybOpexText.innerText = `₹ ${Math.round(hybYearlyOpex).toLocaleString('en-IN')}`;

        // Breakeven Months Math Formulation
        const capexDelta = hybCapex - tradCapex;
        const opexDeltaPerYear = tradYearlyOpex - hybYearlyOpex;
        const breakevenYears = capexDelta / opexDeltaPerYear;
        const breakevenMonths = Math.ceil(breakevenYears * 12);

        if (breakevenMonths > 0) {
            breakevenNotice.innerText = `📈 ECOVRY Hybrid System breaks even and runs into pure profit after just ${breakevenMonths} months of operation!`;
        } else {
            breakevenNotice.innerText = `⏳ High energy differences significantly skew efficiency advantages. Check inputs.`;
        }

        // Generate line datasets (Years 0 to 5)
        const tradData = [];
        const hybData = [];
        for (let i = 0; i <= 5; i++) {
            tradData.push(tradCapex + (i * tradYearlyOpex));
            hybData.push(hybCapex + (i * hybYearlyOpex));
        }

        updateChart(tradData, hybData);
    }

    function updateChart(tradData, hybData) {
        const colors = getThemeColors();
        const ctx = chartCanvas.getContext("2d");

        // Generate Gradients for fills
        const blueGrad = ctx.createLinearGradient(0, 0, 0, chartCanvas.height);
        blueGrad.addColorStop(0, "rgba(59, 130, 246, 0.15)");
        blueGrad.addColorStop(1, "rgba(59, 130, 246, 0)");

        const greenGrad = ctx.createLinearGradient(0, 0, 0, chartCanvas.height);
        greenGrad.addColorStop(0, "rgba(16, 185, 129, 0.15)");
        greenGrad.addColorStop(1, "rgba(16, 185, 129, 0)");

        if (tcoChart) {
            tcoChart.data.datasets[0].data = tradData;
            tcoChart.data.datasets[0].backgroundColor = blueGrad;
            tcoChart.data.datasets[1].data = hybData;
            tcoChart.data.datasets[1].backgroundColor = greenGrad;
            
            tcoChart.options.scales.x.grid.color = colors.gridColor;
            tcoChart.options.scales.x.ticks.color = colors.textColor;
            tcoChart.options.scales.y.grid.color = colors.gridColor;
            tcoChart.options.scales.y.ticks.color = colors.textColor;
            
            tcoChart.options.plugins.legend.labels.color = colors.textColor;
            tcoChart.options.plugins.tooltip.backgroundColor = colors.tooltipBg;
            tcoChart.options.plugins.tooltip.borderColor = colors.tooltipBorder;
            tcoChart.options.plugins.tooltip.titleColor = colors.tooltipTitle;
            tcoChart.options.plugins.tooltip.bodyColor = colors.tooltipBody;

            tcoChart.update();
        } else {
            tcoChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: ['Year 0 (CAPEX)', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5 (TCO)'],
                    datasets: [
                        {
                            label: 'Traditional MBBR Lifecycle Cost',
                            data: tradData,
                            borderColor: '#3b82f6',
                            backgroundColor: blueGrad,
                            borderWidth: 2,
                            tension: 0.35,
                            fill: true,
                            pointBackgroundColor: '#3b82f6',
                            pointHoverRadius: 6
                        },
                        {
                            label: 'ECOVRY Hybrid-Kinetic Lifecycle Cost',
                            data: hybData,
                            borderColor: '#10b981',
                            backgroundColor: greenGrad,
                            borderWidth: 2.5,
                            tension: 0.35,
                            fill: true,
                            pointBackgroundColor: '#10b981',
                            pointHoverRadius: 7
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        mode: 'index',
                        intersect: false,
                    },
                    plugins: {
                        legend: { 
                            position: 'top',
                            labels: { 
                                color: colors.textColor,
                                font: {
                                    family: "'Sora', 'Inter', sans-serif",
                                    size: 11,
                                    weight: '600'
                                }
                            } 
                        },
                        tooltip: {
                            backgroundColor: colors.tooltipBg,
                            borderColor: colors.tooltipBorder,
                            borderWidth: 1,
                            titleColor: colors.tooltipTitle,
                            bodyColor: colors.tooltipBody,
                            titleFont: {
                                family: "'Sora', 'Inter', sans-serif",
                                weight: '700'
                            },
                            bodyFont: {
                                family: "'Space Grotesk', 'Inter', sans-serif"
                            },
                            padding: 12,
                            cornerRadius: 8,
                            callbacks: {
                                label: function(context) {
                                    let label = context.dataset.label || '';
                                    if (label) {
                                        label += ': ';
                                    }
                                    if (context.parsed.y !== null) {
                                        label += '₹ ' + context.parsed.y.toLocaleString('en-IN');
                                    }
                                    return label;
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            ticks: { 
                                color: colors.textColor,
                                font: {
                                    family: "'Space Grotesk', 'Inter', sans-serif",
                                    size: 11
                                },
                                callback: function(value) {
                                    if (value >= 10000000) {
                                        return '₹' + (value / 10000000).toFixed(1) + ' Cr';
                                    } else if (value >= 100000) {
                                        return '₹' + (value / 100000).toFixed(1) + ' L';
                                    } else if (value >= 1000) {
                                        return '₹' + (value / 1000).toFixed(0) + 'k';
                                    }
                                    return '₹' + value;
                                }
                            },
                            grid: { color: colors.gridColor }
                        },
                        x: {
                            ticks: { 
                                color: colors.textColor,
                                font: {
                                    family: "'Sora', 'Inter', sans-serif",
                                    size: 10
                                }
                            },
                            grid: { color: colors.gridColor }
                        }
                    }
                }
            });
        }
    }

    capacityInput.addEventListener("input", calculateData);
    tariffInput.addEventListener("input", calculateData);
    calculateData();
}

/* =========================================================================
   2. INTERACTIVE FLUID AERATION PHYSICS SIMULATOR (HTML5 CANVAS)
   ========================================================================= */
function initBubblePhysicsSimulator() {
    const canvas = document.getElementById("aeration-physics-canvas");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    let width = 0;
    let height = 0;
    
    function resizeCanvas() {
        width = canvas.width = canvas.parentElement.clientWidth;
        height = canvas.height = Math.max(width * 9 / 16, 260);
    }
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    let mouse = { x: 0, y: 0, lastX: 0, lastY: 0, vx: 0, vy: 0, active: false };
    let mouseDecayTimer = null;

    function handleMouseMove(clientX, clientY) {
        const rect = canvas.getBoundingClientRect();
        mouse.x = clientX - rect.left;
        mouse.y = clientY - rect.top;
        
        if (mouse.active) {
            mouse.vx = (mouse.x - mouse.lastX) * 0.2;
            mouse.vy = (mouse.y - mouse.lastY) * 0.2;
        } else {
            mouse.active = true;
            mouse.vx = 0;
            mouse.vy = 0;
        }

        mouse.lastX = mouse.x;
        mouse.lastY = mouse.y;

        clearTimeout(mouseDecayTimer);
        mouseDecayTimer = setTimeout(() => {
            mouse.active = false;
            mouse.vx = 0;
            mouse.vy = 0;
        }, 150);
    }

    canvas.addEventListener("mousemove", (e) => {
        handleMouseMove(e.clientX, e.clientY);
    });
    canvas.addEventListener("mouseleave", () => {
        mouse.active = false;
    });

    canvas.addEventListener("touchmove", (e) => {
        if (e.touches.length > 0) {
            handleMouseMove(e.touches[0].clientX, e.touches[0].clientY);
        }
    }, { passive: true });
    canvas.addEventListener("touchend", () => {
        mouse.active = false;
    });

    const macroBubbles = [];
    const nanobubbles = [];
    const popParticles = [];

    const numMacro = 20;
    const numNano = 550;

    function getThemeColors() {
        return {
            textColor: "rgba(255, 255, 255, 0.45)",
            subColor: "rgba(255, 255, 255, 0.25)",
            dividerColor: "rgba(255, 255, 255, 0.12)",
            macroColor: "rgba(59, 130, 246, 0.7)",
            macroFill: "rgba(59, 130, 246, 0.1)",
            hybridColor: "#34d399"
        };
    }

    // Macro Bubble (Traditional)
    class MacroBubble {
        constructor() {
            this.reset();
            this.y = Math.random() * height;
        }

        reset() {
            this.x = Math.random() * (width / 2 - 40) + 20;
            this.y = height + Math.random() * 40;
            this.radius = Math.random() * 5 + 4;
            this.baseSpeed = -(Math.random() * 1.5 + 2.0);
            this.vx = 0;
            this.vy = this.baseSpeed;
            this.wobbleSpeed = Math.random() * 0.05 + 0.02;
            this.wobbleAmount = Math.random() * 0.8 + 0.3;
            this.phase = Math.random() * Math.PI * 2;
        }

        update() {
            this.phase += this.wobbleSpeed;
            const targetVx = Math.sin(this.phase) * this.wobbleAmount;
            
            if (mouse.active) {
                const dx = this.x - mouse.x;
                const dy = this.y - mouse.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                if (dist < 70) {
                    const force = (70 - dist) / 70;
                    this.vx += mouse.vx * force * 0.4;
                    this.vy += mouse.vy * force * 0.4;
                }
            }

            this.vx += (targetVx - this.vx) * 0.08;
            this.vy += (this.baseSpeed - this.vy) * 0.08;

            this.x += this.vx;
            this.y += this.vy;

            if (this.x < this.radius) this.x = this.radius;
            if (this.x > width / 2 - this.radius) this.x = width / 2 - this.radius;

            if (this.y < this.radius + 15) {
                this.pop();
            }
        }

        pop() {
            const count = Math.floor(Math.random() * 3) + 3;
            for (let i = 0; i < count; i++) {
                popParticles.push({
                    x: this.x,
                    y: this.y,
                    vx: (Math.random() - 0.5) * 3,
                    vy: (Math.random() - 0.5) * 2 - 1,
                    radius: Math.random() * 2 + 1,
                    alpha: 1,
                    color: getThemeColors().macroColor
                });
            }
            this.reset();
        }

        draw() {
            const colors = getThemeColors();
            ctx.strokeStyle = colors.macroColor;
            ctx.lineWidth = 1.5;
            ctx.fillStyle = colors.macroFill;

            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
            ctx.beginPath();
            ctx.arc(this.x - this.radius * 0.35, this.y - this.radius * 0.35, this.radius * 0.15, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Nanobubble (ECOVRY)
    class Nanobubble {
        constructor() {
            this.x = Math.random() * (width / 2 - 30) + width / 2 + 15;
            this.y = Math.random() * (height - 30) + 15;
            this.radius = Math.random() * 1.0 + 0.8;
            this.vx = (Math.random() - 0.5) * 0.3;
            this.vy = (Math.random() - 0.5) * 0.3 - 0.05;
            this.alpha = Math.random() * 0.4 + 0.4;
        }

        update() {
            this.vx += (Math.random() - 0.5) * 0.12;
            this.vy += (Math.random() - 0.5) * 0.12;

            if (mouse.active) {
                const dx = this.x - mouse.x;
                const dy = this.y - mouse.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                if (dist < 90) {
                    const force = (90 - dist) / 90;
                    this.vx += mouse.vx * force * 0.8;
                    this.vy += mouse.vy * force * 0.8;
                }
            }

            this.vx *= 0.94;
            this.vy *= 0.94;
            this.vy -= 0.01;

            this.x += this.vx;
            this.y += this.vy;

            const rightBound = width - this.radius;
            const leftBound = width / 2 + this.radius;

            if (this.x < leftBound) {
                this.x = leftBound;
                this.vx *= -0.5;
            } else if (this.x > rightBound) {
                this.x = rightBound;
                this.vx *= -0.5;
            }

            if (this.y < this.radius + 15) {
                this.y = height - this.radius - Math.random() * 20;
                this.x = Math.random() * (width / 2 - 30) + width / 2 + 15;
                this.vx = (Math.random() - 0.5) * 0.3;
                this.vy = -Math.random() * 0.2 - 0.05;
            } else if (this.y > height - this.radius) {
                this.y = height - this.radius;
                this.vy = -Math.random() * 0.5;
            }
        }

        draw() {
            const colors = getThemeColors();
            ctx.fillStyle = colors.hybridColor;
            ctx.globalAlpha = this.alpha;

            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();

            if (this.radius > 1.2) {
                ctx.fillStyle = "rgba(52, 211, 153, 0.2)";
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius * 2.2, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1.0;
        }
    }

    for (let i = 0; i < numMacro; i++) macroBubbles.push(new MacroBubble());
    for (let i = 0; i < numNano; i++) nanobubbles.push(new Nanobubble());

    function animate() {
        requestAnimationFrame(animate);
        ctx.clearRect(0, 0, width, height);

        const colors = getThemeColors();

        // 1. Draw Section Divider
        ctx.strokeStyle = colors.dividerColor;
        ctx.lineWidth = 1;
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.moveTo(width / 2, 0);
        ctx.lineTo(width / 2, height);
        ctx.stroke();
        ctx.setLineDash([]);

        // 2. Draw Simulation Headings
        const isMobileLayout = width < 600;
        const paddingSide = isMobileLayout ? 12 : 24;
        
        ctx.font = "bold 11px 'Sora', sans-serif";
        ctx.fillStyle = colors.textColor;
        ctx.textBaseline = "top";
        ctx.letterSpacing = "0.08em";

        const leftTitle = isMobileLayout ? "TRADITIONAL MBBR" : "TRADITIONAL MBBR AERATION";
        ctx.textAlign = "left";
        ctx.fillText(leftTitle, paddingSide, 20);
        
        const leftSub = isMobileLayout ? "OTE ~15%" : "OTE ~15% | RETENTION: 3 – 5 SECONDS";
        ctx.font = "600 9px 'Sora', sans-serif";
        ctx.fillStyle = colors.subColor;
        ctx.fillText(leftSub, paddingSide, 36);

        const rightTitle = isMobileLayout ? "ECOVRY HYBRID" : "ECOVRY NANOBUBBLE SYSTEM";
        ctx.font = "bold 11px 'Sora', sans-serif";
        ctx.fillStyle = colors.textColor;
        ctx.textAlign = "right";
        ctx.fillText(rightTitle, width - paddingSide, 20);

        const rightSub = isMobileLayout ? "OTE ~85%" : "OTE ~85% | RETENTION: INDEFINITE SUSPENSION";
        ctx.font = "600 9px 'Sora', sans-serif";
        ctx.fillStyle = colors.subColor;
        ctx.fillText(rightSub, width - paddingSide, 36);

        // 3. Update & Draw Macro Bubbles
        macroBubbles.forEach(b => {
            b.update();
            b.draw();
        });

        // 4. Update & Draw Nanobubbles
        nanobubbles.forEach(nb => {
            nb.update();
            nb.draw();
        });

        // 5. Draw Splash particles
        for (let i = popParticles.length - 1; i >= 0; i--) {
            const p = popParticles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.08;
            p.alpha -= 0.04;

            if (p.alpha <= 0) {
                popParticles.splice(i, 1);
            } else {
                ctx.fillStyle = p.color;
                ctx.globalAlpha = p.alpha;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1.0;
            }
        }

        // 6. Interactive Mouse Ring
        if (mouse.active) {
            ctx.strokeStyle = "rgba(249, 115, 22, 0.15)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(mouse.x, mouse.y, 16, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
    animate();
}

/* =========================================================================
   3. THE DIGESTION RACE (3D SIMULATION)
   ========================================================================= */
let isDigestionEcovry = false;
let toggleDigestionSystem;

function initDigestion3D() {
    const container = document.getElementById('digestion-3d-canvas');
    if (!container) return;

    let width = container.clientWidth;
    let height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050810, 0.015);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(10, 8, 14);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);

    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.1;
    controls.target.set(0, 2, 0);
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.4;
    controls.enableZoom = false;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
    dirLight.position.set(10, 20, 10);
    scene.add(dirLight);

    const backLight = new THREE.PointLight(0xffffff, 0.7, 50);
    backLight.position.set(-10, 5, -10);
    scene.add(backLight);

    const internalLight = new THREE.PointLight(0xff416c, 1.5, 10);
    internalLight.position.set(0, 2.5, 0);
    scene.add(internalLight);

    const gridHelper = new THREE.GridHelper(40, 40, 0x1e293b, 0x0f172a);
    gridHelper.position.y = -0.01;
    scene.add(gridHelper);

    const tankGroup = new THREE.Group();
    scene.add(tankGroup);

    const TANK_W = 5.2;
    const TANK_H = 4.4;
    const TANK_D = 5.2;
    const BOUNDS = 2.3;

    const glassMat = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        metalness: 0.1,
        roughness: 0.05,
        transmission: 0.95,
        thickness: 0.3,
        transparent: true,
        side: THREE.DoubleSide,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1
    });

    const glassGeo = new THREE.BoxGeometry(TANK_W, TANK_H, TANK_D);
    const glassShell = new THREE.Mesh(glassGeo, glassMat);
    glassShell.position.y = TANK_H / 2;
    tankGroup.add(glassShell);

    const rimMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.2 });
    const baseMesh = new THREE.Mesh(new THREE.BoxGeometry(TANK_W + 0.15, 0.15, TANK_D + 0.15), rimMat);
    baseMesh.position.y = 0.08;
    tankGroup.add(baseMesh);
    
    const topMesh = new THREE.Mesh(new THREE.BoxGeometry(TANK_W + 0.15, 0.15, TANK_D + 0.15), rimMat);
    topMesh.position.y = TANK_H;
    tankGroup.add(topMesh);

    let waterColor = new THREE.Color(0x3a2e1d);
    let targetWaterColor = new THREE.Color(0x3a2e1d);
    
    const waterGeo = new THREE.BoxGeometry(TANK_W - 0.1, TANK_H - 0.15, TANK_D - 0.1);
    const waterMat = new THREE.MeshPhysicalMaterial({
        color: waterColor,
        transmission: 0.75,
        opacity: 0.85,
        transparent: true,
        roughness: 0.2,
        depthWrite: false
    });
    const waterMesh = new THREE.Mesh(waterGeo, waterMat);
    waterMesh.position.y = TANK_H / 2;
    tankGroup.add(waterMesh);

    const NUM_CONTAMINANTS = 80;
    const NUM_TRAD_MICROBES = 30;
    const NUM_ECO_MICROBES = 150;

    const contaminants = [];
    const tradMicrobes = [];
    const ecoMicrobes = [];

    const contSimpleGeo = new THREE.DodecahedronGeometry(0.1, 1);
    const contSimpleMat = new THREE.MeshStandardMaterial({ color: 0x88cc00, emissive: 0x335500, roughness: 0.8 });

    const contComplexGeo = new THREE.IcosahedronGeometry(0.1, 0); 
    const contComplexMat = new THREE.MeshStandardMaterial({ color: 0xff0033, emissive: 0xaa0000, roughness: 0.8 });

    for(let i=0; i<NUM_CONTAMINANTS; i++) {
        let isSimple = i % 2 === 0;
        let mesh = new THREE.Mesh(isSimple ? contSimpleGeo : contComplexGeo, isSimple ? contSimpleMat : contComplexMat);
        mesh.position.set(
            (Math.random() - 0.5) * (BOUNDS * 2), 
            Math.random() * (TANK_H - 0.4) + 0.2, 
            (Math.random() - 0.5) * (BOUNDS * 2)
        );
        tankGroup.add(mesh);
        contaminants.push({
            mesh: mesh,
            active: true,
            type: isSimple ? 'simple' : 'complex',
            baseY: mesh.position.y,
            offset: Math.random() * 10
        });
    }

    const tradGeo = new THREE.DodecahedronGeometry(0.18, 1);
    const tradMat = new THREE.MeshStandardMaterial({ color: 0x4a3c31, roughness: 1.0 });

    for(let i=0; i<NUM_TRAD_MICROBES; i++) {
        let mesh = new THREE.Mesh(tradGeo, tradMat);
        mesh.position.set(
            (Math.random() - 0.5) * (BOUNDS * 2), 
            Math.random() * (TANK_H - 0.4) + 0.2, 
            (Math.random() - 0.5) * (BOUNDS * 2)
        );
        tankGroup.add(mesh);
        tradMicrobes.push({ mesh: mesh, velocity: new THREE.Vector3(), target: null });
    }

    const ecoGeo = new THREE.CapsuleGeometry(0.04, 0.15, 4, 8);
    ecoGeo.rotateX(Math.PI / 2);
    const ecoMat = new THREE.MeshPhysicalMaterial({ 
        color: 0x00ffaa, 
        emissive: 0x00ffaa, 
        emissiveIntensity: 1.5,
        roughness: 0.1,
        clearcoat: 1.0
    });

    for(let i=0; i<NUM_ECO_MICROBES; i++) {
        let mesh = new THREE.Mesh(ecoGeo, ecoMat);
        mesh.position.set(
            (Math.random() - 0.5) * (BOUNDS * 2), 
            Math.random() * (TANK_H - 0.4) + 0.2, 
            (Math.random() - 0.5) * (BOUNDS * 2)
        );
        mesh.visible = false;
        tankGroup.add(mesh);
        ecoMicrobes.push({ mesh: mesh, velocity: new THREE.Vector3(), target: null });
    }

    const toggleSlider = document.getElementById('digestion-slider');
    const textTrad = document.getElementById('dig-text-trad');
    const textEco = document.getElementById('dig-text-eco');
    const counterHrt = document.getElementById('dig-counter-hrt');
    const borderCulture = document.getElementById('dig-border-culture');
    const borderHrt = document.getElementById('dig-border-hrt');
    const cultureDesc = document.getElementById('dig-culture-desc');
    const iconContainer = document.getElementById('dig-icon-container');

    toggleDigestionSystem = function() {
        isDigestionEcovry = !isDigestionEcovry;

        if (isDigestionEcovry) {
            if (toggleSlider) toggleSlider.className = 'toggle-slider slider-eco';
            if (textTrad) textTrad.className = 'toggle-option inactive';
            if (textEco) textEco.className = 'toggle-option active-eco';
            targetWaterColor.setHex(0x0a1a2a);
            internalLight.color.setHex(0x00ffaa);

            if (borderCulture) borderCulture.style.borderColor = '#00ffaa';
            if (borderHrt) borderHrt.style.borderColor = '#00ffaa';
            if (iconContainer) iconContainer.innerHTML = `<i data-lucide="zap" style="width: 14px; height: 14px; color: #00ffaa;"></i>`;
            if (cultureDesc) cultureDesc.innerHTML = `<strong style="color: #00ffaa;">Omni-Vorx™ Bio-Catalyst.</strong> Aggressive, hyper-active swarm. Rapidly hunts and devours BOTH simple (green) and complex recalcitrant pollutants (red).`;
            
            animateCounter(counterHrt, 24.0, 8.0, 1);
        } else {
            if (toggleSlider) toggleSlider.className = 'toggle-slider slider-trad';
            if (textTrad) textTrad.className = 'toggle-option active-trad';
            if (textEco) textEco.className = 'toggle-option inactive';
            targetWaterColor.setHex(0x3a2e1d);
            internalLight.color.setHex(0xff416c);

            if (borderCulture) borderCulture.style.borderColor = '#ff416c';
            if (borderHrt) borderHrt.style.borderColor = '#ff416c';
            if (iconContainer) iconContainer.innerHTML = `<i data-lucide="circle-slash" style="width: 14px; height: 14px; color: #ff416c;"></i>`;
            if (cultureDesc) cultureDesc.innerHTML = `<strong style="color: #ff416c;">Sluggish Cow-Dung Culture.</strong> Floats aimlessly. Can only digest simple organics (green). Complex, recalcitrant pollutants (red) remain untouched.`;
            
            animateCounter(counterHrt, 8.0, 24.0, 1);
        }

        if (window.lucide) window.lucide.createIcons();

        tradMicrobes.forEach(m => m.mesh.visible = !isDigestionEcovry);
        ecoMicrobes.forEach(m => {
            m.mesh.visible = isDigestionEcovry;
            m.target = null;
            if (isDigestionEcovry) {
                m.velocity.set((Math.random() - 0.5)*0.2, (Math.random() - 0.5)*0.2, (Math.random() - 0.5)*0.2);
            }
        });

        contaminants.forEach(c => {
            c.active = true;
            c.mesh.visible = true;
            c.mesh.scale.set(1, 1, 1);
            c.mesh.position.set(
                (Math.random() - 0.5) * (BOUNDS * 2), 
                Math.random() * (TANK_H - 0.4) + 0.2, 
                (Math.random() - 0.5) * (BOUNDS * 2)
            );
            c.baseY = c.mesh.position.y;
        });
    };

    function animateCounter(element, start, end, decimals) {
        if (!element) return;
        let current = start;
        const steps = 25;
        const increment = (end - start) / steps;
        let stepCount = 0;
        
        const timer = setInterval(() => {
            current += increment;
            stepCount++;
            if (stepCount >= steps) {
                current = end;
                clearInterval(timer);
            }
            element.innerText = current.toFixed(decimals);
        }, 30);
    }

    const dirVec = new THREE.Vector3();
    const tempTargetLook = new THREE.Vector3();
    const vortexVec = new THREE.Vector3();
    const centerPullVec = new THREE.Vector3();

    function animate() {
        requestAnimationFrame(animate);

        const time = Date.now() * 0.001;

        waterColor.lerp(targetWaterColor, 0.02);
        waterMesh.material.color.copy(waterColor);

        if (!isDigestionEcovry) {
            tradMicrobes.forEach((m, idx) => {
                if(!m.target || !m.target.active) {
                    let actives = contaminants.filter(c => c.active && c.type === 'simple');
                    if(actives.length > 0 && Math.random() > 0.85) {
                        m.target = actives[Math.floor(Math.random() * actives.length)];
                    } else {
                        m.target = null;
                    }
                }

                if (m.target) {
                    dirVec.subVectors(m.target.mesh.position, m.mesh.position).normalize();
                    m.velocity.lerp(dirVec.multiplyScalar(0.008), 0.02);
                    
                    if (m.mesh.position.distanceTo(m.target.mesh.position) < 0.3) {
                        m.target.active = false;
                        m.target.mesh.visible = false;
                        m.target = null;
                    }
                } else {
                    dirVec.set(
                        Math.sin(time + idx) * 0.008,
                        Math.cos(time * 0.7 + idx) * 0.008,
                        Math.sin(time * 1.1 + idx) * 0.008
                    );
                    m.velocity.lerp(dirVec, 0.05);
                }

                m.mesh.position.add(m.velocity);
                
                if (Math.abs(m.mesh.position.x) > BOUNDS) { m.mesh.position.x = Math.sign(m.mesh.position.x) * BOUNDS; m.velocity.x *= -0.5; }
                if (Math.abs(m.mesh.position.z) > BOUNDS) { m.mesh.position.z = Math.sign(m.mesh.position.z) * BOUNDS; m.velocity.z *= -0.5; }
                if (m.mesh.position.y > TANK_H - 0.25 || m.mesh.position.y < 0.2) {
                    m.mesh.position.y = Math.max(0.2, Math.min(TANK_H - 0.25, m.mesh.position.y));
                    m.velocity.y *= -0.5;
                }
            });
        } else {
            ecoMicrobes.forEach((m, idx) => {
                if(!m.target || !m.target.active) {
                    let actives = contaminants.filter(c => c.active);
                    if(actives.length > 0) {
                        m.target = actives[Math.floor(Math.random() * actives.length)];
                    } else {
                        m.target = null;
                    }
                }

                if (m.target) {
                    dirVec.subVectors(m.target.mesh.position, m.mesh.position).normalize();
                    m.velocity.lerp(dirVec.multiplyScalar(0.12), 0.12);
                    
                    if (m.mesh.position.distanceTo(m.target.mesh.position) < 0.25) {
                        m.target.active = false;
                        m.target.mesh.visible = false;
                        m.target = null;
                    }
                } else {
                    vortexVec.set(-m.mesh.position.z, Math.sin(time * 4 + idx) * 0.3, m.mesh.position.x).normalize();
                    centerPullVec.set(-m.mesh.position.x, 0, -m.mesh.position.z).multiplyScalar(0.4);
                    vortexVec.add(centerPullVec);
                    m.velocity.lerp(vortexVec.multiplyScalar(0.05), 0.08);
                }

                m.mesh.position.add(m.velocity);
                
                if (m.velocity.lengthSq() > 0.001) {
                    tempTargetLook.copy(m.mesh.position).add(m.velocity);
                    m.mesh.lookAt(tempTargetLook);
                }

                if (Math.abs(m.mesh.position.x) > BOUNDS) { m.velocity.x *= -1; m.mesh.position.x += m.velocity.x; }
                if (Math.abs(m.mesh.position.z) > BOUNDS) { m.velocity.z *= -1; m.mesh.position.z += m.velocity.z; }
                if (m.mesh.position.y > TANK_H - 0.25 || m.mesh.position.y < 0.2) {
                    m.velocity.y *= -1;
                    m.mesh.position.y = Math.max(0.2, Math.min(TANK_H - 0.25, m.mesh.position.y));
                }
            });
        }

        contaminants.forEach(c => {
            if (c.active) {
                c.mesh.position.y = c.baseY + Math.sin(time * 1.5 + c.offset) * 0.06;
                c.mesh.rotation.x += 0.01;
            }
        });

        controls.update();
        renderer.render(scene, camera);
    }
    animate();

    window.addEventListener("resize", () => {
        width = container.clientWidth;
        height = container.clientHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
    });
}

/* =========================================================================
   4. MBBR BIO-MULTIPLIER LENS (3D SIMULATION)
   ========================================================================= */
function initMbbr3D() {
    const container = document.getElementById('mbbr-3d-canvas');
    if (!container) return;

    let width = container.clientWidth;
    let height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0b0f19, 0.02);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 3.5, 12);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    container.appendChild(renderer.domElement);

    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 20;
    controls.minDistance = 4;
    controls.enableZoom = false;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 10, 5);
    scene.add(dirLight);

    const blueLight = new THREE.PointLight(0x00aaff, 1, 20);
    blueLight.position.set(-5, -2, 5);
    scene.add(blueLight);

    let currentDensity = 0.0;
    let showVolume = false;

    const stdTargets = [];
    const ecoTargets = [];
    const particlesData = [];
    const TOTAL_PARTICLES = 1200;

    const stdMaterial = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.7, side: THREE.DoubleSide });
    const ecoMaterial = new THREE.MeshStandardMaterial({ color: 0xff6b00, roughness: 0.6, side: THREE.DoubleSide });

    const radius = 1.6;
    const heightModel = 1.6;

    // standard Media left
    const standardGroup = new THREE.Group();
    standardGroup.position.x = -3.2;

    const stdTubeGeom = new THREE.CylinderGeometry(radius, radius, heightModel, 32, 1, true);
    const stdTube = new THREE.Mesh(stdTubeGeom, stdMaterial);
    standardGroup.add(stdTube);

    const crossGeom = new THREE.PlaneGeometry(radius * 2, heightModel);
    const cross1 = new THREE.Mesh(crossGeom, stdMaterial);
    cross1.rotation.y = Math.PI / 4;
    const cross2 = new THREE.Mesh(crossGeom, stdMaterial);
    cross2.rotation.y = -Math.PI / 4;
    standardGroup.add(cross1, cross2);
    scene.add(standardGroup);

    // ECOVRY Media right
    const ecovryGroup = new THREE.Group();
    ecovryGroup.position.x = 3.2;

    const ecoTubeGeom = new THREE.CylinderGeometry(radius, radius, heightModel, 32, 1, true);
    const ecoTube = new THREE.Mesh(ecoTubeGeom, ecoMaterial);
    ecovryGroup.add(ecoTube);

    const ecovryInnerGroup = new THREE.Group();
    const numRings = 3;
    const numSpokes = 16;

    for (let i = 1; i <= numRings; i++) {
        let r = (radius / (numRings + 1)) * i;
        let ringGeom = new THREE.CylinderGeometry(r, r, heightModel, 32, 1, true);
        let ring = new THREE.Mesh(ringGeom, ecoMaterial);
        ecovryInnerGroup.add(ring);
    }

    for (let i = 0; i < numSpokes; i++) {
        let angle = (i / numSpokes) * Math.PI * 2;
        let spokeGeom = new THREE.PlaneGeometry(radius, heightModel);
        spokeGeom.translate(radius / 2, 0, 0);
        let spoke = new THREE.Mesh(spokeGeom, ecoMaterial);
        spoke.rotation.y = angle;
        ecovryInnerGroup.add(spoke);
    }
    ecovryGroup.add(ecovryInnerGroup);
    scene.add(ecovryGroup);

    const boxGeom = new THREE.BoxGeometry(radius * 2.1, heightModel * 1.1, radius * 2.1);
    const boxMat = new THREE.MeshBasicMaterial({ color: 0x00ffaa, wireframe: true, transparent: true, opacity: 0.3 });
    const boxHelperStd = new THREE.Mesh(boxGeom, boxMat);
    standardGroup.add(boxHelperStd);
    boxHelperStd.visible = false;

    const boxHelperEco = new THREE.Mesh(boxGeom, boxMat);
    ecovryGroup.add(boxHelperEco);
    boxHelperEco.visible = false;

    const getCylPoint = (r, h) => {
        const theta = Math.random() * Math.PI * 2;
        const y = (Math.random() - 0.5) * h;
        return new THREE.Vector3(r * Math.cos(theta), y, r * Math.sin(theta));
    };

    for(let i=0; i<300; i++) {
        if(i < 150) {
            stdTargets.push(getCylPoint(radius, heightModel));
        } else {
            let p = new THREE.Vector3((Math.random() - 0.5) * radius * 2, (Math.random() - 0.5) * heightModel, 0);
            let angle = Math.random() > 0.5 ? Math.PI/4 : -Math.PI/4;
            p.applyAxisAngle(new THREE.Vector3(0,1,0), angle);
            stdTargets.push(p);
        }
    }

    for(let i=0; i<1200; i++) {
        let r = Math.random() * radius;
        ecoTargets.push(getCylPoint(r, heightModel));
    }

    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(TOTAL_PARTICLES * 3);

    for (let i = 0; i < TOTAL_PARTICLES; i++) {
        positions[i*3] = (Math.random() - 0.5) * 20;
        positions[i*3+1] = Math.random() * 10 + 5;
        positions[i*3+2] = (Math.random() - 0.5) * 20;

        particlesData.push({
            id: i,
            targetIndex: -1,
            isECOVRY: false,
            speed: 0.015 + Math.random() * 0.025
        });
    }
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const particleMaterial = new THREE.PointsMaterial({
        color: 0x00ffaa,
        size: 0.1,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particleSystem);

    const slider = document.getElementById('mbbr-density-slider');
    const label = document.getElementById('mbbr-density-label');
    const btnVolume = document.getElementById('mbbr-btn-volume');
    const counterStd = document.getElementById('mbbr-counter-std');
    const counterEco = document.getElementById('mbbr-counter-eco');

    function updateSimulation() {
        if (label) {
            if (currentDensity < 0.3) label.innerText = "Standard Density";
            else if (currentDensity < 0.8) label.innerText = "Engineered Fins";
            else label.innerText = "Max Honeycomb (ECOVRY)";
        }

        ecovryInnerGroup.scale.set(currentDensity, 1, currentDensity);
        ecovryInnerGroup.children.forEach(child => {
            if (child.material) {
                child.material.transparent = true;
                child.material.opacity = 0.15 + (currentDensity * 0.85);
            }
        });

        const activeStdCount = 300;
        const activeEcoCount = Math.floor(300 + (1200 - 300) * currentDensity);

        particlesData.forEach(p => p.targetIndex = -1);
        let stdAssigned = 0;
        let ecoAssigned = 0;

        for (let i = 0; i < TOTAL_PARTICLES; i++) {
            let p = particlesData[i];
            if (stdAssigned < activeStdCount) {
                p.targetIndex = stdAssigned;
                p.isECOVRY = false;
                stdAssigned++;
            } else if (ecoAssigned < activeEcoCount) {
                p.targetIndex = ecoAssigned;
                p.isECOVRY = true;
                ecoAssigned++;
            }
        }

        animateCount(counterStd, activeStdCount);
        animateCount(counterEco, activeEcoCount);
    }

    function animateCount(element, targetVal) {
        if (!element) return;
        let curr = parseInt(element.innerText) || 0;
        const diff = targetVal - curr;
        if (diff === 0) return;
        
        let step = Math.ceil(diff / 10);
        if (Math.abs(step) < 1) step = Math.sign(diff);
        
        curr += step;
        element.innerText = curr;
        
        if (curr !== targetVal) {
            setTimeout(() => animateCount(element, targetVal), 25);
        }
    }

    if (slider) {
        slider.addEventListener('input', (e) => {
            currentDensity = e.target.value / 100;
            updateSimulation();
        });
    }

    if (btnVolume) {
        btnVolume.addEventListener('click', () => {
            showVolume = !showVolume;
            boxHelperStd.visible = showVolume;
            boxHelperEco.visible = showVolume;
            btnVolume.classList.toggle('active-match', showVolume);
        });
    }

    const tempVec = new THREE.Vector3();

    function animate() {
        requestAnimationFrame(animate);

        const time = Date.now() * 0.001;

        standardGroup.rotation.y += 0.004;
        standardGroup.rotation.x = 0.15;

        ecovryGroup.rotation.y += 0.004;
        ecovryGroup.rotation.x = 0.15;

        const posArr = particleGeometry.attributes.position.array;

        standardGroup.updateMatrixWorld();
        ecovryGroup.updateMatrixWorld();

        const stdMatrix = standardGroup.matrixWorld;
        const ecoMatrix = ecovryGroup.matrixWorld;

        for (let i = 0; i < TOTAL_PARTICLES; i++) {
            let p = particlesData[i];
            let idx = i * 3;

            if (p.targetIndex !== -1) {
                let targetLocal = p.isECOVRY ? ecoTargets[p.targetIndex] : stdTargets[p.targetIndex];
                if (targetLocal) {
                    tempVec.copy(targetLocal).applyMatrix4(p.isECOVRY ? ecoMatrix : stdMatrix);

                    posArr[idx] += (tempVec.x - posArr[idx]) * p.speed;
                    posArr[idx+1] += (tempVec.y - posArr[idx+1]) * p.speed;
                    posArr[idx+2] += (tempVec.z - posArr[idx+2]) * p.speed;
                }
            } else {
                posArr[idx] += Math.sin(time + p.id) * 0.02;
                posArr[idx+1] += Math.cos(time * 0.8 + p.id) * 0.02;
                posArr[idx+2] += Math.sin(time * 1.2 + p.id) * 0.02;

                if (posArr[idx+1] < 3) posArr[idx+1] += 0.05;
            }
        }
        particleGeometry.attributes.position.needsUpdate = true;

        controls.update();
        renderer.render(scene, camera);
    }

    updateSimulation();
    animate();

    window.addEventListener("resize", () => {
        width = container.clientWidth;
        height = container.clientHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
    });
}

/* =========================================================================
   5. BIOREACTOR SLIDESHOW WIDGET
   ========================================================================= */
const bioreactorSlidesData = [
    {
        num: "01 / ECOVRY Core",
        title: "Bioreactor Aeration System Design",
        text: "Engineered for compactness and high operational flexibility. Our modular wastewater treatment units scale seamlessly from commercial developments to heavy industrial complexes.",
        specs: [
            { label: "AREA FOOTPRINT", val: "40% Reduced" },
            { label: "CONFIGURATION", val: "Modular Pre-Fabricated / Civil" }
        ]
    },
    {
        num: "02 / Analytics",
        title: "Energy-Efficient Aeration",
        text: "Nano sized air bubbles naturally have lower buoyancy and thus implies ultra high OTE (Oxygen Transfer Efficiency). This results in outstanding Area Footprint saving of upto 45% and OEE (Operational Energy Efficiency) results upto 35% savings.",
        specs: [
            { label: "ENERGY SAVINGS", val: "Up to 35% lowered" },
            { label: "AREA FOOTPRINT OPTIMISATION", val: "Up to 45% lowered" }
        ]
    },
    {
        num: "03 / Resource Recovery",
        title: "Advanced Sludge Separation",
        text: "High-speed mechanical separator modules recover metals, organic solids, and clear recycled water, feeding straight back into industrial operations.",
        specs: [
            { label: "WATER RECOVERY", val: "90% Efficient" },
            { label: "FINAL OUTPUT", val: "Biogas Input Ready" }
        ]
    },
    {
        num: "04 / IoT Integration",
        title: "Smart Environmental IoT",
        text: "Equipped with automation-ready sensors for water quality metrics (pH, TSS, DO, COD). Seamless telemetry integration pushes updates to the cloud and monitors compliance automatically.",
        specs: [
            { label: "CONNECTIVITY", val: "High Speed Wireless / Wired" },
            { label: "UTILITY", val: "100% Automated" }
        ]
    }
];

let currentBioreactorSlideIdx = 0;

function initBioreactorSlider() {
    setStorySlide(0); // Set initial state
}

function setStorySlide(index) {
    if (index < 0 || index >= bioreactorSlidesData.length) return;
    currentBioreactorSlideIdx = index;

    const slide = bioreactorSlidesData[currentBioreactorSlideIdx];
    
    // Update labels and descriptions
    const numEl = document.getElementById("bioreactor-slide-num");
    const titleEl = document.getElementById("bioreactor-slide-title");
    const textEl = document.getElementById("bioreactor-slide-text");
    
    const specLbl1 = document.getElementById("bioreactor-spec-lbl-1");
    const specVal1 = document.getElementById("bioreactor-spec-val-1");
    const specLbl2 = document.getElementById("bioreactor-spec-lbl-2");
    const specVal2 = document.getElementById("bioreactor-spec-val-2");

    const pageIndicator = document.getElementById("bioreactor-page-indicator");

    if (numEl) numEl.innerText = slide.num;
    if (titleEl) titleEl.innerText = slide.title;
    if (textEl) textEl.innerText = slide.text;

    if (specLbl1) specLbl1.innerText = slide.specs[0].label;
    if (specVal1) {
        specVal1.innerText = slide.specs[0].val;
        // Dynamic spec value coloring based on slide type
        if (index === 1) specVal1.style.color = "#3b82f6"; // Energy savings
        else if (index === 2) specVal1.style.color = "#10b981"; // Water recovery
        else specVal1.style.color = "#ffffff";
    }

    if (specLbl2) specLbl2.innerText = slide.specs[1].label;
    if (specVal2) {
        specVal2.innerText = slide.specs[1].val;
        if (index === 1) specVal2.style.color = "#3b82f6";
        else if (index === 2) specVal2.style.color = "#ff6b00"; // Biogas output
        else specVal2.style.color = "#ffffff";
    }

    if (pageIndicator) pageIndicator.innerText = `${currentBioreactorSlideIdx + 1} / 4`;

    // Toggle active classes on tab headers
    for (let i = 0; i < 4; i++) {
        const btn = document.getElementById(`story-btn-${i}`);
        if (btn) {
            if (i === index) btn.classList.add("active-tab");
            else btn.classList.remove("active-tab");
        }
    }
}

function prevStorySlide() {
    let target = currentBioreactorSlideIdx - 1;
    if (target < 0) target = bioreactorSlidesData.length - 1;
    setStorySlide(target);
}

function nextStorySlide() {
    let target = currentBioreactorSlideIdx + 1;
    if (target >= bioreactorSlidesData.length) target = 0;
    setStorySlide(target);
}

// Bind handlers globally for HTML onclick attributes
window.setStorySlide = setStorySlide;
window.prevStorySlide = prevStorySlide;
window.nextStorySlide = nextStorySlide;

/* =========================================================================
   6. MOBILE NAVBAR Menu Toggle
   ========================================================================= */
function initMobileNav() {
    const toggleBtn = document.getElementById("mobile-menu-toggle");
    const navMenu = document.getElementById("nav-links-menu");
    const navLinks = document.querySelectorAll(".nav-link");

    if (!toggleBtn || !navMenu) return;

    toggleBtn.addEventListener("click", () => {
        navMenu.classList.toggle("open");
        const isOpen = navMenu.classList.contains("open");
        
        toggleBtn.innerHTML = isOpen 
            ? `<i data-lucide="x"></i>` 
            : `<i data-lucide="menu"></i>`;
        
        if (window.lucide) {
            window.lucide.createIcons();
        }
    });

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
    const canvas = document.getElementById('shredder-physics-canvas');
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

    if (modeToggle) {
        modeToggle.addEventListener('click', () => {
            isEcovry = !isEcovry;
            
            if (isEcovry) {
                modeToggle.className = 'shredder-toggle-container state-b interactive';
                
                vBreakdown.innerText = '99.9%';
                vBreakdown.className = 'val status-violet';
                document.getElementById('shredder-card-breakdown').style.borderLeftColor = '#c084fc';
                
                vRadicals.innerText = 'HYPER-ACTIVE';
                vRadicals.className = 'val status-safe';
                document.getElementById('shredder-card-radicals').style.borderLeftColor = '#10b981';
                
                vSpectrum.innerText = 'UV + TiO2 Catalysis';
                vSpectrum.className = 'val status-violet';
                document.getElementById('shredder-card-spectrum').style.borderLeftColor = '#c084fc';
                
                vEffluent.innerText = 'H₂O + CO₂ (Pure)';
                vEffluent.className = 'val status-safe';
                document.getElementById('shredder-card-effluent').style.borderLeftColor = '#10b981';

                molecules.forEach(m => {
                    if (m.x > reactorBounds.x1 && m.x < reactorBounds.x2 && !m.shattered) {
                        m.shatter();
                    }
                });

            } else {
                modeToggle.className = 'shredder-toggle-container state-a interactive';
                
                vBreakdown.innerText = '0% (Pass-through)';
                vBreakdown.className = 'val status-danger';
                document.getElementById('shredder-card-breakdown').style.borderLeftColor = '#ef4444';
                
                vRadicals.innerText = 'INACTIVE';
                vRadicals.className = 'val status-off';
                document.getElementById('shredder-card-radicals').style.borderLeftColor = 'var(--color-border)';
                
                vSpectrum.innerText = 'Standard 254nm';
                vSpectrum.className = 'val text-blue';
                document.getElementById('shredder-card-spectrum').style.borderLeftColor = '#3b82f6';
                
                vEffluent.innerText = 'Toxic Organics Remain';
                vEffluent.className = 'val status-danger';
                document.getElementById('shredder-card-effluent').style.borderLeftColor = '#ef4444';
            }
        });
    }

    animate();
}

/* ----------------------------------------------------
   ECOVRY HYBRID-KINETIC ROI & TCO SIMULATOR
   ---------------------------------------------------- */

document.addEventListener("DOMContentLoaded", () => {
    initRoiSimulator();
    initBubblePhysicsSimulator();
});

/* =========================================================================
   1. ROI & LIFE-CYCLE COST CALCULATOR (CHART.JS)
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

    // Fetch theme-based styling tokens
    function getThemeColors() {
        const theme = document.body.getAttribute("data-theme") || "light";
        const isDark = theme === "dark";

        return {
            textColor: isDark ? "#A1A1AA" : "#71717A",
            gridColor: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.05)",
            tooltipBg: isDark ? "#252528" : "#ffffff",
            tooltipBorder: isDark ? "#3A3A3E" : "#E2E8F0",
            tooltipTitle: isDark ? "#FFFFFF" : "#121212",
            tooltipBody: isDark ? "#E4E4E7" : "#1F2937",
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
            breakevenNotice.classList.remove("warning");
        } else {
            breakevenNotice.innerText = `⏳ High energy differences significantly skew efficiency advantages. Check inputs.`;
            breakevenNotice.classList.add("warning");
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
            
            // Update responsive layout scales and styles
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

    // Event Listeners
    capacityInput.addEventListener("input", calculateData);
    tariffInput.addEventListener("input", calculateData);

    document.addEventListener("themechange", () => {
        calculateData();
    });

    calculateData();
}

/* =========================================================================
   2. INTERACTIVE FLUID AERATION PHYSICS SIMULATOR (HTML5 CANVAS)
   ========================================================================= */
function initBubblePhysicsSimulator() {
    const canvas = document.getElementById("aeration-physics-canvas");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    // Sizing Parameters
    let width = 0;
    let height = 0;
    
    function resizeCanvas() {
        width = canvas.width = canvas.parentElement.clientWidth;
        // Maintain a neat 16:9 ratio
        height = canvas.height = width * 9 / 16;
    }
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Mouse Interaction States
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

        // Reset active state after inactivity
        clearTimeout(mouseDecayTimer);
        mouseDecayTimer = setTimeout(() => {
            mouse.active = false;
            mouse.vx = 0;
            mouse.vy = 0;
        }, 150);
    }

    // Attach listeners for mouse
    canvas.addEventListener("mousemove", (e) => {
        handleMouseMove(e.clientX, e.clientY);
    });
    canvas.addEventListener("mouseleave", () => {
        mouse.active = false;
    });

    // Touch events for mobile
    canvas.addEventListener("touchmove", (e) => {
        if (e.touches.length > 0) {
            handleMouseMove(e.touches[0].clientX, e.touches[0].clientY);
        }
    }, { passive: true });
    canvas.addEventListener("touchend", () => {
        mouse.active = false;
    });

    // Bubble Classes & Arrays
    const macroBubbles = [];
    const nanobubbles = [];
    const popParticles = [];

    const numMacro = 20;
    const numNano = 550;

    // Macro Bubble (Traditional)
    class MacroBubble {
        constructor() {
            this.reset();
            // Start scattered initially
            this.y = Math.random() * height;
        }

        reset() {
            // Spawn strictly on the left half
            this.x = Math.random() * (width / 2 - 40) + 20;
            this.y = height + Math.random() * 40;
            this.radius = Math.random() * 5 + 4; // 4px to 9px radius
            this.baseSpeed = -(Math.random() * 1.5 + 2.0); // Rise speed
            this.vx = 0;
            this.vy = this.baseSpeed;
            this.wobbleSpeed = Math.random() * 0.05 + 0.02;
            this.wobbleAmount = Math.random() * 0.8 + 0.3;
            this.phase = Math.random() * Math.PI * 2;
        }

        update() {
            this.phase += this.wobbleSpeed;
            
            // Linear rising + sinusoidal wobble
            const targetVx = Math.sin(this.phase) * this.wobbleAmount;
            
            // Cursor interaction
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

            // Damping & return to base speed
            this.vx += (targetVx - this.vx) * 0.08;
            this.vy += (this.baseSpeed - this.vy) * 0.08;

            this.x += this.vx;
            this.y += this.vy;

            // Keep within boundaries of left side
            if (this.x < this.radius) this.x = this.radius;
            if (this.x > width / 2 - this.radius) this.x = width / 2 - this.radius;

            // Trigger Pop at surface
            if (this.y < this.radius + 15) {
                this.pop();
            }
        }

        pop() {
            // Spawn burst splash particles
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

            // Reflection Highlight highlight (adds 3D effect)
            ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
            ctx.beginPath();
            ctx.arc(this.x - this.radius * 0.35, this.y - this.radius * 0.35, this.radius * 0.15, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Nanobubble (ECOVRY) - Dense, suspended, random drift
    class Nanobubble {
        constructor() {
            // Spawn strictly on the right half, fully dispersed
            this.x = Math.random() * (width / 2 - 30) + width / 2 + 15;
            this.y = Math.random() * (height - 30) + 15;
            this.radius = Math.random() * 1.0 + 0.8; // 0.8px to 1.8px
            this.vx = (Math.random() - 0.5) * 0.3;
            this.vy = (Math.random() - 0.5) * 0.3 - 0.05; // Very slight general upward trend
            this.alpha = Math.random() * 0.4 + 0.4;
        }

        update() {
            // Brownian Motion: tiny random thermal jitters
            this.vx += (Math.random() - 0.5) * 0.12;
            this.vy += (Math.random() - 0.5) * 0.12;

            // Cursor interaction (highly responsive fluid vortex current)
            if (mouse.active) {
                const dx = this.x - mouse.x;
                const dy = this.y - mouse.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                if (dist < 90) {
                    const force = (90 - dist) / 90;
                    // Add mouse momentum + slight orbital swirl
                    this.vx += mouse.vx * force * 0.8;
                    this.vy += mouse.vy * force * 0.8;
                }
            }

            // Liquid Damping / Resistance
            this.vx *= 0.94;
            this.vy *= 0.94;

            // Upward terminal drift offset
            this.vy -= 0.01;

            this.x += this.vx;
            this.y += this.vy;

            // Container bounds bounce
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
                // Recycle at bottom if they reach the top, creating a continuous slow upward flow
                this.y = height - this.radius - Math.random() * 20;
                this.x = Math.random() * (width / 2 - 30) + width / 2 + 15;
                this.vx = (Math.random() - 0.5) * 0.3;
                this.vy = -Math.random() * 0.2 - 0.05; // Very slow upward trend
            } else if (this.y > height - this.radius) {
                // Recycle at bottom if they settle
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

            // Multi-pass glowing aura for dark mode
            const theme = document.body.getAttribute("data-theme") || "light";
            if (theme === "dark" && this.radius > 1.2) {
                ctx.fillStyle = "rgba(52, 211, 153, 0.2)";
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius * 2.2, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1.0; // Reset
        }
    }

    // Populate Initial Entities
    for (let i = 0; i < numMacro; i++) macroBubbles.push(new MacroBubble());
    for (let i = 0; i < numNano; i++) nanobubbles.push(new Nanobubble());

    // Dynamic Theme Color Mapping
    function getThemeColors() {
        const theme = document.body.getAttribute("data-theme") || "light";
        const isDark = theme === "dark";

        return {
            textColor: isDark ? "rgba(255, 255, 255, 0.45)" : "rgba(18, 18, 18, 0.55)",
            subColor: isDark ? "rgba(255, 255, 255, 0.25)" : "rgba(18, 18, 18, 0.35)",
            dividerColor: isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.08)",
            macroColor: isDark ? "rgba(59, 130, 246, 0.7)" : "rgba(37, 99, 235, 0.6)",
            macroFill: isDark ? "rgba(59, 130, 246, 0.1)" : "rgba(37, 99, 235, 0.05)",
            hybridColor: isDark ? "#34d399" : "#059669"
        };
    }

    // Main Simulation Loop
    function animate() {
        requestAnimationFrame(animate);

        // Wipe Canvas
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
        ctx.setLineDash([]); // Reset

        // 2. Draw Simulation Headings
        ctx.font = "bold 11px 'Sora', sans-serif";
        ctx.fillStyle = colors.textColor;
        ctx.textBaseline = "top";
        ctx.letterSpacing = "0.08em";

        // Left heading
        ctx.textAlign = "left";
        ctx.fillText("TRADITIONAL MBBR AERATION", 24, 20);
        
        ctx.font = "600 9px 'Sora', sans-serif";
        ctx.fillStyle = colors.subColor;
        ctx.fillText("OTE ~15% | RETENTION: 3 – 5 SECONDS", 24, 36);

        // Right heading
        ctx.font = "bold 11px 'Sora', sans-serif";
        ctx.fillStyle = colors.textColor;
        ctx.textAlign = "right";
        ctx.fillText("ECOVRY NANOBUBBLE SYSTEM", width - 24, 20);

        ctx.font = "600 9px 'Sora', sans-serif";
        ctx.fillStyle = colors.subColor;
        ctx.fillText("OTE ~85% | RETENTION: INDEFINITE SUSPENSION", width - 24, 36);

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

        // 5. Update & Draw Pop Splash Particles
        for (let i = popParticles.length - 1; i >= 0; i--) {
            const p = popParticles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.08; // gravity drift
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

        // 6. Optional: Mouse Cursor Ripple Ring
        if (mouse.active) {
            ctx.strokeStyle = "rgba(249, 115, 22, 0.15)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(mouse.x, mouse.y, 16, 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    // Start Loop
    animate();
}

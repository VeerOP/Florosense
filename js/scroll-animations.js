/* ----------------------------------------------------
   GSAP SCROLLTRIGGER ANIMATIONS
   ---------------------------------------------------- */

document.addEventListener("DOMContentLoaded", () => {
    // Register GSAP ScrollTrigger
    gsap.registerPlugin(ScrollTrigger);

    // Initialize layout and hero animations immediately so the landing screen is interactive instantly
    initHeaderScrollEffect();
    initHeroAnimations();
});

// Initialize heavy scroll storyboards and reveals only after the full page (images/stylesheets) has loaded
window.addEventListener("load", () => {
    initEcovryScrollStory();
    initDutonScrollStory();
    initProcessTimelineDrawing();
    initGeneralStaggerReveals();
    
    // Refresh ScrollTrigger to calculate exact final positions after page assets settle
    ScrollTrigger.refresh();
});

/* =========================================================================
   1. NAVBAR SCROLL EFFECT
   ========================================================================= */
function initHeaderScrollEffect() {
    const navbar = document.getElementById("main-navbar");
    const logoImg = document.querySelector(".navbar-logo-img");
    if (!navbar) return;

    function updateLogoForTheme() {
        if (!logoImg) return;
        const theme = document.body.getAttribute("data-theme") || "light";
        logoImg.src = theme === "dark" ? "assets/logo_florosense_light.png" : "assets/logo_florosense.png";
    }

    // Handle initial load state if already scrolled
    if (window.scrollY > 50) {
        navbar.classList.add("scrolled");
    }
    updateLogoForTheme();

    ScrollTrigger.create({
        start: "top -50px",
        onEnter: () => {
            navbar.classList.add("scrolled");
        },
        onLeaveBack: () => {
            navbar.classList.remove("scrolled");
        }
    });

    // Listen to themechange so we can swap logo dynamically
    document.addEventListener("themechange", () => {
        updateLogoForTheme();
    });
}

/* =========================================================================
   2. HERO INTERACTIVE INTRO
   ========================================================================= */
function initHeroAnimations() {
    const tl = gsap.timeline();

    // Fade and scale in hero background image (snappy transition)
    tl.fromTo("#hero-background-image", 
        { scale: 1.03, opacity: 0 },
        { scale: 1.0, opacity: 1, duration: 1.2, ease: "power2.out" }
    );

    // Stagger character/text reveal (snappy transition)
    tl.fromTo(".hero-title",
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power4.out" },
        "-=0.9"
    );

    // Stagger subtitles and buttons
    tl.fromTo(".hero-subtitle span, .hero-subtitle .bullet-dot",
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, stagger: 0.08, duration: 0.5, ease: "power2.out" },
        "-=0.5"
    );

    tl.fromTo(".hero-ctas .btn",
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, stagger: 0.1, duration: 0.5, ease: "power2.out" },
        "-=0.4"
    );

    tl.fromTo(".hero-scroll-indicator",
        { opacity: 0 },
        { opacity: 1, duration: 0.6 },
        "-=0.2"
    );
}

/* =========================================================================
   3. ECOVRY 3D SCROLL STORYBOARD (PINNING)
   ========================================================================= */
function initEcovryScrollStory() {
    const ecovrySection = document.getElementById("ecovry-experience");
    if (!ecovrySection) return;

    const slides = gsap.utils.toArray("#ecovry-experience .story-slide");
    const container = ecovrySection.querySelector(".story-container");

    // Only apply desktop-pinning if viewport is wider than 992px
    if (window.innerWidth > 992) {
        // Prepare slides: make them absolute overlaying
        gsap.set(slides, { position: "absolute", top: 0, left: 0, width: "100%", opacity: 0, pointerEvents: "none" });
        gsap.set(slides[0], { opacity: 1, pointerEvents: "auto" });

        // ScrollTrigger to PIN the entire layout
        const pinTimeline = gsap.timeline({
            scrollTrigger: {
                trigger: ecovrySection,
                start: "top top",
                end: "+=3500", // Pinned scroll distance
                scrub: 1,
                pin: true,
                anticipatePin: 1,
                onUpdate: (self) => {
                    // Update Three.js model using the global hook
                    if (window.threeState.updateEcovry) {
                        window.threeState.updateEcovry(self.progress);
                    }
                }
            }
        });

        // Sequence slides fading in and out without overlap
        const stay = 1.0;
        const fade = 0.2;

        slides.forEach((slide, idx) => {
            if (idx === 0) {
                // Slide 1 starts visible, stays visible for 'stay', then fades out
                pinTimeline.to(slide, { opacity: 0, pointerEvents: "none", duration: fade }, stay);
            } else if (idx === slides.length - 1) {
                // Last slide fades in and stays visible
                const fadeInStart = idx * stay + (idx - 1) * fade;
                pinTimeline.fromTo(slide, 
                    { opacity: 0 },
                    { opacity: 1, pointerEvents: "auto", duration: fade }, 
                    fadeInStart
                );
            } else {
                // Intermediate slides fade in, stay visible, then fade out
                const fadeInStart = idx * stay + (idx - 1) * fade;
                const fadeOutStart = (idx + 1) * stay + idx * fade;

                pinTimeline.fromTo(slide, 
                    { opacity: 0 },
                    { opacity: 1, pointerEvents: "auto", duration: fade }, 
                    fadeInStart
                ).to(slide, 
                    { opacity: 0, pointerEvents: "none", duration: fade }, 
                    fadeOutStart
                );
            }
        });
    } else {
        // Fallback for tablets/mobile: simple intersection updates for Three.js
        slides.forEach((slide) => {
            ScrollTrigger.create({
                trigger: slide,
                start: "top center",
                end: "bottom center",
                onEnter: () => {
                    const step = parseInt(slide.getAttribute("data-step"));
                    if (window.threeState.updateEcovry) {
                        window.threeState.updateEcovry(step / 4.0);
                    }
                },
                onEnterBack: () => {
                    const step = parseInt(slide.getAttribute("data-step"));
                    if (window.threeState.updateEcovry) {
                        window.threeState.updateEcovry(step / 4.0);
                    }
                }
            });
        });
    }
}

/* =========================================================================
   4. DUTON DASHBOARD SCROLL STORYBOARD (PINNING)
   ========================================================================= */
function initDutonScrollStory() {
    const dutonSection = document.getElementById("duton-experience");
    if (!dutonSection) return;

    const slides = gsap.utils.toArray("#duton-experience .story-slide");

    // Telemetry display boxes to animate on scroll
    const widgetUptime = document.querySelector("#widget-uptime .m-value");
    const widgetAi = document.querySelector("#widget-ai .m-value");
    const widgetTemp = document.querySelector("#widget-temp .m-value");

    if (window.innerWidth > 992) {
        gsap.set(slides, { position: "absolute", top: 0, left: 0, width: "100%", opacity: 0, pointerEvents: "none" });
        gsap.set(slides[0], { opacity: 1, pointerEvents: "auto" });

        const pinTimeline = gsap.timeline({
            scrollTrigger: {
                trigger: dutonSection,
                start: "top top",
                end: "+=2800",
                scrub: 1,
                pin: true,
                anticipatePin: 1,
                onUpdate: (self) => {
                    const p = self.progress;

                    // Update Three.js circuit board speed and tilt
                    if (window.threeState.updateDuton) {
                        window.threeState.updateDuton(p);
                    }

                    // Dynamically animate SCADA metrics dashboard text values on scroll
                    if (widgetUptime) {
                        const uptimeVal = (95.0 + p * 4.8).toFixed(3);
                        widgetUptime.textContent = `${uptimeVal}%`;
                    }
                    if (widgetTemp) {
                        const tempVal = (38.2 + p * 12.4).toFixed(1);
                        widgetTemp.textContent = `${tempVal}°C`;
                    }
                    if (widgetAi) {
                        if (p < 0.3) {
                            widgetAi.textContent = "CALIBRATING";
                            widgetAi.style.color = "#f97316";
                        } else if (p < 0.7) {
                            widgetAi.textContent = "TUNING";
                            widgetAi.style.color = "#f97316";
                        } else {
                            widgetAi.textContent = "OPTIMAL";
                            widgetAi.style.color = "#10b981";
                        }
                    }
                }
            }
        });

        // Sequence slides fading in and out without overlap
        const stay = 1.0;
        const fade = 0.2;

        slides.forEach((slide, idx) => {
            if (idx === 0) {
                // Slide 1 starts visible, stays visible for 'stay', then fades out
                pinTimeline.to(slide, { opacity: 0, pointerEvents: "none", duration: fade }, stay);
            } else if (idx === slides.length - 1) {
                // Last slide fades in and stays visible
                const fadeInStart = idx * stay + (idx - 1) * fade;
                pinTimeline.fromTo(slide, 
                    { opacity: 0 },
                    { opacity: 1, pointerEvents: "auto", duration: fade }, 
                    fadeInStart
                );
            } else {
                // Intermediate slides fade in, stay visible, then fade out
                const fadeInStart = idx * stay + (idx - 1) * fade;
                const fadeOutStart = (idx + 1) * stay + idx * fade;

                pinTimeline.fromTo(slide, 
                    { opacity: 0 },
                    { opacity: 1, pointerEvents: "auto", duration: fade }, 
                    fadeInStart
                ).to(slide, 
                    { opacity: 0, pointerEvents: "none", duration: fade }, 
                    fadeOutStart
                );
            }
        });
    } else {
        // Fallback for tablets/mobile
        slides.forEach((slide) => {
            ScrollTrigger.create({
                trigger: slide,
                start: "top center",
                end: "bottom center",
                onEnter: () => {
                    const step = parseInt(slide.getAttribute("data-step"));
                    if (window.threeState.updateDuton) {
                        window.threeState.updateDuton(step / 4.0);
                    }
                }
            });
        });
    }
}

/* =========================================================================
   5. PROCESS TIMELINE DRAWING LINE
   ========================================================================= */
function initProcessTimelineDrawing() {
    const scrollPath = document.getElementById("timeline-scroll-path");
    if (!scrollPath) return;

    const timelineNodes = gsap.utils.toArray(".timeline-node");

    // Length of the path
    const pathLength = scrollPath.getTotalLength();
    gsap.set(scrollPath, { strokeDasharray: pathLength, strokeDashoffset: pathLength });

    // Animate dashoffset down to 0 as we scroll through the process timeline
    gsap.to(scrollPath, {
        strokeDashoffset: 0,
        ease: "none",
        scrollTrigger: {
            trigger: ".timeline-wrapper",
            start: "top center",
            end: "bottom center",
            scrub: 0.5
        }
    });

    // Make process nodes light up/active when scroll reaches them
    timelineNodes.forEach((node) => {
        ScrollTrigger.create({
            trigger: node,
            start: "top center+=100",
            end: "bottom center",
            onEnter: () => node.classList.add("active"),
            onLeaveBack: () => node.classList.remove("active")
        });
    });
}

/* =========================================================================
   6. GENERAL STAGGER REVEALS & CARD HOVERS
   ========================================================================= */
function initGeneralStaggerReveals() {
    // Stagger reveal headings on scroll
    const headings = gsap.utils.toArray(".solutions-section .section-title, .industries-section .section-title, .case-studies-section .section-title, .process-section .section-title");
    
    headings.forEach((heading) => {
        gsap.fromTo(heading,
            { opacity: 0, y: 20, filter: "blur(4px)" },
            { 
                opacity: 1, y: 0, filter: "blur(0px)", duration: 0.6, ease: "power3.out",
                scrollTrigger: {
                    trigger: heading,
                    start: "top bottom-=100",
                    toggleActions: "play none none none"
                }
            }
        );
    });

    // Solutions block reveal
    const solutionBlocks = gsap.utils.toArray(".solution-block");
    solutionBlocks.forEach((block) => {
        const text = block.querySelector(".solution-text-box");
        const image = block.querySelector(".solution-image-box");

        gsap.fromTo(image,
            { opacity: 0, scale: 0.97, y: 25 },
            { 
                opacity: 1, scale: 1.0, y: 0, duration: 0.7, ease: "power3.out",
                scrollTrigger: { trigger: block, start: "top bottom-=150" }
            }
        );

        gsap.fromTo(text,
            { opacity: 0, x: block.classList.contains("reversed-block") ? -25 : 25 },
            { 
                opacity: 1, x: 0, duration: 0.7, ease: "power3.out",
                scrollTrigger: { trigger: block, start: "top bottom-=150" }
            }
        );
    });

    // Industries Cards reveal grid
    gsap.fromTo(".industry-card",
        { opacity: 0, y: 25 },
        {
            opacity: 1, y: 0, stagger: 0.08, duration: 0.6, ease: "power3.out",
            scrollTrigger: {
                trigger: ".industries-grid",
                start: "top bottom-=100"
            }
        }
    );

    // Case Studies Cards reveal
    gsap.fromTo(".case-card",
        { opacity: 0, y: 30 },
        {
            opacity: 1, y: 0, stagger: 0.1, duration: 0.7, ease: "power3.out",
            scrollTrigger: {
                trigger: ".case-studies-grid",
                start: "top bottom-=100"
            }
        }
    );

    // Divisions split section content reveal (similar to homepage intro animations)
    const divisionsSection = document.getElementById("divisions");
    if (divisionsSection) {
        const splitSides = gsap.utils.toArray(".split-side");
        
        splitSides.forEach((side, index) => {
            const badge = side.querySelector(".vertical-highlight-badge");
            const logo = side.querySelector(".split-logo-img");
            const desc = side.querySelector(".split-desc");
            const link = side.querySelector(".split-link");
            
            // Start when the divisions section top comes into viewport
            const sideTl = gsap.timeline({
                scrollTrigger: {
                    trigger: divisionsSection,
                    start: "top bottom",
                    toggleActions: "play none none none"
                }
            });
            
            const delayOffset = index * 0.15; // Stagger starting offset of each column
            
            sideTl.fromTo(badge, 
                { opacity: 0, y: 15 },
                { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" },
                delayOffset
            );
            
            sideTl.fromTo(logo, 
                { opacity: 0, y: 30 },
                { opacity: 1, y: 0, duration: 0.6, ease: "power4.out" },
                `-=${0.3}`
            );
            
            sideTl.fromTo(desc, 
                { opacity: 0, y: 15 },
                { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" },
                `-=${0.4}`
            );
            
            sideTl.fromTo(link, 
                { opacity: 0, y: 15 },
                { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" },
                `-=${0.3}`
            );
        });
    }
}

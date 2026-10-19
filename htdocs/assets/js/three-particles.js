/**
 * ==========================================================
 * SENIX v2.0 — Three.js Particle System
 * Sistema de partículas 3D interactivas
 * ==========================================================
 */

(function () {
    'use strict';
    
    // ==========================================================
    // CONFIGURACIÓN
    // ==========================================================
    const CONFIG = {
        particleCount: 800,
        particleSize: 0.02,
        particleColor: 0x00a8ff,
        secondaryColor: 0x00ffcc,
        bgColor: 0x030710,
        mouseRadius: 3,
        mouseStrength: 0.05,
        rotationSpeed: 0.0002,
        connectionDistance: 1.5,
        showConnections: true,
        isMobile: window.innerWidth <= 768,
        isLowEnd: navigator.hardwareConcurrency <= 4
    };
    
    // Ajustar para móvil
    if (CONFIG.isMobile) {
        CONFIG.particleCount = 300;
        CONFIG.showConnections = false;
    }
    if (CONFIG.isLowEnd) {
        CONFIG.particleCount = 150;
        CONFIG.showConnections = false;
    }
    
    // ==========================================================
    // VARIABLES GLOBALES
    // ==========================================================
    let scene, camera, renderer;
    let particles, particleGeometry, particleMaterial;
    let lines, lineGeometry, lineMaterial;
    let canvas;
    let mouse = { x: 0, y: 0 };
    let targetMouse = { x: 0, y: 0 };
    let isRunning = false;
    let clock = null;
    
    // Datos de partículas
    let positions = [];
    let velocities = [];
    let basePositions = [];
    let colors = [];
    
    // ==========================================================
    // INICIALIZAR
    // ==========================================================
    function init() {
        canvas = document.getElementById('senix-particles');
        if (!canvas) {
            console.warn('[Three.js] No se encontró el canvas #senix-particles');
            return;
        }
        
        // Cargar Three.js dinámicamente si no está cargado
        if (typeof THREE === 'undefined') {
            loadThreeJS(initScene);
        } else {
            initScene();
        }
    }
    
    /**
     * Carga Three.js dinámicamente desde CDN
     */
    function loadThreeJS(callback) {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
        script.onload = callback;
        script.onerror = function () {
            console.warn('[Three.js] No se pudo cargar desde cdnjs, intentando jsdelivr...');
            const script2 = document.createElement('script');
            script2.src = 'https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.min.js';
            script2.onload = callback;
            script2.onerror = function () {
                console.warn('[Three.js] No se pudo cargar. Usando fallback CSS.');
                useFallback();
            };
            document.head.appendChild(script2);
        };
        document.head.appendChild(script);
    }
    
    /**
     * Fallback si Three.js no carga
     */
    function useFallback() {
        canvas.style.display = 'none';
        
        // Crear partículas CSS
        const container = document.createElement('div');
        container.className = 'senix-css-particles';
        container.style.cssText = `
            position: fixed;
            inset: 0;
            z-index: -1;
            pointer-events: none;
            overflow: hidden;
        `;
        
        for (let i = 0; i < 50; i++) {
            const dot = document.createElement('div');
            dot.style.cssText = `
                position: absolute;
                width: ${2 + Math.random() * 3}px;
                height: ${2 + Math.random() * 3}px;
                background: #00a8ff;
                border-radius: 50%;
                box-shadow: 0 0 10px #00a8ff;
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                opacity: ${0.2 + Math.random() * 0.5};
                animation: senixFloat ${3 + Math.random() * 4}s ease-in-out ${Math.random() * 2}s infinite;
            `;
            container.appendChild(dot);
        }
        
        document.body.appendChild(container);
    }
    
    /**
     * Inicializa la escena Three.js
     */
    function initScene() {
        // ==========================================================
        // SCENE
        // ==========================================================
        scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(CONFIG.bgColor, 0.15);
        
        // ==========================================================
        // CAMERA
        // ==========================================================
        const aspect = window.innerWidth / window.innerHeight;
        camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
        camera.position.z = 8;
        
        // ==========================================================
        // RENDERER
        // ==========================================================
        renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: !CONFIG.isMobile,
            alpha: true,
            powerPreference: 'high-performance'
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, CONFIG.isMobile ? 1.5 : 2));
        renderer.setClearColor(CONFIG.bgColor, 0);
        
        // ==========================================================
        // CREAR PARTÍCULAS
        // ==========================================================
        createParticles();
        
        // ==========================================================
        // CONEXIONES (líneas entre partículas cercanas)
        // ==========================================================
        if (CONFIG.showConnections) {
            createConnections();
        }
        
        // ==========================================================
        // EVENTOS
        // ==========================================================
        setupEvents();
        
        // ==========================================================
        // START
        // ==========================================================
        clock = new THREE.Clock();
        isRunning = true;
        animate();
        
        console.log('[Three.js] Partículas iniciadas:', CONFIG.particleCount);
    }
    
    /**
     * Crea el sistema de partículas
     */
    function createParticles() {
        particleGeometry = new THREE.BufferGeometry();
        
        const count = CONFIG.particleCount;
        positions = new Float32Array(count * 3);
        colors = new Float32Array(count * 3);
        velocities = [];
        basePositions = [];
        
        const primaryColor = new THREE.Color(CONFIG.particleColor);
        const secondaryColor = new THREE.Color(CONFIG.secondaryColor);
        
        // Esfera de distribución
        const radius = 12;
        
        for (let i = 0; i < count; i++) {
            const i3 = i * 3;
            
            // Posición esférica con distribución no uniforme
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos((Math.random() * 2) - 1);
            const r = Math.pow(Math.random(), 0.5) * radius;
            
            const x = r * Math.sin(phi) * Math.cos(theta);
            const y = r * Math.sin(phi) * Math.sin(theta);
            const z = r * Math.cos(phi);
            
            positions[i3] = x;
            positions[i3 + 1] = y;
            positions[i3 + 2] = z;
            
            // Guardar posición base para animaciones
            basePositions.push({ x, y, z });
            
            // Velocidad individual
            velocities.push({
                x: (Math.random() - 0.5) * 0.008,
                y: (Math.random() - 0.5) * 0.008,
                z: (Math.random() - 0.5) * 0.008
            });
            
            // Color mezclando primary y secondary
            const mixFactor = Math.random();
            const color = primaryColor.clone().lerp(secondaryColor, mixFactor);
            
            colors[i3] = color.r;
            colors[i3 + 1] = color.g;
            colors[i3 + 2] = color.b;
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        // Material con textura de punto
        particleMaterial = new THREE.PointsMaterial({
            size: CONFIG.particleSize,
            vertexColors: true,
            transparent: true,
            opacity: 0.85,
            sizeAttenuation: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        particles = new THREE.Points(particleGeometry, particleMaterial);
        scene.add(particles);
    }
    
    /**
     * Crea líneas de conexión entre partículas
     */
    function createConnections() {
        // Calcular conexiones
        const connections = [];
        const maxConnections = 300;
        const minDist = CONFIG.connectionDistance;
        
        for (let i = 0; i < CONFIG.particleCount && connections.length < maxConnections; i++) {
            const i3 = i * 3;
            const x1 = positions[i3];
            const y1 = positions[i3 + 1];
            const z1 = positions[i3 + 2];
            
            for (let j = i + 1; j < CONFIG.particleCount && connections.length < maxConnections; j++) {
                const j3 = j * 3;
                const x2 = positions[j3];
                const y2 = positions[j3 + 1];
                const z2 = positions[j3 + 2];
                
                const dx = x2 - x1;
                const dy = y2 - y1;
                const dz = z2 - z1;
                const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
                
                if (dist < minDist) {
                    connections.push(x1, y1, z1, x2, y2, z2);
                }
            }
        }
        
        if (connections.length === 0) return;
        
        lineGeometry = new THREE.BufferGeometry();
        lineGeometry.setAttribute('position',
            new THREE.Float32BufferAttribute(connections, 3)
        );
        
        lineMaterial = new THREE.LineBasicMaterial({
            color: CONFIG.particleColor,
            transparent: true,
            opacity: 0.08,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        lines = new THREE.LineSegments(lineGeometry, lineMaterial);
        scene.add(lines);
    }
    
    /**
     * Configura eventos
     */
    function setupEvents() {
        // Mouse
        document.addEventListener('mousemove', onMouseMove, { passive: true });
        document.addEventListener('mouseleave', onMouseLeave, { passive: true });
        
        // Touch
        document.addEventListener('touchmove', onTouchMove, { passive: true });
        document.addEventListener('touchend', onMouseLeave, { passive: true });
        
        // Resize
        let resizeTimer;
        window.addEventListener('resize', function () {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(onResize, 200);
        }, { passive: true });
        
        // Visibility change (pausar cuando no se ve)
        document.addEventListener('visibilitychange', function () {
            if (document.hidden) {
                isRunning = false;
            } else {
                isRunning = true;
                if (clock) clock.getDelta();
                animate();
            }
        });
        
        // Pausar si está fuera del viewport (scroll profundo)
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (entry.target === canvas) {
                        isRunning = entry.isIntersecting;
                        if (isRunning && clock) {
                            clock.getDelta();
                            animate();
                        }
                    }
                });
            }, { threshold: 0 });
            
            observer.observe(canvas);
        }
    }
    
    /**
     * Mouse move
     */
    function onMouseMove(e) {
        targetMouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        targetMouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    }
    
    /**
     * Touch move
     */
    function onTouchMove(e) {
        if (e.touches.length > 0) {
            const touch = e.touches[0];
            targetMouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
            targetMouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;
        }
    }
    
    /**
     * Mouse leave
     */
    function onMouseLeave() {
        targetMouse.x = 0;
        targetMouse.y = 0;
    }
    
    /**
     * Resize
     */
    function onResize() {
        if (!renderer || !camera) return;
        
        const w = window.innerWidth;
        const h = window.innerHeight;
        
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        
        renderer.setSize(w, h);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, CONFIG.isMobile ? 1.5 : 2));
    }
    
    /**
     * Loop de animación
     */
    function animate() {
        if (!isRunning || !renderer) return;
        
        requestAnimationFrame(animate);
        
        const time = clock.getElapsedTime();
        const delta = clock.getDelta();
        
        // Suavizar mouse
        mouse.x += (targetMouse.x - mouse.x) * 0.05;
        mouse.y += (targetMouse.y - mouse.y) * 0.05;
        
        // Actualizar posiciones de partículas
        if (particleGeometry) {
            const positionsAttr = particleGeometry.attributes.position;
            const posArray = positionsAttr.array;
            
            for (let i = 0; i < CONFIG.particleCount; i++) {
                const i3 = i * 3;
                const base = basePositions[i];
                const vel = velocities[i];
                
                // Movimiento orgánico
                posArray[i3] = base.x +
                    Math.sin(time * 0.5 + i * 0.1) * 0.3 +
                    vel.x * time * 10;
                    
                posArray[i3 + 1] = base.y +
                    Math.cos(time * 0.4 + i * 0.15) * 0.3 +
                    vel.y * time * 10;
                    
                posArray[i3 + 2] = base.z +
                    Math.sin(time * 0.3 + i * 0.2) * 0.3 +
                    vel.z * time * 10;
            }
            
            positionsAttr.needsUpdate = true;
        }
        
        // Rotación suave de la escena completa
        if (particles) {
            particles.rotation.y += CONFIG.rotationSpeed;
            particles.rotation.x = mouse.y * 0.15;
            particles.rotation.y += mouse.x * 0.001;
        }
        
        if (lines) {
            lines.rotation.y = particles.rotation.y;
            lines.rotation.x = particles.rotation.x;
        }
        
        // Rotación de la cámara siguiendo al mouse
        if (camera) {
            camera.position.x += (mouse.x * 0.5 - camera.position.x) * 0.02;
            camera.position.y += (mouse.y * 0.5 - camera.position.y) * 0.02;
            camera.lookAt(0, 0, 0);
        }
        
        // Render
        renderer.render(scene, camera);
    }
    
    /**
     * Destruir sistema
     */
    function destroy() {
        isRunning = false;
        
        if (renderer) {
            renderer.dispose();
            renderer = null;
        }
        
        if (particleGeometry) particleGeometry.dispose();
        if (particleMaterial) particleMaterial.dispose();
        if (lineGeometry) lineGeometry.dispose();
        if (lineMaterial) lineMaterial.dispose();
        
        scene = null;
        camera = null;
        particles = null;
        lines = null;
    }
    
    // ==========================================================
    // EXPORT GLOBAL
    // ==========================================================
    window.SenixParticles = {
        init: init,
        destroy: destroy,
        CONFIG: CONFIG
    };
    
    // ==========================================================
    // AUTO INIT
    // ==========================================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})();
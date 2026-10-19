/**
 * ==========================================================
 * SENIX v2.0 — Escenas 3D Extra
 * 8 escenas Three.js adicionales para máxima vida visual
 * ==========================================================
 */

(function (window) {
    'use strict';
    
    if (!window.Senix || typeof THREE === 'undefined') return;
    const S = window.Senix;
    
    // ==========================================================
    // UTILIDADES
    // ==========================================================
    const U = {
        isMobile: () => window.innerWidth <= 768,
        lerp: (a, b, t) => a + (b - a) * t,
        rand: (min, max) => Math.random() * (max - min) + min,
        
        fibonacciSphere(num, radius = 1) {
            const points = [];
            const phi = Math.PI * (3 - Math.sqrt(5));
            for (let i = 0; i < num; i++) {
                const y = 1 - (i / (num - 1)) * 2;
                const r = Math.sqrt(1 - y * y);
                const theta = phi * i;
                points.push({
                    x: Math.cos(theta) * r * radius,
                    y: y * radius,
                    z: Math.sin(theta) * r * radius
                });
            }
            return points;
        }
    };
    
    // ==========================================================
    // ESCENA A: PLANETA CON ANILLO (Saturno)
    // ==========================================================
    class SaturnScene {
        constructor(container, options = {}) {
            this.container = container;
            this.options = options;
            this.isVisible = false;
            this.animationId = null;
            
            const rect = container.getBoundingClientRect();
            const width = rect.width || 400;
            const height = rect.height || 400;
            
            // Scene
            this.scene = new THREE.Scene();
            this.camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
            this.camera.position.z = 6;
            
            this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: !U.isMobile() });
            this.renderer.setSize(width, height);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            this.renderer.setClearColor(0x000000, 0);
            container.innerHTML = '';
            container.appendChild(this.renderer.domElement);
            
            // Luces
            this.scene.add(new THREE.AmbientLight(0x00a8ff, 0.4));
            const l1 = new THREE.DirectionalLight(0x00a8ff, 1.2);
            l1.position.set(5, 5, 5);
            this.scene.add(l1);
            const l2 = new THREE.PointLight(0x00ffcc, 1, 20);
            l2.position.set(-3, -3, 3);
            this.scene.add(l2);
            
            // Planeta
            const planetGeo = new THREE.IcosahedronGeometry(1.6, 1);
            const planetMat = new THREE.MeshStandardMaterial({
                color: 0x0055b3,
                emissive: 0x00a8ff,
                emissiveIntensity: 0.3,
                metalness: 0.7,
                roughness: 0.3,
                flatShading: true
            });
            this.planet = new THREE.Mesh(planetGeo, planetMat);
            this.scene.add(this.planet);
            
            // Wireframe exterior
            const wireGeo = new THREE.IcosahedronGeometry(1.62, 1);
            const wireMat = new THREE.MeshBasicMaterial({
                color: 0x00ffcc,
                wireframe: true,
                transparent: true,
                opacity: 0.4
            });
            this.planetWire = new THREE.Mesh(wireGeo, wireMat);
            this.scene.add(this.planetWire);
            
            // Anillo
            const ringGeo = new THREE.TorusGeometry(2.4, 0.08, 16, 100);
            const ringMat = new THREE.MeshBasicMaterial({
                color: 0x00ffcc,
                transparent: true,
                opacity: 0.7
            });
            this.ring = new THREE.Mesh(ringGeo, ringMat);
            this.ring.rotation.x = Math.PI / 2.2;
            this.ring.rotation.z = 0.3;
            this.scene.add(this.ring);
            
            // Anillo 2
            const ring2Geo = new THREE.TorusGeometry(2.7, 0.04, 16, 100);
            const ring2Mat = new THREE.MeshBasicMaterial({
                color: 0x00a8ff,
                transparent: true,
                opacity: 0.5
            });
            this.ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
            this.ring2.rotation.x = Math.PI / 2.2;
            this.ring2.rotation.z = 0.3;
            this.scene.add(this.ring2);
            
            // Partículas orbitales
            const pCount = U.isMobile() ? 30 : 80;
            const pPositions = new Float32Array(pCount * 3);
            for (let i = 0; i < pCount; i++) {
                const i3 = i * 3;
                const r = 2 + Math.random() * 1.5;
                const theta = Math.random() * Math.PI * 2;
                pPositions[i3] = Math.cos(theta) * r;
                pPositions[i3 + 1] = (Math.random() - 0.5) * 1;
                pPositions[i3 + 2] = Math.sin(theta) * r;
            }
            const pGeo = new THREE.BufferGeometry();
            pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
            const pMat = new THREE.PointsMaterial({
                color: 0x00ffcc,
                size: 0.08,
                transparent: true,
                opacity: 0.9,
                blending: THREE.AdditiveBlending
            });
            this.particles = new THREE.Points(pGeo, pMat);
            this.scene.add(this.particles);
            
            this.clock = new THREE.Clock();
            this.setupObserver();
        }
        
        setupObserver() {
            this.observer = new IntersectionObserver((entries) => {
                entries.forEach(e => {
                    this.isVisible = e.isIntersecting;
                    if (this.isVisible && !this.animationId) this.animate();
                });
            }, { rootMargin: '150px' });
            this.observer.observe(this.container);
        }
        
        animate() {
            if (!this.isVisible) { this.animationId = null; return; }
            this.animationId = requestAnimationFrame(() => this.animate());
            
            const t = this.clock.getElapsedTime();
            const d = this.clock.getDelta();
            
            this.planet.rotation.y += d * 0.3;
            this.planetWire.rotation.y = this.planet.rotation.y;
            this.ring.rotation.z += d * 0.15;
            this.ring2.rotation.z -= d * 0.1;
            this.particles.rotation.y += d * 0.2;
            
            this.planet.position.y = Math.sin(t) * 0.1;
            this.planetWire.position.y = this.planet.position.y;
            
            this.renderer.render(this.scene, this.camera);
        }
    }
    
    // ==========================================================
    // ESCENA B: CUBO DE DATOS
    // ==========================================================
    class DataCubeScene {
        constructor(container) {
            this.container = container;
            this.isVisible = false;
            this.animationId = null;
            
            const rect = container.getBoundingClientRect();
            const width = rect.width || 400;
            const height = rect.height || 400;
            
            this.scene = new THREE.Scene();
            this.camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
            this.camera.position.z = 5;
            
            this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: !U.isMobile() });
            this.renderer.setSize(width, height);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            this.renderer.setClearColor(0x000000, 0);
            container.innerHTML = '';
            container.appendChild(this.renderer.domElement);
            
            this.scene.add(new THREE.AmbientLight(0x00a8ff, 0.5));
            const dl = new THREE.DirectionalLight(0x00a8ff, 1.5);
            dl.position.set(5, 5, 5);
            this.scene.add(dl);
            const dl2 = new THREE.DirectionalLight(0x00ffcc, 0.8);
            dl2.position.set(-5, -5, 3);
            this.scene.add(dl2);
            
            // Cubo exterior (wireframe)
            const cubeGeo = new THREE.BoxGeometry(2.4, 2.4, 2.4);
            const cubeMat = new THREE.MeshBasicMaterial({
                color: 0x00a8ff,
                wireframe: true,
                transparent: true,
                opacity: 0.8
            });
            this.cube = new THREE.Mesh(cubeGeo, cubeMat);
            this.scene.add(this.cube);
            
            // Cubo interior (sólido, más pequeño)
            const innerGeo = new THREE.BoxGeometry(1.6, 1.6, 1.6);
            const innerMat = new THREE.MeshStandardMaterial({
                color: 0x0055b3,
                emissive: 0x00a8ff,
                emissiveIntensity: 0.5,
                metalness: 0.9,
                roughness: 0.1,
                transparent: true,
                opacity: 0.4
            });
            this.innerCube = new THREE.Mesh(innerGeo, innerMat);
            this.scene.add(this.innerCube);
            
            // Vértices glowing
            this.vertexDots = [];
            const positions = cubeGeo.attributes.position.array;
            const seen = new Set();
            const dotGeo = new THREE.SphereGeometry(0.1, 8, 8);
            
            for (let i = 0; i < positions.length; i += 3) {
                const key = `${positions[i].toFixed(2)},${positions[i+1].toFixed(2)},${positions[i+2].toFixed(2)}`;
                if (seen.has(key)) continue;
                seen.add(key);
                
                const dotMat = new THREE.MeshBasicMaterial({ color: 0x00ffcc });
                const dot = new THREE.Mesh(dotGeo.clone(), dotMat);
                dot.position.set(positions[i], positions[i+1], positions[i+2]);
                dot.userData.phase = Math.random() * Math.PI * 2;
                this.scene.add(dot);
                this.vertexDots.push(dot);
            }
            
            // Cubos orbitando
            this.orbiters = [];
            for (let i = 0; i < 3; i++) {
                const orbGeo = new THREE.BoxGeometry(0.25, 0.25, 0.25);
                const orbMat = new THREE.MeshStandardMaterial({
                    color: 0x00ffcc,
                    emissive: 0x00ffcc,
                    emissiveIntensity: 0.8
                });
                const orb = new THREE.Mesh(orbGeo, orbMat);
                orb.userData.angle = (i / 3) * Math.PI * 2;
                orb.userData.radius = 3;
                orb.userData.speed = 0.5 + i * 0.2;
                this.scene.add(orb);
                this.orbiters.push(orb);
            }
            
            this.clock = new THREE.Clock();
            this.setupObserver();
        }
        
        setupObserver() {
            this.observer = new IntersectionObserver((entries) => {
                entries.forEach(e => {
                    this.isVisible = e.isIntersecting;
                    if (this.isVisible && !this.animationId) this.animate();
                });
            }, { rootMargin: '150px' });
            this.observer.observe(this.container);
        }
        
        animate() {
            if (!this.isVisible) { this.animationId = null; return; }
            this.animationId = requestAnimationFrame(() => this.animate());
            
            const t = this.clock.getElapsedTime();
            const d = this.clock.getDelta();
            
            this.cube.rotation.x += d * 0.3;
            this.cube.rotation.y += d * 0.4;
            this.innerCube.rotation.x = -this.cube.rotation.x * 0.7;
            this.innerCube.rotation.y = -this.cube.rotation.y * 0.7;
            
            this.vertexDots.forEach((dot, i) => {
                dot.scale.setScalar(1 + Math.sin(t * 3 + dot.userData.phase) * 0.4);
            });
            
            this.orbiters.forEach(orb => {
                orb.userData.angle += d * orb.userData.speed;
                orb.position.x = Math.cos(orb.userData.angle) * orb.userData.radius;
                orb.position.z = Math.sin(orb.userData.angle) * orb.userData.radius;
                orb.position.y = Math.sin(t * 2 + orb.userData.angle) * 0.5;
                orb.rotation.x += d * 2;
                orb.rotation.y += d * 3;
            });
            
            this.renderer.render(this.scene, this.camera);
        }
    }
    
    // ==========================================================
    // ESCENA C: TÚNEL DE PARTÍCULAS (wormhole)
    // ==========================================================
    class WormholeScene {
        constructor(container) {
            this.container = container;
            this.isVisible = false;
            this.animationId = null;
            
            const rect = container.getBoundingClientRect();
            const width = rect.width || 400;
            const height = rect.height || 400;
            
            this.scene = new THREE.Scene();
            this.scene.fog = new THREE.FogExp2(0x030710, 0.08);
            
            this.camera = new THREE.PerspectiveCamera(70, width / height, 0.1, 100);
            this.camera.position.z = 5;
            
            this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: !U.isMobile() });
            this.renderer.setSize(width, height);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            this.renderer.setClearColor(0x000000, 0);
            container.innerHTML = '';
            container.appendChild(this.renderer.domElement);
            
            // Anillos en túnel
            this.rings = [];
            const ringCount = 30;
            
            for (let i = 0; i < ringCount; i++) {
                const ringGeo = new THREE.TorusGeometry(1.2, 0.02, 8, 60);
                const ringMat = new THREE.MeshBasicMaterial({
                    color: i % 3 === 0 ? 0x00ffcc : 0x00a8ff,
                    transparent: true,
                    opacity: 0.6 - (i / ringCount) * 0.5
                });
                const ring = new THREE.Mesh(ringGeo, ringMat);
                ring.position.z = -i * 0.5;
                ring.userData.baseZ = -i * 0.5;
                this.scene.add(ring);
                this.rings.push(ring);
            }
            
            // Puntos brillantes dentro
            const count = U.isMobile() ? 150 : 400;
            const positions = new Float32Array(count * 3);
            for (let i = 0; i < count; i++) {
                const i3 = i * 3;
                const angle = Math.random() * Math.PI * 2;
                const r = Math.random() * 1.1;
                positions[i3] = Math.cos(angle) * r;
                positions[i3 + 1] = Math.sin(angle) * r;
                positions[i3 + 2] = -Math.random() * 15;
            }
            const geo = new THREE.BufferGeometry();
            geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            const mat = new THREE.PointsMaterial({
                color: 0x00ffcc,
                size: 0.05,
                transparent: true,
                opacity: 0.9,
                blending: THREE.AdditiveBlending
            });
            this.points = new THREE.Points(geo, mat);
            this.scene.add(this.points);
            
            this.clock = new THREE.Clock();
            this.setupObserver();
        }
        
        setupObserver() {
            this.observer = new IntersectionObserver((entries) => {
                entries.forEach(e => {
                    this.isVisible = e.isIntersecting;
                    if (this.isVisible && !this.animationId) this.animate();
                });
            }, { rootMargin: '150px' });
            this.observer.observe(this.container);
        }
        
        animate() {
            if (!this.isVisible) { this.animationId = null; return; }
            this.animationId = requestAnimationFrame(() => this.animate());
            
            const d = this.clock.getDelta();
            
            this.rings.forEach(ring => {
                ring.position.z += d * 3;
                ring.rotation.z += d * 0.5;
                
                if (ring.position.z > 3) {
                    ring.position.z = -14;
                }
            });
            
            this.points.rotation.z += d * 0.3;
            const positions = this.points.geometry.attributes.position.array;
            for (let i = 2; i < positions.length; i += 3) {
                positions[i] += d * 4;
                if (positions[i] > 3) positions[i] = -15;
            }
            this.points.geometry.attributes.position.needsUpdate = true;
            
            this.renderer.render(this.scene, this.camera);
        }
    }
    
    // ==========================================================
    // ESCENA D: MOUSE 3D (idea original -> estrella poligonal)
    // ==========================================================
    class StarScene {
        constructor(container) {
            this.container = container;
            this.isVisible = false;
            this.animationId = null;
            
            const rect = container.getBoundingClientRect();
            const width = rect.width || 400;
            const height = rect.height || 400;
            
            this.scene = new THREE.Scene();
            this.camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
            this.camera.position.z = 6;
            
            this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: !U.isMobile() });
            this.renderer.setSize(width, height);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            this.renderer.setClearColor(0x000000, 0);
            container.innerHTML = '';
            container.appendChild(this.renderer.domElement);
            
            this.scene.add(new THREE.AmbientLight(0x00a8ff, 0.5));
            const dl = new THREE.DirectionalLight(0x00ffcc, 1.5);
            dl.position.set(5, 5, 5);
            this.scene.add(dl);
            
            // Estrella octaedro
            const starGeo = new THREE.OctahedronGeometry(1.5, 0);
            const starMat = new THREE.MeshStandardMaterial({
                color: 0x00a8ff,
                emissive: 0x00a8ff,
                emissiveIntensity: 0.6,
                metalness: 0.9,
                roughness: 0.1,
                flatShading: true
            });
            this.star = new THREE.Mesh(starGeo, starMat);
            this.scene.add(this.star);
            
            // Wireframe
            const wireGeo = new THREE.OctahedronGeometry(1.6, 0);
            const wireMat = new THREE.MeshBasicMaterial({
                color: 0x00ffcc,
                wireframe: true,
                transparent: true,
                opacity: 0.5
            });
            this.wire = new THREE.Mesh(wireGeo, wireMat);
            this.scene.add(this.wire);
            
            // Halo
            const haloGeo = new THREE.SphereGeometry(2.2, 32, 32);
            const haloMat = new THREE.MeshBasicMaterial({
                color: 0x00a8ff,
                wireframe: true,
                transparent: true,
                opacity: 0.08
            });
            this.halo = new THREE.Mesh(haloGeo, haloMat);
            this.scene.add(this.halo);
            
            // Rayos
            this.rays = [];
            for (let i = 0; i < 8; i++) {
                const rayGeo = new THREE.CylinderGeometry(0.02, 0.02, 3, 6);
                const rayMat = new THREE.MeshBasicMaterial({
                    color: 0x00ffcc,
                    transparent: true,
                    opacity: 0.4
                });
                const ray = new THREE.Mesh(rayGeo, rayMat);
                const angle = (i / 8) * Math.PI * 2;
                ray.position.set(Math.cos(angle) * 1.8, Math.sin(angle) * 1.8, 0);
                ray.rotation.z = angle - Math.PI / 2;
                this.scene.add(ray);
                this.rays.push(ray);
            }
            
            this.clock = new THREE.Clock();
            this.setupObserver();
        }
        
        setupObserver() {
            this.observer = new IntersectionObserver((entries) => {
                entries.forEach(e => {
                    this.isVisible = e.isIntersecting;
                    if (this.isVisible && !this.animationId) this.animate();
                });
            }, { rootMargin: '150px' });
            this.observer.observe(this.container);
        }
        
        animate() {
            if (!this.isVisible) { this.animationId = null; return; }
            this.animationId = requestAnimationFrame(() => this.animate());
            
            const t = this.clock.getElapsedTime();
            const d = this.clock.getDelta();
            
            this.star.rotation.x += d * 0.4;
            this.star.rotation.y += d * 0.6;
            this.wire.rotation.x = -this.star.rotation.x * 0.5;
            this.wire.rotation.y = -this.star.rotation.y * 0.5;
            this.halo.rotation.y += d * 0.1;
            this.halo.rotation.x += d * 0.05;
            
            this.star.scale.setScalar(1 + Math.sin(t * 2) * 0.08);
            this.wire.scale.setScalar(1 + Math.sin(t * 2 + 0.5) * 0.08);
            
            this.rays.forEach((ray, i) => {
                const scale = 1 + Math.sin(t * 3 + i) * 0.3;
                ray.scale.y = scale;
            });
            
            this.renderer.render(this.scene, this.camera);
        }
    }
    
    // ==========================================================
    // ESCENA E: ONDAS CUÁNTICAS (grid deformado)
    // ==========================================================
    class QuantumWavesScene {
        constructor(container) {
            this.container = container;
            this.isVisible = false;
            this.animationId = null;
            
            const rect = container.getBoundingClientRect();
            const width = rect.width || 400;
            const height = rect.height || 400;
            
            this.scene = new THREE.Scene();
            this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
            this.camera.position.set(0, 3, 5);
            this.camera.lookAt(0, 0, 0);
            
            this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: !U.isMobile() });
            this.renderer.setSize(width, height);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            this.renderer.setClearColor(0x000000, 0);
            container.innerHTML = '';
            container.appendChild(this.renderer.domElement);
            
            // Grid de planos
            const size = 20;
            const segments = 30;
            const geo = new THREE.PlaneGeometry(size, size, segments, segments);
            const mat = new THREE.MeshBasicMaterial({
                color: 0x00a8ff,
                wireframe: true,
                transparent: true,
                opacity: 0.5
            });
            
            this.grid = new THREE.Mesh(geo, mat);
            this.grid.rotation.x = -Math.PI / 2;
            this.scene.add(this.grid);
            
            // Puntos flotantes
            const count = U.isMobile() ? 50 : 150;
            const pPositions = new Float32Array(count * 3);
            for (let i = 0; i < count; i++) {
                const i3 = i * 3;
                pPositions[i3] = (Math.random() - 0.5) * size;
                pPositions[i3 + 1] = Math.random() * 4;
                pPositions[i3 + 2] = (Math.random() - 0.5) * size;
            }
            const pGeo = new THREE.BufferGeometry();
            pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
            const pMat = new THREE.PointsMaterial({
                color: 0x00ffcc,
                size: 0.1,
                transparent: true,
                opacity: 0.8,
                blending: THREE.AdditiveBlending
            });
            this.points = new THREE.Points(pGeo, pMat);
            this.scene.add(this.points);
            
            this.clock = new THREE.Clock();
            this.setupObserver();
        }
        
        setupObserver() {
            this.observer = new IntersectionObserver((entries) => {
                entries.forEach(e => {
                    this.isVisible = e.isIntersecting;
                    if (this.isVisible && !this.animationId) this.animate();
                });
            }, { rootMargin: '150px' });
            this.observer.observe(this.container);
        }
        
        animate() {
            if (!this.isVisible) { this.animationId = null; return; }
            this.animationId = requestAnimationFrame(() => this.animate());
            
            const t = this.clock.getElapsedTime();
            
            // Deformar grid con ondas
            const positions = this.grid.geometry.attributes.position.array;
            for (let i = 0; i < positions.length; i += 3) {
                const x = positions[i];
                const y = positions[i + 1];
                positions[i + 2] = Math.sin(x * 0.5 + t) * Math.cos(y * 0.5 + t) * 0.5;
            }
            this.grid.geometry.attributes.position.needsUpdate = true;
            
            this.points.rotation.y += 0.002;
            
            this.renderer.render(this.scene, this.camera);
        }
    }
    
    // ==========================================================
    // ESCENA F: CRISTAL DIAMANTE
    // ==========================================================
    class DiamondScene {
        constructor(container) {
            this.container = container;
            this.isVisible = false;
            this.animationId = null;
            
            const rect = container.getBoundingClientRect();
            const width = rect.width || 400;
            const height = rect.height || 400;
            
            this.scene = new THREE.Scene();
            this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
            this.camera.position.z = 5;
            
            this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: !U.isMobile() });
            this.renderer.setSize(width, height);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            this.renderer.setClearColor(0x000000, 0);
            container.innerHTML = '';
            container.appendChild(this.renderer.domElement);
            
            this.scene.add(new THREE.AmbientLight(0x00a8ff, 0.6));
            
            const key = new THREE.DirectionalLight(0xffffff, 1.5);
            key.position.set(5, 5, 5);
            this.scene.add(key);
            
            const fill = new THREE.DirectionalLight(0x00ffcc, 1);
            fill.position.set(-5, 3, 3);
            this.scene.add(fill);
            
            const rim = new THREE.PointLight(0x00a8ff, 2, 20);
            rim.position.set(0, 0, 5);
            this.scene.add(rim);
            
            // Diamante
            const gemGeo = new THREE.OctahedronGeometry(1.4, 0);
            const gemMat = new THREE.MeshStandardMaterial({
                color: 0x00a8ff,
                emissive: 0x00a8ff,
                emissiveIntensity: 0.5,
                metalness: 1,
                roughness: 0,
                flatShading: true,
                transparent: true,
                opacity: 0.85
            });
            this.gem = new THREE.Mesh(gemGeo, gemMat);
            this.gem.scale.set(1, 1.4, 1);
            this.scene.add(this.gem);
            
            // Wireframe overlay
            const wireGeo = new THREE.OctahedronGeometry(1.45, 0);
            const wireMat = new THREE.MeshBasicMaterial({
                color: 0x00ffcc,
                wireframe: true,
                transparent: true,
                opacity: 0.9
            });
            this.wire = new THREE.Mesh(wireGeo, wireMat);
            this.wire.scale.set(1, 1.4, 1);
            this.scene.add(this.wire);
            
            // Puntos en los vértices
            this.dots = [];
            const dotGeo = new THREE.SphereGeometry(0.08, 8, 8);
            const vertexPositions = [
                [0, 1.4, 0], [0, -1.4, 0],
                [1.4, 0, 0], [-1.4, 0, 0],
                [0, 0, 1.4], [0, 0, -1.4]
            ];
            vertexPositions.forEach(pos => {
                const dot = new THREE.Mesh(dotGeo.clone(),
                    new THREE.MeshBasicMaterial({ color: 0x00ffcc }));
                dot.position.set(...pos);
                this.scene.add(dot);
                this.dots.push(dot);
            });
            
            this.clock = new THREE.Clock();
            this.setupObserver();
        }
        
        setupObserver() {
            this.observer = new IntersectionObserver((entries) => {
                entries.forEach(e => {
                    this.isVisible = e.isIntersecting;
                    if (this.isVisible && !this.animationId) this.animate();
                });
            }, { rootMargin: '150px' });
            this.observer.observe(this.container);
        }
        
        animate() {
            if (!this.isVisible) { this.animationId = null; return; }
            this.animationId = requestAnimationFrame(() => this.animate());
            
            const t = this.clock.getElapsedTime();
            const d = this.clock.getDelta();
            
            this.gem.rotation.y += d * 0.6;
            this.wire.rotation.y = this.gem.rotation.y;
            
            this.gem.position.y = Math.sin(t) * 0.15;
            this.wire.position.y = this.gem.position.y;
            this.dots.forEach(dot => dot.position.y += Math.sin(t) * 0.001);
            
            this.renderer.render(this.scene, this.camera);
        }
    }
    
    // ==========================================================
    // ESCENA G: ADN HELIX
    // ==========================================================
    class HelixScene {
        constructor(container) {
            this.container = container;
            this.isVisible = false;
            this.animationId = null;
            
            const rect = container.getBoundingClientRect();
            const width = rect.width || 400;
            const height = rect.height || 400;
            
            this.scene = new THREE.Scene();
            this.camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
            this.camera.position.set(0, 0, 6);
            
            this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: !U.isMobile() });
            this.renderer.setSize(width, height);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            this.renderer.setClearColor(0x000000, 0);
            container.innerHTML = '';
            container.appendChild(this.renderer.domElement);
            
            this.group = new THREE.Group();
            this.scene.add(this.group);
            
            const height_step = 0.4;
            const turns = 3;
            const points = 20;
            const radius = 1.2;
            
            // Dos hélices
            this.strand1 = [];
            this.strand2 = [];
            this.rungs = [];
            
            for (let i = 0; i < points * turns; i++) {
                const y = (i - points * turns / 2) * height_step;
                const angle = (i / points) * Math.PI * 2;
                
                const x1 = Math.cos(angle) * radius;
                const z1 = Math.sin(angle) * radius;
                const x2 = Math.cos(angle + Math.PI) * radius;
                const z2 = Math.sin(angle + Math.PI) * radius;
                
                // Nodos
                const nodeGeo = new THREE.SphereGeometry(0.14, 12, 12);
                const n1 = new THREE.Mesh(nodeGeo,
                    new THREE.MeshStandardMaterial({
                        color: 0x00a8ff,
                        emissive: 0x00a8ff,
                        emissiveIntensity: 0.8
                    }));
                n1.position.set(x1, y, z1);
                this.group.add(n1);
                this.strand1.push(n1);
                
                const n2 = new THREE.Mesh(nodeGeo.clone(),
                    new THREE.MeshStandardMaterial({
                        color: 0x00ffcc,
                        emissive: 0x00ffcc,
                        emissiveIntensity: 0.8
                    }));
                n2.position.set(x2, y, z2);
                this.group.add(n2);
                this.strand2.push(n2);
                
                // Rungs (peldaños)
                if (i % 3 === 0) {
                    const rungGeo = new THREE.CylinderGeometry(0.02, 0.02, radius * 2, 6);
                    const rungMat = new THREE.MeshBasicMaterial({
                        color: 0xffffff,
                        transparent: true,
                        opacity: 0.3
                    });
                    const rung = new THREE.Mesh(rungGeo, rungMat);
                    rung.position.set(0, y, 0);
                    rung.rotation.z = Math.PI / 2;
                    rung.rotation.y = -angle;
                    this.group.add(rung);
                    this.rungs.push(rung);
                }
            }
            
            this.clock = new THREE.Clock();
            this.setupObserver();
        }
        
        setupObserver() {
            this.observer = new IntersectionObserver((entries) => {
                entries.forEach(e => {
                    this.isVisible = e.isIntersecting;
                    if (this.isVisible && !this.animationId) this.animate();
                });
            }, { rootMargin: '150px' });
            this.observer.observe(this.container);
        }
        
        animate() {
            if (!this.isVisible) { this.animationId = null; return; }
            this.animationId = requestAnimationFrame(() => this.animate());
            
            const t = this.clock.getElapsedTime();
            const d = this.clock.getDelta();
            
            this.group.rotation.y += d * 0.6;
            
            this.strand1.forEach((n, i) => {
                n.scale.setScalar(1 + Math.sin(t * 3 + i * 0.3) * 0.3);
            });
            this.strand2.forEach((n, i) => {
                n.scale.setScalar(1 + Math.sin(t * 3 + i * 0.3 + Math.PI) * 0.3);
            });
            
            this.renderer.render(this.scene, this.camera);
        }
    }
    
    // ==========================================================
    // ESCENA H: PARTÍCULAS DE CORAZÓN
    // ==========================================================
    class HeartScene {
        constructor(container) {
            this.container = container;
            this.isVisible = false;
            this.animationId = null;
            
            const rect = container.getBoundingClientRect();
            const width = rect.width || 400;
            const height = rect.height || 400;
            
            this.scene = new THREE.Scene();
            this.camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
            this.camera.position.z = 6;
            
            this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: !U.isMobile() });
            this.renderer.setSize(width, height);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            this.renderer.setClearColor(0x000000, 0);
            container.innerHTML = '';
            container.appendChild(this.renderer.domElement);
            
            // Partículas en forma de corazón
            const count = U.isMobile() ? 300 : 800;
            const positions = new Float32Array(count * 3);
            const colors = new Float32Array(count * 3);
            
            const c1 = new THREE.Color(0x00a8ff);
            const c2 = new THREE.Color(0x00ffcc);
            
            // Parametric heart equation
            for (let i = 0; i < count; i++) {
                const i3 = i * 3;
                const t = Math.random() * Math.PI * 2;
                const rand = Math.pow(Math.random(), 0.5);
                
                // Heart equation
                const x = 16 * Math.pow(Math.sin(t), 3);
                const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
                
                positions[i3] = (x / 16) * 2.2 * rand;
                positions[i3 + 1] = (y / 16) * 2.2 * rand;
                positions[i3 + 2] = (Math.random() - 0.5) * 0.8 * rand;
                
                const mix = Math.random();
                const col = c1.clone().lerp(c2, mix);
                colors[i3] = col.r;
                colors[i3 + 1] = col.g;
                colors[i3 + 2] = col.b;
            }
            
            const geo = new THREE.BufferGeometry();
            geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
            
            const mat = new THREE.PointsMaterial({
                size: 0.08,
                vertexColors: true,
                transparent: true,
                opacity: 0.9,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            });
            
            this.points = new THREE.Points(geo, mat);
            this.scene.add(this.points);
            
            // Partículas satélite
            const sCount = 200;
            const sPositions = new Float32Array(sCount * 3);
            for (let i = 0; i < sCount; i++) {
                const i3 = i * 3;
                const r = 3 + Math.random() * 2;
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.acos(Math.random() * 2 - 1);
                sPositions[i3] = r * Math.sin(phi) * Math.cos(theta);
                sPositions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
                sPositions[i3 + 2] = r * Math.cos(phi);
            }
            const sGeo = new THREE.BufferGeometry();
            sGeo.setAttribute('position', new THREE.BufferAttribute(sPositions, 3));
            const sMat = new THREE.PointsMaterial({
                color: 0x00a8ff,
                size: 0.05,
                transparent: true,
                opacity: 0.6,
                blending: THREE.AdditiveBlending
            });
            this.satellites = new THREE.Points(sGeo, sMat);
            this.scene.add(this.satellites);
            
            this.clock = new THREE.Clock();
            this.setupObserver();
        }
        
        setupObserver() {
            this.observer = new IntersectionObserver((entries) => {
                entries.forEach(e => {
                    this.isVisible = e.isIntersecting;
                    if (this.isVisible && !this.animationId) this.animate();
                });
            }, { rootMargin: '150px' });
            this.observer.observe(this.container);
        }
        
        animate() {
            if (!this.isVisible) { this.animationId = null; return; }
            this.animationId = requestAnimationFrame(() => this.animate());
            
            const t = this.clock.getElapsedTime();
            const d = this.clock.getDelta();
            
            this.points.rotation.y += d * 0.3;
            this.points.scale.setScalar(1 + Math.sin(t * 2) * 0.05);
            this.satellites.rotation.y -= d * 0.15;
            
            this.renderer.render(this.scene, this.camera);
        }
    }
    
    // ==========================================================
    // REGISTRO
    // ==========================================================
    const EXTRA_SCENES = {
        'saturn': SaturnScene,
        'data-cube': DataCubeScene,
        'wormhole': WormholeScene,
        'star': StarScene,
        'quantum-waves': QuantumWavesScene,
        'diamond': DiamondScene,
        'helix': HelixScene,
        'heart': HeartScene
    };
    
    // ==========================================================
    // INIT: Montar automáticamente todas las escenas extras
    // ==========================================================
    function initExtra() {
        if (typeof THREE === 'undefined') {
            console.warn('[SENIX 3D Extra] Three.js no está cargado');
            return;
        }
        
        const containers = S.$$('[data-3d-scene][data-scene-type]');
        
        containers.forEach(el => {
            const type = el.dataset.sceneType;
            const Factory = EXTRA_SCENES[type];
            if (!Factory) return;
            
            // Evitar duplicados
            if (el.dataset.sceneMounted === '1') return;
            el.dataset.sceneMounted = '1';
            
            try {
                new Factory(el);
            } catch (e) {
                console.warn('[SENIX 3D Extra] Error en escena', type, e);
            }
        });
    }
    
    // Export
    S.scenes3dExtra = {
        init: initExtra,
        SCENES: EXTRA_SCENES
    };
    
    // Auto-init
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(initExtra, 300);
        });
    } else {
        setTimeout(initExtra, 300);
    }
    
})(window);
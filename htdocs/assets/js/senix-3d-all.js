/**
 * ==========================================================
 * SENIX v2.0 — Sistema 3D Consolidado
 * Todas las escenas en un solo archivo. Sin duplicados.
 * ==========================================================
 */

(function (window) {
    'use strict';
    
    if (!window.Senix) return;
    const S = window.Senix;
    
    // ==========================================================
    // THREE.JS LOADER (una sola vez)
    // ==========================================================
    let threeLoaded = false;
    let threePromise = null;
    
    function ensureThreeJS() {
        if (typeof THREE !== 'undefined') {
            threeLoaded = true;
            return Promise.resolve();
        }
        if (threePromise) return threePromise;
        
        threePromise = new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
            script.onload = () => { threeLoaded = true; resolve(); };
            script.onerror = () => {
                const script2 = document.createElement('script');
                script2.src = 'https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.min.js';
                script2.onload = () => { threeLoaded = true; resolve(); };
                script2.onerror = () => resolve();
                document.head.appendChild(script2);
            };
            document.head.appendChild(script);
        });
        return threePromise;
    }
    
    // ==========================================================
    // UTILS
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
    // BASE SCENE
    // ==========================================================
    class BaseScene {
        constructor(container, options = {}) {
            if (typeof THREE === 'undefined') {
                console.warn('[SENIX 3D] Three.js no disponible');
                return;
            }
            
            this.container = container;
            this.options = options;
            this.isVisible = false;
            this.animationId = null;
            this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
            
            this.init();
        }
        
        init() {
            const rect = this.container.getBoundingClientRect();
            const width = rect.width || 800;
            const height = rect.height || 600;
            
            this.scene = new THREE.Scene();
            this.scene.fog = new THREE.FogExp2(0x030710, this.options.fogDensity || 0.08);
            
            this.camera = new THREE.PerspectiveCamera(
                this.options.fov || 60,
                width / height,
                0.1,
                1000
            );
            this.camera.position.z = this.options.cameraZ || 8;
            
            this.renderer = new THREE.WebGLRenderer({
                alpha: true,
                antialias: !U.isMobile(),
                powerPreference: 'high-performance'
            });
            this.renderer.setSize(width, height);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, U.isMobile() ? 1.5 : 2));
            this.renderer.setClearColor(0x000000, 0);
            
            this.container.innerHTML = '';
            this.container.appendChild(this.renderer.domElement);
            this.renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;outline:none;';
            
            this.setupLights();
            this.createContent();
            this.setupEvents();
            
            this.clock = new THREE.Clock();
            this.container.classList.add('is-ready');
        }
        
        setupLights() {
            this.scene.add(new THREE.AmbientLight(0x00a8ff, 0.4));
            
            const dir = new THREE.DirectionalLight(0x00a8ff, 1);
            dir.position.set(5, 5, 5);
            this.scene.add(dir);
            
            const dir2 = new THREE.DirectionalLight(0x00ffcc, 0.5);
            dir2.position.set(-5, -5, 3);
            this.scene.add(dir2);
        }
        
        createContent() {}
        
        setupEvents() {
            this.onMouseMove = (e) => {
                const rect = this.container.getBoundingClientRect();
                this.mouse.targetX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
                this.mouse.targetY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
            };
            window.addEventListener('mousemove', this.onMouseMove, { passive: true });
            
            this.onResize = S.debounce(() => {
                const rect = this.container.getBoundingClientRect();
                if (!rect.width) return;
                this.camera.aspect = rect.width / rect.height;
                this.camera.updateProjectionMatrix();
                this.renderer.setSize(rect.width, rect.height);
            }, 200);
            window.addEventListener('resize', this.onResize, { passive: true });
            
            this.observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    this.isVisible = entry.isIntersecting;
                    if (this.isVisible && !this.animationId) this.animate();
                });
            }, { rootMargin: '150px' });
            this.observer.observe(this.container);
            
            // Forzar arranque inicial
            setTimeout(() => {
                this.isVisible = true;
                if (!this.animationId) this.animate();
            }, 100);
        }
        
        animate() {
            if (!this.isVisible) { this.animationId = null; return; }
            this.animationId = requestAnimationFrame(() => this.animate());
            
            const elapsed = this.clock.getElapsedTime();
            const delta = Math.min(this.clock.getDelta(), 0.1);
            
            this.mouse.x = U.lerp(this.mouse.x, this.mouse.targetX, 0.05);
            this.mouse.y = U.lerp(this.mouse.y, this.mouse.targetY, 0.05);
            
            this.update(elapsed, delta);
            this.renderer.render(this.scene, this.camera);
        }
        
        update() {}
        
        destroy() {
            if (this.animationId) cancelAnimationFrame(this.animationId);
            if (this.observer) this.observer.disconnect();
            window.removeEventListener('mousemove', this.onMouseMove);
            window.removeEventListener('resize', this.onResize);
        }
    }
    
    // ==========================================================
    // ESCENA: NEURAL NETWORK
    // ==========================================================
    class NeuralScene extends BaseScene {
        createContent() {
            this.group = new THREE.Group();
            this.scene.add(this.group);
            
            const count = U.isMobile() ? 40 : 80;
            const radius = 4;
            const nodePositions = U.fibonacciSphere(count, radius);
            
            const geo = new THREE.SphereGeometry(0.08, 12, 12);
            this.nodes = [];
            
            nodePositions.forEach((pos, i) => {
                const color = i % 3 === 0 ? 0x00ffcc : 0x00a8ff;
                const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9 });
                const node = new THREE.Mesh(geo.clone(), mat);
                node.position.set(pos.x, pos.y, pos.z);
                node.userData = { basePos: { ...pos }, phase: Math.random() * Math.PI * 2 };
                this.group.add(node);
                this.nodes.push(node);
            });
            
            // Líneas
            const lines = [];
            for (let i = 0; i < this.nodes.length; i++) {
                for (let j = i + 1; j < this.nodes.length; j++) {
                    const a = this.nodes[i].position;
                    const b = this.nodes[j].position;
                    if (a.distanceTo(b) < 1.8) {
                        lines.push(a.x, a.y, a.z, b.x, b.y, b.z);
                    }
                }
            }
            
            const lineGeo = new THREE.BufferGeometry();
            lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(lines, 3));
            this.linesMat = new THREE.LineBasicMaterial({
                color: 0x00a8ff,
                transparent: true,
                opacity: 0.15,
                blending: THREE.AdditiveBlending
            });
            this.lines = new THREE.LineSegments(lineGeo, this.linesMat);
            this.group.add(this.lines);
            
            // Partículas ambientales
            const pCount = U.isMobile() ? 200 : 600;
            const positions = new Float32Array(pCount * 3);
            const colors = new Float32Array(pCount * 3);
            const c1 = new THREE.Color(0x00a8ff);
            const c2 = new THREE.Color(0x00ffcc);
            
            for (let i = 0; i < pCount; i++) {
                const i3 = i * 3;
                const r = 8 + Math.random() * 12;
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.acos(Math.random() * 2 - 1);
                positions[i3] = r * Math.sin(phi) * Math.cos(theta);
                positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
                positions[i3 + 2] = r * Math.cos(phi);
                const col = c1.clone().lerp(c2, Math.random());
                colors[i3] = col.r; colors[i3 + 1] = col.g; colors[i3 + 2] = col.b;
            }
            
            const pGeo = new THREE.BufferGeometry();
            pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            pGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
            this.particles = new THREE.Points(pGeo, new THREE.PointsMaterial({
                size: 0.05,
                vertexColors: true,
                transparent: true,
                opacity: 0.7,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            }));
            this.scene.add(this.particles);
        }
        
        update(t, d) {
            this.group.rotation.y += d * 0.15;
            this.group.rotation.x += (this.mouse.y * 0.3 - this.group.rotation.x) * 0.05;
            
            this.nodes.forEach(node => {
                const { basePos, phase } = node.userData;
                node.position.x = basePos.x + Math.sin(t + phase) * 0.1;
                node.position.y = basePos.y + Math.cos(t + phase) * 0.1;
            });
            
            this.linesMat.opacity = 0.15 + Math.sin(t * 2) * 0.05;
            
            if (this.particles) {
                this.particles.rotation.y += d * 0.02;
            }
            
            this.camera.position.x += (this.mouse.x - this.camera.position.x) * 0.02;
            this.camera.position.y += (this.mouse.y - this.camera.position.y) * 0.02;
            this.camera.lookAt(0, 0, 0);
        }
    }
    
    // ==========================================================
    // ESCENA: HAND TRACKING
    // ==========================================================
    class HandScene extends BaseScene {
        createContent() {
            this.group = new THREE.Group();
            this.scene.add(this.group);
            
            const handPoints = [
                [0, -2.5, 0],
                [-0.8, -1.8, 0.2], [-1.3, -1.2, 0.3], [-1.6, -0.6, 0.3], [-1.7, -0.1, 0.3],
                [-0.5, -1.5, 0.1], [-0.5, -0.8, 0.1], [-0.5, -0.2, 0.1], [-0.5, 0.3, 0.1],
                [0, -1.5, 0.2], [0, -0.7, 0.2], [0, 0, 0.2], [0, 0.5, 0.2],
                [0.5, -1.5, 0.1], [0.5, -0.8, 0.1], [0.5, -0.2, 0.1], [0.5, 0.3, 0.1],
                [1, -1.6, 0], [1, -1, 0], [1, -0.5, 0], [1, 0, 0]
            ];
            
            const bones = [
                [0,1],[1,2],[2,3],[3,4],
                [0,5],[5,6],[6,7],[7,8],
                [0,9],[9,10],[10,11],[11,12],
                [0,13],[13,14],[14,15],[15,16],
                [0,17],[17,18],[18,19],[19,20]
            ];
            
            const pointGeo = new THREE.SphereGeometry(0.12, 16, 16);
            this.points = [];
            
            handPoints.forEach((pos, i) => {
                const isTip = [4, 8, 12, 16, 20].includes(i);
                const color = isTip ? 0x00a8ff : 0x00ffcc;
                const mesh = new THREE.Mesh(pointGeo.clone(), new THREE.MeshBasicMaterial({ color }));
                mesh.position.set(pos[0], pos[1], pos[2]);
                mesh.userData = { basePos: { x: pos[0], y: pos[1], z: pos[2] }, phase: Math.random() * Math.PI * 2, isTip };
                if (isTip) mesh.scale.setScalar(1.3);
                this.group.add(mesh);
                this.points.push(mesh);
            });
            
            const linePositions = [];
            bones.forEach(([a, b]) => {
                const pa = handPoints[a], pb = handPoints[b];
                linePositions.push(pa[0],pa[1],pa[2], pb[0],pb[1],pb[2]);
            });
            
            const lineGeo = new THREE.BufferGeometry();
            lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
            this.bones = new THREE.LineSegments(lineGeo, new THREE.LineBasicMaterial({
                color: 0x00a8ff,
                transparent: true,
                opacity: 0.8
            }));
            this.group.add(this.bones);
            
            // Grid holográfico
            const grid = new THREE.GridHelper(10, 20, 0x00a8ff, 0x003d5c);
            grid.position.y = -3;
            grid.material.transparent = true;
            grid.material.opacity = 0.3;
            this.group.add(grid);
            
            this.group.scale.setScalar(1.2);
        }
        
        update(t, d) {
            this.group.rotation.y = Math.sin(t * 0.3) * 0.3 + this.mouse.x * 0.5;
            this.group.rotation.x = Math.cos(t * 0.2) * 0.1 + this.mouse.y * 0.3;
            
            this.points.forEach((p, i) => {
                const { basePos, phase, isTip } = p.userData;
                p.position.x = basePos.x + Math.sin(t * 2 + phase) * 0.05;
                p.position.y = basePos.y + Math.cos(t * 1.5 + phase) * 0.05;
                if (isTip) p.scale.setScalar(1.3 + Math.sin(t * 4 + i) * 0.3);
            });
            
            this.bones.material.opacity = 0.6 + Math.sin(t * 3) * 0.2;
        }
    }
    
    // ==========================================================
    // ESCENA: FLOATING GEOMETRY (con subtipos)
    // ==========================================================
    class FloatingScene extends BaseScene {
        constructor(container, options = {}) {
            super(container, options);
            this.geoType = options.geometry || 'icosahedron';
            this.primaryColor = options.color !== undefined ? options.color : 0x00a8ff;
        }
        
        createContent() {
            this.group = new THREE.Group();
            this.scene.add(this.group);
            
            let geo;
            switch (this.geoType) {
                case 'torus':         geo = new THREE.TorusGeometry(1.5, 0.4, 32, 100); break;
                case 'torusKnot':     geo = new THREE.TorusKnotGeometry(1.3, 0.35, 128, 16); break;
                case 'octahedron':    geo = new THREE.OctahedronGeometry(1.8, 0); break;
                case 'dodecahedron':  geo = new THREE.DodecahedronGeometry(1.8, 0); break;
                case 'icosahedron':
                default:              geo = new THREE.IcosahedronGeometry(1.8, 0); break;
            }
            
            this.mainMesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
                color: this.primaryColor,
                wireframe: true,
                transparent: true,
                opacity: 0.7
            }));
            this.group.add(this.mainMesh);
            
            this.innerMesh = new THREE.Mesh(geo.clone(), new THREE.MeshBasicMaterial({
                color: this.primaryColor,
                transparent: true,
                opacity: 0.1
            }));
            this.innerMesh.scale.setScalar(0.95);
            this.group.add(this.innerMesh);
            
            // Vértices
            this.dots = [];
            if (geo.attributes.position) {
                const positions = geo.attributes.position.array;
                const seen = new Set();
                const dotGeo = new THREE.SphereGeometry(0.06, 8, 8);
                
                for (let i = 0; i < positions.length; i += 3) {
                    const key = `${positions[i].toFixed(2)},${positions[i+1].toFixed(2)},${positions[i+2].toFixed(2)}`;
                    if (seen.has(key)) continue;
                    seen.add(key);
                    
                    const dot = new THREE.Mesh(dotGeo.clone(), new THREE.MeshBasicMaterial({ color: 0x00ffcc }));
                    dot.position.set(positions[i], positions[i+1], positions[i+2]);
                    dot.userData.phase = Math.random() * Math.PI * 2;
                    this.group.add(dot);
                    this.dots.push(dot);
                }
            }
            
            // Partículas orbitando
            const count = U.isMobile() ? 30 : 60;
            const positions = new Float32Array(count * 3);
            const colors = new Float32Array(count * 3);
            const c1 = new THREE.Color(this.primaryColor);
            const c2 = new THREE.Color(0x00ffcc);
            
            for (let i = 0; i < count; i++) {
                const i3 = i * 3;
                const r = 2.5 + Math.random() * 1.5;
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.acos(Math.random() * 2 - 1);
                positions[i3] = r * Math.sin(phi) * Math.cos(theta);
                positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
                positions[i3 + 2] = r * Math.cos(phi);
                const col = c1.clone().lerp(c2, Math.random());
                colors[i3] = col.r; colors[i3 + 1] = col.g; colors[i3 + 2] = col.b;
            }
            
            const pGeo = new THREE.BufferGeometry();
            pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            pGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
            this.particles = new THREE.Points(pGeo, new THREE.PointsMaterial({
                size: 0.08,
                vertexColors: true,
                transparent: true,
                opacity: 0.9,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            }));
            this.group.add(this.particles);
        }
        
        update(t, d) {
            if (this.mainMesh) {
                this.mainMesh.rotation.x = t * 0.3;
                this.mainMesh.rotation.y = t * 0.4;
            }
            if (this.innerMesh) {
                this.innerMesh.rotation.x = -t * 0.2;
                this.innerMesh.rotation.y = -t * 0.3;
            }
            
            this.dots.forEach(dot => {
                dot.scale.setScalar(1 + Math.sin(t * 3 + dot.userData.phase) * 0.4);
            });
            
            if (this.particles) {
                this.particles.rotation.y = t * 0.2;
                this.particles.rotation.x = t * 0.1;
            }
            
            this.group.rotation.y += (this.mouse.x * 0.5 - this.group.rotation.y * 0.1) * 0.02;
            this.group.rotation.x += (this.mouse.y * 0.3 - this.group.rotation.x * 0.1) * 0.02;
        }
    }
    
    // ==========================================================
    // ESCENA: GLOBE
    // ==========================================================
    class GlobeScene extends BaseScene {
        createContent() {
            const radius = 2.5;
            
            const sphereGeo = new THREE.SphereGeometry(radius, 32, 24);
            this.globe = new THREE.Mesh(sphereGeo, new THREE.MeshBasicMaterial({
                color: 0x00a8ff,
                wireframe: true,
                transparent: true,
                opacity: 0.15
            }));
            this.scene.add(this.globe);
            
            // Ciudades
            const count = U.isMobile() ? 60 : 150;
            const positions = new Float32Array(count * 3);
            const colors = new Float32Array(count * 3);
            const c1 = new THREE.Color(0x00ffcc);
            const c2 = new THREE.Color(0xffffff);
            
            for (let i = 0; i < count; i++) {
                const i3 = i * 3;
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.acos(Math.random() * 2 - 1);
                positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
                positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
                positions[i3 + 2] = radius * Math.cos(phi);
                const col = c1.clone().lerp(c2, Math.random());
                colors[i3] = col.r; colors[i3 + 1] = col.g; colors[i3 + 2] = col.b;
            }
            
            const cityGeo = new THREE.BufferGeometry();
            cityGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            cityGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
            this.cityPoints = new THREE.Points(cityGeo, new THREE.PointsMaterial({
                size: 0.08,
                vertexColors: true,
                transparent: true,
                opacity: 0.9,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            }));
            this.scene.add(this.cityPoints);
            
            // Órbitas
            this.orbits = [];
            [0x00a8ff, 0x00ffcc, 0x0080ff].forEach((color, i) => {
                const points = [];
                const segments = 64;
                const r = radius * (1.2 + i * 0.15);
                for (let j = 0; j <= segments; j++) {
                    const angle = (j / segments) * Math.PI * 2;
                    points.push(new THREE.Vector3(
                        Math.cos(angle) * r,
                        Math.sin(angle) * r * 0.2,
                        Math.sin(angle) * r
                    ));
                }
                const orbitGeo = new THREE.BufferGeometry().setFromPoints(points);
                const orbit = new THREE.Line(orbitGeo, new THREE.LineBasicMaterial({
                    color,
                    transparent: true,
                    opacity: 0.4,
                    blending: THREE.AdditiveBlending
                }));
                orbit.rotation.x = (i - 1) * 0.5;
                orbit.rotation.z = (i - 1) * 0.3;
                this.scene.add(orbit);
                this.orbits.push(orbit);
            });
        }
        
        update(t, d) {
            this.globe.rotation.y += d * 0.15;
            this.cityPoints.rotation.y = this.globe.rotation.y;
            this.orbits.forEach((o, i) => o.rotation.y += d * (0.3 + i * 0.1));
            this.globe.rotation.x = this.mouse.y * 0.2;
            this.cityPoints.rotation.x = this.mouse.y * 0.2;
        }
    }
    
    // ==========================================================
    // ESCENA: SATURN
    // ==========================================================
    class SaturnScene extends BaseScene {
        createContent() {
            this.group = new THREE.Group();
            this.scene.add(this.group);
            
            this.planet = new THREE.Mesh(
                new THREE.IcosahedronGeometry(1.6, 1),
                new THREE.MeshStandardMaterial({
                    color: 0x0055b3,
                    emissive: 0x00a8ff,
                    emissiveIntensity: 0.3,
                    metalness: 0.7,
                    roughness: 0.3,
                    flatShading: true
                })
            );
            this.group.add(this.planet);
            
            this.planetWire = new THREE.Mesh(
                new THREE.IcosahedronGeometry(1.62, 1),
                new THREE.MeshBasicMaterial({
                    color: 0x00ffcc,
                    wireframe: true,
                    transparent: true,
                    opacity: 0.4
                })
            );
            this.group.add(this.planetWire);
            
            this.ring = new THREE.Mesh(
                new THREE.TorusGeometry(2.4, 0.08, 16, 100),
                new THREE.MeshBasicMaterial({ color: 0x00ffcc, transparent: true, opacity: 0.7 })
            );
            this.ring.rotation.x = Math.PI / 2.2;
            this.ring.rotation.z = 0.3;
            this.group.add(this.ring);
            
            this.ring2 = new THREE.Mesh(
                new THREE.TorusGeometry(2.7, 0.04, 16, 100),
                new THREE.MeshBasicMaterial({ color: 0x00a8ff, transparent: true, opacity: 0.5 })
            );
            this.ring2.rotation.x = Math.PI / 2.2;
            this.ring2.rotation.z = 0.3;
            this.group.add(this.ring2);
        }
        
        update(t, d) {
            this.planet.rotation.y += d * 0.3;
            this.planetWire.rotation.y = this.planet.rotation.y;
            this.ring.rotation.z += d * 0.15;
            this.ring2.rotation.z -= d * 0.1;
            this.planet.position.y = Math.sin(t) * 0.1;
            this.planetWire.position.y = this.planet.position.y;
        }
    }
    
    // ==========================================================
    // ESCENA: DATA CUBE
    // ==========================================================
    class DataCubeScene extends BaseScene {
        createContent() {
            this.group = new THREE.Group();
            this.scene.add(this.group);
            
            this.cube = new THREE.Mesh(
                new THREE.BoxGeometry(2.4, 2.4, 2.4),
                new THREE.MeshBasicMaterial({
                    color: 0x00a8ff,
                    wireframe: true,
                    transparent: true,
                    opacity: 0.8
                })
            );
            this.group.add(this.cube);
            
            this.innerCube = new THREE.Mesh(
                new THREE.BoxGeometry(1.6, 1.6, 1.6),
                new THREE.MeshStandardMaterial({
                    color: 0x0055b3,
                    emissive: 0x00a8ff,
                    emissiveIntensity: 0.5,
                    metalness: 0.9,
                    roughness: 0.1,
                    transparent: true,
                    opacity: 0.4
                })
            );
            this.group.add(this.innerCube);
            
            // Vértices
            const positions = this.cube.geometry.attributes.position.array;
            const seen = new Set();
            const dotGeo = new THREE.SphereGeometry(0.1, 8, 8);
            this.vertexDots = [];
            
            for (let i = 0; i < positions.length; i += 3) {
                const key = `${positions[i].toFixed(2)},${positions[i+1].toFixed(2)},${positions[i+2].toFixed(2)}`;
                if (seen.has(key)) continue;
                seen.add(key);
                
                const dot = new THREE.Mesh(dotGeo.clone(), new THREE.MeshBasicMaterial({ color: 0x00ffcc }));
                dot.position.set(positions[i], positions[i+1], positions[i+2]);
                dot.userData.phase = Math.random() * Math.PI * 2;
                this.group.add(dot);
                this.vertexDots.push(dot);
            }
            
            // Cubos orbitando
            this.orbiters = [];
            for (let i = 0; i < 3; i++) {
                const orb = new THREE.Mesh(
                    new THREE.BoxGeometry(0.25, 0.25, 0.25),
                    new THREE.MeshStandardMaterial({
                        color: 0x00ffcc,
                        emissive: 0x00ffcc,
                        emissiveIntensity: 0.8
                    })
                );
                orb.userData = { angle: (i / 3) * Math.PI * 2, radius: 3, speed: 0.5 + i * 0.2 };
                this.group.add(orb);
                this.orbiters.push(orb);
            }
        }
        
        update(t, d) {
            this.cube.rotation.x += d * 0.3;
            this.cube.rotation.y += d * 0.4;
            this.innerCube.rotation.x = -this.cube.rotation.x * 0.7;
            this.innerCube.rotation.y = -this.cube.rotation.y * 0.7;
            
            this.vertexDots.forEach(dot => {
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
        }
    }
    
    // ==========================================================
    // ESCENA: DIAMOND
    // ==========================================================
    class DiamondScene extends BaseScene {
        createContent() {
            this.group = new THREE.Group();
            this.scene.add(this.group);
            
            this.gem = new THREE.Mesh(
                new THREE.OctahedronGeometry(1.4, 0),
                new THREE.MeshStandardMaterial({
                    color: 0x00a8ff,
                    emissive: 0x00a8ff,
                    emissiveIntensity: 0.5,
                    metalness: 1,
                    roughness: 0,
                    flatShading: true,
                    transparent: true,
                    opacity: 0.85
                })
            );
            this.gem.scale.set(1, 1.4, 1);
            this.group.add(this.gem);
            
            this.wire = new THREE.Mesh(
                new THREE.OctahedronGeometry(1.45, 0),
                new THREE.MeshBasicMaterial({
                    color: 0x00ffcc,
                    wireframe: true,
                    transparent: true,
                    opacity: 0.9
                })
            );
            this.wire.scale.set(1, 1.4, 1);
            this.group.add(this.wire);
        }
        
        update(t, d) {
            this.gem.rotation.y += d * 0.6;
            this.wire.rotation.y = this.gem.rotation.y;
            this.gem.position.y = Math.sin(t) * 0.15;
            this.wire.position.y = this.gem.position.y;
        }
    }
    
    // ==========================================================
    // ESCENA: WORMHOLE
    // ==========================================================
    class WormholeScene extends BaseScene {
        createContent() {
            this.rings = [];
            const ringCount = U.isMobile() ? 15 : 30;
            
            for (let i = 0; i < ringCount; i++) {
                const ring = new THREE.Mesh(
                    new THREE.TorusGeometry(1.2, 0.02, 8, 60),
                    new THREE.MeshBasicMaterial({
                        color: i % 3 === 0 ? 0x00ffcc : 0x00a8ff,
                        transparent: true,
                        opacity: 0.6 - (i / ringCount) * 0.5
                    })
                );
                ring.position.z = -i * 0.5;
                this.scene.add(ring);
                this.rings.push(ring);
            }
            
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
            this.points = new THREE.Points(geo, new THREE.PointsMaterial({
                color: 0x00ffcc,
                size: 0.05,
                transparent: true,
                opacity: 0.9,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            }));
            this.scene.add(this.points);
        }
        
        update(t, d) {
            this.rings.forEach(ring => {
                ring.position.z += d * 3;
                ring.rotation.z += d * 0.5;
                if (ring.position.z > 3) ring.position.z = -14;
            });
            
            this.points.rotation.z += d * 0.3;
            const positions = this.points.geometry.attributes.position.array;
            for (let i = 2; i < positions.length; i += 3) {
                positions[i] += d * 4;
                if (positions[i] > 3) positions[i] = -15;
            }
            this.points.geometry.attributes.position.needsUpdate = true;
        }
    }
    
    // ==========================================================
    // ESCENA: STAR
    // ==========================================================
    class StarScene extends BaseScene {
        createContent() {
            this.group = new THREE.Group();
            this.scene.add(this.group);
            
            this.star = new THREE.Mesh(
                new THREE.OctahedronGeometry(1.5, 0),
                new THREE.MeshStandardMaterial({
                    color: 0x00a8ff,
                    emissive: 0x00a8ff,
                    emissiveIntensity: 0.6,
                    metalness: 0.9,
                    roughness: 0.1,
                    flatShading: true
                })
            );
            this.group.add(this.star);
            
            this.wire = new THREE.Mesh(
                new THREE.OctahedronGeometry(1.6, 0),
                new THREE.MeshBasicMaterial({
                    color: 0x00ffcc,
                    wireframe: true,
                    transparent: true,
                    opacity: 0.5
                })
            );
            this.group.add(this.wire);
            
            this.halo = new THREE.Mesh(
                new THREE.SphereGeometry(2.2, 32, 32),
                new THREE.MeshBasicMaterial({
                    color: 0x00a8ff,
                    wireframe: true,
                    transparent: true,
                    opacity: 0.08
                })
            );
            this.group.add(this.halo);
            
            this.rays = [];
            for (let i = 0; i < 8; i++) {
                const ray = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.02, 0.02, 3, 6),
                    new THREE.MeshBasicMaterial({ color: 0x00ffcc, transparent: true, opacity: 0.4 })
                );
                const angle = (i / 8) * Math.PI * 2;
                ray.position.set(Math.cos(angle) * 1.8, Math.sin(angle) * 1.8, 0);
                ray.rotation.z = angle - Math.PI / 2;
                this.group.add(ray);
                this.rays.push(ray);
            }
        }
        
        update(t, d) {
            this.star.rotation.x += d * 0.4;
            this.star.rotation.y += d * 0.6;
            this.wire.rotation.x = -this.star.rotation.x * 0.5;
            this.wire.rotation.y = -this.star.rotation.y * 0.5;
            this.halo.rotation.y += d * 0.1;
            
            this.star.scale.setScalar(1 + Math.sin(t * 2) * 0.08);
            this.rays.forEach((ray, i) => {
                ray.scale.y = 1 + Math.sin(t * 3 + i) * 0.3;
            });
        }
    }
    
    // ==========================================================
    // ESCENA: QUANTUM WAVES
    // ==========================================================
    class QuantumWavesScene extends BaseScene {
        createContent() {
            const size = 20;
            const segments = U.isMobile() ? 20 : 30;
            const geo = new THREE.PlaneGeometry(size, size, segments, segments);
            
            this.grid = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
                color: 0x00a8ff,
                wireframe: true,
                transparent: true,
                opacity: 0.5
            }));
            this.grid.rotation.x = -Math.PI / 2;
            this.scene.add(this.grid);
            
            this.camera.position.set(0, 3, 5);
            this.camera.lookAt(0, 0, 0);
        }
        
        update(t, d) {
            const positions = this.grid.geometry.attributes.position.array;
            for (let i = 0; i < positions.length; i += 3) {
                const x = positions[i];
                const y = positions[i + 1];
                positions[i + 2] = Math.sin(x * 0.5 + t) * Math.cos(y * 0.5 + t) * 0.5;
            }
            this.grid.geometry.attributes.position.needsUpdate = true;
        }
    }
    
    // ==========================================================
    // ESCENA: HELIX (ADN)
    // ==========================================================
    class HelixScene extends BaseScene {
        createContent() {
            this.group = new THREE.Group();
            this.scene.add(this.group);
            
            const points = 20;
            const turns = 3;
            const step = 0.4;
            const radius = 1.2;
            
            this.strand1 = [];
            this.strand2 = [];
            
            for (let i = 0; i < points * turns; i++) {
                const y = (i - points * turns / 2) * step;
                const angle = (i / points) * Math.PI * 2;
                
                const n1 = new THREE.Mesh(
                    new THREE.SphereGeometry(0.14, 12, 12),
                    new THREE.MeshStandardMaterial({
                        color: 0x00a8ff,
                        emissive: 0x00a8ff,
                        emissiveIntensity: 0.8
                    })
                );
                n1.position.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
                this.group.add(n1);
                this.strand1.push(n1);
                
                const n2 = new THREE.Mesh(
                    new THREE.SphereGeometry(0.14, 12, 12),
                    new THREE.MeshStandardMaterial({
                        color: 0x00ffcc,
                        emissive: 0x00ffcc,
                        emissiveIntensity: 0.8
                    })
                );
                n2.position.set(Math.cos(angle + Math.PI) * radius, y, Math.sin(angle + Math.PI) * radius);
                this.group.add(n2);
                this.strand2.push(n2);
            }
        }
        
        update(t, d) {
            this.group.rotation.y += d * 0.6;
            this.strand1.forEach((n, i) => n.scale.setScalar(1 + Math.sin(t * 3 + i * 0.3) * 0.3));
            this.strand2.forEach((n, i) => n.scale.setScalar(1 + Math.sin(t * 3 + i * 0.3 + Math.PI) * 0.3));
        }
    }
    
    // ==========================================================
    // ESCENA: HEART
    // ==========================================================
    class HeartScene extends BaseScene {
        createContent() {
            const count = U.isMobile() ? 300 : 800;
            const positions = new Float32Array(count * 3);
            const colors = new Float32Array(count * 3);
            const c1 = new THREE.Color(0x00a8ff);
            const c2 = new THREE.Color(0x00ffcc);
            
            for (let i = 0; i < count; i++) {
                const i3 = i * 3;
                const t = Math.random() * Math.PI * 2;
                const rand = Math.pow(Math.random(), 0.5);
                
                const x = 16 * Math.pow(Math.sin(t), 3);
                const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
                
                positions[i3] = (x / 16) * 2.2 * rand;
                positions[i3 + 1] = (y / 16) * 2.2 * rand;
                positions[i3 + 2] = (Math.random() - 0.5) * 0.8 * rand;
                
                const col = c1.clone().lerp(c2, Math.random());
                colors[i3] = col.r; colors[i3 + 1] = col.g; colors[i3 + 2] = col.b;
            }
            
            const geo = new THREE.BufferGeometry();
            geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
            
            this.points = new THREE.Points(geo, new THREE.PointsMaterial({
                size: 0.08,
                vertexColors: true,
                transparent: true,
                opacity: 0.9,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            }));
            this.scene.add(this.points);
        }
        
        update(t, d) {
            this.points.rotation.y += d * 0.3;
            this.points.scale.setScalar(1 + Math.sin(t * 2) * 0.05);
        }
    }
    
    // ==========================================================
    // REGISTRO ÚNICO
    // ==========================================================
    const SCENES = {
        'neural': NeuralScene,
        'hand': HandScene,
        'globe': GlobeScene,
        'saturn': SaturnScene,
        'data-cube': DataCubeScene,
        'diamond': DiamondScene,
        'wormhole': WormholeScene,
        'star': StarScene,
        'quantum-waves': QuantumWavesScene,
        'helix': HelixScene,
        'heart': HeartScene,
        'floating-icosahedron': (el, o) => new FloatingScene(el, { ...o, geometry: 'icosahedron', color: 0x00a8ff }),
        'floating-torus':       (el, o) => new FloatingScene(el, { ...o, geometry: 'torus', color: 0x00ffcc }),
        'floating-torus-knot':  (el, o) => new FloatingScene(el, { ...o, geometry: 'torusKnot', color: 0x0080ff }),
        'floating-octahedron':  (el, o) => new FloatingScene(el, { ...o, geometry: 'octahedron', color: 0x00a8ff }),
        'floating-dodecahedron':(el, o) => new FloatingScene(el, { ...o, geometry: 'dodecahedron', color: 0x00ffcc })
    };
    
    // ==========================================================
    // MOUNT ALL
    // ==========================================================
    function mountAll() {
        const containers = S.$$('[data-3d-scene]');
        
        containers.forEach(el => {
            if (el.dataset.sceneMounted === '1') return;
            
            const type = el.dataset.sceneType || 'neural';
            const Factory = SCENES[type];
            
            if (!Factory) {
                console.warn('[SENIX 3D] Escena no encontrada:', type);
                return;
            }
            
            el.dataset.sceneMounted = '1';
            
            const opts = {
                fov: parseFloat(el.dataset.sceneFov) || 60,
                cameraZ: parseFloat(el.dataset.sceneCameraZ) || 8
            };
            
            try {
                if (typeof Factory === 'function' && Factory.prototype instanceof BaseScene) {
                    new Factory(el, opts);
                } else {
                    Factory(el, opts);
                }
            } catch (e) {
                console.error('[SENIX 3D] Error creando escena', type, e);
            }
        });
    }
    
    // ==========================================================
    // INIT
    // ==========================================================
    async function init() {
        await ensureThreeJS();
        
        if (typeof THREE === 'undefined') {
            console.warn('[SENIX 3D] Three.js no disponible');
            return;
        }
        
        setTimeout(mountAll, 200);
    }
    
    // Export
    S.scenes3d = {
        init,
        mountAll,
        SCENES,
        BaseScene
    };
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})(window);
/**
 * ==========================================================
 * SENIX v2.0 — Custom 3D Scenes
 * Escenas Three.js profesionales hechas a medida
 * Reemplaza todos los Splines
 * ==========================================================
 */

(function (window) {
    'use strict';
    
    if (!window.Senix) return;
    const S = window.Senix;
    
    // ==========================================================
    // UTILIDADES
    // ==========================================================
    const Utils = {
        isMobile: () => window.innerWidth <= 768,
        isLowEnd: () => navigator.hardwareConcurrency <= 4,
        
        lerp: (a, b, t) => a + (b - a) * t,
        
        random: (min, max) => Math.random() * (max - min) + min,
        
        // Genera esfera con puntos distribuidos (Fibonacci)
        fibonacciSphere(numPoints, radius = 1) {
            const points = [];
            const phi = Math.PI * (3 - Math.sqrt(5));
            
            for (let i = 0; i < numPoints; i++) {
                const y = 1 - (i / (numPoints - 1)) * 2;
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
    // CARGAR THREE.JS
    // ==========================================================
    let threeLoaded = false;
    let threePromise = null;
    
    function ensureThreeJS() {
        if (threeLoaded || typeof THREE !== 'undefined') {
            threeLoaded = true;
            return Promise.resolve();
        }
        
        if (threePromise) return threePromise;
        
        threePromise = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
            script.onload = () => {
                threeLoaded = true;
                resolve();
            };
            script.onerror = () => {
                // Fallback
                const script2 = document.createElement('script');
                script2.src = 'https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.min.js';
                script2.onload = () => {
                    threeLoaded = true;
                    resolve();
                };
                script2.onerror = () => reject(new Error('Three.js no se pudo cargar'));
                document.head.appendChild(script2);
            };
            document.head.appendChild(script);
        });
        
        return threePromise;
    }
    
    // ==========================================================
    // BASE SCENE CLASS
    // ==========================================================
    class BaseScene {
        constructor(container, options = {}) {
            this.container = container;
            this.options = options;
            this.animationId = null;
            this.isVisible = false;
            this.clock = null;
            this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
            
            this.init();
        }
        
        init() {
            const rect = this.container.getBoundingClientRect();
            const width = rect.width || 800;
            const height = rect.height || 600;
            
            // Scene
            this.scene = new THREE.Scene();
            this.scene.fog = new THREE.FogExp2(this.options.bgColor || 0x030710, 0.08);
            
            // Camera
            this.camera = new THREE.PerspectiveCamera(
                this.options.fov || 60,
                width / height,
                0.1,
                1000
            );
            this.camera.position.z = this.options.cameraZ || 8;
            
            // Renderer
            this.renderer = new THREE.WebGLRenderer({
                alpha: true,
                antialias: !Utils.isMobile(),
                powerPreference: 'high-performance'
            });
            this.renderer.setSize(width, height);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, Utils.isMobile() ? 1.5 : 2));
            this.renderer.setClearColor(0x000000, 0);
            
            // Append canvas
            this.container.innerHTML = '';
            this.container.appendChild(this.renderer.domElement);
            this.renderer.domElement.style.display = 'block';
            this.renderer.domElement.style.width = '100%';
            this.renderer.domElement.style.height = '100%';
            
            // Lights
            this.setupLights();
            
            // Content
            this.createContent();
            
            // Events
            this.setupEvents();
            
            // Clock
            this.clock = new THREE.Clock();
        }
        
        setupLights() {
            // Ambient
            const ambient = new THREE.AmbientLight(0x00a8ff, 0.3);
            this.scene.add(ambient);
            
            // Directional
            const dirLight = new THREE.DirectionalLight(0x00a8ff, 1);
            dirLight.position.set(5, 5, 5);
            this.scene.add(dirLight);
            
            // Secondary
            const dirLight2 = new THREE.DirectionalLight(0x00ffcc, 0.5);
            dirLight2.position.set(-5, -5, 3);
            this.scene.add(dirLight2);
            
            // Point light cyan
            const pointLight = new THREE.PointLight(0x00ffcc, 1, 20);
            pointLight.position.set(0, 0, 5);
            this.scene.add(pointLight);
        }
        
        createContent() {
            // Override
        }
        
        setupEvents() {
            // Mouse move
            this.onMouseMove = (e) => {
                const rect = this.container.getBoundingClientRect();
                this.mouse.targetX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
                this.mouse.targetY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
            };
            
            window.addEventListener('mousemove', this.onMouseMove, { passive: true });
            
            // Resize
            this.onResize = S.debounce(() => {
                if (!this.container || !this.renderer) return;
                
                const rect = this.container.getBoundingClientRect();
                const width = rect.width || 800;
                const height = rect.height || 600;
                
                this.camera.aspect = width / height;
                this.camera.updateProjectionMatrix();
                this.renderer.setSize(width, height);
            }, 200);
            
            window.addEventListener('resize', this.onResize, { passive: true });
            
            // Visibility
            this.observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    this.isVisible = entry.isIntersecting;
                    if (this.isVisible && !this.animationId) {
                        this.animate();
                    }
                });
            }, { rootMargin: '150px' });
            
            this.observer.observe(this.container);
        }
        
        animate() {
            if (!this.isVisible) {
                this.animationId = null;
                return;
            }
            
            this.animationId = requestAnimationFrame(() => this.animate());
            
            const elapsed = this.clock.getElapsedTime();
            const delta = this.clock.getDelta();
            
            // Smooth mouse
            this.mouse.x = Utils.lerp(this.mouse.x, this.mouse.targetX, 0.05);
            this.mouse.y = Utils.lerp(this.mouse.y, this.mouse.targetY, 0.05);
            
            this.update(elapsed, delta);
            
            this.renderer.render(this.scene, this.camera);
        }
        
        update(elapsed, delta) {
            // Override
        }
        
        destroy() {
            if (this.animationId) {
                cancelAnimationFrame(this.animationId);
                this.animationId = null;
            }
            
            if (this.observer) this.observer.disconnect();
            
            window.removeEventListener('mousemove', this.onMouseMove);
            window.removeEventListener('resize', this.onResize);
            
            // Dispose
            this.scene.traverse((obj) => {
                if (obj.geometry) obj.geometry.dispose();
                if (obj.material) {
                    if (Array.isArray(obj.material)) {
                        obj.material.forEach(m => m.dispose());
                    } else {
                        obj.material.dispose();
                    }
                }
            });
            
            if (this.renderer) {
                this.renderer.dispose();
                if (this.renderer.domElement && this.renderer.domElement.parentNode) {
                    this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
                }
            }
        }
    }
    
    // ==========================================================
    // ESCENA 1: NEURAL NETWORK (Hero)
    // ==========================================================
    class NeuralNetworkScene extends BaseScene {
        createContent() {
            const isMobile = Utils.isMobile();
            const nodeCount = isMobile ? 40 : 80;
            const radius = 4;
            
            // Nodos (esferas)
            this.nodes = [];
            const nodePositions = Utils.fibonacciSphere(nodeCount, radius);
            
            const nodeGeometry = new THREE.SphereGeometry(0.08, 12, 12);
            
            nodePositions.forEach((pos, i) => {
                const color = Math.random() > 0.5 ? 0x00a8ff : 0x00ffcc;
                const material = new THREE.MeshBasicMaterial({
                    color: color,
                    transparent: true,
                    opacity: 0.9
                });
                
                const node = new THREE.Mesh(nodeGeometry, material);
                node.position.set(pos.x, pos.y, pos.z);
                node.userData = {
                    basePos: { ...pos },
                    phase: Math.random() * Math.PI * 2,
                    speed: Utils.random(0.5, 1.5)
                };
                
                this.scene.add(node);
                this.nodes.push(node);
            });
            
            // Conexiones (líneas entre nodos cercanos)
            const connectionDistance = 1.8;
            const positions = [];
            
            for (let i = 0; i < this.nodes.length; i++) {
                for (let j = i + 1; j < this.nodes.length; j++) {
                    const a = this.nodes[i].position;
                    const b = this.nodes[j].position;
                    const dist = a.distanceTo(b);
                    
                    if (dist < connectionDistance) {
                        positions.push(a.x, a.y, a.z, b.x, b.y, b.z);
                    }
                }
            }
            
            this.linesGeometry = new THREE.BufferGeometry();
            this.linesGeometry.setAttribute('position',
                new THREE.Float32BufferAttribute(positions, 3)
            );
            
            this.linesMaterial = new THREE.LineBasicMaterial({
                color: 0x00a8ff,
                transparent: true,
                opacity: 0.15,
                blending: THREE.AdditiveBlending
            });
            
            this.lines = new THREE.LineSegments(this.linesGeometry, this.linesMaterial);
            this.scene.add(this.lines);
            
            // Partículas de fondo
            this.createAmbientParticles();
            
            // Group para rotar todo
            this.group = new THREE.Group();
            this.nodes.forEach(n => {
                this.scene.remove(n);
                this.group.add(n);
            });
            this.scene.add(this.group);
            this.group.add(this.lines);
            
            this.group.rotation.x = 0.2;
        }
        
        createAmbientParticles() {
            const count = Utils.isMobile() ? 200 : 600;
            const positions = new Float32Array(count * 3);
            const colors = new Float32Array(count * 3);
            
            const color1 = new THREE.Color(0x00a8ff);
            const color2 = new THREE.Color(0x00ffcc);
            
            for (let i = 0; i < count; i++) {
                const i3 = i * 3;
                const r = 8 + Math.random() * 12;
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.acos(Math.random() * 2 - 1);
                
                positions[i3] = r * Math.sin(phi) * Math.cos(theta);
                positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
                positions[i3 + 2] = r * Math.cos(phi);
                
                const mix = Math.random();
                const col = color1.clone().lerp(color2, mix);
                colors[i3] = col.r;
                colors[i3 + 1] = col.g;
                colors[i3 + 2] = col.b;
            }
            
            this.ambientGeometry = new THREE.BufferGeometry();
            this.ambientGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            this.ambientGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
            
            this.ambientMaterial = new THREE.PointsMaterial({
                size: 0.05,
                vertexColors: true,
                transparent: true,
                opacity: 0.7,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            });
            
            this.ambientPoints = new THREE.Points(this.ambientGeometry, this.ambientMaterial);
            this.scene.add(this.ambientPoints);
        }
        
        update(elapsed, delta) {
            // Rotar grupo
            this.group.rotation.y += delta * 0.15;
            this.group.rotation.x += (this.mouse.y * 0.3 - this.group.rotation.x) * 0.05;
            
            // Ajustar rotación por mouse
            this.group.rotation.y += this.mouse.x * 0.005;
            
            // Animar nodos
            this.nodes.forEach((node, i) => {
                const phase = node.userData.phase;
                const speed = node.userData.speed;
                const base = node.userData.basePos;
                
                node.position.x = base.x + Math.sin(elapsed * speed + phase) * 0.1;
                node.position.y = base.y + Math.cos(elapsed * speed + phase) * 0.1;
                node.position.z = base.z + Math.sin(elapsed * speed * 0.5 + phase) * 0.1;
            });
            
            // Pulse lines
            this.linesMaterial.opacity = 0.15 + Math.sin(elapsed * 2) * 0.05;
            
            // Ambient particles rotation
            if (this.ambientPoints) {
                this.ambientPoints.rotation.y += delta * 0.02;
                this.ambientPoints.rotation.x += delta * 0.01;
            }
            
            // Camera subtle follow mouse
            this.camera.position.x += (this.mouse.x * 1 - this.camera.position.x) * 0.02;
            this.camera.position.y += (this.mouse.y * 1 - this.camera.position.y) * 0.02;
            this.camera.lookAt(0, 0, 0);
        }
    }
    
    // ==========================================================
    // ESCENA 2: HAND TRACKING (Demo)
    // ==========================================================
    class HandTrackingScene extends BaseScene {
        createContent() {
            this.group = new THREE.Group();
            this.scene.add(this.group);
            
            // Crear mano estilizada con esferas (21 puntos)
            this.points = [];
            
            // Posiciones de los 21 puntos de una mano (simuladas, vista frontal)
            // Formato: [x, y, z]
            const handPoints = [
                // Muñeca (0)
                [0, -2.5, 0],
                // Pulgar (1-4)
                [-0.8, -1.8, 0.2], [-1.3, -1.2, 0.3], [-1.6, -0.6, 0.3], [-1.7, -0.1, 0.3],
                // Índice (5-8)
                [-0.5, -1.5, 0.1], [-0.5, -0.8, 0.1], [-0.5, -0.2, 0.1], [-0.5, 0.3, 0.1],
                // Medio (9-12)
                [0, -1.5, 0.2], [0, -0.7, 0.2], [0, 0, 0.2], [0, 0.5, 0.2],
                // Anular (13-16)
                [0.5, -1.5, 0.1], [0.5, -0.8, 0.1], [0.5, -0.2, 0.1], [0.5, 0.3, 0.1],
                // Meñique (17-20)
                [1, -1.6, 0], [1, -1, 0], [1, -0.5, 0], [1, 0, 0]
            ];
            
            // Conexiones (huesos)
            const bones = [
                [0, 1], [1, 2], [2, 3], [3, 4],       // Pulgar
                [0, 5], [5, 6], [6, 7], [7, 8],       // Índice
                [0, 9], [9, 10], [10, 11], [11, 12],  // Medio
                [0, 13], [13, 14], [14, 15], [15, 16],// Anular
                [0, 17], [17, 18], [18, 19], [19, 20] // Meñique
            ];
            
            // Crear puntos (esferas)
            const pointGeo = new THREE.SphereGeometry(0.12, 16, 16);
            const pointMat = new THREE.MeshBasicMaterial({ color: 0x00ffcc });
            
            handPoints.forEach((pos, i) => {
                const mesh = new THREE.Mesh(pointGeo.clone(), pointMat.clone());
                mesh.position.set(pos[0], pos[1], pos[2]);
                mesh.userData = {
                    basePos: { x: pos[0], y: pos[1], z: pos[2] },
                    phase: Math.random() * Math.PI * 2,
                    isTip: [4, 8, 12, 16, 20].includes(i)
                };
                
                if (mesh.userData.isTip) {
                    mesh.material.color.setHex(0x00a8ff);
                    mesh.scale.setScalar(1.3);
                }
                
                this.group.add(mesh);
                this.points.push(mesh);
            });
            
            // Crear líneas (huesos)
            const lineGeo = new THREE.BufferGeometry();
            const linePositions = [];
            
            bones.forEach(([a, b]) => {
                const pa = handPoints[a];
                const pb = handPoints[b];
                linePositions.push(pa[0], pa[1], pa[2], pb[0], pb[1], pb[2]);
            });
            
            lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
            
            const lineMat = new THREE.LineBasicMaterial({
                color: 0x00a8ff,
                transparent: true,
                opacity: 0.8,
                linewidth: 2
            });
            
            this.bones = new THREE.LineSegments(lineGeo, lineMat);
            this.group.add(this.bones);
            
            // Partículas alrededor (efecto scan)
            this.createScanParticles();
            
            // Grid holográfico debajo
            this.createHolographicGrid();
            
            this.group.scale.setScalar(1.2);
        }
        
        createScanParticles() {
            const count = 100;
            const positions = new Float32Array(count * 3);
            this.scanParticles = [];
            
            const geo = new THREE.BufferGeometry();
            
            for (let i = 0; i < count; i++) {
                const i3 = i * 3;
                positions[i3] = Utils.random(-3, 3);
                positions[i3 + 1] = Utils.random(-3, 3);
                positions[i3 + 2] = Utils.random(-3, 3);
            }
            
            geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            
            const mat = new THREE.PointsMaterial({
                color: 0x00ffcc,
                size: 0.05,
                transparent: true,
                opacity: 0.6,
                blending: THREE.AdditiveBlending
            });
            
            this.scanPoints = new THREE.Points(geo, mat);
            this.group.add(this.scanPoints);
        }
        
        createHolographicGrid() {
            const grid = new THREE.GridHelper(10, 20, 0x00a8ff, 0x003d5c);
            grid.position.y = -3;
            grid.material.transparent = true;
            grid.material.opacity = 0.3;
            this.group.add(grid);
        }
        
        update(elapsed, delta) {
            // Rotar grupo
            this.group.rotation.y = Math.sin(elapsed * 0.3) * 0.3 + this.mouse.x * 0.5;
            this.group.rotation.x = Math.cos(elapsed * 0.2) * 0.1 + this.mouse.y * 0.3;
            
            // Animar puntos
            this.points.forEach((p, i) => {
                const base = p.userData.basePos;
                const phase = p.userData.phase;
                
                p.position.x = base.x + Math.sin(elapsed * 2 + phase) * 0.05;
                p.position.y = base.y + Math.cos(elapsed * 1.5 + phase) * 0.05;
                p.position.z = base.z + Math.sin(elapsed * 3 + phase) * 0.05;
                
                // Pulse en las puntas
                if (p.userData.isTip) {
                    const scale = 1.3 + Math.sin(elapsed * 4 + i) * 0.3;
                    p.scale.setScalar(scale);
                }
            });
            
            // Scan particles
            if (this.scanPoints) {
                this.scanPoints.rotation.y += delta * 0.2;
                const positions = this.scanPoints.geometry.attributes.position.array;
                
                for (let i = 0; i < positions.length; i += 3) {
                    positions[i + 1] += delta * 0.5;
                    if (positions[i + 1] > 3) positions[i + 1] = -3;
                }
                this.scanPoints.geometry.attributes.position.needsUpdate = true;
            }
            
            // Bones pulse
            if (this.bones.material) {
                this.bones.material.opacity = 0.6 + Math.sin(elapsed * 3) * 0.2;
            }
        }
    }
    
    // ==========================================================
    // ESCENA 3: FLOATING GEOMETRIES (Features)
    // ==========================================================
    class FloatingGeometryScene extends BaseScene {
        constructor(container, options = {}) {
            super(container, options);
            this.geometryType = options.geometry || 'icosahedron';
            this.primaryColor = options.color || 0x00a8ff;
        }
        
        createContent() {
            this.group = new THREE.Group();
            this.scene.add(this.group);
            
            // Objeto principal
            let geo;
            switch (this.geometryType) {
                case 'torus':
                    geo = new THREE.TorusGeometry(1.5, 0.4, 32, 100);
                    break;
                case 'icosahedron':
                    geo = new THREE.IcosahedronGeometry(1.8, 0);
                    break;
                case 'octahedron':
                    geo = new THREE.OctahedronGeometry(1.8, 0);
                    break;
                case 'dodecahedron':
                    geo = new THREE.DodecahedronGeometry(1.8, 0);
                    break;
                case 'torusKnot':
                    geo = new THREE.TorusKnotGeometry(1.3, 0.35, 128, 16);
                    break;
                default:
                    geo = new THREE.IcosahedronGeometry(1.8, 0);
            }
            
            // Material wireframe + glow
            const mat = new THREE.MeshBasicMaterial({
                color: this.primaryColor,
                wireframe: true,
                transparent: true,
                opacity: 0.7
            });
            
            this.mainMesh = new THREE.Mesh(geo, mat);
            this.group.add(this.mainMesh);
            
            // Inner solid
            const innerGeo = geo.clone();
            const innerMat = new THREE.MeshBasicMaterial({
                color: this.primaryColor,
                transparent: true,
                opacity: 0.1
            });
            this.innerMesh = new THREE.Mesh(innerGeo, innerMat);
            this.innerMesh.scale.setScalar(0.95);
            this.group.add(this.innerMesh);
            
            // Vertices glowing
            this.createVertexGlow(geo);
            
            // Partículas alrededor
            this.createOrbitParticles();
        }
        
        createVertexGlow(geo) {
            const positionAttr = geo.attributes.position;
            if (!positionAttr) return;
            
            const positions = positionAttr.array;
            const uniqueVerts = [];
            const seen = new Set();
            
            for (let i = 0; i < positions.length; i += 3) {
                const x = positions[i].toFixed(2);
                const y = positions[i + 1].toFixed(2);
                const z = positions[i + 2].toFixed(2);
                const key = `${x},${y},${z}`;
                
                if (!seen.has(key)) {
                    seen.add(key);
                    uniqueVerts.push([positions[i], positions[i + 1], positions[i + 2]]);
                }
            }
            
            const vertexGeo = new THREE.SphereGeometry(0.06, 8, 8);
            const vertexMat = new THREE.MeshBasicMaterial({ color: 0x00ffcc });
            
            this.vertexPoints = [];
            
            uniqueVerts.forEach(pos => {
                const dot = new THREE.Mesh(vertexGeo.clone(), vertexMat.clone());
                dot.position.set(pos[0], pos[1], pos[2]);
                dot.userData = { phase: Math.random() * Math.PI * 2 };
                this.group.add(dot);
                this.vertexPoints.push(dot);
            });
        }
        
        createOrbitParticles() {
            const count = Utils.isMobile() ? 30 : 60;
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
            
            this.particles = new THREE.Points(geo, mat);
            this.group.add(this.particles);
        }
        
        update(elapsed, delta) {
            // Rotación continua
            if (this.mainMesh) {
                this.mainMesh.rotation.x = elapsed * 0.3;
                this.mainMesh.rotation.y = elapsed * 0.4;
            }
            
            if (this.innerMesh) {
                this.innerMesh.rotation.x = -elapsed * 0.2;
                this.innerMesh.rotation.y = -elapsed * 0.3;
            }
            
            // Vertex dots pulse
            this.vertexPoints.forEach((dot, i) => {
                const phase = dot.userData.phase;
                dot.scale.setScalar(1 + Math.sin(elapsed * 3 + phase) * 0.4);
            });
            
            // Particles orbit
            if (this.particles) {
                this.particles.rotation.y = elapsed * 0.2;
                this.particles.rotation.x = elapsed * 0.1;
            }
            
            // Mouse influence
            this.group.rotation.y += (this.mouse.x * 0.5 - this.group.rotation.y * 0.1) * 0.02;
            this.group.rotation.x += (this.mouse.y * 0.3 - this.group.rotation.x * 0.1) * 0.02;
        }
    }
    
    // ==========================================================
    // ESCENA 4: WIREFRAME GLOBE (CTA)
    // ==========================================================
    class WireframeGlobeScene extends BaseScene {
        createContent() {
            const radius = 2.5;
            
            // Esfera wireframe
            const sphereGeo = new THREE.SphereGeometry(radius, 32, 24);
            const sphereMat = new THREE.MeshBasicMaterial({
                color: 0x00a8ff,
                wireframe: true,
                transparent: true,
                opacity: 0.15
            });
            
            this.globe = new THREE.Mesh(sphereGeo, sphereMat);
            this.scene.add(this.globe);
            
            // Puntos en la superficie (ciudades)
            this.createCityPoints(radius);
            
            // Aros orbitales
            this.createOrbits(radius);
            
            // Partículas estelares
            this.createStars();
        }
        
        createCityPoints(radius) {
            const count = Utils.isMobile() ? 60 : 150;
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
            
            this.cityPoints = new THREE.Points(geo, mat);
            this.scene.add(this.cityPoints);
        }
        
        createOrbits(radius) {
            this.orbits = [];
            
            const colors = [0x00a8ff, 0x00ffcc, 0x0080ff];
            
            colors.forEach((color, i) => {
                const points = [];
                const segments = 64;
                const r = radius * (1.2 + i * 0.15);
                const tilt = (i - 1) * 0.5;
                
                for (let j = 0; j <= segments; j++) {
                    const angle = (j / segments) * Math.PI * 2;
                    const x = Math.cos(angle) * r;
                    const y = Math.sin(angle) * r * 0.2;
                    const z = Math.sin(angle) * r;
                    
                    points.push(new THREE.Vector3(x, y, z));
                }
                
                const geo = new THREE.BufferGeometry().setFromPoints(points);
                const mat = new THREE.LineBasicMaterial({
                    color: color,
                    transparent: true,
                    opacity: 0.4,
                    blending: THREE.AdditiveBlending
                });
                
                const orbit = new THREE.Line(geo, mat);
                orbit.rotation.x = tilt;
                orbit.rotation.z = tilt * 0.5;
                
                this.scene.add(orbit);
                this.orbits.push(orbit);
            });
        }
        
        createStars() {
            const count = Utils.isMobile() ? 200 : 500;
            const positions = new Float32Array(count * 3);
            
            for (let i = 0; i < count; i++) {
                const i3 = i * 3;
                const r = 8 + Math.random() * 15;
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.acos(Math.random() * 2 - 1);
                
                positions[i3] = r * Math.sin(phi) * Math.cos(theta);
                positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
                positions[i3 + 2] = r * Math.cos(phi);
            }
            
            const geo = new THREE.BufferGeometry();
            geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            
            const mat = new THREE.PointsMaterial({
                color: 0xffffff,
                size: 0.05,
                transparent: true,
                opacity: 0.6,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            });
            
            this.stars = new THREE.Points(geo, mat);
            this.scene.add(this.stars);
        }
        
        update(elapsed, delta) {
            // Rotar globo
            this.globe.rotation.y += delta * 0.15;
            this.cityPoints.rotation.y = this.globe.rotation.y;
            
            // Rotar órbitas
            this.orbits.forEach((orbit, i) => {
                orbit.rotation.y += delta * (0.3 + i * 0.1);
            });
            
            // Stars slow rotation
            if (this.stars) {
                this.stars.rotation.y += delta * 0.01;
            }
            
            // Mouse tilt
            this.globe.rotation.x = this.mouse.y * 0.2;
            this.cityPoints.rotation.x = this.mouse.y * 0.2;
        }
    }
    
    // ==========================================================
    // REGISTRO DE ESCENAS
    // ==========================================================
    const SCENES = {
        'neural': NeuralNetworkScene,
        'hand': HandTrackingScene,
        'floating-icosahedron': (el, opts) => new FloatingGeometryScene(el, { ...opts, geometry: 'icosahedron', color: 0x00a8ff }),
        'floating-torus': (el, opts) => new FloatingGeometryScene(el, { ...opts, geometry: 'torus', color: 0x00ffcc }),
        'floating-torus-knot': (el, opts) => new FloatingGeometryScene(el, { ...opts, geometry: 'torusKnot', color: 0x0080ff }),
        'floating-octahedron': (el, opts) => new FloatingGeometryScene(el, { ...opts, geometry: 'octahedron', color: 0x00a8ff }),
        'floating-dodecahedron': (el, opts) => new FloatingGeometryScene(el, { ...opts, geometry: 'dodecahedron', color: 0x00ffcc }),
        'globe': WireframeGlobeScene
    };
    
    // ==========================================================
    // MANAGER
    // ==========================================================
    class SceneManager {
        constructor() {
            this.scenes = new Map();
            this.instances = [];
        }
        
        async init() {
            try {
                await ensureThreeJS();
                this.mountAll();
            } catch (err) {
                S.warn('Three.js no disponible:', err.message);
                this.showFallbacks();
            }
        }
        
        mountAll() {
            const containers = S.$$('[data-3d-scene]');
            
            containers.forEach(el => {
                const sceneType = el.dataset.sceneType || 'neural';
                const opts = {
                    fov: parseFloat(el.dataset.sceneFov) || 60,
                    cameraZ: parseFloat(el.dataset.sceneCameraZ) || 8,
                    bgColor: 0x030710
                };
                
                const factory = SCENES[sceneType];
                if (!factory) {
                    S.warn('Escena no encontrada:', sceneType);
                    return;
                }
                
                try {
                    const instance = typeof factory === 'function' && factory.prototype instanceof BaseScene
                        ? new factory(el, opts)
                        : factory(el, opts);
                    
                    this.scenes.set(el, instance);
                    this.instances.push(instance);
                } catch (e) {
                    S.error('Error creando escena:', sceneType, e);
                }
            });
            
            S.log('Escenas 3D montadas:', this.instances.length);
        }
        
        showFallbacks() {
            S.$$('[data-3d-scene]').forEach(el => {
                el.classList.add('senix-3d-fallback');
                el.innerHTML = '<div class="senix-3d-fallback-icon">◇</div>';
            });
        }
        
        destroy() {
            this.instances.forEach(i => i.destroy());
            this.instances = [];
            this.scenes.clear();
        }
    }
    
    // ==========================================================
    // EXPORT
    // ==========================================================
    const manager = new SceneManager();
    
    S.scenes3d = {
        init: () => manager.init(),
        destroy: () => manager.destroy(),
        manager,
        BaseScene,
        SCENES
    };
    
    // Auto init cuando el core esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => manager.init());
    } else {
        manager.init();
    }
    
})(window);
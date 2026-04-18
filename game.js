import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

class MazeGame {
    constructor() {
        // dimensiuni labirint
        this.mazeWidth = 25;
        this.mazeHeight = 25;
        this.wallSize = 2.5;
        this.wallHeight = 4.0;
        this.maxLight = 60;
        
        
        this.isLevelComplete = false;
        this.isPathActive = false;
        this.keys = { 
            w: false, 
            a: false, 
            s: false, 
            d: false 
        };
        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        this.prevTime = performance.now();
        this.walls = [];
        this.mazeMap = [];

        // pozitie obiect de cautat
        this.targetRow = 0;
        this.targetCol = 0;

        // elementele de ui
        this.ui = {
            instructions: document.getElementById('instructions'),
            distance: document.getElementById('distVal'),
            power: document.getElementById('powerVal'),
            levelComplete: document.getElementById('levelComplete')
        };

        // variabile pt radar
        this.radarCanvas = document.getElementById('radarCanvas');
        this.ctx = this.radarCanvas ? this.radarCanvas.getContext('2d') : null;
        this.radarSweepRadius = 0;
        this.radarActiveTimer = 0; 
        this.targetRevealTimer = 0;

        this.initScene();
        this.buildMaze();
        this.setupControls();
        
        this.animate = this.animate.bind(this);
        this.animate();
    }

    initScene() {
        this.scene = new THREE.Scene(); // 
        this.scene.fog = new THREE.FogExp2(0x000000, 0.15);

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
        
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        this.scene.add(new THREE.AmbientLight(0x050510));

        this.spotLight = new THREE.SpotLight(0x00ffcc, this.maxLight, 12, Math.PI / 6, 0.5, 2);
        this.spotLight.position.set(0, 0, 0);
        this.camera.add(this.spotLight);
        this.camera.add(this.spotLight.target);
        this.spotLight.target.position.set(0, 0, -1);
        this.scene.add(this.camera);

        this.pathGroup = new THREE.Group();
        this.scene.add(this.pathGroup);
        
        this.raycaster = new THREE.Raycaster();

        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    generateMazeLogic(width, height) {
        width = width % 2 === 0 ? width + 1 : width;
        height = height % 2 === 0 ? height + 1 : height;

        const maze = Array(height).fill().map(() => Array(width).fill(1));
        const dirs = [ [0, -2], [0, 2], [-2, 0], [2, 0] ];
        
        const carve = (x, y) => {
            maze[y][x] = 0;
            dirs.sort(() => Math.random() - 0.5);
            for(let [dx, dy] of dirs) {
                let nx = x + dx, ny = y + dy;
                if (ny > 0 && ny < height - 1 && nx > 0 && nx < width - 1 && maze[ny][nx] === 1) {
                    maze[y + dy / 2][x + dx / 2] = 0;
                    carve(nx, ny);
                }
            }
        };
        carve(1, 1);

        const loopFactor = 0.08;
        for(let r = 1; r < height - 1; r++) {
            for(let c = 1; c < width - 1; c++) {
                if(maze[r][c] === 1 && Math.random() < loopFactor) {
                    if ((maze[r-1][c] === 0 && maze[r+1][c] === 0) || (maze[r][c-1] === 0 && maze[r][c+1] === 0)) {
                        maze[r][c] = 0;
                    }
                }
            }
        }

        maze[1][1] = 2; // Player Start

        // NEW: Random Target Placement
        const validSpots = [];
        for (let r = 1; r < height - 1; r++) {
            for (let c = 1; c < width - 1; c++) {
                // Ensure it spawns on an open floor AND is far away from the player start (1,1)
                if (maze[r][c] === 0 && (r + c > 15)) {
                    validSpots.push({ r, c });
                }
            }
        }

        if (validSpots.length > 0) {
            const randomSpot = validSpots[Math.floor(Math.random() * validSpots.length)];
            this.targetRow = randomSpot.r;
            this.targetCol = randomSpot.c;
            maze[this.targetRow][this.targetCol] = 3;
        } else {
            // Fallback just in case
            this.targetRow = height - 2;
            this.targetCol = width - 2;
            maze[this.targetRow][this.targetCol] = 3; 
        }

        return maze;
    }

    buildMaze() {
        this.mazeMap = this.generateMazeLogic(this.mazeWidth, this.mazeHeight);
        
        const wallGeo = new THREE.BoxGeometry(this.wallSize, this.wallHeight, this.wallSize);
        const wallMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 });
        const floorMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a });
        const floorGeo = new THREE.PlaneGeometry(this.wallSize, this.wallSize);

        for (let r = 0; r < this.mazeMap.length; r++) {
            for(let c = 0; c < this.mazeMap[r].length; c++) {
                const type = this.mazeMap[r][c];
                const px = (c - this.mazeMap[r].length / 2) * this.wallSize;
                const pz = (r - this.mazeMap.length / 2) * this.wallSize;

                const floor = new THREE.Mesh(floorGeo, floorMat);
                floor.rotation.x = -Math.PI / 2;
                floor.position.set(px, 0, pz);
                this.scene.add(floor);
            
                if (type === 1) {
                    const wall = new THREE.Mesh(wallGeo, wallMat);
                    wall.position.set(px, this.wallHeight / 2, pz);
                    this.scene.add(wall);
                    this.walls.push(wall);
                } else if(type === 2) {
                    this.camera.position.set(px, 1.6, pz);
                } else if(type === 3) {
                    const targetGeo = new THREE.OctahedronGeometry(0.3);
                    const targetMat = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xff3300, emissiveIntensity: 2 });
                    this.targetMesh = new THREE.Mesh(targetGeo, targetMat);
                    this.targetMesh.position.set(px, 1.5, pz);
                    this.scene.add(this.targetMesh);
                }
            }
        }
    }

    setupControls() {
        this.controls = new PointerLockControls(this.camera, document.body);

        this.ui.instructions.addEventListener('click', () => this.controls.lock());
        
        this.controls.addEventListener('lock', () => {
            this.ui.instructions.style.display = 'none';
            if (this.radarCanvas) this.radarCanvas.style.display = 'block';
        });
        
        this.controls.addEventListener('unlock', () => {
            this.ui.instructions.style.display = 'flex';
            if (this.radarCanvas) this.radarCanvas.style.display = 'none';
        });

        document.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            if(this.keys.hasOwnProperty(key)) this.keys[key] = true;

            if(e.code === 'Space' && this.controls.isLocked && !this.isPathActive && this.spotLight.intensity > 0) {
                this.triggerPathfinder();
            }
        });

        document.addEventListener('keyup', (e) => {
            const key = e.key.toLowerCase();
            if(this.keys.hasOwnProperty(key)) this.keys[key] = false;
        });
    }

    triggerPathfinder() {
        this.isPathActive = true;
        this.spotLight.intensity = Math.max(0, this.spotLight.intensity - 15);
        this.ui.power.innerText = Math.round((this.spotLight.intensity / this.maxLight) * 100);

        this.radarActiveTimer = 6.0;
        this.radarSweepRadius = 0;
        this.targetRevealTimer = 0;

        const pCol = Math.round(this.camera.position.x / this.wallSize + this.mazeWidth / 2);
        const pRow = Math.round(this.camera.position.z / this.wallSize + this.mazeHeight / 2);

        // NEW: Send the random target coordinates to the pathfinder
        const path = this.getShortestPath(pRow, pCol, this.targetRow, this.targetCol);

        this.pathGroup.clear();
        const pointMat = new THREE.MeshBasicMaterial({ color: 0x00ffcc });
        const pointGeo = new THREE.SphereGeometry(0.15);

        path.forEach(p => {
            const px = (p.column - this.mazeWidth / 2) * this.wallSize;
            const pz = (p.row - this.mazeHeight / 2) * this.wallSize;
            const point = new THREE.Mesh(pointGeo, pointMat);
            point.position.set(px, 0.2, pz);
            this.pathGroup.add(point);
        });

        setTimeout(() => {
            this.pathGroup.clear();
            this.isPathActive = false;
        }, 6000);
    }

    getShortestPath(startRow, startCol, endRow, endCol) {
        const queue = [[startRow, startCol]];
        const cameFrom = new Map();
        cameFrom.set(`${startRow},${startCol}`, null);
        
        while (queue.length > 0) {
            const [row, col] = queue.shift();
            if (row === endRow && col === endCol) break;

            const dirs = [[0, 1], [1, 0], [0, -1], [-1, 0]];
            for(let [dr, dc] of dirs) {
                const nr = row + dr, nc = col + dc;
                if (nr >= 0 && nr < this.mazeHeight && nc >= 0 && nc < this.mazeWidth && this.mazeMap[nr][nc] !== 1) {
                    const key = `${nr},${nc}`;
                    if (!cameFrom.has(key)) {
                        cameFrom.set(key, `${row},${col}`);
                        queue.push([nr, nc]);
                    }
                }
            }
        }

        let current = `${endRow},${endCol}`;
        const path = [];
        while (current !== null && current !== "undefined,undefined") {
            const [row, column] = current.split(',').map(Number);
            path.push({row, column});
            current = cameFrom.get(current);
        }
        return path.reverse();
    }

    drawRadar(delta) {
        if (!this.ctx) return;
        const w = this.radarCanvas.width;
        const h = this.radarCanvas.height;
        const cellSize = w / this.mazeWidth;
        
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, w, h);

        if (this.radarActiveTimer > 0) {
            this.radarActiveTimer -= delta;

            const pCol = this.camera.position.x / this.wallSize + this.mazeWidth / 2;
            const pRow = this.camera.position.z / this.wallSize + this.mazeHeight / 2;
            
            this.radarSweepRadius += 25 * delta;

            this.ctx.save();
            
            const maxMapRadius = 6;
            const currentClip = Math.min(this.radarSweepRadius, maxMapRadius);

            this.ctx.beginPath();
            this.ctx.arc(pCol * cellSize, pRow * cellSize, currentClip * cellSize, 0, Math.PI * 2);
            this.ctx.clip(); 

            this.ctx.fillStyle = 'rgba(0, 255, 204, 0.4)';
            for (let r = 0; r < this.mazeHeight; r++) {
                for (let c = 0; c < this.mazeWidth; c++) {
                    if (this.mazeMap[r][c] === 1) {
                        this.ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
                    }
                }
            }

            const fog = this.ctx.createRadialGradient(
                pCol * cellSize, pRow * cellSize, 2 * cellSize, 
                pCol * cellSize, pRow * cellSize, maxMapRadius * cellSize
            );
            fog.addColorStop(0, 'rgba(0,0,0,0)');
            fog.addColorStop(1, 'rgba(0,0,0,1)');
            
            this.ctx.fillStyle = fog;
            this.ctx.fillRect(0, 0, w, h);

            this.ctx.restore();

            if (this.radarSweepRadius < this.mazeWidth * 1.5) {
                this.ctx.strokeStyle = '#00ffcc';
                this.ctx.lineWidth = 1.5;
                this.ctx.beginPath();
                this.ctx.arc(pCol * cellSize, pRow * cellSize, this.radarSweepRadius * cellSize, 0, Math.PI * 2);
                this.ctx.stroke();
            }

            // NEW: Use random target coordinates for the radar ping
            const distToTarget = Math.sqrt(Math.pow(pCol - this.targetCol, 2) + Math.pow(pRow - this.targetRow, 2));
            if (this.radarSweepRadius >= distToTarget && this.targetRevealTimer <= 0) {
                this.targetRevealTimer = 4.0;
            }

            if (this.targetRevealTimer > 0) {
                this.targetRevealTimer -= delta;
                
                this.ctx.fillStyle = '#ff3300';
                this.ctx.beginPath();
                this.ctx.arc(this.targetCol * cellSize, this.targetRow * cellSize, 4, 0, Math.PI * 2);
                this.ctx.fill();
                
                this.ctx.strokeStyle = '#ff3300';
                this.ctx.beginPath();
                this.ctx.arc(this.targetCol * cellSize, this.targetRow * cellSize, 6 + Math.sin(performance.now() * 0.01) * 2, 0, Math.PI * 2);
                this.ctx.stroke();
            }

            const batteryPercent = this.spotLight.intensity / this.maxLight;
            let showPlayer = true;
            if (batteryPercent < 0.5) { 
                showPlayer = Math.random() < (batteryPercent * 2); 
            }
            if (showPlayer) {
                this.ctx.fillStyle = '#ffffff';
                this.ctx.beginPath();
                this.ctx.arc(pCol * cellSize, pRow * cellSize, 3, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
    }

    animate() {
        if(this.isLevelComplete) return;
        requestAnimationFrame(this.animate);

        const time = performance.now();
        const delta = (time - this.prevTime) / 1000;

        this.drawRadar(delta);

        if (this.controls.isLocked) {
            if (this.targetMesh) {
                this.targetMesh.rotation.y += 1 * delta;
                this.targetMesh.rotation.x += 0.5 * delta;
            }

            const distance = this.camera.position.distanceTo(this.targetMesh.position);
            this.ui.distance.innerText = distance.toFixed(1);

            if (distance < 1.5) {
                this.isLevelComplete = true;
                this.controls.unlock();
                this.ui.levelComplete.style.display = 'flex';
                setTimeout(() => location.reload(), 2000);
                return;
            }

            this.velocity.x -= this.velocity.x * 10.0 * delta;
            this.velocity.z -= this.velocity.z * 10.0 * delta;

            this.direction.z = Number(this.keys.w) - Number(this.keys.s);
            this.direction.x = Number(this.keys.d) - Number(this.keys.a);
            this.direction.normalize();

            const speed = 30.0;
            if(this.keys.w || this.keys.s) this.velocity.z -= this.direction.z * speed * delta;
            if(this.keys.a || this.keys.d) this.velocity.x -= this.direction.x * speed * delta;

            const playerDir = new THREE.Vector3();
            this.camera.getWorldDirection(playerDir);
            playerDir.y = 0;
            playerDir.normalize();

            this.raycaster.set(this.camera.position, playerDir);
            const intersects = this.raycaster.intersectObjects(this.walls);

            if(intersects.length > 0 && intersects[0].distance < 0.6 && this.velocity.z < 0) {
                this.velocity.z = 0;
            }

            this.controls.moveRight(-this.velocity.x * delta);
            this.controls.moveForward(-this.velocity.z * delta);
        }

        this.renderer.render(this.scene, this.camera);
        this.prevTime = time;
    }
}

new MazeGame();
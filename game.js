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
        this.scene = new THREE.Scene(); // creaza scena
        this.scene.fog = new THREE.FogExp2(0x000000, 0.15); // ceata pentru blur

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
        
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true 
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        this.scene.add(new THREE.AmbientLight(0x050510)); // lumina slaba pentru lanterna

        // lanterna
        this.spotLight = new THREE.SpotLight(0x00ffcc, this.maxLight, 12, Math.PI / 6, 0.5, 2);
        this.spotLight.position.set(0, 0, 0);
        this.camera.add(this.spotLight);
        this.camera.add(this.spotLight.target);
        this.spotLight.target.position.set(0, 0, -1);
        this.scene.add(this.camera);

        // pentru a afisa path-ul ca hint
        this.pathGroup = new THREE.Group();
        this.scene.add(this.pathGroup);
        
        // raycaster pentru coliziuni
        this.raycaster = new THREE.Raycaster();

        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    generateMazeLogic(width, height) {
        // vreau dimensiuni impare pentru a avea un labirint simetric
        width = width % 2 === 0 ? width + 1 : width;
        height = height % 2 === 0 ? height + 1 : height;

        const maze = Array(height).fill().map(() => Array(width).fill(1));
        const directions = [ [0, -2], [0, 2], [-2, 0], [2, 0] ];
        
        const carve = (x, y) => {
            maze[y][x] = 0;
            directions.sort(() => Math.random() - 0.5);
            for(let [dx, dy] of directions) {
                let new_x = x + dx, new_y = y + dy;
                if (new_y > 0 && new_y < height - 1 && new_x > 0 && new_x < width - 1 && maze[new_y][new_x] === 1) {
                    maze[y + dy / 2][x + dx / 2] = 0;
                    carve(new_x, new_y);
                }
            }
        };
        carve(1, 1);

        // pt a ingreuna labirintul, adaug niste bucle aleatorii
        const loopFactor = 0.08;
        for(let row = 1; row < height - 1; row++) {
            for(let column = 1; column < width - 1; column++) {
                if(maze[row][column] === 1 && Math.random() < loopFactor) {
                    if ((maze[row-1][column] === 0 && maze[row+1][column] === 0) || (maze[row][column-1] === 0 && maze[row][column+1] === 0)) {
                        maze[row][column] = 0;
                    }
                }
            }
        }

        maze[1][1] = 2; // pozitia de start a jucatorului


        // spawnez un obiect intr-un loc aleatoriu din labirint, cat mai departe de start
        const validSpots = [];
        for (let row = 1; row < height - 1; row++) {
            for (let column = 1; column < width - 1; column++) {
                if (maze[row][column] === 0 && (row + column > 15)) {
                    validSpots.push({ 
                        r: row, 
                        c: column 
                    });
                }
            }
        }

        // daca am locuri valide, aleg unul random pentru target, altfel il pun in coltul opus
        if (validSpots.length > 0) {
            const randomSpot = validSpots[Math.floor(Math.random() * validSpots.length)];
            this.targetRow = randomSpot.r;
            this.targetCol = randomSpot.c;
            maze[this.targetRow][this.targetCol] = 3;
        } 
        else {
            this.targetRow = height - 2;
            this.targetCol = width - 2;
            maze[this.targetRow][this.targetCol] = 3; 
        }

        return maze;
    }

    buildMaze() {
        this.mazeMap = this.generateMazeLogic(this.mazeWidth, this.mazeHeight);
        
        const wallGeometry = new THREE.BoxGeometry(this.wallSize, this.wallHeight, this.wallSize);
        const wallMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x1a1a1a, 
            roughness: 0.9 });
        const floorMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x0a0a0a 
        });
        const floorGeometry = new THREE.PlaneGeometry(this.wallSize, this.wallSize);

        // construiesc scena pe baza matricei generate
        for (let row = 0; row < this.mazeMap.length; row++) {
            for(let column = 0; column < this.mazeMap[row].length; column++) {
                const type = this.mazeMap[row][column];

                // calculez pozitia in spatiu pentru fiecare celula
                const px = (column - this.mazeMap[row].length / 2) * this.wallSize;
                const pz = (row - this.mazeMap.length / 2) * this.wallSize;

                const floor = new THREE.Mesh(floorGeometry, floorMaterial);
                floor.rotation.x = -Math.PI / 2;
                floor.position.set(px, 0, pz);
                this.scene.add(floor);
            
                // tipul 1 = perete, 2 = pozitia de start, 3 = obiectul de gasit
                if (type === 1) {
                    const wall = new THREE.Mesh(wallGeometry, wallMaterial);
                    wall.position.set(px, this.wallHeight / 2, pz);
                    this.scene.add(wall);
                    this.walls.push(wall);
                } 
                else if(type === 2) {
                    this.camera.position.set(px, 1.6, pz);
                } 
                else if(type === 3) {
                    const targetGeometry = new THREE.OctahedronGeometry(0.3);
                    const targetMaterial = new THREE.MeshStandardMaterial({ 
                        color: 0x000000, 
                        emissive: 0xff3300, 
                        emissiveIntensity: 2 
                    });
                    this.targetMesh = new THREE.Mesh(targetGeometry, targetMaterial);
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
            
            if (this.radarCanvas) {
                this.radarCanvas.style.display = 'block';
            }
        });
        
        this.controls.addEventListener('unlock', () => {
            this.ui.instructions.style.display = 'flex';
            
            if (this.radarCanvas) {
                this.radarCanvas.style.display = 'none';
            }
        });

        document.addEventListener('keydown', (event) => {
            const key = event.key.toLowerCase();

            if(this.keys.hasOwnProperty(key)) {
                this.keys[key] = true;
            }

            if(event.code === 'Space' && this.controls.isLocked && !this.isPathActive && this.spotLight.intensity > 0) {
                this.triggerPathfinder();
            }
        });

        document.addEventListener('keyup', (event) => {
            const key = event.key.toLowerCase();
            
            if(this.keys.hasOwnProperty(key)) {
                this.keys[key] = false;
            }
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

        const path = this.getShortestPath(pRow, pCol, this.targetRow, this.targetCol);

        this.pathGroup.clear();
        const pointMat = new THREE.MeshBasicMaterial({ 
            color: 0x00ffcc 
        });
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
        
        // BFS pentru a gasi cel mai scurt drum de la pozitia jucatorului la tinta
        while (queue.length > 0) {
            const [row, col] = queue.shift();
            
            if (row === endRow && col === endCol) {
                break;
            }

            const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];
            for(let [dr, dc] of directions) {
                const new_row = row + dr, new_col = col + dc;

                if (new_row >= 0 && new_row < this.mazeHeight && new_col >= 0 && new_col < this.mazeWidth && this.mazeMap[new_row][new_col] !== 1) {
                    const key = `${new_row},${new_col}`;
                    if (!cameFrom.has(key)) {
                        cameFrom.set(key, `${row},${col}`);
                        queue.push([new_row, new_col]);
                    }
                }
            }
        }

        // reconstruiesc path-ul de la tinta la jucator folosind cameFrom
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
        if (!this.ctx) {
            return;
        }

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
            for (let row = 0; row < this.mazeHeight; row++) {
                for (let col = 0; col < this.mazeWidth; col++) {
                    if (this.mazeMap[row][col] === 1) {
                        this.ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
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
        if(this.isLevelComplete) {
            return;
        }

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
            if(this.keys.w || this.keys.s) {
                this.velocity.z -= this.direction.z * speed * delta;
            }
            if(this.keys.a || this.keys.d) {
                this.velocity.x -= this.direction.x * speed * delta;
            }

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
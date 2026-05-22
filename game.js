import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

class MazeGame {
    constructor() {
        const textureLoader = new THREE.TextureLoader();

        // dimensiuni labirint
        this.mazeWidth = 25;
        this.mazeHeight = 25;
        this.wallSize = 2.5;
        this.wallHeight = 4.0;
        this.maxLight = 100;

        this.mazeObjects = {
            EMPTY: 0,
            WALL: 1,
            START: 2,
            SWITCH: 3,
            ROUTER: 4
        }
        
        
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
        this.walls = []; // pentru coliziuni
        this.mazeMap = []; // matricea care reprezinta labirintul

        // pozitie switch
        const switchTexture = textureLoader.load('switch.png');
        this.switchMaterial = new THREE.SpriteMaterial({
            map: switchTexture,
            transparent: true
        })
        this.switchRow = 0;
        this.switchColumn = 0;
        this.hasTheSwitch = false;
        
        // pozitie router
        const routerTexture = textureLoader.load('router.png');
        this.routerMaterial = new THREE.SpriteMaterial({
            map: routerTexture,
            transparent: true
        })
        this.routerRow = 0;
        this.routerColumn = 0;
        this.hasTheRouter = false;




        // elementele de ui
        this.ui = {
            instructions: document.getElementById('instructions'),
            distance: document.getElementById('distVal'),
            power: document.getElementById('powerVal'),
            levelComplete: document.getElementById('levelComplete'),
            objective: document.getElementById('objective'),
            finishGif: document.getElementById('finishGif')
        };

        this.pd = {
            beepMinBpm: 30,
            beepMaxBpm: 300,
            maxDistance: Math.sqrt(Math.pow(this.mazeWidth, 2) + Math.pow(this.mazeHeight, 2))
        }

        // variabile pt radar
        this.radarCanvas = document.getElementById('radarCanvas');
        this.ctx = this.radarCanvas.getContext('2d');
        this.radarSweepRadius = 0;
        this.radarActiveTimer = 0; 
        this.targetRevealTimer = 0;

        this.animate = this.animate.bind(this);

        // pentru a afisa urmele pasilor jucatorului
        const footprintTexture = textureLoader.load('footprint.png');
        this.footprints = [];
        this.maxFootprints = 25;
        this.lastFootprintPosition = new THREE.Vector3();

        this.footprintGeo = new THREE.PlaneGeometry(0.4, 0.4);
        this.footprintMat = new THREE.MeshBasicMaterial({ 
            map: footprintTexture,
            transparent: true, 
            opacity: 0.2,
            depthWrite: false
        });
    }

    run() {
        this.initScene();
        this.buildMaze();
        this.setupControls();
        this.animate();
    }

    distanceToBpm(distance) {
        const normalized = Math.min(distance / this.pd.maxDistance, 1);
        const bpmRange = this.pd.beepMaxBpm - this.pd.beepMinBpm;
        return this.pd.beepMinBpm + (1 - normalized) * bpmRange;
    }

    initScene() {
        this.scene = new THREE.Scene(); // creaza scena
        this.scene.fog = new THREE.FogExp2(0x000000, 0.15); // ceata pentru blur

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
        
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

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

    dropFootprint() {
        const mark = new THREE.Mesh(this.footprintGeo, this.footprintMat);

        mark.position.set(this.camera.position.x, 0.01, this.camera.position.z);
        mark.rotation.x = -Math.PI / 2;

        const euler = new THREE.Euler(0, 0, 0, 'YXZ');
        euler.setFromQuaternion(this.camera.quaternion);
        mark.rotation.z = euler.y;

        this.scene.add(mark);
        this.footprints.push(mark);

        if (this.footprints.length > this.maxFootprints) {
            const oldMark = this.footprints.shift();
            this.scene.remove(oldMark);
        }
    }

    isValidCell(row, column) {
        return row > 0 && row < this.mazeHeight - 1 && column > 0 && column < this.mazeWidth - 1;
    }

    generateMazeLogic(width, height) {
        width = width % 2 === 0 ? width + 1 : width;
        height = height % 2 === 0 ? height + 1 : height;

        const maze = Array(height).fill().map(() => Array(width).fill(this.mazeObjects.WALL));
        const directions = [ [0, -2], [0, 2], [-2, 0], [2, 0] ];

        // aplic dfs pentru a genera un labirint perfect (fara bucle) 
        // si apoi adaug niste bucle random
        const carve = (x, y) => {
            maze[y][x] = this.mazeObjects.EMPTY;
            directions.sort(() => Math.random() - 0.5); // amestec directiile pentru a avea labirinturi diferite de fiecare data

            for(let [dx, dy] of directions) {
                let new_x = x + dx, new_y = y + dy;
                if (this.isValidCell(new_y, new_x) && maze[new_y][new_x] === this.mazeObjects.WALL) {
                    maze[y + dy / 2][x + dx / 2] = this.mazeObjects.EMPTY;
                    carve(new_x, new_y);
                }
            }
        };

        // generarea initiala a labirintului
        carve(1, 1);

        // adaug niste bucle random
        const loopFactor = 0.08;
        for(let row = 1; row < height - 1; row++) {
            for(let column = 1; column < width - 1; column++) {
                if(maze[row][column] === this.mazeObjects.WALL && Math.random() < loopFactor) {
                    if ((maze[row-1][column] === this.mazeObjects.EMPTY && maze[row+1][column] === this.mazeObjects.EMPTY) || (maze[row][column-1] === this.mazeObjects.EMPTY && maze[row][column+1] === this.mazeObjects.EMPTY)) {
                        maze[row][column] = this.mazeObjects.EMPTY;
                    }
                }
            }
        }

        maze[1][1] = this.mazeObjects.START; // pozitia de start a jucatorului


        // spawnez un obiect intr-un loc random din labirint, cat mai departe de start
        const validSpots = [];
        for (let row = 1; row < height - 1; row++) {
            for (let column = 1; column < width - 1; column++) {
                if (maze[row][column] === this.mazeObjects.EMPTY && row + column > 15) {
                    validSpots.push({ 
                        r: row, 
                        c: column 
                    });
                }
            }
        }

        // aleg random un loc din validSpots pentru a plasa tinta
        const randomSwitchSpot = validSpots[Math.floor(Math.random() * validSpots.length)];
        this.switchRow = randomSwitchSpot.r;
        this.switchColumn = randomSwitchSpot.c;
        maze[this.switchRow][this.switchColumn] = this.mazeObjects.SWITCH;

        const randomRouterSpot = validSpots[Math.floor(Math.random() * validSpots.length)];
        this.routerRow = randomRouterSpot.r;
        this.routerColumn = randomRouterSpot.c;
        maze[this.routerRow][this.routerColumn] = this.mazeObjects.ROUTER

        return maze;
    }

    buildMaze() {
        this.mazeMap = this.generateMazeLogic(this.mazeWidth, this.mazeHeight);
        
        const wallGeometry = new THREE.BoxGeometry(this.wallSize, this.wallHeight, this.wallSize);
        const wallMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x1a1a1a, 
            roughness: 1.2
        });
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
                floor.rotation.x = -Math.PI / 2; // rotire pentru a fi orizontal
                floor.position.set(px, 0, pz);
                this.scene.add(floor);

                switch(type) {
                    case this.mazeObjects.WALL: {
                        const wall = new THREE.Mesh(wallGeometry, wallMaterial);
                        wall.position.set(px, this.wallHeight / 2, pz);
                        this.scene.add(wall);
                        this.walls.push(wall);
                        break;
                    }
                    
                    case this.mazeObjects.START: {
                        this.camera.position.set(px, 1.6, pz);

                        // setez directia initiala a camerei catre un spatiu gol pentru a nu ma uita direct in perete cand incepe jocul
                        if (this.mazeMap[row + 1][column] === this.mazeObjects.EMPTY) {
                            this.camera.lookAt(px, 1.6, pz + this.wallSize);
                        } 
                        else if (this.mazeMap[row][column + 1] === this.mazeObjects.EMPTY) {
                            this.camera.lookAt(px + this.wallSize, 1.6, pz);
                        }
                        break;
                    }

                    case this.mazeObjects.SWITCH: {
                        this.switchMesh = new THREE.Sprite(this.switchMaterial);
                        this.switchMesh.position.set(1.5, 1.5, 1);
                        this.switchMesh.position.set(px, 0.8, pz);
                        this.scene.add(this.switchMesh);
                        break;
                    }

                    case this.mazeObjects.ROUTER: {
                        this.routerMesh = new THREE.Sprite(this.routerMaterial);
                        this.routerMesh.position.set(1.5, 1.5, 1);
                        this.routerMesh.position.set(px, 0.8, pz);
                        this.scene.add(this.routerMesh);
                        break;
                    }

                    default:
                        break;
                }
            }
        }
    }

    setupControls() {
        this.controls = new PointerLockControls(this.camera, document.body);

        this.ui.instructions.addEventListener('click', (event) => {
            const target = event.target;
            if(target.classList.contains('preventEvent')) {
                return;
            }
            this.controls.lock();
        });
        
        this.controls.addEventListener('lock', () => {
            this.ui.instructions.style.display = 'none';
            
            if (this.radarCanvas) {
                this.radarCanvas.style.display = 'block';
            }

            try{
                updateSlider_beep_toggle(1.0);
            }
            catch{}
        });
        
        this.controls.addEventListener('unlock', () => {
            this.ui.instructions.style.display = 'flex';
            
            if (this.radarCanvas) {
                this.radarCanvas.style.display = 'none';
            }
            try{
                updateSlider_beep_toggle(0.0);
            }
            catch{}
        });

        document.addEventListener('keydown', (event) => {
            const key = event.key.toLowerCase();

            if(this.keys.hasOwnProperty(key)) {
                this.keys[key] = true;
            }

            // daca apas space, lanterna are baterie, pathfinder-ul nu e deja activ si player-ul are controlul, atunci activez pathfinder-ul care arata drumul catre tinta pentru cateva secunde
            if(event.code === 'Space' && this.controls.isLocked && !this.isPathActive && this.spotLight.intensity > 20) {

                updateSlider_toggle_bang(1.0);                
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
        this.spotLight.intensity = Math.max(0, this.spotLight.intensity - 10);
        this.ui.power.innerText = Math.round((this.spotLight.intensity / this.maxLight) * 100);

        this.radarActiveTimer = 6.0;
        this.radarSweepRadius = 0;
        this.targetRevealTimer = 0;

        const pCol = Math.round(this.camera.position.x / this.wallSize + this.mazeWidth / 2);
        const pRow = Math.round(this.camera.position.z / this.wallSize + this.mazeHeight / 2);

        let path = [];

        if (!this.hasTheSwitch) {
            path = this.getShortestPath(pRow, pCol, this.switchRow, this.switchColumn);
        }
        else {
            path = this.getShortestPath(pRow, pCol, this.routerRow, this.routerColumn);
        }

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

        // dupa 6 secunde, sterg path-ul si dezactivez pathfinder-ul
        setTimeout(() => {
            this.pathGroup.clear();
            this.isPathActive = false;
        }, 6000);
    }

    getShortestPath(startRow, startCol, endRow, endCol) {
        let queue = [[startRow, startCol]];
        let cameFrom = []
        
        cameFrom[startRow] = [];
        cameFrom[startRow][startCol] = null;
        
        // BFS pentru a gasi cel mai scurt drum de la pozitia jucatorului la tinta
        while (queue.length > 0) {
            const [row, col] = queue.shift();
            
            if (row === endRow && col === endCol) {
                break;
            }

            const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];

            for(let [dr, dc] of directions) {
                const new_row = row + dr;
                const new_col = col + dc;

                if (this.isValidCell(new_row, new_col) && this.mazeMap[new_row][new_col] !== this.mazeObjects.WALL) {
                    
                    if (!cameFrom[new_row]) {
                        cameFrom[new_row] = [];
                    }

                    if (cameFrom[new_row][new_col] === undefined) {
                        queue.push([new_row, new_col]);
                        cameFrom[new_row][new_col] = [row, col];
                    }

                }
            }
        }

        // reconstruiesc path-ul de la tinta la jucator folosind cameFrom
        let current = [endRow, endCol];
        let path = [];

        while (current !== null) {
            const [row, column] = current;
            path.push({row, column});
            current = cameFrom[row][column];
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

            const targetCol = this.hasTheSwitch ? this.routerColumn : this.switchColumn;
            const targetRow = this.hasTheSwitch ? this.routerRow : this.switchRow;

            const distToTarget = Math.sqrt(Math.pow(pCol - targetCol, 2) + Math.pow(pRow - targetRow, 2));
            if (this.radarSweepRadius >= distToTarget && this.targetRevealTimer <= 0) {
                this.targetRevealTimer = 4.0;
            }

            if (this.targetRevealTimer > 0) {
                this.targetRevealTimer -= delta;
                
                this.ctx.fillStyle = '#ff3300';
                this.ctx.beginPath();
                this.ctx.arc(targetCol * cellSize, targetRow * cellSize, 4, 0, Math.PI * 2);
                this.ctx.fill();
                
                this.ctx.strokeStyle = '#ff3300';
                this.ctx.beginPath();
                this.ctx.arc(targetCol * cellSize, targetRow * cellSize, 6 + Math.sin(performance.now() * 0.01) * 2, 0, Math.PI * 2);
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
            const targetPosition = !this.hasTheSwitch ? this.switchMesh.position : this.routerMesh.position;
            const currentDistance = this.camera.position.distanceTo(targetPosition);
            this.ui.distance.innerText = currentDistance.toFixed(1);

            const beepBpm = this.distanceToBpm(currentDistance);
            try {
                updateSlider_beep_bpm(beepBpm);
            } catch {
                // Audio not started
            }

            if (!this.hasTheSwitch) {
                if (currentDistance < 1.5) {
                    this.hasTheSwitch = true;
                    this.scene.remove(this.switchMesh);
                    this.ui.objective.innerText = 'Pasul 2: Gaseste router-ul!';
                    return;
                }
            } 
            else {
                if (currentDistance < 1.5) {
                    this.isLevelComplete = true;
                    this.controls.unlock();
                    this.ui.levelComplete.style.display = 'flex';
                    this.ui.finishGif.style.display = 'block';
                    
                    setTimeout(() => location.reload(), 8000); 
                    return;
                }
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

            // coliziuni

            const directionForward = new THREE.Vector3();
            this.camera.getWorldDirection(directionForward);
            directionForward.y = 0;
            directionForward.normalize();

            // calculez directiile laterale pentru a putea face coliziuni si cand ma misc lateral
            const directionRight = new THREE.Vector3().crossVectors(directionForward, this.camera.up).normalize();
            const directionBackward = directionForward.clone().negate();
            const directionLeft = directionRight.clone().negate();


            const checkIsWall = (direction) => {
                this.raycaster.set(this.camera.position, direction);
                const hits = this.raycaster.intersectObjects(this.walls);
                return hits.length > 0 && hits[0].distance < 1.0;
            }

            // daca am perete in fata si incerc sa merg inainte, opresc miscarea
            if (checkIsWall(directionForward) && this.velocity.z < 0) {
                this.velocity.z = 0;
            }

            // daca am perete in spate si incerc sa merg inapoi, opresc miscarea
            if (checkIsWall(directionBackward) && this.velocity.z > 0) {
                this.velocity.z = 0;
            }

            // daca am perete in dreapta si incerc sa merg spre dreapta, opresc miscarea
            if (checkIsWall(directionRight) && this.velocity.x < 0) {
                this.velocity.x = 0;
            }

            // daca am perete in stanga si incerc sa merg spre stanga, opresc miscarea
            if (checkIsWall(directionLeft) && this.velocity.x > 0) {
                this.velocity.x = 0;
            }

            //////

            this.controls.moveRight(-this.velocity.x * delta);
            this.controls.moveForward(-this.velocity.z * delta);

            if (this.camera.position.distanceTo(this.lastFootprintPosition) > 1.5) {
                this.dropFootprint();
                this.lastFootprintPosition.copy(this.camera.position);
            }

        }

        this.renderer.render(this.scene, this.camera);
        this.prevTime = time;
    }
}

window.onload = () => {
    let game = new MazeGame();
    game.run();
};
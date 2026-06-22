const canvas = document.getElementById('galaxyCanvas');
const ctx = canvas.getContext('2d');

let width, height;

function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// --- CONTROLES DE CÁMARA 3D ---
let yaw = 0; 
let tilt = 1.1; 
let zoom = 1;

let isDragging = false;
let lastX = 0, lastY = 0;
let clickStartX = 0, clickStartY = 0;

// TU BASE DE DATOS EXACTA
const mensajesDatos = {
    "AMOR ETERNO": {
        titulo: "Amor Eterno",
        texto: "Por tanto tiempo que estamos juntos, más te amo.",
        gif: "https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExMjRkMWVjYThkNWJkYmZlM2JjYmUwZGRiM2UzM2M2ZDVmMTFmYzA4YiZlcD12MV9pbnRlcm5hbF9naWZzX2dpZklkJmN0PWc/26BRv0ThflsHCqDrG/giphy.gif"
    },
    "INFINITO ∞": {
        titulo: "Hasta el Infinito",
        texto: "Mi cariño por ti es más grande que el universo.",
        gif: "https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExN3hkZHB3MmZlbW1landwOGxlYzVwcXY3OGhwaGw4NXNteGlwNWFhYSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/7IelwebeyjVU4/giphy.gif"
    },
    "TE QUIERO MUCHO": {
        titulo: "TQM",
        texto: "Eres la casualidad más bonita que me ha pasado.",
        gif: "https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExMWN4dnlneHUwZmJyNW03Nzg1eDlyaHM5MWc5bnc0ajJsZmliMmhzMyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/4asRlBKdJaPeBahjcL/giphy.gif"
    },
    "MY LOVE": {
        titulo: "Me Encantas",
        texto: "Si pudiera elegir un lugar seguro, sería a tu lado.",
        gif: "https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExZXZrNzJpZ3NreWZkemc0NGNzbWt4aWoyNGU2cW5oMGFrY2FhbWpvaCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/gDfteqLchLcRTtjAD7/giphy.gif"
    },
    "💖": {
        titulo: "Mi Corazón",
        texto: "Cada latido es solo para ti.",
        gif: "https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExODY1ZjJzM3R1dGdhYjRtZjZmdDBqc21xajF4bGRyeW9uNjl6cmhiNSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/dsDE6z8Gl4vvNoBlpW/giphy.gif"
    }
};

const words = Object.keys(mensajesDatos); 

// --- ARREGLOS DE OBJETOS 3D ---
const particles = []; 
const stars = []; 
const heartParticles = []; 

// 1. GENERAR EL CORAZÓN LATIENDO
for (let t = 0; t < Math.PI * 2; t += 0.04) {
    let xRaw = 16 * Math.pow(Math.sin(t), 3);
    let yRaw = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    let hScale = 5;
    heartParticles.push({
        baseX: xRaw * hScale, 
        baseY: -(yRaw * hScale) - 60, 
        baseZ: 0,
        angle: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.02 + 0.01,
        size: Math.random() * 2 + 1
    });
}

// 2. FUNCIÓN DE PROYECCIÓN 3D 
function project3D(wx, wy, wz) {
    let rx = wx * Math.cos(yaw) - wz * Math.sin(yaw);
    let rz = wx * Math.sin(yaw) + wz * Math.cos(yaw);
    let ry = wy;

    let px = rx;
    let py = ry * Math.cos(tilt) - rz * Math.sin(tilt);
    let pz = ry * Math.sin(tilt) + rz * Math.cos(tilt);

    let focalLength = 500;
    let scale3d = focalLength / (focalLength + pz);
    if (scale3d < 0) scale3d = 0;

    return {
        x: (width / 2) + px * scale3d * zoom,
        y: (height / 2) + py * scale3d * zoom,
        scale: scale3d * zoom,
        zDepth: pz
    };
}

// 3. CLASE PARA LAS PALABRAS
class Particle {
    constructor() {
        this.angle = Math.random() * Math.PI * 2;
        this.radius = Math.random() * width + 50;
        this.yOffset = (Math.random() - 0.5) * 40; 
        this.word = words[Math.floor(Math.random() * words.length)];
        this.size = Math.random() * 8 + 12;
        
        // Ahora solo el corazón es detectado como Emoji
        this.isEmoji = this.word === "💖";
        
        const hue = 330 + Math.random() * 30; 
        this.color = `hsl(${hue}, 100%, 75%)`;
        
        this.proj = { x: 0, y: 0, scale: 0, zDepth: 0 };
    }
    
    update() {
        this.angularSpeed = 2 / (this.radius + 50); 
        this.angle += this.angularSpeed;
        this.radius -= 0.5; 
        if (this.radius < 20) this.radius = width; 

        let wx = Math.cos(this.angle) * this.radius;
        let wy = this.yOffset;
        let wz = Math.sin(this.angle) * this.radius;

        this.proj = project3D(wx, wy, wz);
    }
    
    draw() {
        if (this.proj.scale <= 0) return;
        const alpha = Math.max(0.1, Math.min(1, this.proj.scale - 0.1));
        ctx.globalAlpha = alpha;

        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.fillStyle = this.color;
        
        // El corazón se dibuja un poco más grande
        let finalSize = this.isEmoji ? this.size * 2 : this.size;
        ctx.font = `bold ${finalSize * this.proj.scale}px Poppins`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle"; 
        ctx.fillText(this.word, this.proj.x, this.proj.y);
        
        ctx.globalAlpha = 1; 
        ctx.shadowBlur = 0;
    }
}

// 4. CLASE PARA EL POLVO ESTELAR 
class Star {
    constructor() {
        const armCount = 3;
        const armIndex = Math.floor(Math.random() * armCount);
        const armOffset = (Math.PI * 2 / armCount) * armIndex;
        const randomSpread = (Math.random() - 0.5) * 1.5;
        
        this.radius = 25 + Math.pow(Math.random(), 2) * (width * 0.8);
        this.angle = armOffset + randomSpread + (this.radius * 0.015); 
        
        this.yOffset = (Math.random() - 0.5) * 15; 
        this.size = Math.random() * 2 + 0.5; 
        
        const hue = Math.random() > 0.5 ? 350 : 340; 
        const light = Math.random() * 50 + 50;
        this.color = `hsl(${hue}, 100%, ${light}%)`;
        
        this.proj = { x: 0, y: 0, scale: 0, zDepth: 0 };
    }

    update() {
        this.angularSpeed = 1.5 / (this.radius + 50); 
        this.angle += this.angularSpeed;
        
        let wx = Math.cos(this.angle) * this.radius;
        let wy = this.yOffset;
        let wz = Math.sin(this.angle) * this.radius;

        this.proj = project3D(wx, wy, wz);
    }

    draw() {
        if (this.proj.scale <= 0) return;
        const alpha = Math.max(0.1, Math.min(0.8, this.proj.scale));
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        
        ctx.beginPath();
        ctx.arc(this.proj.x, this.proj.y, this.size * this.proj.scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

for (let i = 0; i < 120; i++) particles.push(new Particle());
for (let i = 0; i < 1000; i++) stars.push(new Star()); 

// 5. DIBUJAR EL CENTRO 
function drawCenter() {
    ctx.beginPath();
    ctx.ellipse(width/2, height/2, 38 * zoom, Math.max(3, 38 * zoom * Math.cos(tilt)), 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 60, 50, 0.6)";
    ctx.shadowBlur = 40;
    ctx.shadowColor = "#ff2a5f";
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.beginPath();
    ctx.ellipse(width/2, height/2, 25 * zoom, Math.max(2, 25 * zoom * Math.cos(tilt)), 0, 0, Math.PI * 2);
    ctx.fillStyle = "#000";
    ctx.fill();

    const time = Date.now() * 0.004;
    const pulse = 1 + Math.sin(time) * 0.05; 

    ctx.fillStyle = "#ff2a5f";
    heartParticles.forEach(p => {
        p.angle += p.speed;
        let wx = (p.baseX + Math.cos(p.angle) * 2) * pulse;
        let wy = (p.baseY + Math.sin(p.angle) * 2) * pulse;
        let wz = p.baseZ * pulse;

        let proj = project3D(wx, wy, wz);
        if (proj.scale > 0) {
            ctx.beginPath();
            ctx.arc(proj.x, proj.y, p.size * proj.scale, 0, Math.PI * 2);
            ctx.fill();
        }
    });
}

// 6. BUCLE DE ANIMACIÓN MAESTRO
function animate() {
    ctx.fillStyle = "#030005"; 
    ctx.fillRect(0, 0, width, height);

    const allObjects = [...stars, ...particles];
    allObjects.forEach(obj => obj.update());
    
    allObjects.sort((a, b) => b.proj.zDepth - a.proj.zDepth);

    let midIndex = allObjects.findIndex(obj => obj.proj.zDepth <= 0);
    if (midIndex === -1) midIndex = allObjects.length;

    for(let i = 0; i < midIndex; i++) allObjects[i].draw();
    drawCenter();
    for(let i = midIndex; i < allObjects.length; i++) allObjects[i].draw();
    
    requestAnimationFrame(animate);
}

// --- EVENTOS E INTERACCIÓN ---

const modal1 = document.getElementById('modal1');
const startScreen = document.getElementById('startScreen');
const btnIniciar = document.getElementById('btnIniciar');
const btnsCerrar = document.querySelectorAll('.btnCerrar');

let galaxiaIniciada = false;

btnIniciar.addEventListener('click', () => {
    startScreen.classList.remove('active');
    startScreen.classList.add('hidden');
    galaxiaIniciada = true;
    animate(); 
});

canvas.addEventListener('mousedown', (e) => {
    if (!galaxiaIniciada || modal1.classList.contains('active')) return;
    isDragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    clickStartX = e.clientX;
    clickStartY = e.clientY;
    canvas.style.cursor = 'grabbing';
});

window.addEventListener('mouseup', () => {
    isDragging = false;
    if (galaxiaIniciada && !modal1.classList.contains('active')) canvas.style.cursor = 'default';
});

canvas.addEventListener('mousemove', (e) => {
    if (!galaxiaIniciada || modal1.classList.contains('active')) return;
    
    if (isDragging) {
        yaw -= (e.clientX - lastX) * 0.005; 
        tilt -= (e.clientY - lastY) * 0.005; 
        tilt = Math.max(0.1, Math.min(Math.PI / 2, tilt));
        lastX = e.clientX;
        lastY = e.clientY;
        return;
    }

    let tocandoPalabra = false;
    for (let p of particles) {
        if (p.proj.scale <= 0) continue;
        let hitRadius = p.isEmoji ? 35 * p.proj.scale : 15 * p.proj.scale; 
        if (Math.hypot(e.clientX - p.proj.x, e.clientY - p.proj.y) < hitRadius) { 
            tocandoPalabra = true;
            break;
        }
    }
    canvas.style.cursor = tocandoPalabra ? 'pointer' : 'default';
});

canvas.addEventListener('wheel', (e) => {
    if (!galaxiaIniciada || modal1.classList.contains('active')) return;
    zoom += e.deltaY * -0.001;
    zoom = Math.max(0.5, Math.min(zoom, 3)); 
});

let initialPinchDist = null, initialZoom = 1;

canvas.addEventListener('touchstart', (e) => {
    if (!galaxiaIniciada || modal1.classList.contains('active')) return;
    if (e.touches.length === 1) { 
        isDragging = true;
        lastX = e.touches[0].clientX;
        lastY = e.touches[0].clientY;
        clickStartX = e.touches[0].clientX;
        clickStartY = e.touches[0].clientY;
    } else if (e.touches.length === 2) { 
        initialPinchDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
        initialZoom = zoom;
    }
});

canvas.addEventListener('touchmove', (e) => {
    if (!galaxiaIniciada || modal1.classList.contains('active')) return;
    if (e.touches.length === 1 && isDragging) {
        yaw -= (e.touches[0].clientX - lastX) * 0.005;
        tilt -= (e.touches[0].clientY - lastY) * 0.005;
        tilt = Math.max(0.1, Math.min(Math.PI / 2, tilt));
        lastX = e.touches[0].clientX;
        lastY = e.touches[0].clientY;
    } else if (e.touches.length === 2 && initialPinchDist) {
        let currentDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
        zoom = initialZoom * (currentDist / initialPinchDist);
        zoom = Math.max(0.5, Math.min(zoom, 3));
    }
});

canvas.addEventListener('touchend', () => { isDragging = false; initialPinchDist = null; });

canvas.addEventListener('click', (e) => {
    if (!galaxiaIniciada || modal1.classList.contains('active')) return;
    if (Math.hypot(e.clientX - clickStartX, e.clientY - clickStartY) > 5) return; 

    for (let p of particles) {
        if (p.proj.scale <= 0) continue;
        let hitRadius = p.isEmoji ? 35 * p.proj.scale : 15 * p.proj.scale;
        if (Math.hypot(e.clientX - p.proj.x, e.clientY - p.proj.y) < hitRadius) { 
            const infoMensaje = mensajesDatos[p.word];
            document.querySelector('#modal1 h2').innerText = infoMensaje.titulo;
            document.querySelector('#modal1 p').innerText = infoMensaje.texto;
            document.querySelector('#modal1 .gif-img').src = infoMensaje.gif;
            modal1.classList.remove('hidden');
            modal1.classList.add('active');
            canvas.style.cursor = 'default';
            break; 
        }
    }
});

btnsCerrar.forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.target.closest('.modal').classList.remove('active');
        e.target.closest('.modal').classList.add('hidden');
    });
});
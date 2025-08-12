// Variables y referencias
const ContenedorPalabras = document.getElementById('wordContainer');
const startButton = document.getElementById('startButton');
const PalabrasUsuarioElement = document.getElementById('usedLetters');
const canvas = document.getElementById('canvas');
const nivelDisplay = document.getElementById('nivelDisplay');
const puntosDisplay = document.getElementById('puntosDisplay');

let ctx = canvas.getContext('2d');
ctx.canvas.width = 300;
ctx.canvas.height = 160;

// Partes cuerpo para dibujo
const bodyParts = [
    [4, 2, 1, 1],  // cabeza
    [4, 3, 1, 2],  // cuerpo
    [3, 5, 1, 1],  // brazo izquierdo
    [5, 5, 1, 1],  // brazo derecho
    [3, 3, 1, 1],  // pierna izquierda
    [5, 3, 1, 1]   // pierna derecha
];

// Configuración niveles y palabras
const totalNiveles = 10;
// words debe estar definido (array global con palabras)
const palabrasPorCadaNivel = Math.ceil(words.length / totalNiveles);
const palabrasPorNivel = [];
for (let i = 0; i < totalNiveles; i++) {
    palabrasPorNivel.push(words.slice(i * palabrasPorCadaNivel, (i + 1) * palabrasPorCadaNivel));
}

// Estado
let nivel = parseInt(localStorage.getItem('nivel')) || 1;
let puntos = parseInt(localStorage.getItem('puntos')) || 0;
let PalabraSeleccionada = [];
let PalabrasUsuario = [];
let Errores = 0;
let Aciertos = 0;

// Canvas básico
function prepararCanvas() {
    ctx.resetTransform();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.scale(20, 20);
}

// Dibuja horca
function DrawHangMan() {
    prepararCanvas();
    ctx.fillStyle = '#21BB50';
    ctx.fillRect(0, 7, 4, 1);
    ctx.fillRect(1, 0, 1, 8);
    ctx.fillRect(2, 0, 3, 1);
    ctx.fillRect(4, 1, 1, 1);
}

// Dibuja parte del cuerpo
function addBodyPart(part) {
    ctx.fillStyle = '#fff';
    ctx.fillRect(...part);
}

// Selecciona palabra aleatoria nivel
function selectRandomWord(n) {
    const lista = palabrasPorNivel[n - 1];
    const palabra = lista[Math.floor(Math.random() * lista.length)].toUpperCase();
    return palabra.split('');
}

// Dibuja palabra oculta
function drawWord() {
    ContenedorPalabras.innerHTML = '';
    PalabraSeleccionada.forEach(letra => {
        const span = document.createElement('span');
        span.textContent = letra;
        span.classList.add('letter', 'hidden');
        ContenedorPalabras.appendChild(span);
    });
}

// Añade letra usada al contenedor
function addPalabra(letra) {
    const span = document.createElement('span');
    span.textContent = letra.toUpperCase();
    PalabrasUsuarioElement.appendChild(span);
}

// Animación partículas (confeti o sangre)
const particleContainer = document.createElement('div');
particleContainer.style.position = 'absolute';
particleContainer.style.top = '0';
particleContainer.style.left = '0';
particleContainer.style.width = '100%';
particleContainer.style.height = '100%';
particleContainer.style.pointerEvents = 'none';
document.body.appendChild(particleContainer);

function lanzarParticulas(x, y, color, cantidad = 20) {
    for (let i = 0; i < cantidad; i++) {
        const particle = document.createElement('div');
        particle.style.position = 'absolute';
        particle.style.width = '8px';
        particle.style.height = '8px';
        particle.style.background = color;
        particle.style.borderRadius = '50%';
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        particle.style.opacity = 1;
        particle.style.pointerEvents = 'none';
        particleContainer.appendChild(particle);

        const angle = Math.random() * 2 * Math.PI;
        const distance = Math.random() * 100 + 50;
        const dx = Math.cos(angle) * distance;
        const dy = Math.sin(angle) * distance;

        particle.animate([
            { transform: 'translate(0, 0)', opacity: 1 },
            { transform: `translate(${dx}px, ${dy}px)`, opacity: 0 }
        ], {
            duration: 1000 + Math.random() * 500,
            easing: 'ease-out'
        }).onfinish = () => particle.remove();
    }
}

function lanzarSangre() {
    const rect = canvas.getBoundingClientRect();
    lanzarParticulas(rect.left + canvas.width / 2, rect.top + canvas.height / 2, 'red', 30);
}

function lanzarConfeti() {
    const colors = ['#00fff7', '#ff00ff', '#ffff00', '#00ff00', '#ff6600'];
    const rect = canvas.getBoundingClientRect();
    for (let i = 0; i < 30; i++) {
        const color = colors[Math.floor(Math.random() * colors.length)];
        lanzarParticulas(rect.left + canvas.width / 2, rect.top + canvas.height / 2, color, 1);
    }
}

// Animación muñeco caminando al ganar
function caminarMuñeco() {
    const scale = 20;
    let posX = 0;
    const velocidad = 0.05;

    function animar() {
        ctx.resetTransform();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.scale(scale, scale);
        ctx.translate(posX, 0);
        ctx.fillStyle = '#21BB50';
        ctx.fillRect(0, 7, 4, 1);
        ctx.fillRect(1, 0, 1, 8);
        ctx.fillRect(2, 0, 3, 1);
        ctx.fillRect(4, 1, 1, 1);

        ctx.fillStyle = '#fff';
        bodyParts.forEach(part => ctx.fillRect(...part));

        posX += velocidad;
        if (posX < canvas.width / scale) {
            requestAnimationFrame(animar);
        } else {
            prepararCanvas();
            DrawHangMan();
        }
    }
    animar();
}

// Explosión en sangre al perder
function explotarMuñeco() {
    const scale = 20;
    const rect = canvas.getBoundingClientRect();

    bodyParts.forEach(part => {
        const [x, y, w, h] = part;
        const cx = rect.left + (x + w / 2) * scale;
        const cy = rect.top + (y + h / 2) * scale;
        lanzarParticulas(cx, cy, 'red', 40);
    });

    setTimeout(() => {
        prepararCanvas();
        DrawHangMan();
    }, 1000);
}

// Manejo error
function wrongPalabra() {
    addBodyPart(bodyParts[Errores]);
    lanzarSangre();
    Errores++;
    if (Errores === bodyParts.length) {
        document.removeEventListener('keydown', PalabraEvent);
        explotarMuñeco();
        endGame(false);
    }
}

// Manejo acierto
function correctPalabra(letra) {
    const children = ContenedorPalabras.children;
    let acertadoLetra = false;
    for (let i = 0; i < children.length; i++) {
        if (children[i].textContent === letra && children[i].classList.contains('hidden')) {
            children[i].classList.remove('hidden');
            Aciertos++;
            acertadoLetra = true;
        }
    }
    if (acertadoLetra) {
        puntos += 10;
        lanzarConfeti();
        saveProgress();
        updateUI();
    }
    if (Aciertos === PalabraSeleccionada.length) {
        document.removeEventListener('keydown', PalabraEvent);
        caminarMuñeco();
        endGame(true);
    }
}

// Entrada de letra
function PalabraInput(letra) {
    if (PalabraSeleccionada.includes(letra)) {
        correctPalabra(letra);
    } else {
        wrongPalabra();
    }
    addPalabra(letra);
    PalabrasUsuario.push(letra);
}

// Evento teclado
function PalabraEvent(event) {
    let letra = event.key.toUpperCase();
    if (letra.match(/^[A-ZÑ]$/i) && !PalabrasUsuario.includes(letra)) {
        PalabraInput(letra);
    }
}

// Guardar progreso
function saveProgress() {
    localStorage.setItem('nivel', nivel);
    localStorage.setItem('puntos', puntos);
}

// Actualizar UI
function updateUI() {
    if (nivelDisplay) nivelDisplay.textContent = `Nivel: ${nivel}`;
    if (puntosDisplay) puntosDisplay.textContent = `Puntos: ${puntos}`;
}

// Fin de juego
function endGame(won) {
    document.removeEventListener('keydown', PalabraEvent);
    if (won) {
        alert(`¡Felicidades! Has completado el nivel ${nivel}.\nPuntos: ${puntos}`);
        nivel++;
        if (nivel > totalNiveles) {
            alert('¡Ganaste el juego completo! 🎉');
            nivel = 1;
            puntos = 0;
        }
        saveProgress();
        startButton.style.display = 'block';
    } else {
        alert(`¡Juego terminado! La palabra era: ${PalabraSeleccionada.join('')}\nPuntos: ${puntos}`);
        nivel = 1;
        puntos = 0;
        saveProgress(); // <- Importante actualizar localStorage aquí también
        startButton.style.display = 'block';
    }
}


// Iniciar juego
function iniciar() {
    Errores = 0;
    Aciertos = 0;
    PalabrasUsuario = [];
    PalabrasUsuarioElement.innerHTML = '';
    startButton.style.display = 'none';
    DrawHangMan();
    PalabraSeleccionada = selectRandomWord(nivel);
    drawWord();
    updateUI();
    document.addEventListener('keydown', PalabraEvent);
}

startButton.addEventListener('click', iniciar);

// Iniciar UI con datos guardados
updateUI();
DrawHangMan();

const letras = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'.split('');
const teclado = document.getElementById('teclado');

letras.forEach(l => {
    const btn = document.createElement('button');
    btn.textContent = l;
    btn.addEventListener('click', () => PalabraEvent({ key: l }));
    teclado.appendChild(btn);
});

/* ===============================================
   SIMULACIÓN CRT - JAVASCRIPT
   Universidad del Valle de Guatemala
   Laboratorio de Física 3
   =============================================== */

// ===============================================
// CONSTANTES FÍSICAS DEL CRT
// ===============================================
const PHYSICS = {
    // Propiedades del electrón
    electronCharge: -1.602e-19,     // Coulombs
    electronMass: 9.109e-31,        // kg
    
    // Dimensiones del tubo (en metros)
    screenSize: 0.30,               // 30 cm (pantalla cuadrada)
    plateSeparation: 0.02,          // 2 cm (separación entre placas)
    plateArea: 4.0e-4,              // 4 cm² (área de cada placa)
    plateLength: 0.05,              // 5 cm (longitud de las placas)
    
    // Distancias dentro del tubo
    gunToPlates: 0.10,              // 10 cm (cañón a placas)
    platesToScreen: 0.20,           // 20 cm (placas a pantalla)
    
    // Constantes para cálculos
    epsilon0: 8.854e-12             // Permitividad del vacío
};

// ===============================================
// CONFIGURACIÓN DE CANVAS
// ===============================================
const canvases = {
    lateral: document.getElementById('lateralCanvas'),
    superior: document.getElementById('superiorCanvas'),
    screen: document.getElementById('screenCanvas')
};

const contexts = {};

// Inicializar contextos de canvas
for (let key in canvases) {
    if (canvases[key]) {
        contexts[key] = canvases[key].getContext('2d');
    }
}

// ===============================================
// ESTADO GLOBAL DE LA SIMULACIÓN
// ===============================================
let state = {
    // Modo de operación
    mode: 'manual',
    
    // Voltajes aplicados
    voltages: {
        acceleration: 2000,         // Voltaje de aceleración (V)
        vertical: 0,                // Voltaje placas verticales (V)
        horizontal: 0               // Voltaje placas horizontales (V)
    },
    
    // Parámetros para figuras de Lissajous
    lissajous: {
        freqX: 1.0,                // Frecuencia horizontal (Hz)
        freqY: 1.0,                // Frecuencia vertical (Hz)
        phaseX: 0,                 // Fase horizontal (grados)
        phaseY: 0,                 // Fase vertical (grados)
        amplitude: 300             // Amplitud de la señal (V)
    },
    
    // Configuración de display
    display: {
        persistence: 0.95,          // Factor de persistencia (0-1)
        brightness: 1.0             // Factor de brillo
    },
    
    // Variables de animación
    time: 0,                       // Contador de tiempo
    electronTrail: [],             // Array para rastro del electrón
    animationRunning: false,       // Estado de la animación
    isPaused: false,               // Estado de pausa
    
    // Variables de rendimiento
    frameCount: 0,
    lastFpsTime: 0,
    currentFps: 60
};

// Variables de valores por defecto
const DEFAULT_VALUES = {
    voltages: {
        acceleration: 2000,
        vertical: 0,
        horizontal: 0
    },
    lissajous: {
        freqX: 1.0,
        freqY: 1.0,
        phaseX: 0,
        phaseY: 0,
        amplitude: 300
    },
    display: {
        persistence: 0.95,
        brightness: 1.0
    }
};

// ===============================================
// INICIALIZACIÓN DE CONTROLES DE USUARIO
// ===============================================
function initializeControls() {
    console.log('Inicializando controles de usuario...');
    
    // Referencias a elementos de control
    const controls = {
        // Voltajes
        accelVoltage: document.getElementById('accelVoltage'),
        vertVoltage: document.getElementById('vertVoltage'),
        horizVoltage: document.getElementById('horizVoltage'),
        
        // Controles Lissajous
        freqX: document.getElementById('freqX'),
        freqY: document.getElementById('freqY'),
        phaseX: document.getElementById('phaseX'),
        phaseY: document.getElementById('phaseY'),
        amplitude: document.getElementById('amplitude'),
        
        // Visualización
        persistence: document.getElementById('persistence'),
        brightness: document.getElementById('brightness')
    };

    // ===============================================
    // EVENT LISTENERS PARA CONTROLES DE VOLTAJE
    // ===============================================
    controls.accelVoltage.addEventListener('input', (e) => {
        state.voltages.acceleration = parseInt(e.target.value);
        document.getElementById('accelValue').textContent = e.target.value;
        updateSliderBackground(e.target);
    });

    controls.vertVoltage.addEventListener('input', (e) => {
        state.voltages.vertical = parseInt(e.target.value);
        document.getElementById('vertValue').textContent = e.target.value;
        updateSliderBackground(e.target);
    });

    controls.horizVoltage.addEventListener('input', (e) => {
        state.voltages.horizontal = parseInt(e.target.value);
        document.getElementById('horizValue').textContent = e.target.value;
        updateSliderBackground(e.target);
    });

    // ===============================================
    // EVENT LISTENERS PARA CONTROLES LISSAJOUS
    // ===============================================
    controls.freqX.addEventListener('input', (e) => {
        state.lissajous.freqX = parseFloat(e.target.value);
        document.getElementById('freqXValue').textContent = e.target.value;
        updateSliderBackground(e.target);
    });

    controls.freqY.addEventListener('input', (e) => {
        state.lissajous.freqY = parseFloat(e.target.value);
        document.getElementById('freqYValue').textContent = e.target.value;
        updateSliderBackground(e.target);
    });

    controls.phaseX.addEventListener('input', (e) => {
        state.lissajous.phaseX = parseInt(e.target.value);
        document.getElementById('phaseXValue').textContent = e.target.value;
        updateSliderBackground(e.target);
    });

    controls.phaseY.addEventListener('input', (e) => {
        state.lissajous.phaseY = parseInt(e.target.value);
        document.getElementById('phaseYValue').textContent = e.target.value;
        updateSliderBackground(e.target);
    });

    controls.amplitude.addEventListener('input', (e) => {
        state.lissajous.amplitude = parseInt(e.target.value);
        document.getElementById('amplitudeValue').textContent = e.target.value;
        updateSliderBackground(e.target);
    });

    // ===============================================
    // EVENT LISTENERS PARA CONTROLES DE VISUALIZACIÓN
    // ===============================================
    controls.persistence.addEventListener('input', (e) => {
        state.display.persistence = parseFloat(e.target.value);
        document.getElementById('persistenceValue').textContent = e.target.value;
        updateSliderBackground(e.target);
    });

    controls.brightness.addEventListener('input', (e) => {
        state.display.brightness = parseFloat(e.target.value);
        document.getElementById('brightnessValue').textContent = e.target.value;
        updateSliderBackground(e.target);
    });

    // ===============================================
    // BOTONES DE CONTROL DE MODO
    // ===============================================
    document.getElementById('manualMode').addEventListener('click', () => {
        switchMode('manual');
    });

    document.getElementById('lissajousMode').addEventListener('click', () => {
        switchMode('lissajous');
    });

    // ===============================================
    // BOTONES DE CONTROL
    // ===============================================
    document.getElementById('clearScreen').addEventListener('click', () => {
        clearScreen();
    });

    document.getElementById('pausePlay').addEventListener('click', () => {
        togglePause();
    });

    document.getElementById('resetValues').addEventListener('click', () => {
        resetToDefaults();
    });

    // Inicializar fondos de sliders
    initializeSliderBackgrounds();
}

// ===============================================
// FUNCIONES DE INTERFAZ DE USUARIO
// ===============================================
function switchMode(newMode) {
    console.log(`Cambiando modo a: ${newMode}`);
    
    state.mode = newMode;
    
    // Actualizar botones
    const manualBtn = document.getElementById('manualMode');
    const lissajousBtn = document.getElementById('lissajousMode');
    const lissajousControls = document.getElementById('lissajousControls');
    
    if (newMode === 'manual') {
        manualBtn.classList.add('active');
        lissajousBtn.classList.remove('active');
        lissajousControls.style.display = 'none';
    } else {
        lissajousBtn.classList.add('active');
        manualBtn.classList.remove('active');
        lissajousControls.style.display = 'block';
    }
    
    // Limpiar rastro cuando se cambia de modo
    clearScreen();
}

function togglePause() {
    state.isPaused = !state.isPaused;
    const button = document.getElementById('pausePlay');
    const statusText = document.getElementById('statusText');
    
    if (state.isPaused) {
        button.textContent = 'Reanudar';
        statusText.textContent = 'Pausado';
    } else {
        button.textContent = 'Pausar';
        statusText.textContent = 'Funcionando';
        if (!state.animationRunning) {
            startAnimation();
        }
    }
}

function resetToDefaults() {
    // Resetear voltajes
    state.voltages = { ...DEFAULT_VALUES.voltages };
    state.lissajous = { ...DEFAULT_VALUES.lissajous };
    state.display = { ...DEFAULT_VALUES.display };
    
    // Actualizar controles UI
    document.getElementById('accelVoltage').value = DEFAULT_VALUES.voltages.acceleration;
    document.getElementById('accelValue').textContent = DEFAULT_VALUES.voltages.acceleration;
    
    document.getElementById('vertVoltage').value = DEFAULT_VALUES.voltages.vertical;
    document.getElementById('vertValue').textContent = DEFAULT_VALUES.voltages.vertical;
    
    document.getElementById('horizVoltage').value = DEFAULT_VALUES.voltages.horizontal;
    document.getElementById('horizValue').textContent = DEFAULT_VALUES.voltages.horizontal;
    
    // Lissajous
    document.getElementById('freqX').value = DEFAULT_VALUES.lissajous.freqX;
    document.getElementById('freqXValue').textContent = DEFAULT_VALUES.lissajous.freqX;
    
    document.getElementById('freqY').value = DEFAULT_VALUES.lissajous.freqY;
    document.getElementById('freqYValue').textContent = DEFAULT_VALUES.lissajous.freqY;
    
    document.getElementById('phaseX').value = DEFAULT_VALUES.lissajous.phaseX;
    document.getElementById('phaseXValue').textContent = DEFAULT_VALUES.lissajous.phaseX;
    
    document.getElementById('phaseY').value = DEFAULT_VALUES.lissajous.phaseY;
    document.getElementById('phaseYValue').textContent = DEFAULT_VALUES.lissajous.phaseY;
    
    document.getElementById('amplitude').value = DEFAULT_VALUES.lissajous.amplitude;
    document.getElementById('amplitudeValue').textContent = DEFAULT_VALUES.lissajous.amplitude;
    
    // Display
    document.getElementById('persistence').value = DEFAULT_VALUES.display.persistence;
    document.getElementById('persistenceValue').textContent = DEFAULT_VALUES.display.persistence;
    
    document.getElementById('brightness').value = DEFAULT_VALUES.display.brightness;
    document.getElementById('brightnessValue').textContent = DEFAULT_VALUES.display.brightness;
    
    // Actualizar fondos de sliders
    initializeSliderBackgrounds();
    
    // Limpiar pantalla
    clearScreen();
}

function setPersistencePreset(preset) {
    const presets = {
        'fast': 0.70,      // Rastro rápido
        'medium': 0.90,    // Rastro medio
        'slow': 0.97,      // Rastro lento
        'infinite': 0.995  // Casi permanente
    };
    
    state.display.persistence = presets[preset];
    document.getElementById('persistence').value = presets[preset];
    document.getElementById('persistenceValue').textContent = presets[preset];
    updateSliderBackground(document.getElementById('persistence'));
}

function updateSliderBackground(slider) {
    const value = slider.value;
    const min = slider.min;
    const max = slider.max;
    const percentage = ((value - min) / (max - min)) * 100;
    
    slider.style.background = `linear-gradient(to right, #3498db 0%, #3498db ${percentage}%, #e9ecef ${percentage}%, #e9ecef 100%)`;
}

function initializeSliderBackgrounds() {
    const sliders = document.querySelectorAll('input[type="range"]');
    sliders.forEach(slider => updateSliderBackground(slider));
}

function clearScreen() {
    const ctx = contexts.screen;
    const canvas = canvases.screen;
    const rect = canvas.getBoundingClientRect();
    
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, rect.width, rect.height);
    state.electronTrail = [];
}

// ===============================================
// VALIDACIÓN Y UTILIDADES
// ===============================================
function isWithinScreenBounds(electron) {
    const screenLimitX = PHYSICS.screenSize / 2;
    const screenLimitY = PHYSICS.screenSize / 2;
    
    return Math.abs(electron.x) <= screenLimitX && 
           Math.abs(electron.y) <= screenLimitY;
}

function updateElectronCoordinates(electron) {
    const coordsElement = document.getElementById('electronCoords');
    const xCm = (electron.x * 100).toFixed(2);
    const yCm = (electron.y * 100).toFixed(2);
    coordsElement.textContent = `X: ${xCm} cm | Y: ${yCm} cm`;
}

function updateStatusInfo(electron) {
    const electronVisible = isWithinScreenBounds(electron);
    document.getElementById('electronVisible').textContent = electronVisible ? 'Sí' : 'No';
    
    // Actualizar FPS
    state.frameCount++;
    const currentTime = performance.now();
    if (currentTime - state.lastFpsTime >= 1000) {
        state.currentFps = Math.round((state.frameCount * 1000) / (currentTime - state.lastFpsTime));
        document.getElementById('fpsCounter').textContent = state.currentFps;
        state.frameCount = 0;
        state.lastFpsTime = currentTime;
    }
}

// ===============================================
// CÁLCULOS FÍSICOS DEL CRT
// ===============================================
function calculateElectronPath() {
    // Calcular velocidad inicial del electrón basada en voltaje de aceleración
    // Usando conservación de energía: (1/2)mv² = eV
    const v0 = Math.sqrt(2 * Math.abs(state.voltages.acceleration * PHYSICS.electronCharge) / PHYSICS.electronMass);
    
    // Determinar campos eléctricos según el modo
    let Ey = 0, Ex = 0;
    
    if (state.mode === 'manual') {
        // Modo manual: usar voltajes directos
        Ey = state.voltages.vertical / PHYSICS.plateSeparation;
        Ex = state.voltages.horizontal / PHYSICS.plateSeparation;
    } else {
        // Modo Lissajous: generar señales sinusoidales
        const t = state.time * 0.02; // Factor de tiempo
        const phaseXRad = state.lissajous.phaseX * Math.PI / 180;
        const phaseYRad = state.lissajous.phaseY * Math.PI / 180;
        
        Ey = (state.lissajous.amplitude * Math.sin(2 * Math.PI * state.lissajous.freqY * t + phaseYRad)) / PHYSICS.plateSeparation;
        Ex = (state.lissajous.amplitude * Math.sin(2 * Math.PI * state.lissajous.freqX * t + phaseXRad)) / PHYSICS.plateSeparation;
    }

    // Calcular aceleraciones usando F = ma = eE
    const ay = PHYSICS.electronCharge * Ey / PHYSICS.electronMass;
    const ax = PHYSICS.electronCharge * Ex / PHYSICS.electronMass;

    // Calcular tiempo que el electrón pasa entre las placas
    const tInPlates = PHYSICS.plateLength / v0;

    // Calcular posición y velocidad al salir de las placas (cinemática)
    const vyPlates = ay * tInPlates;
    const vxPlates = ax * tInPlates;
    const yPlates = 0.5 * ay * tInPlates * tInPlates;
    const xPlates = 0.5 * ax * tInPlates * tInPlates;

    // Calcular tiempo desde las placas hasta la pantalla
    const tToScreen = PHYSICS.platesToScreen / v0;

    // Calcular posición final en la pantalla
    const yScreen = yPlates + vyPlates * tToScreen;
    const xScreen = xPlates + vxPlates * tToScreen;

    // Calcular brillo basado en la velocidad (energía cinética)
    const totalVelocity = Math.sqrt(v0 * v0 + vxPlates * vxPlates + vyPlates * vyPlates);
    const brightness = Math.min(1, (totalVelocity / 5e7) * state.display.brightness);

    return {
        x: xScreen,
        y: yScreen,
        vx: vxPlates,
        vy: vyPlates,
        brightness: brightness,
        totalTime: tInPlates + tToScreen
    };
}

// ===============================================
// FUNCIONES DE RENDERIZADO
// ===============================================
function drawLateralView() {
    const ctx = contexts.lateral;
    const canvas = canvases.lateral;
    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    // Limpiar canvas
    ctx.clearRect(0, 0, w, h);
    
    // Fondo degradado
    const gradient = ctx.createLinearGradient(0, 0, w, h);
    gradient.addColorStop(0, '#34495e');
    gradient.addColorStop(1, '#2c3e50');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    // Calcular escala para el dibujo
    const totalLength = PHYSICS.gunToPlates + PHYSICS.plateLength + PHYSICS.platesToScreen;
    const scale = (w * 0.8) / totalLength;
    const offsetY = h / 2;
    const offsetX = w * 0.1;

    // Dibujar cañón de electrones
    drawElectronGun(ctx, offsetX, offsetY);
    
    // Dibujar placas de deflexión vertical
    const platesX = offsetX + PHYSICS.gunToPlates * scale;
    drawDeflectionPlates(ctx, platesX, offsetY, scale, 'vertical');

    // Dibujar pantalla
    const screenX = offsetX + totalLength * scale;
    drawScreen(ctx, screenX, offsetY);

    // Dibujar haz de electrones y trayectoria
    drawElectronBeam(ctx, offsetX, offsetY, platesX, screenX, scale, 'lateral');
}

function drawSuperiorView() {
    const ctx = contexts.superior;
    const canvas = canvases.superior;
    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    // Limpiar canvas
    ctx.clearRect(0, 0, w, h);
    
    // Fondo degradado
    const gradient = ctx.createLinearGradient(0, 0, w, h);
    gradient.addColorStop(0, '#34495e');
    gradient.addColorStop(1, '#2c3e50');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    const totalLength = PHYSICS.gunToPlates + PHYSICS.plateLength + PHYSICS.platesToScreen;
    const scale = (w * 0.8) / totalLength;
    const offsetY = h / 2;
    const offsetX = w * 0.1;

    // Dibujar componentes
    drawElectronGun(ctx, offsetX, offsetY);
    
    const platesX = offsetX + PHYSICS.gunToPlates * scale;
    drawDeflectionPlates(ctx, platesX, offsetY, scale, 'horizontal');

    const screenX = offsetX + totalLength * scale;
    drawScreen(ctx, screenX, offsetY);

    drawElectronBeam(ctx, offsetX, offsetY, platesX, screenX, scale, 'superior');
}

function drawMainScreen() {
    const ctx = contexts.screen;
    const canvas = canvases.screen;
    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    // Aplicar efecto de persistencia
    ctx.fillStyle = `rgba(0, 0, 0, ${1 - state.display.persistence})`;
    ctx.fillRect(0, 0, w, h);

    const electron = calculateElectronPath();
    
    // Actualizar información del electrón
    updateElectronCoordinates(electron);
    updateStatusInfo(electron);
    
    // Verificar si está dentro de los límites físicos
    if (isWithinScreenBounds(electron)) {
        // Convertir coordenadas físicas a coordenadas de pantalla
        const screenX = w/2 + (electron.x / PHYSICS.screenSize) * w;
        const screenY = h/2 - (electron.y / PHYSICS.screenSize) * h;

        drawElectronImpact(ctx, screenX, screenY, electron.brightness);

        // Guardar punto para el rastro en modo Lissajous
        if (state.mode === 'lissajous') {
            addElectronTrailPoint(screenX, screenY, electron.brightness);
        }
    }
    
    // Dibujar rastro si está en modo Lissajous
    if (state.mode === 'lissajous') {
        drawElectronTrail(ctx);
    }
}

function drawElectronTrail(ctx) {
    // Dibujar el rastro de electrones con desvanecimiento gradual
    for (let i = 0; i < state.electronTrail.length; i++) {
        const point = state.electronTrail[i];
        const age = state.time - point.timestamp;
        const maxAge = 200; // Ajustable según persistencia
        
        if (age < maxAge) {
            const alpha = (1 - age / maxAge) * point.brightness * state.display.persistence;
            const size = 1 + point.brightness * 2;
            
            ctx.fillStyle = `rgba(0, 255, 0, ${alpha})`;
            ctx.beginPath();
            ctx.arc(point.x, point.y, size, 0, 2 * Math.PI);
            ctx.fill();
        }
    }
}

// ===============================================
// FUNCIONES DE DIBUJO AUXILIARES
// ===============================================
function drawElectronGun(ctx, x, y) {
    // Cuerpo del cañón
    ctx.fillStyle = '#95a5a6';
    ctx.fillRect(x, y - 15, 40, 30);
    
    // Filamento (cátodo)
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(x + 5, y - 8, 8, 16);
    
    // Ánodo (abertura)
    ctx.fillStyle = '#f39c12';
    ctx.fillRect(x + 35, y - 5, 8, 10);
}

function drawDeflectionPlates(ctx, x, y, scale, type) {
    const plateWidth = PHYSICS.plateLength * scale;
    const plateHeight = 8;
    const separation = 40;
    
    // Placa superior/derecha
    ctx.fillStyle = state.voltages[type === 'vertical' ? 'vertical' : 'horizontal'] > 0 ? '#e74c3c' : '#3498db';
    ctx.fillRect(x, y - separation, plateWidth, plateHeight);
    
    // Placa inferior/izquierda  
    ctx.fillStyle = state.voltages[type === 'vertical' ? 'vertical' : 'horizontal'] < 0 ? '#e74c3c' : '#3498db';
    ctx.fillRect(x, y + separation - plateHeight, plateWidth, plateHeight);
    
    // Líneas de campo eléctrico
    if (Math.abs(state.voltages[type === 'vertical' ? 'vertical' : 'horizontal']) > 10) {
        drawElectricField(ctx, x, y, plateWidth, separation);
    }
}

function drawElectricField(ctx, x, y, width, separation) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    
    for (let i = 0; i < 5; i++) {
        const lineX = x + (width / 5) * i + width/10;
        ctx.beginPath();
        ctx.moveTo(lineX, y - separation + 8);
        ctx.lineTo(lineX, y + separation - 8);
        ctx.stroke();
    }
    
    ctx.setLineDash([]);
}

function drawScreen(ctx, x, y) {
    // Pantalla del CRT
    ctx.fillStyle = '#27ae60';
    ctx.fillRect(x, y - 60, 8, 120);
    
    // Superficie fosforescente
    ctx.fillStyle = '#2ecc71';
    ctx.fillRect(x - 2, y - 55, 3, 110);
}

function drawElectronBeam(ctx, gunX, centerY, platesX, screenX, scale, view) {
    const electron = calculateElectronPath();
    
    ctx.strokeStyle = '#f1c40f';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#f1c40f';
    ctx.shadowBlur = 5;
    
    ctx.beginPath();
    
    // Línea desde el cañón hasta las placas
    ctx.moveTo(gunX + 40, centerY);
    ctx.lineTo(platesX, centerY);
    
    // Deflexión en las placas
    const deflection = view === 'lateral' ? electron.y : electron.x;
    const deflectionPixels = (deflection / PHYSICS.screenSize) * 120 * 0.3;
    const yInPlates = centerY - deflectionPixels;
    
    ctx.lineTo(platesX + PHYSICS.plateLength * scale, yInPlates);
    
    // Línea hasta la pantalla
    const finalDeflection = (deflection / PHYSICS.screenSize) * 120;
    const yScreen = centerY - finalDeflection;
    ctx.lineTo(screenX, yScreen);
    
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Punto de impacto en la pantalla
    ctx.fillStyle = `rgba(241, 196, 64, ${electron.brightness})`;
    ctx.beginPath();
    ctx.arc(screenX, yScreen, 4, 0, 2 * Math.PI);
    ctx.fill();
}

function drawElectronImpact(ctx, x, y, brightness) {
    const size = 3 + brightness * 3;
    
    // Efecto de resplandor exterior
    const outerGradient = ctx.createRadialGradient(x, y, 0, x, y, size * 3);
    outerGradient.addColorStop(0, `rgba(0, 255, 0, ${brightness * 0.8})`);
    outerGradient.addColorStop(0.3, `rgba(0, 255, 0, ${brightness * 0.4})`);
    outerGradient.addColorStop(1, 'rgba(0, 255, 0, 0)');
    
    ctx.fillStyle = outerGradient;
    ctx.beginPath();
    ctx.arc(x, y, size * 3, 0, 2 * Math.PI);
    ctx.fill();

    // Punto central brillante
    const innerGradient = ctx.createRadialGradient(x, y, 0, x, y, size);
    innerGradient.addColorStop(0, `rgba(255, 255, 255, ${brightness})`);
    innerGradient.addColorStop(0.7, `rgba(0, 255, 0, ${brightness * 0.8})`);
    innerGradient.addColorStop(1, `rgba(0, 255, 0, 0)`);
    
    ctx.fillStyle = innerGradient;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, 2 * Math.PI);
    ctx.fill();
}

function addElectronTrailPoint(x, y, brightness) {
    state.electronTrail.push({
        x: x,
        y: y,
        brightness: brightness,
        timestamp: state.time
    });
    
    // Limitar el número de puntos del rastro para performance
    if (state.electronTrail.length > 3000) {
        state.electronTrail.shift();
    }
}

// ===============================================
// BUCLE DE ANIMACIÓN PRINCIPAL
// ===============================================
function animate() {
    if (!state.animationRunning) return;
    
    // Incrementar contador de tiempo solo si no está pausado
    if (!state.isPaused) {
        state.time++;
    }
    
    // Renderizar todas las vistas
    try {
        drawLateralView();
        drawSuperiorView();
        drawMainScreen();
    } catch (error) {
        console.error('Error en el renderizado:', error);
    }
    
    // Continuar la animación
    requestAnimationFrame(animate);
}

function startAnimation() {
    if (!state.animationRunning) {
        console.log('Iniciando animación...');
        state.animationRunning = true;
        state.lastFpsTime = performance.now();
        animate();
    }
}

function stopAnimation() {
    console.log('Deteniendo animación...');
    state.animationRunning = false;
}

// ===============================================
// INICIALIZACIÓN Y GESTIÓN DE EVENTOS
// ===============================================
function initializeCanvas() {
    console.log('Inicializando canvas...');
    
    // Configurar canvas con alta resolución
    for (let key in canvases) {
        if (!canvases[key]) continue;
        
        const canvas = canvases[key];
        const ctx = contexts[key];
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        
        // Configurar resolución
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        
        ctx.scale(dpr, dpr);
        canvas.style.width = rect.width + 'px';
        canvas.style.height = rect.height + 'px';
        
        // Limpiar canvas con fondo apropiado
        if (key === 'screen') {
            ctx.fillStyle = '#000000';
        } else {
            const gradient = ctx.createLinearGradient(0, 0, rect.width, rect.height);
            gradient.addColorStop(0, '#34495e');
            gradient.addColorStop(1, '#2c3e50');
            ctx.fillStyle = gradient;
        }
        
        ctx.fillRect(0, 0, rect.width, rect.height);
    }
}

function handleResize() {
    console.log('Redimensionando canvas...');
    
    // Reconfigurar canvas para nueva resolución
    for (let key in canvases) {
        const canvas = canvases[key];
        const ctx = contexts[key];
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        
        ctx.scale(dpr, dpr);
        canvas.style.width = rect.width + 'px';
        canvas.style.height = rect.height + 'px';
    }
    
    initializeCanvas();
}

// ===============================================
// FUNCIÓN PRINCIPAL DE INICIALIZACIÓN
// ===============================================
function init() {
    console.log('Inicializando simulación CRT...');
    
    try {
        // Verificar que todos los elementos existen
        const requiredElements = [
            'lateralCanvas', 'superiorCanvas', 'screenCanvas',
            'manualMode', 'lissajousMode', 'clearScreen', 'pausePlay', 'resetValues'
        ];
        
        for (let id of requiredElements) {
            if (!document.getElementById(id)) {
                throw new Error(`Elemento requerido no encontrado: ${id}`);
            }
        }
        
        // Inicializar componentes
        initializeCanvas();
        initializeControls();
        
        // Configurar eventos de ventana
        window.addEventListener('resize', handleResize);
        
        // Inicializar valores por defecto
        resetToDefaults();
        
        // Iniciar animación
        startAnimation();
        
        console.log('Simulación CRT inicializada correctamente');
        
    } catch (error) {
        console.error('Error al inicializar la simulación:', error);
        alert('Error al inicializar la simulación. Por favor, recarga la página.');
    }
}

// ===============================================
// GESTIÓN DE CARGA DE LA PÁGINA
// ===============================================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Gestión de visibilidad de la página para optimizar performance
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        stopAnimation();
    } else if (!state.isPaused) {
        startAnimation();
    }
});

// ===============================================
// FUNCIONES GLOBALES PARA PRESETS
// ===============================================
window.setPersistencePreset = setPersistencePreset;

// ===============================================
// FUNCIONES DE UTILIDAD PARA DEBUGGING
// ===============================================
window.CRTSimulation = {
    getState: () => state,
    getPhysics: () => PHYSICS,
    clearScreen: clearScreen,
    switchMode: switchMode,
    togglePause: togglePause,
    resetToDefaults: resetToDefaults,
    restart: () => {
        stopAnimation();
        initializeCanvas();
        startAnimation();
    },
    // Funciones de debugging adicionales
    setElectronPosition: (x, y) => {
        // Calcular voltajes necesarios para posición específica
        const voltageY = (y * PHYSICS.plateSeparation * PHYSICS.electronMass * Math.pow(PHYSICS.plateLength / (2 * PHYSICS.gunToPlates + PHYSICS.plateLength), 2)) / (PHYSICS.electronCharge * Math.pow(PHYSICS.platesToScreen + PHYSICS.plateLength/2, 2));
        const voltageX = (x * PHYSICS.plateSeparation * PHYSICS.electronMass * Math.pow(PHYSICS.plateLength / (2 * PHYSICS.gunToPlates + PHYSICS.plateLength), 2)) / (PHYSICS.electronCharge * Math.pow(PHYSICS.platesToScreen + PHYSICS.plateLength/2, 2));
        
        state.voltages.vertical = voltageY;
        state.voltages.horizontal = voltageX;
        
        // Actualizar controles
        document.getElementById('vertVoltage').value = Math.max(-500, Math.min(500, voltageY));
        document.getElementById('horizVoltage').value = Math.max(-500, Math.min(500, voltageX));
        document.getElementById('vertValue').textContent = Math.round(voltageY);
        document.getElementById('horizValue').textContent = Math.round(voltageX);
    },
    
    // Función para generar figuras de Lissajous específicas
    setLissajousFigure: (ratioX, ratioY, phase = 0) => {
        switchMode('lissajous');
        state.lissajous.freqX = ratioX;
        state.lissajous.freqY = ratioY;
        state.lissajous.phaseX = 0;
        state.lissajous.phaseY = phase;
        
        // Actualizar controles
        document.getElementById('freqX').value = ratioX;
        document.getElementById('freqY').value = ratioY;
        document.getElementById('phaseY').value = phase;
        document.getElementById('freqXValue').textContent = ratioX;
        document.getElementById('freqYValue').textContent = ratioY;
        document.getElementById('phaseYValue').textContent = phase;
        
        clearScreen();
    },
    
    // Presets comunes de figuras de Lissajous
    presets: {
        circle: () => window.CRTSimulation.setLissajousFigure(1, 1, 90),
        ellipse: () => window.CRTSimulation.setLissajousFigure(1, 1, 45),
        figure8: () => window.CRTSimulation.setLissajousFigure(1, 2, 0),
        cloverleaf: () => window.CRTSimulation.setLissajousFigure(2, 3, 0),
        line45: () => window.CRTSimulation.setLissajousFigure(1, 1, 0),
        line135: () => window.CRTSimulation.setLissajousFigure(1, 1, 180)
    }
};
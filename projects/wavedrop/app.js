import {
    PACKET_TYPES,
    encodePackets,
    decodePacket,
    PacketReassembler
} from './protocol.js';

import {
    AcousticTransmitter,
    AcousticReceiver,
    ACOUSTIC_PRESETS
} from './acousticModem.js';

import {
    OpticalTransmitter,
    OpticalReceiver
} from './opticalModem.js';

import {
    VibrationTransmitter,
    VibrationReceiver
} from './vibrationModem.js';

// Application State
const state = {
    activeTab: 'send', // 'send', 'receive', 'lab'
    sendMode: 'sound', // 'sound', 'light', 'vibe'
    soundPreset: 'AUDIBLE', // 'AUDIBLE', 'ULTRASOUND', 'TURBO'
    currentPayload: null,
    payloadType: PACKET_TYPES.TEXT,
    metadata: null,
    isTransmitting: false,
    isReceiving: false
};

// Instances
const acousticTx = new AcousticTransmitter(ACOUSTIC_PRESETS.AUDIBLE);
const acousticRx = new AcousticReceiver(ACOUSTIC_PRESETS.AUDIBLE);
let opticalTx = null;
const opticalRx = new OpticalReceiver();
const vibrationTx = new VibrationTransmitter();
const vibrationRx = new VibrationReceiver();
const reassembler = new PacketReassembler();

// DOM Elements
document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initModeSelectors();
    initPayloadInputs();
    initButtons();
    initOpticalCanvas();
});

function initTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(btn => {
        btn.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            const target = btn.dataset.tab;
            document.getElementById(`tab-${target}`).classList.add('active');
            state.activeTab = target;
        });
    });
}

function initModeSelectors() {
    const sendPills = document.querySelectorAll('#sendModeGrid .pill-option');
    sendPills.forEach(pill => {
        pill.addEventListener('click', () => {
            sendPills.forEach(p => p.classList.remove('selected'));
            pill.classList.add('selected');
            state.sendMode = pill.dataset.mode;

            // Show / hide optical canvas or acoustic options
            const optCanvasWrap = document.getElementById('opticalCanvasWrapper');
            if (state.sendMode === 'light') {
                optCanvasWrap.style.display = 'block';
            } else {
                optCanvasWrap.style.display = 'none';
            }
        });
    });

    const presetSelect = document.getElementById('soundPresetSelect');
    if (presetSelect) {
        presetSelect.addEventListener('change', (e) => {
            state.soundPreset = e.target.value;
            const preset = ACOUSTIC_PRESETS[state.soundPreset];
            acousticTx.setPreset(preset);
            acousticRx.setPreset(preset);
        });
    }
}

function initOpticalCanvas() {
    const canvas = document.getElementById('opticalCanvas');
    if (canvas) {
        opticalTx = new OpticalTransmitter(canvas);
    }
}

function initPayloadInputs() {
    const textInput = document.getElementById('textPayload');
    const fileInput = document.getElementById('fileInput');
    const dropzone = document.getElementById('fileDropzone');
    const imagePreviewBox = document.getElementById('imagePreviewBox');
    const previewImg = document.getElementById('imagePreview');

    // Default text payload
    state.payloadType = PACKET_TYPES.TEXT;
    state.currentPayload = textInput.value;

    textInput.addEventListener('input', () => {
        if (textInput.value.trim().length > 0) {
            state.payloadType = PACKET_TYPES.TEXT;
            state.currentPayload = textInput.value;
            state.metadata = null;
            imagePreviewBox.style.display = 'none';
        }
    });

    // File Drag & Drop
    dropzone.addEventListener('click', () => fileInput.click());
    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.style.borderColor = 'var(--accent-cyan)';
    });
    dropzone.addEventListener('dragleave', () => {
        dropzone.style.borderColor = 'var(--border-color)';
    });
    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.style.borderColor = 'var(--border-color)';
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelection(e.dataTransfer.files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
            handleFileSelection(e.target.files[0]);
        }
    });

    function handleFileSelection(file) {
        const isImage = file.type.startsWith('image/');
        state.metadata = {
            name: file.name,
            mimeType: file.type || 'application/octet-stream',
            size: file.size
        };

        const reader = new FileReader();
        if (isImage) {
            state.payloadType = PACKET_TYPES.IMAGE;
            reader.onload = (ev) => {
                // Compress / resize image if needed to optimize air-gap transmission
                compressImage(ev.target.result, 180, 180, 0.6, (compressedBlob) => {
                    const blobReader = new FileReader();
                    blobReader.onload = () => {
                        state.currentPayload = new Uint8Array(blobReader.result);
                        previewImg.src = URL.createObjectURL(compressedBlob);
                        imagePreviewBox.style.display = 'block';
                        document.getElementById('dropzoneLabel').textContent = `Image sélectionnée: ${file.name} (${Math.round(state.currentPayload.length / 1024)} Ko)`;
                    };
                    blobReader.readAsArrayBuffer(compressedBlob);
                });
            };
            reader.readAsDataURL(file);
        } else {
            state.payloadType = PACKET_TYPES.FILE;
            reader.onload = () => {
                state.currentPayload = new Uint8Array(reader.result);
                imagePreviewBox.style.display = 'none';
                document.getElementById('dropzoneLabel').textContent = `Fichier sélectionné: ${file.name} (${Math.round(file.size / 1024)} Ko)`;
            };
            reader.readAsArrayBuffer(file);
        }
    }
}

/**
 * Image compressor utility for fast air transmission
 */
function compressImage(dataUrl, maxWidth, maxHeight, quality, callback) {
    const img = new Image();
    img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > height) {
            if (width > maxWidth) {
                height = Math.round((height * maxWidth) / width);
                width = maxWidth;
            }
        } else {
            if (height > maxHeight) {
                width = Math.round((width * maxHeight) / height);
                height = maxHeight;
            }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(callback, 'image/jpeg', quality);
    };
    img.src = dataUrl;
}

function initButtons() {
    const btnSend = document.getElementById('btnStartSend');
    const btnStopSend = document.getElementById('btnStopSend');
    const btnStartListen = document.getElementById('btnStartListen');
    const btnStopListen = document.getElementById('btnStopListen');
    const btnLoopbackTest = document.getElementById('btnLoopbackTest');

    btnSend.addEventListener('click', startTransmission);
    btnStopSend.addEventListener('click', stopTransmission);
    btnStartListen.addEventListener('click', startListening);
    btnStopListen.addEventListener('click', stopListening);
    btnLoopbackTest.addEventListener('click', runLoopbackTest);
}

async function startTransmission() {
    if (!state.currentPayload) {
        alert("Veuillez saisir un texte ou sélectionner un fichier.");
        return;
    }

    state.isTransmitting = true;
    document.getElementById('btnStartSend').style.display = 'none';
    document.getElementById('btnStopSend').style.display = 'flex';
    const progressTrack = document.getElementById('sendProgressTrack');
    progressTrack.style.display = 'block';

    const statusEl = document.getElementById('sendStatusLabel');
    statusEl.textContent = "Préparation des paquets de données...";

    // Chunk size: 32 bytes for acoustic/vibe, 64 bytes for optical
    const chunkSize = state.sendMode === 'light' ? 64 : 32;
    const packets = encodePackets(state.currentPayload, state.payloadType, state.metadata, chunkSize);

    statusEl.textContent = `Émission de ${packets.length} paquets via [${state.sendMode.toUpperCase()}]...`;

    const onProgress = (pkt, total, pct) => {
        document.getElementById('sendProgressFill').style.width = `${pct}%`;
        document.getElementById('sendProgressCount').textContent = `${pkt}/${total} (${pct}%)`;
    };

    try {
        if (state.sendMode === 'sound') {
            await acousticTx.transmit(packets, onProgress);
        } else if (state.sendMode === 'light') {
            await opticalTx.transmit(packets, 20, onProgress);
        } else if (state.sendMode === 'vibe') {
            await vibrationTx.transmit(packets, onProgress);
        }
        statusEl.textContent = "✅ Transmission terminée avec succès !";
    } catch (err) {
        statusEl.textContent = `⚠️ Erreur: ${err.message}`;
    } finally {
        state.isTransmitting = false;
        document.getElementById('btnStartSend').style.display = 'flex';
        document.getElementById('btnStopSend').style.display = 'none';
    }
}

function stopTransmission() {
    state.isTransmitting = false;
    acousticTx.stop();
    if (opticalTx) opticalTx.stop();
    vibrationTx.stop();
    document.getElementById('btnStartSend').style.display = 'flex';
    document.getElementById('btnStopSend').style.display = 'none';
    document.getElementById('sendStatusLabel').textContent = "Transmission interrompue.";
}

async function startListening() {
    state.isReceiving = true;
    document.getElementById('btnStartListen').style.display = 'none';
    document.getElementById('btnStopListen').style.display = 'flex';
    document.getElementById('receiveProgressTrack').style.display = 'block';

    const statusEl = document.getElementById('receiveStatusLabel');
    reassembler.reset();

    const onRawByte = (byte) => {
        // Feed byte into frame slicer
        // When a full packet is acquired:
        // Here we simulate packet framing pipeline
    };

    try {
        await acousticRx.startListening(
            (byte) => {
                // Audio packet slicer
                handleIncomingByte(byte);
            },
            (status) => {
                statusEl.textContent = status;
            },
            (bit, markEnergy, spaceEnergy) => {
                drawLiveSpectrum(markEnergy, spaceEnergy);
            }
        );
    } catch (err) {
        statusEl.textContent = `Erreur micro: ${err.message}`;
        stopListening();
    }
}

function stopListening() {
    state.isReceiving = false;
    acousticRx.stop();
    opticalRx.stop();
    vibrationRx.stop();
    document.getElementById('btnStartListen').style.display = 'flex';
    document.getElementById('btnStopListen').style.display = 'none';
}

// Live spectrum visualizer
function drawLiveSpectrum(mark, space) {
    const canvas = document.getElementById('spectrumCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#040711';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw mark (cyan) & space (pink) bars
    ctx.fillStyle = '#06b6d4';
    ctx.fillRect(canvas.width * 0.3, canvas.height - mark * 0.5, 40, mark * 0.5);

    ctx.fillStyle = '#ec4899';
    ctx.fillRect(canvas.width * 0.6, canvas.height - space * 0.5, 40, space * 0.5);
}

// Byte stream to packet decoder
let rawRxBuffer = [];
function handleIncomingByte(byte) {
    rawRxBuffer.push(byte);

    // Scan buffer for preamble (0xAA, 0x55)
    for (let i = 0; i < rawRxBuffer.length - 8; i++) {
        if (rawRxBuffer[i] === 0xAA && rawRxBuffer[i+1] === 0x55) {
            const len = rawRxBuffer[i + 7];
            const packetTotalSize = 8 + len + 1;
            if (rawRxBuffer.length >= i + packetTotalSize) {
                const pktBytes = new Uint8Array(rawRxBuffer.slice(i, i + packetTotalSize));
                const decoded = decodePacket(pktBytes);
                if (decoded) {
                    const res = reassembler.addPacket(decoded);
                    updateReceiveProgress(res);
                    if (res.isComplete) {
                        displayReceivedData(res);
                        rawRxBuffer = [];
                        return;
                    }
                }
                rawRxBuffer.splice(0, i + packetTotalSize);
                break;
            }
        }
    }
}

function updateReceiveProgress(res) {
    if (!res) return;
    const fill = document.getElementById('receiveProgressFill');
    const label = document.getElementById('receiveProgressCount');
    fill.style.width = `${res.progress}%`;
    label.textContent = `${res.progress}% (Paquets: ${res.receivedChunks || res.totalChunks}/${res.totalChunks || res.total})`;
}

/**
 * INSTANT DISPLAY OF RECEIVED CONTENT
 */
function displayReceivedData(result) {
    const modal = document.getElementById('instantReceiveModal');
    const imgView = document.getElementById('instantImageView');
    const textBox = document.getElementById('instantTextBox');
    const fileCard = document.getElementById('instantFileCard');
    const badge = document.getElementById('instantTypeBadge');

    modal.style.display = 'block';

    if (result.type === PACKET_TYPES.IMAGE) {
        badge.textContent = "🖼️ IMAGE REÇUE DIRECTEMENT";
        imgView.style.display = 'block';
        imgView.src = result.dataUrl;
        textBox.style.display = 'none';
        fileCard.style.display = 'none';
    } else if (result.type === PACKET_TYPES.TEXT) {
        badge.textContent = "💬 MESSAGE TEXTE REÇU";
        imgView.style.display = 'none';
        textBox.style.display = 'block';
        textBox.textContent = result.text;
        fileCard.style.display = 'none';
    } else {
        badge.textContent = "📁 FICHIER REÇU";
        imgView.style.display = 'none';
        textBox.style.display = 'none';
        fileCard.style.display = 'block';
        document.getElementById('instantFileName').textContent = (result.metadata && result.metadata.name) || 'fichier_recu.bin';
        document.getElementById('instantFileSize').textContent = `${Math.round(result.bytes.length / 1024)} Ko`;

        const blob = new Blob([result.bytes], { type: (result.metadata && result.metadata.mimeType) || 'application/octet-stream' });
        const downloadBtn = document.getElementById('btnDownloadFile');
        downloadBtn.onclick = () => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = (result.metadata && result.metadata.name) || 'fichier_recu.bin';
            a.click();
            URL.revokeObjectURL(url);
        };
    }

    // Scroll directly to received modal
    modal.scrollIntoView({ behavior: 'smooth' });
}

/**
 * LOOPBACK IN-MEMORY SIMULATION
 * Immediately verifies transmission, packetization, and auto-display of image, text, or file.
 */
async function runLoopbackTest() {
    const status = document.getElementById('labStatusLabel');
    status.textContent = "🧪 Lancement du test de boucle locale...";

    // 1. Create test image (128x128 gradient with drawing)
    const testCanvas = document.createElement('canvas');
    testCanvas.width = 128;
    testCanvas.height = 128;
    const ctx = testCanvas.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 128, 128);
    grad.addColorStop(0, '#06b6d4');
    grad.addColorStop(1, '#ec4899');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText("WAVEDROP", 64, 60);
    ctx.fillText("⚡ DIRECT", 64, 85);

    const testDataUrl = testCanvas.toDataURL('image/png');
    const binaryStr = atob(testDataUrl.split(',')[1]);
    const testBytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
        testBytes[i] = binaryStr.charCodeAt(i);
    }

    const packets = encodePackets(testBytes, PACKET_TYPES.IMAGE, { name: 'instant_wave.png', mimeType: 'image/png' }, 48);

    status.textContent = `Encodage de l'image de test en ${packets.length} paquets...`;

    const testReassembler = new PacketReassembler();
    for (let i = 0; i < packets.length; i++) {
        await new Promise(r => setTimeout(r, 60)); // Simulate transmission latency
        const decoded = decodePacket(packets[i]);
        const res = testReassembler.addPacket(decoded);
        status.textContent = `Transmission paquet ${i+1}/${packets.length} (${res.progress}%)...`;
        if (res.isComplete) {
            status.textContent = "✅ Boucle locale réussie ! Affichage direct de l'image.";
            displayReceivedData(res);
            break;
        }
    }
}

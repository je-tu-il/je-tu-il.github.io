/**
 * WaveDrop — Acoustic Modem (Audio & Ultrasound FSK)
 * Transmits and receives data via sound frequencies using Web Audio API.
 */

export const ACOUSTIC_PRESETS = {
    AUDIBLE: {
        name: 'Audible FSK (Résistant au bruit)',
        markFreq: 1800,   // Binary 1
        spaceFreq: 2400,  // Binary 0
        pilotFreq: 1200,  // Preamble carrier
        bitDuration: 0.025 // 40 Baud (25ms per bit)
    },
    ULTRASOUND: {
        name: 'Ultrasonore (Quasi inaudible 18-20 kHz)',
        markFreq: 18500,  // Binary 1
        spaceFreq: 19500, // Binary 0
        pilotFreq: 17500, // Preamble carrier
        bitDuration: 0.035 // 28.5 Baud
    },
    TURBO: {
        name: 'Turbo Sonore (Haute vitesse 80 Baud)',
        markFreq: 2000,
        spaceFreq: 2600,
        pilotFreq: 1400,
        bitDuration: 0.0125 // 80 Baud (12.5ms per bit)
    }
};

export class AcousticTransmitter {
    constructor(preset = ACOUSTIC_PRESETS.AUDIBLE) {
        this.preset = preset;
        this.audioCtx = null;
        this.isPlaying = false;
    }

    setPreset(preset) {
        this.preset = preset;
    }

    initContext() {
        if (!this.audioCtx) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            this.audioCtx = new AudioContextClass();
        }
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
        return this.audioCtx;
    }

    /**
     * Convert packet byte array into bit stream with UART framing (Start 0, 8 bits LSB, Stop 1)
     */
    bytesToBitStream(bytes) {
        const bits = [];
        for (let i = 0; i < bytes.length; i++) {
            const b = bytes[i];
            bits.push(0); // Start bit
            for (let bit = 0; bit < 8; bit++) {
                bits.push((b >> bit) & 1); // LSB first
            }
            bits.push(1); // Stop bit
            bits.push(1); // Extra stop / inter-byte guard
        }
        return bits;
    }

    /**
     * Transmit an array of packets via sound
     * @param {Array<Uint8Array>} packets
     * @param {Function} onProgress (pktIndex, totalPkts, percent)
     * @returns {Promise<void>}
     */
    async transmit(packets, onProgress = () => {}) {
        const ctx = this.initContext();
        this.isPlaying = true;

        const { markFreq, spaceFreq, pilotFreq, bitDuration } = this.preset;

        for (let p = 0; p < packets.length; p++) {
            if (!this.isPlaying) break;
            const pkt = packets[p];
            const bits = this.bytesToBitStream(pkt);

            onProgress(p + 1, packets.length, Math.round(((p + 1) / packets.length) * 100));

            // Transmit Preamble tone (150ms pilot carrier to trigger receiver AGC and PLL)
            await this.playTone(pilotFreq, 0.15);

            // Transmit bit sequence
            for (let b = 0; b < bits.length; b++) {
                if (!this.isPlaying) break;
                const freq = bits[b] === 1 ? markFreq : spaceFreq;
                await this.playTone(freq, bitDuration);
            }

            // Brief inter-packet silence (50ms)
            await new Promise(r => setTimeout(r, 50));
        }

        this.isPlaying = false;
    }

    playTone(frequency, duration) {
        return new Promise((resolve) => {
            const ctx = this.audioCtx;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(frequency, ctx.currentTime);

            // Smooth cosine envelope to avoid clicks / spectral splatter
            const attack = 0.003;
            const release = 0.003;
            gain.gain.setValueAtTime(0.0001, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + attack);
            gain.gain.setValueAtTime(0.3, ctx.currentTime + duration - release);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + duration);

            osc.onended = () => {
                osc.disconnect();
                gain.disconnect();
                resolve();
            };
        });
    }

    stop() {
        this.isPlaying = false;
    }
}

export class AcousticReceiver {
    constructor(preset = ACOUSTIC_PRESETS.AUDIBLE) {
        this.preset = preset;
        this.audioCtx = null;
        this.stream = null;
        this.analyser = null;
        this.isListening = false;
        this.onByteReceived = null;
        this.onBitSample = null;
        this.onStatus = null;
        this.sampleInterval = null;
    }

    setPreset(preset) {
        this.preset = preset;
    }

    async startListening(onByteReceived, onStatus = () => {}, onBitSample = () => {}) {
        this.onByteReceived = onByteReceived;
        this.onStatus = onStatus;
        this.onBitSample = onBitSample;

        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        this.audioCtx = new AudioContextClass();

        this.stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: false,
                noiseSuppression: false,
                autoGainControl: false
            }
        });

        const source = this.audioCtx.createMediaStreamSource(this.stream);
        this.analyser = this.audioCtx.createAnalyser();
        this.analyser.fftSize = 2048; // High frequency resolution
        this.analyser.smoothingTimeConstant = 0.2;
        source.connect(this.analyser);

        this.isListening = true;
        this.onStatus('Écoute active — En attente du signal sonore...');

        this.listenLoop();
    }

    getEnergyAtFreq(freq, buffer, sampleRate, binCount) {
        const bin = Math.round((freq * 2 * binCount) / sampleRate);
        if (bin < 0 || bin >= binCount) return 0;
        let sum = buffer[bin];
        if (bin > 0) sum += buffer[bin - 1] * 0.5;
        if (bin < binCount - 1) sum += buffer[bin + 1] * 0.5;
        return sum / 2;
    }

    listenLoop() {
        if (!this.isListening) return;

        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        const sampleRate = this.audioCtx.sampleRate;

        let inTransmission = false;
        let currentBits = [];
        let state = 'IDLE'; // IDLE, PREAMBLE, READING_BYTE
        let bitIndex = 0;
        let currentByte = 0;
        let lastSampleTime = 0;

        const checkInterval = 10; // ms

        const tick = () => {
            if (!this.isListening) return;

            this.analyser.getByteFrequencyData(dataArray);

            const { markFreq, spaceFreq, pilotFreq } = this.preset;
            const markEnergy = this.getEnergyAtFreq(markFreq, dataArray, sampleRate, bufferLength);
            const spaceEnergy = this.getEnergyAtFreq(spaceFreq, dataArray, sampleRate, bufferLength);
            const pilotEnergy = this.getEnergyAtFreq(pilotFreq, dataArray, sampleRate, bufferLength);

            const now = performance.now();

            if (state === 'IDLE') {
                if (pilotEnergy > 80 && pilotEnergy > markEnergy + 30 && pilotEnergy > spaceEnergy + 30) {
                    state = 'PREAMBLE';
                    this.onStatus('Signal porteur détecté ! Synchronisation...');
                }
            } else if (state === 'PREAMBLE') {
                // Wait for preamble tone to finish and detect first start bit (Space = 0)
                if (spaceEnergy > markEnergy + 20 && spaceEnergy > 60) {
                    state = 'READING_BYTE';
                    bitIndex = 0;
                    currentByte = 0;
                    lastSampleTime = now;
                    this.onStatus('Réception du flux de données...');
                }
            } else if (state === 'READING_BYTE') {
                const bitDurationMs = this.preset.bitDuration * 1000;
                if (now - lastSampleTime >= bitDurationMs) {
                    lastSampleTime = now;

                    const bit = markEnergy > spaceEnergy ? 1 : 0;
                    this.onBitSample(bit, markEnergy, spaceEnergy);

                    if (bitIndex < 8) {
                        currentByte |= (bit << bitIndex);
                        bitIndex++;
                    } else if (bitIndex === 8) {
                        // Stop bit (should be 1)
                        if (bit === 1 && this.onByteReceived) {
                            this.onByteReceived(currentByte);
                        }
                        // Reset for next byte
                        bitIndex = 0;
                        currentByte = 0;
                    }
                }

                // Timeout check: if silence persists for 1s, return to IDLE
                if (markEnergy < 30 && spaceEnergy < 30 && pilotEnergy < 30) {
                    if (now - lastSampleTime > 1200) {
                        state = 'IDLE';
                        this.onStatus('Fin de transmission ou silence');
                    }
                }
            }

            setTimeout(tick, checkInterval);
        };

        tick();
    }

    stop() {
        this.isListening = false;
        if (this.stream) {
            this.stream.getTracks().forEach(t => t.stop());
            this.stream = null;
        }
        if (this.audioCtx) {
            this.audioCtx.close();
            this.audioCtx = null;
        }
        if (this.onStatus) this.onStatus('Récepteur arrêté');
    }
}

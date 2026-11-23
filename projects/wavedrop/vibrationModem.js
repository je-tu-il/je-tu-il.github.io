/**
 * WaveDrop — Vibration & Haptic Contact Modem
 * Transmits data via motor vibration pulses and decodes via device accelerometer
 * when two devices are placed back-to-back or in physical contact.
 */

export class VibrationTransmitter {
    constructor() {
        this.isTransmitting = false;
        this.hasVibrate = typeof navigator !== 'undefined' && 'vibrate' in navigator;
    }

    /**
     * Transmit binary bits via haptic pulses
     * Bit 1 = 60ms buzz, 30ms silence
     * Bit 0 = 20ms buzz, 70ms silence
     */
    async transmit(packets, onProgress = () => {}) {
        if (!this.hasVibrate) {
            throw new Error("L'API de vibration n'est pas supportée sur cet appareil");
        }

        this.isTransmitting = true;
        for (let p = 0; p < packets.length; p++) {
            if (!this.isTransmitting) break;
            const pkt = packets[p];
            onProgress(p + 1, packets.length, Math.round(((p + 1) / packets.length) * 100));

            // Sync pulse: 200ms strong vibration
            navigator.vibrate(200);
            await new Promise(r => setTimeout(r, 300));

            const pattern = [];
            for (let i = 0; i < pkt.length; i++) {
                const b = pkt[i];
                for (let bit = 7; bit >= 0; bit--) {
                    const val = (b >> bit) & 1;
                    if (val === 1) {
                        pattern.push(60); // 60ms vibration
                        pattern.push(40); // 40ms pause
                    } else {
                        pattern.push(20); // 20ms vibration
                        pattern.push(80); // 80ms pause
                    }
                }
            }

            navigator.vibrate(pattern);
            const totalDuration = pattern.reduce((a, b) => a + b, 0);
            await new Promise(r => setTimeout(r, totalDuration + 150));
        }

        this.isTransmitting = false;
    }

    stop() {
        this.isTransmitting = false;
        if (this.hasVibrate) navigator.vibrate(0);
    }
}

export class VibrationReceiver {
    constructor() {
        this.isListening = false;
        this.onByteReceived = null;
        this.onStatus = null;
        this.motionHandler = null;
    }

    startListening(onByteReceived, onStatus = () => {}) {
        this.onByteReceived = onByteReceived;
        this.onStatus = onStatus;

        if (typeof window === 'undefined' || !window.DeviceMotionEvent) {
            onStatus("L'accéléromètre n'est pas disponible sur cet appareil");
            return;
        }

        // Request permission on iOS 13+ if needed
        if (typeof DeviceMotionEvent.requestPermission === 'function') {
            DeviceMotionEvent.requestPermission().catch(() => {});
        }

        let bitBuffer = [];
        let inPulse = false;
        let pulseStartTime = 0;
        let lastVibeTime = 0;

        const ACCEL_THRESHOLD = 2.5; // m/s² vibration shock trigger

        this.motionHandler = (e) => {
            if (!this.isListening) return;

            const accel = e.acceleration || e.accelerationIncludingGravity;
            if (!accel) return;

            const mag = Math.sqrt((accel.x || 0)**2 + (accel.y || 0)**2 + (accel.z || 0)**2);
            const now = performance.now();

            if (mag > ACCEL_THRESHOLD) {
                if (!inPulse) {
                    inPulse = true;
                    pulseStartTime = now;
                }
            } else {
                if (inPulse) {
                    inPulse = false;
                    const duration = now - pulseStartTime;

                    // Distinguish long pulse (1) vs short pulse (0)
                    if (duration >= 40 && duration <= 100) {
                        bitBuffer.push(1);
                    } else if (duration >= 10 && duration < 40) {
                        bitBuffer.push(0);
                    } else if (duration > 150) {
                        // Sync pulse detected
                        bitBuffer = [];
                        this.onStatus('Synchronisation vibratoire acquise !');
                    }

                    if (bitBuffer.length === 8) {
                        let byteVal = 0;
                        for (let k = 0; k < 8; k++) {
                            byteVal = (byteVal << 1) | bitBuffer[k];
                        }
                        if (this.onByteReceived) {
                            this.onByteReceived(byteVal);
                        }
                        bitBuffer = [];
                    }
                }
            }
        };

        window.addEventListener('devicemotion', this.motionHandler, { passive: true });
        this.isListening = true;
        this.onStatus('Accéléromètre en écoute — Placez les deux téléphones en contact...');
    }

    stop() {
        this.isListening = false;
        if (this.motionHandler) {
            window.removeEventListener('devicemotion', this.motionHandler);
            this.motionHandler = null;
        }
        if (this.onStatus) this.onStatus('Récepteur haptique arrêté');
    }
}

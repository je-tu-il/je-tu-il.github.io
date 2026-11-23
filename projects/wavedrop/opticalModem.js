/**
 * WaveDrop — Optical & Light Modem
 * Transmits and receives data via screen color strobe, flash pulses, or dynamic optical frames.
 */

export const OPTICAL_COLORS = {
    SYNC: '#FFFFFF', // White
    MARK: '#00E5FF', // Cyan (Bit 1)
    SPACE: '#FF2A85', // Magenta (Bit 0)
    BLACK: '#000000'
};

export class OpticalTransmitter {
    constructor(canvasElement) {
        this.canvas = canvasElement;
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
        this.isTransmitting = false;
        this.torchTrack = null;
    }

    setCanvas(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }

    /**
     * Try to acquire device camera torch (LED flashlight)
     */
    async enableTorch() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });
            const track = stream.getVideoTracks()[0];
            const capabilities = track.getCapabilities ? track.getCapabilities() : {};
            if (capabilities.torch) {
                this.torchTrack = track;
                return true;
            }
        } catch {
            this.torchTrack = null;
        }
        return false;
    }

    async setTorchState(on) {
        if (this.torchTrack) {
            try {
                await this.torchTrack.applyConstraints({
                    advanced: [{ torch: on }]
                });
            } catch {}
        }
    }

    drawColor(color) {
        if (!this.ctx || !this.canvas) return;
        this.ctx.fillStyle = color;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * Transmit binary packets via high-contrast optical pulses
     * @param {Array<Uint8Array>} packets
     * @param {number} fps - Frame rate (e.g. 15-30 fps)
     * @param {Function} onProgress
     */
    async transmit(packets, fps = 20, onProgress = () => {}) {
        this.isTransmitting = true;
        const frameInterval = 1000 / fps;

        for (let p = 0; p < packets.length; p++) {
            if (!this.isTransmitting) break;
            const pkt = packets[p];
            onProgress(p + 1, packets.length, Math.round(((p + 1) / packets.length) * 100));

            // Sync pulse (White screen / Torch On for 100ms)
            this.drawColor(OPTICAL_COLORS.SYNC);
            await this.setTorchState(true);
            await new Promise(r => setTimeout(r, 100));

            // Black separation
            this.drawColor(OPTICAL_COLORS.BLACK);
            await this.setTorchState(false);
            await new Promise(r => setTimeout(r, 40));

            // Transmit bits of the packet
            for (let i = 0; i < pkt.length; i++) {
                const b = pkt[i];
                for (let bit = 7; bit >= 0; bit--) {
                    if (!this.isTransmitting) break;
                    const val = (b >> bit) & 1;
                    const color = val === 1 ? OPTICAL_COLORS.MARK : OPTICAL_COLORS.SPACE;

                    this.drawColor(color);
                    await this.setTorchState(val === 1);
                    await new Promise(r => setTimeout(r, frameInterval));
                }
            }

            // End of packet flash
            this.drawColor(OPTICAL_COLORS.BLACK);
            await this.setTorchState(false);
            await new Promise(r => setTimeout(r, 80));
        }

        this.drawColor(OPTICAL_COLORS.BLACK);
        await this.setTorchState(false);
        this.isTransmitting = false;
    }

    stop() {
        this.isTransmitting = false;
        if (this.torchTrack) {
            this.torchTrack.stop();
            this.torchTrack = null;
        }
    }
}

export class OpticalReceiver {
    constructor() {
        this.video = null;
        this.stream = null;
        this.isScanning = false;
        this.onByteReceived = null;
        this.onStatus = null;
    }

    async startScanning(videoElement, onByteReceived, onStatus = () => {}) {
        this.video = videoElement;
        this.onByteReceived = onByteReceived;
        this.onStatus = onStatus;

        this.stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: 'environment',
                width: { ideal: 640 },
                height: { ideal: 480 }
            }
        });

        this.video.srcObject = this.stream;
        await this.video.play();
        this.isScanning = true;
        this.onStatus('Capteur optique actif — Pointez vers l\'écran ou la lumière...');

        this.scanLoop();
    }

    scanLoop() {
        if (!this.isScanning || !this.video) return;

        const offCanvas = document.createElement('canvas');
        offCanvas.width = 64;
        offCanvas.height = 64;
        const ctx = offCanvas.getContext('2d');

        let bitBuffer = [];
        let state = 'WAIT_SYNC';
        let lastSampleTime = 0;

        const processFrame = () => {
            if (!this.isScanning) return;

            if (this.video.readyState === this.video.HAVE_ENOUGH_DATA) {
                // Sample center 64x64 area of camera feed
                ctx.drawImage(this.video, (this.video.videoWidth - 64) / 2, (this.video.videoHeight - 64) / 2, 64, 64, 0, 0, 64, 64);
                const frameData = ctx.getImageData(0, 0, 64, 64).data;

                let rSum = 0, gSum = 0, bSum = 0;
                for (let i = 0; i < frameData.length; i += 4) {
                    rSum += frameData[i];
                    gSum += frameData[i + 1];
                    bSum += frameData[i + 2];
                }
                const count = frameData.length / 4;
                const r = rSum / count;
                const g = gSum / count;
                const b = bSum / count;
                const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

                // Detect sync flash (high luminance across all channels)
                if (state === 'WAIT_SYNC') {
                    if (luminance > 220) {
                        state = 'SYNCED';
                        bitBuffer = [];
                        this.onStatus('Synchronisation optique acquise !');
                    }
                } else if (state === 'SYNCED') {
                    // Check for Cyan (Blue/Green dominant -> 1) vs Magenta (Red/Blue dominant -> 0)
                    const isCyan = (b > 120 && g > 120 && r < 100);
                    const isMagenta = (r > 120 && b > 120 && g < 100);

                    if (isCyan || isMagenta) {
                        const bit = isCyan ? 1 : 0;
                        bitBuffer.push(bit);

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
                    } else if (luminance < 30) {
                        // Dark guard frame
                    }
                }
            }

            requestAnimationFrame(processFrame);
        };

        requestAnimationFrame(processFrame);
    }

    stop() {
        this.isScanning = false;
        if (this.stream) {
            this.stream.getTracks().forEach(t => t.stop());
            this.stream = null;
        }
        if (this.video) {
            this.video.srcObject = null;
        }
        if (this.onStatus) this.onStatus('Capteur optique arrêté');
    }
}

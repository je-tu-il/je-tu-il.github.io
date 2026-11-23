/**
 * WaveDrop — Physical Data Link Protocol
 * Chunking, framing, CRC-8 integrity, and byte packet serialization.
 * Pure ES/Node module compatible.
 */

export const PACKET_TYPES = {
    TEXT: 0x01,
    IMAGE: 0x02,
    FILE: 0x03,
    HANDSHAKE: 0x04,
    ACK: 0x05,
    PING: 0x06
};

export const PREAMBLE = [0xAA, 0x55]; // 10101010 01010101 sync word

/**
 * Standard 8-bit CRC calculation (Polynomial 0x07: x^8 + x^2 + x + 1)
 */
export function crc8(byteArray) {
    let crc = 0x00;
    for (let i = 0; i < byteArray.length; i++) {
        crc ^= byteArray[i];
        for (let j = 0; j < 8; j++) {
            if ((crc & 0x80) !== 0) {
                crc = ((crc << 1) ^ 0x07) & 0xFF;
            } else {
                crc = (crc << 1) & 0xFF;
            }
        }
    }
    return crc;
}

/**
 * Encode raw data into a sequence of framed byte packets
 * @param {Uint8Array|string} data - Payload
 * @param {number} type - PACKET_TYPES enum
 * @param {Object} metadata - Optional filename, mimeType
 * @param {number} maxPayloadSize - Max bytes per chunk (default 32 for acoustic resilience)
 * @returns {Array<Uint8Array>} Array of complete packets
 */
export function encodePackets(data, type = PACKET_TYPES.TEXT, metadata = {}, maxPayloadSize = 32) {
    let payloadBytes;
    if (typeof data === 'string') {
        payloadBytes = new TextEncoder().encode(data);
    } else if (data instanceof Uint8Array) {
        payloadBytes = data;
    } else {
        payloadBytes = new Uint8Array(data);
    }

    // Embed metadata header into packet 0 if file or image
    let metaBytes = new Uint8Array(0);
    if (metadata && (metadata.name || metadata.mimeType)) {
        const metaStr = JSON.stringify({
            name: metadata.name || 'unnamed',
            mimeType: metadata.mimeType || 'application/octet-stream',
            size: payloadBytes.length
        });
        const metaEncoded = new TextEncoder().encode(metaStr);
        // Prefix with 2 bytes metadata length
        metaBytes = new Uint8Array(2 + metaEncoded.length);
        metaBytes[0] = (metaEncoded.length >> 8) & 0xFF;
        metaBytes[1] = metaEncoded.length & 0xFF;
        metaBytes.set(metaEncoded, 2);
    }

    const totalRaw = new Uint8Array(metaBytes.length + payloadBytes.length);
    totalRaw.set(metaBytes, 0);
    totalRaw.set(payloadBytes, metaBytes.length);

    const totalPackets = Math.max(1, Math.ceil(totalRaw.length / maxPayloadSize));
    const packets = [];

    for (let i = 0; i < totalPackets; i++) {
        const start = i * maxPayloadSize;
        const end = Math.min(start + maxPayloadSize, totalRaw.length);
        const chunk = totalRaw.slice(start, end);

        // Header: [PREAMBLE(2), TYPE(1), SEQ_HIGH(1), SEQ_LOW(1), TOTAL_HIGH(1), TOTAL_LOW(1), LEN(1)]
        // Header length = 2 + 1 + 2 + 2 + 1 = 8 bytes
        const header = new Uint8Array([
            PREAMBLE[0],
            PREAMBLE[1],
            type,
            (i >> 8) & 0xFF,
            i & 0xFF,
            (totalPackets >> 8) & 0xFF,
            totalPackets & 0xFF,
            chunk.length & 0xFF
        ]);

        // Compute CRC over Header + Chunk
        const packetBody = new Uint8Array(header.length + chunk.length);
        packetBody.set(header, 0);
        packetBody.set(chunk, header.length);

        const checksum = crc8(packetBody);

        // Final packet: packetBody + CRC (1 byte)
        const finalPacket = new Uint8Array(packetBody.length + 1);
        finalPacket.set(packetBody, 0);
        finalPacket[finalPacket.length - 1] = checksum;

        packets.push(finalPacket);
    }

    return packets;
}

/**
 * Decode a single raw packet and verify its CRC
 * @param {Uint8Array} rawBytes
 * @returns {Object|null} Decoded packet or null if invalid
 */
export function decodePacket(rawBytes) {
    if (!rawBytes || rawBytes.length < 9) return null; // Min: 2 preamble + 1 type + 4 seq + 1 len + 1 crc

    // Check preamble
    if (rawBytes[0] !== PREAMBLE[0] || rawBytes[1] !== PREAMBLE[1]) {
        return null;
    }

    const type = rawBytes[2];
    const seq = (rawBytes[3] << 8) | rawBytes[4];
    const total = (rawBytes[5] << 8) | rawBytes[6];
    const len = rawBytes[7];

    if (rawBytes.length !== 8 + len + 1) {
        return null; // Truncated or malformed
    }

    const payload = rawBytes.slice(8, 8 + len);
    const expectedCrc = rawBytes[rawBytes.length - 1];
    const actualCrc = crc8(rawBytes.slice(0, rawBytes.length - 1));

    if (expectedCrc !== actualCrc) {
        return null; // Checksum error
    }

    return {
        type,
        seq,
        total,
        payload
    };
}

/**
 * PacketReassembler gathers decoded packets, manages progress and builds final data
 */
export class PacketReassembler {
    constructor() {
        this.reset();
    }

    reset() {
        this.type = null;
        this.total = 0;
        this.chunks = new Map();
        this.metadata = null;
        this.isComplete = false;
        this.rawTotalBytes = 0;
    }

    /**
     * Add a decoded packet
     * @param {Object} pkt - Result from decodePacket
     * @returns {Object} { isComplete, progress, data, metadata, type }
     */
    addPacket(pkt) {
        if (!pkt) return { isComplete: false, progress: 0 };

        if (this.total === 0) {
            this.total = pkt.total;
            this.type = pkt.type;
        } else if (pkt.total !== this.total || pkt.type !== this.type) {
            // New transmission started
            this.reset();
            this.total = pkt.total;
            this.type = pkt.type;
        }

        this.chunks.set(pkt.seq, pkt.payload);
        const progress = Math.min(100, Math.round((this.chunks.size / this.total) * 100));

        if (this.chunks.size === this.total) {
            this.isComplete = true;
            return this.buildResult();
        }

        return {
            isComplete: false,
            progress,
            receivedChunks: this.chunks.size,
            totalChunks: this.total
        };
    }

    buildResult() {
        // Concatenate all chunks in order
        let totalLen = 0;
        for (let i = 0; i < this.total; i++) {
            totalLen += (this.chunks.get(i) || new Uint8Array(0)).length;
        }

        const assembled = new Uint8Array(totalLen);
        let offset = 0;
        for (let i = 0; i < this.total; i++) {
            const chunk = this.chunks.get(i) || new Uint8Array(0);
            assembled.set(chunk, offset);
            offset += chunk.length;
        }

        // Check if there is metadata prefix (for Image or File)
        let finalData = assembled;
        let metadata = null;

        if (this.type === PACKET_TYPES.IMAGE || this.type === PACKET_TYPES.FILE) {
            if (assembled.length >= 2) {
                const metaLen = (assembled[0] << 8) | assembled[1];
                if (assembled.length >= 2 + metaLen) {
                    try {
                        const metaJson = new TextDecoder().decode(assembled.slice(2, 2 + metaLen));
                        metadata = JSON.parse(metaJson);
                        finalData = assembled.slice(2 + metaLen);
                    } catch {
                        metadata = null;
                    }
                }
            }
        }

        let text = null;
        let dataUrl = null;

        if (this.type === PACKET_TYPES.TEXT) {
            text = new TextDecoder().decode(finalData);
        } else if (this.type === PACKET_TYPES.IMAGE) {
            const mime = (metadata && metadata.mimeType) ? metadata.mimeType : 'image/png';
            // Base64 helper
            let binary = '';
            for (let i = 0; i < finalData.length; i++) {
                binary += String.fromCharCode(finalData[i]);
            }
            if (typeof btoa !== 'undefined') {
                dataUrl = `data:${mime};base64,` + btoa(binary);
            } else {
                dataUrl = `data:${mime};base64,` + Buffer.from(finalData).toString('base64');
            }
        }

        return {
            isComplete: true,
            progress: 100,
            type: this.type,
            metadata,
            bytes: finalData,
            text,
            dataUrl
        };
    }
}

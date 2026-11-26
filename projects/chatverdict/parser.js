/**
 * ChatVerdict — Conversation Parser
 * Supports WhatsApp (iOS & Android exports), Instagram DMs (JSON & text), and standard dialogue.
 */

export function parseConversation(rawText) {
    if (!rawText || typeof rawText !== 'string') return [];

    if (rawText.trimStart().startsWith('{')) {
        const imported = readInstagramMessages(rawText);
        if (imported !== null) return imported;
    }

    const lines = rawText.split(/\r?\n/);
    const messages = [];

    // WhatsApp iOS: [21/11/2026, 14:30:15] Prénom: Message
    const regexWhatsAppIOS = /^\[(\d{1,2}\/\d{1,2}\/\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?)\]\s+([^:]+):\s+(.*)$/;

    // WhatsApp Android: 21/11/2026, 14:30 - Prénom: Message
    const regexWhatsAppAndroid = /^(\d{1,2}\/\d{1,2}\/\d{2,4}),?\s+(\d{1,2}:\d{2})\s+-\s+([^:]+):\s+(.*)$/;

    // Generic Dialogue: Prénom: Message
    const regexGeneric = /^([A-Za-z0-9_\u00C0-\u017F\s]{2,25}):\s+(.*)$/;

    let lastMessage = null;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        let match = line.match(regexWhatsAppIOS);
        if (match) {
            const dateStr = match[1];
            const timeStr = match[2];
            const sender = match[3].trim();
            const text = match[4].trim();
            lastMessage = { sender, text, timestamp: `${dateStr} ${timeStr}`, index: i };
            messages.push(lastMessage);
            continue;
        }

        match = line.match(regexWhatsAppAndroid);
        if (match) {
            const dateStr = match[1];
            const timeStr = match[2];
            const sender = match[3].trim();
            const text = match[4].trim();
            lastMessage = { sender, text, timestamp: `${dateStr} ${timeStr}`, index: i };
            messages.push(lastMessage);
            continue;
        }

        match = line.match(regexGeneric);
        if (match && !lastMessage?.timestamp && !line.startsWith('http://') && !line.startsWith('https://')) {
            const sender = match[1].trim();
            const text = match[2].trim();
            lastMessage = { sender, text, timestamp: null, index: i };
            messages.push(lastMessage);
            continue;
        }

        // Multi-line continuation of last message
        if (lastMessage) {
            lastMessage.text += '\n' + line;
        }
    }

    return messages.map(message => createMessageObj(message.sender, message.text, message.timestamp, message.index));
}

function readInstagramMessages(rawText) {
    let data;
    try {
        data = JSON.parse(rawText);
    } catch {
        return null;
    }
    if (!Array.isArray(data?.messages)) return null;

    const messages = data.messages.flatMap((entry, index) => {
        if (typeof entry?.sender_name !== 'string' || typeof entry.content !== 'string') return [];
        const sender = entry.sender_name.trim();
        const text = entry.content.trim();
        if (!sender || !text) return [];
        const candidate = Number.isFinite(entry.timestamp_ms) ? new Date(entry.timestamp_ms) : null;
        const date = candidate && Number.isFinite(candidate.getTime()) ? candidate : null;
        return [{ sender, text, date, index }];
    });
    messages.sort((first, second) => {
        const firstTime = first.date?.getTime() ?? Infinity;
        const secondTime = second.date?.getTime() ?? Infinity;
        return firstTime === secondTime ? first.index - second.index : firstTime - secondTime;
    });
    return messages.map(({ sender, text, date, index }) =>
        createMessageObj(sender, text, date?.toISOString() ?? null, index)
    );
}

function createMessageObj(sender, text, timestampStr, lineIndex) {
    const words = text.split(/\s+/).filter(Boolean);
    const emojiRegex = /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
    const emojis = text.match(emojiRegex) || [];

    return {
        id: `msg_${lineIndex}`,
        sender,
        text,
        timestampStr,
        wordCount: words.length,
        charCount: text.length,
        emojiCount: emojis.length,
        isQuestion: text.includes('?') || text.includes('pourquoi') || text.includes('comment'),
        hasAllCaps: words.some(w => w.length > 2 && w === w.toUpperCase() && /[A-Z]/.test(w))
    };
}

/**
 * ChatVerdict — Conversation Parser
 * Supports WhatsApp (iOS & Android exports), Instagram DMs (JSON & text), and standard dialogue.
 */

export function parseConversation(rawText) {
    if (!rawText || typeof rawText !== 'string') return [];

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
            lastMessage = createMessageObj(sender, text, `${dateStr} ${timeStr}`, i);
            messages.push(lastMessage);
            continue;
        }

        match = line.match(regexWhatsAppAndroid);
        if (match) {
            const dateStr = match[1];
            const timeStr = match[2];
            const sender = match[3].trim();
            const text = match[4].trim();
            lastMessage = createMessageObj(sender, text, `${dateStr} ${timeStr}`, i);
            messages.push(lastMessage);
            continue;
        }

        match = line.match(regexGeneric);
        if (match && !line.startsWith('http://') && !line.startsWith('https://')) {
            const sender = match[1].trim();
            const text = match[2].trim();
            lastMessage = createMessageObj(sender, text, null, i);
            messages.push(lastMessage);
            continue;
        }

        // Multi-line continuation of last message
        if (lastMessage) {
            lastMessage.text += '\n' + line;
            lastMessage.wordCount += line.split(/\s+/).filter(Boolean).length;
        }
    }

    return messages;
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

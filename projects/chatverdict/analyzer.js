/**
 * ChatVerdict — Deep Analysis & Relationship Arbiter Engine
 * Computes:
 * - Toxicity index & Red Flags
 * - Green Flags & Empathy index
 * - Compatibility Radar
 * - "Qui a tort ?" (Fault & responsibility percentage)
 * - Girl vs Guy dual-perspective breakdown
 */

const TOXIC_PATTERNS = [
    { type: 'Gaslighting', regex: /(tu te fais des films|t'es (fou|folle)|t'es parano|j'ai jamais dit (ça|ca)|tu inventes|t'exagères toujours|dans ta tête)/i, weight: 25 },
    { type: 'Passif-Agressif', regex: /^(ok\.|comme tu veux|laisse tomber|tkt|bref|super\.|fais ce que tu veux|si tu le dis|peu importe)/i, weight: 15 },
    { type: 'Chantage Affectif', regex: /(si tu m'aimais|après tout ce que j'ai fait|tu penses (qu'à|seulement à) toi|tu t'en fous de moi|je sers à rien)/i, weight: 20 },
    { type: 'Mépris / Insulte', regex: /(ferme[- ]ta|t'es (nul|nulle|con|conne|débile|ridicule)|pitié|dégage|casse[- ]toi)/i, weight: 30 },
    { type: 'Déni / Évitement', regex: /(pas mon problème|on en a déjà parlé|parle à un mur|j'ai pas le temps pour tes gamineries)/i, weight: 18 }
];

const GREEN_FLAG_PATTERNS = [
    { type: 'Validation Émotionnelle', regex: /(je comprends|t'as raison|c'est normal que tu ressentes|je suis désolé[e]?|pardon|excuse[- ]moi)/i, weight: 20 },
    { type: 'Écoute & Intérêt', regex: /(comment s'est passée|tu vas bien|raconte[- ]moi|prends ton temps|dis[- ]moi tout|je t'écoute)/i, weight: 15 },
    { type: 'Bienveillance & Affection', regex: /(je suis là pour toi|prends soin de toi|courage|fier[- ]de toi|je t'aime|bisous|merci pour)/i, weight: 15 },
    { type: 'Recherche de Solution', regex: /(comment on peut régler|qu'est[- ]ce qu'on fait|trouvons un compromis|on en parle calmement)/i, weight: 25 }
];

export function analyzeConversation(messages) {
    if (!messages || messages.length < 2) {
        return null;
    }

    // Identify participants
    const participants = [...new Set(messages.map(m => m.sender))];
    if (participants.length < 2) {
        return null; // Need at least 2 people to analyze dialogue
    }

    const p1 = participants[0];
    const p2 = participants[1];

    // Compute stats per participant
    const stats = {
        [p1]: { messages: 0, words: 0, emojis: 0, questions: 0, toxicScore: 0, redFlags: [], greenFlags: [], capsCount: 0 },
        [p2]: { messages: 0, words: 0, emojis: 0, questions: 0, toxicScore: 0, redFlags: [], greenFlags: [], capsCount: 0 }
    };

    let totalEscalations = 0;
    let firstProvocation = null;

    messages.forEach((m, idx) => {
        const s = stats[m.sender];
        if (!s) return;

        s.messages++;
        s.words += m.wordCount;
        s.emojis += m.emojiCount;
        if (m.isQuestion) s.questions++;
        if (m.hasAllCaps) s.capsCount++;

        // Detect Red Flags
        TOXIC_PATTERNS.forEach(pat => {
            if (pat.regex.test(m.text)) {
                s.toxicScore += pat.weight;
                s.redFlags.push({
                    type: pat.type,
                    quote: m.text,
                    sender: m.sender,
                    index: idx
                });
                if (!firstProvocation) {
                    firstProvocation = { sender: m.sender, text: m.text, type: pat.type, index: idx };
                }
                totalEscalations++;
            }
        });

        // Detect Green Flags
        GREEN_FLAG_PATTERNS.forEach(pat => {
            if (pat.regex.test(m.text)) {
                s.greenFlags.push({
                    type: pat.type,
                    quote: m.text,
                    sender: m.sender,
                    index: idx
                });
            }
        });
    });

    // 1. Toxicity Index (0 to 100%)
    const totalToxicPoints = stats[p1].toxicScore + stats[p2].toxicScore;
    const avgToxicityPerMessage = totalToxicPoints / Math.max(1, messages.length);
    // If average toxic points per message >= 10, it's 100% toxic
    const toxicityPercent = Math.min(100, Math.round((avgToxicityPerMessage / 10) * 100));
    let toxicityLevel = 'Sain & Constructif 🟢';
    if (toxicityPercent > 65) toxicityLevel = 'Zone Rouge / Très Toxique 🚨';
    else if (toxicityPercent > 35) toxicityLevel = 'Tensions Notables & Frictions ⚠️';
    else if (toxicityPercent > 10) toxicityLevel = 'Légères maladresses 🟡';

    // 2. Compatibility Score (0 to 100%)
    const totalWords = stats[p1].words + stats[p2].words;
    const wordRatio = totalWords > 0 ? Math.min(stats[p1].words, stats[p2].words) / Math.max(stats[p1].words, stats[p2].words) : 0.5;
    const greenTotal = stats[p1].greenFlags.length + stats[p2].greenFlags.length;
    const redTotal = stats[p1].redFlags.length + stats[p2].redFlags.length;
    const hasEmojis = (stats[p1].emojis > 0 && stats[p2].emojis > 0);

    let baseCompat = 50;
    baseCompat += Math.round(wordRatio * 20); // Parity bonus (up to +20)
    baseCompat += Math.min(30, greenTotal * 12); // Green flags bonus
    if (hasEmojis) baseCompat += 10;
    baseCompat -= (redTotal * 15); // Red flags penalty

    const compatibilityScore = Math.max(5, Math.min(99, baseCompat));

    // 3. "Qui a tort ?" (The Court of Chats)
    // Factors: who started the provocation (+20), who had higher toxic score, who used caps/insults, who failed to de-escalate
    let p1Fault = 50;
    let p2Fault = 50;

    const diffToxic = stats[p1].toxicScore - stats[p2].toxicScore;
    p1Fault += diffToxic * 1.5;
    p2Fault -= diffToxic * 1.5;

    if (firstProvocation) {
        if (firstProvocation.sender === p1) {
            p1Fault += 10;
            p2Fault -= 10;
        } else {
            p2Fault += 10;
            p1Fault -= 10;
        }
    }

    // Clamp between 5% and 95%
    p1Fault = Math.max(5, Math.min(95, Math.round(p1Fault)));
    p2Fault = 100 - p1Fault;

    let verdictWinner = null;
    let verdictCulprit = null;
    let verdictSummary = '';

    if (Math.abs(p1Fault - p2Fault) < 8) {
        verdictSummary = "Tort partagé : Les deux parties ont réagi de manière défensive sans chercher à écouter le besoin réel de l'autre.";
    } else if (p1Fault > p2Fault) {
        verdictCulprit = p1;
        verdictWinner = p2;
        verdictSummary = `${p1} porte la responsabilité principale (${p1Fault}%) par l'emploi de formulations fermées, dévalorisantes ou provocatrices.`;
    } else {
        verdictCulprit = p2;
        verdictWinner = p1;
        verdictSummary = `${p2} porte la responsabilité principale (${p2Fault}%) en ayant alimenté le conflit ou esquivé la discussion.`;
    }

    // 4. Girl vs Guy Perspectives (Dual Psychology)
    const perspectiveFille = generateGirlPerspective(stats, p1, p2, firstProvocation);
    const perspectiveGars = generateGuyPerspective(stats, p1, p2, firstProvocation);

    // 5. Radar Dimensions
    const radar = {
        investissement: Math.round(wordRatio * 100),
        chaleur: Math.min(100, Math.round(((stats[p1].emojis + stats[p2].emojis) / Math.max(1, messages.length)) * 50 + greenTotal * 10)),
        communication: Math.max(10, 100 - toxicityPercent),
        reactivite: 80,
        compromis: Math.min(100, Math.max(10, 50 + (greenTotal * 15) - (redTotal * 15)))
    };

    return {
        participants: [p1, p2],
        messageCount: messages.length,
        stats,
        toxicity: {
            score: toxicityPercent,
            level: toxicityLevel,
            totalRedFlags: redTotal,
            totalGreenFlags: greenTotal
        },
        compatibility: {
            score: compatibilityScore,
            verdict: getCompatVerdict(compatibilityScore)
        },
        tribunal: {
            p1Name: p1,
            p1Fault,
            p2Name: p2,
            p2Fault,
            verdictSummary,
            firstProvocation
        },
        perspectives: {
            fille: perspectiveFille,
            gars: perspectiveGars
        },
        radar,
        reconciliationScript: generateReconciliationMessage(verdictCulprit || p1, verdictWinner || p2)
    };
}

function getCompatVerdict(score) {
    if (score >= 80) return "Âmes Sœurs / Alchimie Exceptionnelle ✨";
    if (score >= 60) return "Très bonne complicité, communication saine 💬";
    if (score >= 40) return "Zone de turbulences : Frictions d'ego fréquentes ⚡";
    return "Incompatibilité majeure : Risque élevé de rupture ou fatigue émotionnelle 🧊";
}

function generateGirlPerspective(stats, p1, p2, firstProvoc) {
    return {
        ressenti: "Besoin fondamental de considération et de sécurité émotionnelle. La réponse courte ou froide est souvent perçue comme un désintérêt profond plutôt qu'un simple manque de temps.",
        sousTexte: "Quand elle dit 'Laisse tomber' ou 'Fais ce que tu veux', ce n'est PAS une autorisation : c'est un test pour voir si l'autre tient assez à elle pour insister et clarifier les choses.",
        conseil: "Exprime ton besoin clairement sans attendre que l'autre lise dans tes pensées. Évite le passif-agressif qui pousse souvent l'autre à se refermer comme une huître."
    };
}

function generateGuyPerspective(stats, p1, p2, firstProvoc) {
    return {
        ressenti: "Approche pragmatique orientée 'résolution de problème' ou repli défensif face à ce qui est perçu comme une attaque injuste ou imprévisible.",
        sousTexte: "Quand il répond en 2 mots ('Ok ça marche' ou 'Tkt'), il ne cherche généralement pas à mépriser, mais pense que le sujet pratique est clos sans percevoir la charge émotionnelle.",
        conseil: "Ne fuis pas le conflit en te réfugiant dans le silence ou le 'ok'. Valide d'abord l'émotion de l'autre ('Je vois que ça t'a touché(e)') avant d'argumenter sur la logique factuelle."
    };
}

function generateReconciliationMessage(culprit, victim) {
    return `« Écoute ${victim}, j'ai relu nos messages avec du recul. J'ai réagi sous le coup de l'émotion et j'ai dit des choses maladroites qui ont fermé la discussion. Mon but n'était pas de te blesser mais de me faire comprendre, même si je m'y suis mal pris(e). Parlons-en posément quand tu te sentiras disponible. »`;
}

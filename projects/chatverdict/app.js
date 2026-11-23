import { parseConversation } from './parser.js';
import { analyzeConversation } from './analyzer.js';

const PRESETS = {
    toxic: `Clara: Pourquoi tu as annulé notre soirée au dernier moment ? J'avais tout réservé...
Lucas: Mais tu te fais des films encore une fois ! J'ai jamais confirmé pour ce soir, t'es parano.
Clara: Regarde tes messages d'hier, tu m'as écrit "Vendredi 20h parfait mon cœur" !
Lucas: Bref, commence pas tes crises d'hystérie. Tu penses qu'à toi, t'es ridicule.
Clara: Je ne fais pas de crise, je te demande juste du respect.
Lucas: Laisse tomber, parle à un mur, j'ai pas le temps pour tes gamineries. Dégage.`,

    household: `Emma: Tu as encore oublié d'acheter le lait et de vider le lave-vaisselle...
Antoine: J'ai fini à 20h avec les transports bloqués sous la pluie. Je pouvais pas tout faire.
Emma: Ça fait 3 fois cette semaine, c'est toujours moi qui gère toute la logistique de l'appart !
Antoine: Je comprends que tu sois fatiguée, mais ne dis pas que je fais rien, j'ai fait toutes les machines mercredi.
Emma: Oui t'as raison pour les machines pardon, mais là je suis épuisée.
Antoine: On souffle, je commande des sushis pour ce soir et je gère la cuisine promis ?
Emma: D'accord merci ❤️ désolée d'avoir haussé le ton.`,

    flirt: `Sarah: Coucou toi ! Bien rentré hier après le restau ? 🥰
Thomas: Coucou Sarah ! Oui super bien, et encore merci pour la discussion c'était magique.
Sarah: Tellement d'accord ! Tu m'as fait mourir de rire avec ton histoire de voyage en Italie 😂
Thomas: Haha attends de voir les photos ! Tu as des plans ce week-end ? J'aimerais beaucoup te revoir.
Sarah: Rien de prévu, je me libère direct pour toi ! Dis-moi où et quand ✨
Thomas: Vendredi soir, je t'emmène dans un endroit secret que tu vas adorer ! Prends soin de toi en attendant.`,

    cold: `Maxime: Salut Léa ! J'espère que tu as passé une bonne semaine ? Tu fais quoi de beau ce soir ?
Léa: Slt rien
Maxime: Ah d'accord ! Si ça te dit on peut aller boire un verre avec les autres vers 21h ?
Léa: Non flemme
Maxime: Pas de souci, dis-moi si tu veux qu'on se cale un autre jour alors !
Léa: Ok`
};

document.addEventListener('DOMContentLoaded', () => {
    initPresets();
    initAnalyzeButton();
    initDropzone();
    // Run default analysis on first preset
    runAnalysis(PRESETS.toxic);
});

function initPresets() {
    const chips = document.querySelectorAll('.preset-chip');
    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            const presetKey = chip.dataset.preset;
            if (PRESETS[presetKey]) {
                document.getElementById('chatInput').value = PRESETS[presetKey];
                runAnalysis(PRESETS[presetKey]);
            }
        });
    });
}

function initAnalyzeButton() {
    const btn = document.getElementById('btnAnalyze');
    btn.addEventListener('click', () => {
        const text = document.getElementById('chatInput').value.trim();
        if (!text) {
            alert("Veuillez coller une conversation ou choisir un exemple.");
            return;
        }
        runAnalysis(text);
    });
}

function initDropzone() {
    const dropzone = document.getElementById('fileDropArea');
    const fileInput = document.getElementById('fileInputUpload');

    if (dropzone && fileInput) {
        dropzone.addEventListener('click', () => fileInput.click());
        dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropzone.style.borderColor = 'var(--accent-pink)';
        });
        dropzone.addEventListener('dragleave', () => {
            dropzone.style.borderColor = 'var(--border)';
        });
        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.style.borderColor = 'var(--border)';
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                readFile(e.dataTransfer.files[0]);
            }
        });

        fileInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                readFile(e.target.files[0]);
            }
        });
    }

    function readFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('chatInput').value = e.target.result;
            runAnalysis(e.target.result);
        };
        reader.readAsText(file);
    }
}

function runAnalysis(rawText) {
    const messages = parseConversation(rawText);
    if (messages.length < 2) {
        alert("La conversation doit comporter au moins 2 messages échangés entre 2 personnes.");
        return;
    }

    const result = analyzeConversation(messages);
    if (!result) {
        alert("Impossible de déterminer 2 participants distincts (format: Prénom: Message).");
        return;
    }

    renderDashboard(result, messages);
}

function renderDashboard(res, messages) {
    const resultsContainer = document.getElementById('resultsSection');
    resultsContainer.style.display = 'block';

    // 1. Metric Gauges
    document.getElementById('toxicScoreValue').textContent = `${res.toxicity.score}%`;
    document.getElementById('toxicLevelBadge').textContent = res.toxicity.level;

    document.getElementById('compatScoreValue').textContent = `${res.compatibility.score}%`;
    document.getElementById('compatVerdictLabel').textContent = res.compatibility.verdict;

    // 2. Tribunal: Qui a tort ?
    const t = res.tribunal;
    document.getElementById('tribunalLabelP1').textContent = `${t.p1Name} (${t.p1Fault}%)`;
    document.getElementById('tribunalLabelP2').textContent = `${t.p2Name} (${t.p2Fault}%)`;
    document.getElementById('tribunalBarP1').style.width = `${t.p1Fault}%`;
    document.getElementById('tribunalBarP2').style.width = `${t.p2Fault}%`;
    document.getElementById('tribunalSummaryText').textContent = t.verdictSummary;

    const provocEl = document.getElementById('firstProvocationCard');
    if (t.firstProvocation) {
        provocEl.style.display = 'block';
        document.getElementById('provocationSender').textContent = t.firstProvocation.sender;
        document.getElementById('provocationType').textContent = `[${t.firstProvocation.type}]`;
        document.getElementById('provocationQuote').textContent = `« ${t.firstProvocation.text} »`;
    } else {
        provocEl.style.display = 'none';
    }

    // 3. Perspectives Fille vs Gars
    document.getElementById('filleRessenti').textContent = res.perspectives.fille.ressenti;
    document.getElementById('filleSousTexte').textContent = res.perspectives.fille.sousTexte;
    document.getElementById('filleConseil').textContent = res.perspectives.fille.conseil;

    document.getElementById('garsRessenti').textContent = res.perspectives.gars.ressenti;
    document.getElementById('garsSousTexte').textContent = res.perspectives.gars.sousTexte;
    document.getElementById('garsConseil').textContent = res.perspectives.gars.conseil;

    // 4. Flags list
    renderFlagsList(res);

    // 5. Reconciliation Message
    document.getElementById('reconciliationScriptText').textContent = res.reconciliationScript;
    const btnCopy = document.getElementById('btnCopyReconciliation');
    btnCopy.onclick = () => {
        navigator.clipboard.writeText(res.reconciliationScript);
        btnCopy.textContent = "✅ Copié dans le presse-papier !";
        setTimeout(() => { btnCopy.textContent = "📋 Copier le message d'apaisement"; }, 2500);
    };

    // 6. Styled Chat Stream Bubbles
    renderChatStream(messages, res.participants);

    // Scroll smoothly to results
    resultsContainer.scrollIntoView({ behavior: 'smooth' });
}

function renderFlagsList(res) {
    const redContainer = document.getElementById('redFlagsList');
    const greenContainer = document.getElementById('greenFlagsList');
    redContainer.innerHTML = '';
    greenContainer.innerHTML = '';

    const p1 = res.participants[0];
    const p2 = res.participants[1];
    const allReds = [...res.stats[p1].redFlags, ...res.stats[p2].redFlags];
    const allGreens = [...res.stats[p1].greenFlags, ...res.stats[p2].greenFlags];

    if (allReds.length === 0) {
        redContainer.innerHTML = '<div style="color: var(--accent-green); font-size: 0.9rem;">✨ Aucun drapeau rouge détecté ! Communication respectueuse.</div>';
    } else {
        allReds.forEach(rf => {
            const div = document.createElement('div');
            div.className = 'flag-item';
            div.innerHTML = `
                <div style="font-weight: 700; color: var(--accent-red);">🚩 ${rf.type} <span style="font-size: 0.75rem; color: var(--text-muted);">par ${rf.sender}</span></div>
                <div class="flag-quote">« ${rf.quote} »</div>
            `;
            redContainer.appendChild(div);
        });
    }

    if (allGreens.length === 0) {
        greenContainer.innerHTML = '<div style="color: var(--text-muted); font-size: 0.9rem;">Peu de marqueurs d\'empathie explicites dans cet échange.</div>';
    } else {
        allGreens.forEach(gf => {
            const div = document.createElement('div');
            div.className = 'flag-item';
            div.innerHTML = `
                <div style="font-weight: 700; color: var(--accent-green);">🟢 ${gf.type} <span style="font-size: 0.75rem; color: var(--text-muted);">par ${gf.sender}</span></div>
                <div class="flag-quote">« ${gf.quote} »</div>
            `;
            greenContainer.appendChild(div);
        });
    }
}

function renderChatStream(messages, participants) {
    const container = document.getElementById('chatStreamContainer');
    container.innerHTML = '';

    const firstSender = participants[0];

    messages.forEach(m => {
        const isLeft = (m.sender === firstSender);
        const bubble = document.createElement('div');
        bubble.className = `chat-bubble ${isLeft ? 'bubble-left' : 'bubble-right'}`;
        bubble.innerHTML = `
            <div class="bubble-sender">${m.sender}</div>
            <div>${m.text.replace(/\n/g, '<br>')}</div>
        `;
        container.appendChild(bubble);
    });
}

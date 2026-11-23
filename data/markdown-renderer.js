/**
 * Markdown Renderer autonome et ultra-léger (Local-first)
 * Convertit le Markdown en HTML sémantique et élégant sans dépendance externe
 */
(function(root, factory) {
  var fn = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = fn;
  }
  if (typeof root !== 'undefined') {
    root.renderMarkdown = fn;
  }
})(typeof self !== 'undefined' ? self : typeof window !== 'undefined' ? window : this, function() {
  'use strict';

  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderMarkdown(md) {
    if (!md || typeof md !== 'string') return '';

    let text = md.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');

    // 1. Extraire les blocs de code multi-lignes pour préserver le formatage
    const codeBlocks = [];
    text = text.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, function(_, lang, code) {
      const idx = codeBlocks.length;
      const cleanLang = (lang || 'sh').toLowerCase();
      const escapedCode = escapeHtml(code.trimEnd());
      codeBlocks.push(
        '<div class="code-block-wrapper">' +
          '<div class="code-header">' +
            '<span class="code-lang">' + cleanLang + '</span>' +
            '<button class="copy-code-btn" type="button" onclick="navigator.clipboard && navigator.clipboard.writeText(this.closest(\'.code-block-wrapper\').querySelector(\'code\').innerText).then(() => { this.textContent=\'Copié !\'; setTimeout(() => this.textContent=\'Copier\', 2000); })">Copier</button>' +
          '</div>' +
          '<pre><code class="language-' + cleanLang + '">' + escapedCode + '</code></pre>' +
        '</div>'
      );
      return '@@CODE_BLOCK_' + idx + '@@';
    });

    // 2. Extraire et convertir les tableaux GitHub Markdown
    text = text.replace(/(?:^|\n)(\|.+?\|\n\|[-: |]+\|\n(?:\|.+?\|\n?)+)/g, function(_, tableBlock) {
      const lines = tableBlock.trim().split('\n');
      if (lines.length < 2) return tableBlock;
      
      const headers = lines[0].split('|').map(s => s.trim()).filter((s, i, arr) => i > 0 && i < arr.length - 1);
      let out = '<div class="table-responsive"><table class="markdown-table"><thead><tr>';
      for (const h of headers) {
        out += '<th>' + renderInline(h) + '</th>';
      }
      out += '</tr></thead><tbody>';

      for (let i = 2; i < lines.length; i++) {
        const cells = lines[i].split('|').map(s => s.trim()).filter((s, idx, arr) => idx > 0 && idx < arr.length - 1);
        if (cells.length > 0) {
          out += '<tr>';
          for (const c of cells) {
            out += '<td>' + renderInline(c) + '</td>';
          }
          out += '</tr>';
        }
      }
      out += '</tbody></table></div>';
      return '\n' + out + '\n';
    });

    // 3. Citations & GitHub Alerts (> [!NOTE], > [!TIP], > [!IMPORTANT], > [!WARNING])
    text = text.replace(/(?:^|\n)(>+[^\n]*(?:\n>+[^\n]*)*)/g, function(_, quoteBlock) {
      const rawLines = quoteBlock.split('\n').map(l => l.replace(/^>+\s?/, ''));
      let alertType = 'note';
      let cleanLines = [];

      for (let i = 0; i < rawLines.length; i++) {
        const m = rawLines[i].match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/i);
        if (i === 0 && m) {
          alertType = m[1].toLowerCase();
        } else {
          cleanLines.push(renderInline(rawLines[i]));
        }
      }

      return '\n<blockquote class="markdown-quote alert-' + alertType + '">' +
        cleanLines.join('<br>') +
      '</blockquote>\n';
    });

    // 4. Titres (# Titre)
    text = text.replace(/^(#{1,6})\s+(.+)$/gm, function(_, hashes, title) {
      const level = hashes.length;
      return '<h' + level + ' class="md-h' + level + '">' + renderInline(title) + '</h' + level + '>';
    });

    // 5. Lignes horizontales
    text = text.replace(/^(?:---|\*\*\*|___)$/gm, '<hr class="md-divider">');

    // 6. Listes à puces et numérotées
    text = text.replace(/(?:^|\n)((?:[-*]\s+.+(?:\n|$))+)/g, function(_, listBlock) {
      const items = listBlock.trim().split('\n').map(l => {
        let clean = l.replace(/^[-*]\s+/, '').trim();
        // Support check-boxes
        if (clean.startsWith('[ ] ')) {
          return '<li class="task-item"><input type="checkbox" disabled> ' + renderInline(clean.slice(4)) + '</li>';
        } else if (clean.startsWith('[x] ') || clean.startsWith('[X] ')) {
          return '<li class="task-item"><input type="checkbox" checked disabled> ' + renderInline(clean.slice(4)) + '</li>';
        }
        return '<li>' + renderInline(clean) + '</li>';
      });
      return '\n<ul class="md-list">' + items.join('') + '</ul>\n';
    });

    text = text.replace(/(?:^|\n)((?:\d+\.\s+.+(?:\n|$))+)/g, function(_, listBlock) {
      const items = listBlock.trim().split('\n').map(l => {
        return '<li>' + renderInline(l.replace(/^\d+\.\s+/, '').trim()) + '</li>';
      });
      return '\n<ol class="md-ol">' + items.join('') + '</ol>\n';
    });

    // 7. Paragraphes
    const blocks = text.split(/\n{2,}/);
    const parsedBlocks = blocks.map(function(blk) {
      const trimmed = blk.trim();
      if (!trimmed) return '';
      if (/^(<(h[1-6]|div|table|ul|ol|blockquote|hr|pre)|@@CODE_BLOCK_)/i.test(trimmed)) {
        return trimmed;
      }
      return '<p class="md-p">' + renderInline(trimmed).replace(/\n/g, '<br>') + '</p>';
    });

    let result = parsedBlocks.join('\n');

    // 8. Restaurer les blocs de code
    for (let i = 0; i < codeBlocks.length; i++) {
      result = result.replace('@@CODE_BLOCK_' + i + '@@', codeBlocks[i]);
    }

    return result;
  }

  function renderInline(str) {
    if (!str) return '';
    let s = str;

    // Code en ligne `code`
    s = s.replace(/`([^`\n]+)`/g, function(_, code) {
      return '<code class="inline-code">' + escapeHtml(code) + '</code>';
    });

    // Images ![alt](url)
    s = s.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="md-img" loading="lazy">');

    // Liens [text](url)
    s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="md-link">$1</a>');

    // Formatage gras & italique
    s = s.replace(/\*\*\*([^\*]+)\*\*\*/g, '<strong><em>$1</em></strong>');
    s = s.replace(/\*\*([^\*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/\*([^\*]+)\*/g, '<em>$1</em>');
    s = s.replace(/~~([^~]+)~~/g, '<del>$1</del>');

    return s;
  }

  return renderMarkdown;
});

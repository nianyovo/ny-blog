// Zero-dependency GFM+ Markdown & Frontmatter Engine
// Supports:
// - Frontmatter (YAML subset)
// - Headings H1–H4 (# .. ####) + Auto TOC
// - Fenced Code Blocks (```lang) & Display Math Blocks ($$ ... $$)
// - GitHub/Obsidian Callouts (> [!NOTE|TIP|IMPORTANT|WARNING|CAUTION] Title)
// - Collapsible Details Blocks (:::details Title ... :::)
// - Bookmark Link Cards (:::bookmark Title | https://... | Description)
// - GFM Tables with Column Alignment (:---, :---:, ---:)
// - Task Lists (- [ ] / - [x]), Unordered Lists, Ordered Lists, Blockquotes, HR
// - Rich Inline: **bold**, *italic*, ++underline++, ~~strike~~, ==highlight==,
//   ||spoiler||, [[kbd]], ^sup^, ~sub~, $inline math$, `code`, [^fn] footnotes,
//   Images / Audio / Video (![cap](src)), Links & Autolinks

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function parseFrontmatter(raw, fallbackMeta = {}) {
  const normalized = String(raw || '').replace(/\r\n/g, '\n');
  let meta = {};
  let body = normalized;

  if (normalized.startsWith('---\n')) {
    const endIdx = normalized.indexOf('\n---\n', 4);
    if (endIdx !== -1) {
      const fmBlock = normalized.slice(4, endIdx);
      body = normalized.slice(endIdx + 5);
      for (const line of fmBlock.split('\n')) {
        const colonIdx = line.indexOf(':');
        if (colonIdx === -1) continue;
        const key = line.slice(0, colonIdx).trim();
        let val = line.slice(colonIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (val === 'true') meta[key] = true;
        else if (val === 'false') meta[key] = false;
        else if (val.startsWith('[') && val.endsWith(']')) {
          meta[key] = val
            .slice(1, -1)
            .split(',')
            .map(s => s.trim().replace(/^["']|["']$/g, ''))
            .filter(Boolean);
        } else {
          meta[key] = val;
        }
      }
    }
  }

  body = body.trim();

  if (!meta.title) {
    const firstLineMatch = body.match(/^#\s+(.+)$/m);
    if (firstLineMatch && body.startsWith('# ')) {
      meta.title = firstLineMatch[1].trim();
      body = body.replace(/^#\s+.+\n*/, '').trim();
    } else {
      meta.title = fallbackMeta.title || '未命名记录';
    }
  }

  if (!meta.date) meta.date = fallbackMeta.date || new Date().toISOString().slice(0, 10);
  if (!meta.category) meta.category = fallbackMeta.category || '随笔';
  if (typeof meta.tags === 'string') {
    meta.tags = meta.tags.split(/[,，\s]+/).map(s => s.trim()).filter(Boolean);
  }
  if (!Array.isArray(meta.tags)) meta.tags = [];

  meta.featured = Boolean(meta.featured);
  meta.private = Boolean(meta.private);
  meta.draft = Boolean(meta.draft);
  meta.cover = meta.cover || '';
  meta.coverTone = meta.coverTone || 'terracotta';
  meta.quote = meta.quote || '';

  return { meta, body };
}

function stripMarkdown(md) {
  return String(md || '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/\$\$[\s\S]*?\$\$/g, '')
    .replace(/^:::details\s+/gm, '')
    .replace(/^:::\s*$/gm, '')
    .replace(/^:::bookmark\s+([^\n|]+).*$/gm, '$1')
    .replace(/^>\s*\[!(?:NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/gim, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\[\^([^\]]+)\]:?/g, '')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^>\s+/gm, '')
    .replace(/^\s*[-*+]\s+\[[ xX]\]\s+/gm, '')
    .replace(/==([^=]+)==/g, '$1')
    .replace(/\+\+([^+]+)\+\+/g, '$1')
    .replace(/\|\|([^|]+)\|\|/g, '$1')
    .replace(/\[\[([^\]]+)\]\]/g, '$1')
    .replace(/\$([^$\n]+)\$/g, '$1')
    .replace(/[*_~^]/g, '')
    .replace(/<\/?(?:u|kbd|sup|sub)>/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function countWords(text) {
  const clean = stripMarkdown(text);
  const cjk = (clean.match(/[\u4e00-\u9fa5]/g) || []).length;
  const latin = (clean.replace(/[\u4e00-\u9fa5]/g, ' ').match(/[a-zA-Z0-9_-]+/g) || []).length;
  return cjk + latin;
}

const CALLOUT_META = {
  NOTE: { label: '备注', icon: 'ℹ' },
  TIP: { label: '技巧', icon: '✦' },
  IMPORTANT: { label: '重点', icon: '◈' },
  WARNING: { label: '注意', icon: '⚠' },
  CAUTION: { label: '警示', icon: '⊘' },
};

function parseInline(text) {
  let raw = String(text || '');
  const stash = [];
  const putToken = html => {
    const tk = `@@MD_TOK_${stash.length}@@`;
    stash.push(html);
    return tk;
  };

  // 1. Protect inline code `...`
  raw = raw.replace(/`([^`\n]+)`/g, (_, code) =>
    putToken(`<code class="inline-code">${escapeHtml(code)}</code>`)
  );

  // 2. Protect inline math $...$ (non-space boundary, not $$)
  raw = raw.replace(/(?<!\$)\$(?!\$)([^$\n]+?)(?<!\$)\$(?!\$)/g, (_, tex) => {
    const cleanTex = tex.trim();
    if (!cleanTex) return '$' + tex + '$';
    return putToken(`<span class="md-math-inline" data-tex="${escapeHtml(cleanTex)}">${escapeHtml(cleanTex)}</span>`);
  });

  // 3. Protect allowed inline HTML tags <u>...</u>, <kbd>...</kbd>, <sup>...</sup>, <sub>...</sub>
  raw = raw.replace(/<(u|kbd|sup|sub)>([^<\n]+)<\/\1>/gi, (_, tag, inner) => {
    const t = tag.toLowerCase();
    const cls = t === 'u' ? ' class="md-u"' : t === 'kbd' ? ' class="md-kbd"' : '';
    return putToken(`<${t}${cls}>${escapeHtml(inner)}</${t}>`);
  });

  let out = escapeHtml(raw);

  // 4. Media & Images ![alt](src)
  out = out.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, src) => {
    const cleanSrc = src.trim();
    if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(cleanSrc)) {
      return putToken(
        `<figure class="post-figure md-video-figure"><video controls preload="metadata" src="${cleanSrc}"></video>${alt ? `<figcaption>${alt}</figcaption>` : ''}</figure>`
      );
    }
    if (/\.(mp3|wav|m4a|flac)(\?.*)?$/i.test(cleanSrc)) {
      return putToken(
        `<figure class="post-figure md-audio-figure">${alt ? `<div class="md-audio-title">${alt}</div>` : ''}<audio controls preload="metadata" src="${cleanSrc}"></audio></figure>`
      );
    }
    const caption = alt ? `<figcaption>${alt}</figcaption>` : '';
    return putToken(`<figure class="post-figure"><img src="${cleanSrc}" alt="${alt}" loading="lazy" data-zoomable />${caption}</figure>`);
  });

  // 5. Keyboard shortcut [[Ctrl+S]]
  out = out.replace(/\[\[([^\][\n]+)\]\]/g, (_, keyTxt) =>
    putToken(`<kbd class="md-kbd">${keyTxt}</kbd>`)
  );

  // 6. Footnote references [^1]
  out = out.replace(/\[\^([^\][\s]+)\]/g, (_, fnId) =>
    putToken(`<sup class="md-fn-ref" data-fn="${fnId}"><a href="#fn-${fnId}" id="fnref-${fnId}">[${fnId}]</a></sup>`)
  );

  // 7. Markdown links [label](href)
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, href) => {
    const ext = /^https?:\/\//i.test(href) ? ' target="_blank" rel="noopener noreferrer"' : '';
    return putToken(`<a href="${href}"${ext}>${label}</a>`);
  });

  // 8. Bare URL autolinks
  out = out.replace(/(^|[\s(])((?:https?:\/\/)[^\s<)"']+)/g, (_, lead, url) =>
    `${lead}${putToken(`<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`)}`
  );

  // 9. Rich inline decorations
  out = out.replace(/==([^=\n]+)==/g, '<mark class="warm-mark">$1</mark>');
  out = out.replace(/\+\+([^+\n]+)\+\+/g, '<u class="md-u">$1</u>');
  out = out.replace(/\|\|([^|\n]+)\|\|/g, '<span class="md-spoiler" data-md-spoiler="1" title="点击或悬停查看隐藏内容">$1</span>');
  out = out.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/\*([^*\n]+)\*/g, '<em>$1</em>');
  out = out.replace(/~~([^~\n]+)~~/g, '<del>$1</del>');
  out = out.replace(/\^([^^\s\n][^^\n]*?)\^/g, '<sup>$1</sup>');
  out = out.replace(/(?<!~)~(?!~)([^~\s\n][^~\n]*?)(?<!~)~(?!~)/g, '<sub>$1</sub>');

  stash.forEach((html, idx) => {
    out = out.replace(`@@MD_TOK_${idx}@@`, html);
  });
  return out;
}

function renderMarkdown(markdown, { _nested = false } = {}) {
  const rawLines = String(markdown || '').replace(/\r\n/g, '\n').split('\n');
  const footnotes = [];
  const lines = [];

  // Extract footnote definitions [^id]: content (top-level pass)
  if (!_nested) {
    for (let k = 0; k < rawLines.length; k++) {
      const fnMatch = rawLines[k].match(/^\[\^([^\]]+)\]:\s+(.+)$/);
      if (fnMatch) {
        footnotes.push({ id: fnMatch[1].trim(), text: fnMatch[2].trim() });
      } else {
        lines.push(rawLines[k]);
      }
    }
  } else {
    lines.push(...rawLines);
  }

  const html = [];
  const headings = [];
  let i = 0;
  let headingSeq = 0;
  let taskSeq = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i++;
      continue;
    }

    // 1. Fenced Code Block ```lang
    const fenceMatch = line.match(/^```([\w+-]*)\s*$/);
    if (fenceMatch) {
      const lang = fenceMatch[1] || 'text';
      const codeLines = [];
      i++;
      while (i < lines.length && !/^```\s*$/.test(lines[i])) {
        codeLines.push(lines[i]);
        i++;
      }
      i++;
      const escapedCode = escapeHtml(codeLines.join('\n'));
      html.push(
        `<div class="code-block">` +
          `<div class="code-header">` +
            `<div class="code-dots"><span></span><span></span><span></span><em class="code-lang">${escapeHtml(lang)}</em></div>` +
            `<button type="button" class="copy-btn" data-copy>复制代码</button>` +
          `</div>` +
          `<pre><code>${escapedCode}</code></pre>` +
        `</div>`
      );
      continue;
    }

    // 2. Display Math Block $$ ... $$
    if (/^\$\$\s*$/.test(line.trim()) || (/^\$\$/.test(line.trim()) && /\$\$$/.test(line.trim()) && line.trim().length > 4)) {
      let mathBody = '';
      if (/^\$\$/.test(line.trim()) && /\$\$$/.test(line.trim()) && line.trim().length > 4) {
        mathBody = line.trim().slice(2, -2).trim();
        i++;
      } else {
        const mLines = [];
        i++;
        while (i < lines.length && !/^\$\$\s*$/.test(lines[i].trim())) {
          mLines.push(lines[i]);
          i++;
        }
        i++;
        mathBody = mLines.join('\n').trim();
      }
      html.push(`<div class="md-math-block" data-math-block="1"><pre class="md-math-src">${escapeHtml(mathBody)}</pre></div>`);
      continue;
    }

    // 3. Collapsible Details Block :::details Title ... :::
    const detailsMatch = line.match(/^:::\s*details(?:\s+(.*))?$/i);
    if (detailsMatch) {
      const sumTitle = (detailsMatch[1] || '').trim() || '点击展开详情';
      const innerLines = [];
      i++;
      while (i < lines.length && !/^:::\s*$/.test(lines[i].trim())) {
        innerLines.push(lines[i]);
        i++;
      }
      i++;
      const innerRendered = renderMarkdown(innerLines.join('\n'), { _nested: true }).html;
      html.push(
        `<details class="md-details">` +
          `<summary class="md-details-sum">${parseInline(sumTitle)}</summary>` +
          `<div class="md-details-body">${innerRendered || '<p></p>'}</div>` +
        `</details>`
      );
      continue;
    }

    // 4. Bookmark Link Card :::bookmark Title | https://... | Description
    const bmMatch = line.match(/^:::\s*bookmark\s+(.+)$/i);
    if (bmMatch) {
      const parts = bmMatch[1].split('|').map(s => s.trim());
      const bmTitle = parts[0] || '网页书签';
      const bmUrl = parts[1] || 'https://';
      const bmDesc = parts[2] || '';
      let host = '';
      try { host = new URL(bmUrl).hostname; } catch (_) { host = bmUrl; }
      html.push(
        `<a class="md-bookmark" href="${escapeHtml(bmUrl)}" target="_blank" rel="noopener noreferrer" data-bm-title="${escapeHtml(bmTitle)}" data-bm-url="${escapeHtml(bmUrl)}" data-bm-desc="${escapeHtml(bmDesc)}">` +
          `<div class="md-bm-main">` +
            `<div class="md-bm-title">${escapeHtml(bmTitle)}</div>` +
            (bmDesc ? `<div class="md-bm-desc">${escapeHtml(bmDesc)}</div>` : '') +
            `<div class="md-bm-host">${escapeHtml(host)} ↗</div>` +
          `</div>` +
        `</a>`
      );
      i++;
      continue;
    }

    // 5. Horizontal Rule
    if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(line.trim())) {
      html.push('<hr class="editorial-hr" />');
      i++;
      continue;
    }

    // 6. Headings H1–H4 (# .. ####)
    const hMatch = line.match(/^(#{1,4})\s+(.+)$/);
    if (hMatch) {
      const level = Math.min(4, Math.max(1, hMatch[1].length));
      const rawTitle = hMatch[2].trim();
      headingSeq++;
      const id = `section-${headingSeq}`;
      if (level <= 3) {
        headings.push({ id, level: level === 1 ? 2 : level, text: stripMarkdown(rawTitle) });
      }
      html.push(`<h${level} id="${id}">${parseInline(rawTitle)}</h${level}>`);
      i++;
      continue;
    }

    // 7. Callout Admonitions (> [!NOTE] ...) & Standard Blockquote
    if (/^>\s?/.test(line)) {
      const quoteLines = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        quoteLines.push(lines[i].replace(/^>\s?/, ''));
        i++;
      }
      const firstLine = quoteLines[0] || '';
      const calloutMatch = firstLine.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\](?:\s+(.*))?$/i);
      if (calloutMatch) {
        const cType = calloutMatch[1].toUpperCase();
        const cMeta = CALLOUT_META[cType] || CALLOUT_META.NOTE;
        const cTitle = (calloutMatch[2] || '').trim() || cMeta.label;
        const bodyQuotes = quoteLines.slice(1).filter((l, idx, arr) => !(idx === 0 && !l.trim() && arr.length > 1));
        const bodyHtml = bodyQuotes.length
          ? bodyQuotes.map(l => `<p>${parseInline(l)}</p>`).join('')
          : '<p></p>';
        html.push(
          `<div class="md-callout callout-${cType.toLowerCase()}" data-callout="${cType}">` +
            `<div class="md-callout-head">` +
              `<span class="md-callout-ico" contenteditable="false">${cMeta.icon}</span>` +
              `<strong class="md-callout-title">${parseInline(cTitle)}</strong>` +
            `</div>` +
            `<div class="md-callout-body">${bodyHtml}</div>` +
          `</div>`
        );
      } else {
        html.push(`<blockquote>${quoteLines.map(l => `<p>${parseInline(l)}</p>`).join('')}</blockquote>`);
      }
      continue;
    }

    // 8. Unordered list & Task list (- [x] / - [ ])
    if (/^\s*[-*+]\s+/.test(line)) {
      const items = [];
      let hasTask = false;
      while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) {
        const content = lines[i].replace(/^\s*[-*+]\s+/, '');
        const taskMatch = content.match(/^\[([ xX])\]\s*(.*)$/);
        if (taskMatch) {
          hasTask = true;
          const done = taskMatch[1].toLowerCase() === 'x';
          const tIdx = taskSeq++;
          items.push(
            `<li class="task-item ${done ? 'done' : ''}" data-task-idx="${tIdx}">` +
              `<span class="task-box">${done ? '✓' : ''}</span>` +
              `<span>${parseInline(taskMatch[2])}</span>` +
            `</li>`
          );
        } else {
          items.push(`<li>${parseInline(content)}</li>`);
        }
        i++;
      }
      html.push(`<ul class="${hasTask ? 'task-list' : ''}">${items.join('')}</ul>`);
      continue;
    }

    // 9. Ordered list
    if (/^\s*\d+\.\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(`<li>${parseInline(lines[i].replace(/^\s*\d+\.\s+/, ''))}</li>`);
        i++;
      }
      html.push(`<ol>${items.join('')}</ol>`);
      continue;
    }

    // 10. GFM Markdown Table (with Column Alignment)
    if (line.includes('|') && i + 1 < lines.length && /^\s*\|?[\s:-]+\|[\s|:-]*$/.test(lines[i + 1])) {
      const splitRow = row => row.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim());
      const rawHeaders = splitRow(line);
      const alignCells = splitRow(lines[i + 1]);
      const aligns = rawHeaders.map((_, idx) => {
        const spec = alignCells[idx] || '';
        if (/^:-+:$/.test(spec)) return 'center';
        if (/^-+:$/.test(spec)) return 'right';
        return 'left';
      });
      i += 2;
      const bodyRows = [];
      while (i < lines.length && lines[i].includes('|') && lines[i].trim()) {
        bodyRows.push(splitRow(lines[i]));
        i++;
      }
      const thHtml = rawHeaders
        .map((h, idx) => {
          const al = aligns[idx] || 'left';
          const alignAttr = al !== 'left' ? ` style="text-align:${al};" data-align="${al}"` : ' data-align="left"';
          return `<th${alignAttr}>${parseInline(h)}</th>`;
        })
        .join('');
      const tbHtml = bodyRows
        .map(r => {
          const tds = rawHeaders
            .map((_, idx) => {
              const al = aligns[idx] || 'left';
              const alignAttr = al !== 'left' ? ` style="text-align:${al};" data-align="${al}"` : '';
              return `<td${alignAttr}>${parseInline(r[idx] || '')}</td>`;
            })
            .join('');
          return `<tr>${tds}</tr>`;
        })
        .join('');
      html.push(`<div class="table-wrap"><table><thead><tr>${thHtml}</tr></thead><tbody>${tbHtml}</tbody></table></div>`);
      continue;
    }

    // 11. Paragraph
    const paraLines = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^(```|\$\$|:::\s*(?:details|bookmark)|#{1,4}\s|>\s?|(-{3,}|\*{3,}|_{3,})\s*$|\s*[-*+]\s+|\s*\d+\.\s+)/i.test(lines[i]) &&
      !(lines[i].includes('|') && i + 1 < lines.length && /^\s*\|?[\s:-]+\|[\s|:-]*$/.test(lines[i + 1]))
    ) {
      paraLines.push(lines[i].trim());
      i++;
    }
    if (paraLines.length) {
      html.push(`<p>${paraLines.map(parseInline).join('<br />')}</p>`);
    } else {
      i++;
    }
  }

  if (!_nested && footnotes.length) {
    html.push(
      `<section class="md-footnotes">` +
        `<hr class="editorial-hr" />` +
        `<ol class="md-fn-list">` +
          footnotes
            .map(
              fn =>
                `<li id="fn-${escapeHtml(fn.id)}" data-fn-id="${escapeHtml(fn.id)}">` +
                  `<span class="md-fn-text">${parseInline(fn.text)}</span> ` +
                  `<a href="#fnref-${escapeHtml(fn.id)}" class="md-fn-back" contenteditable="false">↩</a>` +
                `</li>`
            )
            .join('') +
        `</ol>` +
      `</section>`
    );
  }

  return { html: html.join('\n'), headings };
}

function serializeDocument(meta, body) {
  const tagsStr = Array.isArray(meta.tags) && meta.tags.length
    ? `[${meta.tags.map(t => `"${String(t).replace(/"/g, '')}"`).join(', ')}]`
    : '[]';
  const lines = [
    '---',
    `title: "${String(meta.title || '').replace(/"/g, '\\"')}"`,
    `date: "${meta.date || new Date().toISOString().slice(0, 10)}"`,
    `category: "${String(meta.category || '随笔').replace(/"/g, '\\"')}"`,
    `tags: ${tagsStr}`,
    `featured: ${Boolean(meta.featured)}`,
    `private: ${Boolean(meta.private)}`,
  ];
  if (meta.cover && String(meta.cover).trim()) {
    lines.push(`cover: "${String(meta.cover).trim().replace(/"/g, '\\"')}"`);
  }
  if (meta.summary && String(meta.summary).trim()) {
    lines.push(`summary: "${String(meta.summary).trim().replace(/"/g, '\\"').replace(/\r?\n/g, ' ')}"`);
  }
  lines.push('---', '', String(body || '').trim(), '');
  return lines.join('\n');
}

module.exports = {
  escapeHtml,
  parseFrontmatter,
  stripMarkdown,
  countWords,
  renderMarkdown,
  serializeDocument,
};

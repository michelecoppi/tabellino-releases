// Pagina di download di Tabellino: legge le release da GitHub, riempie il bottone e le novità,
// e anima galleria e guida. Nessun innerHTML con testo remoto: tutto passa da nodi DOM e textContent.
(function () {
  'use strict';

  var REPO = 'michelecoppi/tabellino-releases';
  var API = 'https://api.github.com/repos/' + REPO + '/releases?per_page=8';
  var FALLBACK = 'https://github.com/' + REPO + '/releases/latest';
  var ALL = 'https://github.com/' + REPO + '/releases';

  var btn = document.getElementById('dl-btn');
  var label = document.getElementById('dl-label');
  var meta = document.getElementById('dl-meta');
  var status = document.getElementById('dl-status');

  function el(tag, text, cls) {
    var n = document.createElement(tag);
    if (text) n.textContent = text;
    if (cls) n.className = cls;
    return n;
  }

  /* ---------- Bottone di download ---------- */

  function setMeta(parts) {
    meta.textContent = '';
    parts.forEach(function (p, i) {
      if (i > 0) meta.appendChild(el('i'));
      var s = el('span');
      if (p.text) s.appendChild(document.createTextNode(p.text));
      if (p.strong) s.appendChild(el('b', p.strong));
      meta.appendChild(s);
    });
  }

  function fallback(message) {
    btn.href = FALLBACK;
    label.textContent = 'Scarica per Windows';
    setMeta([{ text: 'Windows 10 o 11, 64 bit' }, { text: 'circa 5 MB' }]);
    status.textContent = message;
    status.dataset.kind = 'warn';
    status.hidden = false;
  }

  function formatSize(bytes) {
    return (bytes / 1048576).toFixed(1).replace('.', ',') + ' MB';
  }

  function formatDate(iso) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  function versionOf(release) {
    return String(release.tag_name || release.name || '').replace(/^v/i, '');
  }

  function showDownload(release) {
    var assets = Array.isArray(release.assets) ? release.assets : [];
    var setup = null;
    for (var i = 0; i < assets.length; i += 1) {
      if (typeof assets[i].name === 'string' && /-setup\.exe$/i.test(assets[i].name)) {
        setup = assets[i];
        break;
      }
    }
    if (!setup || typeof setup.browser_download_url !== 'string') {
      fallback("Non trovo l'installer dell'ultima versione: la pagina delle release ha tutti i file.");
      return;
    }
    var version = versionOf(release);
    btn.href = setup.browser_download_url;
    label.textContent = 'Scarica per Windows';
    var parts = [];
    if (version) parts.push({ text: 'Versione ', strong: version });
    if (typeof setup.size === 'number') parts.push({ strong: formatSize(setup.size) });
    var date = formatDate(release.published_at || setup.updated_at);
    if (date) parts.push({ text: date });
    setMeta(parts);
    status.hidden = true;
  }

  /* ---------- Note di versione: markdown minimo, raggruppato in tendine ---------- */

  function inline(parent, text) {
    var parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
    parts.forEach(function (chunk) {
      if (!chunk) return;
      if (chunk.slice(0, 2) === '**' && chunk.slice(-2) === '**' && chunk.length > 4) parent.appendChild(el('strong', chunk.slice(2, -2)));
      else if (chunk.charAt(0) === '`' && chunk.slice(-1) === '`' && chunk.length > 2) parent.appendChild(el('code', chunk.slice(1, -1)));
      else parent.appendChild(document.createTextNode(chunk));
    });
  }

  // Divide il testo in: introduzione (paragrafi) e gruppi {titolo, righe}.
  // Un gruppo comincia con un titolo (#) o con una riga fatta solo di grassetto.
  function parseNotes(markdown) {
    var intro = [];
    var groups = [];
    var current = null;
    var list = null;
    var para = null;
    function container() {
      return current ? current.blocks : intro;
    }
    String(markdown).replace(/\r/g, '').split('\n').forEach(function (raw) {
      var line = raw.trim();
      var h = /^#{1,6}\s+(.*)$/.exec(line);
      var bold = /^\*\*([^*]+)\*\*:?$/.exec(line);
      var li = /^[-*+]\s+(.*)$/.exec(line);
      if (!line) {
        list = null;
        para = null;
      } else if (h || bold) {
        list = null;
        para = null;
        current = { title: (h ? h[1] : bold[1]).replace(/\*\*/g, ''), blocks: [] };
        groups.push(current);
      } else if (li) {
        para = null;
        if (!list) {
          list = { type: 'ul', items: [] };
          container().push(list);
        }
        list.items.push(li[1]);
      } else {
        list = null;
        if (para) para.text += ' ' + line;
        else {
          para = { type: 'p', text: line };
          container().push(para);
        }
      }
    });
    return { intro: intro, groups: groups };
  }

  function fillBlocks(into, blocks) {
    blocks.forEach(function (b) {
      if (b.type === 'p') {
        var p = el('p');
        inline(p, b.text);
        into.appendChild(p);
      } else {
        var ul = el('ul');
        b.items.forEach(function (t) {
          var li = el('li');
          inline(li, t);
          ul.appendChild(li);
        });
        into.appendChild(ul);
      }
    });
  }

  function countItems(blocks) {
    var n = 0;
    blocks.forEach(function (b) {
      if (b.type === 'ul') n += b.items.length;
    });
    return n;
  }

  function buildRelease(release, isLatest) {
    var version = versionOf(release);
    var parsed = parseNotes(release.body);
    var d = el('details', '', 'rel');
    if (isLatest) d.open = true;

    var sum = el('summary');
    sum.appendChild(el('span', version ? 'Versione ' + version : 'Novità', 'rel__name'));
    if (isLatest) sum.appendChild(el('em', 'Ultima', 'rel__tag'));
    var date = formatDate(release.published_at || release.created_at);
    if (date) sum.appendChild(el('small', date));
    d.appendChild(sum);

    var body = el('div', '', 'rel__body');
    if (parsed.intro.length) {
      var intro = el('div', '', 'rel__intro');
      fillBlocks(intro, parsed.intro);
      body.appendChild(intro);
    }
    parsed.groups.forEach(function (g, i) {
      var gd = el('details', '', 'grp');
      if (isLatest && i === 0) gd.open = true;
      var gs = el('summary');
      gs.appendChild(el('span', g.title));
      var n = countItems(g.blocks);
      if (n) gs.appendChild(el('small', String(n)));
      gd.appendChild(gs);
      var gb = el('div', '', 'grp__body');
      fillBlocks(gb, g.blocks);
      gd.appendChild(gb);
      body.appendChild(gd);
    });
    d.appendChild(body);
    return d;
  }

  function showNotes(releases) {
    var wrap = document.getElementById('rels');
    var sub = document.getElementById('rel-sub');
    var toggle = document.getElementById('rel-toggle');
    wrap.textContent = '';
    var withBody = releases.filter(function (r) {
      return typeof r.body === 'string' && r.body.trim();
    });
    if (!withBody.length) {
      sub.textContent = 'Nessuna novità da mostrare per ora.';
      return;
    }
    sub.textContent = 'Le ultime versioni, raggruppate per argomento. Apri solo quello che ti interessa.';
    withBody.forEach(function (r, i) {
      wrap.appendChild(buildRelease(r, i === 0));
    });
    var more = el('a', 'Tutte le versioni su GitHub', 'rels__all');
    more.href = ALL;
    more.rel = 'noopener';
    wrap.appendChild(more);

    function details() {
      return wrap.querySelectorAll('details');
    }
    function sync() {
      var all = true;
      details().forEach(function (d) {
        if (!d.open) all = false;
      });
      toggle.textContent = all ? 'Chiudi tutto' : 'Apri tutto';
    }
    toggle.hidden = false;
    toggle.onclick = function () {
      var open = toggle.textContent === 'Apri tutto';
      details().forEach(function (d) {
        d.open = open;
      });
      sync();
    };
    wrap.addEventListener('toggle', sync, true);
    sync();
  }

  function notesFailed(message) {
    document.getElementById('rel-sub').textContent = message;
    var wrap = document.getElementById('rels');
    wrap.textContent = '';
    var more = el('a', 'Apri le release su GitHub', 'rels__all');
    more.href = ALL;
    more.rel = 'noopener';
    wrap.appendChild(more);
  }

  function load() {
    var ctrl = typeof AbortController === 'function' ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, 8000) : null;
    fetch(API, { headers: { Accept: 'application/vnd.github+json' }, signal: ctrl ? ctrl.signal : undefined })
      .then(function (res) {
        if (!res.ok) throw new Error('http-' + res.status);
        return res.json();
      })
      .then(function (list) {
        var releases = Array.isArray(list)
          ? list.filter(function (r) {
              return r && !r.draft;
            })
          : [];
        var stable = releases.filter(function (r) {
          return !r.prerelease;
        });
        if (!stable.length) {
          fallback('La prima versione non è ancora uscita: torna presto, oppure controlla la pagina delle release.');
          notesFailed('La prima versione non è ancora uscita.');
          return;
        }
        showDownload(stable[0]);
        showNotes(stable);
      })
      .catch(function () {
        fallback("Non riesco a leggere l'ultima versione da GitHub. Il bottone ti porta alla pagina delle release.");
        notesFailed('Non riesco a leggere le novità da GitHub.');
      })
      .then(function () {
        if (timer) clearTimeout(timer);
      });
  }

  /* ---------- Galleria a schede con zoom ---------- */

  function initShots() {
    var root = document.getElementById('shots');
    if (!root) return;
    var tabs = root.querySelector('.shots__tabs');
    var figs = Array.prototype.slice.call(root.querySelectorAll('figure'));
    var box = document.getElementById('lightbox');
    var boxImg = document.getElementById('lightbox-img');
    var boxCap = document.getElementById('lightbox-cap');
    var buttons = [];

    function select(i, focus) {
      figs.forEach(function (f, j) {
        f.hidden = j !== i;
      });
      buttons.forEach(function (b, j) {
        b.setAttribute('aria-selected', j === i ? 'true' : 'false');
        b.tabIndex = j === i ? 0 : -1;
      });
      if (focus) buttons[i].focus();
    }

    figs.forEach(function (f, i) {
      var b = el('button', f.getAttribute('data-title') || 'Schermata ' + (i + 1));
      b.type = 'button';
      b.setAttribute('role', 'tab');
      b.addEventListener('click', function () { select(i, false); });
      b.addEventListener('keydown', function (e) {
        var k = e.key;
        if (k !== 'ArrowRight' && k !== 'ArrowLeft') return;
        e.preventDefault();
        select((i + (k === 'ArrowRight' ? 1 : figs.length - 1)) % figs.length, true);
      });
      tabs.appendChild(b);
      buttons.push(b);

      var img = f.querySelector('img');
      if (img && box && typeof box.showModal === 'function') {
        img.tabIndex = 0;
        img.setAttribute('role', 'button');
        img.classList.add('zoomable');
        var open = function () {
          boxImg.src = img.currentSrc || img.src;
          boxImg.alt = img.alt;
          var cap = f.querySelector('figcaption');
          boxCap.textContent = cap ? cap.textContent : '';
          box.showModal();
        };
        img.addEventListener('click', open);
        img.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            open();
          }
        });
      }
    });
    if (box) {
      box.addEventListener('click', function (e) {
        if (e.target === box) box.close();
      });
    }
    tabs.hidden = false;
    select(0, false);
  }

  /* ---------- Guida: apre la tendina se l'indirizzo la nomina ---------- */

  function openFromHash() {
    var id = decodeURIComponent(location.hash.slice(1));
    if (!id) return;
    var target = document.getElementById(id);
    if (target && target.tagName === 'DETAILS') {
      target.open = true;
      target.scrollIntoView();
    }
  }

  initShots();
  window.addEventListener('hashchange', openFromHash);
  openFromHash();
  load();
})();

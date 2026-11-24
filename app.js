// Pagina di download di Tabellino: legge l'ultima release da GitHub e riempie il bottone.
// Nessun innerHTML con testo remoto: tutto passa da nodi DOM e textContent.
(function () {
  'use strict';

  var REPO = 'michelecoppi/tabellino-releases';
  var API = 'https://api.github.com/repos/' + REPO + '/releases/latest';
  var FALLBACK = 'https://github.com/' + REPO + '/releases/latest';

  var btn = document.getElementById('dl-btn');
  var label = document.getElementById('dl-label');
  var meta = document.getElementById('dl-meta');
  var status = document.getElementById('dl-status');

  function el(tag, text) {
    var n = document.createElement(tag);
    if (text) n.textContent = text;
    return n;
  }

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

  // Sottoinsieme minimo di markdown: titoli, elenchi, grassetto, paragrafi.
  function inline(parent, text) {
    var parts = text.split(/\*\*([^*]+)\*\*/g);
    parts.forEach(function (chunk, i) {
      if (!chunk) return;
      parent.appendChild(i % 2 === 1 ? el('strong', chunk) : document.createTextNode(chunk));
    });
  }

  function renderNotes(markdown, into) {
    into.textContent = '';
    var list = null;
    var para = null;
    var lines = String(markdown).replace(/\r/g, '').split('\n');
    lines.forEach(function (raw) {
      var line = raw.trim();
      var h = /^#{1,6}\s+(.*)$/.exec(line);
      var li = /^[-*+]\s+(.*)$/.exec(line);
      if (!line) {
        list = null;
        para = null;
      } else if (h) {
        list = null;
        para = null;
        var t = el('h3');
        inline(t, h[1]);
        into.appendChild(t);
      } else if (li) {
        para = null;
        if (!list) {
          list = el('ul');
          into.appendChild(list);
        }
        var item = el('li');
        inline(item, li[1]);
        list.appendChild(item);
      } else {
        list = null;
        if (para) para.appendChild(document.createTextNode(' '));
        else {
          para = el('p');
          into.appendChild(para);
        }
        inline(para, line);
      }
    });
  }

  function formatSize(bytes) {
    return (bytes / 1048576).toFixed(1).replace('.', ',') + ' MB';
  }

  function formatDate(iso) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  function show(release) {
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
    var version = String(release.tag_name || release.name || '').replace(/^v/i, '');
    btn.href = setup.browser_download_url;
    label.textContent = 'Scarica per Windows';
    var parts = [];
    if (version) parts.push({ text: 'Versione ', strong: version });
    if (typeof setup.size === 'number') parts.push({ strong: formatSize(setup.size) });
    var date = formatDate(release.published_at || setup.updated_at);
    if (date) parts.push({ text: date });
    parts.push({ text: 'Windows 10 o 11, 64 bit' });
    setMeta(parts);
    status.hidden = true;

    var body = typeof release.body === 'string' ? release.body.trim() : '';
    if (body) {
      document.getElementById('notes-title').textContent = version ? 'Novità della versione ' + version : 'Novità';
      renderNotes(body, document.getElementById('notes-body'));
      document.getElementById('notes').hidden = false;
    }
  }

  function load() {
    var ctrl = typeof AbortController === 'function' ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, 8000) : null;
    fetch(API, { headers: { Accept: 'application/vnd.github+json' }, signal: ctrl ? ctrl.signal : undefined })
      .then(function (res) {
        if (res.status === 404) throw new Error('nessuna-release');
        if (!res.ok) throw new Error('http-' + res.status);
        return res.json();
      })
      .then(show)
      .catch(function (err) {
        if (err && err.message === 'nessuna-release') {
          fallback('La prima versione non è ancora uscita: torna presto, oppure controlla la pagina delle release.');
        } else {
          fallback("Non riesco a leggere l'ultima versione da GitHub. Il bottone ti porta alla pagina delle release.");
        }
      })
      .then(function () {
        if (timer) clearTimeout(timer);
      });
  }

  load();
})();

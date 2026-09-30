'use strict';
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
const darkPreference = matchMedia('(prefers-color-scheme: dark)');
let paused = motionPreference.matches;
let toastTimeout;
function toast(message) {
  $('#toast').textContent = message;
  $('#toast').classList.add('visible');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => $('#toast').classList.remove('visible'), 2500);
}

// Theme follows the system until the reader picks one with the toggle.
const isDark = () => (document.documentElement.dataset.theme || (darkPreference.matches ? 'dark' : 'light')) === 'dark';
function updateTheme() {
  const dark = isDark();
  $('#theme-toggle').setAttribute('aria-label', `Switch to ${dark ? 'light' : 'dark'} theme`);
  $('meta[name="theme-color"]').content = dark ? '#161a21' : '#ffffff';
}
$('#theme-toggle').addEventListener('click', () => {
  document.documentElement.dataset.theme = isDark() ? 'light' : 'dark';
  try { localStorage.setItem('tm-theme', document.documentElement.dataset.theme); } catch {}
  updateTheme();
});
darkPreference.addEventListener('change', updateTheme);
updateTheme();

// Video assets are loaded when visible, and stopped offscreen or in hidden tabs.
const observedVideos = new Set();
function playVideo(video) {
  if (paused || document.hidden || video.closest('[hidden]')) return;
  if (video.dataset.src && !video.getAttribute('src')) {
    video.src = video.dataset.src;
    video.load();
  }
  video.play().catch(() => {});
}
const videoObserver = new IntersectionObserver(entries => {
  entries.forEach(({target: video, isIntersecting}) => {
    video.dataset.visible = String(isIntersecting);
    if (isIntersecting) playVideo(video); else video.pause();
  });
}, {threshold: 0.15});
function observeVideos(root = document) {
  $$('video', root).forEach(video => {
    if (observedVideos.has(video)) return;
    observedVideos.add(video);
    videoObserver.observe(video);
  });
}
function updateMotion() {
  $$('video').forEach(video => {
    if (paused) video.pause();
    else if (video.dataset.visible === 'true') playVideo(video);
  });
}
motionPreference.addEventListener('change', e => { paused = e.matches; updateMotion(); });
document.addEventListener('visibilitychange', () => {
  $$('video').forEach(video => {
    if (document.hidden) video.pause(); else if (video.dataset.visible === 'true') playVideo(video);
  });
});

const modalities = [
  {id: 'rgb', label: 'RGB'},
  {id: 'event', label: 'Event'},
  {id: 'thermal', label: 'Thermal'},
  {id: 'depth', label: 'Depth'},
  {id: 'lidar', label: 'LiDAR'}
];
const modLabel = id => modalities.find(m => m.id === id).label;
const modName = id => `<span class="mod-name" data-mod="${id}">${modLabel(id)}</span>`;
function warpLabels(source, target) {
  return `<span><b>Source ${modName(source)}</b><small>fixed view</small></span>`
    + `<span><b>Target ${modName(target)}</b><small>moving view</small></span>`
    + `<span><b>Source moved into target view</b><small>should line up with the target</small></span>`;
}

// Overview example: one pair at a time, source, target, and the warped source.
const examplePicker = $('.example-picker');
function showExample(button) {
  $$('button', examplePicker).forEach(b => { b.setAttribute('aria-checked', String(b === button)); b.tabIndex = b === button ? 0 : -1; });
  const pair = button.dataset.example;
  const [source, target] = pair.split('-');
  const panels = $$('#example-panels > div');
  panels[0].querySelector('.panel-label').innerHTML = `Source ${modName(source)}`;
  panels[1].querySelector('.panel-label').innerHTML = `Target ${modName(target)}`;
  Object.assign($('#example-source'), {src: `assets/intro-${pair}-source.webp`, alt: `Source ${modLabel(source)} image.`});
  Object.assign($('#example-target'), {src: `assets/intro-${pair}-target.webp`, alt: `Target ${modLabel(target)} image.`});
  Object.assign($('#example-warp'), {src: `assets/intro-${pair}-to-target.webp`, alt: `Source ${modLabel(source)} pixels moved to their predicted positions in the target view.`});
}
examplePicker.addEventListener('click', e => { const b = e.target.closest('button'); if (b) showExample(b); });
examplePicker.addEventListener('keydown', e => {
  const offset = {ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1}[e.key];
  if (!offset) return;
  e.preventDefault();
  const buttons = $$('button', examplePicker);
  const next = buttons[(buttons.indexOf(document.activeElement) + offset + buttons.length) % buttons.length];
  next.focus(); showExample(next);
});

// 25-pair explorer.
const matrix = $('#pair-matrix');
matrix.innerHTML = '<span class="axis-corner">Source ↓<br>Target →</span>'
  + modalities.map(m => `<span class="axis-label" data-mod="${m.id}">${m.label}</span>`).join('')
  + modalities.map((source, r) => `<span class="axis-label row" data-mod="${source.id}">${source.label}</span>`
    + modalities.map((target, c) => `<button class="pair-cell" type="button" style="--from:var(--mod-${source.id});--to:var(--mod-${target.id})" data-source="${source.id}" data-target="${target.id}" data-index="${r * 5 + c}" aria-label="${source.label} to ${target.label}" aria-pressed="false" title="${source.label} to ${target.label}" tabindex="-1"></button>`).join('')).join('');
function selectPair(button) {
  $$('.pair-cell').forEach(cell => { cell.setAttribute('aria-pressed', String(cell === button)); cell.tabIndex = cell === button ? 0 : -1; });
  const {source, target} = button.dataset;
  $('#pair-title').innerHTML = `${modName(source)}<span class="to">to</span>${modName(target)}`;
  $('#pair-labels').innerHTML = warpLabels(source, target);
  const video = $('#pair-video');
  video.pause();
  video.poster = `assets/pair-${source}-${target}.webp`;
  video.src = `assets/pair-${source}-${target}.mp4`;
  video.setAttribute('aria-label', `Left: fixed ${modLabel(source)} source. Middle: ${modLabel(target)} target sequence. Right: ${modLabel(source)} source moved into each target view.`);
  video.load();
  playVideo(video);
}
matrix.addEventListener('click', e => { const button = e.target.closest('.pair-cell'); if (button) selectPair(button); });
matrix.addEventListener('keydown', e => {
  const button = e.target.closest('.pair-cell'); if (!button) return;
  const index = Number(button.dataset.index);
  const offset = {ArrowRight: 1, ArrowLeft: -1, ArrowDown: 5, ArrowUp: -5}[e.key];
  if (!offset) return;
  e.preventDefault();
  const next = $$('.pair-cell')[(index + offset + 25) % 25];
  next.focus(); selectPair(next);
});
// Initial selection without reloading the video already in the markup.
(() => {
  const first = $('.pair-cell[data-source="rgb"][data-target="event"]');
  $$('.pair-cell').forEach(cell => { cell.setAttribute('aria-pressed', String(cell === first)); cell.tabIndex = cell === first ? 0 : -1; });
  $('#pair-title').innerHTML = `${modName('rgb')}<span class="to">to</span>${modName('event')}`;
  $('#pair-labels').innerHTML = warpLabels('rgb', 'event');
  $('#pair-video').setAttribute('aria-label', 'Left: fixed RGB source. Middle: Event target sequence. Right: RGB source moved into each target view.');
})();

function setupTabs(selector, onSelect) {
  const buttons = $$(selector);
  buttons.forEach(button => {
    button.addEventListener('click', () => {
      buttons.forEach(b => { b.setAttribute('aria-selected', String(b === button)); b.tabIndex = b === button ? 0 : -1; });
      onSelect(button);
    });
    button.addEventListener('keydown', e => {
      if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(e.key)) return;
      e.preventDefault();
      let index = buttons.indexOf(button);
      index = e.key === 'Home' ? 0 : e.key === 'End' ? buttons.length - 1 : (index + (e.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length;
      buttons[index].click(); buttons[index].focus();
    });
  });
}
function renderComparison() {
  const pair = $('#real-pair').value;
  const [source, target] = pair.split('-');
  $$('video', $('#real-comparison')).forEach(v => { v.pause(); videoObserver.unobserve(v); observedVideos.delete(v); });
  $('#real-labels').innerHTML = warpLabels(source, target);
  $('#real-comparison').innerHTML = [
    ['minima', 'MINIMA (RoMa)'], ['matchanything', 'MatchAnything (RoMa)'], ['ours', 'TartanMatch (ours)']
  ].map(([id, name]) => `<article class="comparison-row ${id}"><h3>${name}</h3><video class="demo-video" muted loop playsinline controls preload="none" poster="assets/real-${pair}-${id}.webp" data-src="assets/real-${pair}-${id}.mp4" aria-label="${name}. Left: fixed ${modLabel(source)} source. Middle: ${modLabel(target)} target. Right: source moved into the target view."></video></article>`).join('');
  observeVideos($('#real-comparison'));
}
setupTabs('[data-demo-tab]', button => {
  const tab = button.dataset.demoTab;
  $('#panel-explorer').hidden = tab !== 'explorer';
  $('#panel-real').hidden = tab !== 'real';
  if (tab === 'real' && !$('#real-comparison').children.length) renderComparison();
  $$('video', $('#demos')).forEach(v => { if (v.closest('[hidden]')) v.pause(); else if (v.dataset.visible === 'true') playVideo(v); });
});
$('#real-pair').addEventListener('change', renderComparison);
$('#sync-videos').addEventListener('click', async () => {
  const videos = $$('video', $('#real-comparison'));
  await Promise.all(videos.map(video => new Promise(resolve => {
    if (!video.getAttribute('src')) { video.src = video.dataset.src; video.load(); }
    video.pause(); video.currentTime = 0;
    if (video.readyState >= 3) resolve();
    else video.addEventListener('canplay', resolve, {once: true});
  })));
  videos.forEach(video => video.play().catch(() => {}));
});

// Values transcribed from Tables II, III, and V of the supplied manuscript.
const resultSets = {
  cross: {
    explain: 'Average endpoint error in pixels: how far, on average, a predicted match lands from the true one. Shorter bars are better.',
    unit: 'EPE (px), lower is better', source: 'Table II', lowerIsBetter: true,
    rows: [
      ['RGB → Depth', 'DTU', 12.78, 36.56, 'MINIMA (RoMa)'],
      ['RGB → Event', 'DSERT-RoLL', 6.63, 11.61, 'MatchAnything (RoMa)'],
      ['RGB → Thermal', 'MTV', 2.48, 3.28, 'MatchAnything (RoMa)'],
      ['RGB → Thermal', 'DSERT-RoLL', 10.95, 9.57, 'MINIMA (RoMa)'],
      ['RGB → LiDAR', 'DSERT-RoLL', 8.46, 52.70, 'MatchAnything (RoMa)'],
      ['Thermal → Event', 'DSERT-RoLL', 9.61, 13.58, 'MINIMA (RoMa)'],
      ['Event → LiDAR', 'DSERT-RoLL', 9.55, 30.48, 'MatchAnything (RoMa)'],
      ['Thermal → LiDAR', 'DSERT-RoLL', 11.61, 42.88, 'MatchAnything (RoMa)'],
      ['Depth → Thermal', 'MTV', 13.45, 23.80, 'MatchAnything (RoMa)']
    ]
  },
  same: {
    explain: 'Average endpoint error in pixels when both images come from the same kind of sensor. Shorter bars are better.',
    unit: 'EPE (px), lower is better', source: 'Table V', lowerIsBetter: true,
    rows: [
      ['RGB → RGB', 'DTU', 5.74, 4.68, 'RoMa v2'],
      ['RGB → RGB', 'DSERT-RoLL', 2.40, 2.55, 'RoMa v2'],
      ['Depth → Depth', 'DTU', 5.67, 26.54, 'MatchAnything (RoMa) / RoMa v2'],
      ['Event → Event', 'MVSEC, 20 Hz', 1.17, 1.33, 'RoMa'],
      ['Event → Event', 'MVSEC, 45 Hz', .70, .77, 'UFM'],
      ['Event → Event', 'DSERT-RoLL', 2.32, 2.40, 'E-RAFT'],
      ['Thermal → Thermal', 'MTV', .77, .56, 'MatchAnything (RoMa)'],
      ['Thermal → Thermal', 'DSERT-RoLL', 3.07, 3.21, 'RoMa v2'],
      ['LiDAR → LiDAR', 'DSERT-RoLL', 5.89, 13.01, 'RoMa']
    ]
  },
  pose: {
    explain: 'Camera pose estimated from the matches, scored as the area under the accuracy curve up to an angular error threshold. Longer bars are better.',
    unit: 'Pose AUC (%), higher is better', source: 'Table III', lowerIsBetter: false,
    rows: [
      ['RGB → Depth', 'DTU, within 5°', 10.6, 10.7, 'MINIMA (RoMa)'],
      ['RGB → Depth', 'DTU, within 10°', 24.7, 20.4, 'MINIMA (RoMa)'],
      ['RGB → Depth', 'DTU, within 20°', 45.4, 32.0, 'MINIMA (RoMa)'],
      ['RGB → Event', 'EDS, within 5°', 8.3, 2.9, 'MatchAnything (RoMa)'],
      ['RGB → Event', 'EDS, within 10°', 17.8, 7.2, 'MatchAnything (RoMa)'],
      ['RGB → Event', 'EDS, within 20°', 29.5, 13.9, 'MatchAnything (RoMa)']
    ]
  }
};
function renderResults(kind) {
  const data = resultSets[kind];
  const max = Math.max(...data.rows.flatMap(r => [r[2], r[3]]));
  const fmt = v => v.toFixed(kind === 'pose' ? 1 : 2);
  const wins = (ours, base) => data.lowerIsBetter ? ours < base : ours > base;
  $('#results-panel').setAttribute('aria-labelledby', `tab-${kind}`);
  $('#chart-explain').textContent = data.explain;
  $('#result-chart').innerHTML = data.rows.map(([pair, dataset, ours, baseline, name]) => `<div class="chart-row" role="img" aria-label="${pair}, ${dataset}: TartanMatch ${fmt(ours)}, best other method (${name}) ${fmt(baseline)}. ${data.unit}."><div class="chart-row-label">${pair}<small>${dataset}</small></div><div class="bar-pair" aria-hidden="true"><div class="result-bar ours" style="--width:${ours / max * 100}%"></div><div class="result-bar" style="--width:${baseline / max * 100}%"></div></div><div class="chart-values" aria-hidden="true"><b>${fmt(ours)}</b><span>${fmt(baseline)}</span></div></div>`).join('');
  $('#results-table').innerHTML = `<table><caption>${data.source} of the paper. ${data.unit}.</caption><thead><tr><th scope="col">Pair</th><th scope="col">Dataset</th><th scope="col">TartanMatch</th><th scope="col">Best other</th><th scope="col">Method</th></tr></thead><tbody>${data.rows.map(([pair, dataset, ours, baseline, name]) => `<tr><th scope="row">${pair}</th><td>${dataset}</td><td class="${wins(ours, baseline) ? 'win' : ''}">${fmt(ours)}</td><td class="${wins(ours, baseline) ? '' : 'win'}">${fmt(baseline)}</td><td>${name}</td></tr>`).join('')}</tbody></table>`;
}
setupTabs('[data-result-tab]', button => renderResults(button.dataset.resultTab));
renderResults('cross');

const dialog = $('#image-dialog');
$$('[data-zoom]').forEach(button => button.addEventListener('click', () => {
  $('img', dialog).src = button.dataset.zoom;
  dialog.showModal();
}));
$('#close-dialog').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });
$('#copy-citation').addEventListener('click', async () => {
  const text = $('#bibtex').textContent;
  try {
    if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(text);
    else {
      const field = document.createElement('textarea'); field.value = text; field.style.position = 'fixed'; field.style.opacity = '0'; document.body.append(field); field.select();
      const copied = document.execCommand('copy'); field.remove(); if (!copied) throw new Error('Clipboard unavailable');
    }
    toast('BibTeX copied');
    $('#copy-citation').textContent = 'Copied'; setTimeout(() => $('#copy-citation').textContent = 'Copy BibTeX', 2000);
  } catch { toast('Copy failed. Select the BibTeX text and copy it manually.'); }
});

const sectionObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => { if (entry.isIntersecting) $$('.site-header nav a').forEach(a => a.classList.toggle('active', a.hash === `#${entry.target.id}`)); });
}, {rootMargin: '-15% 0px -65% 0px'});
$$('main section[id]').forEach(section => sectionObserver.observe(section));

// Use a portrait composition on small screens so source/target columns are not squeezed.
const portrait = matchMedia('(max-width: 760px)');
function setTeaserVideo() {
  const video = $('#teaser-video');
  const name = portrait.matches ? 'hero-warping-mobile' : 'hero-warping';
  const hadSource = !!video.getAttribute('src');
  video.pause();
  video.poster = `assets/${name}.webp`;
  video.dataset.src = `assets/${name}.mp4`;
  if (hadSource) {
    video.src = video.dataset.src;
    video.load();
    if (video.dataset.visible === 'true') playVideo(video);
  }
}
portrait.addEventListener('change', setTeaserVideo);
setTeaserVideo();
observeVideos(); updateMotion();

// Temporary: switcher for comparing the two title designs. Remove once one is chosen.
(() => {
  const root = document.documentElement;
  const box = document.createElement('div');
  box.className = 'hero-switch';
  box.innerHTML = '<span>Title design</span><button type="button" data-hero-option="panel">Panel</button><button type="button" data-hero-option="overlay">Overlay</button>';
  document.body.append(box);
  const sync = () => $$('button', box).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.heroOption === root.dataset.hero)));
  box.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    root.dataset.hero = b.dataset.heroOption;
    const url = new URL(location.href); url.searchParams.set('hero', b.dataset.heroOption); history.replaceState(null, '', url);
    sync();
  });
  sync();
})();

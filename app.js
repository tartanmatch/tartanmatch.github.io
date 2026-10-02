'use strict';
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
let paused = motionPreference.matches;
let activeDemo = 'explorer';
let toastTimeout;
function toast(message) {
  $('#toast').textContent = message;
  $('#toast').classList.add('visible');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => $('#toast').classList.remove('visible'), 2500);
}
function updateTheme() {
  const isDark = document.documentElement.dataset.theme === 'dark';
  $('#theme-toggle').textContent = isDark ? '☀' : '☾';
  $('#theme-toggle').setAttribute('aria-label', `Switch to ${isDark ? 'light' : 'dark'} theme`);
  $('meta[name="theme-color"]').content = isDark ? '#0b0d10' : '#f8f7f4';
}
$('#theme-toggle').addEventListener('click', () => {
  document.documentElement.dataset.theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  try { localStorage.setItem('tartanmatch-theme', document.documentElement.dataset.theme); } catch {}
  updateTheme();
});
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
  entries.forEach(({target:video, isIntersecting}) => {
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

function warpLabels(source, target) {
  return `<span><b>1 · Source: ${source}</b><small>Input · fixed view</small></span><span class="comparison-reference"><b>2 · Target: ${target}</b><small>Input · changing view</small></span><span class="prediction-label"><b>3 · Source → target</b><small>Prediction · ${source} appearance</small></span>`;
}

const modalities = [
  {id:'rgb', label:'RGB', color:'var(--mod-rgb)'},
  {id:'event', label:'Event', color:'var(--mod-event)'},
  {id:'thermal', label:'Thermal', color:'var(--mod-thermal)'},
  {id:'depth', label:'Depth', color:'var(--mod-depth)'},
  {id:'lidar', label:'LiDAR', color:'var(--mod-lidar)'}
];
const matrix = $('#pair-matrix');
matrix.innerHTML = '<span aria-hidden="true"></span>' + modalities.map(m => `<span class="matrix-label">${m.label}</span>`).join('') + modalities.map((source, r) => `<span class="matrix-label row-label">${source.label}</span>` + modalities.map((target, c) => `<button class="pair-cell" style="--from:${source.color};--to:${target.color}" data-source="${source.id}" data-target="${target.id}" data-index="${r*5+c}" aria-label="${source.label} to ${target.label}" aria-pressed="${r===0&&c===1}" title="${source.label} → ${target.label}"><i aria-hidden="true"></i><span aria-hidden="true">→</span><i aria-hidden="true"></i></button>`).join('')).join('');
function selectPair(button) {
  $$('.pair-cell').forEach(cell => cell.setAttribute('aria-pressed', String(cell===button)));
  const {source, target, index} = button.dataset;
  const sourceName = modalities.find(m=>m.id===source).label;
  const targetName = modalities.find(m=>m.id===target).label;
  $('#pair-title').innerHTML = `${sourceName} <span>→</span> ${targetName}`;
  $('#pair-labels').innerHTML = warpLabels(sourceName, targetName);
  $('#pair-explanation').innerHTML = `<strong>Compare 3 with 2.</strong> The right panel places ${sourceName} source pixels in the current ${targetName} target’s coordinates. Scene structures should align${source===target ? '.' : ' even though their sensor appearances differ.'}`;
  $('#pair-counter').textContent = `${String(Number(index)+1).padStart(2,'0')} / 25`;
  const video = $('#pair-video');
  video.pause();
  video.poster = `assets/pair-${source}-${target}.webp`;
  video.src = `assets/pair-${source}-${target}.mp4`;
  video.setAttribute('aria-label', `Left: fixed ${sourceName} source. Middle: ${targetName} target sequence. Right: ${sourceName} source warped into each target view.`);
  video.load();
  playVideo(video);
}
matrix.addEventListener('click', e => { const button = e.target.closest('.pair-cell'); if (button) selectPair(button); });
matrix.addEventListener('keydown', e => {
  const button = e.target.closest('.pair-cell'); if (!button) return;
  const index = Number(button.dataset.index);
  const offset = {ArrowRight:1,ArrowLeft:-1,ArrowDown:5,ArrowUp:-5}[e.key];
  if (!offset) return;
  e.preventDefault();
  const next = $$('.pair-cell')[(index+offset+25)%25];
  next.focus(); selectPair(next);
});
function setupTabs(selector, onSelect) {
  const buttons = $$(selector);
  buttons.forEach(button => {
    button.addEventListener('click', () => {
      buttons.forEach(b => {b.setAttribute('aria-selected',String(b===button)); b.tabIndex = b===button ? 0 : -1;});
      onSelect(button);
    });
    button.addEventListener('keydown', e => {
      if (!['ArrowRight','ArrowLeft','Home','End'].includes(e.key)) return;
      e.preventDefault();
      let index=buttons.indexOf(button);
      index = e.key==='Home' ? 0 : e.key==='End' ? buttons.length-1 : (index+(e.key==='ArrowRight'?1:-1)+buttons.length)%buttons.length;
      buttons[index].click(); buttons[index].focus();
    });
  });
}
function renderComparison() {
  const pair = $('#real-pair').value;
  const [sourceId,targetId] = pair.split('-');
  const sourceName = modalities.find(m=>m.id===sourceId).label;
  const targetName = modalities.find(m=>m.id===targetId).label;
  $$('video', $('#real-comparison')).forEach(v=>{v.pause();videoObserver.unobserve(v);observedVideos.delete(v);});
  $('#real-comparison').innerHTML = [
    ['minima','MINIMA (RoMa)'],['matchanything','MatchAnything (RoMa)'],['ours','TartanMatch (ours)']
  ].map(([id,name]) => `<article class="comparison-item ${id}"><h3>${name}</h3><div class="triptych-labels explained-labels">${warpLabels(sourceName,targetName)}</div><video class="demo-video" muted loop playsinline controls preload="none" poster="assets/real-${pair}-${id}.webp" data-src="assets/real-${pair}-${id}.mp4" aria-label="${name}. Left: fixed ${sourceName} source. Middle: ${targetName} target. Right: source warped into target coordinates."></video></article>`).join('');
  observeVideos($('#real-comparison'));
}
setupTabs('[data-demo-tab]', button => {
  activeDemo = button.dataset.demoTab;
  $('#panel-explorer').hidden = activeDemo !== 'explorer';
  $('#panel-real').hidden = activeDemo !== 'real';
  if (activeDemo === 'real' && !$('#real-comparison').children.length) renderComparison();
  $$('video', $('#demonstrations')).forEach(v=>{if(v.closest('[hidden]'))v.pause();});
});
$('#real-pair').addEventListener('change',renderComparison);
$('#sync-videos').addEventListener('click', async () => {
  const videos = $$('video', $('#real-comparison'));
  await Promise.all(videos.map(video => new Promise(resolve => {
    video.pause(); video.currentTime=0;
    if(video.readyState>=3) resolve();
    else video.addEventListener('canplay',resolve,{once:true});
  })));
  videos.forEach(video=>video.play().catch(()=>{}));
});

// Values transcribed from Tables II, III, and V of the supplied manuscript.
const resultSets = {
  cross: {
    title:'Cross-modal correspondence',unit:'EPE (px) ↓',source:'Table II',
    rows:[
      ['RGB → Depth','DTU',12.78,36.56,'MINIMA (RoMa)'],
      ['RGB → Event','DSERT-RoLL',6.63,11.61,'MatchAnything (RoMa)'],
      ['RGB → Thermal','MTV',2.48,3.28,'MatchAnything (RoMa)'],
      ['RGB → Thermal','DSERT-RoLL',10.95,9.57,'MINIMA (RoMa)'],
      ['RGB → LiDAR','DSERT-RoLL',8.46,52.70,'MatchAnything (RoMa)'],
      ['Thermal → Event','DSERT-RoLL',9.61,13.58,'MINIMA (RoMa)'],
      ['Event → LiDAR','DSERT-RoLL',9.55,30.48,'MatchAnything (RoMa)'],
      ['Thermal → LiDAR','DSERT-RoLL',11.61,42.88,'MatchAnything (RoMa)'],
      ['Depth → Thermal','MTV',13.45,23.80,'MatchAnything (RoMa)']
    ]
  },
  same: {
    title:'Same-modal correspondence',unit:'EPE (px) ↓',source:'Table V',
    rows:[
      ['RGB → RGB','DTU',5.74,4.68,'RoMa v2'],
      ['RGB → RGB','DSERT-RoLL',2.40,2.55,'RoMa v2'],
      ['Depth → Depth','DTU',5.67,26.54,'MatchAnything (RoMa) / RoMa v2'],
      ['Event → Event','MVSEC · 20 Hz',1.17,1.33,'RoMa'],
      ['Event → Event','MVSEC · 45 Hz',.70,.77,'UFM'],
      ['Event → Event','DSERT-RoLL',2.32,2.40,'E-RAFT'],
      ['Thermal → Thermal','MTV',.77,.56,'MatchAnything (RoMa)'],
      ['Thermal → Thermal','DSERT-RoLL',3.07,3.21,'RoMa v2'],
      ['LiDAR → LiDAR','DSERT-RoLL',5.89,13.01,'RoMa']
    ]
  },
  pose: {
    title:'Cross-modal relative pose',unit:'Pose AUC (%) ↑',source:'Table III',
    rows:[
      ['RGB → Depth','DTU · AUC@5°',10.6,10.7,'MINIMA (RoMa)'],
      ['RGB → Depth','DTU · AUC@10°',24.7,20.4,'MINIMA (RoMa)'],
      ['RGB → Depth','DTU · AUC@20°',45.4,32.0,'MINIMA (RoMa)'],
      ['RGB → Event','EDS · AUC@5°',8.3,2.9,'MatchAnything (RoMa)'],
      ['RGB → Event','EDS · AUC@10°',17.8,7.2,'MatchAnything (RoMa)'],
      ['RGB → Event','EDS · AUC@20°',29.5,13.9,'MatchAnything (RoMa)']
    ]
  }
};
function renderResults(kind) {
  const data=resultSets[kind];
  const max=Math.max(...data.rows.flatMap(r=>[r[2],r[3]]));
  const fmt=v=>v.toFixed(kind==='pose'?1:2);
  $('#results-panel').setAttribute('aria-labelledby',`tab-${kind}`);
  $('#chart-title').textContent=data.title;
  $('#chart-unit').textContent=data.unit;
  $('#result-chart').innerHTML=data.rows.map(([pair,dataset,ours,baseline,name])=>`<div class="chart-row" role="img" aria-label="${pair}, ${dataset}: TartanMatch ${fmt(ours)}, ${name} ${fmt(baseline)}. ${data.unit}"><div class="chart-row-label">${pair}<small>${dataset}</small></div><div class="bar-pair" aria-hidden="true"><div class="result-bar ours" style="--width:${ours/max*100}%"></div><div class="result-bar" style="--width:${baseline/max*100}%"></div></div><div class="chart-values" aria-hidden="true"><b>${fmt(ours)}</b><span>${fmt(baseline)}</span></div></div>`).join('');
  $('#results-table').innerHTML=`<table><caption>${data.source} · ${data.unit}</caption><thead><tr><th scope="col">Pair</th><th scope="col">Evaluation</th><th scope="col">Baseline</th><th scope="col">Baseline value</th><th scope="col">TartanMatch</th></tr></thead><tbody>${data.rows.map(([pair,dataset,ours,baseline,name])=>`<tr><th scope="row">${pair}</th><td>${dataset}</td><td>${name}</td><td>${fmt(baseline)}</td><td>${fmt(ours)}</td></tr>`).join('')}</tbody></table>`;
}
setupTabs('[data-result-tab]',button=>renderResults(button.dataset.resultTab));
renderResults('cross');


// Table VII: pair-specific and joint training on TartanAir V2 validation.
const jointRows = [
  ['rgb', 'rgb', 0.82, 1.00, -22.0], ['depth', 'depth', 0.73, 0.90, -23.3], ['event', 'event', 1.29, 1.22, 5.4], ['thermal', 'thermal', 3.14, 3.24, -3.2], ['lidar', 'lidar', 7.84, 5.00, 36.2],
  ['rgb', 'depth', 3.16, 2.89, 8.5], ['rgb', 'event', 2.66, 1.69, 36.5], ['rgb', 'thermal', 2.28, 2.34, -2.6], ['rgb', 'lidar', 8.78, 6.01, 31.6], ['depth', 'event', 3.12, 1.85, 40.7],
  ['depth', 'thermal', 5.93, 5.04, 15.0], ['depth', 'lidar', 4.85, 3.19, 34.2], ['event', 'thermal', 5.29, 3.85, 27.2], ['event', 'lidar', 14.20, 5.47, 61.5], ['thermal', 'lidar', 13.02, 9.37, 28.0]
].sort((a, b) => b[2] - a[2]);
const modLabel = id => modalities.find(m => m.id === id).label;
function renderJointResults() {
  const scale = 15;
  const pos = value => `${value / scale * 100}%`;
  const ticks = [0, 5, 10, 15].map(value => `<span style="left:${pos(value)}">${value}</span>`).join('');
  $('#joint-chart').innerHTML = `<div class="joint-row joint-axis" aria-hidden="true"><span>Error (px) ↓</span><div class="joint-ticks">${ticks}</div><span>Error change</span></div>` + jointRows.map(([source,target,single,joint,change]) => {
    const better = change > 0;
    return `<div class="joint-row" role="img" aria-label="${modLabel(source)} to ${modLabel(target)}: pair-specific ${single.toFixed(2)} pixels, joint ${joint.toFixed(2)} pixels, ${Math.abs(change).toFixed(1)}% ${better ? 'lower' : 'higher'} error.">
      <div class="chart-row-label">${modLabel(source)} → ${modLabel(target)}<small>${source === target ? 'Same-modal' : 'Cross-modal'}</small></div>
      <div class="joint-track" aria-hidden="true"><i class="joint-link" style="left:${pos(Math.min(single,joint))};width:${Math.abs(single-joint)/scale*100}%"></i><i class="joint-dot-single" style="left:${pos(single)}" title="Pair-specific: ${single.toFixed(2)} px"></i><i class="joint-dot-model" style="left:${pos(joint)}" title="Joint: ${joint.toFixed(2)} px"></i></div>
      <div class="joint-change ${better ? 'better' : ''}" aria-hidden="true">${better ? '−' : '+'}${Math.abs(change).toFixed(1)}%</div>
    </div>`;
  }).join('');
}
function renderKeyResults() {
  const average = values => values.reduce((sum,value) => sum+value,0)/values.length;
  const accuracy = ['cross','same'].map(kind => [kind === 'cross' ? 'Cross-modal' : 'Same-modal',average(resultSets[kind].rows.map(row=>row[2])),average(resultSets[kind].rows.map(row=>row[3]))]);
  const training = [false,true].map(same => {
    const rows = jointRows.filter(row=>(row[0]===row[1])===same);
    return [same ? 'Same-modal' : 'Cross-modal',average(rows.map(row=>row[3])),average(rows.map(row=>row[2]))];
  });
  function drawSummary(selector,rows,oursLabel,baselineLabel) {
    const max = Math.max(...rows.flatMap(row=>row.slice(1)));
    $(selector).innerHTML = rows.map(([label,ours,baseline])=>`<div class="summary-group" role="img" aria-label="${label}: ${oursLabel} ${ours.toFixed(2)} pixels, ${baselineLabel} ${baseline.toFixed(2)} pixels."><p>${label}</p><div class="summary-bar" aria-hidden="true"><i class="ours" style="--width:${ours/max*100}%"></i><b>${ours.toFixed(2)}</b></div><div class="summary-bar" aria-hidden="true"><i style="--width:${baseline/max*100}%"></i><span>${baseline.toFixed(2)}</span></div></div>`).join('');
  }
  drawSummary('#key-accuracy-chart',accuracy,'TartanMatch','best other method');
  drawSummary('#key-joint-chart',training,'joint model','one model per pair');
  const runtimes = [['TartanMatch',27.8],['UFM',27.6],['MatchAnything (RoMa)',206.4],['MINIMA (RoMa)',262.4]];
  function drawSpeed(selector,rows) {
    $(selector).innerHTML = rows.map(([name,time])=>`<div class="speed-row ${name==='TartanMatch'?'ours':''}"><span>${name}</span><b>${time.toFixed(1)}</b><i style="--width:${time/262.4*100}%" aria-hidden="true"></i></div>`).join('');
  }
  drawSpeed('#key-speed-chart',runtimes.filter(row=>row[0]!=='UFM'));
  drawSpeed('#speed-chart',runtimes);
}
renderJointResults();
renderKeyResults();

const dialog=$('#image-dialog');
$$('[data-zoom]').forEach(button=>button.addEventListener('click',()=>{
  $('img',dialog).src=button.dataset.zoom;
  dialog.showModal();
}));
$('#close-dialog').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
$('#copy-citation').addEventListener('click',async()=>{
  const text=$('#bibtex').textContent;
  try {
    if(navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(text);
    else {
      const field=document.createElement('textarea');field.value=text;field.style.position='fixed';field.style.opacity='0';document.body.append(field);field.select();
      const copied=document.execCommand('copy');field.remove();if(!copied)throw new Error('Clipboard unavailable');
    }
    toast('Citation copied');
    $('#copy-citation').textContent='Copied ✓';setTimeout(()=>$('#copy-citation').textContent='Copy citation ⧉',2000);
  } catch { toast('Select the BibTeX text to copy the citation.'); }
});
const sectionObserver=new IntersectionObserver(entries=>{
  entries.forEach(entry=>{if(entry.isIntersecting){$$('.site-header nav a').forEach(a=>a.classList.toggle('active',a.hash===`#${entry.target.id}`));}});
},{rootMargin:'-15% 0px -65% 0px'});
$$('main section[id]').forEach(section=>sectionObserver.observe(section));
// Use a portrait composition on small screens so source/target columns never get cropped.
const portraitHero = matchMedia('(max-width: 760px)');
function setHeroVideo() {
  const video = $('#hero-background-video');
  const name = portraitHero.matches ? 'hero-warping-mobile' : 'hero-warping';
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
portraitHero.addEventListener('change', setHeroVideo);
setHeroVideo();
observeVideos();updateMotion();

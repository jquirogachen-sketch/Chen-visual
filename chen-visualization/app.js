'use strict';
const navbar = document.querySelector('header');
let headerFrame = 0;
function updateNavbar() {
  navbar?.classList.toggle('is-compact', window.scrollY > 48);
  headerFrame = 0;
}
window.addEventListener('scroll', () => {
  if (!headerFrame) headerFrame = window.requestAnimationFrame(updateNavbar);
}, {passive:true});
window.addEventListener('pageshow', updateNavbar);
updateNavbar();
// Use content coordinates rather than the section box, which includes generous top padding.
function alignSection(hash, behavior = 'smooth') {
  const target = document.getElementById(hash.slice(1));
  if (!target || target.closest('[hidden]')) return;
  const content = target.querySelector('.eyebrow, h1, h2') || target;
  const rootStyles = getComputedStyle(document.documentElement);
  const gap = parseFloat(getComputedStyle(target).getPropertyValue('--anchor-content-gap')) || 50;
  const contentTop = window.scrollY + content.getBoundingClientRect().top;
  const expandedHeight = parseFloat(rootStyles.getPropertyValue('--header-height')) || 88;
  const compactHeight = parseFloat(rootStyles.getPropertyValue('--header-compact-height')) || 64;
  // Use the final header size even when navigating from the top of the page.
  const headerHeight = contentTop - expandedHeight - gap > 48 ? compactHeight : expandedHeight;
  const top = contentTop - headerHeight - gap;
  window.scrollTo({top:Math.max(0, top), behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : behavior});
}
document.querySelectorAll('a[href^="#"]').forEach(link => {
  const hash = link.getAttribute('href');
  if (!hash || hash === '#') return;
  link.addEventListener('click', event => {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    if (!document.getElementById(hash.slice(1))) return;
    event.preventDefault();
    if (location.hash !== hash) history.pushState(null, '', hash);
    alignSection(hash);
  });
});
window.addEventListener('hashchange', () => alignSection(location.hash, 'auto'));
window.addEventListener('load', () => { if (location.hash) alignSection(location.hash, 'auto'); });
// Reveal once in view. Content stays visible if animation support is unavailable.
const contactSection = document.querySelector('#contact');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
if (contactSection && 'IntersectionObserver' in window && !reducedMotion.matches) {
  const revealContact = new IntersectionObserver(entries => {
    if (!entries.some(entry => entry.isIntersecting)) return;
    const elements = contactSection.querySelectorAll('.contact-title, .contact-brief, .contact-option');
    elements.forEach((element, index) => element.animate([
      {opacity:0, transform:'translateY(16px)'},
      {opacity:1, transform:'translateY(0)'}
    ], {duration:550, delay:index * 65, easing:'cubic-bezier(.22,1,.36,1)', fill:'backwards'}));
    revealContact.disconnect();
  }, {threshold:.15});
  revealContact.observe(contactSection);
}
// Standalone reconstruction of the published interactions; no build step or CDN required.
const projects = [...document.querySelectorAll('#work .project')].map((figure) => ({
  name: figure.querySelector('img').alt,
  src: figure.querySelector('img').getAttribute('src'),
  location: figure.querySelector('em').textContent.replace(/^\s*—\s*/, ''),
  category: figure.querySelector('figcaption > span:last-child').textContent
}));
const carousel = document.querySelector('.render-showcase');
if (!carousel.closest('[hidden]')) {
const range = document.querySelector('#comparison-range');
const dots = document.querySelector('.showcase-dots');
let active = 7;
function updateComparison() {
  document.querySelector('#hero-before').style.clipPath = `inset(0 ${100 - Number(range.value)}% 0 0)`;
  document.querySelector('#compare-line').style.left = `${range.value}%`;
  range.setAttribute('aria-valuetext', `${range.value}% base render`);
}
function showProject(index) {
  active = (index + projects.length) % projects.length;
  const p = projects[active];
  for (const [selector, label] of [['#hero-final', 'final visualization'], ['#hero-base', 'base render']]) {
    const img = document.querySelector(selector);
    img.src = p.src;
    img.alt = `${p.name} — ${label}`;
  }
  const caption = document.querySelector('#hero-caption');
  caption.replaceChildren(document.createTextNode(`${p.name} `));
  const place = document.createElement('span');
  place.textContent = `— ${p.location}`;
  caption.append(place);
  range.value = '50';
  range.setAttribute('aria-label', `Compare base and final: ${p.name}`);
  updateComparison();
  [...dots.children].forEach((dot, i) => dot.setAttribute('aria-current', String(i === active)));
}
projects.forEach((p, i) => {
  const dot = document.createElement('button');
  dot.type = 'button';
  dot.setAttribute('aria-label', `Show ${p.name}, ${p.location}`);
  dot.append(document.createElement('span'));
  dot.addEventListener('click', () => showProject(i));
  dots.append(dot);
});
range.addEventListener('input', updateComparison);
document.querySelector('.showcase-arrow.previous').addEventListener('click', () => showProject(active - 1));
document.querySelector('.showcase-arrow.next').addEventListener('click', () => showProject(active + 1));
showProject(active);
}

document.querySelectorAll('[data-package]').forEach(link => link.addEventListener('click', () => {
  document.querySelector('[name="images"]').value = link.dataset.package;
}));

const form = document.querySelector('.quote-form');
const filesInput = form.querySelector('[type="file"]');
const status = form.querySelector('[role="status"]');
function validateFiles() {
  const files = [...filesInput.files];
  let error = '';
  if (files.length > 5 || files.reduce((total, f) => total + f.size, 0) > 15 * 1024 * 1024) error = 'Please choose up to 5 files, with a total size of 15 MB or less.';
  if (files.some(f => !/\.(jpe?g|png|webp|pdf|zip)$/i.test(f.name))) error = 'Please use JPG, PNG, WebP, PDF or ZIP files.';
  filesInput.setCustomValidity(error);
  document.querySelector('#file-label').textContent = files.length ? files.map(f => f.name).join(', ') : 'Choose files · JPG, PNG, WebP, PDF or ZIP';
  return !error;
}
filesInput.addEventListener('change', () => { validateFiles(); filesInput.reportValidity(); });
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (!validateFiles() || !form.reportValidity()) return;
  status.classList.remove('error');
  status.textContent = 'Sending your inquiry…';
  const button = form.querySelector('[type="submit"]');
  button.disabled = true;
  try {
    if (location.protocol === 'file:') throw new Error('The form needs a web server. Please email jquirogachen@gmail.com directly.');
    const response = await fetch(form.action, {method:'POST', body:new FormData(form), headers:{Accept:'application/json'}});
    const type = response.headers.get('content-type') || '';
    if (!type.includes('application/json')) throw new Error('The contact service is unavailable. Please email jquirogachen@gmail.com directly.');
    const result = await response.json();
    if (!response.ok || !result.ok) throw new Error(result.error || 'Unable to send. Please email jquirogachen@gmail.com directly.');
    status.textContent = 'Your inquiry has been submitted. Thank you — we’ll be in touch.';
    form.reset();
    validateFiles();
  } catch (error) {
    status.classList.add('error');
    status.textContent = error.message || 'Unable to send. Please email jquirogachen@gmail.com directly.';
  } finally { button.disabled = false; }
});

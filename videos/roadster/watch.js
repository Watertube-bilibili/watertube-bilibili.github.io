const video = document.querySelector('#film');
const start = document.querySelector('#start-film');
const chapters = document.querySelector('#chapters');
const duration = document.querySelector('#duration');
const message = document.querySelector('#player-message');
let pendingSeek = null;

function play() {
  message.hidden = true;
  video.play().catch(error => {
    if (error.name !== 'AbortError') {
      message.hidden = false;
    }
  });
}

function setMetadata() {
  if (!Number.isFinite(video.duration)) return;
  const seconds = Math.floor(video.duration);
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  duration.dateTime = 'PT' + minutes + 'M' + remaining + 'S';
  duration.textContent = String(minutes).padStart(2, '0') + ':' + String(remaining).padStart(2, '0');
  if (pendingSeek !== null) {
    video.currentTime = Math.min(pendingSeek, Math.max(0, video.duration - 0.1));
    pendingSeek = null;
  }
}
function syncStart() {
  start.hidden = !video.paused || video.currentTime > 0 || !!video.error;
}
start.hidden = false;
chapters.hidden = false;
start.addEventListener('click', play);
video.addEventListener('loadedmetadata', setMetadata);
video.addEventListener('play', syncStart);
video.addEventListener('pause', syncStart);
video.addEventListener('seeked', syncStart);
function showError() {
  message.hidden = false;
  start.hidden = true;
}
video.addEventListener('error', showError);
video.querySelector('source').addEventListener('error', showError);
chapters.addEventListener('click', event => {
  const target = event.target.closest('button[data-time]');
  if (!target) return;
  pendingSeek = Number(target.dataset.time);
  setMetadata();
  play();
});
if (video.readyState >= 1) setMetadata();

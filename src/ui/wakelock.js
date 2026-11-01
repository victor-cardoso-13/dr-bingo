let sentinel = null;
let wanted = false;

async function request() {
  try {
    if (navigator.wakeLock && !sentinel) {
      sentinel = await navigator.wakeLock.request('screen');
      sentinel.addEventListener?.('release', () => {
        sentinel = null;
      });
    }
  } catch {
    sentinel = null;
  }
}

export function keepAwake() {
  wanted = true;
  request();
}

export function release() {
  wanted = false;
  const s = sentinel;
  sentinel = null;
  try {
    s?.release();
  } catch {
    // ignora
  }
}

document.addEventListener('visibilitychange', () => {
  if (wanted && document.visibilityState === 'visible') request();
});

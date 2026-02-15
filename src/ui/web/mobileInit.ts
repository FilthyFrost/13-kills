/**
 * 移动端初始化：竖屏提示、防滑动
 */

function isMobile(): boolean {
  return (
    'ontouchstart' in window ||
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  );
}

function isPortrait(): boolean {
  const mediaMatches = window.matchMedia('(orientation: portrait)').matches;
  const sizeMatches = window.innerHeight > window.innerWidth;
  return mediaMatches || sizeMatches;
}

function updatePortraitOverlay(): void {
  const overlay = document.getElementById('portrait-overlay');
  if (!overlay) return;

  if (isPortrait() && isMobile()) {
    overlay.classList.add('visible');
    overlay.style.visibility = 'visible';
    overlay.style.pointerEvents = 'auto';
  } else {
    overlay.classList.remove('visible');
    overlay.style.visibility = 'hidden';
    overlay.style.pointerEvents = 'none';
  }
}

function initPortraitOverlay(): void {
  updatePortraitOverlay();

  window.addEventListener('orientationchange', () => {
    setTimeout(updatePortraitOverlay, 100);
  });

  window.addEventListener('resize', updatePortraitOverlay);

  const mediaQuery = window.matchMedia('(orientation: portrait)');
  mediaQuery.addEventListener('change', updatePortraitOverlay);
}

initPortraitOverlay();

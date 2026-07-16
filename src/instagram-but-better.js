/*
- download button
	- images
	- videos
	- use creator handle + post date time

- video player
	- pointer-events: none on video overlay (allows video controls to be shown on hover)
	- expand button: the same function as the overlay above
	- stop auto-play
 */

// ==UserScript==
// @name         Instagram Feed Autoplay Disabler (claude)
// @namespace    https://tampermonkey.net/
// @version      1.0
// @description  Prevents videos in the Instagram feed from autoplaying on scroll or when returning to the tab. Manual clicks still play the video normally.
// @author       you
// @match        https://www.instagram.com/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  // Tracks videos the user has explicitly asked to play (via click/tap),
  // so we don't fight against intentional playback.
  const userInitiated = new WeakSet();

  function markUserInitiated(video) {
    userInitiated.add(video);
    // Give a short grace period, then go back to "guarded" mode.
    // This means if the user scrolls away and Instagram tries to
    // autoplay it again later, we'll still pause it.
    setTimeout(() => userInitiated.delete(video), 3000);
  }

  function pauseIfNotUserInitiated(video) {
    if (!userInitiated.has(video) && !video.paused) {
      video.pause();
    }
  }

  function pauseAllVideos() {
    document.querySelectorAll('video').forEach((video) => {
      pauseIfNotUserInitiated(video);
    });
  }

  // --- 1. Catch autoplay triggered by scrolling into view ---
  // Instagram uses its own IntersectionObserver logic to start playback
  // as a video enters the viewport. We intercept the resulting 'play'
  // event and immediately pause unless the user caused it.
  function attachVideoGuards(video) {
    if (video.dataset.__noAutoplayGuarded) return;
    video.dataset.__noAutoplayGuarded = 'true';

    // Native autoplay attribute, just in case.
    video.removeAttribute('autoplay');
    video.autoplay = false;

    video.addEventListener('play', () => {
      // Runs on every play attempt, including ones from Instagram's JS.
      // requestAnimationFrame lets the play() call resolve before we pause,
      // avoiding a play()/pause() race that can throw in some browsers.
      requestAnimationFrame(() => pauseIfNotUserInitiated(video));
    });

    // Treat direct clicks/taps on the video as user intent.
    video.addEventListener('pointerdown', () => markUserInitiated(video));
  }

  function scanForVideos(root = document) {
    root.querySelectorAll('video').forEach(attachVideoGuards);
  }

  // Watch the DOM for videos that Instagram inserts as you scroll
  // (feed items are virtualized / lazily mounted).
  const mutationObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach((node) => {
        if (!(node instanceof HTMLElement)) return;
        if (node.tagName === 'VIDEO') {
          attachVideoGuards(node);
        } else {
          scanForVideos(node);
        }
      });
    }
  });

  mutationObserver.observe(document.body, { childList: true, subtree: true });
  scanForVideos();

  // --- 2. Catch autoplay triggered by returning to the tab ---
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      // Instagram sometimes resumes playback right when the tab regains
      // focus/visibility. Pause shortly after, giving its own resume
      // logic a moment to fire first.
      setTimeout(pauseAllVideos, 50);
      setTimeout(pauseAllVideos, 300);
    }
  });

  window.addEventListener('focus', () => {
    setTimeout(pauseAllVideos, 50);
  });

  // --- 3. Safety net: periodically sweep in case something slips through ---
  setInterval(pauseAllVideos, 1000);
})();
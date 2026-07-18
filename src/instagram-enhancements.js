// ==UserScript==
// @name         Instagram Enhancements
// @namespace    https://tampermonkey.net/
// @version      1.0
// @description  Prevents videos in the Instagram feed from autoplaying on scroll or when returning to the tab. Manual clicks still play the video normally.
// @author       you
// @match        https://www.instagram.com/*
// @icon         https://www.google.com/s2/favicons?bb=1&domain=instagram.com
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function () {
	'use strict';

	function injectStyles() {
		const style = document.createElement('style');
		document.head.appendChild(style);
		style.textContent = `
			/* NATIVE CONTROLS */
			::-webkit-media-controls-panel { padding-right: 40px; }
			::-webkit-media-controls-timeline { padding-bottom: 24px }

			::-webkit-media-controls-mute-button,
			::-webkit-media-controls-volume-control-container { display: none; }

			/* OVERLAY */
			[aria-label="Video player"] { pointer-events: none; }
			[aria-label="Video player"] [aria-label="Adjust volume"] { pointer-events: auto; }
			[aria-label="Video player"] [role="presentation"] { display: none !important; }
			/* make room for tags button */
			a:has([aria-label="Video player"] [aria-label="Tags"]) ::-webkit-media-controls-panel { padding-inline: 40px; }
		`;
	}

	function preventAutoplay() {
		const originalPlay = HTMLMediaElement.prototype.play;

		HTMLMediaElement.prototype.play = function (userInitiated) {
			if (this.tagName == 'VIDEO' && userInitiated != 'userInitiated') {
				this.pause();
				return Promise.resolve();
			}

			return originalPlay.apply(this, arguments);
		};
	}

	function update() {
		// VIDEOS
		document.querySelectorAll('video').forEach((video) => {
			if (video.controls) return; // already initialized

			video.controls = true;

			const container = video.closest('a');
			container?.removeAttribute('href');
		});
	}

	const init = () => {
		injectStyles();
		preventAutoplay();
		setInterval(update, 1000);
	};

	init();
})();

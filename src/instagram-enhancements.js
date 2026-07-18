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
			::-webkit-media-controls-panel { padding-inline: 40px; }
			::-webkit-media-controls-timeline { padding-bottom: 24px }

			::-webkit-media-controls-play-button,
			::-webkit-media-controls-mute-button,
			::-webkit-media-controls-volume-control-container { display: none; }

			/* OVERLAY */
			[aria-label="Video player"] { pointer-events: none; }
			[aria-label="Video player"] [aria-label="Adjust volume"] { pointer-events: auto; }
			[aria-label="Video player"] [role="presentation"] { display: none !important; }

			/* CONTROLS */
			.play-pause-button {
				position: absolute;
				inset: auto auto 0 0;
				width: 52px;
				height: 52px;
				border: none;
				border-radius: 50px;
				background: radial-gradient(#454545 0 14px, transparent 15px);
				pointer-events: auto;
				cursor: pointer;

				&::before {
					content: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='%23FFF' height='24' viewBox='0 0 24 24' width='24'%3E%3Cpath d='M5.888 22.5a3.46 3.46 0 0 1-1.721-.46l-.003-.002a3.451 3.451 0 0 1-1.72-2.982V4.943a3.445 3.445 0 0 1 5.163-2.987l12.226 7.059a3.444 3.444 0 0 1-.001 5.967l-12.22 7.056a3.462 3.462 0 0 1-1.724.462Z'%3E%3C/path%3E%3C/svg%3E");
					display: block;
					margin: 2px 0 0 1px;
					scale: .6;
				}
			}

			a:has(video.playing) .play-pause-button::before {
				content: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' height='24px' viewBox='0 -960 960 960' width='24px' fill='%23fff'%3E%3Cpath d='M600-200q-33 0-56.5-23.5T520-280v-400q0-33 23.5-56.5T600-760h80q33 0 56.5 23.5T760-680v400q0 33-23.5 56.5T680-200h-80Zm-320 0q-33 0-56.5-23.5T200-280v-400q0-33 23.5-56.5T280-760h80q33 0 56.5 23.5T440-680v400q0 33-23.5 56.5T360-200h-80Zm320-80h80v-400h-80v400Zm-320 0h80v-400h-80v400Zm0-400v400-400Zm320 0v400-400Z'/%3E%3C/svg%3E");
				margin: 4px 0 0 -1px;
				scale: .9;
			}
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
			video.onplay = () => video.classList.add('playing');
			video.onpause = () => video.classList.remove('playing');

			const container = video.closest('a');
			container?.removeAttribute('href');

			const playPauseButton = document.createElement('button');
			playPauseButton.onclick = () => video.paused ? video.play('userInitiated') : video.pause();
			playPauseButton.className = 'play-pause-button';

			const overlay = container?.querySelector('[aria-label="Video player"]');
			overlay?.appendChild(playPauseButton);
		});
	}

	const init = () => {
		injectStyles();
		preventAutoplay();
		setInterval(update, 1000);
	};

	init();
})();

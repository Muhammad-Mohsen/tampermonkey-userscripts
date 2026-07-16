// ==UserScript==
// @name         YouTube Speed Controls
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  Add speed controls to YouTube player
// @author       Muhammad Mohsen
// @match        https://www.youtube.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=youtube.com
// @grant        none
// ==/UserScript==

(function() {
	'use strict';

	function init() {
		const player = document.querySelector('video');
		const container = document.querySelector('.ytp-right-controls-left');

		function createButton(rate) {
			const button = document.createElement('button');
			button.className = 'ytp-button ytp-settings-button quick-ctrl-button';
			button.setAttribute('aria-label', 'Playback Rate');
			button.setAttribute('data-rate', rate);

			button.textContent = rate;
			button.style = 'display: inline-flex; align-items: center; justify-content: center;';

			button.onclick = () => player.playbackRate = rate;

			return button;
		}

		[2, 1.75, 1.5, 1].forEach(r => container.insertAdjacentElement('afterbegin', createButton(r)));
	}

	var interval = setInterval(() => {
		if (document.querySelector('video')) {
			clearInterval(interval);
			init();
		}
	}, 200);

})();
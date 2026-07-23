// ==UserScript==
// @name         Instagram Enhancements
// @namespace    https://tampermonkey.net/
// @version      1.0
// @description  Prevents videos in the Instagram feed from autoplaying on scroll or when returning to the tab. Manual clicks still play the video normally.
// @author       you
// @match        https://www.instagram.com/*
// @icon         https://www.google.com/s2/favicons?bb=1&domain=instagram.com
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function () {
	'use strict';

	function injectStyles() {
		const style = document.createElement('style');
		document.head.appendChild(style);
		style.textContent = `
			video { object-fit: contain !important; }
			/* NATIVE CONTROLS */
			::-webkit-media-controls-panel { padding-right: 40px; }
			::-webkit-media-controls-timeline { padding-bottom: 24px }

			::-webkit-media-controls-mute-button,
			::-webkit-media-controls-volume-control-container { display: none; }

			/* NATIVE CONTROLS (STORIES) */
			body.stories video::-webkit-media-controls-panel {
				padding: 0 0 52px 0;
				background: none;
			}
			/* NATIVE CONTROLS (REELS) */
			::-webkit-media-controls-timeline { padding-bottom: 28px; }

			/* VIDEO POST HEADER */
			.feed-post-header {
				position: static !important;
				background: none !important;

				> * { padding: 0 !important; }
			}

			/* OVERLAY */
			[aria-label="Video player"] { pointer-events: none; }
			[aria-label="Video player"] [aria-label="Adjust volume"] { pointer-events: auto; }
			body:not(.reels) [aria-label="Video player"] [role="presentation"] { display: none !important; }
			/* disable the overlay play/pause button */
			body.reels [role="presentation"] > [role="button"] { pointer-events: none; }
			/* make room for tags button */
			a:has([aria-label="Video player"] [aria-label="Tags"]) ::-webkit-media-controls-panel { padding-inline: 40px; }

			/* DOWNLOAD BUTTON + VIDEO MARKER */
			button.download-button, .video-marker, button.external-button {
				position: absolute;
				inset: 0 0 auto auto;
				display: flex;
				align-items: center;
				justify-content: center;
				width: 52px;
				height: 52px;
				padding: 0;
				border: none;
				border-radius: 50px;
				background: radial-gradient(rgba(43, 48, 54, .8) 0 14px, transparent 15px);
				pointer-events: auto;
				cursor: pointer;

				&::before {
					content: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='15' viewBox='0 0 24 24' fill='none' stroke='%23FFF' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M12 17V3'/%3E%3Cpath d='m6 11 6 6 6-6'/%3E%3Cpath d='M19 21H5'/%3E%3C/svg%3E");
					display: block;
					margin-top: 2px;
				}

				&.loading::before {
					content: "";
					width: 16px;
					height: 16px;
					border: 2px solid #FFF;
					border-top-color: transparent;
					border-radius: 50%;
					animation: spin 1s linear infinite;
				}
			}
			div.video-marker {
				inset: 0 40px auto auto;

				&::before {
					content: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' viewBox='0 0 24 24' fill='%23FFF' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round' class='lucide lucide-play-icon lucide-play'%3E%3Cpath d='M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z'/%3E%3C/svg%3E");
					margin-top: 4px;
				}
			}
			button.external-button {
				inset: 0 40px auto auto;

				&::before {
					content: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' viewBox='0 0 24 24' fill='none' stroke='%23FFF' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' class='lucide lucide-external-link-icon lucide-external-link'%3E%3Cpath d='M15 3h6v6'/%3E%3Cpath d='M10 14 21 3'/%3E%3Cpath d='M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6'/%3E%3C/svg%3E");
				}
			}

			@keyframes spin {
				to { transform: rotate(360deg); }
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

	function allowBackgroundPlay() {
		// Override document.hidden to always be false
		Object.defineProperty(document, 'hidden', {
			value: false,
			writable: false
		});

		// Override document.visibilityState to always be "visible"
		Object.defineProperty(document, 'visibilityState', {
			value: 'visible',
			writable: false
		});

		// Stop visibilitychange events from firing
		document.addEventListener('visibilitychange', function(event) {
			event.stopImmediatePropagation();
		}, true); // The 'true' parameter ensures this runs during the capture phase
	}

	// downloading (thanks to Instagram Reels Premium Media Controller by Uygar)
	async function downloadUrl(url, filename) {
		try {
			const res = await fetch(url, { credentials: 'omit' });
			if (!res.ok) throw new Error('HTTP ' + res.status);
			const blob = await res.blob();
			const a = document.createElement('a');
			a.href = URL.createObjectURL(blob);
			a.download = filename;
			document.body.appendChild(a); a.click(); a.remove();
			setTimeout(() => URL.revokeObjectURL(a.href), 6000);
		}
		catch (e) {
			window.open(url, '_blank');
		}
	}

	// video download
	function shortcodeToMediaId(sc) {
		const SC_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

		let id = 0n;
		for (const ch of sc) {
			const idx = SC_ALPHABET.indexOf(ch);
			if (idx < 0) return null;
			id = id * 64n + BigInt(idx);
		}
		return id.toString();
	}
	function findActiveShortcode(v) {
		const m = location.pathname.match(/\/(reel|p|tv)\/([^/]+)/);
		if (m) return m[2];

		if (v) {
			const cont = v.closest('article') || v.closest('div[role="dialog"]') || document;
			const a = cont.querySelector('a[href*="/reel/"], a[href*="/p/"], a[href*="/tv/"]');
			if (a) { const mm = (a.getAttribute('href') || '').match(/\/(reel|p|tv)\/([^/]+)/); if (mm) return mm[2]; }
		}
		return null;
	}
	async function downloadVideo(v) {
		// Direct URL (if not MSE/blob, download directly)
		const direct = v.currentSrc || v.src;
		if (direct && !direct.startsWith('blob:')) { downloadUrl(direct, `reel_${Date.now()}.mp4`); return; }

		// IG web API (logged in session required)
		try {
			const sc = findActiveShortcode(v);
			if (!sc) throw new Error('shortcode yok');
			const mediaId = shortcodeToMediaId(sc);

			if (!mediaId) throw new Error('mediaId yok');
			const res = await fetch(`https://www.instagram.com/api/v1/media/${mediaId}/info/`, {
				headers: { 'X-IG-App-ID': '936619743392459' },
				credentials: 'include'
			});
			if (!res.ok) throw new Error('API ' + res.status);
			const data = await res.json();
			const item = data.items && data.items[0];
			const vv = item && (item.video_versions || (item.carousel_media && item.carousel_media[0] && item.carousel_media[0].video_versions));
			const url = vv && vv[0] && vv[0].url;
			if (!url) throw new Error('video_versions yok');
			downloadUrl(url, `reel_${sc}.mp4`);
		}
		catch (e) {
			console.warn('[IG Controller] reel download failed', e);
			toast('This reel could not be downloaded directly (IG restriction / login required)');
		}
	}

	// image download
	function downloadImg(img) {
		// Pick best resolution source from srcset
		function pickBestImageSrc(img) {
			if (img.srcset) {
				let best = null, bw = -1;
				for (const part of img.srcset.split(',')) {
					const seg = part.trim().split(/\s+/);
					const w = seg[1] ? parseInt(seg[1]) : 0;
					if (w >= bw) { bw = w; best = seg[0]; }
				}
				if (best) return best;
			}
			return img.currentSrc || img.src;
		}

		const u = pickBestImageSrc(img);
		if (u) downloadUrl(u, `instagram_${Date.now()}.jpg`);
	}

	// main update loop
	function update() {
		// LOCATION
		document.body.classList.remove('stories', 'reels');
		if (location.href.includes('/stories/')) document.body.classList.add('stories');
		else if (location.href.includes('/reels/')) document.body.classList.add('reels');

		// VIDEOS
		document.querySelectorAll('video').forEach((video) => {
			if (video.controls) return; // already initialized

			// controls
			video.controls = true;

			// feed header...lmao!!!!
			if (!['/stories/', '/reels/'].some((path) => location.href.includes(path))) {
				setTimeout(() => {
					if (video.closest('[aria-modal="true"]')) return; // dialog

					const article = video.closest('article');
					const container = article.firstChild.firstChild;
					const header = article.firstChild.firstChild.firstChild.firstChild;
					header.classList.add('feed-post-header');
					container.prepend(header);
				});
			}

			// download button
			const container = video.closest('a') || video.parentElement.parentElement;
			container?.removeAttribute('href');

			const downloadBtn = document.createElement('button');
			downloadBtn.classList.add('download-button', 'video');
			downloadBtn.addEventListener('click', () => {
				downloadBtn.classList.add('loading');
				downloadVideo(video).finally(() => downloadBtn.classList.remove('loading'));
			});

			container.appendChild(downloadBtn);

			const videoMarker = document.createElement('div');
			videoMarker.classList.add('video-marker');
			container.appendChild(videoMarker);
		});

		// IMAGES
		document.querySelectorAll('img').forEach((img) => {
			if (img.hasAttribute('enhanced')) return;
			img.setAttribute('enhanced', '');

			// ignore...
			if (img.clientWidth < 400 || img.clientHeight < 400) return; // profile pictures + profile page thumbnails
			if (img.parentElement.parentElement.parentElement.parentElement.querySelector('video')) return; // video thumbnails...good lord!!

			const container = img.parentElement.parentElement;

			// download button
			const downloadBtn = document.createElement('button');
			downloadBtn.classList.add('download-button');
			downloadBtn.addEventListener('click', () => downloadImg(img));
			container.appendChild(downloadBtn);

			// external button
			if (img.closest('[aria-modal="true"]')) {
				const externalBtn = document.createElement('button');
				externalBtn.classList.add('external-button');
				externalBtn.addEventListener('click', () => window.open(location.href, '_blank'));
				container.appendChild(externalBtn);
			}
		});
	}

	const init = () => {
		injectStyles();
		preventAutoplay();
		allowBackgroundPlay();
		setInterval(update, 1000);
	};

	init();
})();

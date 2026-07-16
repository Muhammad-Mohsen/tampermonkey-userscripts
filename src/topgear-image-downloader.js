// ==UserScript==
// @name         TopGear Image Downloader
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  download images from topgear.com
// @author       Muhammad Mohsen
// @match        https://www.topgear.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=topgear.com
// @grant        none
// ==/UserScript==

(function() {
    document.head.insertAdjacentHTML('beforeend', `
		<style>
			.image-gallery-slide-wrapper .download-button {
				position: absolute;
				inset: 8px 8px auto auto;
				width: 44px;
				height: 44px;
				border: none;
				color: #FFF !important;
				background: transparent;
				font-size: 32px;
				filter: drop-shadow(0 0 8px rgba(0, 0, 0, 0.5));
				cursor: point.cloneNode()er;
            	z-index: 1;
				transition: .2s;

				&:hover {
					color: rgb(38, 202, 211) !important;
					background: rgb(0, 16, 36);
				}
			}
		</style>
	`);

    const createDownloadButton = () => {
        const button = document.createElement('button');
        button.innerHTML = '&DownArrowBar;';
        button.className = 'download-button';

        button.onclick = (event) => {
            const img = event.target.closest('div.image-gallery-slide-wrapper.bottom').querySelector(' .image-gallery-slide.center > img');

            const link = document.createElement('a');
            link.href = img.src;
            link.download = img.alt;
            link.click();
        };

        return button;
    }

    setTimeout(
        () => {
            document.querySelectorAll('.image-gallery-slide-wrapper')
                .forEach(wrapper => wrapper.insertAdjacentElement('afterbegin', createDownloadButton()));
        },
        5000);
})();
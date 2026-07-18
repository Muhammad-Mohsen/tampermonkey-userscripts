# Tampermonkey Userscripts

This repository contains a bunch of tampermonkey userscripts that enhance the experience of using various websites.

## Instagram
- download button
	- images
	- videos
	- use creator handle + post date time

- video player
		video.closest('a').href = '';
		video.controls = true;

	- expand button: the same function as the overlay above
	- DONE - prevent autoplay
		- [aria-role="button"]:has([aria-label="Play"]) add onclick => video.play()

## TopGear
- download button for the carousels

## YouTube
- show speed buttons in the control bar
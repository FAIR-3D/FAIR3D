/* -------------------------------------------------- */
/* ----------------- AUDIO FUNCTIONS ---------------- */
/* -------------------------------------------------- */


function fadeOutAudio(audio, duration = 1000) {
	const step = 0.05;
	const interval = duration * step;

	const fade = setInterval(() => {
		if (audio.volume > step) {
			audio.volume = Math.max(0, audio.volume - step);
		} else {
			audio.volume = 0;
			audio.pause();
			clearInterval(fade);
		}
	}, interval);
}

function fadeInAudio(audio, targetVolume = 0.8, duration = 1000) {
	audio.volume = 0;
	audio.play().catch(() => {});
	const step = 0.05;
	const interval = duration * step;

	const fade = setInterval(() => {
		if (audio.volume < targetVolume - step) {
			audio.volume = Math.min(targetVolume, audio.volume + step);
		} else {
			audio.volume = targetVolume;
			clearInterval(fade);
		}
	}, interval);
}


/* -------------------------------------------------- */
/* ------------------ AUDIO SETUP ------------------- */
/* -------------------------------------------------- */

/* -- INTRO SFX -- */
const introButtonSound = new Audio('SFX/IntroButton.wav');
introButtonSound.preload = 'auto';

/* -- LOGO SFX -- */
const logoSound = new Audio('SFX/LogoReveal.wav');
logoSound.preload = 'auto';
logoSound.volume = 0.8;

/* -- DRONE SFX -- */
const droneLoop = new Audio('SFX/Drone.mp3');
droneLoop.loop = true;
droneLoop.volume = 0.6;
droneLoop.preload = 'auto';

/* -- HOVER SFX -- */
const hoverSounds = [
	new Audio('SFX/Button1.wav'),
	new Audio('SFX/Button2.wav'),
	new Audio('SFX/Button3.wav')
];
hoverSounds.forEach(s => s.preload = 'auto');
hoverSounds.forEach(s => {
s.volume = 0.2;
});

/* -- CLICK SFX -- */
const navClickSound = new Audio('SFX/Button.wav');
navClickSound.volume = 0.3;
navClickSound.preload = 'auto';

/* -- SWIPE SFX -- */
const swipeSound = new Audio('SFX/Swipe.wav');
swipeSound.preload = 'auto';
swipeSound.volume = 0.3; 

/* -- SPARK SFX -- */
const sparkSound = new Audio('SFX/Spark.wav');
sparkSound.preload = 'auto';
sparkSound.volume = 0.3;
window.playSparkSound = () => {
	if (!soundEnabled) return;
	sparkSound.currentTime = 0;
	sparkSound.play().catch(() => {});
};

let soundEnabled = false;


/* -------------------------------------------------- */
/* ------------------ DOM ELEMENTS ------------------ */
/* -------------------------------------------------- */


const enterButton = document.getElementById('enter-site');
const introScreen = document.getElementById('intro-screen');
const fairlogo = document.querySelector('.fairlogo');
const bottomNavbar = document.getElementById('bottom-navbar');
const navbarButtons = document.querySelectorAll('#bottom-navbar li');
const mobileToggle = document.getElementById('mobile-menu-toggle');
const mobileMenu = document.getElementById('mobile-menu');
const soundToggle = document.getElementById('sound-toggle');


/* -------------------------------------------------- */
/* -------------- MOBILE MENU TOGGLE ---------------- */
/* -------------------------------------------------- */


if (mobileToggle && mobileMenu) {
	mobileToggle.addEventListener('click', () => {
		mobileMenu.classList.toggle('show');
		mobileMenu.classList.toggle('hide');
	});

	mobileMenu.querySelectorAll('li').forEach(li => {
		li.addEventListener('click', () => {
			if (soundEnabled) {
				navClickSound.currentTime = 0;
				navClickSound.play().catch(() => {});
			}
			mobileMenu.classList.remove('show');
			mobileMenu.classList.add('hide');
		});
	});
}


/* -------------------------------------------------- */
/* ------------------ PAGE SWITCHING ---------------- */
/* -------------------------------------------------- */


window.navigateTo = async function(targetId) {
	const section = document.getElementById(targetId);
	const allSections = document.querySelectorAll('.page-section');
	const logoContainer = document.getElementById('logo-container');

	if (!section) return;

	allSections.forEach(sec => sec.style.display = 'none');

	if (soundEnabled) {
	swipeSound.currentTime = 0;
	swipeSound.play().catch(() => {});
	}

	setTimeout(() => {
	section.style.display = 'block'; // ← put this back here so page shows

	// ✅ Highlight active nav button
	document.querySelectorAll('#bottom-navbar li').forEach(li => {
		li.classList.remove('active-nav');
	});

	const navLabels = {
		'page-home': 'Home',
		'page-images': 'Images',
		'page-videos': 'Videos',
		'page-writing': 'Writing',
		'page-contact': 'Contact',
		'page-about': 'About',
		'page-broadcast': 'Broadcast'
	};

	const current = navLabels[targetId];
	document.querySelectorAll('#bottom-navbar li').forEach(li => {
		if (li.textContent.trim() === current) {
		li.classList.add('active-nav');
		}
	});

	}, 200);

	logoContainer.style.display = (targetId === 'page-home') ? 'flex' : 'none';
	document.body.style.overflowY = (targetId === 'page-home') ? 'hidden' : 'auto';
	window.scrollTo(0, 0);

	if (targetId === 'page-home' && typeof window.resizeRenderer === 'function') {
		setTimeout(window.resizeRenderer, 50);
	}

	if (targetId === 'page-images') {
	const { initMasonryGallery } = await import('./Scripts/gallery.js');
	setTimeout(() => {
		initMasonryGallery();
	}, 220); // Slightly more than page-switch delay
	}

	if (targetId === 'page-writing') {
		const iframe = document.querySelector('#page-writing iframe');
		if (iframe) {
			const baseUrl = iframe.src.split('?')[0];
			iframe.setAttribute('src', `${baseUrl}?autoplay=1&mute=1`);
		}
	}
};


/* -------------------------------------------------- */
/* ---------------- NAV HOVER SOUNDS ---------------- */
/* -------------------------------------------------- */


navbarButtons.forEach(button => {
	button.addEventListener('mouseenter', () => {
		if (!soundEnabled) return;
		const sound = hoverSounds[Math.floor(Math.random() * hoverSounds.length)];
		sound.currentTime = 0;
		sound.play().catch(() => {});
	});

	button.addEventListener('click', () => {
		if (!soundEnabled) return;
		navClickSound.currentTime = 0;
		navClickSound.play().catch(() => {});
	});
});


/* -------------------------------------------------- */
/* ------------------ INTRO BUTTON ------------------ */
/* -------------------------------------------------- */


if (enterButton && introScreen) {
	enterButton.addEventListener('click', () => {
		soundEnabled = true;
		introButtonSound.play().catch(() => {});
		introScreen.classList.add('hidden');

		window.startCameraReveal?.();
		window.startModelMouseTracking?.();

		setTimeout(() => {
			introScreen.style.display = 'none';
			mobileToggle?.classList.remove('hidden');
			droneLoop.play().catch(() => {});

			const modelContainer = document.getElementById('model-viewer-container');
			if (modelContainer?.style.display !== 'none') {
				modelContainer.style.transitionDelay = '0.5s';
				modelContainer.classList.add('fade-in');
			} else if (fairlogo) {
				fairlogo.style.transitionDelay = '0.5s';
				fairlogo.classList.add('fade-in');
			}

			logoSound.play().catch(() => {});

			if (bottomNavbar) {
				bottomNavbar.style.display = 'flex';
				bottomNavbar.style.animation = 'navbarPopIn 0.6s ease-out forwards';
				bottomNavbar.style.animationDelay = '1.0s';
			}

			setTimeout(() => {
				soundToggle?.classList.add('visible');
			}, 1700);

		}, 1000);
	});
} else {
	fairlogo?.classList.add('fade-in');
	soundEnabled = true;
}

if (introScreen?.classList.contains('hidden')) {
	bottomNavbar.style.display = 'flex';
}


/* -------------------------------------------------- */
/* --------------- ELEMENT OBSERVERS ---------------- */
/* -------------------------------------------------- */


const observer = new IntersectionObserver((entries) => {
	entries.forEach(entry => {
		if (entry.isIntersecting) {
			entry.target.classList.add('in-view');
		}
	});
}, { threshold: 0.4 });

document.querySelectorAll('.headerlogo').forEach(el => observer.observe(el));


/* -------------------------------------------------- */
/* ---------------- SOUND TOGGLE UI ----------------- */
/* -------------------------------------------------- */


if (soundToggle) {
	soundToggle.addEventListener('click', () => {
		soundEnabled = !soundEnabled;
		soundToggle.textContent = soundEnabled ? '🔊 Sound: ON' : '🔇 Sound: OFF';

		if (!soundEnabled) {
			fadeOutAudio(droneLoop);
			if (window.sparkSound?.isPlaying) window.sparkSound.setVolume(0);
		} else {
			fadeInAudio(droneLoop, 0.8);
			if (window.sparkSound?.buffer) window.sparkSound.setVolume(0.5);
		}
	});
}


/* -------------------------------------------------- */
/* ---------------- EMAILJS CONTACT ----------------- */
/* -------------------------------------------------- */


const emailScript = document.createElement('script');
emailScript.src = 'https://cdn.jsdelivr.net/npm/emailjs-com@3/dist/email.min.js';
emailScript.onload = () => emailjs.init('peKmrkbhU3GNvd0XJ'); 
document.head.appendChild(emailScript);

document.addEventListener("DOMContentLoaded", () => {
	const form = document.getElementById('contact-form');
	const status = document.getElementById('form-status');

	if (form) {
		form.addEventListener('submit', function (e) {
			e.preventDefault();
			status.textContent = "Sending...";

			emailjs.sendForm('service_uov7a3v', 'template_9xeninf', this)
				.then(() => {
					status.textContent = "✅ Message sent successfully!";
					form.reset();
				}, (err) => {
					console.error("❌ Email send failed:", err);
					status.textContent = "⚠️ Something went wrong. Try again.";
				});
		});
	}
});


/* -------------------------------------------------- */
/* ---------------- EMAILJS CONTACT ----------------- */
/* -------------------------------------------------- */


$(document).ready(function () {
  $('audio').mediaelementplayer({
    features: ['playpause', 'progress', 'current', 'duration', 'volume']
  });
});

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


	const hoverSounds = [
		new Audio('SFX/Button1.wav'),
		new Audio('SFX/Button2.wav'),
		new Audio('SFX/Button3.wav')
	];
	const navClickSound = new Audio('SFX/Button.wav');
	const introButtonSound = new Audio('SFX/IntroButton.wav');
	const logoSound = new Audio('SFX/LogoReveal.wav');
	hoverSounds.forEach(sound => sound.preload = 'auto');
	introButtonSound.preload = 'auto';
	navClickSound.preload = 'auto';
	const droneLoop = new Audio('SFX/Drone.mp3');
	droneLoop.loop = true;              // 🔁 Make it loop forever
	droneLoop.volume = 0.8;             // Optional: Set to a gentle level
	droneLoop.preload = 'auto';

	let soundEnabled = false;

	const enterButton = document.getElementById('enter-site');
	const introScreen = document.getElementById('intro-screen');
	const fairlogo = document.querySelector('.fairlogo');
	const bottomNavbar = document.getElementById('bottom-navbar');
	const navbarButtons = document.querySelectorAll('#bottom-navbar li');
	const body = document.body;

	const mobileToggle = document.getElementById('mobile-menu-toggle');
	const mobileMenu = document.getElementById('mobile-menu');
	
	if (mobileToggle && mobileMenu) {
		mobileToggle.addEventListener('click', () => {
		  if (mobileMenu.classList.contains('show')) {
			mobileMenu.classList.remove('show');
			mobileMenu.classList.add('hide');
		  } else {
			mobileMenu.classList.remove('hide');
			mobileMenu.classList.add('show');
		  }
		});
	  
		mobileMenu.querySelectorAll('li').forEach(li => {
			li.addEventListener('click', () => {
			  if (soundEnabled && navClickSound) {
				navClickSound.currentTime = 0;
				navClickSound.play().catch(() => {});
			  }
			  mobileMenu.classList.remove('show');
			  mobileMenu.classList.add('hide');
			});
		  });
	  }

	window.navigateTo = async function(targetId) {
	const section = document.getElementById(targetId);
	const allSections = document.querySelectorAll('.page-section');
	const logoContainer = document.getElementById('logo-container');

	if (!section) return;

	allSections.forEach(sec => sec.style.display = 'none');
	section.style.display = 'block';

	if (targetId === 'page-home') {
		logoContainer.style.display = 'flex';
		setTimeout(() => {
			if (typeof window.resizeRenderer === 'function') {
			  window.resizeRenderer();
			}
		  }, 50);		
		window.scrollTo(0, 0);
	} else {
		logoContainer.style.display = 'none';
	}

	document.body.style.overflowY = (targetId === 'page-home') ? 'hidden' : 'auto';

	// 👉 Only initialize Masonry once page-images is shown
	if (targetId === 'page-images') {
		const { initMasonryGallery } = await import('./Scripts/gallery.js');
		initMasonryGallery();
	}
	};
	
	
	
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



	if (enterButton && introScreen) {
		enterButton.addEventListener('click', () => {
			soundEnabled = true;
			introButtonSound.play().catch(() => {});
			introScreen.classList.add('hidden');
			if (typeof window.startCameraReveal === 'function') {
 				window.startCameraReveal();
			}

			if (typeof window.startModelMouseTracking === 'function') {
			window.startModelMouseTracking();
			}			

			setTimeout(() => {
				introScreen.style.display = 'none';
				document.getElementById('mobile-menu-toggle')?.classList.remove('hidden');
				droneLoop.play().catch(() => {});  // 🔊 Start the loop

				const modelContainer = document.getElementById('model-viewer-container');
				if (modelContainer && modelContainer.style.display !== 'none') {
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
		const soundToggle = document.getElementById('sound-toggle');
		if (soundToggle) soundToggle.classList.add('visible');
		}, 1700); // navbar appears at 1.6s, give it a little buffer

			}, 1000);
		});
	} else {
		fairlogo?.classList.add('fade-in');
		soundEnabled = true;
	}




	if (introScreen.classList.contains('hidden')) {
		bottomNavbar.style.display = 'flex';
	}




	const observer = new IntersectionObserver((entries) => {
		entries.forEach(entry => {
			if (entry.isIntersecting) {
				entry.target.classList.add('in-view');
			}
		});
	}, { threshold: 0.4 });

	const soundToggle = document.getElementById('sound-toggle');

	if (soundToggle) {
		soundToggle.addEventListener('click', () => {
		  soundEnabled = !soundEnabled;
		  soundToggle.textContent = soundEnabled ? '🔊 Sound: ON' : '🔇 Sound: OFF';
	  
		  if (!soundEnabled) {
			fadeOutAudio(droneLoop);
		  } else {
			fadeInAudio(droneLoop, 0.8);
		  }
		});
	  }


	// Load EmailJS
	const emailScript = document.createElement('script');
	emailScript.src = 'https://cdn.jsdelivr.net/npm/emailjs-com@3/dist/email.min.js';
	emailScript.onload = () => emailjs.init('peKmrkbhU3GNvd0XJ'); // 🔁 Replace this with YOUR actual public key!
	document.head.appendChild(emailScript);

	// Contact form handler
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







	const headers = document.querySelectorAll('.headerlogo');
	headers.forEach(el => observer.observe(el));


export function initMasonryGallery() {
  const grid = document.querySelector('.masonry-gallery');
  if (!grid) return;

  if (!grid.querySelector('.grid-sizer')) {
    const sizer = document.createElement('div');
    sizer.className = 'grid-sizer';
    grid.prepend(sizer);
  }

  Promise.all(
    Array.from(grid.querySelectorAll('img'))
      .filter(img => !img.complete)
      .map(img => new Promise(resolve => {
        img.onload = img.onerror = resolve;
      }))
  ).then(() => {
    const masonry = new Masonry(grid, {
      itemSelector: '.grid-item',
      columnWidth: '.grid-sizer',
      percentPosition: true
    });

    masonry.layout();

    // ✅ Lightbox click behavior
    const images = grid.querySelectorAll('.grid-item img');

    images.forEach(img => {
      if (!img.dataset.lightboxBound) {
        img.dataset.lightboxBound = 'true';
    
        img.addEventListener('click', () => {
          const instance = basicLightbox.create(`
            <img src="${img.src}" alt="${img.alt}" style="max-width: 90vw; max-height: 90vh;" />
          `);
    
          instance.show();
    
          // 💡 Manually support Escape key
          function onKeydown(e) {
            if (e.key === 'Escape') {
              instance.close();
              document.removeEventListener('keydown', onKeydown);
            }
          }
    
          document.addEventListener('keydown', onKeydown);
        });
      }
    });
  });
}

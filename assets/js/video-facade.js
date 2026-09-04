export function vimeoEmbedSrc(id) {
  return `https://player.vimeo.com/video/${id}?autoplay=1&title=0&byline=0`;
}

export function initVideoFacades(root) {
  root.querySelectorAll('[data-video-facade]').forEach((facade) => {
    const button = facade.querySelector('button');
    button.addEventListener('click', () => {
      const id = facade.dataset.videoFacade;
      const iframe = document.createElement('iframe');
      iframe.src = vimeoEmbedSrc(id);
      iframe.title = facade.dataset.videoTitle || 'Video';
      iframe.allow = 'autoplay; fullscreen; picture-in-picture';
      iframe.allowFullscreen = true;
      facade.replaceWith(iframe);
      iframe.className = 'hero__video-frame';
    });
  });
}

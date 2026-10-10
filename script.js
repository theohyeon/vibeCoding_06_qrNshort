document.addEventListener('DOMContentLoaded', () => {
  const card = document.getElementById('toolboxCard');

  // Subtle 3D Card Tilt Interaction
  if (card && window.matchMedia('(hover: hover)').matches) {
    window.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const cardX = rect.left + rect.width / 2;
      const cardY = rect.top + rect.height / 2;

      const angleX = (e.clientY - cardY) / 45;
      const angleY = (cardX - e.clientX) / 45;

      card.style.transform = `perspective(1000px) rotateX(${angleX.toFixed(2)}deg) rotateY(${angleY.toFixed(2)}deg)`;
    });

    window.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
    });
  }
});

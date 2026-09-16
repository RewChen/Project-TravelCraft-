export const getShapeStyle = (element, fallbackColor = '#111111') => {
  const color = element.color ?? fallbackColor;

  if (element.shape === 'line') {
    return { borderTop: `4px solid ${color}`, background: 'transparent', borderColor: color };
  }

  if (element.shape === 'highlight') {
    return {
      backgroundColor: `${color}55`,
      border: `2px solid ${color}`,
      boxShadow: `inset 0 0 0 1px ${color}`
    };
  }

  if (element.shape === 'rectangle') {
    return { border: `4px solid ${color}`, background: 'transparent', borderColor: color };
  }

  if (element.shape === 'circle') {
    return { border: `4px solid ${color}`, borderRadius: '9999px', background: 'transparent', borderColor: color };
  }

  if (element.shape === 'grid') {
    return {
      backgroundImage: `linear-gradient(90deg, transparent 9px, ${color} 10px), linear-gradient(transparent 9px, ${color} 10px)`,
      backgroundSize: '10px 10px',
      backgroundColor: 'transparent'
    };
  }

  return { borderColor: color };
};

export const getImageFilterStyle = (element) => {
  const filterMap = {
    sepia: 'sepia(0.85)',
    vintage: 'sepia(0.45) contrast(1.1) brightness(0.95)',
    bw: 'grayscale(1) contrast(1.05)',
    polaroid: 'sepia(0.15) contrast(1.05)',
    sticker: 'none'
  };
  return filterMap[element.filter] ? { filter: filterMap[element.filter] } : {};
};

export const getElementFrameStyle = (element) => {
  const frameStyles = {
    circle: { borderRadius: '9999px', overflow: 'hidden', clipPath: 'circle(50% at 50% 50%)' },
    rounded: { borderRadius: '18%', overflow: 'hidden' },
    diamond: { overflow: 'hidden', clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' },
    hexagon: { overflow: 'hidden', clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)' }
  };
  return frameStyles[element.frameShape] || {};
};

export const getFramePlaceholderStyle = (element) => {
  if (!element?.isFrame || element.frameImage) return {};
  return {
    backgroundColor: '#d9f1f8',
    backgroundImage: [
      'radial-gradient(circle at 50% 22%, #ffffff 0 7%, transparent 7.5%)',
      'radial-gradient(circle at 43% 25%, #ffffff 0 5%, transparent 5.5%)',
      'radial-gradient(circle at 58% 25%, #ffffff 0 5%, transparent 5.5%)',
      'linear-gradient(168deg, transparent 0 58%, #c5df83 58.5% 72%, #85a900 72.5%)',
      'linear-gradient(#c9edf8, #eefbff 58%, #b8d96d 58.5%)'
    ].join(', ')
  };
};
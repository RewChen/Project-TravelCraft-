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
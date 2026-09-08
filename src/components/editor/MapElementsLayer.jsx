import { CANVAS_WIDTH } from '../../lib/editorCanvas';
import { getShapeStyle, getImageFilterStyle } from '../../lib/editorElements';

const toPct = (value) => `${((value / CANVAS_WIDTH) * 100).toFixed(4)}%`;
const toCqw = (value) => `${((value / CANVAS_WIDTH) * 100).toFixed(4)}cqw`;

export default function MapElementsLayer({ items }) {
  if (!items || !items.length) return null;
  return (
    <div className="absolute inset-0 z-[5] overflow-hidden pointer-events-none select-none">
      {items.map(({ element, position }) => {
        const isEmoji = element.type === 'emoji';
        return (
          <div
            key={element.id}
            className="absolute flex items-center justify-center pointer-events-auto"
            style={{
              top: toPct(position.top),
              left: toPct(position.left),
              width: toPct(position.width),
              height: toPct(position.height),
              transform: `rotate(${element.rotation ?? 0}deg)`
            }}
          >
            <div className="w-full h-full flex items-center justify-center transition-transform duration-200 hover:animate-soft-bounce">
            {element.type === 'image' ? (
              element.filter === 'polaroid' ? (
                <div className="w-full h-full flex items-center justify-center p-[5%] pointer-events-none">
                  <div className="w-full h-full bg-white border-2 border-black p-1 pb-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.25)] rotate-[-2deg]">
                    <img src={element.content} alt={element.label || 'element'} className="w-full h-full object-contain pointer-events-none" style={getImageFilterStyle(element)} />
                  </div>
                </div>
              ) : element.filter === 'sticker' ? (
                <div className="w-full h-full p-[4%] pointer-events-none">
                  <div className="w-full h-full bg-white rounded-[28%] border-4 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,0.2)] overflow-hidden">
                    <img src={element.content} alt={element.label || 'element'} className="w-full h-full object-cover pointer-events-none" style={getImageFilterStyle(element)} />
                  </div>
                </div>
              ) : (
                <img src={element.content} alt={element.label || 'element'} className="w-full h-full object-contain pointer-events-none" style={getImageFilterStyle(element)} />
              )
            ) : element.type === 'shape' ? (
              <div className="w-full h-full pointer-events-none" style={getShapeStyle(element)} />
            ) : (
              <span
                className="filter drop-shadow-md px-2 w-full"
                style={{
                  fontSize: isEmoji ? toCqw(Math.min(position.width, position.height) * 0.8) : toCqw(element.fontSize ?? 160),
                  fontWeight: element.fontWeight ?? 900,
                  fontStyle: element.fontStyle || 'normal',
                  textDecoration: element.textDecoration || 'none',
                  textAlign: element.textAlign || 'center',
                  fontFamily: element.fontFamily || 'sans-serif',
                  display: 'block',
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.2,
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
                  color: element.color ?? '#111111',
                  ...(isEmoji ? {} : element.textGradient ? { backgroundImage: element.textGradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' } : {}),
                  ...(isEmoji ? {} : element.textStroke ? { WebkitTextStroke: `${toCqw(element.textStroke)} #111111` } : {}),
                  ...(isEmoji ? {} : element.textGlow ? { textShadow: `0 0 ${toCqw(18)} ${element.textGlow}` } : {})
                }}
              >
                {element.content}
              </span>
            )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
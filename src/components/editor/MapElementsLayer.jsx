import { DEFAULT_CANVAS_WIDTH, DEFAULT_CANVAS_HEIGHT } from '../../lib/editorCanvas';
import { getShapeStyle, getImageFilterStyle, getElementFrameStyle, getFramePlaceholderStyle } from '../../lib/editorElements';

// Calculate relative stroke width for a 100x100 viewBox based on actual canvas dimensions.
const toViewBoxStroke = (thickness, canvasWidth) => Math.max(0.1, ((thickness || 4) * 2 / canvasWidth) * 100);
const toPct = (value, canvasWidth) => `${((value / canvasWidth) * 100).toFixed(4)}%`;
const toCqw = (value, canvasWidth) => `${((value / canvasWidth) * 100).toFixed(4)}cqw`;

// Dash length used for the draw-in animation. A large value ensures
// the whole line starts hidden and animates to fully visible.
const DASH_LEN = 2000;

// Normalize a route point (pixel {x,y} or percent {left,top}) into percent strings.
const routePointToPct = (point, canvasWidth, canvasHeight) => {
  if (!point) return null;
  if (typeof point.x === 'number' && typeof point.y === 'number') {
    return { left: toPct(point.x, canvasWidth), top: `${((point.y / canvasHeight) * 100).toFixed(4)}%` };
  }
  if (point.left != null && point.top != null) {
    const left = typeof point.left === 'number' ? toPct(point.left, canvasWidth) : String(point.left);
    const top = typeof point.top === 'number' ? `${((point.top / canvasHeight) * 100).toFixed(4)}%` : String(point.top);
    return { left, top };
  }
  return null;
};

export function MapRoutesLayer({ routes, items, onRouteClick, canvasWidth = DEFAULT_CANVAS_WIDTH, canvasHeight = DEFAULT_CANVAS_HEIGHT }) {
  const visible = (Array.isArray(routes) ? routes : []).filter((r) => r && r.visible !== false && Array.isArray(r.points) && r.points.length >= 2);
  if (!visible.length) return null;
  return (
    <svg className="absolute inset-0 z-[1] pointer-events-none" width="100%" height="100%" viewBox={`0 0 100 100`} preserveAspectRatio="none">
      {visible.map((route, idx) => {
        const pts = route.points.map(p => routePointToPct(p, canvasWidth, canvasHeight)).filter(Boolean);
        if (pts.length < 2) return null;
        const ptsAttr = pts.map((p) => `${parseFloat(p.left)},${parseFloat(p.top)}`).join(' ');
        const isNavAB = route.id === 'nav-ab';
        const pathD = (() => {
          let d = `M ${parseFloat(pts[0].left)},${parseFloat(pts[0].top)}`;
          for (let i = 0; i < pts.length - 1; i++) {
            const p2 = pts[i + 1];
            const cpRaw = route.controlPoints && route.controlPoints[i];
            const cpPct = cpRaw ? routePointToPct(cpRaw, canvasWidth, canvasHeight) : null;
            if (cpPct) {
              d += ` Q ${parseFloat(cpPct.left)},${parseFloat(cpPct.top)} ${parseFloat(p2.left)},${parseFloat(p2.top)}`;
            } else {
              d += ` L ${parseFloat(p2.left)},${parseFloat(p2.top)}`;
            }
          }
          return d;
        })();
        const strokeW = toViewBoxStroke(route.thickness, canvasWidth);
        const dashArr = route.isDashed === false ? DASH_LEN : `${strokeW * 3.5} ${strokeW * 2.5}`;
        
        return (
          <g key={route.id}>
            {/* Invisible thick path for clicking */}
            {onRouteClick && !isNavAB && (
              <path d={pathD} fill="none" stroke="transparent" strokeWidth={Math.max(1, strokeW * 4)} strokeLinecap="round" strokeLinejoin="round" style={{ pointerEvents: 'auto', cursor: 'pointer' }} onPointerDown={(e) => { e.stopPropagation(); onRouteClick(route.id); }} />
            )}
            {/* Shadow / outline so the line reads on any background */}
            <path d={pathD} fill="none" stroke="#000000" strokeWidth={strokeW + (4 / canvasWidth * 100)} opacity={0.3} strokeLinecap="round" strokeLinejoin="round" />
            {/* Main dashed route line (wider = easier to see) with draw-in animation */}
            <path d={pathD} fill="none" stroke={route.color || '#cc0000'} strokeWidth={strokeW} strokeLinecap="round" strokeLinejoin="round"
              strokeDasharray={dashArr}
              strokeDashoffset={route.isDashed === false ? DASH_LEN : 0}
              className={route.isDashed === false ? 'route-draw' : ''}
              style={{ animationDelay: `${idx * 0.08}s` }} />
            {/* A → B endpoint labels */}
            {isNavAB && pts.length >= 2 && (
              <>
                <circle cx={pts[0].left} cy={pts[0].top} r={1.3} fill="#16a34a" stroke="#000" strokeWidth={0.4} />
                <text x={pts[0].left} y={(parseFloat(pts[0].top) - 1.8).toFixed(2)} textAnchor="middle" fontSize={2.6} fontWeight={900} fill="#16a34a" fontFamily="monospace">A</text>
                <circle cx={pts[1].left} cy={pts[1].top} r={1.3} fill="#dc2626" stroke="#000" strokeWidth={0.4} />
                <text x={pts[1].left} y={(parseFloat(pts[1].top) - 1.8).toFixed(2)} textAnchor="middle" fontSize={2.6} fontWeight={900} fill="#dc2626" fontFamily="monospace">B</text>
              </>
            )}
            {/* Visit-order numbers for multi-stop routes */}
            {!isNavAB && pts.map((p, i) => {
              const pointId = route.pointIds?.[i];
              const item = (items || []).find(it => it.element?.id === pointId);
              if (item?.element?.isHiddenWaypoint) return null;
              
              return (
                <g key={`n-${i}`}>
                  <circle cx={p.left} cy={p.top} r={0.9} fill={route.color || '#cc0000'} stroke="#000" strokeWidth={0.3} />
                  <text x={p.left} y={(parseFloat(p.top) - 1.2).toFixed(2)} textAnchor="middle" fontSize={1.4} fontWeight={900} fill="#fff" fontFamily="monospace">{i + 1}</text>
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}

export default function MapElementsLayer({ items, onLocationClick, onRouteClick, routes, canvasWidth = DEFAULT_CANVAS_WIDTH, canvasHeight = DEFAULT_CANVAS_HEIGHT }) {
  const hasItems = Array.isArray(items) && items.length > 0;
  const hasRoutes = Array.isArray(routes) && routes.length > 0;
  if (!hasItems && !hasRoutes) return null;
  return (
    <div className="absolute inset-0 z-[5] overflow-hidden pointer-events-none select-none">
      <MapRoutesLayer routes={routes} items={items} onRouteClick={onRouteClick} canvasWidth={canvasWidth} canvasHeight={canvasHeight} />
      {(items || []).map(({ element, position }) => {
        if (element.isHiddenWaypoint) return null;
        
        const isEmoji = element.type === 'emoji';
        return (
          <div
            key={element.id}
            className={`absolute flex items-center justify-center pointer-events-auto z-[2] ${element.isLocation && onLocationClick ? 'cursor-pointer' : ''}`}
            onClick={element.isLocation && onLocationClick ? (event) => {
              event.stopPropagation();
              onLocationClick(element.id);
            } : undefined}
            style={{
              top: toPct(position.top, canvasHeight),
              left: toPct(position.left, canvasWidth),
              width: toPct(position.width, canvasWidth),
              height: toPct(position.height, canvasHeight),
              transform: `rotate(${element.rotation ?? 0}deg)`
            }}
          >
            <div className={`w-full h-full flex items-center justify-center transition-transform duration-200 ${element.isLocation ? 'hover:animate-soft-bounce' : ''}`} style={getElementFrameStyle(element)}>
            {element.type === 'image' ? (
              element.filter === 'polaroid' ? (
                <div className="w-full h-full flex items-center justify-center p-[5%] pointer-events-none">
                  <div className="w-full h-full bg-white border-2 border-black p-1 pb-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.25)] rotate-[-2deg]">
<img src={element.content} alt={element.label || 'element'} loading="lazy" decoding="async" className="w-full h-full object-contain pointer-events-none" style={getImageFilterStyle(element)} />
                  </div>
                </div>
              ) : element.filter === 'sticker' ? (
                <div className="w-full h-full p-[4%] pointer-events-none">
                  <div className="w-full h-full bg-white rounded-[28%] border-4 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,0.2)] overflow-hidden">
                    <img src={element.content} alt={element.label || 'element'} loading="lazy" decoding="async" className="w-full h-full object-cover pointer-events-none" style={getImageFilterStyle(element)} />
                  </div>
                </div>
              ) : (
                <img src={element.content} alt={element.label || 'element'} loading="lazy" decoding="async" className="w-full h-full object-contain pointer-events-none" style={getImageFilterStyle(element)} />
              )
            ) : element.type === 'shape' ? (
              <div className="w-full h-full pointer-events-none" style={{ ...getShapeStyle(element), ...getFramePlaceholderStyle(element), overflow: element.frameImage || element.isFrame ? 'hidden' : undefined }}>
                {element.frameImage && (element.frameImage.type === 'image' ? <img src={element.frameImage.content} alt={element.frameImage.label || 'framed element'} loading="lazy" decoding="async" className="w-full h-full object-cover" /> : <span className="flex w-full h-full items-center justify-center text-[min(18cqw,180px)]">{element.frameImage.content}</span>)}
              </div>
            ) : (
              <span
                className="filter drop-shadow-md px-2 w-full"
                style={{
                  fontSize: isEmoji ? toCqw(Math.min(position.width, position.height) * 0.8, canvasWidth) : toCqw(element.fontSize ?? 160, canvasWidth),
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
                  ...(isEmoji ? {} : element.textStroke ? { WebkitTextStroke: `${toCqw(element.textStroke, canvasWidth)} #111111` } : {}),
                  ...(isEmoji ? {} : element.textGlow ? { textShadow: `0 0 ${toCqw(18, canvasWidth)} ${element.textGlow}` } : {})
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
import { useMemo } from 'react';
import { Layer, Rect, Ellipse, Image as KonvaImage } from 'react-konva';
import useImage from 'use-image';
import { GRID_STEP } from '../../lib/editorCanvas';

const createGridTile = (color) => {
  const canvas = document.createElement('canvas');
  canvas.width = GRID_STEP;
  canvas.height = GRID_STEP;
  const context = canvas.getContext('2d');
  context.strokeStyle = color;
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(GRID_STEP - 0.5, 0);
  context.lineTo(GRID_STEP - 0.5, GRID_STEP);
  context.stroke();
  context.beginPath();
  context.moveTo(0, GRID_STEP - 0.5);
  context.lineTo(GRID_STEP, GRID_STEP - 0.5);
  context.stroke();
  return canvas;
};

const templateLayouts = {
  blank: {
    base: '#ffffff',
    gridColor: null,
    horizontalBands: [],
    verticalBands: []
  },
  tropical: {
    base: '#f8d58b',
    gridColor: 'rgba(49,78,75,0.22)',
    horizontalBands: [
      { from: 0.44, to: 0.45, fill: '#d9a866' },
      { from: 0.66, to: 0.67, fill: '#42b8d7' },
      { from: 0.67, to: 1, fill: '#278fc8' }
    ],
    verticalBands: []
  },
  island: {
    base: '#85d64d',
    gridColor: 'rgba(25,83,49,0.35)',
    horizontalBands: [],
    verticalBands: [],
    ellipse: '#a0e65c'
  },
  river: {
    base: '#78ce3d',
    gridColor: 'rgba(38,92,50,0.3)',
    horizontalBands: [],
    verticalBands: [{ from: 0.42, to: 0.48, fill: '#328ec4' }]
  },
  boardwalk: {
    base: '#f5cf7b',
    gridColor: 'rgba(74,74,44,0.24)',
    horizontalBands: [
      { from: 0.4, to: 0.52, fill: '#98613d' },
      { from: 0.63, to: 1, fill: '#35afd2' }
    ],
    verticalBands: []
  }
};

export default function BackgroundLayer({ templateId, backgroundImage, width, height }) {
  const [image] = useImage(backgroundImage || '');
  const layout = templateLayouts[templateId] || templateLayouts.tropical;

  const gridTile = useMemo(() => (
    layout.gridColor ? createGridTile(layout.gridColor) : null
  ), [layout.gridColor]);

  return (
    <Layer listening={false}>
      <Rect x={0} y={0} width={width} height={height} fill={layout.base} />
      {layout.horizontalBands.map((band, index) => (
        <Rect
          key={`h-${index}`}
          x={0}
          y={height * band.from}
          width={width}
          height={height * (band.to - band.from)}
          fill={band.fill}
        />
      ))}
      {layout.verticalBands.map((band, index) => (
        <Rect
          key={`v-${index}`}
          x={width * band.from}
          y={0}
          width={width * (band.to - band.from)}
          height={height}
          fill={band.fill}
        />
      ))}
      {layout.ellipse && (
        <Ellipse
          x={width / 2}
          y={height / 2}
          radiusX={width * 0.55}
          radiusY={height * 0.55}
          opacity={0.9}
          fillRadialGradientStartRadius={0}
          fillRadialGradientEndRadius={height * 0.55}
          fillRadialGradientColorStops={[0, layout.ellipse, 0.45, layout.ellipse, 0.46, layout.base]}
        />
      )}
      {gridTile && (
        <Rect
          x={0}
          y={0}
          width={width}
          height={height}
          fillPatternImage={gridTile}
          fillPatternRepeat="repeat"
        />
      )}
      {image && <KonvaImage image={image} width={width} height={height} />}
    </Layer>
  );
}
import { Layer } from 'react-konva';
import { useAppStore } from '../../store';
import { AnnotationNode } from './AnnotationNode';

export function AnnotationBackLayer() {
  const annotations = useAppStore((s) => s.annotations);
  const back = annotations.filter((a) => a.layer === 'back');

  if (back.length === 0) return null;

  return (
    <Layer>
      {back.map((a) => (
        <AnnotationNode key={a.id} a={a} />
      ))}
    </Layer>
  );
}

export function AnnotationFrontLayer() {
  const annotations = useAppStore((s) => s.annotations);
  const front = annotations.filter((a) => a.layer === 'front');

  if (front.length === 0) return null;

  return (
    <Layer>
      {front.map((a) => (
        <AnnotationNode key={a.id} a={a} />
      ))}
    </Layer>
  );
}

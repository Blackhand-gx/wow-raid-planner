import type { Player } from './player';
import type { Boss } from './boss';
import type { MapData } from './map';
import type { Annotation } from './annotation';
import type { ViewportState } from './canvas';

export interface ProjectFile {
  version: 1;
  createdAt: string;
  updatedAt: string;
  players: Player[];
  bosses: Boss[];
  maps: MapData[];
  activeMapId: string | null;
  annotations: Annotation[];
  viewport: ViewportState;
}

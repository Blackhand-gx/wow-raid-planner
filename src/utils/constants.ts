export const DEFAULT_VIEWPORT = { x: 0, y: 0, scale: 1 };

export const MIN_SCALE = 0.1;
export const MAX_SCALE = 5.0;
export const ZOOM_SPEED = 0.001;
export const PAN_SPEED = 1.5;

export const PLAYER_ICON_RADIUS = 22;
export const BOSS_ICON_RADIUS = 40;
export const MAX_IMAGE_SIZE = 2048;

export const ANNOTATION_COLORS = [
  '#FF4444', '#FF8800', '#FFDD00', '#44FF44',
  '#44AAFF', '#AA44FF', '#FF44AA', '#FFFFFF',
  '#00CCCC', '#FF6699', '#99CC00', '#CC6600',
];

export const SNAP_THRESHOLD = 5;
export const SNAP_FORCE = 2;

export const MAX_HISTORY = 50;
export const AUTOSAVE_DELAY = 2000;
export const AUTOSAVE_KEY = 'wow-raid-planner-autosave';

export const RAID_MARKERS = ['star', 'circle', 'diamond', 'triangle', 'moon', 'square', 'cross', 'skull'] as const;

export const PLAYER_ROLES = ['dps', 'tank', 'healer'] as const;

export const HOTKEYS = {
  UNDO: 'ctrl+z',
  REDO: 'ctrl+y',
  SAVE: 'ctrl+s',
  OPEN: 'ctrl+o',
  SELECT_ALL: 'ctrl+a',
  DELETE: 'delete',
  ESCAPE: 'escape',
  COPY: 'ctrl+c',
  PASTE: 'ctrl+v',
} as const;

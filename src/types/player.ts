export type WoWClass =
  | 'warrior'
  | 'paladin'
  | 'hunter'
  | 'rogue'
  | 'priest'
  | 'death-knight'
  | 'shaman'
  | 'mage'
  | 'warlock'
  | 'monk'
  | 'druid'
  | 'demon-hunter'
  | 'evoker'
  | 'unknown';

export type PlayerRole = 'tank' | 'healer' | 'dps';

export interface Player {
  id: string;
  name: string;
  className: WoWClass;
  x: number;
  y: number;
  color?: string;
  marker?: string;
  role?: PlayerRole;
}

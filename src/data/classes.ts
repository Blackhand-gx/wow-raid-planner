import type { WoWClass } from '../types';

export interface ClassDefinition {
  key: WoWClass;
  label: string;
  color: string;
  iconPath: string;
}

export const WOW_CLASSES: ClassDefinition[] = [
  { key: 'warrior',       label: '战士',     color: '#C79C6E', iconPath: '/class-icons/warrior.png' },
  { key: 'paladin',       label: '圣骑士',   color: '#F58CBA', iconPath: '/class-icons/paladin.png' },
  { key: 'hunter',        label: '猎人',     color: '#ABD473', iconPath: '/class-icons/hunter.png' },
  { key: 'rogue',         label: '潜行者',   color: '#FFF569', iconPath: '/class-icons/rogue.png' },
  { key: 'priest',        label: '牧师',     color: '#FFFFFF', iconPath: '/class-icons/priest.png' },
  { key: 'death-knight',  label: '死亡骑士', color: '#C41F3B', iconPath: '/class-icons/death-knight.png' },
  { key: 'shaman',        label: '萨满祭司', color: '#0070DE', iconPath: '/class-icons/shaman.png' },
  { key: 'mage',          label: '法师',     color: '#40C7EB', iconPath: '/class-icons/mage.png' },
  { key: 'warlock',       label: '术士',     color: '#8787ED', iconPath: '/class-icons/warlock.png' },
  { key: 'monk',          label: '武僧',     color: '#00FF96', iconPath: '/class-icons/monk.png' },
  { key: 'druid',         label: '德鲁伊',   color: '#FF7D0A', iconPath: '/class-icons/druid.png' },
  { key: 'demon-hunter',  label: '恶魔猎手', color: '#A330C9', iconPath: '/class-icons/demon-hunter.png' },
  { key: 'evoker',        label: '唤魔师',   color: '#33937F', iconPath: '/class-icons/evoker.png' },
  { key: 'unknown',       label: '未知',     color: '#888888', iconPath: '/class-icons/unknown.png' },
];

export function getClassDef(key: WoWClass): ClassDefinition {
  return WOW_CLASSES.find(c => c.key === key) ?? WOW_CLASSES[0];
}

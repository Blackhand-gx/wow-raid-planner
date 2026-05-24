export interface BossPreset {
  name: string;
  names?: string[];
  defaultMapPath?: string;
  defaultIconPaths?: string[];
}

export interface RaidPreset {
  name: string;
  bosses: BossPreset[];
}

export interface ExpansionPreset {
  name: string;
  raids: RaidPreset[];
}

export const EXPANSION_PRESETS: ExpansionPreset[] = [
  {
    name: '12.0 至暗之夜',
    raids: [
      {
        name: '虚影尖塔',
        bosses: [
          { name: '元首阿福扎恩', defaultMapPath: '/maps/voidspire-averzian.png', defaultIconPaths: ['/boss-icons/averzian.png'] },
          { name: '弗拉希乌斯', defaultMapPath: '/maps/voidspire-vorasius.png', defaultIconPaths: ['/boss-icons/vorasius.png'] },
          { name: '陨落之王萨哈达尔', defaultMapPath: '/maps/voidspire-salhadaar.png', defaultIconPaths: ['/boss-icons/salhadaar.png'] },
          { name: '威厄高尔和艾佐拉克', names: ['威厄高尔', '艾佐拉克'], defaultMapPath: '/maps/voidspire-twin-dragons.png', defaultIconPaths: ['/boss-icons/vigil-gore.png', '/boss-icons/azurak.png'] },
          { name: '光盲先锋军（瑟恩、贝莱梅、光血）', names: ['瑟恩', '贝莱梅', '光血'], defaultMapPath: '/maps/voidspire-lightblinded.png', defaultIconPaths: ['/boss-icons/thyrn.png', '/boss-icons/belame.png', '/boss-icons/lightblood.png'] },
          { name: '宇宙之冕（奥蕾莉亚、殁里乌姆、殆米阿尔、龌勒卢思）', names: ['奥蕾莉亚', '殁里乌姆', '殆米阿尔', '龌勒卢思'], defaultMapPath: '/maps/voidspire-cosmic-crown.png', defaultIconPaths: ['/boss-icons/alleria.png', '/boss-icons/morium.png', '/boss-icons/demial.png', '/boss-icons/wolelus.png'] },
        ],
      },
      {
        name: '梦境裂隙',
        bosses: [
          { name: '奇美鲁斯，未梦之神', defaultMapPath: '/maps/dreamrift-chimaerus.png', defaultIconPaths: ['/boss-icons/chimaerus.png'] },
        ],
      },
      {
        name: '进军奎尔丹纳斯',
        bosses: [
          { name: '贝洛朗，奥的子嗣', defaultMapPath: '/maps/queldanas-beloren.png', defaultIconPaths: ['/boss-icons/beloren.png'] },
          { name: '至暗之夜降临（鲁拉）', names: ['鲁拉'], defaultMapPath: '/maps/queldanas-lura.png', defaultIconPaths: ['/boss-icons/lura.png'] },
        ],
      },
    ],
  },
];

import { inflateRaw } from 'pako';

// LibDeflate 自定义 Base64 字符集：a-z A-Z 0-9 ( )
const DECODE_MAP: Record<number, number> = {
  97:0,98:1,99:2,100:3,101:4,102:5,103:6,104:7,
  105:8,106:9,107:10,108:11,109:12,110:13,111:14,112:15,
  113:16,114:17,115:18,116:19,117:20,118:21,119:22,120:23,
  121:24,122:25,65:26,66:27,67:28,68:29,69:30,70:31,
  71:32,72:33,73:34,74:35,75:36,76:37,77:38,78:39,
  79:40,80:41,81:42,82:43,83:44,84:45,85:46,86:47,
  87:48,88:49,89:50,90:51,48:52,49:53,50:54,51:55,
  52:56,53:57,54:58,55:59,56:60,57:61,40:62,41:63,
};

function decodeCustomBase64(data: string): Uint8Array {
  let str = data;
  // 去掉尾部可能混杂的换行和空字符（LibDeflate 解码时也会处理）
  str = str.replace(/^[\t\n\r ]+/, '').replace(/[\t\n\r ]+$/, '');

  const bytes: number[] = [];
  let cache = 0;
  let cacheBits = 0;

  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    const val = DECODE_MAP[code];
    if (val === undefined) continue; // 跳过非法字符
    cache = cache + val * (1 << cacheBits);
    cacheBits += 6;
    while (cacheBits >= 8) {
      bytes.push(cache & 0xff);
      cache = cache >>> 8;
      cacheBits -= 8;
    }
  }

  return new Uint8Array(bytes);
}

function processName(raw: string): string {
  let name = raw.trim();
  name = name.replace(/^[^a-zA-Z一-鿿㐀-䶿0-9\-·•｜|—–]+/, '');
  name = name.replace(/[^a-zA-Z一-鿿㐀-䶿0-9\-·•｜|—–]+$/, '');
  const sepIdx = name.search(/[-·•｜|—–一—丨lI1]/);
  if (sepIdx > 0) name = name.substring(0, sepIdx);
  if (/^[一-鿿]{8,}$/.test(name)) name = name.substring(0, 6);
  name = name.replace(/[（(][^)）]*[)）]/g, '').trim();
  return name || raw.trim();
}

function parseLuaTable(str: string): (string | null)[] {
  // 去头部 "0," 或直接 "{...}"
  let inner = str.trim();
  if (inner.startsWith('0,')) inner = inner.slice(2).trim();

  const players: (string | null)[] = new Array(40).fill(null);

  // 匹配 [index]="name" 或 [index]='name' 或 ['name'] 字符串（值被 StringToText 编码）
  const entryRe = /\[(\d+)\]=((?:"(?:[^"\\]|\\.)*")|(?:'[^']*'))/g;
  let match: RegExpExecArray | null;
  while ((match = entryRe.exec(inner)) !== null) {
    const idx = parseInt(match[1], 10);
    if (idx < 1 || idx > 40) continue;
    let value = match[2];
    // 去掉首尾引号
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    // Lua 转义处理
    value = value
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\r')
      .replace(/\\t/g, '\t')
      .replace(/\\"/g, '"')
      .replace(/\\'/g, "'")
      .replace(/\\\\/g, '\\');

    if (value.trim() !== '') {
      players[idx - 1] = processName(value);
    }
  }

  return players;
}

function parsePlainText(str: string): (string | null)[] {
  const players: (string | null)[] = new Array(40).fill(null);
  const lines = str.split(/\r?\n/).filter((l) => l.trim() !== '');

  // 先尝试类型1: 两列用 tab/空格分隔 (Group1 Group2 pairs)
  const hasTabs = lines.some((l) => l.includes('\t'));
  const hasMultiCol = lines[0]?.split(/\s{2,}|\t/).filter(Boolean).length >= 2;

  if (hasTabs || hasMultiCol) {
    // 类型1: G1 Left  G1 Right / G2 Left  G2 Right ...
    let pos = 0;
    for (const line of lines) {
      const cols = line.split(/\t|\s{2,}/).filter((c) => c.trim() !== '');
      for (const col of cols) {
        if (pos < 40 && col.trim()) {
          players[pos] = processName(col.trim().replace(/^"|"$/g, ''));
          pos++;
        }
      }
    }
  } else if (lines.length <= 8) {
    // 类型2: 每行是一个小队（空格分隔的5个名字），最多8行
    for (let i = 0; i < lines.length; i++) {
      const names = lines[i].split(/\s+/).filter((n) => n.trim() !== '');
      for (let j = 0; j < names.length; j++) {
        const idx = i * 5 + j;
        if (idx < 40) {
          players[idx] = processName(names[j].trim().replace(/^"|"$/g, ''));
        }
      }
    }
  } else {
    // 类型3: 每行一个名字，按顺序填满 5×8
    for (let i = 0; i < Math.min(lines.length, 40); i++) {
      players[i] = processName(lines[i].trim().replace(/^"|"$/g, ''));
    }
  }

  return players;
}

/**
 * 解析 MRT 阵容设置字符串，返回 40 位玩家名数组（null 为空位）
 */
export function parseMRTRosterString(raw: string): string[] {
  let str = raw.trim();

  // 自动清理：有些人粘贴时会带入颜色代码 |cff...|r
  str = str.replace(/\|cff[0-9a-fA-F]{6}/g, '').replace(/\|r/g, '');

  // 检测 MRT/ExRT 编码头部
  let isCompressed = false;

  if (str.startsWith('EXRTRGR')) {
    isCompressed = str[7] === '1';
    str = str.slice(8);
  } else if (str.startsWith('MRTRGR')) {
    isCompressed = str[6] === '1';
    str = str.slice(7);
  } else if (str.startsWith('EXRT') || str.startsWith('MRT')) {
    // 其他 MRT/EXRT 前缀（如 MRTP, EXRTIRRU），可能是其他模块的导出
    // 尝试通用解码：跳过前缀直到数字标志
    const match = str.match(/^[A-Z]+([01])/);
    if (match && match.index !== undefined) {
      isCompressed = match[1] === '1';
      str = str.slice(match.index! + match[0].length);
    }
  } else {
    // 无编码头，按纯文本处理
    const allNames = parsePlainText(str);
    return allNames.filter((n): n is string => n !== null);
  }

  // 解码 Base64 → 字节
  let decoded: Uint8Array;
  try {
    decoded = decodeCustomBase64(str);
  } catch {
    // 解码失败，回退纯文本
    const allNames = parsePlainText(str);
    return allNames.filter((n): n is string => n !== null);
  }

  // 解压 Deflate
  let text: string;
  if (isCompressed) {
    try {
      decoded = inflateRaw(decoded);
    } catch {
      throw new Error('Deflate 解压失败，数据可能已损坏');
    }
  }

  text = new TextDecoder().decode(decoded);

  // 解析 Lua 表
  const players = parseLuaTable(text);
  return players.filter((n): n is string => n !== null);
}

// 调试用：打印解码过程
export function debugMRTString(raw: string): {
  hasHeader: boolean;
  isCompressed: boolean;
  decodedLength: number;
  decompressedLength: number;
  tableText: string;
  players: string[];
} {
  let str = raw.trim();
  str = str.replace(/\|cff[0-9a-fA-F]{6}/g, '').replace(/\|r/g, '');

  let hasHeader = false;
  let isCompressed = false;

  if (str.startsWith('EXRTRGR') || str.startsWith('MRTRGR')) {
    hasHeader = true;
    isCompressed = str[str.startsWith('EXRTRGR') ? 7 : 6] === '1';
    str = str.slice(str.startsWith('EXRTRGR') ? 8 : 7);
  }

  let decoded = decodeCustomBase64(str);
  const decodedLength = decoded.length;

  let decompressedLength = decodedLength;
  let tableText = '';
  if (isCompressed) {
    decoded = inflateRaw(decoded);
    decompressedLength = decoded.length;
  }
  tableText = new TextDecoder().decode(decoded);

  const players = parseLuaTable(tableText);

  return {
    hasHeader,
    isCompressed,
    decodedLength,
    decompressedLength,
    tableText,
    players: players.filter((n): n is string => n !== null),
  };
}

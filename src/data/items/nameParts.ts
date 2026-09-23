/**
 * 命名词表与典故模板（M2）
 * 名字 = material + omen + form，用 id 哈希取模索引，禁止随机（保证同名稳定）。
 */
import type { NameParts } from '../../types';

export const NAME_PARTS: NameParts = {
  material: [
    '镔铁', '寒玉', '沉香', '鲛绡', '雷击木', '玄金', '赤铜', '青冥铁',
    '羊脂玉', '紫檀', '墨玉', '龙鳞', '凤羽', '龟甲', '犀角', '玳瑁',
    '雪蚕丝', '火浣布', '星陨铁', '九曲珠', '珊瑚', '砗磲', '玛瑙', '琅玕',
  ],
  form: [
    '匕', '锏', '符', '灯', '囊', '匣', '佩', '砚', '笛', '镜',
    '杖', '鼎', '冠', '梭', '环', '壶', '简', '珠', '铃', '幡',
    '扇', '簪', '锁', '印',
  ],
  omen: [
    '不语', '照胆', '衔蝉', '秋水', '余烬', '吞星', '回风', '照夜',
    '藏锋', '洗砚', '折桂', '摘星', '问禅', '听雪', '观棋', '煮海',
    '守拙', '惊鸿', '踏雪', '问剑', '焚香', '听雨', '抱朴', '含光',
    '鸣涧', '落霞', '拂云', '沐月', '引鹤', '藏山', '渡江', '望舒',
  ],
};

/** 典故句模板：${place} ${material} ${omenHint} 三处可插值 */
export const LORE_TEMPLATES: string[] = [
  '此物出自${place}，据说是${material}所制。',
  '相传${place}有异人，以此${material}炼成，${omenHint}。',
  '此物流转自${place}，暗藏${omenHint}的旧事。',
  '${place}的老匠人临终前留下的${material}，${omenHint}。',
  '昔年${place}大旱，得此物者${omenHint}。',
  '此物本属${place}一方豪族，${omenHint}，遂流落民间。',
  '据${place}的货郎说，这${material}${omenHint}。',
  '此物出自${place}，${omenHint}，见者无不称奇。',
  '${place}的故纸堆里，记着这${material}的一段${omenHint}。',
  '传闻此物与${place}的一场旧案有关，${omenHint}。',
];

/** 典故里 ${omenHint} 的补充短语 */
export const OMEN_HINTS: string[] = [
  '能镇邪祟', '能避水火', '逢凶化吉', '能通鬼神', '久藏不腐',
  '夜能生光', '闻之有异香', '触手生温', '能知晴雨', '轻如无物',
];

export const LORE_PLACES: string[] = [
  '长安西市', '洛阳白马寺', '东海龙宫', '花果山', '高老庄', '流沙河畔',
  '五庄观', '火焰山', '盘丝洞', '狮驼岭', '女儿国', '通天河',
];

/** 稳定的字符串哈希（FNV-1a），返回 0~1 之间的确定性小数 */
export function hash01(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 0xffffffff;
}

/** 单一哈希按位拆分到三个维度（m / f / o），避免三维取模的同余碰撞 */
function pickByBit<T>(mArr: T[], fArr: T[], oArr: T[], id: string): [T, T, T] {
  const h = (2166136261 >>> 0);
  let x = h;
  for (let i = 0; i < id.length; i++) {
    x ^= id.charCodeAt(i);
    x = Math.imul(x, 16777619);
  }
  const u = x >>> 0;
  const m = u % mArr.length;
  const f = Math.floor(u / mArr.length) % fArr.length;
  const o = Math.floor(u / (mArr.length * fArr.length)) % oArr.length;
  return [mArr[m], fArr[f], oArr[o]];
}

/** 用 id 哈希稳定组合出名字（material + omen + form，同 id 永远同名） */
export function composeName(id: string): string {
  const [m, f, o] = pickByBit(NAME_PARTS.material, NAME_PARTS.form, NAME_PARTS.omen, id);
  return `${m}${o}${f}`;
}

function pickLore<T>(arr: T[], id: string, salt: number): T {
  return arr[Math.floor(hash01(id + '::' + salt) * arr.length) % arr.length];
}

/** 用 id 哈希稳定生成典故 */
export function composeLore(id: string): string {
  const tpl = pickLore(LORE_TEMPLATES, id, 4);
  const place = pickLore(LORE_PLACES, id, 5);
  const material = pickLore(NAME_PARTS.material, id, 6);
  const omenHint = pickLore(OMEN_HINTS, id, 7);
  return tpl
    .replace('${place}', place)
    .replace('${material}', material)
    .replace('${omenHint}', omenHint);
}

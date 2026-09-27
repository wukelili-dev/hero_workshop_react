/**
 * placeLore — 地名志（沉浸感 I2）
 * 每格按地形从池中取 1~2 句，进入格子时作为"开场句"显示。
 * 每区域 20~30 条即可，不逐格手写；同一格重复进入在池内轮换、不连读同一句。
 */
import type { PlaceLore } from '../types';

export const PLACE_LORE: PlaceLore[] = [
  // ── 中原 central_plain ──
  { id: 'cp_plains_1', terrain: ['plains'], lines: ['官道笔直，两旁的麦田一眼望不到边。', '几个农人在田里弯腰，日头正高。', '远处炊烟袅袅，是个有炊烟就有人的好地方。'] },
  { id: 'cp_plains_2', terrain: ['plains'], lines: ['路边一座茶棚，棚下坐着几个歇脚的旅人。', '有马蹄印一路向南，是官家的驿马。'] },
  { id: 'cp_forest_1', terrain: ['forest'], lines: ['林子里光线晦暗，鸟鸣声忽近忽远。', '树叶沙沙，似有什么在林间穿行。', '一株老树盘根错节，像是活了几百年。'] },
  { id: 'cp_forest_2', terrain: ['forest'], lines: ['林中雾气未散，脚下的枯枝被踩得脆响。', '有野兔从灌木里蹿出，又没了影。'] },
  { id: 'cp_mountain_1', terrain: ['mountain'], lines: ['山路崎岖，石阶被岁月磨得光滑。', '山风猎猎，吹得衣袂翻飞。', '半山腰一座凉亭，能望见山下如豆的村落。'] },
  { id: 'cp_mountain_2', terrain: ['mountain'], lines: ['崖壁如削，苍鹰在山谷间盘旋。', '山泉自石缝渗出，汇成一线细流。'] },
  { id: 'cp_water_1', terrain: ['water'], lines: ['水面波光粼粼，一叶渔舟泊在岸边。', '河水汤汤，渡口的老船公正在打盹。', '有白鹭贴着水面掠过，惊起一圈涟漪。'] },
  { id: 'cp_water_2', terrain: ['water'], lines: ['河风带着水汽扑面，凉丝丝的。', '芦苇荡里传来野鸭的叫声。'] },
  { id: 'cp_swamp_1', terrain: ['swamp'], lines: ['泥沼里冒着气泡，气味腥臭。', '水草纠缠，一步踏错便是深不见底的泥坑。', '蛙鸣此起彼伏，吵得人心烦。'] },
  { id: 'cp_desert_1', terrain: ['desert'], lines: ['黄沙漫漫，日头烤得地面发烫。', '一棵枯树孤零零立在沙丘上。'] },
  { id: 'cp_celestial_1', terrain: ['celestial'], lines: ['云雾缭绕，恍若踏入仙境。', '一道天光自云隙倾泻而下，照得通明。', '鹤唳声自云端传来，渺渺茫茫。'] },
  { id: 'cp_volcanic_1', terrain: ['volcanic'], lines: ['热浪扑面，硫磺的气味呛鼻。', '脚下地面微微发烫，远处有熔岩缓缓流淌。'] },

  // ── 河西 hexi ──
  { id: 'hx_desert_1', terrain: ['desert'], lines: ['大漠无垠，沙丘如凝固的浪。', '风卷起一阵黄沙，打得人脸生疼。', '远处有一队驼队，铃铛声断断续续。'] },
  { id: 'hx_desert_2', terrain: ['desert'], lines: ['沙丘上一串驼印，被风抹去了半截。', '日头毒辣，连影子都缩成了一团。', '一口枯井，井绳已经断了。'] },
  { id: 'hx_desert_3', terrain: ['desert'], lines: ['海市蜃楼在远处浮现，转瞬又散。', '沙暴将至，天边黄云压城。'] },
  { id: 'hx_mountain_1', terrain: ['mountain'], lines: ['祁连山影横在天边，如一道青黑的长墙。', '山口风大，吹得人几乎站不稳。', '崖壁上有斑驳的佛龛，香火早已断绝。'] },
  { id: 'hx_mountain_2', terrain: ['mountain'], lines: ['碎石滚落，惊起一群岩羊。', '关隘残墙蜿蜒在脊线上，像条将死的长龙。'] },
  { id: 'hx_plains_1', terrain: ['plains'], lines: ['一片绿洲，芦苇在风中摇曳。', '屯田的沟渠纵横，麦苗稀稀拉拉。', '月牙泉畔，几株胡杨黄了叶子。'] },
  { id: 'hx_plains_2', terrain: ['plains'], lines: ['烽燧孤零零立在土丘上，狼烟早已熄灭。', '商队的车辙在沙土里清晰可见。'] },

  // ── 东海 donghai ──
  { id: 'dh_water_1', terrain: ['water'], lines: ['海面碧蓝，浪花碎成一片白沫。', '潮声一浪接一浪，永不停歇。', '远处有海鸟盘旋，忽地俯冲入水。'] },
  { id: 'dh_water_2', terrain: ['water'], lines: ['海水深不见底，蓝得发黑。', '一艘破船的桅杆斜插在水面。', '有海豚跃出海面，画出一道银弧。'] },
  { id: 'dh_water_3', terrain: ['water'], lines: ['海雾弥漫，看不清十步之外。', '海底有暗流涌动，脚下一凉。'] },
  { id: 'dh_mountain_1', terrain: ['mountain'], lines: ['一座海外仙山，云雾半掩。', '岛上的草木郁郁葱葱，似有仙气。', '崖边有野果，红得诱人。'] },
  { id: 'dh_plains_1', terrain: ['plains'], lines: ['一片沙洲，海鸟在此栖息。', '椰树成排，海风吹得哗哗响。', '沙滩上散落着各色贝壳。'] },
  { id: 'dh_celestial_1', terrain: ['celestial'], lines: ['龙宫的珠光从水底透上来，如梦似幻。', '海面下有游鱼衔着光，穿行如星。', '一道水幕自天而降，是龙宫的入口。'] },
];

/** 取某地形的地名志句池（跨区域合并去重） */
export function loreForTerrain(terrain: string): string[] {
  const out: string[] = [];
  for (const lore of PLACE_LORE) {
    if (lore.terrain.includes(terrain)) out.push(...lore.lines);
  }
  return out;
}

/** 某城的开场句池（感官 note + 通用，供进入提示轮换） */
export function cityLore(cityId: string): string[] {
  // 感官 note 已在 sense.ts，这里返回地名志视角的补充句
  const map: Record<string, string[]> = {
    changan: ['朱雀大街上车马如织。', '西市人声鼎沸，货摊一眼望不到头。', '钟楼鼓楼遥遥相对，声传全城。'],
    yangguan: ['关墙斑驳，箭痕犹在。', '驼队从关门下鱼贯而出。', '沙尘里，戍卒的身影站得笔直。'],
    donghai: ['水幕之后，龙宫金碧辉煌。', '虾兵蟹将列队而过，甲胄生寒。', '珊瑚林间，游鱼衔珠往来。'],
  };
  return map[cityId] ?? ['城门口人来人往。', '街巷交错，四通八达。'];
}

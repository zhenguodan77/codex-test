// 每日一句：主席诗词 + 经典古诗词（短句引用，注明出处）
export interface Quote {
  text: string
  source: string
}

export const QUOTES: Quote[] = [
  { text: '一万年太久，只争朝夕。', source: '毛泽东《满江红·和郭沫若同志》' },
  { text: '无限风光在险峰。', source: '毛泽东《七绝》' },
  { text: '风物长宜放眼量。', source: '毛泽东《七律·和柳亚子先生》' },
  { text: '数风流人物，还看今朝。', source: '毛泽东《沁园春·雪》' },
  { text: '雄关漫道真如铁，而今迈步从头越。', source: '毛泽东《忆秦娥·娄山关》' },
  { text: '踏遍青山人未老，风景这边独好。', source: '毛泽东《清平乐·会昌》' },
  { text: '万类霜天竞自由。', source: '毛泽东《沁园春·长沙》' },
  { text: '世上无难事，只要肯登攀。', source: '毛泽东《水调歌头·重上井冈山》' },
  { text: '待到山花烂漫时，她在丛中笑。', source: '毛泽东《卜算子·咏梅》' },
  { text: '坐地日行八万里，巡天遥看一千河。', source: '毛泽东《七律二首·送瘟神》' },
  { text: '人生易老天难老。', source: '毛泽东《采桑子·重阳》' },
  { text: '萧瑟秋风今又是，换了人间。', source: '毛泽东《浪淘沙·北戴河》' },
  { text: '人间有味是清欢。', source: '苏轼《浣溪沙》' },
  { text: '此心安处是吾乡。', source: '苏轼《定风波》' },
  { text: '一蓑烟雨任平生。', source: '苏轼《定风波》' },
  { text: '行到水穷处，坐看云起时。', source: '王维《终南别业》' },
  { text: '采菊东篱下，悠然见南山。', source: '陶渊明《饮酒·其五》' },
  { text: '长风破浪会有时，直挂云帆济沧海。', source: '李白《行路难》' },
  { text: '天生我材必有用。', source: '李白《将进酒》' },
  { text: '山重水复疑无路，柳暗花明又一村。', source: '陆游《游山西村》' },
  { text: '晚来天欲雪，能饮一杯无？', source: '白居易《问刘十九》' },
  { text: '沉舟侧畔千帆过，病树前头万木春。', source: '刘禹锡《酬乐天》' },
  { text: '春风得意马蹄疾，一日看尽长安花。', source: '孟郊《登科后》' },
  { text: '海内存知己，天涯若比邻。', source: '王勃《送杜少府之任蜀州》' },
  { text: '人生代代无穷已，江月年年望相似。', source: '张若虚《春江花月夜》' },
]

/** 按日期轮换的一句；offset 用于「点一下换一句」 */
export function quoteOfDay(offset = 0): Quote {
  const day = Math.floor(new Date().setHours(0, 0, 0, 0) / 86_400_000)
  return QUOTES[(day + offset) % QUOTES.length]
}

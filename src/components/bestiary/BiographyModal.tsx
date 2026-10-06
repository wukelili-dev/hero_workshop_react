/**
 * BiographyModal — 影神图式传记弹窗（仿《黑神话·悟空》影神图构图）
 *
 * 左栏：金色楷体妖名 → 韵文小赞 → 正文（楷体，可滚动）→ 底部「收起」
 * 右栏：做旧宣纸画卷（CSS 渐变 + SVG 纸纹噪点）+ 妖物图 + 竖排题款 + 朱红印章
 * 全部用 ink 令牌 / 内联样式 / 内联 SVG，不引入任何外部素材。
 */
import * as Dialog from '@radix-ui/react-dialog';
import type { Monster } from '../../types';
import { biographyOf } from '../../data/biographies';
import { relicOf } from '../../data/relics';

/** 宣纸做旧底：纸纹噪点（内联 SVG feTurbulence）叠宣纸渐变 */
const PAPER_BG: React.CSSProperties = {
  backgroundImage: [
    // 纸纹噪点（最上层，极淡）
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/%3E%3CfeColorMatrix values='0 0 0 0 0.38 0 0 0 0 0.30 0 0 0 0 0.18 0 0 0 0.08 0'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)'/%3E%3C/svg%3E\")",
    // 高光
    'radial-gradient(ellipse at 28% 20%, rgba(255,250,232,0.60), transparent 55%)',
    // 陈渍
    'radial-gradient(ellipse at 78% 88%, rgba(118,88,48,0.20), transparent 60%)',
    // 底色
    'linear-gradient(155deg, #efe6cd 0%, #e6d9b8 42%, #dccca4 74%, #d0bd90 100%)',
  ].join(', '),
};

/** 弹窗暗底：深褐墨色晕染 */
const DARK_BG: React.CSSProperties = {
  background: 'radial-gradient(ellipse at 50% 36%, #463b2c 0%, #2c251c 52%, #16120c 100%)',
};

/** 墨点飞溅的随机排布（确定性，无 Math.random） */
const SPLATS = [
  { left: '12%', top: '68%', size: 26, opacity: 0.10 },
  { left: '20%', top: '78%', size: 14, opacity: 0.13 },
  { left: '70%', top: '74%', size: 34, opacity: 0.08 },
  { left: '80%', top: '30%', size: 16, opacity: 0.10 },
  { left: '30%', top: '22%', size: 12, opacity: 0.09 },
];

interface Props {
  monster: Monster | null;
  onClose: () => void;
  /** 无传记时兜底的正文（普通怪通用志文） */
  fallbackBody?: string[];
  /** 属性 + 掉落信息（普通怪图鉴展示） */
  stats?: { hp: number; atk: number; def: number } | null;
  drops?: Array<{ itemId: string; chance: number; quantity: [number, number] }>;
}

export function BiographyModal({ monster, onClose, fallbackBody, stats, drops }: Props) {
  const bio = monster ? biographyOf(monster.id) : undefined;
  const relic = monster ? relicOf(monster.relicId ?? '') : undefined;
  const icon = relic?.icon ?? monster?.icon ?? '👹';
  const sealChar = monster?.name?.[0] ?? '妖';
  const body = bio?.body ?? fallbackBody ?? [];
  const subtitle = monster?.chapter
    ? `${monster.chapter} · Lv.${monster.level ?? '?'}`
    : `Lv.${monster?.level ?? '?'}`;

  return (
    <Dialog.Root open={!!monster} onOpenChange={(o) => { if (!o) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40" style={{ background: 'rgba(10,8,5,0.72)' }} />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 flex -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-sm shadow-2xl md:flex-row"
          style={{ ...DARK_BG, width: 'min(980px, 94vw)', height: 'min(640px, 90vh)' }}
        >
          {/* ── 左栏：文名 ── */}
          <div className="flex min-h-0 flex-1 flex-col p-7 md:p-9" aria-label="传记">
            <Dialog.Title
              className="mb-1 text-[26px] tracking-[0.3em]"
              style={{ fontFamily: 'var(--font-kai)', color: '#cfa54e' }}
            >
              {monster?.name}
            </Dialog.Title>
            <div className="mb-3 text-xs tracking-widest" style={{ color: '#877b64' }}>
              {subtitle}{relic ? ` · 法宝 ${relic.name}` : ''}
            </div>

            {/* 属性 + 掉落（普通怪图鉴） */}
            {stats && (
              <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] tracking-wider" style={{ color: '#9a8d74' }}>
                <span>气血 <b style={{ color: '#cfa54e' }}>{stats.hp}</b></span>
                <span>攻击 <b style={{ color: '#cfa54e' }}>{stats.atk}</b></span>
                <span>防御 <b style={{ color: '#cfa54e' }}>{stats.def}</b></span>
                {drops && drops.length > 0 && (
                  <span>
                    掉落　{drops.map((d, i) => (
                      <span key={i}>{i > 0 ? '、' : ''}{d.itemId}{Math.round(d.chance * 100)}%</span>
                    ))}
                  </span>
                )}
              </div>
            )}

            {/* 韵文小赞 */}
            {bio?.verse && bio.verse.length > 0 && (
              <div className="mb-4 space-y-0.5 border-l-2 border-[#cfa54e]/30 pl-3">
                {bio.verse.map((line, i) => (
                  <div key={i} className="text-[13px] leading-6 tracking-wider" style={{ fontFamily: 'var(--font-kai)', color: '#9a8d74' }}>
                    {line}
                  </div>
                ))}
              </div>
            )}

            {/* 正文 */}
            <Dialog.Description className="min-h-0 flex-1 overflow-y-auto pr-2">
              <div className="space-y-3">
                {body.map((para, i) => (
                  <p
                    key={i}
                    className="indent-8 text-[15.5px] leading-8"
                    style={{ fontFamily: 'var(--font-kai)', color: '#e8e0cc' }}
                  >
                    {para}
                  </p>
                ))}
                {monster && body.length === 0 && (
                  <p className="text-sm italic" style={{ color: '#877b64' }}>此人传记尚在编纂中。</p>
                )}
              </div>
            </Dialog.Description>

            {/* 收起 */}
            <Dialog.Close asChild>
              <button
                type="button"
                className="mt-4 self-start text-sm tracking-widest transition-colors hover:text-[#e8e0cc]"
                style={{ color: '#9a8d74', fontFamily: 'var(--font-kai)' }}
              >
                ↩ 收起
              </button>
            </Dialog.Close>
          </div>

          {/* ── 右栏：宣纸画卷 ── */}
          <div className="relative shrink-0 p-5 md:w-[46%] md:p-7" aria-hidden="true">
            <div className="relative h-[240px] overflow-hidden rounded-[2px] shadow-[0_10px_40px_rgba(0,0,0,0.55)] md:h-full" style={PAPER_BG}>
              {/* 内框笔线 */}
              <div className="pointer-events-none absolute inset-3 border border-[#6b5a3e]/55" />
              <div className="pointer-events-none absolute inset-4 border border-[#6b5a3e]/25" />

              {/* 墨点飞溅 */}
              {SPLATS.map((s, i) => (
                <div
                  key={i}
                  className="pointer-events-none absolute rounded-full"
                  style={{
                    left: s.left, top: s.top, width: s.size, height: s.size,
                    background: '#4a4238', opacity: s.opacity, filter: 'blur(2px)',
                  }}
                />
              ))}

              {/* 竖排题款 */}
              <div
                className="absolute left-6 top-8 text-[13px] tracking-[0.45em]"
                style={{ fontFamily: 'var(--font-kai)', color: '#6b6252', writingMode: 'vertical-rl' }}
              >
                {monster?.name}
              </div>
              <div
                className="absolute left-11 top-8 text-[10px] tracking-[0.4em]"
                style={{ fontFamily: 'var(--font-kai)', color: '#8d8168', writingMode: 'vertical-rl' }}
              >
                {monster?.chapter ?? '西游记'}
              </div>

              {/* 妖物图（emoji 大图，做旧调和进宣纸） */}
              <div className="flex h-full items-center justify-center">
                <span
                  className="select-none text-[92px] md:text-[120px]"
                  style={{ filter: 'sepia(0.38) saturate(0.82) contrast(0.96)', textShadow: '2px 3px 6px rgba(90,70,40,0.25)' }}
                >
                  {icon}
                </span>
              </div>

              {/* 朱红印章 */}
              <div
                className="absolute bottom-6 right-7 flex h-10 w-10 items-center justify-center rounded-[3px] shadow-md"
                style={{ background: '#b5382f', boxShadow: '0 2px 8px rgba(120,30,20,0.4)' }}
              >
                <span className="text-[17px] leading-none text-[#f7f1e4]" style={{ fontFamily: 'var(--font-kai)' }}>
                  {sealChar}
                </span>
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

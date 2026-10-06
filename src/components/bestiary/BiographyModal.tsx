/**
 * BiographyModal — 影神图式传记弹窗（纯文字版，无右侧画卷）
 *
 * 深褐墨晕暗底；金色楷体妖名 → 韵文小赞（名角）/ 属性掉落（普通怪）→ 正文（楷体，可滚动）→ 底部「收起」。
 * 因暂无美术素材，右侧画卷区暂不加；待后续接入立绘/线稿再补。
 * 全部用 ink 令牌 / 内联样式，不引入任何外部素材。
 */
import * as Dialog from '@radix-ui/react-dialog';
import type { Monster } from '../../types';
import { biographyOf } from '../../data/biographies';
import { relicOf } from '../../data/relics';

/** 弹窗暗底：深褐墨色晕染 */
const DARK_BG: React.CSSProperties = {
  background: 'radial-gradient(ellipse at 50% 36%, #463b2c 0%, #2c251c 52%, #16120c 100%)',
};

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
  const body = bio?.body ?? fallbackBody ?? [];
  const subtitle = monster?.chapter
    ? `${monster.chapter} · Lv.${monster.level ?? '?'}`
    : `Lv.${monster?.level ?? '?'}`;

  return (
    <Dialog.Root open={!!monster} onOpenChange={(o) => { if (!o) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40" style={{ background: 'rgba(10,8,5,0.72)' }} />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 flex -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-sm shadow-2xl"
          style={{ ...DARK_BG, width: 'min(560px, 92vw)', maxHeight: 'min(640px, 88vh)' }}
        >
          {/* ── 文名 ── */}
          <div className="flex min-h-0 flex-col p-7 md:p-9" aria-label="传记">
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
            <Dialog.Description className="min-h-0 overflow-y-auto pr-2">
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
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

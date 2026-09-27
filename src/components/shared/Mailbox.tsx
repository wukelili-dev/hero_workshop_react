/**
 * Mailbox — 信箱（沉浸感 I4）
 * 水墨信笺样式：列出信件（发信人/日期/主题），点开读全文；可回信改变世界。
 */
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaEnvelope, FaEnvelopeOpen, FaXmark } from 'react-icons/fa6';
import { NPCS } from '../../data/npcs';
import { letterById } from '../../data/letters';
import { useWorldStore } from '../../store/useWorldStore';
import { markRead, replyLetter } from '../../engine/LetterSystem';
import type { LetterInstance } from '../../types';

export const Mailbox: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const letters = useWorldStore((s) => s.letters);
  const [openId, setOpenId] = useState<string | null>(null);
  const [reply, setReply] = useState<string | null>(null);

  const open = openId ? letters.find((l) => l.defId === openId) : null;
  const openDef = openId ? letterById(openId) : null;
  const from = openDef ? NPCS.find((n) => n.id === openDef.fromNpcId) : null;

  const openLetter = (l: LetterInstance) => {
    setOpenId(l.defId);
    setReply(null);
    markRead(l.defId);
  };

  const doReply = (optionId: string) => {
    if (!openId) return;
    const r = replyLetter(openId, optionId);
    setReply(r);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="ink-panel ink-frame flex max-h-[82vh] w-full max-w-md flex-col overflow-hidden text-[#3f3527]"
      >
        <div className="ink-head flex items-center px-4 py-3">
          <h3 className="ink-title text-[16px]">📬 信箱</h3>
          <span className="ink-tag ml-auto">{letters.filter((l) => !l.read).length} 封未读</span>
          <button type="button" onClick={onClose} className="ml-2 text-[#6b6252] hover:text-[#8f2b23]">
            <FaXmark />
          </button>
        </div>

        {!openId ? (
          <div className="flex-1 overflow-y-auto p-3">
            {letters.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#9c917b]">信箱空空如也。</div>
            ) : (
              <div className="space-y-2">
                {[...letters].reverse().map((l) => {
                  const def = letterById(l.defId);
                  const npc = NPCS.find((n) => n.id === l.fromNpcId);
                  return (
                    <button
                      key={l.defId}
                      type="button"
                      onClick={() => openLetter(l)}
                      className="flex w-full items-center gap-2 rounded-lg border border-[#8a7a63]/30 bg-[#fdfbf4] px-3 py-2 text-left hover:border-[#8a7a63]/60"
                    >
                      {l.read ? <FaEnvelopeOpen className="text-[#9c917b]" /> : <FaEnvelope className="text-[#b5382f]" />}
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-[#3f3527]">{def?.subject ?? '信'}</div>
                        <div className="text-[11px] text-[#6b6252]">
                          {npc?.avatarEmoji} {npc?.name ?? '神秘人'} · 第 {l.day} 天
                        </div>
                      </div>
                      {l.repliedOptionIds.length > 0 && <span className="text-[10px] text-[#4f7a8c]">已回</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4">
            <button type="button" onClick={() => setOpenId(null)} className="ink-btn mb-2 text-xs">
              ← 返回
            </button>
            <div className="rounded-lg border border-[#8a7a63]/30 bg-[#fdfbf4] p-4">
              <div className="mb-2 border-b border-[#8a7a63]/30 pb-2 text-xs text-[#6b6252]">
                {from?.avatarEmoji} {from?.name ?? '神秘人'} · 第 {open?.day} 天
              </div>
              {openDef?.body.map((para, i) => (
                <p key={i} className="mb-2 text-sm leading-relaxed text-[#3f3527]">{para}</p>
              ))}
            </div>

            {openDef?.options && openDef.options.length > 0 && (
              <div className="mt-3 space-y-2">
                <div className="ink-title text-[13px]">回信</div>
                {openDef.options.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => doReply(o.id)}
                    disabled={open?.repliedOptionIds.includes(o.id)}
                    className="ink-btn w-full text-left text-xs disabled:opacity-50"
                  >
                    {o.text}
                  </button>
                ))}
                {reply && <div className="rounded-lg bg-[#f3efe4] p-2 text-xs text-[#6b6252]">{reply}</div>}
              </div>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

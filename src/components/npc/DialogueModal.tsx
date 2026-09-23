/**
 * DialogueModal — 分支对话弹窗
 * 交谈时弹出：NPC 抛话 → 玩家选项 → NPC 回应（可连续多轮，触发彩蛋/改关系）
 */
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes } from 'react-icons/fa';
import { useGameStore } from '../../store/useGameStore';
import type { ChatTopic, DialogueOption, NpcDefinition } from '../../types';
import {
  pickTopic, resolveTopicOption, openTree, advanceTree, resolveIntel, type TreeSession,
} from '../../engine/DialogueSystem';

interface DialogueModalProps {
  npc: NpcDefinition;
  onClose: () => void;
}

interface Line {
  speaker: 'npc' | 'player';
  text: string;
  isEaster?: boolean;
}

export const DialogueModal: React.FC<DialogueModalProps> = ({ npc, onClose }) => {
  const addGameLog = useGameStore((s) => s.addGameLog);

  // 对话历史（气泡）
  const [history, setHistory] = useState<Line[]>([]);
  // 当前可选项
  const [options, setOptions] = useState<DialogueOption[]>([]);
  // 树会话（若当前在分支树内）
  const [treeSession, setTreeSession] = useState<TreeSession | null>(null);
  // 当前话题（若在闲聊话题内）
  const [topic, setTopic] = useState<ChatTopic | null>(null);
  const [ended, setEnded] = useState(false);

  // 开场：优先走分支树，否则走闲聊话题
  useEffect(() => {
    const tree = openTree(npc);
    if (tree) {
      setTreeSession(tree);
      const nodeText = Array.isArray(tree.node.text) ? tree.node.text[0] : tree.node.text;
      setHistory([{ speaker: 'npc', text: resolveIntel(npc, tree.node, nodeText) }]);
      setOptions(tree.node.options ?? []);
      return;
    }
    const t = pickTopic(npc);
    if (t) {
      setTopic(t.topic);
      const first = t.lines[Math.floor(Math.random() * t.lines.length)];
      setHistory([{ speaker: 'npc', text: first, isEaster: t.topic.isEaster }]);
      setOptions(t.options);
    } else {
      setHistory([{ speaker: 'npc', text: `${npc.name}没有多说什么。` }]);
      setEnded(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [npc.id]);

  const pickOption = (opt: DialogueOption) => {
    if (opt.locked) return;
    // 玩家气泡
    setHistory((h) => [...h, { speaker: 'player', text: opt.text }]);

    if (treeSession) {
      const res = advanceTree(npc, treeSession, opt.id);
      if (res.done) {
        res.replies.forEach((r) => setHistory((h) => [...h, { speaker: 'npc', text: r, isEaster: opt.isEaster }]));
        setOptions([]);
        setTreeSession(null);
        setEnded(true);
      } else {
        const s = res.session;
        if (res.replies.length) {
          res.replies.forEach((r) => setHistory((h) => [...h, { speaker: 'npc', text: r, isEaster: opt.isEaster }]));
        }
        if (s) {
          setTreeSession(s);
          const nodeText = Array.isArray(s.node.text) ? s.node.text[Math.floor(Math.random() * s.node.text.length)] : s.node.text;
          setHistory((h) => [...h, { speaker: 'npc', text: resolveIntel(npc, s.node, nodeText) }]);
          setOptions(s.node.options ?? []);
        } else {
          setOptions([]);
          setEnded(true);
        }
      }
      return;
    }

    if (topic) {
      const reply = resolveTopicOption(npc, topic, opt.id);
      if (reply) setHistory((h) => [...h, { speaker: 'npc', text: reply, isEaster: opt.isEaster }]);
      setOptions([]);
      setTopic(null);
      setEnded(true);
      return;
    }

    setEnded(true);
  };

  // 结束：写游戏日志（若有彩蛋标记）
  useEffect(() => {
    if (ended && history.some((h) => h.isEaster)) {
      addGameLog(`✨ 与${npc.name}的对话中似乎发生了什么……`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ended]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:w-[92vw] max-w-md max-h-[82vh] flex flex-col overflow-hidden"
        >
          {/* 头部 */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-purple-100">
            <div className="flex items-center gap-2">
              <span className="text-xl">{npc.avatarEmoji}</span>
              <div>
                <span className="font-bold text-gray-900">{npc.name}</span>
                <span className="text-xs text-gray-400 ml-1">· {npc.title}</span>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <FaTimes />
            </button>
          </div>

          {/* 对话气泡区 */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/60">
            {history.map((line, i) => (
              <div key={i} className={`flex ${line.speaker === 'player' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                    line.speaker === 'player'
                      ? 'bg-blue-500 text-white rounded-br-sm'
                      : line.isEaster
                        ? 'bg-gradient-to-r from-amber-50 to-orange-50 text-amber-900 border border-amber-200 rounded-bl-sm'
                        : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm'
                  }`}
                >
                  {line.isEaster && <div className="text-[10px] text-amber-500 mb-0.5">✨ 彩蛋</div>}
                  {line.text}
                </div>
              </div>
            ))}
          </div>

          {/* 选项区 */}
          <div className="px-4 py-3 border-t border-gray-100 bg-white space-y-2">
            {options.length > 0 ? (
              options.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => pickOption(opt)}
                  disabled={opt.locked}
                  className={`w-full text-left px-3 py-2.5 rounded-xl border text-sm transition-all ${
                    opt.locked
                      ? 'bg-gray-100 text-gray-400 border-gray-100 cursor-not-allowed'
                      : opt.isEaster
                        ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                  }`}
                >
                  <span className="block">{opt.locked ? (opt.lockedHint ?? '条件未满足') : opt.text}</span>
                  {opt.hint && !opt.locked && (
                    <span className="block text-[11px] text-gray-400 mt-0.5">{opt.hint}</span>
                  )}
                </button>
              ))
            ) : (
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-gray-100 text-gray-600 text-sm hover:bg-gray-200 transition-colors"
              >
                {ended ? '离开' : '……'}
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

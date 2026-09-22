/** 离线结算面板：回来时告诉你"你不在的时候发生了什么" */
import React from 'react';
import { formatOffline, type OfflineReport } from '../../engine/OfflineReport';

interface Props {
  report: OfflineReport;
  onClaim: () => void;
  onSkip: () => void;
}

const RES_NAME: Record<string, string> = {
  wood: '木材', iron: '铁矿', hide: '皮革', stone: '石头', herb: '药草',
};

export const OfflineModal: React.FC<Props> = ({ report, onClaim, onSkip }) => {
  const mats = Object.entries(report.materials).filter(([, v]) => v > 0);
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#3f3527]/45 p-4">
      <div className="ink-panel ink-frame w-full max-w-md p-5">
        <div className="ink-head mb-3 pb-2">
          <h3 className="ink-title text-lg">你不在的时候</h3>
          <span className="ink-tag ml-auto">{formatOffline(report.ms)}</span>
        </div>

        <div className="space-y-1 text-sm leading-relaxed text-[#3f3527]">
          <div>这段时间你在 <b>{report.placeName}</b> 挂机。</div>
          {report.autoBattle ? (
            <div>
              自动战斗打了 <b>{report.battles}</b> 场，带回{' '}
              <b className="text-[#8a6b2a]">{report.exp}</b> 经验、<b className="text-[#8a6b2a]">{report.gold}</b> 金币。
            </div>
          ) : (
            <div className="text-[#9c917b]">自动战斗没开着，所以这趟没打怪（只推进了时间）。</div>
          )}
          {report.risky && <div className="text-[#8f2b23]">此地的妖怪你多半打不过，收益已按四成折算。</div>}
          {mats.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {mats.map(([k, v]) => (
                <span key={k} className="ink-tag">{RES_NAME[k] ?? k} ×{v}</span>
              ))}
            </div>
          )}
          <div className="mt-2 border-l-2 border-[#8a7a63]/50 pl-2 text-xs text-[#6b6252]">
            时间推进：{Math.floor(report.days)} 天（世界会继续走，NPC 也在做事）。
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button className="ink-btn text-sm" onClick={onSkip}>先不收</button>
          <button className="ink-btn-seal text-sm" onClick={onClaim}>收下</button>
        </div>
      </div>
    </div>
  );
};

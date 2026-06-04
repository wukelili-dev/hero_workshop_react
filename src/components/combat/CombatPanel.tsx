import React from 'react';
import { useCombatStore } from '../../store/useCombatStore';
import { ProgressBar } from '../shared/ProgressBar';
import { RarityBadge } from '../shared/RarityBadge';

/**
 * CombatPanel — Standalone combat view (unused in current layout; combat is in MainCityPanel)
 * This is a placeholder for potential future use.
 */
export const CombatPanel: React.FC = () => {
  const currentEnemy = useCombatStore((s) => s.currentEnemy);
  const currentEnemyHp = useCombatStore((s) => s.currentEnemyHp);
  const isBattling = useCombatStore((s) => s.isBattling);
  const battleLogs = useCombatStore((s) => s.battleLogs);

  return (
    <div className="text-center py-8 text-amber-200/30">
      战斗功能已整合至左侧面板
    </div>
  );
};

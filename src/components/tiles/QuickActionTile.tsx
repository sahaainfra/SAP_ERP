/**
 * Part 01 — Quick Action Tile
 * 
 * Renders quick action buttons for common tasks. Each action is
 * permission-filtered — users only see actions they can perform.
 */

import React from 'react';
import type { TileDefinition } from '../../types/workspace';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { usePermission } from '../../contexts/PermissionContext';
import {
  PackagePlus,
  FilePlus,
  ClipboardCheck,
  ClipboardList,
  Plus,
} from 'lucide-react';

interface QuickActionTileProps {
  tile: TileDefinition;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  'package-plus': <PackagePlus size={18} />,
  'file-plus': <FilePlus size={18} />,
  'clipboard-check': <ClipboardCheck size={18} />,
  'clipboard-list': <ClipboardList size={18} />,
};

export function QuickActionTile({ tile }: QuickActionTileProps) {
  const { getQuickActions } = useWorkspace();
  const { hasPermission } = usePermission();

  if (!hasPermission(tile.permissionKey)) return null;

  const actions = getQuickActions(tile.id);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <h3 className="text-sm font-semibold text-slate-800 mb-3">{tile.title}</h3>
      
      {actions.length === 0 ? (
        <p className="text-xs text-slate-500">No quick actions available</p>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {actions.map(action => (
            <button
              key={action.id}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                action.variant === 'primary'
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                  : action.variant === 'danger'
                  ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {ICON_MAP[action.icon] ?? <Plus size={18} />}
              <span className="truncate">{action.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

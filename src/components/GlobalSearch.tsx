/**
 * Global Search - Part 2
 * 
 * Features:
 * - Full-screen overlay search
 * - Keyboard-first (Ctrl/Cmd+K)
 * - Grouped results by type
 * - Recent searches
 * - Query operators support
 */

import { useState, useEffect, useRef } from 'react';
import { Search, X, ArrowRight, Clock, FileText, FolderKanban, Users, Package, AlertTriangle } from 'lucide-react';
import { projects, tasks, approvals } from '../data/mockData';

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (route: string) => void;
}

interface SearchResult {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  route: string;
  icon: React.ReactNode;
  status?: string;
}

export default function GlobalSearch({ isOpen, onClose, onNavigate }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const recentSearches = [
    'PO-2026-000123',
    'Metro Line Extension',
    'Steel reinforcement',
    'Safety incident report',
  ];

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
    if (!isOpen) {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K to open
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (!isOpen) {
          // Trigger open - parent handles this
        }
      }
      // Escape to close
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Generate results based on query
  const results: SearchResult[] = query.length >= 2 ? [
    // Projects
    ...projects
      .filter(p => p.name.toLowerCase().includes(query.toLowerCase()) || p.code.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 3)
      .map(p => ({
        id: p.id,
        type: 'Project',
        title: p.name,
        subtitle: `${p.code} • ${p.client} • ${p.progress}% complete`,
        route: '/projects',
        icon: <FolderKanban size={16} style={{ color: 'var(--sapAccentColor6)' }} />,
        status: p.status,
      })),
    // Tasks
    ...tasks
      .filter(t => t.title.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 3)
      .map(t => ({
        id: t.id,
        type: 'Task',
        title: t.title,
        subtitle: `${t.assignee} • Due: ${t.dueDate}`,
        route: '/tasks',
        icon: <FileText size={16} style={{ color: 'var(--sapAccentColor1)' }} />,
        status: t.status,
      })),
    // Approvals
    ...approvals
      .filter(a => a.title.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 2)
      .map(a => ({
        id: a.id,
        type: 'Approval',
        title: a.title,
        subtitle: `${a.requester} • $${(a.amount / 1000000).toFixed(1)}M`,
        route: '/approvals',
        icon: <AlertTriangle size={16} style={{ color: 'var(--sapAccentColor2)' }} />,
        status: a.status,
      })),
  ] : [];

  // Group results by type
  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) acc[result.type] = [];
    acc[result.type].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  const allResults = Object.values(groupedResults).flat();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, allResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && allResults[selectedIndex]) {
      e.preventDefault();
      onNavigate(allResults[selectedIndex].route);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Search Modal */}
      <div 
        className="fixed top-20 left-1/2 -translate-x-1/2 z-[101] w-full max-w-2xl"
        style={{
          background: 'var(--sapTile_Background)',
          borderRadius: 'var(--sapElement_BorderCornerRadius)',
          boxShadow: 'var(--sapContent_Shadow3)',
          border: '1px solid var(--sapGroup_ContentBorderColor)',
        }}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: 'var(--sapList_BorderColor)' }}>
          <Search size={20} style={{ color: 'var(--sapContent_IconColor)' }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
            onKeyDown={handleKeyDown}
            placeholder="Search projects, documents, tasks..."
            className="flex-1 bg-transparent outline-none text-base"
            style={{ color: 'var(--sapField_TextColor)' }}
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 rounded hover:bg-[var(--sapHoverColor)]">
              <X size={16} />
            </button>
          )}
          <kbd className="px-2 py-0.5 text-xs rounded" 
            style={{ background: 'var(--sapBaseColor)', color: 'var(--sapContent_LabelColor)' }}>
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {query.length < 2 ? (
            // Recent searches
            <div className="p-4">
              <div className="text-xs font-semibold uppercase tracking-wider mb-3" 
                style={{ color: 'var(--sapContent_LabelColor)' }}>
                Recent Searches
              </div>
              {recentSearches.map((search, i) => (
                <button
                  key={i}
                  onClick={() => setQuery(search)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-[var(--sapList_Hover_Background)] transition-colors text-left"
                >
                  <Clock size={14} style={{ color: 'var(--sapContent_NonInteractiveIconColor)' }} />
                  <span className="text-sm" style={{ color: 'var(--sapList_TextColor)' }}>{search}</span>
                </button>
              ))}
              
              <div className="text-xs font-semibold uppercase tracking-wider mb-3 mt-6" 
                style={{ color: 'var(--sapContent_LabelColor)' }}>
                Quick Actions
              </div>
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-[var(--sapList_Hover_Background)] transition-colors text-left">
                <FileText size={14} style={{ color: 'var(--sapAccentColor5)' }} />
                <span className="text-sm" style={{ color: 'var(--sapList_TextColor)' }}>Create Purchase Requisition</span>
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-[var(--sapList_Hover_Background)] transition-colors text-left">
                <FolderKanban size={14} style={{ color: 'var(--sapAccentColor6)' }} />
                <span className="text-sm" style={{ color: 'var(--sapList_TextColor)' }}>Create New Project</span>
              </button>
            </div>
          ) : allResults.length > 0 ? (
            // Search results
            <div className="p-2">
              {Object.entries(groupedResults).map(([type, items]) => (
                <div key={type} className="mb-3">
                  <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider" 
                    style={{ color: 'var(--sapContent_LabelColor)' }}>
                    {type}s ({items.length})
                  </div>
                  {items.map((result, i) => {
                    const globalIndex = allResults.indexOf(result);
                    return (
                      <button
                        key={result.id}
                        onClick={() => { onNavigate(result.route); onClose(); }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-left ${
                          globalIndex === selectedIndex ? 'bg-[var(--sapList_SelectionBackgroundColor)]' : 'hover:bg-[var(--sapList_Hover_Background)]'
                        }`}
                      >
                        <div className="p-1.5 rounded" style={{ background: 'var(--sapBaseColor)' }}>
                          {result.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate" style={{ color: 'var(--sapList_TextColor)' }}>
                            {result.title}
                          </div>
                          <div className="text-xs truncate" style={{ color: 'var(--sapContent_LabelColor)' }}>
                            {result.subtitle}
                          </div>
                        </div>
                        {result.status && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                            result.status === 'active' || result.status === 'approved' || result.status === 'completed'
                              ? 'bg-[var(--sapSuccessBackground)] text-[var(--sapPositiveTextColor)]'
                              : result.status === 'pending' || result.status === 'in-progress'
                              ? 'bg-[var(--sapWarningBackground)] text-[var(--sapCriticalTextColor)]'
                              : 'bg-[var(--sapErrorBackground)] text-[var(--sapNegativeTextColor)]'
                          }`}>
                            {result.status}
                          </span>
                        )}
                        <ArrowRight size={14} style={{ color: 'var(--sapContent_NonInteractiveIconColor)' }} />
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <Search size={32} className="mx-auto mb-3" style={{ color: 'var(--sapContent_NonInteractiveIconColor)' }} />
              <p className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>
                No results found for "{query}"
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t flex items-center justify-between text-xs" 
          style={{ borderColor: 'var(--sapList_BorderColor)', color: 'var(--sapContent_LabelColor)' }}>
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Open</span>
            <span>esc Close</span>
          </div>
          <span>
            {allResults.length > 0 && `${allResults.length} results`}
          </span>
        </div>
      </div>
    </>
  );
}

/**
 * Part 16 — Global Search Component
 * 
 * Permission-filtered global search with:
 * - Multi-type search across all object types
 * - Query syntax (type:, status:, project:, etc.)
 * - Recent searches
 * - Keyboard-first (Ctrl+K)
 * - No existence leak
 */

import React, { useState, useEffect, useRef } from 'react';
import { SearchResult, SearchResponse, RecentSearch } from '../../platform/shell/types';
import { searchService } from '../../platform/shell/search-service';

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (route: string) => void;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      loadRecentSearches();
    } else {
      setQuery('');
      setResults(null);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      if (query.length >= 2) {
        performSearch(query);
      } else {
        setResults(null);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const loadRecentSearches = async () => {
    const recent = await searchService.getRecentSearches();
    setRecentSearches(recent);
  };

  const performSearch = async (term: string) => {
    setIsSearching(true);
    try {
      const response = await searchService.search({ term, limit: 50 });
      setResults(response);
      setSelectedIndex(0);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelect = async (result: SearchResult) => {
    await searchService.recordSearch(query, result.objectType, result.objectId);
    onNavigate(result.route);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const allResults = results?.results || [];
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, allResults.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (allResults[selectedIndex]) {
          handleSelect(allResults[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  };

  const getStatusColor = (status?: string): string => {
    if (!status) return 'bg-gray-100 text-gray-700';
    switch (status.toUpperCase()) {
      case 'ACTIVE':
      case 'APPROVED':
      case 'POSTED':
      case 'RELEASED':
        return 'bg-green-100 text-green-700';
      case 'PENDING':
      case 'SUBMITTED':
        return 'bg-yellow-100 text-yellow-700';
      case 'REJECTED':
      case 'CANCELLED':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Search modal */}
      <div className="fixed inset-x-0 top-20 z-50 max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-2xl overflow-hidden">
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-gray-400">
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search projects, documents, vendors, employees... (type:po status:pending project:Metro)"
              className="flex-1 text-base outline-none"
              aria-label="Global search"
            />
            {isSearching && (
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            )}
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-gray-100"
              aria-label="Close search"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </button>
          </div>

          {/* Results */}
          <div className="max-h-96 overflow-y-auto">
            {query.length < 2 && recentSearches.length > 0 && (
              <div className="p-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                  Recent Searches
                </h3>
                <div className="space-y-1">
                  {recentSearches.slice(0, 5).map((recent) => (
                    <button
                      key={recent.id}
                      onClick={() => setQuery(recent.searchTerm)}
                      className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-left hover:bg-gray-50 rounded"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-gray-400">
                        <path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z" />
                      </svg>
                      <span>{recent.searchTerm}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {results && results.results.length === 0 && query.length >= 2 && (
              <div className="p-8 text-center text-gray-500">
                No results found for "{query}"
              </div>
            )}

            {results && results.groups.map((group) => (
              <div key={group.objectType} className="border-b last:border-b-0">
                <div className="px-4 py-2 bg-gray-50 flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-gray-700 uppercase">
                    {group.objectType.replace('_', ' ')}s
                  </h3>
                  <span className="text-xs text-gray-500">
                    {group.totalCount} result{group.totalCount !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="divide-y">
                  {group.results.map((result, idx) => {
                    const globalIdx = results.results.indexOf(result);
                    return (
                      <button
                        key={`${result.objectType}-${result.objectId}`}
                        onClick={() => handleSelect(result)}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-blue-50 transition-colors ${
                          globalIdx === selectedIndex ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {result.primaryLine}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {result.secondaryLine}
                          </div>
                        </div>
                        {result.status && (
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(result.status)}`}>
                            {result.status}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 bg-gray-50 border-t text-xs text-gray-500 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span>↑↓ Navigate</span>
              <span>↵ Open</span>
              <span>Esc Close</span>
            </div>
            {results && (
              <span>
                {results.totalCount} results in {results.queryTime}ms
              </span>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

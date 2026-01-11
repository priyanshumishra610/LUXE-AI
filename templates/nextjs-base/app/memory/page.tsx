'use client';

import { useEffect, useState } from 'react';

interface AntiPattern {
  id: string;
  pattern: string;
  category: string | null;
  occurrences: number;
  severity: number | null;
  lastSeen: string;
  examples: string[];
}

interface ApprovalStats {
  total: number;
  approved: number;
  rejected: number;
}

export default function MemoryPage() {
  const [antiPatterns, setAntiPatterns] = useState<AntiPattern[]>([]);
  const [stats, setStats] = useState<ApprovalStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMemory();
  }, []);

  const fetchMemory = async () => {
    try {
      const [patternsRes, statsRes] = await Promise.all([
        fetch('/api/memory/anti-patterns'),
        fetch('/api/memory/stats'),
      ]);

      if (patternsRes.ok) {
        const patterns = await patternsRes.json();
        setAntiPatterns(patterns);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error('Failed to fetch memory:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white p-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-normal text-black mb-2">Memory</h1>
          <p className="text-sm text-gray-600">System judgment and learned patterns</p>
        </div>

        <nav className="mb-8 border-b border-gray-200">
          <div className="flex space-x-8">
            <a href="/inbox" className="text-sm text-gray-600 hover:text-black pb-2">
              Inbox
            </a>
            <a href="/approval" className="text-sm text-gray-600 hover:text-black pb-2">
              Approval
            </a>
            <a href="/memory" className="text-sm text-black border-b-2 border-black pb-2">
              Memory
            </a>
          </div>
        </nav>

        {stats && (
          <div className="mb-8 grid grid-cols-3 gap-4">
            <div className="border border-gray-200 rounded p-4">
              <p className="text-xs text-gray-600 mb-1">Total Decisions</p>
              <p className="text-2xl font-normal text-black">{stats.total}</p>
            </div>
            <div className="border border-gray-200 rounded p-4">
              <p className="text-xs text-gray-600 mb-1">Approved</p>
              <p className="text-2xl font-normal text-green-700">{stats.approved}</p>
            </div>
            <div className="border border-gray-200 rounded p-4">
              <p className="text-xs text-gray-600 mb-1">Rejected</p>
              <p className="text-2xl font-normal text-red-700">{stats.rejected}</p>
            </div>
          </div>
        )}

        <div className="mb-6">
          <h2 className="text-sm font-medium text-black mb-4">Anti-Patterns</h2>
          {antiPatterns.length === 0 ? (
            <p className="text-sm text-gray-600">No anti-patterns recorded</p>
          ) : (
            <div className="space-y-4">
              {antiPatterns.map((pattern) => (
                <div key={pattern.id} className="border border-gray-200 rounded p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm text-black font-medium">{pattern.pattern}</p>
                      {pattern.category && (
                        <p className="text-xs text-gray-500 mt-1">{pattern.category}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-600">
                        Seen {pattern.occurrences} time{pattern.occurrences !== 1 ? 's' : ''}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(pattern.lastSeen).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {pattern.examples.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs text-gray-600 mb-1">Examples:</p>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {pattern.examples.slice(0, 3).map((example, i) => (
                          <li key={i} className="line-clamp-1">• {example}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

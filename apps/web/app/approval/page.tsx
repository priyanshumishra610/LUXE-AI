'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Decision {
  id: string;
  projectId: string;
  approved: boolean;
  createdAt: string;
  critiqueResult: {
    overall: boolean;
    technical: { pass: boolean };
    taste: { pass: boolean };
  };
}

export default function ApprovalListPage() {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDecisions();
  }, []);

  const fetchDecisions = async () => {
    try {
      const response = await fetch('/api/decisions');
      if (response.ok) {
        const data = await response.json();
        setDecisions(data);
      }
    } catch (error) {
      console.error('Failed to fetch decisions:', error);
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
          <h1 className="text-2xl font-normal text-black mb-2">Approval History</h1>
          <p className="text-sm text-gray-600">All decisions and critiques</p>
        </div>

        <nav className="mb-8 border-b border-gray-200">
          <div className="flex space-x-8">
            <Link href="/inbox" className="text-sm text-gray-600 hover:text-black pb-2">
              Inbox
            </Link>
            <Link href="/approval" className="text-sm text-black border-b-2 border-black pb-2">
              Approval
            </Link>
            <Link href="/memory" className="text-sm text-gray-600 hover:text-black pb-2">
              Memory
            </Link>
          </div>
        </nav>

        {decisions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-gray-600">No decisions yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {decisions.map((decision) => (
              <Link
                key={decision.id}
                href={`/approval/${decision.id}`}
                className="block border border-gray-200 rounded p-4 hover:border-gray-400 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          decision.approved
                            ? 'text-green-700 bg-green-50'
                            : 'text-red-700 bg-red-50'
                        }`}
                      >
                        {decision.approved ? 'Approved' : 'Rejected'}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          decision.critiqueResult.overall
                            ? 'text-green-700 bg-green-50'
                            : 'text-red-700 bg-red-50'
                        }`}
                      >
                        {decision.critiqueResult.overall ? 'Passed' : 'Failed'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {new Date(decision.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

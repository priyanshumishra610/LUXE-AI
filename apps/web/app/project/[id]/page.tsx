'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Decision {
  id: string;
  type: string;
  approved: boolean;
  humanFeedback: string | null;
  createdAt: string;
  critiqueResult: any;
}

interface Project {
  id: string;
  intent: string;
  status: string;
  createdAt: string;
  decisions: Decision[];
}

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchProject(params.id as string);
    }
  }, [params.id]);

  const fetchProject = async (id: string) => {
    try {
      const response = await fetch(`/api/projects/${id}`);
      if (response.ok) {
        const data = await response.json();
        setProject(data);
      }
    } catch (error) {
      console.error('Failed to fetch project:', error);
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

  if (!project) {
    return (
      <div className="min-h-screen bg-white p-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-sm text-gray-600">Project not found</p>
        </div>
      </div>
    );
  }

  const latestDecision = project.decisions[0];

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto p-8">
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-sm text-gray-600 hover:text-black mb-4"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-normal text-black mb-2">Project</h1>
          <p className="text-sm text-gray-600 mb-1">{project.intent}</p>
          <p className="text-xs text-gray-500">
            {new Date(project.createdAt).toLocaleString()}
          </p>
        </div>

        <nav className="mb-8 border-b border-gray-200">
          <div className="flex space-x-8">
            <Link href="/inbox" className="text-sm text-gray-600 hover:text-black pb-2">
              Inbox
            </Link>
            <Link href="/approval" className="text-sm text-gray-600 hover:text-black pb-2">
              Approval
            </Link>
            <Link href="/memory" className="text-sm text-gray-600 hover:text-black pb-2">
              Memory
            </Link>
          </div>
        </nav>

        {latestDecision ? (
          <div className="space-y-6">
            <div className="border border-gray-200 rounded p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-medium text-black">Latest Decision</h2>
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    latestDecision.approved
                      ? 'text-green-700 bg-green-50'
                      : 'text-red-700 bg-red-50'
                  }`}
                >
                  {latestDecision.approved ? 'Approved' : 'Rejected'}
                </span>
              </div>
              {latestDecision.humanFeedback && (
                <p className="text-sm text-gray-700 mb-4">{latestDecision.humanFeedback}</p>
              )}
              <Link
                href={`/approval/${latestDecision.id}`}
                className="text-sm text-black hover:underline"
              >
                View full critique →
              </Link>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-sm text-gray-600">No decisions yet</p>
          </div>
        )}
      </div>
    </div>
  );
}

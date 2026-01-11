'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Project {
  id: string;
  intent: string;
  status: string;
  createdAt: string;
}

export default function InboxPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects');
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-green-700 bg-green-50';
      case 'rejected':
        return 'text-red-700 bg-red-50';
      case 'pending':
        return 'text-gray-700 bg-gray-50';
      default:
        return 'text-gray-700 bg-gray-50';
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
          <h1 className="text-2xl font-normal text-black mb-2">Project Inbox</h1>
          <p className="text-sm text-gray-600">Review and approve generated projects</p>
        </div>

        <nav className="mb-8 border-b border-gray-200">
          <div className="flex space-x-8">
            <Link href="/inbox" className="text-sm text-black border-b-2 border-black pb-2">
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

        {projects.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-gray-600">No projects yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/project/${project.id}`}
                className="block border border-gray-200 rounded p-4 hover:border-gray-400 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-black mb-1 line-clamp-2">{project.intent}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(project.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded ${getStatusColor(project.status)}`}
                  >
                    {project.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

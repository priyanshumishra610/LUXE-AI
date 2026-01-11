'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface CritiqueResult {
  technical: {
    pass: boolean;
    issues: string[];
  };
  taste: {
    pass: boolean;
    scores: {
      confidence: number;
      restraint: number;
      visualHierarchy: number;
      cognitiveCalm: number;
      brandSeriousness: number;
      signatureAlignment: number;
      copyClarity: boolean;
    };
    issues: string[];
    severity?: string;
  };
  overall: boolean;
}

interface Decision {
  id: string;
  projectId: string;
  type: string;
  plan: any;
  critiqueResult: CritiqueResult;
  approved: boolean;
  humanFeedback: string | null;
  createdAt: string;
}

export default function ApprovalPage() {
  const params = useParams();
  const router = useRouter();
  const [decision, setDecision] = useState<Decision | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchDecision(params.id as string);
    }
  }, [params.id]);

  const fetchDecision = async (id: string) => {
    try {
      const response = await fetch(`/api/decisions/${id}`);
      if (response.ok) {
        const data = await response.json();
        setDecision(data);
        setFeedback(data.humanFeedback || '');
      }
    } catch (error) {
      console.error('Failed to fetch decision:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    await submitDecision(true);
  };

  const handleReject = async () => {
    if (!feedback.trim()) {
      alert('Please provide feedback for rejection');
      return;
    }
    await submitDecision(false);
  };

  const submitDecision = async (approved: boolean) => {
    setSubmitting(true);
    try {
      const response = await fetch(`/api/decisions/${decision?.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approved,
          humanFeedback: feedback || null,
        }),
      });

      if (response.ok) {
        router.push('/inbox');
      }
    } catch (error) {
      console.error('Failed to submit decision:', error);
    } finally {
      setSubmitting(false);
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

  if (!decision) {
    return (
      <div className="min-h-screen bg-white p-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-sm text-gray-600">Decision not found</p>
        </div>
      </div>
    );
  }

  const { critiqueResult } = decision;
  const scores = critiqueResult.taste.scores;

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
          <h1 className="text-2xl font-normal text-black mb-2">Review Decision</h1>
          <p className="text-sm text-gray-600">
            {new Date(decision.createdAt).toLocaleString()}
          </p>
        </div>

        <div className="space-y-8">
          <div className="border border-gray-200 rounded p-6">
            <h2 className="text-sm font-medium text-black mb-4">Critique Results</h2>
            
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-700">Overall</span>
                  <span
                    className={`text-sm ${
                      critiqueResult.overall ? 'text-green-700' : 'text-red-700'
                    }`}
                  >
                    {critiqueResult.overall ? 'Pass' : 'Fail'}
                  </span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-700">Technical</span>
                  <span
                    className={`text-sm ${
                      critiqueResult.technical.pass ? 'text-green-700' : 'text-red-700'
                    }`}
                  >
                    {critiqueResult.technical.pass ? 'Pass' : 'Fail'}
                  </span>
                </div>
                {critiqueResult.technical.issues.length > 0 && (
                  <ul className="text-xs text-gray-600 mt-1 space-y-1">
                    {critiqueResult.technical.issues.map((issue, i) => (
                      <li key={i}>• {issue}</li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-700">Taste</span>
                  <span
                    className={`text-sm ${
                      critiqueResult.taste.pass ? 'text-green-700' : 'text-red-700'
                    }`}
                  >
                    {critiqueResult.taste.pass ? 'Pass' : 'Fail'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div>
                    <span className="text-xs text-gray-600">Confidence</span>
                    <span className="text-xs text-black ml-2">{scores.confidence}/10</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-600">Restraint</span>
                    <span className="text-xs text-black ml-2">{scores.restraint}/10</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-600">Visual Hierarchy</span>
                    <span className="text-xs text-black ml-2">{scores.visualHierarchy}/10</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-600">Cognitive Calm</span>
                    <span className="text-xs text-black ml-2">{scores.cognitiveCalm}/10</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-600">Brand Seriousness</span>
                    <span className="text-xs text-black ml-2">{scores.brandSeriousness}/10</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-600">Signature Alignment</span>
                    <span className="text-xs text-black ml-2">{scores.signatureAlignment}/10</span>
                  </div>
                </div>
                {critiqueResult.taste.issues.length > 0 && (
                  <ul className="text-xs text-gray-600 mt-3 space-y-1">
                    {critiqueResult.taste.issues.map((issue, i) => (
                      <li key={i}>• {issue}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          <div className="border border-gray-200 rounded p-6">
            <h2 className="text-sm font-medium text-black mb-4">Your Feedback</h2>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Add feedback..."
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-black resize-none"
              rows={4}
            />
          </div>

          <div className="flex space-x-4">
            <button
              onClick={handleApprove}
              disabled={submitting}
              className="flex-1 bg-black text-white py-2 px-4 rounded text-sm hover:bg-gray-900 disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Approve'}
            </button>
            <button
              onClick={handleReject}
              disabled={submitting}
              className="flex-1 bg-white text-black border border-gray-300 py-2 px-4 rounded text-sm hover:bg-gray-50 disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Reject'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

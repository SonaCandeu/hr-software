// src/pages/EmployeeDetailsPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import type { Employee, Rating, RatingCreate } from '../types/employee';

export function EmployeeDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useUser();

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  // Form State
  const [score, setScore] = useState<number>(4);
  const [feedback, setFeedback] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !currentUser) return;

    const targetId = parseInt(id, 10);

    // Block access immediately if user tries to open their own evaluation page
    if (currentUser.id === targetId) {
      setIsAuthorized(false);
      setLoading(false);
      return;
    }

    const checkAccessAndFetchData = async () => {
      try {
        setLoading(true);

        // 1. Fetch subordinate IDs managed by active leader
        const subRes = await fetch(`/api/employees/${currentUser.id}/subordinates`);
        if (!subRes.ok) {
          throw new Error('Failed to verify access permissions.');
        }
        const subordinateIds: number[] = await subRes.json();

        // 2. Validate if target employee is in reporting line
        const hasAccess = subordinateIds.includes(targetId);
        setIsAuthorized(hasAccess);

        if (!hasAccess) {
          setLoading(false);
          return;
        }

        // 3. Fetch employee details if authorized
        const empRes = await fetch(`/api/employees/${id}`);
        if (!empRes.ok) {
          throw new Error('Failed to fetch employee details.');
        }
        const data: Employee = await empRes.json();
        setEmployee(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
      } finally {
        setLoading(false);
      }
    };

    checkAccessAndFetchData();
  }, [id, currentUser]);

  // Handle submitting rating
  const handleSubmitRating = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      setSubmitError('Please select an active identity on the home page first.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    const payload: RatingCreate = {
      score,
      reviewer_name: currentUser.name,
      feedback: feedback.trim() ? feedback : undefined,
    };

    try {
      const res = await fetch(`/api/employees/${id}/ratings/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Reviewer-Id': currentUser.id.toString(),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Failed to submit rating.');
      }

      const newRating: Rating = await res.json();

      setEmployee((prev) =>
        prev
          ? {
              ...prev,
              ratings: [newRating, ...prev.ratings],
            }
          : null
      );

      setScore(4);
      setFeedback('');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-600">Verifying permissions and loading details...</div>;
  }

  // Access Denied Screen
  if (isAuthorized === false) {
    return (
      <div className="max-w-md mx-auto mt-12 p-6 bg-white border border-red-200 rounded-lg text-center shadow-sm">
        <h2 className="text-xl font-bold text-red-700 mb-2">Access Denied</h2>
        <p className="text-gray-600 text-sm mb-6">
          You are not authorized to view or rate this employee because they are not within your reporting hierarchy.
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-blue-600 text-white font-medium rounded hover:bg-blue-700 transition"
        >
          Back to Roster
        </button>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="p-8 text-center text-red-600">
        <p>{error || 'Employee not found.'}</p>
        <button
          onClick={() => navigate('/')}
          className="mt-4 px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 transition"
        >
          Back to Roster
        </button>
      </div>
    );
  }

  const totalRatings = employee.ratings.length;
  const averageScore =
    totalRatings > 0
      ? (employee.ratings.reduce((acc, r) => acc + r.score, 0) / totalRatings).toFixed(1)
      : 'N/A';

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate('/')}
          className="text-sm text-blue-600 hover:underline mb-4 inline-block font-medium"
        >
          &larr; Back to Employees
        </button>
        <div className="flex justify-between items-start border-b pb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{employee.name}</h1>
            <p className="text-gray-600 font-medium">{employee.position}</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-right">
            <span className="text-xs text-blue-800 font-medium block uppercase tracking-wider">
              Average Score
            </span>
            <span className="text-2xl font-bold text-blue-900">{averageScore} / 4.0</span>
            <span className="text-xs text-blue-600 block">({totalRatings} reviews)</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Rating Form */}
        <section className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm h-fit">
          <h2 className="text-xl font-semibold mb-2 text-gray-800">Submit a Rating</h2>

          <p className="text-sm text-gray-500 mb-4">
            Submitting as:{' '}
            <span className="font-semibold text-gray-800">
              {currentUser ? `${currentUser.name} (${currentUser.position})` : 'None Selected'}
            </span>
          </p>

          {submitError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded">
              {submitError}
            </div>
          )}

          <form onSubmit={handleSubmitRating} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Score: <span className="font-bold text-blue-600">{score} / 4</span>
              </label>
              <input
                type="range"
                min="1"
                max="4"
                step="1"
                value={score}
                onChange={(e) => setScore(parseInt(e.target.value, 10))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>1 (Unsatisfactory)</span>
                <span>2 (Needs Improv.)</span>
                <span>3 (Meets Expect.)</span>
                <span>4 (Exceeds)</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Feedback / Comments (Optional)
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={4}
                placeholder="Write constructive notes regarding recent achievements or areas of improvement..."
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-md transition duration-150 disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Rating'}
            </button>
          </form>
        </section>

        {/* Rating History */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-800">Rating History</h2>

          {employee.ratings.length === 0 ? (
            <p className="text-gray-500 text-sm italic">No ratings submitted yet.</p>
          ) : (
            employee.ratings.map((rating) => (
              <div
                key={rating.id}
                className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm space-y-2"
              >
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-900">{rating.reviewer_name}</span>
                  <span className="text-sm font-bold bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full">
                    Score: {rating.score} / 4
                  </span>
                </div>
                {rating.feedback && (
                  <p className="text-gray-700 text-sm bg-gray-50 p-2.5 rounded border border-gray-100 italic">
                    "{rating.feedback}"
                  </p>
                )}
                <span className="text-xs text-gray-400 block pt-1">
                  {new Date(rating.created_at).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
            ))
          )}
        </section>
      </div>
    </div>
  );
}
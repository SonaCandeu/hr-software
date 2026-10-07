// src/pages/HomePage.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import type { Employee } from '../types/employee';

export function HomePage() {
  const { currentUser, selectUser } = useUser();
  const navigate = useNavigate();

  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [subordinateIds, setSubordinateIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch all employees
  useEffect(() => {
    fetch('/api/employees')
      .then((res) => res.json())
      .then((data: Employee[]) => {
        setAllEmployees(data);
        setLoading(false);
      });
  }, []);

  // 2. Fetch subordinate IDs whenever active currentUser changes
  useEffect(() => {
    if (currentUser) {
      fetch(`/api/employees/${currentUser.id}/subordinates`)
        .then((res) => res.json())
        .then((ids: number[]) => setSubordinateIds(ids))
        .catch(() => setSubordinateIds([]));
    }
  }, [currentUser]);

  const handleUserChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = parseInt(e.target.value, 10);
    const selectedEmp = allEmployees.find((emp) => emp.id === selectedId);
    if (selectedEmp) {
      selectUser({
        id: selectedEmp.id,
        name: selectedEmp.name,
        position: selectedEmp.position,
      });
    }
  };

  return (
    <main className="max-w-5xl mx-auto p-6 space-y-6">
      {/* User Selection Banner */}
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-sm font-semibold text-blue-900 uppercase tracking-wider">Active Identity</h2>
          <p className="text-gray-700 text-sm">
            Currently acting as: <strong className="text-gray-900">{currentUser?.name}</strong> ({currentUser?.position})
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="user-select" className="text-sm font-medium text-gray-700">Switch User:</label>
          <select
            id="user-select"
            value={currentUser?.id || ''}
            onChange={handleUserChange}
            className="p-2 border rounded-md bg-white text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {allEmployees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name} — {emp.position}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Organization Roster</h1>
        <span className="text-xs text-gray-500">
          Showing {allEmployees.length} employees ({subordinateIds.length} in your reporting line)
        </span>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading roster...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allEmployees.map((emp) => {
            const isSelf = emp.id === currentUser?.id;
            const canRate = subordinateIds.includes(emp.id);

            return (
              <div
                key={emp.id}
                className={`p-5 rounded-lg border transition shadow-sm flex flex-col justify-between ${
                  isSelf
                    ? 'bg-gray-100 border-gray-300 opacity-75'
                    : canRate
                    ? 'bg-white border-green-300 ring-1 ring-green-200 hover:shadow-md'
                    : 'bg-white border-gray-200 opacity-60'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <h3 className="font-bold text-lg text-gray-900">{emp.name}</h3>
                    {isSelf ? (
                      <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded font-medium">You</span>
                    ) : canRate ? (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded font-semibold">Report</span>
                    ) : (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">Out of Line</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{emp.position}</p>
                </div>

                <div className="mt-4 pt-3 border-t flex justify-between items-center">
                  <button
                    onClick={() => navigate(`/employees/${emp.id}`)}
                    disabled={!canRate && !isSelf}
                    className={`text-sm font-medium px-3 py-1.5 rounded transition ${
                      canRate
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : isSelf
                        ? 'bg-gray-200 text-gray-600 cursor-not-allowed'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {canRate ? 'Rate Employee' : isSelf ? 'Cannot Rate Self' : 'Not Authorized'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
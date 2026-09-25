import { useEffect, useState } from 'react';
import HighlightSelector from '../components/HighlightSelector';

const TABS = ['Users', 'Regions', 'Categories', 'Highlights'];

function RoleSelect({ value, onChange, disabled }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="border border-gray-300 rounded-md px-2 py-1 text-sm disabled:opacity-50"
    >
      {['public', 'contributor', 'validator', 'admin'].map((r) => <option key={r} value={r}>{r}</option>)}
    </select>
  );
}

function UsersTab({ fetchUsers, updateUserRole }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUsers().then((data) => { setUsers(data || []); setLoading(false); });
  }, [fetchUsers]);

  async function handleRoleChange(userId, role) {
    setError(null);
    setSavingId(userId);
    try {
      const updated = await updateUserRole(userId, role);
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update this user.');
    } finally {
      setSavingId(null);
    }
  }

  if (loading) return <p className="text-sm text-gray-500">Loading users…</p>;

  return (
    <div>
      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[480px]">
          <thead>
            <tr className="text-left text-xs text-gray-500 uppercase tracking-wide border-b border-gray-200">
              <th className="py-2">Name</th>
              <th className="py-2">Email</th>
              <th className="py-2">Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-gray-100">
                <td className="py-2.5">{u.name}</td>
                <td className="py-2.5 text-gray-500">{u.email}</td>
                <td className="py-2.5">
                  <RoleSelect value={u.role} disabled={savingId === u.id} onChange={(role) => handleRoleChange(u.id, role)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RegionsTab({ fetchRegions, createRegion }) {
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', province: '' });
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRegions().then((data) => { setRegions(data || []); setLoading(false); });
  }, [fetchRegions]);

  async function handleAdd(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.province.trim()) {
      setError('Name and province are both required.');
      return;
    }
    setError(null);
    try {
      const region = await createRegion(form);
      setRegions((prev) => [...prev, region]);
      setForm({ name: '', province: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not add this region.');
    }
  }

  if (loading) return <p className="text-sm text-gray-500">Loading regions…</p>;

  return (
    <div>
      <form onSubmit={handleAdd} className="flex gap-2 mb-6">
        <input
          type="text" placeholder="Region name" value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          className="border border-gray-300 rounded-md px-3 py-1.5 text-sm flex-1"
        />
        <input
          type="text" placeholder="Province" value={form.province}
          onChange={(e) => setForm((f) => ({ ...f, province: e.target.value }))}
          className="border border-gray-300 rounded-md px-3 py-1.5 text-sm flex-1"
        />
        <button type="submit" className="px-3 py-1.5 bg-blue-900 text-white text-sm rounded-md hover:bg-blue-800">Add</button>
      </form>
      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
      <ul className="space-y-1.5">
        {regions.map((r) => (
          <li key={r.id} className="text-sm text-gray-700">{r.name} <span className="text-gray-400">— {r.province}</span></li>
        ))}
      </ul>
    </div>
  );
}

function CategoriesTab({ fetchCategories, createCategory }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCategories().then((data) => { setCategories(data || []); setLoading(false); });
  }, [fetchCategories]);

  async function handleAdd(e) {
    e.preventDefault();
    if (!name.trim()) { setError('Name is required.'); return; }
    setError(null);
    try {
      const category = await createCategory({ name });
      setCategories((prev) => [...prev, category]);
      setName('');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not add this category.');
    }
  }

  if (loading) return <p className="text-sm text-gray-500">Loading categories…</p>;

  return (
    <div>
      <form onSubmit={handleAdd} className="flex gap-2 mb-6">
        <input
          type="text" placeholder="Category name" value={name}
          onChange={(e) => setName(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-1.5 text-sm flex-1"
        />
        <button type="submit" className="px-3 py-1.5 bg-blue-900 text-white text-sm rounded-md hover:bg-blue-800">Add</button>
      </form>
      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
      <ul className="space-y-1.5">
        {categories.map((c) => (
          <li key={c.id} className="text-sm text-gray-700">
            {c.name}
            {c.fields?.length > 0 && <span className="text-gray-400"> — {c.fields.length} field{c.fields.length === 1 ? '' : 's'}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}

function HighlightsTab({ searchEntries, createHighlight }) {
  return (
    <div className="max-w-md">
      <HighlightSelector searchEntries={searchEntries} createHighlight={createHighlight} />
    </div>
  );
}

export default function AdminDashboardPage({
  fetchUsers = async () => [],
  updateUserRole = async (id, role) => ({ id, role }),
  fetchRegions = async () => [],
  createRegion = async (data) => ({ id: Date.now(), ...data }),
  fetchCategories = async () => [],
  createCategory = async (data) => ({ id: Date.now(), ...data, fields: [] }),
  searchEntries = async () => [],                                   
  createHighlight = async (data) => ({ id: Date.now(), ...data }),
}) {
  const [tab, setTab] = useState('Users');

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Administration</h1>

      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              tab === t ? 'border-blue-900 text-blue-900' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Users' && <UsersTab fetchUsers={fetchUsers} updateUserRole={updateUserRole} />}
      {tab === 'Regions' && <RegionsTab fetchRegions={fetchRegions} createRegion={createRegion} />}
      {tab === 'Categories' && <CategoriesTab fetchCategories={fetchCategories} createCategory={createCategory} />}
      {tab === 'Highlights' && <HighlightsTab searchEntries={searchEntries} createHighlight={createHighlight} />}
    </div>
  );
}
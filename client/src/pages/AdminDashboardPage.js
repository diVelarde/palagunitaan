import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import HighlightSelector from '../components/HighlightSelector';
import ProfilePanel from '../components/ProfilePanel';
import AuditLogPage from './AuditLogPage';

const TABS = ['Platform Overview', 'Manage Users', 'Categories & Regions', 'Heritage Sites', 'Audit Log', 'Highlights'];

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
    fetchUsers()
      .then((data) => setUsers(data || []))
      .catch((err) => setError(err.response?.data?.message || 'Could not load users.'))
      .finally(() => setLoading(false));
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
      {error && <p className="dashboard-error" role="alert">{error}</p>}
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

function RegionsTab({ fetchRegions, createRegion, deleteRegion }) {
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', province: '' });
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchRegions()
      .then((data) => setRegions(data || []))
      .catch((err) => setError(err.response?.data?.message || 'Could not load regions.'))
      .finally(() => setLoading(false));
  }, [fetchRegions]);

  async function handleAdd(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.province.trim()) {
      setError('Name and province are both required.');
      return;
    }
    setError(null);
    setAdding(true);
    try {
      const region = await createRegion(form);
      setRegions((prev) => [...prev, region]);
      setForm({ name: '', province: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not add this region.');
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(region) {
    setError(null);
    setBusyId(region.id);
    try {
      await deleteRegion(region.id);
      setRegions((prev) => prev.filter((item) => item.id !== region.id));
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete this region.');
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <p className="text-sm text-gray-500">Loading regions…</p>;

  return (
    <div className="dashboard-admin-content-list">
      {error && <p className="dashboard-error" role="alert">{error}</p>}
      <ul className="dashboard-admin-manage-list">
        {regions.map((r) => (
          <li key={r.id}>
            <span>{r.name}{r.province ? `, ${r.province}` : ''}</span>
            <button type="button" onClick={() => handleDelete(r)} disabled={busyId === r.id} className="dashboard-admin-delete">
              {busyId === r.id ? 'Deleting…' : 'Delete'}
            </button>
          </li>
        ))}
      </ul>
      <form onSubmit={handleAdd} className="dashboard-admin-add-form dashboard-admin-region-form">
        <input
          type="text" placeholder="New region" value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          aria-label="New region name"
          className="dashboard-admin-input"
        />
        <input
          type="text" placeholder="Province" value={form.province}
          onChange={(e) => setForm((f) => ({ ...f, province: e.target.value }))}
          aria-label="Province"
          className="dashboard-admin-input"
        />
        <button type="submit" disabled={adding} className="dashboard-action-link dashboard-action-primary">
          {adding ? 'Adding…' : 'Add'}
        </button>
      </form>
    </div>
  );
}

function CategoriesTab({ fetchCategories, createCategory, deleteCategory }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchCategories()
      .then((data) => setCategories(data || []))
      .catch((err) => setError(err.response?.data?.message || 'Could not load categories.'))
      .finally(() => setLoading(false));
  }, [fetchCategories]);

  async function handleAdd(e) {
    e.preventDefault();
    if (!name.trim()) { setError('Name is required.'); return; }
    setError(null);
    setAdding(true);
    try {
      const category = await createCategory({ name });
      setCategories((prev) => [...prev, category]);
      setName('');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not add this category.');
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(category) {
    setError(null);
    setBusyId(category.id);
    try {
      await deleteCategory(category.id);
      setCategories((prev) => prev.filter((item) => item.id !== category.id));
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete this category.');
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <p className="text-sm text-gray-500">Loading categories…</p>;

  return (
    <div className="dashboard-admin-content-list">
      {error && <p className="dashboard-error" role="alert">{error}</p>}
      <ul className="dashboard-admin-manage-list">
        {categories.map((c) => (
          <li key={c.id}>
            <span>
              {c.name}
              {c.fields?.length > 0 && <small>{c.fields.length} field{c.fields.length === 1 ? '' : 's'}</small>}
            </span>
            <button type="button" onClick={() => handleDelete(c)} disabled={busyId === c.id} className="dashboard-admin-delete">
              {busyId === c.id ? 'Deleting…' : 'Delete'}
            </button>
          </li>
        ))}
      </ul>
      <form onSubmit={handleAdd} className="dashboard-admin-add-form">
        <input
          type="text" placeholder="New category" value={name}
          onChange={(e) => setName(e.target.value)}
          aria-label="New category name"
          className="dashboard-admin-input"
        />
        <button type="submit" disabled={adding} className="dashboard-action-link dashboard-action-primary">
          {adding ? 'Adding…' : 'Add'}
        </button>
      </form>
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

function PlatformOverviewTab({
  fetchUsers,
  fetchEntries,
  fetchPending,
  fetchPosts,
  fetchSites,
  onOpenAuditLog,
}) {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.allSettled([
      fetchUsers(),
      fetchEntries({ limit: 50 }),
      fetchPending(),
      fetchPosts({ limit: 50 }),
      fetchSites(),
    ]).then((results) => {
      if (!active) return;
      const names = ['users', 'entries', 'pending reviews', 'blog posts', 'heritage sites'];
      const nextStats = {};
      const failures = [];
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') nextStats[names[index]] = result.value?.length || 0;
        else failures.push(names[index]);
      });
      setStats(nextStats);
      if (failures.length) setError(`Some overview totals could not be loaded: ${failures.join(', ')}.`);
    });
    return () => {
      active = false;
    };
  }, [fetchUsers, fetchEntries, fetchPending, fetchPosts, fetchSites]);

  const cards = [
    ['Heritage Entries', stats?.entries],
    ['Pending Review', stats?.['pending reviews']],
    ['Users', stats?.users],
    ['Blog Posts', stats?.['blog posts']],
    ['Heritage Sites', stats?.['heritage sites']],
  ];

  return (
    <div className="dashboard-admin-panel">
      <h2>Platform Overview</h2>
      <p>A snapshot of the archive and community.</p>
      {error && <p className="dashboard-error" role="status">{error}</p>}
      <div className="dashboard-admin-stats">
        {cards.map(([label, value]) => (
          <div key={label} className="dashboard-stat">
            <span>{label}</span>
            <strong>{value === undefined ? '—' : value}</strong>
          </div>
        ))}
      </div>
      <div className="dashboard-quick-links">
        <button type="button" onClick={onOpenAuditLog} className="dashboard-action-link">
          Open audit log →
        </button>
        <Link to="/map" className="dashboard-action-link">View heritage map →</Link>
      </div>
    </div>
  );
}

function HeritageSitesTab({ fetchSites, createSite, deleteSite }) {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', description: '', latitude: '', longitude: '' });
  const [adding, setAdding] = useState(false);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    let active = true;
    fetchSites()
      .then((data) => { if (active) setSites(data || []); })
      .catch((err) => { if (active) setError(err.response?.data?.message || 'Could not load heritage sites.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [fetchSites]);

  async function handleAdd(event) {
    event.preventDefault();
    const latitude = Number(form.latitude);
    const longitude = Number(form.longitude);
    if (!form.name.trim()) {
      setError('Site name is required.');
      return;
    }
    if (form.latitude === '' || !Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
      setError('Enter a valid latitude between -90 and 90.');
      return;
    }
    if (form.longitude === '' || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      setError('Enter a valid longitude between -180 and 180.');
      return;
    }

    setError('');
    setAdding(true);
    try {
      const site = await createSite({
        name: form.name.trim(),
        description: form.description.trim() || null,
        latitude,
        longitude,
      });
      setSites((current) => [site, ...current]);
      setForm({ name: '', description: '', latitude: '', longitude: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not add this heritage site.');
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(site) {
    setError('');
    setBusyId(site.id);
    try {
      await deleteSite(site.id);
      setSites((current) => current.filter((item) => item.id !== site.id));
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete this heritage site.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="dashboard-admin-panel">
      <h2>Heritage Sites</h2>
      <p>Sites shown as pins on the Heritage Map, separate from documented folklore entries.</p>
      {error && <p className="dashboard-error" role="alert">{error}</p>}
      {loading ? <p className="text-sm text-gray-500">Loading sites…</p> : sites.length === 0 ? (
        <p className="text-sm text-gray-500">No heritage sites have been added yet.</p>
      ) : (
        <div className="dashboard-site-list">
          {sites.map((site) => (
            <div key={site.id} className="dashboard-site-row">
              <div className="dashboard-site-summary">
                <div className="dashboard-site-thumbnail" aria-hidden="true">
                  <svg viewBox="0 0 24 24" focusable="false">
                    <path d="M12 21s7-6.3 7-12a7 7 0 1 0-14 0c0 5.7 7 12 7 12Z" />
                    <circle cx="12" cy="9" r="2.3" />
                  </svg>
                </div>
                <div className="dashboard-site-copy">
                  <h3>{site.name}</h3>
                  <p>{site.description || 'No description provided.'}</p>
                  <span>{Number(site.latitude).toFixed(4)}, {Number(site.longitude).toFixed(4)}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(site)}
                disabled={busyId === site.id}
                className="dashboard-admin-delete"
              >
                {busyId === site.id ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          ))}
        </div>
      )}
      <form onSubmit={handleAdd} className="dashboard-admin-site-form">
        <h3>Add a Heritage Site</h3>
        <input
          type="text"
          placeholder="Site name"
          aria-label="Site name"
          value={form.name}
          onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
          className="dashboard-admin-input"
        />
        <input
          type="text"
          placeholder="Short description"
          aria-label="Short description"
          value={form.description}
          onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
          className="dashboard-admin-input"
        />
        <div className="dashboard-admin-coordinate-grid">
          <input
            type="number"
            step="any"
            placeholder="Latitude, e.g. 13.6218"
            aria-label="Latitude"
            value={form.latitude}
            onChange={(event) => setForm((current) => ({ ...current, latitude: event.target.value }))}
            className="dashboard-admin-input"
          />
          <input
            type="number"
            step="any"
            placeholder="Longitude, e.g. 123.1948"
            aria-label="Longitude"
            value={form.longitude}
            onChange={(event) => setForm((current) => ({ ...current, longitude: event.target.value }))}
            className="dashboard-admin-input"
          />
        </div>
        <button type="submit" disabled={adding} className="dashboard-action-link dashboard-action-primary">
          {adding ? 'Adding…' : 'Add Site'}
        </button>
      </form>
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
  deleteCategory = async () => {},
  deleteRegion = async () => {},
  searchEntries = async () => [],
  createHighlight = async (data) => ({ id: Date.now(), ...data }),
  fetchPending = async () => [],
  fetchPosts = async () => [],
  fetchSites = async () => [],
  createSite = async (data) => ({ id: Date.now(), ...data }),
  deleteSite = async () => {},
  fetchAuditLog = async () => [],
}) {
  const [tab, setTab] = useState(() => (
    new URLSearchParams(window.location.search).get('tab') === 'audit-log'
      ? 'Audit Log'
      : 'Platform Overview'
  ));

  return (
    <div className="space-y-6">
      <section className="dashboard-admin-profile">
        <ProfilePanel />
      </section>

      <div className="dashboard-admin-tabs" role="tablist" aria-label="Administrator sections">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`dashboard-admin-tab ${
              tab === t ? 'dashboard-admin-tab-active' : ''
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Platform Overview' && (
        <PlatformOverviewTab
          fetchUsers={fetchUsers}
          fetchEntries={searchEntries}
          fetchPending={fetchPending}
          fetchPosts={fetchPosts}
          fetchSites={fetchSites}
          onOpenAuditLog={() => setTab('Audit Log')}
        />
      )}
      {tab === 'Manage Users' && <div className="dashboard-admin-panel"><h2>Manage Users</h2><UsersTab fetchUsers={fetchUsers} updateUserRole={updateUserRole} /></div>}
      {tab === 'Categories & Regions' && (
        <div className="dashboard-admin-panel">
          <div className="dashboard-admin-config-grid">
            <section><h3>Categories</h3><CategoriesTab fetchCategories={fetchCategories} createCategory={createCategory} deleteCategory={deleteCategory} /></section>
            <section><h3>Regions</h3><RegionsTab fetchRegions={fetchRegions} createRegion={createRegion} deleteRegion={deleteRegion} /></section>
          </div>
        </div>
      )}
      {tab === 'Heritage Sites' && (
        <HeritageSitesTab fetchSites={fetchSites} createSite={createSite} deleteSite={deleteSite} />
      )}
      {tab === 'Audit Log' && <div className="dashboard-admin-panel"><AuditLogPage fetchAuditLog={fetchAuditLog} /></div>}
      {tab === 'Highlights' && <div className="dashboard-admin-panel"><h2>Highlight of the Week</h2><p>Choose which entry appears in the featured spot on the homepage.</p><HighlightsTab searchEntries={searchEntries} createHighlight={createHighlight} /></div>}
    </div>
  );
}
export default function StubPage({ title, phase }) {
  return (
    <div className="text-center py-24">
      <h1 className="text-2xl font-semibold text-gray-900 mb-2">{title}</h1>
      <p className="text-gray-400">Coming in the {phase} phase.</p>
    </div>
  );
}
import '../components/StatusPage.css';

export default function StubPage({ title, phase }) {
  return (
    <main className="status-page">
      <p className="status-eyebrow">Palagunitaan · {phase} phase</p>
      <h1>{title}</h1>
      <p className="status-description">This part of the archive is being prepared.</p>
    </div>
  );
}
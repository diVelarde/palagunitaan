import ProfilePanel from '../components/ProfilePanel';
import BecomeContributorPrompt from '../components/BecomeContributorPrompt';

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
      <BecomeContributorPrompt />
      <ProfilePanel />
    </div>
  );
}
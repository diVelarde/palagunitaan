import ProfilePanel from '../components/ProfilePanel';
import BecomeContributorPrompt from '../components/BecomeContributorPrompt';
import CommunityTab from '../components/CommunityTab';
import blogService from '../services/blogService';

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
      <BecomeContributorPrompt />
      <ProfilePanel />
      <CommunityTab fetchMyPosts={blogService.getMyPosts} createPost={blogService.createPost} />
    </div>
  );
}
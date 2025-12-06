'use client';

import { useAuth } from '@/hooks/useAuth';
import { MainLayout } from '@/components/layout/main-layout';
import { ProfessionalWorkloadTable } from '@/components/workload/professional-workload-table';
import { WorkloadOverviewDashboard } from '@/components/workload/workload-overview-dashboard';

export default function WorkloadPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // useAuth will redirect to login
  }

  return (
    <MainLayout user={user}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Workload Management</h1>
          <p className="text-gray-600">Track and manage your workload assignments</p>
        </div>

        {/* Overview Dashboard */}
        <WorkloadOverviewDashboard stats={{ total: 0, pending: 0, inProgress: 0, completed: 0, overdue: 0 }} data={[]} filteredData={[]} />

        {/* Workload Table */}
        <ProfessionalWorkloadTable workloads={[]} filters={{}} />
      </div>
    </MainLayout>
  );
}
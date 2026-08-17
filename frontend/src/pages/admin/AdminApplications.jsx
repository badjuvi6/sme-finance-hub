import { useEffect, useState, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import ApplicationReviewTable from '../../components/admin/ApplicationReviewTable';
import { getAllLoanApplications, updateLoanStatus } from '../../api/loanApi';
import { useToast } from '../../context/ToastContext';

export default function AdminApplications() {
  const { openSidebar } = useOutletContext();
  const toast = useToast();
  const [applications, setApplications] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const loadApplications = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const { data } = await getAllLoanApplications(params);
      setApplications(data.applications);
    } catch {
      toast.error('Could not load applications');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const handleUpdateStatus = async (application, status, reviewNotes) => {
    try {
      const { data } = await updateLoanStatus(application._id, { status, reviewNotes });
      setApplications((current) => current.map((app) => (app._id === application._id ? data.application : app)));
      toast.success(`Application ${status.toLowerCase()}`);
    } catch {
      toast.error('Could not update application status');
    }
  };

  return (
    <>
      <Navbar
        title="Application review"
        subtitle="Review pending financing requests and update their status"
        onMenuClick={openSidebar}
      />
      <main className="flex-1 px-4 py-6 sm:px-6">
        <ApplicationReviewTable
          applications={applications}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          onUpdateStatus={handleUpdateStatus}
          loading={loading}
        />
      </main>
    </>
  );
}

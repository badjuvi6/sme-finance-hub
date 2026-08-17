import { useEffect, useState, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import LoanForm from '../../components/financing/LoanForm';
import LoanList from '../../components/financing/LoanList';
import { getMyLoanApplications, createLoanApplication } from '../../api/loanApi';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export default function Financing() {
  const { openSidebar } = useOutletContext();
  const { user } = useAuth();
  const toast = useToast();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formKey, setFormKey] = useState(0);

  const loadApplications = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getMyLoanApplications();
      setApplications(data.applications);
    } catch {
      toast.error('Could not load your applications');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const handleSubmit = async (payload) => {
    setSubmitting(true);
    try {
      await createLoanApplication(payload);
      toast.success('Application submitted for review');
      setFormKey((k) => k + 1);
      loadApplications();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not submit application');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Navbar
        title="Financing"
        subtitle="Apply for a micro-loan, business loan, or grant"
        onMenuClick={openSidebar}
      />
      <main className="flex-1 space-y-6 px-4 py-6 sm:px-6">
        <div className="rounded-xl bg-white p-5 shadow-card ring-1 ring-ink-50 sm:p-6">
          <h3 className="font-display text-base font-semibold text-ink-800">New financing request</h3>
          <p className="mb-4 mt-1 text-sm text-ink-400">
            Tell us about your business and how much funding you need. Our financial officers review every
            application.
          </p>
          <LoanForm
            key={formKey}
            onSubmit={handleSubmit}
            submitting={submitting}
            defaultBusinessName={user?.businessName}
          />
        </div>

        <div>
          <h3 className="mb-3 font-display text-base font-semibold text-ink-800">Your applications</h3>
          <LoanList applications={applications} loading={loading} />
        </div>
      </main>
    </>
  );
}

import { useEffect, useState, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Plus } from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import Modal from '../../components/common/Modal';
import InvoiceForm from '../../components/invoices/InvoiceForm';
import InvoiceList from '../../components/invoices/InvoiceList';
import { getInvoices, createInvoice, updateInvoice, deleteInvoice } from '../../api/invoiceApi';
import { useToast } from '../../context/ToastContext';

export default function Invoices() {
  const { openSidebar } = useOutletContext();
  const toast = useToast();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const { data } = await getInvoices(params);
      setInvoices(data.invoices);
    } catch {
      toast.error('Could not load invoices');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  const handleCreate = async (payload) => {
    setSubmitting(true);
    try {
      await createInvoice(payload);
      toast.success('Invoice created');
      setModalOpen(false);
      loadInvoices();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not create invoice');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (invoice, status) => {
    const previous = [...invoices];
    setInvoices((current) => current.map((inv) => (inv._id === invoice._id ? { ...inv, status } : inv)));
    try {
      await updateInvoice(invoice._id, { status });
      toast.success(`Invoice marked as ${status}`);
    } catch {
      setInvoices(previous);
      toast.error('Could not update invoice status');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteInvoice(deleteTarget._id);
      toast.success('Invoice deleted');
      setDeleteTarget(null);
      loadInvoices();
    } catch {
      toast.error('Could not delete invoice');
    }
  };

  return (
    <>
      <Navbar
        title="Invoices"
        subtitle="Create invoices and track payment status"
        onMenuClick={openSidebar}
        action={
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-medium text-paper transition hover:bg-emerald-800"
          >
            <Plus className="h-4 w-4" /> New invoice
          </button>
        }
      />
      <main className="flex-1 px-4 py-6 sm:px-6">
        <InvoiceList
          invoices={invoices}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          onStatusChange={handleStatusChange}
          onDelete={setDeleteTarget}
          loading={loading}
        />
      </main>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Create an invoice" maxWidth="max-w-2xl">
        <InvoiceForm onSubmit={handleCreate} onCancel={() => setModalOpen(false)} submitting={submitting} />
      </Modal>

      <Modal isOpen={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} title="Delete invoice?" maxWidth="max-w-sm">
        <p className="text-sm text-ink-500">
          This will permanently remove invoice{' '}
          <span className="font-semibold text-ink-700">{deleteTarget?.invoiceNumber}</span> for{' '}
          {deleteTarget?.clientName}. This cannot be undone.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setDeleteTarget(null)}
            className="rounded-lg px-4 py-2.5 text-sm font-medium text-ink-500 hover:bg-ink-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="rounded-lg bg-brick-600 px-4 py-2.5 text-sm font-medium text-paper transition hover:bg-brick-700"
          >
            Delete
          </button>
        </div>
      </Modal>
    </>
  );
}

import { useEffect, useState, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Plus } from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import Modal from '../../components/common/Modal';
import TransactionForm from '../../components/transactions/TransactionForm';
import TransactionList from '../../components/transactions/TransactionList';
import { getTransactions, createTransaction, deleteTransaction } from '../../api/transactionApi';
import { useToast } from '../../context/ToastContext';

export default function Transactions() {
  const { openSidebar } = useOutletContext();
  const toast = useToast();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ type: '', category: '' });
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.type) params.type = filters.type;
      if (filters.category) params.category = filters.category;
      const { data } = await getTransactions(params);
      setTransactions(data.transactions);
    } catch {
      toast.error('Could not load transactions');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const handleCreate = async (payload) => {
    setSubmitting(true);
    try {
      await createTransaction(payload);
      toast.success('Transaction saved');
      setModalOpen(false);
      loadTransactions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save transaction');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteTransaction(deleteTarget._id);
      toast.success('Transaction deleted');
      setDeleteTarget(null);
      loadTransactions();
    } catch {
      toast.error('Could not delete transaction');
    }
  };

  return (
    <>
      <Navbar
        title="Transactions"
        subtitle="Log and review your income and expenses"
        onMenuClick={openSidebar}
        action={
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-medium text-paper transition hover:bg-emerald-800"
          >
            <Plus className="h-4 w-4" /> Add transaction
          </button>
        }
      />
      <main className="flex-1 px-4 py-6 sm:px-6">
        <TransactionList
          transactions={transactions}
          filters={filters}
          onFilterChange={setFilters}
          onDelete={setDeleteTarget}
          loading={loading}
        />
      </main>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Log a transaction">
        <TransactionForm onSubmit={handleCreate} onCancel={() => setModalOpen(false)} submitting={submitting} />
      </Modal>

      <Modal isOpen={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} title="Delete transaction?" maxWidth="max-w-sm">
        <p className="text-sm text-ink-500">
          This will permanently remove this {deleteTarget?.type} record of{' '}
          <span className="font-semibold text-ink-700">{deleteTarget?.category}</span>. This cannot be undone.
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

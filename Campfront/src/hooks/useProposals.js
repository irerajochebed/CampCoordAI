import { useState, useEffect, useCallback } from 'react';
import { proposalApi } from '../api';

/**
 * Custom hook for proposal workflow management
 * Handles fetching, reviewing, and managing proposals
 */
export const useProposals = () => {
  const [proposals, setProposals] = useState([]);
  const [pendingProposals, setPendingProposals] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all proposals
  const fetchProposals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await proposalApi.getAll();
      setProposals(response.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch proposals');
      console.error('Error fetching proposals:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch pending review proposals (hierarchy-aware)
  const fetchPendingReview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await proposalApi.getPendingReview();
      setPendingProposals(response.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch pending proposals');
      console.error('Error fetching pending proposals:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch pending proposals count
  const fetchPendingCount = useCallback(async () => {
    try {
      const response = await proposalApi.getPendingReviewCount();
      setPendingCount(response.data.data || 0);
    } catch (err) {
      console.error('Error fetching pending count:', err);
    }
  }, []);

  // Get proposal by ID
  const getProposalById = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const response = await proposalApi.getById(id);
      return response.data.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch proposal');
      console.error('Error fetching proposal:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Submit proposal for review
  const submitProposal = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const response = await proposalApi.submit(id);
      await fetchProposals(); // Refresh list
      return response.data.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit proposal');
      console.error('Error submitting proposal:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchProposals]);

  // Approve proposal (Administrator only)
  const approveProposal = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const response = await proposalApi.approve(id);
      await fetchPendingReview(); // Refresh pending list
      await fetchPendingCount();
      return response.data.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve proposal');
      console.error('Error approving proposal:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchPendingReview, fetchPendingCount]);

  // Reject proposal (Administrator only)
  const rejectProposal = useCallback(async (id, comments) => {
    setLoading(true);
    setError(null);
    try {
      const response = await proposalApi.reject(id, comments);
      await fetchPendingReview(); // Refresh pending list
      await fetchPendingCount();
      return response.data.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject proposal');
      console.error('Error rejecting proposal:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchPendingReview, fetchPendingCount]);

  // Endorse proposal — Dept Leader endorses a UNION-scope proposal
  const endorseProposal = useCallback(async (id, comments = 'Endorsed') => {
    setLoading(true);
    setError(null);
    try {
      const response = await proposalApi.endorse(id, comments);
      await fetchPendingReview();
      await fetchPendingCount();
      return response.data.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to endorse proposal');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchPendingReview, fetchPendingCount]);

  // Field review — Field Leader approves/rejects/requests revision on a FIELD-scope proposal
  const fieldReviewProposal = useCallback(async (id, decision, comments = '') => {
    setLoading(true);
    setError(null);
    try {
      const response = await proposalApi.fieldReview(id, { decision, comments });
      await fetchPendingReview();
      await fetchPendingCount();
      return response.data.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit field review');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchPendingReview, fetchPendingCount]);

  // Request revision (Both roles)
  const requestRevision = useCallback(async (id, comments) => {
    setLoading(true);
    setError(null);
    try {
      const response = await proposalApi.requestRevision(id, comments);
      await fetchPendingReview(); // Refresh pending list
      await fetchPendingCount();
      return response.data.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to request revision');
      console.error('Error requesting revision:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchPendingReview, fetchPendingCount]);

  // Delete proposal
  const deleteProposal = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      await proposalApi.delete(id);
      await fetchProposals(); // Refresh list
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete proposal');
      console.error('Error deleting proposal:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchProposals]);

  return {
    proposals,
    pendingProposals,
    pendingCount,
    loading,
    error,
    fetchProposals,
    fetchPendingReview,
    fetchPendingCount,
    getProposalById,
    submitProposal,
    approveProposal,
    rejectProposal,
    endorseProposal,
    fieldReviewProposal,
    requestRevision,
    deleteProposal,
  };
};

export default useProposals;

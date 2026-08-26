package com.example.Camp.service;

import com.example.Camp.dto.proposal.AdminApprovalRequest;
import com.example.Camp.dto.proposal.ProposalCreateRequest;
import com.example.Camp.dto.proposal.ProposalRequest;
import com.example.Camp.dto.proposal.ProposalResponse;
import com.example.Camp.dto.proposal.ProposalReviewRequest;
import com.example.Camp.entity.Proposal;
import com.example.Camp.enums.ProposalStatus;

import java.util.List;

public interface ProposalService {
    
    ProposalResponse createProposal(ProposalRequest request, Long userId);
    ProposalResponse createProposal(ProposalCreateRequest request, Long userId);
    ProposalResponse updateProposal(Long id, ProposalRequest request);
    ProposalResponse getProposalById(Long id);
    List<ProposalResponse> getAllProposals();
    List<ProposalResponse> getProposalsByStatus(ProposalStatus status);
    List<ProposalResponse> getProposalsByUser(Long userId);
    List<ProposalResponse> getProposalsByDepartment(Long departmentId);
    List<ProposalResponse> getPendingReviewProposals();
    List<ProposalResponse> getPendingLeaderReviewProposalsForUser(Long userId);
    List<ProposalResponse> getPendingAdminApprovalProposals();
    ProposalResponse submitProposal(Long id);
    ProposalResponse reviewProposal(Long id, ProposalReviewRequest request, Long reviewerId);
    ProposalResponse approveProposal(Long id, Long reviewerId);
    ProposalResponse rejectProposal(Long id, String comments, Long reviewerId);
    ProposalResponse requestRevision(Long id, String comments, Long reviewerId);
    void deleteProposal(Long id);
    Proposal getProposalEntity(Long id);

    // Scope-aware methods
    List<ProposalResponse> getPendingReviewProposalsForUser(Long userId);
    Long countPendingReviewForUser(Long userId);

    // Multi-Level Approval Workflow methods
    // Level 1: Respective Leader Review (Field Leader / Union Leader)
    ProposalResponse leaderReviewProposal(Long id, ProposalReviewRequest request, Long leaderId);

    // Level 2: Union Administrator Final Approval (Auto-creates official event record)
    ProposalResponse adminApproval(Long id, String comments, Long adminId);
    ProposalResponse adminApproval(Long id, AdminApprovalRequest request, Long adminId);

    // Dept Leader endorses a UNION-scope proposal before it reaches Union Admin
    ProposalResponse endorseProposal(Long id, String comments, Long coordinatorId);

    // Field Leader approves/rejects a FIELD-scope proposal
    ProposalResponse fieldReviewProposal(Long id, ProposalReviewRequest request, Long fieldLeaderId);
}

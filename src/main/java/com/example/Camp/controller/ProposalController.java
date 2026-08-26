package com.example.Camp.controller;

import com.example.Camp.dto.common.ApiResponse;
import com.example.Camp.dto.proposal.ProposalRequest;
import com.example.Camp.dto.proposal.ProposalResponse;
import com.example.Camp.dto.proposal.ProposalReviewRequest;
import com.example.Camp.enums.ProposalStatus;
import com.example.Camp.security.UserDetailsImpl;
import com.example.Camp.service.ProposalService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/v1/proposals", "/api/proposals"})
@RequiredArgsConstructor
public class ProposalController {
    
    private final ProposalService proposalService;
    
    @PostMapping
    @PreAuthorize("hasRole('COORDINATOR')")
    public ResponseEntity<ApiResponse<ProposalResponse>> createProposal(
            @Valid @RequestBody ProposalRequest request,
            Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        ProposalResponse response = proposalService.createProposal(request, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success("Proposal created successfully", response));
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('COORDINATOR')")
    public ResponseEntity<ApiResponse<ProposalResponse>> updateProposal(
            @PathVariable Long id,
            @Valid @RequestBody ProposalRequest request) {
        ProposalResponse response = proposalService.updateProposal(id, request);
        return ResponseEntity.ok(ApiResponse.success("Proposal updated successfully", response));
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProposalResponse>> getProposalById(@PathVariable Long id) {
        ProposalResponse response = proposalService.getProposalById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
    
    @GetMapping
    public ResponseEntity<ApiResponse<List<ProposalResponse>>> getAllProposals() {
        List<ProposalResponse> response = proposalService.getAllProposals();
        return ResponseEntity.ok(ApiResponse.success(response));
    }
    
    @GetMapping("/status/{status}")
    public ResponseEntity<ApiResponse<List<ProposalResponse>>> getProposalsByStatus(
            @PathVariable ProposalStatus status) {
        List<ProposalResponse> response = proposalService.getProposalsByStatus(status);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
    
    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<List<ProposalResponse>>> getProposalsByUser(
            @PathVariable Long userId) {
        List<ProposalResponse> response = proposalService.getProposalsByUser(userId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
    
    @GetMapping("/department/{departmentId}")
    public ResponseEntity<ApiResponse<List<ProposalResponse>>> getProposalsByDepartment(
            @PathVariable Long departmentId) {
        List<ProposalResponse> response = proposalService.getProposalsByDepartment(departmentId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
    
    @GetMapping("/my-proposals")
    public ResponseEntity<ApiResponse<List<ProposalResponse>>> getMyProposals(
            Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        List<ProposalResponse> response = proposalService.getProposalsByUser(userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping({"/pending-review", "/pending", "/pending-leader-review"})
    @PreAuthorize("hasRole('ADMINISTRATOR') or hasRole('COORDINATOR')")
    public ResponseEntity<ApiResponse<List<ProposalResponse>>> getPendingReviewProposals(
            Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        List<ProposalResponse> response = proposalService.getPendingLeaderReviewProposalsForUser(userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/pending-admin-approval")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ResponseEntity<ApiResponse<List<ProposalResponse>>> getPendingAdminApprovalProposals() {
        List<ProposalResponse> response = proposalService.getPendingAdminApprovalProposals();
        return ResponseEntity.ok(ApiResponse.success(response));
    }
    
    @GetMapping("/pending-review/count")
    @PreAuthorize("hasRole('ADMINISTRATOR') or hasRole('COORDINATOR')")
    public ResponseEntity<ApiResponse<Long>> getPendingReviewCount(Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        Long count = proposalService.countPendingReviewForUser(userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success(count));
    }
    
    @PatchMapping("/{id}/submit")
    @PreAuthorize("hasRole('COORDINATOR')")
    public ResponseEntity<ApiResponse<ProposalResponse>> submitProposal(@PathVariable Long id) {
        ProposalResponse response = proposalService.submitProposal(id);
        return ResponseEntity.ok(ApiResponse.success("Proposal submitted for review", response));
    }
    
    @RequestMapping(value = "/{id}/review", method = {RequestMethod.POST, RequestMethod.PUT})
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ResponseEntity<ApiResponse<ProposalResponse>> reviewProposal(
            @PathVariable Long id,
            @Valid @RequestBody ProposalReviewRequest request,
            Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        ProposalResponse response = proposalService.reviewProposal(id, request, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success("Proposal reviewed successfully", response));
    }
    
    @PatchMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ResponseEntity<ApiResponse<ProposalResponse>> approveProposal(
            @PathVariable Long id,
            Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        ProposalResponse response = proposalService.approveProposal(id, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success("Proposal approved successfully", response));
    }
    
    @PatchMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ResponseEntity<ApiResponse<ProposalResponse>> rejectProposal(
            @PathVariable Long id,
            @RequestParam String comments,
            Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        ProposalResponse response = proposalService.rejectProposal(id, comments, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success("Proposal rejected", response));
    }
    
    @RequestMapping(value = "/{id}/leader-review", method = {RequestMethod.PUT, RequestMethod.POST, RequestMethod.PATCH})
    @PreAuthorize("hasRole('COORDINATOR') or hasRole('ADMINISTRATOR')")
    public ResponseEntity<ApiResponse<ProposalResponse>> leaderReview(
            @PathVariable Long id,
            @Valid @RequestBody ProposalReviewRequest request,
            Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        ProposalResponse response = proposalService.leaderReviewProposal(id, request, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success("Leader review submitted successfully", response));
    }

    @RequestMapping(value = "/{id}/admin-approval", method = {RequestMethod.PUT, RequestMethod.POST, RequestMethod.PATCH})
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ResponseEntity<ApiResponse<ProposalResponse>> adminApproval(
            @PathVariable Long id,
            @RequestBody(required = false) com.example.Camp.dto.proposal.AdminApprovalRequest request,
            Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        ProposalResponse response = proposalService.adminApproval(id, request, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success("Proposal approved and official event record created successfully", response));
    }

    @PatchMapping("/{id}/field-review")
    @PreAuthorize("hasRole('COORDINATOR')")
    public ResponseEntity<ApiResponse<ProposalResponse>> fieldReviewProposal(
            @PathVariable Long id,
            @Valid @RequestBody ProposalReviewRequest request,
            Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        ProposalResponse response = proposalService.fieldReviewProposal(id, request, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success("Field review submitted", response));
    }

    @PatchMapping("/{id}/endorse")
    @PreAuthorize("hasRole('COORDINATOR')")
    public ResponseEntity<ApiResponse<ProposalResponse>> endorseProposal(
            @PathVariable Long id,
            @RequestParam(required = false, defaultValue = "Endorsed") String comments,
            Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        ProposalResponse response = proposalService.endorseProposal(id, comments, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success("Proposal endorsed and forwarded for admin approval", response));
    }
    
    @PatchMapping("/{id}/request-revision")
    @PreAuthorize("hasRole('COORDINATOR') or hasRole('ADMINISTRATOR')")
    public ResponseEntity<ApiResponse<ProposalResponse>> requestProposalRevision(
            @PathVariable Long id,
            @RequestParam String comments,
            Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        ProposalResponse response = proposalService.requestRevision(id, comments, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success("Revision requested", response));
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('COORDINATOR') or hasRole('ADMINISTRATOR')")
    public ResponseEntity<ApiResponse<String>> deleteProposal(@PathVariable Long id) {
        proposalService.deleteProposal(id);
        return ResponseEntity.ok(ApiResponse.success("Proposal deleted successfully", null));
    }
}

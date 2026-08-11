package com.example.Camp.repository;

import com.example.Camp.entity.ProposalReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProposalReviewRepository extends JpaRepository<ProposalReview, Long> {
    
    List<ProposalReview> findByProposalId(Long proposalId);
    
    List<ProposalReview> findByReviewerId(Long reviewerId);
    
    @Query("SELECT pr FROM ProposalReview pr WHERE pr.deleted = false AND pr.proposal.id = :proposalId " +
           "ORDER BY pr.createdAt DESC")
    List<ProposalReview> findByProposalIdOrderByCreatedAtDesc(@Param("proposalId") Long proposalId);
    
    @Query("SELECT pr FROM ProposalReview pr WHERE pr.deleted = false AND pr.reviewer.id = :reviewerId " +
           "ORDER BY pr.createdAt DESC")
    List<ProposalReview> findByReviewerIdOrderByCreatedAtDesc(@Param("reviewerId") Long reviewerId);
}

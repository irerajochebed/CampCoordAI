package com.example.Camp.repository;

import com.example.Camp.entity.AiInsight;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AiInsightRepository extends JpaRepository<AiInsight, Long> {

    @Query("SELECT a FROM AiInsight a WHERE a.deleted = false AND a.event.id = :eventId ORDER BY a.generatedAt DESC")
    List<AiInsight> findByEventIdOrderByGeneratedAtDesc(@Param("eventId") Long eventId);

    Optional<AiInsight> findTopByEventIdAndDeletedFalseOrderByGeneratedAtDesc(Long eventId);

    Optional<AiInsight> findTopByEventIdAndWindowLabelAndDeletedFalseOrderByGeneratedAtDesc(Long eventId, String windowLabel);

    boolean existsByEventIdAndWindowLabelAndDeletedFalse(Long eventId, String windowLabel);
}

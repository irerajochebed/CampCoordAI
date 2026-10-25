package com.example.Camp.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Entity representing an AI-generated readiness assessment and attendance prediction record
 * for an upcoming camp or conference.
 */
@Entity
@Table(name = "ai_insights")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(callSuper = true)
public class AiInsight extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @Column(name = "generated_at", nullable = false)
    private LocalDateTime generatedAt;

    @Column(name = "window_label", length = 50)
    private String windowLabel; // e.g. "D-30", "D-14", "D-7", "D-3", "D-1", "REG-OPEN", "MANUAL"

    @Column(name = "predicted_attendance")
    private Integer predictedAttendance;

    @Column(length = 20)
    private String confidence; // "LOW", "MEDIUM", "HIGH"

    @Column(name = "risk_level", length = 20)
    private String riskLevel; // "LOW", "MEDIUM", "HIGH"

    @Column(columnDefinition = "TEXT")
    private String risks; // Serialized JSON array of risks

    @Column(columnDefinition = "TEXT")
    private String recommendations; // Serialized JSON array of recommendations

    @Column(name = "summary_text", columnDefinition = "TEXT")
    private String summaryText; // Natural-language decision-support summary

    @Column(name = "provider_used", length = 50)
    private String providerUsed; // "LLM" or "RULE_BASED"
}

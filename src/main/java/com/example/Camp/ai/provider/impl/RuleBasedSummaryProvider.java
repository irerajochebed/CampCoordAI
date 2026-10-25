package com.example.Camp.ai.provider.impl;

import com.example.Camp.ai.provider.AiSummaryProvider;
import com.example.Camp.ai.provider.model.AiInsightContext;
import org.springframework.stereotype.Component;

/**
 * Deterministic rule-based implementation of AiSummaryProvider.
 * Serves as the reliable default and automatic fallback whenever the LLM API is unavailable,
 * unconfigured, or times out.
 */
@Component("ruleBasedSummaryProvider")
public class RuleBasedSummaryProvider implements AiSummaryProvider {

    @Override
    public String getProviderName() {
        return "RULE_BASED";
    }

    @Override
    public String generateSummary(AiInsightContext context) {
        if (context == null) {
            return "No readiness metrics available.";
        }

        StringBuilder summary = new StringBuilder();

        // 1. Executive Status
        summary.append(String.format("Event '%s' (%s) is scheduled in %d days. Overall readiness status: %s. ",
                context.getEventName(),
                context.getEventType(),
                context.getDaysUntilStart(),
                context.getRiskLevel()));

        // 2. Attendance & Turnout Forecast
        summary.append(String.format("Current registrations stand at %d of %d maximum capacity (%d confirmed). " +
                        "Our historical statistical model projects total turnout around %d attendees (%s confidence). ",
                context.getCurrentRegistrations(),
                context.getMaxParticipants(),
                context.getConfirmedRegistrations(),
                context.getPredictedAttendance(),
                context.getConfidence()));

        // 3. Readiness Risk Highlights
        if (context.getDetectedRiskTitles() != null && !context.getDetectedRiskTitles().isEmpty()) {
            summary.append(String.format("Attention required on %d identified issue(s): %s. ",
                    context.getDetectedRiskTitles().size(),
                    String.join("; ", context.getDetectedRiskTitles())));
        } else {
            summary.append("Key preparation milestones are currently proceeding on schedule without critical bottlenecks. ");
        }

        // 4. Accommodation & Logistics
        if (context.getAccommodationCapacity() > 0) {
            long bedDeficit = context.getPredictedAttendance() - context.getAccommodationCapacity();
            if (bedDeficit > 0) {
                summary.append(String.format("Lodging alert: total assigned bed capacity (%d) is below projected attendance (%d), indicating a potential shortage of %d beds. ",
                        context.getAccommodationCapacity(), context.getPredictedAttendance(), bedDeficit));
            } else {
                summary.append(String.format("Lodging capacity (%d beds) is adequate for projected turnout. ",
                        context.getAccommodationCapacity()));
            }
        }

        // 5. Actionable Advice
        if (context.getRecommendations() != null && !context.getRecommendations().isEmpty()) {
            summary.append(String.format("Recommended immediate action: %s",
                    context.getRecommendations().get(0)));
        }

        return summary.toString().trim();
    }
}

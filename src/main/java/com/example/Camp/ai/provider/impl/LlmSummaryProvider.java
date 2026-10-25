package com.example.Camp.ai.provider.impl;

import com.example.Camp.ai.provider.AiSummaryProvider;
import com.example.Camp.ai.provider.model.AiInsightContext;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * LLM-powered implementation of AiSummaryProvider.
 * Calls an external LLM completion API (OpenAI/compatible) using environment-configured credentials.
 * Automatically falls back to RuleBasedSummaryProvider if the API key is absent, times out (3s),
 * or returns an error.
 *
 * PRIVACY GUARANTEE: In compliance with Rwanda Law No. 058/2021 on Personal Data Protection,
 * the prompt strictly aggregates counts, percentages, and deadlines. Zero participant PII is ever transmitted.
 */
@Component("llmSummaryProvider")
@Slf4j
public class LlmSummaryProvider implements AiSummaryProvider {

    private final AiSummaryProvider fallbackProvider;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    @Value("${camp.ai.llm.api-key:}")
    private String apiKey;

    @Value("${camp.ai.llm.api-url:https://api.openai.com/v1/chat/completions}")
    private String apiUrl;

    @Value("${camp.ai.llm.model:gpt-4o-mini}")
    private String modelName;

    @Value("${camp.ai.llm.timeout-seconds:3}")
    private int timeoutSeconds;

    public LlmSummaryProvider(@org.springframework.beans.factory.annotation.Qualifier("ruleBasedSummaryProvider") AiSummaryProvider fallbackProvider) {
        this.fallbackProvider = fallbackProvider;
        this.objectMapper = new ObjectMapper();
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(2))
                .build();
    }

    @Override
    public String getProviderName() {
        return isConfigured() ? "LLM" : fallbackProvider.getProviderName();
    }

    public boolean isConfigured() {
        return apiKey != null && !apiKey.trim().isEmpty();
    }

    @Override
    public String generateSummary(AiInsightContext context) {
        if (!isConfigured()) {
            log.debug("LLM API key is not configured; using RuleBasedSummaryProvider.");
            return fallbackProvider.generateSummary(context);
        }

        try {
            String prompt = buildPrompt(context);
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", modelName);
            requestBody.put("messages", List.of(
                    Map.of("role", "system", "content",
                            "You are a helpful, professional Adventist camp meeting operations advisor for the Rwanda Union Mission. " +
                            "Provide a concise, 2-3 sentence executive readiness brief and actionable recommendations based strictly on the aggregated data provided. " +
                            "Never invent participant names or personal information. Be clear, encouraging, and operationally precise."),
                    Map.of("role", "user", "content", prompt)
            ));
            requestBody.put("max_tokens", 250);
            requestBody.put("temperature", 0.3);

            String jsonPayload = objectMapper.writeValueAsString(requestBody);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(apiUrl))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + apiKey.trim())
                    .timeout(Duration.ofSeconds(Math.max(1, timeoutSeconds)))
                    .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                JsonNode root = objectMapper.readTree(response.body());
                JsonNode choices = root.path("choices");
                if (choices.isArray() && !choices.isEmpty()) {
                    String content = choices.get(0).path("message").path("content").asText();
                    if (content != null && !content.trim().isEmpty()) {
                        return content.trim();
                    }
                }
            } else {
                log.warn("LLM API request returned status {}: {}", response.statusCode(), response.body());
            }
        } catch (Exception ex) {
            log.warn("LLM generation failed or timed out: {}. Falling back to RuleBasedSummaryProvider.", ex.getMessage());
        }

        return fallbackProvider.generateSummary(context);
    }

    private String buildPrompt(AiInsightContext context) {
        return String.format(
                "Camp/Conference Readiness Briefing:\n" +
                "- Event: %s (%s)\n" +
                "- Days until start: %d\n" +
                "- Registration: %d of %d maximum (%d confirmed)\n" +
                "- Projected Attendance: %d (confidence: %s)\n" +
                "- Readiness Risk Level: %s\n" +
                "- Payments: %d pending, %d verified\n" +
                "- Lodging Capacity: %d beds\n" +
                "- Program: %d sessions (%d speakers assigned)\n" +
                "- Coordinator Assigned: %s\n" +
                "- Detected Shortfalls: %s\n" +
                "- Recommendations: %s\n" +
                "Summarize overall readiness in 2-3 professional, actionable sentences for leadership.",
                context.getEventName(),
                context.getEventType(),
                context.getDaysUntilStart(),
                context.getCurrentRegistrations(),
                context.getMaxParticipants(),
                context.getConfirmedRegistrations(),
                context.getPredictedAttendance(),
                context.getConfidence(),
                context.getRiskLevel(),
                context.getPendingPayments(),
                context.getVerifiedPayments(),
                context.getAccommodationCapacity(),
                context.getSessionCount(),
                context.getSessionsWithSpeakers(),
                context.isCoordinatorAssigned() ? "Yes" : "NO",
                context.getDetectedRiskTitles().isEmpty() ? "None" : String.join(", ", context.getDetectedRiskTitles()),
                context.getRecommendations().isEmpty() ? "None" : String.join(", ", context.getRecommendations())
        );
    }
}

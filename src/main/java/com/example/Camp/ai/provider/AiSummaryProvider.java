package com.example.Camp.ai.provider;

import com.example.Camp.ai.provider.model.AiInsightContext;

/**
 * Pluggable interface for generating natural-language event readiness summaries.
 */
public interface AiSummaryProvider {

    /**
     * Identifies the provider ("LLM" or "RULE_BASED").
     */
    String getProviderName();

    /**
     * Generates a concise, plain-language readiness assessment summary.
     *
     * @param context Aggregated event metrics and risks (strictly anonymized per Rwanda Law No. 058/2021).
     * @return Natural-language summary text.
     */
    String generateSummary(AiInsightContext context);
}

package vn.netfashion.commerce.config;

import java.time.Duration;
import java.util.Set;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app")
public record AppProperties(
    String environment,
    String publicOrigin,
    String jwtSecret,
    Duration accessTokenTtl,
    Duration refreshTokenTtl,
    boolean localAuthBypass,
    String localAuthEmail,
    Set<String> adminEmails,
    Set<String> managerEmails,
    String paymentWebhookSecret,
    String uploadDir,
    String geminiApiKey,
    String geminiModel
) {}

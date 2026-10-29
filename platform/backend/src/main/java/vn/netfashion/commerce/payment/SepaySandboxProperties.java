package vn.netfashion.commerce.payment;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "sepay.sandbox")
public record SepaySandboxProperties(boolean enabled, String apiKey, String bankAccountId) {
    public boolean configured() {
        return enabled && apiKey != null && !apiKey.isBlank() && bankAccountId != null
            && bankAccountId.matches("[a-fA-F0-9]{8}(-[a-fA-F0-9]{4}){3}-[a-fA-F0-9]{12}");
    }
}

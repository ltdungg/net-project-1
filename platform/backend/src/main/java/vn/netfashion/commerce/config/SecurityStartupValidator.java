package vn.netfashion.commerce.config;

import org.springframework.beans.factory.InitializingBean;
import org.springframework.stereotype.Component;

@Component
public class SecurityStartupValidator implements InitializingBean {
    private static final String LOCAL_JWT = "local-only-change-this-secret-before-production";
    private static final String WEBHOOK_PLACEHOLDER = "replace-with-provider-webhook-secret";
    private final AppProperties properties;

    public SecurityStartupValidator(AppProperties properties) {
        this.properties = properties;
    }

    @Override
    public void afterPropertiesSet() {
        if ("local".equalsIgnoreCase(properties.environment())) return;
        if (properties.localAuthBypass()) {
            throw new IllegalStateException("LOCAL_AUTH_BYPASS phải tắt ngoài môi trường local");
        }
        if (properties.jwtSecret() == null || properties.jwtSecret().length() < 32 || properties.jwtSecret().startsWith(LOCAL_JWT)) {
            throw new IllegalStateException("JWT_SECRET production chưa được cấu hình an toàn");
        }
        if (properties.paymentWebhookSecret() == null || properties.paymentWebhookSecret().isBlank()
            || WEBHOOK_PLACEHOLDER.equals(properties.paymentWebhookSecret())) {
            throw new IllegalStateException("PAYMENT_WEBHOOK_SECRET production chưa được cấu hình");
        }
        if (properties.publicOrigin() == null || !properties.publicOrigin().startsWith("https://")) {
            throw new IllegalStateException("PUBLIC_ORIGIN production phải dùng HTTPS");
        }
    }
}

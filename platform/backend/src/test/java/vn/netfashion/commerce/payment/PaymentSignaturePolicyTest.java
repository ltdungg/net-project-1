package vn.netfashion.commerce.payment;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class PaymentSignaturePolicyTest {
    @Test
    void generatesKnownHmacSha256Vector() {
        String signature = PaymentSignaturePolicy.hmacHex(
            "key",
            "The quick brown fox jumps over the lazy dog"
        );

        assertThat(signature)
            .isEqualTo("f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8");
    }

    @Test
    void acceptsValidSignatureAndHexCase() {
        String payload = "{\"id\":\"evt-1\"}";
        String signature = PaymentSignaturePolicy.hmacHex("webhook-secret", payload);

        assertThat(PaymentSignaturePolicy.verify("webhook-secret", payload, signature)).isTrue();
        assertThat(PaymentSignaturePolicy.verify("webhook-secret", payload, signature.toUpperCase())).isTrue();
    }

    @Test
    void rejectsChangedPayloadAndMalformedSignatures() {
        String signature = PaymentSignaturePolicy.hmacHex("webhook-secret", "original");

        assertThat(PaymentSignaturePolicy.verify("webhook-secret", "changed", signature)).isFalse();
        assertThat(PaymentSignaturePolicy.verify("webhook-secret", "original", signature.substring(2))).isFalse();
        assertThat(PaymentSignaturePolicy.verify("webhook-secret", "original", "not-hex")).isFalse();
        assertThat(PaymentSignaturePolicy.verify("webhook-secret", "original", null)).isFalse();
    }
}

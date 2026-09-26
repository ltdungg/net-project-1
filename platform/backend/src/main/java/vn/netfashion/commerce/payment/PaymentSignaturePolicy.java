package vn.netfashion.commerce.payment;

import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.util.HexFormat;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

final class PaymentSignaturePolicy {
    private static final String ALGORITHM = "HmacSHA256";
    private static final HexFormat HEX = HexFormat.of();

    private PaymentSignaturePolicy() {}

    static String hmacHex(String secret, String payload) {
        return HEX.formatHex(hmac(secret, payload.getBytes(StandardCharsets.UTF_8)));
    }

    static boolean verify(String secret, String payload, String suppliedHex) {
        return verify(secret, payload.getBytes(StandardCharsets.UTF_8), suppliedHex);
    }

    static boolean verify(String secret, byte[] payload, String suppliedHex) {
        byte[] expected = hmac(secret, payload);
        byte[] supplied = new byte[expected.length];
        boolean validEncoding = false;

        if (suppliedHex != null) {
            try {
                byte[] decoded = HEX.parseHex(suppliedHex.trim());
                if (decoded.length == expected.length) {
                    supplied = decoded;
                    validEncoding = true;
                }
            } catch (IllegalArgumentException ignored) {
                // Compare against the zero-filled value below so malformed input
                // follows the same constant-time byte comparison path.
            }
        }

        return MessageDigest.isEqual(expected, supplied) && validEncoding;
    }

    private static byte[] hmac(String secret, byte[] payload) {
        try {
            Mac mac = Mac.getInstance(ALGORITHM);
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), ALGORITHM));
            return mac.doFinal(payload);
        } catch (GeneralSecurityException exception) {
            throw new IllegalStateException("HMAC-SHA256 is not available", exception);
        }
    }
}

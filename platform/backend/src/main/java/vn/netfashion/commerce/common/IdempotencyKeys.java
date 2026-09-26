package vn.netfashion.commerce.common;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

/**
 * Builds fixed-length, scoped database keys without persisting the raw key a
 * browser or integration supplied.
 */
public final class IdempotencyKeys {
    private static final HexFormat HEX = HexFormat.of();

    private IdempotencyKeys() {}

    public static String scoped(String operation, String ownerScope, String suppliedKey) {
        if (operation == null || operation.isBlank()
            || ownerScope == null || ownerScope.isBlank()
            || suppliedKey == null || suppliedKey.isBlank()) {
            throw new IllegalArgumentException("Idempotency scope and key must not be blank");
        }
        String canonical = operation + '\0' + ownerScope + '\0' + suppliedKey;
        try {
            return HEX.formatHex(MessageDigest.getInstance("SHA-256")
                .digest(canonical.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is not available", exception);
        }
    }
}

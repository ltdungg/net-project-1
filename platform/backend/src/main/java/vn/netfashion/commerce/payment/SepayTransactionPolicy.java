package vn.netfashion.commerce.payment;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.Locale;
import java.util.UUID;
import java.util.regex.Pattern;
import tools.jackson.databind.JsonNode;

public final class SepayTransactionPolicy {
    private SepayTransactionPolicy() {}
    public static String transferContent(String orderId) {
        return "NET" + UUID.fromString(orderId).toString().replace("-", "").toUpperCase(Locale.ROOT);
    }
    public static boolean matches(JsonNode transaction, String accountId, String accountNumber, String content,
            long amountVnd, Instant createdAt, Instant expiresAt) {
        try {
            UUID.fromString(transaction.path("id").asText());
            Instant time = transactionTime(transaction.path("transaction_date").asText());
            return accountId.equals(transaction.path("bank_account_id").asText())
                && accountNumber.equals(transaction.path("account_number").asText())
                && "in".equals(transaction.path("transfer_type").asText())
                && new BigDecimal(transaction.path("amount_in").asText()).longValueExact() == amountVnd
                && new BigDecimal(transaction.path("amount_out").asText()).longValueExact() == 0
                && Pattern.compile("(?<![A-Z0-9])" + Pattern.quote(content) + "(?![A-Z0-9])", Pattern.CASE_INSENSITIVE)
                    .matcher(transaction.path("transaction_content").asText()).find()
                && !time.isBefore(createdAt.truncatedTo(ChronoUnit.SECONDS))
                && !time.isAfter(Instant.now().plusSeconds(5)) && time.isBefore(expiresAt);
        } catch (RuntimeException exception) { return false; }
    }
    private static Instant transactionTime(String value) {
        try { return OffsetDateTime.parse(value).toInstant(); }
        catch (RuntimeException ignored) {
            return LocalDateTime.parse(value, DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"))
                .atZone(ZoneId.of("Asia/Ho_Chi_Minh")).toInstant();
        }
    }
}

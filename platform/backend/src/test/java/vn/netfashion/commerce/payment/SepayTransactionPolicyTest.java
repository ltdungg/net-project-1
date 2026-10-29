package vn.netfashion.commerce.payment;

import static org.assertj.core.api.Assertions.assertThat;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.node.ObjectNode;

class SepayTransactionPolicyTest {
    private final Instant now = Instant.now();
    private final String account = UUID.randomUUID().toString();
    private final String content = SepayTransactionPolicy.transferContent(UUID.randomUUID().toString());
    private final ObjectMapper mapper = new ObjectMapper();

    @Test void acceptsExactVndAmountAndVietnamLocalOrIsoTimeWithBankAddedText() {
        var event = event();
        assertThat(matches(event)).isTrue();
        event.put("transaction_content", "Chuyen tien " + content.toLowerCase() + ". TEST");
        event.put("amount_in", "458000.00");
        event.put("transaction_date", DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")
            .withZone(ZoneId.of("Asia/Ho_Chi_Minh")).format(now));
        assertThat(matches(event)).isTrue();
    }

    @ParameterizedTest
    @CsvSource({"amount_in,4580", "amount_in,458001", "amount_in,458000.1", "amount_in,NaN", "amount_out,1",
        "account_number,0000000002", "bank_account_id,wrong", "transfer_type,out", "id,not-a-uuid", "transaction_date,invalid"})
    void rejectsWrongAccountDirectionAmountOrMalformedEvent(String field, String value) {
        assertThat(matches(event().put(field, value))).isFalse();
    }

    @Test void requiresWholeTransferReferenceAndPaymentTimeWindow() {
        for (String invalid : new String[]{content + "0", "X" + content, content.substring(1), ""}) {
            assertThat(matches(event().put("transaction_content", invalid))).isFalse();
        }
        for (Instant invalid : new Instant[]{now.minusSeconds(120), now.plusSeconds(30), now.plusSeconds(7200)}) {
            assertThat(matches(event().put("transaction_date", invalid.toString()))).isFalse();
        }
        assertThat(matches(mapper.createObjectNode())).isFalse();
    }

    private ObjectNode event() {
        return mapper.valueToTree(Map.of("id", UUID.randomUUID().toString(), "bank_account_id", account,
            "account_number", "0000000001", "transfer_type", "in", "amount_in", 458000, "amount_out", 0,
            "transaction_content", content, "transaction_date", now.toString()));
    }
    private boolean matches(ObjectNode event) {
        return SepayTransactionPolicy.matches(event, account, "0000000001", content, 458000, now.minusSeconds(60), now.plusSeconds(3600));
    }
}

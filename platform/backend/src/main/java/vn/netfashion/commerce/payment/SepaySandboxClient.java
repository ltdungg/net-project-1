package vn.netfashion.commerce.payment;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import vn.netfashion.commerce.common.ApiException;

/** Read-only API v2 adapter. The production constructor cannot target SePay Live. */
@Component
public class SepaySandboxClient {
    private final SepaySandboxProperties properties;
    private final ObjectMapper mapper;
    private final HttpClient http;
    private final URI base;
    private final ArrayDeque<Instant> calls = new ArrayDeque<>();
    private final Map<String, CachedAccount> accounts = new ConcurrentHashMap<>();

    @Autowired public SepaySandboxClient(SepaySandboxProperties properties, ObjectMapper mapper) {
        this(properties, mapper, HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(4)).build(),
            URI.create("https://userapi-sandbox.sepay.vn/v2/"));
    }
    SepaySandboxClient(SepaySandboxProperties properties, ObjectMapper mapper, HttpClient http, URI base) {
        this.properties = properties; this.mapper = mapper; this.http = http; this.base = base;
    }
    public synchronized BankAccount account(String id) {
        if (!id.matches("[a-fA-F0-9]{8}(-[a-fA-F0-9]{4}){3}-[a-fA-F0-9]{12}")) throw unavailable();
        var cached = accounts.get(id);
        if (cached != null && cached.until().isAfter(Instant.now())) return cached.account();
        var data = get("bank-accounts/" + id).path("data");
        if (!id.equals(data.path("id").asText()) || data.path("active").asInt() != 1) throw unavailable();
        var account = new BankAccount(id, data.path("account_number").asText(), data.path("account_holder_name").asText(),
            data.path("bank_short_name").asText(), data.path("bank_code").asText());
        if (account.number().isBlank() || account.bankCode().isBlank() || account.holder().isBlank()) throw unavailable();
        if (accounts.size() >= 50) accounts.clear();
        accounts.put(id, new CachedAccount(account, Instant.now().plusSeconds(300)));
        return account;
    }
    public List<JsonNode> transactions(String accountId, String content, long amountVnd) {
        // Query is only a pre-filter. Every returned row is validated again before settlement.
        var root = get("transactions?bank_account_id=" + encode(accountId) + "&q=" + encode(content)
            + "&transfer_type=in&amount_in_min=" + amountVnd + "&amount_in_max=" + amountVnd
            + "&per_page=100&transaction_date_sort=desc&timestamp_format=iso8601");
        if (!root.path("data").isArray()) throw unavailable();
        List<JsonNode> result = new ArrayList<>();
        root.path("data").forEach(result::add);
        return result;
    }
    private JsonNode get(String path) {
        if (!properties.configured()) throw unavailable();
        reserveRequest();
        try {
            var request = HttpRequest.newBuilder(base.resolve(path)).timeout(Duration.ofSeconds(12))
                .header("Authorization", "Bearer " + properties.apiKey()).header("Accept", "application/json").GET().build();
            var response = http.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            if (response.statusCode() == 429) throw busy();
            if (response.statusCode() != 200 || response.body().length() > 1_048_576) throw unavailable();
            var root = mapper.readTree(response.body());
            if (root == null || !"success".equals(root.path("status").asText())) throw unavailable();
            return root;
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt(); throw unavailable();
        } catch (ApiException exception) { throw exception; }
        catch (Exception exception) { throw unavailable(); } // Never log credentials or provider bodies.
    }
    private synchronized void reserveRequest() {
        Instant now = Instant.now();
        while (!calls.isEmpty() && calls.peekFirst().isBefore(now.minusSeconds(1))) calls.removeFirst();
        if (calls.size() >= 2) throw busy(); // SePay allows 3 requests/second/IP; leave headroom.
        calls.addLast(now);
    }
    static String encode(String value) { return URLEncoder.encode(value, StandardCharsets.UTF_8); }
    static ApiException unavailable() {
        return new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "SEPAY_UNAVAILABLE", "Chưa kết nối được SePay Sandbox. Vui lòng thử lại sau.");
    }
    private static ApiException busy() {
        return new ApiException(HttpStatus.TOO_MANY_REQUESTS, "SEPAY_RATE_LIMITED", "SePay đang giới hạn yêu cầu. Vui lòng thử lại sau 15 giây.");
    }
    public record BankAccount(String id, String number, String holder, String bankName, String bankCode) {}
    private record CachedAccount(BankAccount account, Instant until) {}
}

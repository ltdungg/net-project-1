package vn.netfashion.commerce.ai;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;
import com.sun.net.httpserver.HttpServer;
import java.net.InetSocketAddress;
import java.net.URI;
import java.net.http.HttpClient;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.ObjectMapper;
import vn.netfashion.commerce.config.AppProperties;

class AiModelClientTest {
    private final ObjectMapper mapper = new ObjectMapper();
    private final AppProperties properties = mock(AppProperties.class);
    private final AiRateLimiter limits = mock(AiRateLimiter.class);
    private final Map<String, Object> schema = AiModelClient.schema(Map.of("answer", AiModelClient.text()));

    @Test void missingKeyDoesNotContactProvider() {
        var client = new AiModelClient(properties, mapper, limits);
        assertThat(client.generate("test", Map.of(), schema)).isEmpty();
        assertThat(client.mode(false)).isEqualTo("rules");
        verifyNoInteractions(limits);
    }

    @Test void sendsGeminiStructuredRequestWithKeyOnlyInHeaderAndJoinsTextWithoutThoughts() throws Exception {
        when(properties.geminiApiKey()).thenReturn("dummy-test-key");
        when(properties.geminiModel()).thenReturn("models/gemini-3.8-flash");
        var received = new AtomicReference<String>();
        var key = new AtomicReference<String>();
        var url = new AtomicReference<String>();
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/v1beta/models/gemini-3.8-flash:generateContent", exchange -> {
            received.set(new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8));
            key.set(exchange.getRequestHeaders().getFirst("x-goog-api-key"));
            url.set(exchange.getRequestURI().toString());
            byte[] body = completed(List.of(
                Map.of("thought", true, "text", "private thought"),
                Map.of("text", "{\"answer\":"), Map.of("text", "\"Tư vấn mẫu\"}")
            )).getBytes(StandardCharsets.UTF_8);
            exchange.sendResponseHeaders(200, body.length);
            exchange.getResponseBody().write(body); exchange.close();
        });
        server.start();
        try {
            var client = client(server);
            assertThat(client.generate("shop", Map.of("question", "Áo linen"), schema)
                .orElseThrow().path("answer").asText()).isEqualTo("Tư vấn mẫu");
            var payload = mapper.readTree(received.get());
            var format = payload.path("generationConfig").path("responseFormat").path("text");
            assertThat(format.path("mimeType").asText()).isEqualTo("APPLICATION_JSON");
            assertThat(format.path("schema")).isEqualTo(mapper.valueToTree(schema));
            assertThat(payload.path("generationConfig").path("maxOutputTokens").asInt()).isEqualTo(4096);
            assertThat(payload.path("systemInstruction").path("parts").path(0).path("text").asText())
                .contains("shop", "untrusted data", "Vietnamese");
            assertThat(payload.path("contents").path(0).path("role").asText()).isEqualTo("user");
            assertThat(mapper.readTree(payload.path("contents").path(0).path("parts").path(0).path("text").asText())
                .path("question").asText()).isEqualTo("Áo linen");
            assertThat(received.get()).doesNotContain("dummy-test-key", "Bearer");
            assertThat(url.get()).isEqualTo("/v1beta/models/gemini-3.8-flash:generateContent");
            assertThat(key.get()).isEqualTo("dummy-test-key");
            assertThat(client.mode(true)).isEqualTo("ai");
        } finally { server.stop(0); }
    }

    @Test void malformedBlockedTruncatedAndEmptyResponsesFallBack() throws Exception {
        when(properties.geminiApiKey()).thenReturn("dummy");
        when(properties.geminiModel()).thenReturn("gemini-3.8-flash");
        for (String payload : List.of(
                "invalid json", "null", "{}", "{\"candidates\":[]}",
                "{\"promptFeedback\":{\"blockReason\":\"SAFETY\"}}",
                "{\"candidates\":[{\"finishReason\":\"SAFETY\"}]}",
                completed(List.of(Map.of("text", "{\"answer\":\"partial\"}"))).replace("STOP", "MAX_TOKENS"),
                "{\"candidates\":[{\"finishReason\":\"STOP\",\"safetyRatings\":[{\"blocked\":true}]}]}",
                completed(List.of()), completed(List.of(Map.of("text", "not JSON"))),
                completed(List.of(Map.of("text", "[]"))),
                completed(List.of(Map.of("thought", true, "text", "{\"answer\":\"hidden\"}"))),
                "x".repeat(65_537))) {
            HttpServer server = reply(200, payload);
            try {
                var client = client(server);
                assertThat(client.generate("test", Map.of(), schema)).isEmpty();
                assertThat(client.mode(false)).isEqualTo("fallback");
            } finally { server.stop(0); }
        }
    }

    @Test void providerErrorsAndRateLimitsFallBack() throws Exception {
        when(properties.geminiApiKey()).thenReturn("dummy");
        when(properties.geminiModel()).thenReturn("gemini-3.8-flash");
        for (int status : List.of(400, 401, 403, 429, 503)) {
            HttpServer server = reply(status, "{\"error\":{\"message\":\"test error\"}}");
            try { assertThat(client(server).generate("test", Map.of(), schema)).isEmpty(); }
            finally { server.stop(0); }
        }
        doThrow(new IllegalStateException("Redis unavailable")).when(limits).check(anyString(), anyString(), anyInt(), any());
        assertThat(new AiModelClient(properties, mapper, limits).generate("test", Map.of(), schema)).isEmpty();
    }

    @Test void invalidModelCannotChangeEndpointAndDoesNotLeakSemaphorePermits() throws Exception {
        when(properties.geminiApiKey()).thenReturn("dummy");
        HttpServer server = reply(200, completed(List.of(Map.of("text", "{\"answer\":\"ok\"}"))));
        try {
            var client = client(server);
            for (String model : List.of("https://example.test", "../gemini-3.8-flash", "gemini-test?key=bad", "gemini-test/../../", "")) {
                when(properties.geminiModel()).thenReturn(model);
                assertThat(client.generate("test", Map.of(), schema)).isEmpty();
            }
            verifyNoInteractions(limits);
            when(properties.geminiModel()).thenReturn("gemini-3.8-flash");
            assertThat(client.generate("test", Map.of(), schema)).isPresent();
        } finally { server.stop(0); }
    }

    private String completed(List<Map<String, Object>> parts) {
        return mapper.writeValueAsString(Map.of("candidates", List.of(Map.of("finishReason", "STOP", "content", Map.of("parts", parts)))));
    }

    private HttpServer reply(int status, String payload) throws Exception {
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/v1beta/", exchange -> {
            byte[] body = payload.getBytes(StandardCharsets.UTF_8);
            exchange.sendResponseHeaders(status, body.length);
            exchange.getResponseBody().write(body); exchange.close();
        });
        server.start();
        return server;
    }

    private AiModelClient client(HttpServer server) {
        return new AiModelClient(properties, mapper, limits, HttpClient.newHttpClient(), URI.create("http://127.0.0.1:" + server.getAddress().getPort() + "/v1beta/"));
    }
}

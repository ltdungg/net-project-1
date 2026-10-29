package vn.netfashion.commerce.payment;

import static org.assertj.core.api.Assertions.*;
import com.sun.net.httpserver.HttpServer;
import java.net.InetSocketAddress;
import java.net.URI;
import java.net.http.HttpClient;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.ObjectMapper;
import vn.netfashion.commerce.common.ApiException;

class SepaySandboxClientTest {
    private final String account = UUID.randomUUID().toString();

    @Test void authenticatesInHeaderCachesAccountAndQueriesExactVndAmount() throws Exception {
        List<String> paths = new ArrayList<>();
        List<String> auth = new ArrayList<>();
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/v2/", exchange -> {
            paths.add(exchange.getRequestURI().toString());
            auth.add(exchange.getRequestHeaders().getFirst("Authorization"));
            String data = exchange.getRequestURI().getPath().contains("bank-accounts")
                ? "{\"id\":\""+account+"\",\"active\":\"1\",\"account_number\":\"0000000001\",\"account_holder_name\":\"TEST\",\"bank_short_name\":\"Vietcombank\",\"bank_code\":\"VCB\"}"
                : "[]";
            byte[] body = ("{\"status\":\"success\",\"data\":"+data+"}").getBytes(StandardCharsets.UTF_8);
            exchange.sendResponseHeaders(200, body.length);
            exchange.getResponseBody().write(body); exchange.close();
        });
        server.start();
        try {
            var client = client(server);
            assertThat(client.account(account).number()).isEqualTo("0000000001");
            client.account(account);
            assertThat(client.transactions(account, "NET abc", 458000)).isEmpty();
            assertThat(paths).hasSize(2);
            assertThat(paths.get(1)).contains("q=NET+abc", "amount_in_min=458000", "amount_in_max=458000", "transfer_type=in");
            assertThat(paths.toString()).doesNotContain("fake-test-key");
            assertThat(auth).containsOnly("Bearer fake-test-key");
            assertThatThrownBy(() -> client.transactions(account, "NET", 1)).isInstanceOf(ApiException.class)
                .hasMessageContaining("15 giây");
        } finally { server.stop(0); }
    }

    @Test void errorsAndMalformedResponsesAreSanitized() throws Exception {
        for (int status : List.of(200, 401, 429, 503)) {
            HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
            server.createContext("/v2/", exchange -> {
                byte[] body = "fake-test-key upstream internals".getBytes(StandardCharsets.UTF_8);
                exchange.sendResponseHeaders(status, body.length);
                exchange.getResponseBody().write(body); exchange.close();
            });
            server.start();
            try {
                assertThatThrownBy(() -> client(server).transactions(account, "NET", 1)).isInstanceOf(ApiException.class)
                    .hasMessageNotContaining("fake-test-key").hasMessageNotContaining("internals");
            } finally { server.stop(0); }
        }
    }
    private SepaySandboxClient client(HttpServer server) {
        return new SepaySandboxClient(new SepaySandboxProperties(true, "fake-test-key", account), new ObjectMapper(),
            HttpClient.newHttpClient(), URI.create("http://127.0.0.1:"+server.getAddress().getPort()+"/v2/"));
    }
}

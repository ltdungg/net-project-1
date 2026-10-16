package vn.netfashion.commerce.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertAll;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Stream;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.api.parallel.Execution;
import org.junit.jupiter.api.parallel.ExecutionMode;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.annotation.DirtiesContext;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import vn.netfashion.commerce.account.AccountService;
import vn.netfashion.commerce.auth.AuthPrincipal;
import vn.netfashion.commerce.auth.JwtService;

/**
 * Real HTTP -> security filters -> controller/method security -> committed DB writes.
 * No test transaction: a server-thread commit must remain visible to assertions.
 * Containers are private to this class and removed by Testcontainers; no host DB/Redis.
 * Fixture JWTs use the actual signer, matching persisted users/roles. Auth lifecycle
 * cases obtain cookies via real login/verification endpoints. No security mocks.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = {
    "app.environment=local", "app.local-auth-bypass=false", "app.public-origin=https://security.test",
    "app.jwt-secret=isolated-security-test-signing-key-at-least-32-characters",
    "app.payment-webhook-secret=isolated-security-test-webhook-key",
    "app.admin-emails=bootstrap@security.test", "app.manager-emails=manager-bootstrap@security.test",
    "app.reservation-expiry-initial-delay-ms=86400000", "spring.cache.type=none",
    "server.address=127.0.0.1", "debug=false", "logging.level.root=WARN", "logging.level.org.springframework.jdbc=WARN"
})
@Testcontainers
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
@Execution(ExecutionMode.SAME_THREAD)
class HttpSecurityIntegrationTest {
    private static final String ORIGIN = "https://security.test";
    private static final String PASSWORD = "SecurityTest2026";
    @Container
    static final PostgreSQLContainer POSTGRES = new PostgreSQLContainer("postgres:17-alpine")
        .withDatabaseName("security_it").withUsername("security_it").withPassword("isolated-test-only");
    @Container
    static final GenericContainer<?> REDIS = new GenericContainer<>("redis:7-alpine").withExposedPorts(6379);
    @TempDir
    static java.nio.file.Path uploads;

    @DynamicPropertySource
    static void isolatedDependencies(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
        registry.add("spring.data.redis.host", REDIS::getHost);
        registry.add("spring.data.redis.port", () -> REDIS.getMappedPort(6379));
        registry.add("app.upload-dir", () -> uploads.toString());
    }

    @LocalServerPort int port;
    @Autowired JdbcClient jdbc;
    @Autowired ObjectMapper json;
    @Autowired JwtService jwt;
    @Autowired AccountService accounts;
    @Autowired PasswordEncoder passwords;
    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5))
        .followRedirects(HttpClient.Redirect.NEVER).build();
    private static String passwordHash;
    private List<String> tables;
    private Actor owner;
    private Actor other;
    private Actor staff;
    private Actor manager;
    private Actor admin;

    void initialize() {
        if (passwordHash == null) passwordHash = passwords.encode(PASSWORD);
        tables = jdbc.sql("select tablename from pg_tables where schemaname='public' and tablename<>'flyway_schema_history' order by tablename")
            .query(String.class).list();
        assertThat(tables).contains("users", "customer_orders", "inventory_items", "audit_logs", "outbox_events");
    }

    @BeforeEach
    void fixtures() {
        initialize();
        owner = actor("customer");
        other = actor("customer");
        staff = actor("staff");
        manager = actor("manager");
        admin = actor("admin");
    }

    @AfterEach
    void closeClient() { http.close(); }

    @ParameterizedTest
    @ValueSource(strings = {"/api/auth/me", "/api/account/profile", "/api/account/addresses",
        "/api/account/wishlist", "/api/orders", "/api/admin/orders", "/api/admin/inventory"})
    void anonymousRequestsCannotReadProtectedResources(String path) throws Exception {
        denied("GET", path, null, Map.of(), 401, "AUTH_REQUIRED");
    }

    @ParameterizedTest
    @ValueSource(strings = {"malformed", "tampered-admin", "unsigned-admin", "expired"})
    void invalidTokensCannotAuthenticateOrEscalatePrivileges(String variant) throws Exception {
        String token = switch (variant) {
            case "tampered-admin" -> {
                String[] parts = owner.token().split("\\.");
                String claims = new String(Base64.getUrlDecoder().decode(parts[1]), StandardCharsets.UTF_8)
                    .replace("customer", "admin");
                yield parts[0] + "." + base64(claims) + "." + parts[2];
            }
            case "unsigned-admin" -> base64("{\"alg\":\"none\",\"typ\":\"JWT\"}") + "."
                + base64("{\"sub\":\"" + admin.id() + "\",\"roles\":[\"admin\"],\"exp\":4102444800}") + ".";
            case "expired" -> signedExpiredToken();
            default -> "not-a-jwt";
        };
        denied("GET", "/api/admin/orders", null, Map.of("Authorization", "Bearer " + token), 401, "AUTH_REQUIRED");
    }

    @Test
    void forgedIdentityAndRoleHeadersCannotAuthenticate() throws Exception {
        denied("GET", "/api/admin/orders", null, Map.of(
            "X-User-Id", admin.id(), "X-Role", "admin", "X-Forwarded-User", admin.email(),
            "oai-authenticated-user-id", admin.id(), "oai-authenticated-user-email", admin.email()
        ), 401, "AUTH_REQUIRED");
    }

    @Test
    void expiredCredentialsCannotFallBackToGuestCheckout() throws Exception {
        denied("POST", "/api/orders", orderBody(owner.email()),
            Map.of("Authorization", "Bearer " + signedExpiredToken(), "Origin", ORIGIN), 401, "ACCESS_EXPIRED");
    }

    @Test
    void refreshCookieAloneDoesNotAuthorizeProtectedResources() throws Exception {
        Reply login = login(owner);
        denied("GET", "/api/account/profile", null,
            Map.of("Cookie", "net_refresh_token=" + cookie(login, "net_refresh_token")), 401, "AUTH_REQUIRED");
    }

    @ParameterizedTest
    @ValueSource(strings = {"/api/admin/products", "/api/admin/orders", "/api/admin/customers",
        "/api/admin/fulfillments", "/api/admin/inventory", "/api/admin/inventory/export",
        "/api/admin/promotions", "/api/admin/metrics", "/api/admin/reports/overview", "/api/admin/finance"})
    void customersCannotReadBackofficeEvenWithSpoofedRoleHeaders(String path) throws Exception {
        var headers = new LinkedHashMap<>(bearer(other));
        headers.put("X-Role", "admin");
        headers.put("X-User-Id", admin.id());
        denied("GET", path, null, headers, 403, "FORBIDDEN");
    }

    @ParameterizedTest
    @ValueSource(strings = {"staff", "manager"})
    void onlyAdminMayDisableCustomers(String role) throws Exception {
        denied("PATCH", "/api/admin/customers/" + owner.id() + "/status",
            Map.of("status", "disabled", "reason", "Security test"), bearer(role.equals("staff") ? staff : manager),
            403, "FORBIDDEN");
    }

    @ParameterizedTest
    @ValueSource(strings = {"/api/admin/products/options", "/api/admin/promotions", "/api/admin/metrics",
        "/api/admin/reports/overview", "/api/admin/finance"})
    void staffCannotAccessManagementReadEndpoints(String path) throws Exception {
        denied("GET", path, null, bearer(staff), 403, "FORBIDDEN");
    }

    @Test
    void staffCannotPerformManagerOnlyInventoryAdjustment() throws Exception {
        denied("POST", "/api/admin/inventory/adjust", adjustment(), bearer(staff), 403, "FORBIDDEN");
    }

    @Test
    void customerCannotPerformOtherwiseValidInventoryMutation() throws Exception {
        denied("POST", "/api/admin/inventory/adjust", adjustment(), bearer(other), 403, "FORBIDDEN");
    }

    @Test
    void managerAdjustmentUpdatesBalanceMovementAndAuditForAuthenticatedActor() throws Exception {
        int stock = jdbc.sql("select on_hand from inventory_items where id='inv-hcm-DMA-s'").query(Integer.class).single();
        var command = adjustment();
        command.put("actorUserId", admin.id());
        Reply reply = request("POST", "/api/admin/inventory/adjust", command, bearer(manager));
        assertThat(reply.status()).isEqualTo(200);
        String operation = reply.body().path("data").path("id").asText();
        assertThat(jdbc.sql("select on_hand from inventory_items where id='inv-hcm-DMA-s'").query(Integer.class).single())
            .isEqualTo(stock + 1);
        assertThat(jdbc.sql("select actor_user_id from audit_logs where entity_id=:id and action='inventory.adjust'")
            .param("id", operation).query(String.class).single()).isEqualTo(manager.id());
        assertThat(jdbc.sql("select quantity_delta from inventory_movements where reference_id=:id")
            .param("id", operation).query(Integer.class).single()).isEqualTo(1);
    }

    @Test
    void addressIdorCannotReadUpdateOrDeleteAnotherCustomersAddress() throws Exception {
        Reply created = request("POST", "/api/account/addresses", addressBody(), bearer(owner));
        assertThat(created.status()).isEqualTo(201);
        String id = created.body().path("data").path("id").asText();
        Reply list = request("GET", "/api/account/addresses?userId=" + owner.id(), null, bearer(other));
        assertThat(list.status()).isEqualTo(200);
        assertThat(list.body().path("data").path("items").size()).isZero();
        denied("PATCH", "/api/account/addresses/" + id, addressBody(), bearer(other), 404, "ADDRESS_NOT_FOUND");
        denied("DELETE", "/api/account/addresses/" + id, null, bearer(other), 404, "ADDRESS_NOT_FOUND");
        Reply deleted = request("DELETE", "/api/account/addresses/" + id, null, bearer(owner));
        assertThat(deleted.status()).isEqualTo(200);
        assertThat(jdbc.sql("select count(*) from addresses where id=:id").param("id", id).query(Long.class).single()).isZero();
    }

    @Test
    void profileMassAssignmentCannotChangeOwnershipRolesStatusOrPassword() throws Exception {
        var before = jdbc.sql("select password_hash,status from users where id=:id").param("id", other.id()).query().singleRow();
        var victimBefore = userSnapshot(owner.id());
        var command = new LinkedHashMap<String, Object>(Map.of("fullName", "Updated Name", "phone", "0901234567", "marketingConsent", true));
        command.putAll(Map.of("id", owner.id(), "userId", owner.id(), "email", admin.email(), "roles", List.of("admin"),
            "status", "blocked", "password_hash", "attacker-controlled"));
        Reply reply = request("POST", "/api/account/profile", command, bearer(other));
        assertThat(reply.status()).isEqualTo(200);
        assertThat(reply.body().path("data").path("id").asText()).isEqualTo(other.id());
        assertThat(jdbc.sql("select full_name from users where id=:id").param("id", other.id()).query(String.class).single())
            .isEqualTo("Updated Name");
        assertThat(jdbc.sql("select password_hash,status from users where id=:id").param("id", other.id()).query().singleRow()).isEqualTo(before);
        assertThat(userSnapshot(owner.id())).isEqualTo(victimBefore);
        assertThat(roles(other.id())).containsExactly("customer");
    }

    @Test
    void ordersAndPaymentCannotBeAccessedByAnotherCustomerOrAdminQueryFlag() throws Exception {
        String order = createOrder(owner);
        denied("GET", "/api/orders/" + order + "?admin=true&userId=" + owner.id(), null, bearer(other), 404, "ORDER_NOT_FOUND");
        denied("POST", "/api/payments/mock/confirm", Map.of("orderId", order), bearer(other), 404, "PAYMENT_NOT_FOUND");
        Reply list = request("GET", "/api/orders?userId=" + owner.id(), null, bearer(other));
        assertThat(list.status()).isEqualTo(200);
        assertThat(list.body().path("data").path("items").size()).isZero();
        Reply owned = request("GET", "/api/orders/" + order, null, bearer(owner));
        assertThat(owned.status()).isEqualTo(200);
        assertThat(owned.body().path("data").path("id").asText()).isEqualTo(order);
    }

    @Test
    void guestOrderTokenIsBoundToItsOrderAndTamperingDoesNotDiscloseDetails() throws Exception {
        Reply created = request("POST", "/api/orders", orderBody(owner.email()), Map.of("Origin", ORIGIN));
        assertThat(created.status()).isEqualTo(201);
        String id = created.body().path("data").path("id").asText();
        String token = created.body().path("data").path("guestAccessToken").asText();
        String memberOrder = createOrder(other);
        denied("GET", "/api/orders/" + memberOrder + "/guest", null, Map.of("X-Guest-Order-Token", token), 404, "ORDER_NOT_FOUND");
        denied("GET", "/api/orders/" + id + "/guest", null, Map.of("X-Guest-Order-Token", token + "tampered"), 404, "ORDER_NOT_FOUND");
        Reply owned = request("GET", "/api/orders/" + id + "/guest", null, Map.of("X-Guest-Order-Token", token));
        assertThat(owned.status()).isEqualTo(200);
        assertThat(owned.body().path("data").path("id").asText()).isEqualTo(id);
    }

    @Test
    void wishlistOwnershipCannotBeOverriddenByPayloadOrQuery() throws Exception {
        String product = jdbc.sql("select product_id from product_variants where id='ALM-s'").query(String.class).single();
        assertThat(request("POST", "/api/account/wishlist", Map.of("productId", product), bearer(owner)).status()).isEqualTo(201);
        denied("DELETE", "/api/account/wishlist/" + product + "?userId=" + owner.id(), null, bearer(other), 404, "WISHLIST_ITEM_NOT_FOUND");
        Reply list = request("GET", "/api/account/wishlist?userId=" + owner.id(), null, bearer(other));
        assertThat(list.status()).isEqualTo(200);
        assertThat(list.body().path("data").path("items").size()).isZero();
        assertThat(request("POST", "/api/account/wishlist", Map.of("productId", product, "userId", owner.id()), bearer(other)).status()).isEqualTo(201);
        assertThat(jdbc.sql("select user_id from wishlist_items where product_id=:id and user_id in (:owner,:other) order by user_id")
            .params(Map.of("id", product, "owner", owner.id(), "other", other.id())).query(String.class).list())
            .containsExactlyInAnyOrder(owner.id(), other.id());
    }

    @Test
    void cartItemIdIsNotEnoughToMutateAnotherSessionsCart() throws Exception {
        Reply created = request("POST", "/api/cart", Map.of("variantId", "ALM-s", "quantity", 1), Map.of("Origin", ORIGIN));
        assertThat(created.status()).isEqualTo(200);
        String item = created.body().path("data").path("items").get(0).path("id").asText();
        var wrongCookie = Map.of("Cookie", "net_cart=" + UUID.randomUUID(), "Origin", ORIGIN);
        denied("PATCH", "/api/cart/items/" + item, Map.of("quantity", 2), wrongCookie, 404, "CART_ITEM_NOT_FOUND");
        denied("DELETE", "/api/cart/items/" + item, null, wrongCookie, 404, "CART_ITEM_NOT_FOUND");
        Reply updated = request("PATCH", "/api/cart/items/" + item, Map.of("quantity", 2),
            Map.of("Cookie", "net_cart=" + cookie(created, "net_cart"), "Origin", ORIGIN));
        assertThat(updated.status()).isEqualTo(200);
        assertThat(jdbc.sql("select quantity from cart_items where id=:id").param("id", item).query(Integer.class).single()).isEqualTo(2);
    }

    @ParameterizedTest
    @MethodSource("invalidCheckoutInputs")
    void invalidCheckoutCannotCreateOrdersPaymentsReservationsOrOutbox(String field, Object value) throws Exception {
        var body = orderBody(owner.email());
        body.put(field, value);
        denied("POST", "/api/orders", body, bearer(owner), 422, "VALIDATION_ERROR");
    }

    static Stream<Arguments> invalidCheckoutInputs() {
        return Stream.of(Arguments.of("email", "not-email"), Arguments.of("phone", "123"),
            Arguments.of("shippingAddress", null), Arguments.of("items", List.of()),
            Arguments.of("items", List.of(Map.of("variantId", "ALM-s", "quantity", 0))),
            Arguments.of("items", List.of(Map.of("variantId", "ALM-s", "quantity", 11))),
            Arguments.of("paymentMethod", "free"), Arguments.of("idempotencyKey", " "));
    }

    @Test
    void malformedJsonCannotMutateProfile() throws Exception {
        denied("POST", "/api/account/profile", "{bad-json", bearer(owner), 400, "INVALID_JSON");
    }

    @Test
    void webhookWithForgedSignatureCannotChangePaymentsOrStock() throws Exception {
        String order = createOrder(owner);
        String payment = jdbc.sql("select id from payments where order_id=:id").param("id", order).query(String.class).single();
        denied("POST", "/api/payments/webhook", Map.of("id", UUID.randomUUID().toString(), "paymentId", payment,
            "type", "payment.succeeded", "amountCents", 1, "currency", "VND"),
            Map.of("x-provider-signature", "00".repeat(32)), 401, "INVALID_SIGNATURE");
    }

    @ParameterizedTest
    @ValueSource(strings = {"missing-origin", "cross-site", "invalid-bearer-with-cookie"})
    void cookieMutationsCannotBypassOriginProtection(String scenario) throws Exception {
        var headers = new LinkedHashMap<String, String>();
        headers.put("Cookie", "net_access_token=" + owner.token());
        if (scenario.equals("cross-site")) {
            headers.put("Origin", ORIGIN);
            headers.put("Sec-Fetch-Site", "cross-site");
        }
        if (scenario.equals("invalid-bearer-with-cookie")) headers.put("Authorization", "Basic ignored");
        denied("POST", "/api/account/profile", Map.of("fullName", "Cross Site", "phone", "0901234567", "marketingConsent", false), headers, 403, "ORIGIN_FORBIDDEN");
    }

    @Test
    void authenticatedOwnerCookieWithTrustedOriginCanUpdateOnlyOwnProfile() throws Exception {
        var victimBefore = userSnapshot(other.id());
        Reply reply = request("POST", "/api/account/profile", Map.of("fullName", "Cookie Owner", "phone", "0901234567", "marketingConsent", false),
            Map.of("Cookie", "net_access_token=" + owner.token(), "Origin", ORIGIN));
        assertThat(reply.status()).isEqualTo(200);
        assertThat(reply.body().path("data").path("id").asText()).isEqualTo(owner.id());
        assertThat(userSnapshot(other.id())).isEqualTo(victimBefore);
        assertThat(jdbc.sql("select full_name from users where id=:id").param("id", owner.id()).query(String.class).single()).isEqualTo("Cookie Owner");
    }

    @Test
    void refreshRotationAndLogoutRevokeStoredTokensAndRejectReplay() throws Exception {
        Reply login = login(owner);
        String first = cookie(login, "net_refresh_token");
        assertThat(login.headers().allValues("set-cookie")).allSatisfy(value -> assertThat(value).contains("HttpOnly", "SameSite=Strict"));
        assertThat(jdbc.sql("select token_hash from refresh_tokens where user_id=:id").param("id", owner.id()).query(String.class).list())
            .containsExactly(jwt.hash(first)).doesNotContain(first);
        Reply rotated = request("POST", "/api/auth/refresh", null, Map.of("Origin", ORIGIN, "Cookie", "net_refresh_token=" + first));
        assertThat(rotated.status()).isEqualTo(200);
        String second = cookie(rotated, "net_refresh_token");
        assertThat(second).isNotEqualTo(first);
        assertThat(activeRefreshTokens(owner.id())).isEqualTo(1);
        assertThat(jdbc.sql("select revoked_at is not null from refresh_tokens where token_hash=:hash")
            .param("hash", jwt.hash(first)).query(Boolean.class).single()).isTrue();
        denied("POST", "/api/auth/refresh", null, Map.of("Origin", ORIGIN, "Cookie", "net_refresh_token=" + first), 401, "REFRESH_EXPIRED");
        Reply logout = request("POST", "/api/auth/logout", null, Map.of("Origin", ORIGIN, "Cookie", "net_refresh_token=" + second));
        assertThat(logout.status()).isEqualTo(200);
        assertThat(logout.headers().allValues("set-cookie")).hasSize(2).allSatisfy(value -> assertThat(value).contains("Max-Age=0"));
        assertThat(activeRefreshTokens(owner.id())).isZero();
        denied("POST", "/api/auth/refresh", null, Map.of("Origin", ORIGIN, "Cookie", "net_refresh_token=" + second), 401, "REFRESH_EXPIRED");
    }

    @Test
    void wrongPasswordDoesNotIssueTokensOrChangeOtherUsers() throws Exception {
        denied("POST", "/api/auth/login", Map.of("email", owner.email(), "password", "WrongPassword123"),
            Map.of("Origin", ORIGIN), 401, "INVALID_CREDENTIALS");
    }

    @ParameterizedTest
    @MethodSource("adminWrites")
    void customerCannotReachPrivilegedWritesEvenWithRoleAndMethodOverrideHeaders(String method, String path) throws Exception {
        var headers = new LinkedHashMap<>(bearer(other));
        headers.put("X-Role", "admin");
        headers.put("X-User-Id", admin.id());
        headers.put("X-HTTP-Method-Override", "GET");
        denied(method, path, Map.of(), headers, 403, "FORBIDDEN");
    }

    static Stream<Arguments> adminWrites() {
        return Stream.of(Arguments.of("POST", "/api/admin/products"),
            Arguments.of("POST", "/api/admin/promotions"), Arguments.of("POST", "/api/admin/uploads"),
            Arguments.of("POST", "/api/admin/inventory/receipts"), Arguments.of("POST", "/api/admin/inventory/transfers"),
            Arguments.of("POST", "/api/admin/inventory/counts"), Arguments.of("PATCH", "/api/admin/fulfillments/unknown/status"),
            Arguments.of("PATCH", "/api/admin/fulfillments/unknown/tracking"));
    }

    @ParameterizedTest
    @ValueSource(strings = {"fullName", "phone"})
    void invalidProfileDoesNotChangeUser(String field) throws Exception {
        var command = new LinkedHashMap<String, Object>(Map.of("fullName", "Valid Name", "phone", "0901234567", "marketingConsent", false));
        command.put(field, field.equals("fullName") ? " " : "invalid-phone");
        denied("POST", "/api/account/profile", command, bearer(owner), 422, "VALIDATION_ERROR");
    }

    @ParameterizedTest
    @ValueSource(strings = {"recipientName", "phone", "line1", "province"})
    void invalidAddressDoesNotInsertOrChangeDefaultAddress(String field) throws Exception {
        assertThat(request("POST", "/api/account/addresses", addressBody(), bearer(owner)).status()).isEqualTo(201);
        var command = new LinkedHashMap<>(addressBody());
        command.put(field, "");
        denied("POST", "/api/account/addresses", command, bearer(owner), 422, "VALIDATION_ERROR");
    }

    @Test
    void registrationCannotInjectAdminRoleAndVerificationTokenIsOneTime() throws Exception {
        String email = UUID.randomUUID() + "@security.test";
        var registration = registrationBody(email);
        registration.putAll(Map.of("roles", List.of("admin"), "role", "admin", "status", "active", "id", admin.id()));
        Reply registered = request("POST", "/api/auth/register", registration, Map.of("Origin", ORIGIN));
        assertThat(registered.status()).isEqualTo(202);
        String id = registered.body().path("data").path("userId").asText();
        String token = registered.body().path("data").path("developmentVerificationToken").asText();
        assertThat(id).isNotEqualTo(admin.id());
        assertThat(token).isNotBlank();
        assertThat(roles(id)).containsExactly("customer");
        assertThat(jdbc.sql("select status from users where id=:id").param("id", id).query(String.class).single()).isEqualTo("pending");
        denied("POST", "/api/auth/login", Map.of("email", email, "password", PASSWORD), Map.of("Origin", ORIGIN), 403, "EMAIL_NOT_VERIFIED");
        Reply verified = request("POST", "/api/auth/verify-email", Map.of("token", token), Map.of("Origin", ORIGIN));
        assertThat(verified.status()).isEqualTo(200);
        assertThat(jdbc.sql("select email_verified_at is not null and status='active' from users where id=:id")
            .param("id", id).query(Boolean.class).single()).isTrue();
        assertThat(jdbc.sql("select consumed_at is not null from auth_tokens where token_hash=:hash")
            .param("hash", jwt.hash(token)).query(Boolean.class).single()).isTrue();
        denied("POST", "/api/auth/verify-email", Map.of("token", token), Map.of("Origin", ORIGIN), 422, "VERIFY_TOKEN_INVALID");
        denied("GET", "/api/admin/orders", null,
            Map.of("Cookie", "net_access_token=" + cookie(verified, "net_access_token")), 403, "FORBIDDEN");
    }

    @ParameterizedTest
    @MethodSource("invalidRegistrations")
    void invalidRegistrationCannotCreateUsersRolesOrAuthTokens(String field, Object value) throws Exception {
        var command = registrationBody(UUID.randomUUID() + "@security.test");
        command.put(field, value);
        denied("POST", "/api/auth/register", command, Map.of("Origin", ORIGIN), 422, "VALIDATION_ERROR");
    }

    static Stream<Arguments> invalidRegistrations() {
        return Stream.of(Arguments.of("email", "invalid"), Arguments.of("password", "weak"),
            Arguments.of("password", "A1" + "a".repeat(71)), Arguments.of("acceptedTerms", false),
            Arguments.of("phone", "123"), Arguments.of("fullName", " "));
    }

    @Test
    void resetTokenCannotChangeAnotherUsersPasswordAndCannotBeReplayed() throws Exception {
        login(owner);
        var otherBefore = userSnapshot(other.id());
        Reply forgot = request("POST", "/api/auth/forgot-password", Map.of("email", owner.email()), Map.of("Origin", ORIGIN));
        assertThat(forgot.status()).isEqualTo(202);
        String token = forgot.body().path("data").path("developmentToken").asText();
        assertThat(token).isNotBlank();
        // Token purpose is checked before any consumption or user update.
        denied("POST", "/api/auth/verify-email", Map.of("token", token), Map.of("Origin", ORIGIN), 422, "VERIFY_TOKEN_INVALID");
        denied("POST", "/api/auth/reset-password", Map.of("token", token + "x", "newPassword", "ChangedPassword2026"),
            Map.of("Origin", ORIGIN), 422, "RESET_TOKEN_INVALID");
        Reply reset = request("POST", "/api/auth/reset-password", Map.of("token", token, "newPassword", "ChangedPassword2026",
            "userId", other.id(), "email", other.email()), Map.of("Origin", ORIGIN));
        assertThat(reset.status()).isEqualTo(200);
        assertThat(userSnapshot(other.id())).isEqualTo(otherBefore);
        assertThat(activeRefreshTokens(owner.id())).isZero();
        String hash = jdbc.sql("select password_hash from users where id=:id").param("id", owner.id()).query(String.class).single();
        assertThat(passwords.matches("ChangedPassword2026", hash)).isTrue();
        denied("POST", "/api/auth/reset-password", Map.of("token", token, "newPassword", PASSWORD), Map.of("Origin", ORIGIN), 422, "RESET_TOKEN_INVALID");
        denied("POST", "/api/auth/login", Map.of("email", owner.email(), "password", PASSWORD), Map.of("Origin", ORIGIN), 401, "INVALID_CREDENTIALS");
        assertThat(request("POST", "/api/auth/login", Map.of("email", owner.email(), "password", "ChangedPassword2026"),
            Map.of("Origin", ORIGIN)).status()).isEqualTo(200);
    }

    @ParameterizedTest
    @ValueSource(strings = {"verify_email", "password_reset"})
    void expiredActionTokensCannotBeConsumed(String purpose) throws Exception {
        String rawToken = jwt.randomRefreshToken();
        jdbc.sql("insert into auth_tokens(id,user_id,type,token_hash,expires_at) values(:id,:user,:type,:hash,now()-interval '1 hour')")
            .params(Map.of("id", UUID.randomUUID().toString(), "user", owner.id(), "type", purpose, "hash", jwt.hash(rawToken))).update();
        if (purpose.equals("verify_email")) {
            denied("POST", "/api/auth/verify-email", Map.of("token", rawToken), Map.of("Origin", ORIGIN), 422, "VERIFY_TOKEN_INVALID");
        } else {
            denied("POST", "/api/auth/reset-password", Map.of("token", rawToken, "newPassword", "ChangedPassword2026"),
                Map.of("Origin", ORIGIN), 422, "RESET_TOKEN_INVALID");
        }
    }

    @Test
    void redisRateLimitRejectsEleventhLoginAttemptWithoutIssuingTokens() throws Exception {
        var credentials = Map.of("email", owner.email(), "password", "IncorrectPassword123");
        for (int attempt = 0; attempt < 10; attempt++) {
            denied("POST", "/api/auth/login", credentials, Map.of("Origin", ORIGIN), 401, "INVALID_CREDENTIALS");
        }
        denied("POST", "/api/auth/login", credentials, Map.of("Origin", ORIGIN), 429, "AUTH_RATE_LIMITED");
    }

    @Test
    void checkoutOwnerAndPricesCannotBeOverriddenAndIdempotencyIsUserScoped() throws Exception {
        var body = orderBody(owner.email());
        Reply first = request("POST", "/api/orders", body, bearer(owner));
        assertThat(first.status()).isEqualTo(201);
        String firstId = first.body().path("data").path("id").asText();
        body.putAll(Map.of("userId", owner.id(), "status", "delivered", "paymentStatus", "paid", "grandTotalCents", 0));
        Reply second = request("POST", "/api/orders", body, bearer(other));
        assertThat(second.status()).isEqualTo(201);
        String secondId = second.body().path("data").path("id").asText();
        assertThat(secondId).isNotEqualTo(firstId);
        assertThat(jdbc.sql("select user_id from customer_orders where id=:id").param("id", secondId).query(String.class).single()).isEqualTo(other.id());
        assertThat(jdbc.sql("select status from customer_orders where id=:id").param("id", secondId).query(String.class).single()).isEqualTo("pending_payment");
        long expected = jdbc.sql("select price_cents from product_variants where id='QCV-s'").query(Long.class).single();
        assertThat(jdbc.sql("select subtotal_cents from customer_orders where id=:id").param("id", secondId).query(Long.class).single()).isEqualTo(expected);
        denied("GET", "/api/orders/" + firstId, null, bearer(other), 404, "ORDER_NOT_FOUND");
    }

    @Test
    void staffMayReadOperationalOrdersButCustomerCannotChangeTheirStatus() throws Exception {
        String id = createOrder(owner);
        var before = databaseSnapshot();
        Reply read = request("GET", "/api/admin/orders/" + id, null, bearer(staff));
        assertThat(read.status()).isEqualTo(200);
        assertThat(read.body().path("data").path("id").asText()).isEqualTo(id);
        assertThat(databaseSnapshot()).isEqualTo(before);
        denied("PATCH", "/api/admin/orders/" + id + "/status", Map.of("status", "cancelled", "reason", "Unauthorized cancellation"),
            bearer(other), 403, "FORBIDDEN");
    }

    @Test
    void removingManagerRoleMustPreventFurtherPrivilegedWritesWithExistingToken() throws Exception {
        jdbc.sql("delete from user_roles where user_id=:id and role_id in (select id from roles where code='manager')")
            .param("id", manager.id()).update();
        assertThat(roles(manager.id())).containsExactly("customer");
        assertAll("Revoked role must neither authorize a write nor be restored from JWT claims",
            () -> denied("POST", "/api/admin/inventory/adjust", adjustment(), bearer(manager), 403, "FORBIDDEN"),
            () -> assertThat(roles(manager.id())).containsExactly("customer"));
    }

    @Test
    void adminDisablingCustomerRevokesRefreshAndPreventsFurtherWritesWithExistingAccessToken() throws Exception {
        login(owner);
        Reply disabled = request("PATCH", "/api/admin/customers/" + owner.id() + "/status",
            Map.of("status", "disabled", "reason", "Security suspension"), bearer(admin));
        assertThat(disabled.status()).isEqualTo(200);
        assertThat(activeRefreshTokens(owner.id())).isZero();
        assertThat(jdbc.sql("select status from users where id=:id").param("id", owner.id()).query(String.class).single()).isEqualTo("blocked");
        assertThat(jdbc.sql("select actor_user_id from audit_logs where entity_id=:id and action='customer.status.change'")
            .param("id", owner.id()).query(String.class).single()).isEqualTo(admin.id());
        denied("POST", "/api/account/profile", Map.of("fullName", "Blocked Writer", "phone", "0901234567", "marketingConsent", false),
            bearer(owner), 401, "ACCOUNT_DISABLED");
    }

    private Actor actor(String role) {
        String id = UUID.randomUUID().toString();
        Set<String> roles = role.equals("customer") ? Set.of("customer") : Set.of("customer", role);
        AuthPrincipal principal = new AuthPrincipal(id, id + "@security.test", "Security Fixture", roles);
        accounts.ensure(principal);
        jdbc.sql("update users set email_verified_at=now(),password_hash=:hash where id=:id")
            .params(Map.of("hash", passwordHash, "id", id)).update();
        return new Actor(id, principal.email(), jwt.accessToken(principal));
    }

    private String signedExpiredToken() throws Exception {
        String[] parts = owner.token().split("\\.");
        var claims = json.readTree(Base64.getUrlDecoder().decode(parts[1]));
        ((tools.jackson.databind.node.ObjectNode) claims).put("exp", 1);
        String unsigned = parts[0] + "." + base64(json.writeValueAsString(claims));
        javax.crypto.Mac mac = javax.crypto.Mac.getInstance("HmacSHA256");
        mac.init(new javax.crypto.spec.SecretKeySpec("isolated-security-test-signing-key-at-least-32-characters".getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        return unsigned + "." + Base64.getUrlEncoder().withoutPadding().encodeToString(mac.doFinal(unsigned.getBytes(StandardCharsets.US_ASCII)));
    }

    private static String base64(String value) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(value.getBytes(StandardCharsets.UTF_8));
    }

    private Map<String, String> bearer(Actor actor) {
        return Map.of("Authorization", "Bearer " + actor.token(), "Origin", ORIGIN);
    }

    private Reply login(Actor actor) throws Exception {
        Reply reply = request("POST", "/api/auth/login", Map.of("email", actor.email(), "password", PASSWORD), Map.of("Origin", ORIGIN));
        assertThat(reply.status()).as("fixture login").isEqualTo(200);
        return reply;
    }

    private String cookie(Reply reply, String name) {
        return reply.headers().allValues("set-cookie").stream().filter(c -> c.startsWith(name + "="))
            .map(c -> c.substring(name.length() + 1, c.indexOf(';'))).findFirst().orElseThrow();
    }

    private long activeRefreshTokens(String id) {
        return jdbc.sql("select count(*) from refresh_tokens where user_id=:id and revoked_at is null")
            .param("id", id).query(Long.class).single();
    }

    private List<String> roles(String id) {
        return jdbc.sql("select r.code from roles r join user_roles ur on r.id=ur.role_id where ur.user_id=:id order by r.code")
            .param("id", id).query(String.class).list();
    }

    private String userSnapshot(String id) {
        return jdbc.sql("select md5(to_jsonb(u)::text) from users u where id=:id").param("id", id).query(String.class).single();
    }

    private Map<String, Object> addressBody() {
        return Map.of("label", "Home", "recipientName", "Security Owner", "phone", "0901234567", "line1", "1 Test Street",
            "ward", "Ward 1", "district", "District 1", "province", "HCM", "isDefault", true);
    }

    private Map<String, Object> registrationBody(String email) {
        return new LinkedHashMap<>(Map.of("email", email, "password", PASSWORD, "fullName", "New Customer",
            "phone", "0901234567", "acceptedTerms", true, "marketingConsent", false));
    }

    private Map<String, Object> orderBody(String email) {
        return new LinkedHashMap<>(Map.of("email", email, "phone", "0901234567", "paymentMethod", "online",
            "idempotencyKey", UUID.randomUUID().toString(), "shippingAddress", addressBody(),
            "items", List.of(Map.of("variantId", "QCV-s", "quantity", 1))));
    }

    private Map<String, Object> adjustment() {
        return new LinkedHashMap<>(Map.of("inventoryItemId", "inv-hcm-DMA-s", "quantityDelta", 1,
            "idempotencyKey", UUID.randomUUID().toString(), "reason", "Security integration test"));
    }

    private String createOrder(Actor actor) throws Exception {
        Reply reply = request("POST", "/api/orders", orderBody(actor.email()), bearer(actor));
        assertThat(reply.status()).as("fixture checkout: %s", reply.body()).isEqualTo(201);
        return reply.body().path("data").path("id").asText();
    }

    /** Compare full rows, not just counts: detect unauthorized updates/deletes and audit/outbox leaks. */
    private Map<String, String> databaseSnapshot() {
        var result = new LinkedHashMap<String, String>();
        for (String table : tables) {
            if (!table.matches("[a-z_]+")) throw new IllegalStateException("Unexpected test table name");
            result.put(table, jdbc.sql("select md5(coalesce(jsonb_agg(to_jsonb(t) order by to_jsonb(t)::text),'[]'::jsonb)::text) from public.\""
                + table + "\" t").query(String.class).single());
        }
        return result;
    }

    private void denied(String method, String path, Object body, Map<String, String> headers, int status, String code) throws Exception {
        Map<String, String> before = databaseSnapshot();
        Reply reply = request(method, path, body, headers);
        Map<String, String> after = databaseSnapshot();
        List<String> changedTables = before.keySet().stream().filter(table -> !before.get(table).equals(after.get(table))).toList();
        assertAll(method + " " + path,
            () -> assertThat(reply.status()).as("HTTP response: %s", reply.body()).isEqualTo(status),
            () -> assertThat(reply.body().path("error").path("code").asText()).isEqualTo(code),
            () -> assertThat(reply.body().path("data").isNull() || reply.body().path("data").isMissingNode()).isTrue(),
            () -> assertThat(changedTables).as("Tables with unexpected committed database side effects").isEmpty());
    }

    private Reply request(String method, String path, Object body, Map<String, String> headers) throws Exception {
        HttpRequest.Builder builder = HttpRequest.newBuilder(URI.create("http://127.0.0.1:" + port + path))
            .timeout(Duration.ofSeconds(15)).header("Accept", "application/json");
        headers.forEach(builder::header);
        String raw = body == null ? "" : body instanceof String value ? value : json.writeValueAsString(body);
        if (body != null) builder.header("Content-Type", "application/json");
        HttpResponse<String> reply = http.send(builder.method(method, body == null ? HttpRequest.BodyPublishers.noBody()
            : HttpRequest.BodyPublishers.ofString(raw)).build(), HttpResponse.BodyHandlers.ofString());
        return new Reply(reply.statusCode(), json.readTree(reply.body()), reply.headers());
    }

    private record Actor(String id, String email, String token) {}
    private record Reply(int status, JsonNode body, java.net.http.HttpHeaders headers) {}
}

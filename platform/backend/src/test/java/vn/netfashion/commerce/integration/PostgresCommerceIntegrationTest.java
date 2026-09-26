package vn.netfashion.commerce.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;
import vn.netfashion.commerce.fulfillment.AdminFulfillmentService;
import vn.netfashion.commerce.auth.AuthPrincipal;
import vn.netfashion.commerce.auth.AuthService;
import vn.netfashion.commerce.common.ApiException;
import vn.netfashion.commerce.admin.report.AdminReportService;
import vn.netfashion.commerce.admincustomer.AdminCustomerService;
import vn.netfashion.commerce.adminorder.AdminOrderService;
import vn.netfashion.commerce.order.OrderService;

/**
 * Exercises the critical commerce path against the same PostgreSQL dialect used
 * in production. The class is skipped, rather than failed, on developer or CI
 * machines where a Docker-compatible runtime is not available.
 */
@SpringBootTest(
    webEnvironment = SpringBootTest.WebEnvironment.MOCK,
    properties = {
        "spring.cache.type=none",
        "management.health.redis.enabled=false",
        "app.environment=local",
        "app.local-auth-bypass=false"
    }
)
@Testcontainers(disabledWithoutDocker = true)
class PostgresCommerceIntegrationTest {

    @Container
    static final PostgreSQLContainer POSTGRES = new PostgreSQLContainer("postgres:16-alpine")
        .withDatabaseName("net_commerce_it")
        .withUsername("net_it")
        .withPassword("net_it_password");

    @DynamicPropertySource
    static void postgresProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
    }

    @Autowired
    JdbcClient jdbc;

    @Autowired
    OrderService orders;

    @Autowired
    AdminFulfillmentService fulfillments;

    @Autowired
    AdminOrderService adminOrders;

    @Autowired
    AdminCustomerService customers;

    @Autowired
    AuthService auth;

    @Autowired
    AdminReportService reports;

    @Test
    @Transactional
    void flywayCreatesHardenedSchemaAndSeedsReferenceCatalog() {
        Integer successfulMigrations = jdbc.sql("""
            select count(*)::integer from flyway_schema_history where success
            """).query(Integer.class).single();
        String latestVersion = jdbc.sql("""
            select version from flyway_schema_history
            where success and version is not null order by installed_rank desc limit 1
            """).query(String.class).single();
        Integer idempotencyColumn = jdbc.sql("""
            select count(*)::integer from information_schema.columns
            where table_schema='public' and table_name='customer_orders'
              and column_name='idempotency_key' and is_nullable='NO'
            """).query(Integer.class).single();

        assertThat(successfulMigrations).isGreaterThanOrEqualTo(7);
        assertThat(Integer.parseInt(latestVersion)).isGreaterThanOrEqualTo(7);
        assertThat(idempotencyColumn).isOne();
        assertThat(jdbc.sql("select count(*) from roles").query(Long.class).single()).isEqualTo(4);
        assertThat(jdbc.sql("select count(*) from products").query(Long.class).single()).isEqualTo(22);
        assertThat(jdbc.sql("select count(*) from product_variants").query(Long.class).single()).isEqualTo(58);
        assertThat(jdbc.sql("select count(*) from warehouses").query(Long.class).single()).isEqualTo(2);
        assertThat(jdbc.sql("select count(*) from coupons").query(Long.class).single()).isEqualTo(3);
        assertThat(jdbc.sql("""
            select count(*) from information_schema.tables
            where table_schema='public' and table_name in ('fulfillments','fulfillment_items','fulfillment_events')
            """).query(Long.class).single()).isEqualTo(3);
        assertThat(jdbc.sql("""
            select count(*) from information_schema.views
            where table_schema='public' and table_name='admin_customer_segments'
            """).query(Long.class).single()).isOne();
    }

    @Test
    void accountRequiresEmailVerificationAndResetTokenIsOneTime() {
        String suffix = UUID.randomUUID().toString();
        String email = "member-" + suffix + "@example.test";
        String firstPassword = "NetShop2026";
        String secondPassword = "NetShop2027";

        AuthService.Registration registration = auth.register(
            email,
            firstPassword,
            "Nguyen Thanh Vien",
            "0901234567",
            true
        );
        assertThat(registration.verificationRequired()).isTrue();
        assertThat(registration.developmentVerificationToken()).isNotBlank();
        assertThat(jdbc.sql("select status from users where id=:id")
            .param("id", registration.userId()).query(String.class).single()).isEqualTo("pending");
        assertThatThrownBy(() -> auth.login(email, firstPassword))
            .isInstanceOf(ApiException.class)
            .hasMessageContaining("xác minh");

        AuthService.Tokens verified = auth.verifyEmail(registration.developmentVerificationToken());
        assertThat(verified.user().email()).isEqualTo(email);
        assertThat(jdbc.sql("select email_verified_at is not null from users where id=:id")
            .param("id", registration.userId()).query(Boolean.class).single()).isTrue();
        assertThatThrownBy(() -> auth.verifyEmail(registration.developmentVerificationToken()))
            .isInstanceOf(ApiException.class);

        AuthService.Action forgot = auth.forgotPassword(email);
        assertThat(forgot.developmentToken()).isNotBlank();
        auth.resetPassword(forgot.developmentToken(), secondPassword);
        assertThatThrownBy(() -> auth.resetPassword(forgot.developmentToken(), firstPassword))
            .isInstanceOf(ApiException.class);
        assertThatThrownBy(() -> auth.login(email, firstPassword)).isInstanceOf(ApiException.class);
        assertThat(auth.login(email, secondPassword).user().id()).isEqualTo(registration.userId());
    }

    @Test
    @Transactional
    void localBypassPlaceholderCanBeClaimedThroughVerifiedRegistration() {
        jdbc.sql("""
            insert into users(id,email,full_name,status,email_verified_at)
            values('local-owner@example.com','owner@example.com','Local Owner','active',now())
            on conflict(id) do nothing
            """).update();
        jdbc.sql("""
            insert into user_roles(user_id,role_id)
            select 'local-owner@example.com',id from roles where code='customer'
            on conflict do nothing
            """).update();

        AuthService.Registration registration = auth.register(
            "owner@example.com",
            "OwnerNet2026",
            "Chu cua hang",
            "0901234567",
            false
        );
        assertThat(registration.userId()).isEqualTo("local-owner@example.com");
        AuthService.Tokens verified = auth.verifyEmail(registration.developmentVerificationToken());
        assertThat(verified.user().roles()).contains("admin", "manager", "staff", "customer");
    }

    @Test
    @Transactional
    void guestOrderCanOnlyBeReadWithItsSignedAccessToken() {
        String suffix = UUID.randomUUID().toString();
        String email = "guest-" + suffix + "@example.test";
        Map<String, Object> created = orders.create(
            orderCommand(email, "cod", "guest-access-" + suffix, "QCV-s", 1),
            null,
            "guest-cart-" + suffix,
            "it-guest-" + suffix
        );
        String orderId = String.valueOf(created.get("id"));
        String token = String.valueOf(created.get("guestAccessToken"));

        assertThat(token).isNotBlank();
        Map<String, Object> detail = orders.guestDetail(orderId, token);
        assertThat(detail.get("orderNumber")).isEqualTo(created.get("orderNumber"));
        assertThat((List<?>) detail.get("fulfillments")).hasSize(1);
        assertThatThrownBy(() -> orders.guestDetail(orderId, token + "x"))
            .isInstanceOf(ApiException.class);
    }

    @Test
    @Transactional
    void emptyAdminOverviewUsesValidPostgresDailySeriesQuery() {
        AdminReportService.Overview overview = reports.overview("2026-01-01", "2026-01-03");
        assertThat(overview.salesDaily()).hasSize(3);
        assertThat(overview.kpis().orders()).isGreaterThanOrEqualTo(0);
    }

    @Test
    @Transactional
    void disabledCustomerFilterIncludesTemporaryAndLegacyStorageStatuses() {
        String suffix = UUID.randomUUID().toString();
        String userId = "it-locked-" + suffix;
        String email = "locked-" + suffix + "@example.test";
        jdbc.sql("""
            insert into users(id,email,full_name,status,email_verified_at,locked_until)
            values(:id,:email,'Locked Customer','locked',now(),now()+interval '10 minutes')
            """).params(Map.of("id", userId, "email", email)).update();
        jdbc.sql("""
            insert into user_roles(user_id,role_id)
            select :userId,id from roles where code='customer'
            """).param("userId", userId).update();

        Map<String, Object> result = customers.list(email, "disabled", null, 25, 0);

        assertThat(result.get("total")).isEqualTo(1L);
        List<?> items = (List<?>) result.get("items");
        assertThat(items).hasSize(1);
        assertThat(((Map<?, ?>) items.getFirst()).get("status")).isEqualTo("disabled");
    }

    @Test
    @Transactional
    void onlineCheckoutReplayReturnsSameOrderWithoutDuplicatingPersistence() {
        String suffix = UUID.randomUUID().toString();
        String email = "checkout-" + suffix + "@example.test";
        AuthPrincipal customer = new AuthPrincipal(
            "it-customer-" + suffix,
            email,
            "Integration Customer",
            Set.of("customer")
        );
        OrderService.CreateOrder command = orderCommand(
            email,
            "online",
            "checkout-replay-" + suffix,
            "ALM-s",
            2
        );

        Map<String, Object> first = orders.create(command, customer, null, "it-first-" + suffix);
        Map<String, Object> replay = orders.create(command, customer, null, "it-replay-" + suffix);

        assertThat(replay.get("id")).isEqualTo(first.get("id"));
        assertThat(replay.get("orderNumber")).isEqualTo(first.get("orderNumber"));
        assertThat(replay.get("idempotentReplay")).isEqualTo(true);
        assertThat(jdbc.sql("select count(*) from customer_orders where email=:email")
            .param("email", email).query(Long.class).single()).isOne();
        assertThat(jdbc.sql("select count(*) from payments where order_id=:orderId")
            .param("orderId", first.get("id")).query(Long.class).single()).isOne();
        assertThat(jdbc.sql("select count(*) from inventory_reservations where order_id=:orderId")
            .param("orderId", first.get("id")).query(Long.class).single()).isOne();
        assertThat(jdbc.sql("select count(*) from fulfillments where order_id=:orderId")
            .param("orderId", first.get("id")).query(Long.class).single()).isOne();
        assertThat(jdbc.sql("""
            select count(*) from fulfillment_items fi
            join fulfillments f on f.id=fi.fulfillment_id where f.order_id=:orderId
            """).param("orderId", first.get("id")).query(Long.class).single()).isOne();
        assertThat(jdbc.sql("""
            select count(*) from outbox_events
            where aggregate_type='fulfillment' and event_type='fulfillment.created'
              and payload_json->>'orderId'=:orderId
            """).param("orderId", first.get("id")).query(Long.class).single()).isOne();
    }

    @Test
    @Transactional
    void codLifecycleConsumesReservationOnShippingAndCapturesPaymentOnDelivery() {
        String suffix = UUID.randomUUID().toString();
        String email = "cod-" + suffix + "@example.test";
        AuthPrincipal customer = new AuthPrincipal(
            "it-cod-customer-" + suffix,
            email,
            "COD Customer",
            Set.of("customer")
        );
        AuthPrincipal admin = new AuthPrincipal(
            "it-admin-" + suffix,
            "admin-" + suffix + "@example.test",
            "Integration Admin",
            Set.of("admin")
        );
        InventorySnapshot before = inventory("inv-hcm-DMA-s");
        Map<String, Object> created = orders.create(
            orderCommand(email, "cod", "cod-lifecycle-" + suffix, "DMA-s", 2),
            customer,
            null,
            "it-cod-create-" + suffix
        );
        String orderId = String.valueOf(created.get("id"));

        assertThat(created.get("status")).isEqualTo("confirmed");
        assertThat(orderState(orderId)).isEqualTo(new OrderState("confirmed", "cod_pending", "reserved"));
        assertThat(inventory("inv-hcm-DMA-s"))
            .isEqualTo(new InventorySnapshot(before.onHand(), before.reserved() + 2));

        String fulfillmentId = jdbc.sql("select id from fulfillments where order_id=:orderId")
            .param("orderId", orderId).query(String.class).single();
        transitionFulfillment(fulfillmentId, "processing", null, admin, suffix);
        transitionFulfillment(fulfillmentId, "ready_to_ship", null, admin, suffix);
        fulfillments.updateTracking(
            fulfillmentId,
            new AdminFulfillmentService.TrackingChange(
                "GHN",
                "standard",
                "GHN-" + suffix,
                null,
                System.currentTimeMillis() + 3L * 24 * 60 * 60 * 1000,
                0,
                "Integration shipping",
                fulfillmentVersion(fulfillmentId)
            ),
            admin,
            "it-tracking-" + suffix
        );
        transitionFulfillment(fulfillmentId, "shipped", null, admin, suffix);

        assertThat(orderState(orderId)).isEqualTo(new OrderState("shipped", "cod_pending", "shipped"));
        assertThat(inventory("inv-hcm-DMA-s"))
            .isEqualTo(new InventorySnapshot(before.onHand() - 2, before.reserved()));
        assertThat(jdbc.sql("""
            select status from inventory_reservations where order_id=:orderId
            """).param("orderId", orderId).query(String.class).single()).isEqualTo("consumed");

        assertThat(jdbc.sql("""
            select count(*) from inventory_movements
            where reference_type='fulfillment' and reference_id=:fulfillmentId and type='sale' and quantity_delta=-2
            """).param("fulfillmentId", fulfillmentId).query(Long.class).single()).isOne();

        transitionFulfillment(fulfillmentId, "delivered", null, admin, suffix);

        assertThat(orderState(orderId)).isEqualTo(new OrderState("delivered", "paid", "fulfilled"));
        assertThat(jdbc.sql("select status from payments where order_id=:orderId")
            .param("orderId", orderId).query(String.class).single()).isEqualTo("succeeded");
        assertThat(jdbc.sql("select captured_at is not null from payments where order_id=:orderId")
            .param("orderId", orderId).query(Boolean.class).single()).isTrue();

        transitionFulfillment(fulfillmentId, "returned", "Khách đã trả hàng về điểm nhận", admin, suffix);
        assertThat(orderState(orderId)).isEqualTo(new OrderState("returned", "paid", "returned"));
        assertThat(inventory("inv-hcm-DMA-s"))
            .isEqualTo(new InventorySnapshot(before.onHand() - 2, before.reserved()));
        assertThat(jdbc.sql("select status from inventory_reservations where order_id=:orderId")
            .param("orderId", orderId).query(String.class).single()).isEqualTo("consumed");

    }

    @Test
    @Transactional
    void orderWorkflowRejectsUnpaidProgressAndCancellationAfterDispatch() {
        String suffix = UUID.randomUUID().toString();
        AuthPrincipal admin = admin("workflow-" + suffix);
        AuthPrincipal customer = customer("workflow-" + suffix);

        Map<String, Object> online = orders.create(
            orderCommand(customer.email(), "online", "unpaid-workflow-" + suffix, "QCV-s", 1),
            customer,
            null,
            "it-unpaid-create-" + suffix
        );
        String unpaidOrderId = String.valueOf(online.get("id"));
        jdbc.sql("update customer_orders set status='confirmed' where id=:id")
            .param("id", unpaidOrderId).update();

        assertThatThrownBy(() -> adminOrders.changeStatus(
            unpaidOrderId,
            new AdminOrderService.StatusChange("processing", null),
            admin,
            "it-unpaid-progress-" + suffix
        )).isInstanceOfSatisfying(ApiException.class, exception ->
            assertThat(exception.code()).isEqualTo("PAYMENT_NOT_READY")
        );

        Map<String, Object> cod = orders.create(
            orderCommand(customer.email(), "cod", "dispatch-cancel-" + suffix, "DMA-s", 1),
            customer,
            null,
            "it-dispatch-create-" + suffix
        );
        String orderId = String.valueOf(cod.get("id"));
        String fulfillmentId = jdbc.sql("select id from fulfillments where order_id=:orderId")
            .param("orderId", orderId).query(String.class).single();
        transitionFulfillment(fulfillmentId, "processing", null, admin, suffix);
        transitionFulfillment(fulfillmentId, "ready_to_ship", null, admin, suffix);
        fulfillments.updateTracking(
            fulfillmentId,
            new AdminFulfillmentService.TrackingChange(
                "GHTK", "standard", "GHTK-" + suffix, null, null, 0, null,
                fulfillmentVersion(fulfillmentId)
            ),
            admin,
            "it-dispatch-tracking-" + suffix
        );
        transitionFulfillment(fulfillmentId, "shipped", null, admin, suffix);
        transitionFulfillment(fulfillmentId, "failed", "Khách hẹn giao lại", admin, suffix);

        assertThatThrownBy(() -> adminOrders.changeStatus(
            orderId,
            new AdminOrderService.StatusChange("cancelled", "Không thể tiếp tục giao"),
            admin,
            "it-dispatch-cancel-" + suffix
        )).isInstanceOfSatisfying(ApiException.class, exception ->
            assertThat(exception.code()).isEqualTo("ORDER_ALREADY_DISPATCHED")
        );
        assertThat(jdbc.sql("select status from fulfillments where id=:id")
            .param("id", fulfillmentId).query(String.class).single()).isEqualTo("failed");
        assertThat(jdbc.sql("select status from inventory_reservations where order_id=:orderId")
            .param("orderId", orderId).query(String.class).single()).isEqualTo("consumed");

        transitionFulfillment(fulfillmentId, "returned", "Khách từ chối nhận hàng", admin, suffix);
        assertThat(orderState(orderId)).isEqualTo(new OrderState("returned", "cancelled", "returned"));
        assertThat(jdbc.sql("select status from payments where order_id=:orderId")
            .param("orderId", orderId).query(String.class).single()).isEqualTo("cancelled");
        assertThat(jdbc.sql("select status from inventory_reservations where order_id=:orderId")
            .param("orderId", orderId).query(String.class).single()).isEqualTo("consumed");
    }

    @Test
    @Transactional
    void multiWarehouseOrderBlocksPartialCancellationAndCancelsAtomically() {
        String suffix = UUID.randomUUID().toString();
        AuthPrincipal admin = admin("multi-" + suffix);
        AuthPrincipal customer = customer("multi-" + suffix);
        jdbc.sql("""
            update inventory_items set on_hand=reserved,updated_at=now()
            where id='inv-hcm-ALM-s'
            """).update();

        Map<String, Object> created = orders.create(
            new OrderService.CreateOrder(
                customer.email(),
                "0901234567",
                "Multi warehouse integration test",
                "cod",
                null,
                "multi-warehouse-" + suffix,
                shippingAddress(),
                List.of(
                    new OrderService.OrderItemInput("DMA-s", 1),
                    new OrderService.OrderItemInput("ALM-s", 1)
                )
            ),
            customer,
            null,
            "it-multi-create-" + suffix
        );
        String orderId = String.valueOf(created.get("id"));
        List<String> shipmentIds = jdbc.sql("""
            select id from fulfillments where order_id=:orderId order by warehouse_id
            """).param("orderId", orderId).query(String.class).list();
        assertThat(shipmentIds).hasSize(2);

        String firstShipmentId = shipmentIds.getFirst();
        assertThatThrownBy(() -> transitionFulfillment(
            firstShipmentId,
            "cancelled",
            "Thử hủy riêng một kiện",
            admin,
            suffix
        )).isInstanceOfSatisfying(ApiException.class, exception ->
            assertThat(exception.code()).isEqualTo("PARTIAL_CANCEL_UNSUPPORTED")
        );

        adminOrders.changeStatus(
            orderId,
            new AdminOrderService.StatusChange("cancelled", "Khách hủy toàn bộ đơn"),
            admin,
            "it-multi-cancel-" + suffix
        );

        assertThat(orderState(orderId)).isEqualTo(new OrderState("cancelled", "cancelled", "cancelled"));
        assertThat(jdbc.sql("select count(*) from fulfillments where order_id=:id and status='cancelled'")
            .param("id", orderId).query(Long.class).single()).isEqualTo(2L);
        assertThat(jdbc.sql("select count(*) from inventory_reservations where order_id=:id and status='released'")
            .param("id", orderId).query(Long.class).single()).isEqualTo(2L);
    }

    private void transitionFulfillment(
        String fulfillmentId,
        String status,
        String reason,
        AuthPrincipal admin,
        String suffix
    ) {
        fulfillments.changeStatus(
            fulfillmentId,
            new AdminFulfillmentService.StatusChange(status, reason, fulfillmentVersion(fulfillmentId)),
            admin,
            "it-fulfillment-" + status + '-' + suffix
        );
    }

    private int fulfillmentVersion(String fulfillmentId) {
        return jdbc.sql("select version from fulfillments where id=:id")
            .param("id", fulfillmentId).query(Integer.class).single();
    }

    private OrderService.CreateOrder orderCommand(
        String email,
        String paymentMethod,
        String idempotencyKey,
        String variantId,
        int quantity
    ) {
        return new OrderService.CreateOrder(
            email,
            "0901234567",
            "Integration test order",
            paymentMethod,
            null,
            idempotencyKey,
            shippingAddress(),
            List.of(new OrderService.OrderItemInput(variantId, quantity))
        );
    }

    private OrderService.ShippingAddress shippingAddress() {
        return new OrderService.ShippingAddress(
            "Nguyen Van Test",
            "0901234567",
            "1 Duong Kiem Thu",
            "Phuong Ben Nghe",
            "Quan 1",
            "TP. Ho Chi Minh"
        );
    }

    private AuthPrincipal admin(String suffix) {
        return new AuthPrincipal(
            "it-admin-" + suffix,
            "admin-" + suffix + "@example.test",
            "Integration Admin",
            Set.of("admin")
        );
    }

    private AuthPrincipal customer(String suffix) {
        return new AuthPrincipal(
            "it-customer-" + suffix,
            "customer-" + suffix + "@example.test",
            "Integration Customer",
            Set.of("customer")
        );
    }

    private InventorySnapshot inventory(String id) {
        return jdbc.sql("select on_hand,reserved from inventory_items where id=:id")
            .param("id", id)
            .query((rs, rowNum) -> new InventorySnapshot(rs.getInt("on_hand"), rs.getInt("reserved")))
            .single();
    }

    private OrderState orderState(String orderId) {
        return jdbc.sql("""
            select status,payment_status,fulfillment_status from customer_orders where id=:id
            """).param("id", orderId).query((rs, rowNum) -> new OrderState(
                rs.getString("status"),
                rs.getString("payment_status"),
                rs.getString("fulfillment_status")
            )).single();
    }

    private record InventorySnapshot(int onHand, int reserved) {}

    private record OrderState(String status, String paymentStatus, String fulfillmentStatus) {}
}

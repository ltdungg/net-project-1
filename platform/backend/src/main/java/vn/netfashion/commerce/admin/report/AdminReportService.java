package vn.netfashion.commerce.admin.report;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import vn.netfashion.commerce.admin.report.ReportDateRangePolicy.DateRange;
import vn.netfashion.commerce.admin.report.ReportDateRangePolicy.InvalidDateRangeException;
import vn.netfashion.commerce.common.ApiException;

@Service
public class AdminReportService {
    private static final String ELIGIBLE_PAID_ORDER = """
        o.payment_status = 'paid'
        and o.status not in ('cancelled', 'returned', 'refunded')
        """;

    private final JdbcClient jdbc;

    public AdminReportService(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
    public Overview overview(String rawFrom, String rawTo) {
        DateRange range = resolveRange(rawFrom, rawTo);
        return new Overview(
            period(range),
            kpis(range),
            topProducts(range),
            salesDaily(range),
            paymentStatuses(range)
        );
    }

    @Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
    public Finance finance(String rawFrom, String rawTo, int page, int size) {
        DateRange range = resolveRange(rawFrom, rawTo);
        if (page < 1 || page > 100_000 || size < 1 || size > 100) {
            throw new ApiException(
                HttpStatus.UNPROCESSABLE_ENTITY,
                "INVALID_PAGINATION",
                "page phải từ 1 đến 100000 và size phải từ 1 đến 100."
            );
        }

        FinanceSummary summary = financeSummary(range);
        long offset = (long) (page - 1) * size;
        List<PaymentLedgerEntry> entries = paymentLedger(range, size, offset);
        long totalPages = summary.totalPayments() == 0
            ? 0
            : (summary.totalPayments() + size - 1L) / size;

        return new Finance(
            period(range),
            summary,
            paymentStatuses(range),
            entries,
            new Pagination(page, size, summary.totalPayments(), totalPages)
        );
    }

    private Kpis kpis(DateRange range) {
        String sql = """
            select
              count(*) total_orders,
              count(*) filter (where %s) paid_orders,
              coalesce(sum(o.grand_total_cents) filter (where %s), 0) net_revenue_cents,
              count(distinct o.user_id) filter (where %s and o.user_id is not null) paid_customers,
              coalesce((
                select sum(oi.quantity)
                from order_items oi
                join customer_orders sold on sold.id = oi.order_id
                where sold.created_at >= :fromInclusive
                  and sold.created_at < :toExclusive
                  and sold.payment_status = 'paid'
                  and sold.status not in ('cancelled', 'returned', 'refunded')
              ), 0) items_sold
            from customer_orders o
            where o.created_at >= :fromInclusive
              and o.created_at < :toExclusive
            """.formatted(ELIGIBLE_PAID_ORDER, ELIGIBLE_PAID_ORDER, ELIGIBLE_PAID_ORDER);

        return jdbc.sql(sql)
            .params(rangeParams(range))
            .query((rs, rowNum) -> {
                long paidOrders = rs.getLong("paid_orders");
                long revenue = rs.getLong("net_revenue_cents");
                return new Kpis(
                    revenue,
                    rs.getLong("total_orders"),
                    paidOrders,
                    paidOrders == 0 ? 0 : revenue / paidOrders,
                    rs.getLong("items_sold"),
                    rs.getLong("paid_customers")
                );
            }).single();
    }

    private List<TopProduct> topProducts(DateRange range) {
        return jdbc.sql("""
            select
              p.id product_id,
              oi.product_name,
              sum(oi.quantity) quantity,
              sum(oi.total_cents) item_revenue_cents
            from order_items oi
            join customer_orders o on o.id = oi.order_id
            left join product_variants pv on pv.id = oi.variant_id
            left join products p on p.id = pv.product_id
            where o.created_at >= :fromInclusive
              and o.created_at < :toExclusive
              and o.payment_status = 'paid'
              and o.status not in ('cancelled', 'returned', 'refunded')
            group by p.id, oi.product_name
            order by quantity desc, item_revenue_cents desc, oi.product_name
            limit 10
            """).params(rangeParams(range))
            .query((rs, rowNum) -> new TopProduct(
                rs.getString("product_id"),
                rs.getString("product_name"),
                rs.getLong("quantity"),
                rs.getLong("item_revenue_cents")
            )).list();
    }

    private List<DailySales> salesDaily(DateRange range) {
        return jdbc.sql("""
            with days as (
              select generate_series(
                cast(:fromDay as date),
                cast(:toDay as date),
                interval '1 day'
              )::date as report_day
            ), daily as (
              select
                (o.created_at at time zone 'Asia/Ho_Chi_Minh')::date as report_day,
                count(*) orders,
                count(*) filter (
                  where o.payment_status = 'paid'
                    and o.status not in ('cancelled', 'returned', 'refunded')
                ) paid_orders,
                coalesce(sum(o.grand_total_cents) filter (
                  where o.payment_status = 'paid'
                    and o.status not in ('cancelled', 'returned', 'refunded')
                ), 0) net_revenue_cents
              from customer_orders o
              where o.created_at >= :fromInclusive
                and o.created_at < :toExclusive
              group by (o.created_at at time zone 'Asia/Ho_Chi_Minh')::date
            )
            select
              days.report_day as day,
              coalesce(daily.orders, 0) orders,
              coalesce(daily.paid_orders, 0) paid_orders,
              coalesce(daily.net_revenue_cents, 0) net_revenue_cents
            from days
            left join daily on daily.report_day = days.report_day
            order by days.report_day
            """).params(Map.of(
                "fromDay", range.from(),
                "toDay", range.to(),
                "fromInclusive", timestamp(range.fromInclusive()),
                "toExclusive", timestamp(range.toExclusive())
            )).query((rs, rowNum) -> new DailySales(
                rs.getObject("day", LocalDate.class),
                rs.getLong("orders"),
                rs.getLong("paid_orders"),
                rs.getLong("net_revenue_cents")
            )).list();
    }

    private List<PaymentStatusTotal> paymentStatuses(DateRange range) {
        return jdbc.sql("""
            select status, count(*) payment_count, coalesce(sum(amount_cents), 0) amount_cents
            from payments
            where created_at >= :fromInclusive and created_at < :toExclusive
            group by status
            order by payment_count desc, status
            """).params(rangeParams(range))
            .query((rs, rowNum) -> new PaymentStatusTotal(
                rs.getString("status"),
                rs.getLong("payment_count"),
                rs.getLong("amount_cents")
            )).list();
    }

    private FinanceSummary financeSummary(DateRange range) {
        return jdbc.sql("""
            select
              count(*) total_payments,
              coalesce(sum(p.amount_cents), 0) recorded_amount_cents,
              count(*) filter (where p.status in ('succeeded', 'paid')) successful_payments,
              coalesce(sum(p.amount_cents) filter (
                where p.status in ('succeeded', 'paid')
                  and o.status not in ('cancelled', 'returned', 'refunded')
              ), 0) net_collected_cents,
              coalesce(sum(p.amount_cents) filter (
                where p.status in ('pending', 'authorized')
              ), 0) pending_or_authorized_cents,
              count(*) filter (where p.status = 'failed') failed_payments,
              count(*) filter (where p.status in ('partially_refunded', 'refunded')) refunded_payments,
              coalesce(sum(p.amount_cents) filter (
                where p.status in ('partially_refunded', 'refunded')
              ), 0) payments_marked_refunded_cents
            from payments p
            join customer_orders o on o.id = p.order_id
            where p.created_at >= :fromInclusive and p.created_at < :toExclusive
            """).params(rangeParams(range))
            .query((rs, rowNum) -> new FinanceSummary(
                rs.getLong("total_payments"),
                rs.getLong("recorded_amount_cents"),
                rs.getLong("successful_payments"),
                rs.getLong("net_collected_cents"),
                rs.getLong("pending_or_authorized_cents"),
                rs.getLong("failed_payments"),
                rs.getLong("refunded_payments"),
                rs.getLong("payments_marked_refunded_cents")
            )).single();
    }

    private List<PaymentLedgerEntry> paymentLedger(DateRange range, int size, long offset) {
        return jdbc.sql("""
            select
              p.id,
              o.order_number,
              p.provider,
              p.method,
              p.status,
              p.amount_cents,
              p.currency,
              p.captured_at,
              p.created_at,
              p.updated_at
            from payments p
            join customer_orders o on o.id = p.order_id
            where p.created_at >= :fromInclusive and p.created_at < :toExclusive
            order by p.created_at desc, p.id desc
            limit :limit offset :offset
            """).params(Map.of(
                "fromInclusive", timestamp(range.fromInclusive()),
                "toExclusive", timestamp(range.toExclusive()),
                "limit", size,
                "offset", offset
            )).query(this::mapLedgerEntry).list();
    }

    private PaymentLedgerEntry mapLedgerEntry(ResultSet rs, int rowNum) throws SQLException {
        return new PaymentLedgerEntry(
            rs.getString("id"),
            rs.getString("order_number"),
            rs.getString("provider"),
            rs.getString("method"),
            rs.getString("status"),
            rs.getLong("amount_cents"),
            rs.getString("currency"),
            epoch(rs, "captured_at"),
            epoch(rs, "created_at"),
            epoch(rs, "updated_at")
        );
    }

    private Long epoch(ResultSet rs, String column) throws SQLException {
        java.sql.Timestamp timestamp = rs.getTimestamp(column);
        return timestamp == null ? null : timestamp.toInstant().toEpochMilli();
    }

    private DateRange resolveRange(String rawFrom, String rawTo) {
        try {
            return ReportDateRangePolicy.resolve(rawFrom, rawTo);
        } catch (InvalidDateRangeException exception) {
            throw new ApiException(
                HttpStatus.UNPROCESSABLE_ENTITY,
                "INVALID_REPORT_RANGE",
                exception.getMessage(),
                Map.of(
                    "format", "yyyy-MM-dd",
                    "maxDays", ReportDateRangePolicy.MAX_DAYS,
                    "minimumDate", ReportDateRangePolicy.MINIMUM_DATE.toString()
                )
            );
        }
    }

    private Map<String, Object> rangeParams(DateRange range) {
        return Map.of(
            "fromInclusive", timestamp(range.fromInclusive()),
            "toExclusive", timestamp(range.toExclusive())
        );
    }

    private java.sql.Timestamp timestamp(java.time.Instant value) {
        return java.sql.Timestamp.from(value);
    }

    private Period period(DateRange range) {
        return new Period(
            range.from(),
            range.to(),
            range.days(),
            ReportDateRangePolicy.REPORTING_ZONE.getId()
        );
    }

    public record Overview(
        Period period,
        Kpis kpis,
        List<TopProduct> topProducts,
        List<DailySales> salesDaily,
        List<PaymentStatusTotal> paymentStatuses
    ) {}

    public record Finance(
        Period period,
        FinanceSummary summary,
        List<PaymentStatusTotal> paymentStatuses,
        List<PaymentLedgerEntry> ledger,
        Pagination pagination
    ) {}

    public record Period(LocalDate from, LocalDate to, int days, String timeZone) {}

    public record Kpis(
        long netRevenueCents,
        long orders,
        long paidOrders,
        long averageOrderValueCents,
        long itemsSold,
        long paidCustomers
    ) {}

    public record TopProduct(
        String productId,
        String productName,
        long quantity,
        long itemRevenueCents
    ) {}

    public record DailySales(
        LocalDate date,
        long orders,
        long paidOrders,
        long netRevenueCents
    ) {}

    public record PaymentStatusTotal(String status, long count, long amountCents) {}

    public record FinanceSummary(
        long totalPayments,
        long recordedAmountCents,
        long successfulPayments,
        long netCollectedCents,
        long pendingOrAuthorizedCents,
        long failedPayments,
        long refundedPayments,
        long paymentsMarkedRefundedCents
    ) {}

    /** Deliberately excludes customer PII, provider references and gateway errors/payloads. */
    public record PaymentLedgerEntry(
        String paymentId,
        String orderNumber,
        String provider,
        String method,
        String status,
        long amountCents,
        String currency,
        Long capturedAt,
        Long createdAt,
        Long updatedAt
    ) {}

    public record Pagination(int page, int size, long totalItems, long totalPages) {}
}

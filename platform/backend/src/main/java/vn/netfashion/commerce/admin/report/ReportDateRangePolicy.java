package vn.netfashion.commerce.admin.report;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeParseException;
import java.time.temporal.ChronoUnit;

/**
 * Pure policy for business-report date ranges. API boundary dates are inclusive;
 * database queries use the returned half-open instant range.
 */
public final class ReportDateRangePolicy {
    public static final int DEFAULT_DAYS = 30;
    public static final int MAX_DAYS = 366;
    public static final LocalDate MINIMUM_DATE = LocalDate.of(2000, 1, 1);
    public static final ZoneId REPORTING_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private ReportDateRangePolicy() {}

    public static DateRange resolve(String rawFrom, String rawTo) {
        return resolve(rawFrom, rawTo, LocalDate.now(REPORTING_ZONE));
    }

    static DateRange resolve(String rawFrom, String rawTo, LocalDate today) {
        LocalDate to = parse(rawTo, "to");
        LocalDate from = parse(rawFrom, "from");

        if (to == null) to = today;
        if (from == null) from = to.minusDays(DEFAULT_DAYS - 1L);

        if (from.isAfter(to)) {
            throw new InvalidDateRangeException("Ngày from phải nhỏ hơn hoặc bằng ngày to.");
        }
        if (from.isBefore(MINIMUM_DATE)) {
            throw new InvalidDateRangeException(
                "Ngày from không được trước " + MINIMUM_DATE + "."
            );
        }
        if (to.isAfter(today)) {
            throw new InvalidDateRangeException("Ngày to không được nằm trong tương lai.");
        }

        long inclusiveDays = ChronoUnit.DAYS.between(from, to) + 1;
        if (inclusiveDays > MAX_DAYS) {
            throw new InvalidDateRangeException(
                "Khoảng báo cáo không được vượt quá " + MAX_DAYS + " ngày."
            );
        }

        Instant fromInclusive = from.atStartOfDay(REPORTING_ZONE).toInstant();
        Instant toExclusive = to.plusDays(1).atStartOfDay(REPORTING_ZONE).toInstant();
        return new DateRange(from, to, fromInclusive, toExclusive, (int) inclusiveDays);
    }

    private static LocalDate parse(String rawValue, String field) {
        if (rawValue == null || rawValue.isBlank()) return null;
        try {
            return LocalDate.parse(rawValue.trim());
        } catch (DateTimeParseException exception) {
            throw new InvalidDateRangeException(
                "Tham số " + field + " phải đúng định dạng yyyy-MM-dd."
            );
        }
    }

    public record DateRange(
        LocalDate from,
        LocalDate to,
        Instant fromInclusive,
        Instant toExclusive,
        int days
    ) {}

    public static final class InvalidDateRangeException extends IllegalArgumentException {
        InvalidDateRangeException(String message) {
            super(message);
        }
    }
}

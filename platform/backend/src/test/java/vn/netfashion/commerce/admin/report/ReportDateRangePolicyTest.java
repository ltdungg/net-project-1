package vn.netfashion.commerce.admin.report;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.LocalDate;
import org.junit.jupiter.api.Test;

class ReportDateRangePolicyTest {
    private static final LocalDate TODAY = LocalDate.of(2026, 9, 1);

    @Test
    void defaultsToThirtyInclusiveDaysEndingToday() {
        ReportDateRangePolicy.DateRange range = ReportDateRangePolicy.resolve(null, null, TODAY);

        assertThat(range.from()).isEqualTo(LocalDate.of(2026, 8, 3));
        assertThat(range.to()).isEqualTo(TODAY);
        assertThat(range.days()).isEqualTo(30);
    }

    @Test
    void derivesThirtyDaysWhenOnlyToIsProvided() {
        ReportDateRangePolicy.DateRange range = ReportDateRangePolicy.resolve(
            null,
            "2026-02-28",
            TODAY
        );

        assertThat(range.from()).isEqualTo(LocalDate.of(2026, 1, 30));
        assertThat(range.to()).isEqualTo(LocalDate.of(2026, 2, 28));
    }

    @Test
    void createsHalfOpenInstantsInBusinessTimeZone() {
        ReportDateRangePolicy.DateRange range = ReportDateRangePolicy.resolve(
            "2026-01-01",
            "2026-01-01",
            TODAY
        );

        assertThat(range.fromInclusive().toString()).isEqualTo("2025-12-31T17:00:00Z");
        assertThat(range.toExclusive().toString()).isEqualTo("2026-01-01T17:00:00Z");
        assertThat(range.days()).isEqualTo(1);
    }

    @Test
    void rejectsInvalidIsoDate() {
        assertThatThrownBy(() -> ReportDateRangePolicy.resolve("01/08/2026", null, TODAY))
            .isInstanceOf(ReportDateRangePolicy.InvalidDateRangeException.class)
            .hasMessageContaining("yyyy-MM-dd");
    }

    @Test
    void rejectsReversedRange() {
        assertThatThrownBy(() -> ReportDateRangePolicy.resolve(
            "2026-08-02",
            "2026-08-01",
            TODAY
        )).isInstanceOf(ReportDateRangePolicy.InvalidDateRangeException.class)
            .hasMessageContaining("from");
    }

    @Test
    void rejectsFutureAndUnsupportedHistoricalDates() {
        assertThatThrownBy(() -> ReportDateRangePolicy.resolve(
            "2026-09-01",
            "2026-09-02",
            TODAY
        )).isInstanceOf(ReportDateRangePolicy.InvalidDateRangeException.class)
            .hasMessageContaining("tương lai");

        assertThatThrownBy(() -> ReportDateRangePolicy.resolve(
            "1999-12-31",
            "2000-01-01",
            TODAY
        )).isInstanceOf(ReportDateRangePolicy.InvalidDateRangeException.class)
            .hasMessageContaining("2000-01-01");
    }

    @Test
    void acceptsExactlyMaximumDaysAndRejectsOneMore() {
        ReportDateRangePolicy.DateRange maximum = ReportDateRangePolicy.resolve(
            "2025-01-01",
            "2026-01-01",
            TODAY
        );
        assertThat(maximum.days()).isEqualTo(ReportDateRangePolicy.MAX_DAYS);

        assertThatThrownBy(() -> ReportDateRangePolicy.resolve(
            "2024-12-31",
            "2026-01-01",
            TODAY
        )).isInstanceOf(ReportDateRangePolicy.InvalidDateRangeException.class)
            .hasMessageContaining(String.valueOf(ReportDateRangePolicy.MAX_DAYS));
    }
}

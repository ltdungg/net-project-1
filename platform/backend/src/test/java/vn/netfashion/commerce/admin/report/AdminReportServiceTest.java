package vn.netfashion.commerce.admin.report;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import vn.netfashion.commerce.common.ApiException;

class AdminReportServiceTest {
    private final JdbcClient jdbc = mock(JdbcClient.class);
    private final AdminReportService reports = new AdminReportService(jdbc);

    @Test
    void reversedReportRangeIsMappedToApiErrorBeforeQuerying() {
        assertThatThrownBy(() -> reports.overview("2026-01-02", "2026-01-01"))
            .isInstanceOfSatisfying(ApiException.class, error -> {
                assertThat(error.status()).isEqualTo(HttpStatus.UNPROCESSABLE_ENTITY);
                assertThat(error.code()).isEqualTo("INVALID_REPORT_RANGE");
                assertThat(error.details()).isEqualTo(java.util.Map.of(
                    "format", "yyyy-MM-dd", "maxDays", ReportDateRangePolicy.MAX_DAYS,
                    "minimumDate", ReportDateRangePolicy.MINIMUM_DATE.toString()));
            });
        verifyNoInteractions(jdbc);
    }

    @Test
    void invalidFinancePaginationIsRejectedBeforeQuerying() {
        assertThatThrownBy(() -> reports.finance("2026-01-01", "2026-01-01", 0, 25))
            .isInstanceOfSatisfying(ApiException.class, error -> {
                assertThat(error.status()).isEqualTo(HttpStatus.UNPROCESSABLE_ENTITY);
                assertThat(error.code()).isEqualTo("INVALID_PAGINATION");
            });
        assertThatThrownBy(() -> reports.finance("2026-01-01", "2026-01-01", 1, 101))
            .isInstanceOfSatisfying(ApiException.class, error ->
                assertThat(error.code()).isEqualTo("INVALID_PAGINATION"));
        verifyNoInteractions(jdbc);
    }
}

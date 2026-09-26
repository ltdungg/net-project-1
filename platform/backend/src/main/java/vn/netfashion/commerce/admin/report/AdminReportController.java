package vn.netfashion.commerce.admin.report;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import vn.netfashion.commerce.common.ApiEnvelope;

@Validated
@RestController
@RequestMapping("/api/admin")
public class AdminReportController {
    private final AdminReportService reports;

    public AdminReportController(AdminReportService reports) {
        this.reports = reports;
    }

    @GetMapping("/reports/overview")
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    ApiEnvelope<AdminReportService.Overview> overview(
        @RequestParam(required = false) String from,
        @RequestParam(required = false) String to
    ) {
        return ApiEnvelope.ok(reports.overview(from, to));
    }

    @GetMapping("/finance")
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    ApiEnvelope<AdminReportService.Finance> finance(
        @RequestParam(required = false) String from,
        @RequestParam(required = false) String to,
        @RequestParam(defaultValue = "1") @Min(1) @Max(100_000) int page,
        @RequestParam(defaultValue = "25") @Min(1) @Max(100) int size
    ) {
        return ApiEnvelope.ok(reports.finance(from, to, page, size));
    }
}

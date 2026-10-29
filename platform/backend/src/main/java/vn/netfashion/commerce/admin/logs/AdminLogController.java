package vn.netfashion.commerce.admin.logs;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import vn.netfashion.commerce.common.ApiEnvelope;

@Validated
@RestController
public class AdminLogController {
    @GetMapping("/api/admin/logs")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiEnvelope<BackendLogBuffer.Snapshot>> logs(
        @RequestParam(defaultValue = "ALL") @Pattern(regexp = "ALL|ERROR|WARN|INFO|DEBUG|TRACE") String level,
        @RequestParam(defaultValue = "") @Size(max = 200) String query,
        @RequestParam(defaultValue = "200") @Min(1) @Max(500) int limit
    ) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore())
            .body(ApiEnvelope.ok(BackendLogBuffer.snapshot(level, query, limit)));
    }
}

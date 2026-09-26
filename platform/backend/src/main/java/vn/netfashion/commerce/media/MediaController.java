package vn.netfashion.commerce.media;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import vn.netfashion.commerce.common.ApiEnvelope;

@RestController
public class MediaController {
    private static final String ASSET_PREFIX = "/api/assets/";
    private final MediaStorageService storage;

    public MediaController(MediaStorageService storage) {
        this.storage = storage;
    }

    @PostMapping(value = "/api/admin/uploads", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    ResponseEntity<ApiEnvelope<Map<String, Object>>> upload(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiEnvelope.ok(storage.store(file)));
    }

    @GetMapping("/api/assets/**")
    ResponseEntity<byte[]> asset(HttpServletRequest request) {
        String path = request.getRequestURI();
        String key = path.startsWith(ASSET_PREFIX) ? path.substring(ASSET_PREFIX.length()) : "";
        MediaStorageService.StoredAsset asset = storage.read(key);
        if (asset.etag().equals(request.getHeader(HttpHeaders.IF_NONE_MATCH))) {
            return ResponseEntity.status(HttpStatus.NOT_MODIFIED).eTag(asset.etag()).build();
        }
        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType(asset.contentType()))
            .cacheControl(CacheControl.maxAge(java.time.Duration.ofDays(365)).cachePublic().immutable())
            .header("X-Content-Type-Options", "nosniff")
            .eTag(asset.etag())
            .body(asset.bytes());
    }
}

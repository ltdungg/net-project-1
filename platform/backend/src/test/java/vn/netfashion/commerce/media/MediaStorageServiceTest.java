package vn.netfashion.commerce.media;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.nio.file.Path;
import java.time.Duration;
import java.util.Set;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;
import vn.netfashion.commerce.common.ApiException;
import vn.netfashion.commerce.config.AppProperties;

class MediaStorageServiceTest {
    @TempDir
    Path uploadRoot;

    @Test
    void storesAndReadsAnAllowedImageUsingGeneratedKey() {
        MediaStorageService storage = storage();
        byte[] png = new byte[] {
            (byte) 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0
        };

        var result = storage.store(new MockMultipartFile("file", "look.png", "image/png", png));
        String key = String.valueOf(result.get("key"));
        MediaStorageService.StoredAsset stored = storage.read(key);

        assertThat(key).startsWith("products/").endsWith(".png");
        assertThat(stored.bytes()).isEqualTo(png);
        assertThat(stored.contentType()).isEqualTo("image/png");
        assertThat(stored.etag()).startsWith("\"").endsWith("\"");
    }

    @Test
    void rejectsContentThatDoesNotMatchDeclaredMimeType() {
        MediaStorageService storage = storage();

        assertThatThrownBy(() -> storage.store(
            new MockMultipartFile("file", "fake.png", "image/png", "not-an-image".getBytes())
        )).isInstanceOfSatisfying(ApiException.class, exception ->
            assertThat(exception.code()).isEqualTo("INVALID_IMAGE")
        );
    }

    @Test
    void rejectsPathTraversalOnRead() {
        assertThatThrownBy(() -> storage().read("../outside.png"))
            .isInstanceOfSatisfying(ApiException.class, exception ->
                assertThat(exception.code()).isEqualTo("INVALID_ASSET_KEY")
            );
    }

    private MediaStorageService storage() {
        return new MediaStorageService(new AppProperties(
            "local",
            "http://localhost:8787",
            "local-only-change-this-secret-before-production-0123456789",
            Duration.ofMinutes(15),
            Duration.ofDays(30),
            false,
            "owner@example.com",
            Set.of("owner@example.com"),
            Set.of("manager@example.com"),
            "test-webhook-secret",
            uploadRoot.toString(),
            "",
            "gpt-5.4-mini"
        ));
    }
}

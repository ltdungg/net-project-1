package vn.netfashion.commerce.media;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.security.MessageDigest;
import java.time.LocalDate;
import java.util.HexFormat;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import vn.netfashion.commerce.common.ApiException;
import vn.netfashion.commerce.common.Maps;
import vn.netfashion.commerce.config.AppProperties;

@Service
public class MediaStorageService {
    private static final long MAX_BYTES = 8L * 1024 * 1024;
    private static final Set<String> ALLOWED = Set.of("image/jpeg", "image/png", "image/webp", "image/avif");
    private static final Map<String, String> EXTENSIONS = Map.of(
        "image/jpeg", "jpg", "image/png", "png", "image/webp", "webp", "image/avif", "avif"
    );
    private final Path root;

    public MediaStorageService(AppProperties properties) {
        this.root = Path.of(properties.uploadDir()).toAbsolutePath().normalize();
    }

    public Map<String, Object> store(MultipartFile file) {
        if (file == null || file.isEmpty()) throw new ApiException(HttpStatus.BAD_REQUEST, "FILE_REQUIRED", "Vui lòng chọn một tệp ảnh.");
        if (file.getSize() > MAX_BYTES) throw new ApiException(HttpStatus.PAYLOAD_TOO_LARGE, "FILE_TOO_LARGE", "Ảnh phải nhỏ hơn 8 MB.");
        String contentType = file.getContentType() == null ? "" : file.getContentType().toLowerCase(Locale.ROOT);
        if (!ALLOWED.contains(contentType)) throw new ApiException(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "UNSUPPORTED_MEDIA", "Định dạng ảnh không được hỗ trợ.");
        byte[] bytes;
        try (InputStream input = file.getInputStream()) {
            bytes = input.readNBytes((int) MAX_BYTES + 1);
        } catch (IOException exception) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "UPLOAD_READ_FAILED", "Không thể đọc tệp tải lên.");
        }
        if (bytes.length > MAX_BYTES) throw new ApiException(HttpStatus.PAYLOAD_TOO_LARGE, "FILE_TOO_LARGE", "Ảnh phải nhỏ hơn 8 MB.");
        if (!matchesSignature(contentType, bytes)) {
            throw new ApiException(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "INVALID_IMAGE", "Nội dung tệp không khớp định dạng ảnh khai báo.");
        }
        String key = "products/" + LocalDate.now() + "/" + UUID.randomUUID() + "." + EXTENSIONS.get(contentType);
        Path target = resolve(key);
        try {
            Files.createDirectories(target.getParent());
            Files.write(target, bytes, StandardOpenOption.CREATE_NEW);
        } catch (IOException exception) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "UPLOAD_WRITE_FAILED", "Chưa thể lưu ảnh sản phẩm.");
        }
        return Maps.of("key", key, "url", "/api/assets/" + key, "contentType", contentType, "etag", etag(bytes));
    }

    public StoredAsset read(String key) {
        Path target = resolve(key);
        if (!Files.isRegularFile(target)) throw new ApiException(HttpStatus.NOT_FOUND, "ASSET_NOT_FOUND", "Không tìm thấy tệp.");
        try {
            byte[] bytes = Files.readAllBytes(target);
            String contentType = Files.probeContentType(target);
            if (contentType == null) contentType = contentTypeFor(target);
            return new StoredAsset(bytes, contentType, etag(bytes));
        } catch (IOException exception) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "ASSET_READ_FAILED", "Chưa thể đọc tệp.");
        }
    }

    private Path resolve(String key) {
        if (key == null || key.isBlank() || key.indexOf('\0') >= 0) throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_ASSET_KEY", "Đường dẫn tệp không hợp lệ.");
        Path target = root.resolve(key.replace('\\', '/')).normalize();
        if (!target.startsWith(root)) throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_ASSET_KEY", "Đường dẫn tệp không hợp lệ.");
        return target;
    }

    private boolean matchesSignature(String type, byte[] bytes) {
        if (bytes.length < 12) return false;
        return switch (type) {
            case "image/jpeg" -> (bytes[0] & 0xff) == 0xff && (bytes[1] & 0xff) == 0xd8 && (bytes[2] & 0xff) == 0xff;
            case "image/png" -> (bytes[0] & 0xff) == 0x89 && bytes[1] == 0x50 && bytes[2] == 0x4e && bytes[3] == 0x47
                && bytes[4] == 0x0d && bytes[5] == 0x0a && bytes[6] == 0x1a && bytes[7] == 0x0a;
            case "image/webp" -> ascii(bytes, 0, "RIFF") && ascii(bytes, 8, "WEBP");
            case "image/avif" -> ascii(bytes, 4, "ftyp") && (ascii(bytes, 8, "avif") || ascii(bytes, 8, "avis"));
            default -> false;
        };
    }

    private boolean ascii(byte[] value, int offset, String expected) {
        if (value.length < offset + expected.length()) return false;
        for (int index = 0; index < expected.length(); index++) if (value[offset + index] != (byte) expected.charAt(index)) return false;
        return true;
    }

    private String contentTypeFor(Path path) {
        String name = path.getFileName().toString().toLowerCase(Locale.ROOT);
        if (name.endsWith(".png")) return "image/png";
        if (name.endsWith(".webp")) return "image/webp";
        if (name.endsWith(".avif")) return "image/avif";
        return "image/jpeg";
    }

    private String etag(byte[] bytes) {
        try {
            return "\"" + HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes)) + "\"";
        } catch (Exception exception) {
            throw new IllegalStateException(exception);
        }
    }

    public record StoredAsset(byte[] bytes, String contentType, String etag) {}
}

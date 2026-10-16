package vn.netfashion.commerce.common;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

import org.junit.jupiter.api.Test;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

class GlobalExceptionHandlerTest {
    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void preservesDomainStatusCodeMessageAndDetails() {
        var response = handler.api(new ApiException(HttpStatus.CONFLICT, "ORDER_CONFLICT", "Conflict", java.util.Map.of("id", "o-1")));
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody().error().code()).isEqualTo("ORDER_CONFLICT");
        assertThat(response.getBody().error().details()).isEqualTo(java.util.Map.of("id", "o-1"));
    }

    @Test
    void mapsMalformedJsonUploadDatabaseAndUnexpectedFailures() {
        assertError(handler.unreadable(mock(HttpMessageNotReadableException.class)), 400, "INVALID_JSON");
        assertError(handler.uploadTooLarge(new MaxUploadSizeExceededException(8)), 413, "FILE_TOO_LARGE");
        assertError(handler.conflict(new DataIntegrityViolationException("duplicate")), 409, "CONFLICT");
        assertError(handler.databaseUnavailable(new DataAccessResourceFailureException("offline")), 503, "DATABASE_UNAVAILABLE");
        assertError(handler.unexpected(new IllegalStateException("secret internal detail")), 500, "INTERNAL_ERROR");
    }

    private void assertError(org.springframework.http.ResponseEntity<ApiEnvelope<Void>> response, int status, String code) {
        assertThat(response.getStatusCode().value()).isEqualTo(status);
        assertThat(response.getBody().data()).isNull();
        assertThat(response.getBody().error().code()).isEqualTo(code);
        assertThat(response.getBody().error().message()).doesNotContain("secret internal detail");
    }
}

package vn.netfashion.commerce.common;

import jakarta.validation.ConstraintViolationException;
import java.util.LinkedHashMap;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

@RestControllerAdvice
public class GlobalExceptionHandler {
    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ApiException.class)
    ResponseEntity<ApiEnvelope<Void>> api(ApiException exception) {
        return ResponseEntity.status(exception.status())
            .body(ApiEnvelope.fail(exception.code(), exception.getMessage(), exception.details()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ApiEnvelope<Void>> validation(MethodArgumentNotValidException exception) {
        Map<String, String> fields = new LinkedHashMap<>();
        for (FieldError error : exception.getBindingResult().getFieldErrors()) {
            fields.putIfAbsent(error.getField(), error.getDefaultMessage());
        }
        return ResponseEntity.unprocessableEntity()
            .body(ApiEnvelope.fail("VALIDATION_ERROR", "Dữ liệu gửi lên chưa hợp lệ.", fields));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    ResponseEntity<ApiEnvelope<Void>> unreadable(HttpMessageNotReadableException exception) {
        return ResponseEntity.badRequest()
            .body(ApiEnvelope.fail("INVALID_JSON", "JSON gửi lên không hợp lệ.", null));
    }

    @ExceptionHandler({MissingServletRequestParameterException.class, MethodArgumentTypeMismatchException.class})
    ResponseEntity<ApiEnvelope<Void>> invalidRequest(Exception exception) {
        return ResponseEntity.badRequest()
            .body(ApiEnvelope.fail("INVALID_REQUEST", "Tham số yêu cầu không hợp lệ.", null));
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    ResponseEntity<ApiEnvelope<Void>> uploadTooLarge(MaxUploadSizeExceededException exception) {
        return ResponseEntity.status(413)
            .body(ApiEnvelope.fail("FILE_TOO_LARGE", "Ảnh phải nhỏ hơn 8 MB.", null));
    }

    @ExceptionHandler(ConstraintViolationException.class)
    ResponseEntity<ApiEnvelope<Void>> constraint(ConstraintViolationException exception) {
        return ResponseEntity.unprocessableEntity()
            .body(ApiEnvelope.fail("VALIDATION_ERROR", "Dữ liệu gửi lên chưa hợp lệ.", exception.getMessage()));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    ResponseEntity<ApiEnvelope<Void>> conflict(DataIntegrityViolationException exception) {
        log.warn("Database constraint rejected request", exception);
        return ResponseEntity.status(409)
            .body(ApiEnvelope.fail("CONFLICT", "Dữ liệu xung đột với trạng thái hiện tại.", null));
    }

    @ExceptionHandler(DataAccessResourceFailureException.class)
    ResponseEntity<ApiEnvelope<Void>> databaseUnavailable(DataAccessResourceFailureException exception) {
        log.error("Database unavailable", exception);
        return ResponseEntity.status(503)
            .body(ApiEnvelope.fail("DATABASE_UNAVAILABLE", "Dịch vụ dữ liệu tạm thời không khả dụng.", null));
    }

    @ExceptionHandler(Exception.class)
    ResponseEntity<ApiEnvelope<Void>> unexpected(Exception exception) {
        log.error("Unhandled API error", exception);
        return ResponseEntity.internalServerError()
            .body(ApiEnvelope.fail("INTERNAL_ERROR", "Hệ thống đang bận. Vui lòng thử lại.", null));
    }
}

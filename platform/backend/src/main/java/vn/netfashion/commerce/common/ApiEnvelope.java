package vn.netfashion.commerce.common;

public record ApiEnvelope<T>(T data, ApiError error) {
    public static <T> ApiEnvelope<T> ok(T data) {
        return new ApiEnvelope<>(data, null);
    }

    public static <T> ApiEnvelope<T> fail(String code, String message, Object details) {
        return new ApiEnvelope<>(null, new ApiError(code, message, details));
    }

    public record ApiError(String code, String message, Object details) {}
}

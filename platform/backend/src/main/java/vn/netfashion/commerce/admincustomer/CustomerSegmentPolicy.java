package vn.netfashion.commerce.admincustomer;

import java.util.List;
import java.util.Locale;
import java.util.Map;

public final class CustomerSegmentPolicy {
    private static final List<Definition> DEFINITIONS = List.of(
        new Definition("at_risk", "Cần chăm sóc", "Đã mua hàng nhưng quá 90 ngày chưa quay lại."),
        new Definition("vip", "VIP", "Từ 5 đơn đã thu hoặc doanh thu tích lũy từ 5 triệu đồng."),
        new Definition("loyal", "Trung thành", "Từ 2 đơn đã thu và có giao dịch trong 90 ngày gần nhất."),
        new Definition("new", "Khách mới", "Tạo tài khoản trong 30 ngày và có tối đa 1 đơn đã thu."),
        new Definition("potential", "Tiềm năng", "Đã có đúng 1 đơn được thanh toán."),
        new Definition("prospect", "Chưa chuyển đổi", "Chưa có đơn được thanh toán.")
    );
    private static final Map<String, Definition> BY_CODE = DEFINITIONS.stream()
        .collect(java.util.stream.Collectors.toUnmodifiableMap(Definition::code, value -> value));

    private CustomerSegmentPolicy() {}

    public static List<Definition> definitions() {
        return DEFINITIONS;
    }

    public static String normalize(String value) {
        if (value == null || value.isBlank()) return null;
        String code = value.trim().toLowerCase(Locale.ROOT);
        if (!BY_CODE.containsKey(code)) {
            throw new IllegalArgumentException("Phân khúc khách hàng không hợp lệ.");
        }
        return code;
    }

    public static Definition definition(String code) {
        return BY_CODE.getOrDefault(code, BY_CODE.get("prospect"));
    }

    public record Definition(String code, String label, String description) {}
}

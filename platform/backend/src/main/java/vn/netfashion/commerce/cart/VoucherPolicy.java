package vn.netfashion.commerce.cart;

public final class VoucherPolicy {
    public static final long FREE_SHIPPING_THRESHOLD = 799_000L;
    public static final long STANDARD_SHIPPING = 35_000L;

    private VoucherPolicy() {}

    public static Totals totals(long subtotal, Evaluation evaluation) {
        long discount = evaluation != null && evaluation.valid() ? evaluation.savingsCents() : 0;
        boolean freeShipping = subtotal >= FREE_SHIPPING_THRESHOLD || (evaluation != null && evaluation.valid() && evaluation.freeShipping());
        long shipping = freeShipping ? 0 : STANDARD_SHIPPING;
        return new Totals(subtotal, discount, shipping, Math.max(0, subtotal - discount + shipping));
    }

    public static long discount(String type, long value, Long maximum, long subtotal) {
        long result = switch (type) {
            case "percentage" -> subtotal * value / 100;
            case "fixed" -> value;
            default -> 0;
        };
        return Math.min(subtotal, maximum == null ? result : Math.min(result, maximum));
    }

    public record Evaluation(boolean valid,String promotionId,String couponId,String code,String name,String message,long savingsCents,boolean freeShipping) {}
    public record Totals(long subtotalCents,long discountCents,long shippingCents,long grandTotalCents) {}
}

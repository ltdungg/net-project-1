package vn.netfashion.commerce.ai;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;
import org.springframework.stereotype.Component;

@Component
public class RecommendationEngine {
    private static final Pattern BUDGET = Pattern.compile("(?:duoi|toi da|khong qua|ngan sach)\\s*(\\d+(?:[.,]\\d+)*)\\s*(trieu|tr|k|nghin|ngan|vnd|d)?");
    private static final Pattern SIZE = Pattern.compile("\\bsize\\s+(xxl|xl|xs|s|m|l)\\b");
    private static final List<String> TYPES = List.of("ao", "quan", "dam", "vay", "tui", "giay", "chan vay", "so mi");

    public record Context(String currentId, List<String> recent, Set<String> favorites, Set<String> cart, Set<String> purchased) {}
    public record Recommendation(Map<String, Object> product, String reason) {}
    private record Scored(Map<String, Object> product, double score, String reason) {}

    public List<Recommendation> recommend(List<Map<String, Object>> catalog, Context context, String query, int limit) {
        String normalized = normalize(query);
        long budget = budget(normalized);
        String size = lastMatch(SIZE, normalized);
        String category = lastMatch(Pattern.compile("\\b(nam|nu)\\b"), normalized);
        String type = TYPES.stream().filter(t -> has(normalized, t)).max(Comparator.comparingInt(normalized::lastIndexOf)).orElse("");
        Set<String> interests = new HashSet<>(context.recent());
        interests.addAll(context.favorites());
        interests.addAll(context.cart());
        interests.addAll(context.purchased());
        if (context.currentId() != null) interests.add(context.currentId());
        Set<String> categories = new HashSet<>();
        List<Long> prices = new ArrayList<>();
        for (Map<String, Object> p : catalog) if (interests.contains(p.get("id"))) {
            categories.add(String.valueOf(p.get("category")));
            variants(p).stream().mapToLong(v -> number(v.get("priceCents"))).min().ifPresent(prices::add);
        }
        double averagePrice = prices.stream().mapToLong(Long::longValue).average().orElse(0);
        List<Scored> ranked = new ArrayList<>();
        for (Map<String, Object> p : catalog) {
            String id = String.valueOf(p.get("id"));
            if ((normalized.isBlank() && id.equals(context.currentId())) || context.cart().contains(id)) continue;
            List<Map<String, Object>> eligible = variants(p).stream().filter(v -> number(v.get("available")) > 0
                && number(v.get("priceCents")) <= budget
                && (size.isEmpty() || normalize(String.valueOf(v.get("size"))).equals(size))).toList();
            if (eligible.isEmpty()) continue;
            if (!category.isEmpty() && !category.equals(normalize(String.valueOf(p.get("category"))))) continue;
            String name = normalize(String.valueOf(p.get("name")));
            if (!type.isEmpty() && !(has(name, type) || (type.equals("vay") && has(name, "dam")) || (type.equals("dam") && has(name, "vay")))) continue;
            String search = normalize(p.get("name") + " " + p.get("subtitle") + " " + p.get("description") + " " + p.get("material"));
            double score = Boolean.TRUE.equals(p.get("featured")) ? 2 : 0;
            if (id.equals(context.currentId())) score += 20;
            String reason = "Thiết kế đang có sẵn tại NÉT";
            if (categories.contains(p.get("category"))) { score += 10; reason = "Cùng nhóm thiết kế bạn quan tâm"; }
            if (context.favorites().contains(id)) { score += 12; reason = "Thiết kế trong danh sách yêu thích của bạn"; }
            if (context.purchased().contains(id)) score -= 8;
            long price = eligible.stream().mapToLong(v -> number(v.get("priceCents"))).min().orElse(0);
            if (averagePrice > 0) score += Math.max(0, 4 - Math.abs(price - averagePrice) / averagePrice * 4);
            for (String term : Set.of("linen", "cotton", "tencel", "cong so", "di lam", "du lich", "toi gian", "thoang", "mua he")) {
                if (normalized.contains(term) && search.contains(term)) { score += 8; reason = "Phù hợp chất liệu hoặc phong cách bạn tìm"; }
            }
            if (!type.isEmpty()) reason = "Đúng loại sản phẩm bạn đang tìm";
            if (budget != Long.MAX_VALUE) reason += " · trong ngân sách";
            if (!size.isEmpty()) reason += " · còn size " + size.toUpperCase(Locale.ROOT);
            // Present a buyable matching variant first, so the card's price agrees with the filters.
            Map<String, Object> display = new java.util.LinkedHashMap<>(p);
            display.put("variants", eligible);
            ranked.add(new Scored(display, score, reason));
        }
        return ranked.stream().sorted(Comparator.comparingDouble(Scored::score).reversed()
            .thenComparing(s -> String.valueOf(s.product().get("id"))))
            .limit(Math.clamp(limit, 1, 8)).map(s -> new Recommendation(s.product(), s.reason())).toList();
    }

    static long budget(String text) {
        var matcher = BUDGET.matcher(text);
        long result = Long.MAX_VALUE;
        while (matcher.find()) {
            try {
                String unit = matcher.group(2);
                String digits = matcher.group(1);
                double value = Double.parseDouble(unit != null && (unit.equals("trieu") || unit.equals("tr"))
                    ? digits.replace(',', '.') : digits.replaceAll("[.,]", ""));
                long multiplier = unit == null ? 1 : switch (unit) { case "trieu", "tr" -> 1_000_000; case "k", "nghin", "ngan" -> 1000; default -> 1; };
                result = (long) Math.min(1_000_000_000, value * multiplier);
            } catch (NumberFormatException ignored) { /* Ignore malformed amounts. */ }
        }
        return result;
    }

    private static String lastMatch(Pattern pattern, String value) {
        var matcher = pattern.matcher(value);
        String result = "";
        while (matcher.find()) result = matcher.group(1);
        return result;
    }
    static boolean has(String value, String term) { return Pattern.compile("\\b" + Pattern.quote(term) + "\\b").matcher(value).find(); }
    public static String normalize(String value) {
        return Normalizer.normalize(value == null ? "" : value, Normalizer.Form.NFD).replaceAll("\\p{M}", "")
            .replace('đ', 'd').replace('Đ', 'D').toLowerCase(Locale.ROOT).replaceAll("[!?;:]", " ").replaceAll("\\s+", " ").trim();
    }
    @SuppressWarnings("unchecked")
    static List<Map<String, Object>> variants(Map<String, Object> p) { return (List<Map<String, Object>>) p.getOrDefault("variants", List.of()); }
    static long number(Object value) { return value instanceof Number n ? n.longValue() : 0; }
}

package vn.netfashion.commerce.common;

import java.util.LinkedHashMap;
import java.util.Map;

public final class Maps {
    private Maps() {}

    public static Map<String, Object> of(Object... values) {
        LinkedHashMap<String, Object> result = new LinkedHashMap<>();
        for (int i = 0; i < values.length; i += 2) {
            result.put((String) values[i], values[i + 1]);
        }
        return result;
    }
}

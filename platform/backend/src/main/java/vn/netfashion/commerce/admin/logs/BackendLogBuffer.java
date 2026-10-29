package vn.netfashion.commerce.admin.logs;

import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.AppenderBase;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

/** Bounded, process-local log history. Never stores throwable messages or request bodies. */
public class BackendLogBuffer extends AppenderBase<ILoggingEvent> {
    private static final int CAPACITY = 1000;
    private static final ArrayDeque<Entry> ENTRIES = new ArrayDeque<>();
    private static long sequence;
    private static final Pattern CREDENTIAL = Pattern.compile(
        "(?i)([\\\"']?(?:password|passwd|secret|[\\w-]*token|api[_-]?key|authorization|cookie)[\\\"']?\\s*[:=]\\s*)(?:\\\"[^\\\"]*\\\"|'[^']*'|[^\\s,;}]+)");
    private static final Pattern TOKEN = Pattern.compile(
        "(?i)Bearer\\s+\\S+|gh[pousr]_[A-Za-z0-9_]+|github_pat_[A-Za-z0-9_]+|(?:AKIA|ASIA)[A-Z0-9]{16}|sk-(?:proj-)?[A-Za-z0-9_-]{20,}|eyJ[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+");
    private static final Pattern EMAIL = Pattern.compile("[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}");

    static String sanitize(String value) {
        if (value == null) return "";
        if (value.contains("PRIVATE KEY-----")) return "[REDACTED PRIVATE KEY]";
        String safe = TOKEN.matcher(value).replaceAll("[REDACTED]");
        safe = CREDENTIAL.matcher(safe).replaceAll("$1[REDACTED]");
        safe = EMAIL.matcher(safe).replaceAll("[REDACTED EMAIL]");
        safe = safe.replaceAll("[\\p{Cntrl}]", " ");
        return safe.substring(0, Math.min(safe.length(), 2000));
    }

    @Override
    protected void append(ILoggingEvent event) {
        String message = sanitize(event.getFormattedMessage());
        if (event.getThrowableProxy() != null) {
            message += " [" + sanitize(event.getThrowableProxy().getClassName()) + "]";
        }
        synchronized (ENTRIES) {
            if (ENTRIES.size() == CAPACITY) ENTRIES.removeFirst();
            ENTRIES.addLast(new Entry(++sequence, Instant.ofEpochMilli(event.getTimeStamp()).toString(),
                event.getLevel().toString(), sanitize(event.getLoggerName()), message,
                sanitize(event.getMDCPropertyMap().get("correlationId"))));
        }
    }

    public static Snapshot snapshot(String level, String query, int limit) {
        String needle = query.toLowerCase(Locale.ROOT);
        synchronized (ENTRIES) {
            List<Entry> matches = new ArrayList<>();
            var iterator = ENTRIES.descendingIterator();
            while (iterator.hasNext()) {
                Entry entry = iterator.next();
                if (!level.equals("ALL") && !entry.level().equals(level)) continue;
                if (!(entry.message() + " " + entry.logger() + " " + entry.correlationId())
                    .toLowerCase(Locale.ROOT).contains(needle)) continue;
                matches.add(entry);
            }
            return new Snapshot(List.copyOf(matches.subList(0, Math.min(limit, matches.size()))),
                matches.size(), ENTRIES.size(), CAPACITY, Instant.now().toString());
        }
    }

    public record Entry(long id, String timestamp, String level, String logger, String message, String correlationId) {}
    public record Snapshot(List<Entry> entries, int matched, int retained, int capacity, String fetchedAt) {}
}

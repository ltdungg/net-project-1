package vn.netfashion.commerce.ai;

import java.util.Map;
import org.springframework.stereotype.Service;
import vn.netfashion.commerce.admin.insights.AdminInsightsService;
import vn.netfashion.commerce.common.Maps;

@Service
public class AdminAiService {
    private final AdminInsightsService insights;
    private final AiModelClient model;
    public AdminAiService(AdminInsightsService insights, AiModelClient model) { this.insights = insights; this.model = model; }

    public Map<String, Object> ask(String prompt) {
        // The read transaction ends before a potentially slow network call.
        var grounded = insights.ask(prompt);
        var generated = model.generate("You help a NÉT store manager interpret an aggregate database snapshot. "
            + "Use only the supplied facts; distinguish suggestions from observed facts. Do not infer causation or growth without comparison data. "
            + "The snapshot covers the past 30 days unless an insight explicitly says current. If a different period is requested, explain the limitation. "
            + "Never claim an action was performed. Keep the answer under 150 Vietnamese words.",
            Map.of("question", prompt, "snapshot", grounded), AiModelClient.schema(Map.of("answer", AiModelClient.text())));
        boolean valid = generated.filter(n -> n.path("answer").isString() && !n.path("answer").asText().isBlank()
            && n.path("answer").asText().length() <= 3000).isPresent();
        return Maps.of("headline", grounded.headline(), "answer", valid ? generated.get().path("answer").asText() : grounded.answer(),
            "insights", grounded.insights(), "actions", grounded.actions(), "grounded", true,
            "generatedAt", grounded.generatedAt(), "mode", model.mode(valid));
    }
}

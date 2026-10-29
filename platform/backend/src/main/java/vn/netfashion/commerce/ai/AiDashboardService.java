package vn.netfashion.commerce.ai;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;
import vn.netfashion.commerce.account.AccountService;
import vn.netfashion.commerce.admin.insights.AdminInsightsService;
import vn.netfashion.commerce.admin.report.AdminReportService;
import vn.netfashion.commerce.admin.report.ReportDateRangePolicy;
import vn.netfashion.commerce.auth.AuthPrincipal;
import vn.netfashion.commerce.common.ApiException;
import vn.netfashion.commerce.common.Maps;

@Service
public class AiDashboardService {
    private final JdbcClient jdbc;
    private final AiModelClient model;
    private final ObjectMapper mapper;
    private final AdminReportService reports;
    private final AdminInsightsService insights;
    private final AccountService accounts;
    public AiDashboardService(JdbcClient jdbc, AiModelClient model, ObjectMapper mapper, AdminReportService reports,
            AdminInsightsService insights, AccountService accounts) {
        this.jdbc = jdbc; this.model = model; this.mapper = mapper; this.reports = reports; this.insights = insights; this.accounts = accounts;
    }

    public Map<String, Object> generate(String prompt, int days) {
        DashboardPlan plan = DashboardPlan.fromPrompt(prompt, days);
        boolean ai = false;
        var response = model.generate("Create a dashboard layout from the manager's request. Select only supported widget IDs. "
            + "Use a short Vietnamese title. Do not generate metrics, SQL, HTML, code or URLs. "
            + "Supported widgets: revenue (paid revenue), orders (all orders), average_order (paid average order), items_sold (paid units), "
            + "sales_daily (daily paid revenue), top_products (paid best sellers), low_stock (current inventory warning count).",
            Map.of("request", prompt, "days", plan.days()), DashboardPlan.outputSchema());
        if (response.isPresent()) {
            try { plan = DashboardPlan.fromModel(response.get(), plan.days()); ai = true; }
            catch (RuntimeException ignored) { /* Reject non-allowlisted layouts. */ }
        }
        return render(null, plan, model.mode(ai));
    }

    public Map<String, Object> render(String id, DashboardPlan plan, String mode) {
        LocalDate to = LocalDate.now(ReportDateRangePolicy.REPORTING_ZONE);
        var overview = reports.overview(to.minusDays(plan.days()-1L).toString(), to.toString());
        return Maps.of("id", id, "plan", plan, "report", overview, "lowStock", insights.metrics().lowStock(),
            "mode", mode, "generatedAt", Instant.now().toString());
    }

    public List<Map<String, Object>> list(AuthPrincipal actor) {
        return jdbc.sql("select id,title,days,updated_at from admin_ai_dashboards where user_id=:user order by updated_at desc,id")
            .param("user", actor.id()).query((rs, row) -> Maps.of("id", rs.getString("id"), "title", rs.getString("title"),
                "days", rs.getInt("days"), "updatedAt", rs.getTimestamp("updated_at").toInstant().toString())).list();
    }

    public Map<String, Object> load(String id, AuthPrincipal actor) {
        DashboardPlan plan = jdbc.sql("select title,days,widgets::text from admin_ai_dashboards where id=:id and user_id=:user")
            .params(Map.of("id", id, "user", actor.id())).query((rs, row) -> new DashboardPlan(rs.getString("title"), rs.getInt("days"),
                List.of(mapper.readValue(rs.getString("widgets"), String[].class))))
            .optional().orElseThrow(AiDashboardService::notFound);
        return render(id, plan, "saved");
    }

    @Transactional
    public Map<String, Object> save(DashboardPlan plan, AuthPrincipal actor) {
        accounts.ensure(actor);
        jdbc.sql("select id from users where id=:id for update").param("id", actor.id()).query(String.class).single();
        long count = jdbc.sql("select count(*) from admin_ai_dashboards where user_id=:user").param("user", actor.id()).query(Long.class).single();
        if (count >= 10) throw new ApiException(HttpStatus.CONFLICT, "DASHBOARD_LIMIT", "Bạn đã lưu 10 dashboard. Hãy xóa một dashboard trước khi lưu thêm.");
        String id = UUID.randomUUID().toString();
        jdbc.sql("insert into admin_ai_dashboards(id,user_id,title,days,widgets) values(:id,:user,:title,:days,cast(:widgets as jsonb))")
            .params(Map.of("id", id, "user", actor.id(), "title", plan.title(), "days", plan.days(), "widgets", mapper.writeValueAsString(plan.widgets()))).update();
        return Map.of("id", id, "title", plan.title());
    }

    @Transactional
    public void delete(String id, AuthPrincipal actor) {
        if (jdbc.sql("delete from admin_ai_dashboards where id=:id and user_id=:user").params(Map.of("id", id, "user", actor.id())).update() != 1) throw notFound();
    }
    private static ApiException notFound() { return new ApiException(HttpStatus.NOT_FOUND, "DASHBOARD_NOT_FOUND", "Không tìm thấy dashboard của bạn."); }
}

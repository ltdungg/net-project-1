package vn.netfashion.commerce.ai;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.Test;
import org.springframework.context.annotation.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.core.context.SecurityContextHolder;
import vn.netfashion.commerce.auth.AuthPrincipal;

class AiDashboardSecurityTest {
    @Test void onlyManagersAndAdminsCanUseDashboardEndpoints() {
        try (var context = new AnnotationConfigApplicationContext(Config.class)) {
            var controller = context.getBean(AiDashboardController.class);
            for (String role : List.of("customer", "staff", "manager", "admin")) {
                var actor = new AuthPrincipal("test", "test@example.test", "Test", Set.of(role));
                SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(actor, "", actor.getAuthorities()));
                if (Set.of("customer", "staff").contains(role)) {
                    assertThatThrownBy(() -> controller.list(actor)).isInstanceOf(AccessDeniedException.class);
                    assertThatThrownBy(() -> controller.generate(new AiDashboardController.GenerateRequest("doanh thu", 7), actor)).isInstanceOf(AccessDeniedException.class);
                    assertThatThrownBy(() -> controller.save(new AiDashboardController.SaveRequest("Test", 7, List.of("orders")), actor)).isInstanceOf(AccessDeniedException.class);
                    assertThatThrownBy(() -> controller.load("id", actor)).isInstanceOf(AccessDeniedException.class);
                    assertThatThrownBy(() -> controller.delete("id", actor)).isInstanceOf(AccessDeniedException.class);
                } else assertThat(controller.list(actor).getHeaders().getCacheControl()).isEqualTo("no-store");
            }
        } finally { SecurityContextHolder.clearContext(); }
    }
    @Configuration @EnableMethodSecurity static class Config {
        @Bean AiDashboardService service() { return mock(AiDashboardService.class); }
        @Bean AiDashboardController controller(AiDashboardService service) { return new AiDashboardController(service, mock(AiRateLimiter.class), mock(AiModelClient.class)); }
    }
}

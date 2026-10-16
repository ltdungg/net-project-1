package vn.netfashion.commerce.admin.insights;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.nullable;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import vn.netfashion.commerce.common.GlobalExceptionHandler;
import vn.netfashion.commerce.auth.AuthPrincipal;

class AdminInsightsApiTest {
    private AdminInsightsService insights;
    private MockMvc mvc;

    @BeforeEach
    void setUp() {
        insights = mock(AdminInsightsService.class);
        mvc = MockMvcBuilders.standaloneSetup(new AdminInsightsController(insights))
            .setControllerAdvice(new GlobalExceptionHandler()).build();
    }

    @Test
    void promotionRequestRejectsInvalidPercentageAndTimeWindowBeforeServiceCall() throws Exception {
        mvc.perform(post("/api/admin/promotions").contentType(MediaType.APPLICATION_JSON).content("""
            {"name":"Autumn sale","code":"AUTUMN","type":"percentage","value":101,
             "minSubtotalCents":0,"startsAt":2000,"endsAt":1000}
            """))
            .andExpect(status().isUnprocessableEntity())
            .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"))
            .andExpect(jsonPath("$.error.details.timeWindowValid").exists())
            .andExpect(jsonPath("$.error.details.percentageValueValid").exists());
        verifyNoInteractions(insights);
    }

    @Test
    void malformedCopilotRequestReturnsJsonErrorWithoutRunningRules() throws Exception {
        mvc.perform(post("/api/admin/ai").contentType(MediaType.APPLICATION_JSON).content("{"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error.code").value("INVALID_JSON"));
        verifyNoInteractions(insights);
    }

    @Test
    void validPromotionReturnsCreatedIdentifierAndCode() throws Exception {
        when(insights.createPromotion(any(), nullable(AuthPrincipal.class), nullable(String.class)))
            .thenReturn(Map.of("promotionId", "promotion-1", "couponId", "coupon-1", "code", "AUTUMN"));

        mvc.perform(post("/api/admin/promotions").contentType(MediaType.APPLICATION_JSON).content("""
            {"name":"Autumn sale","code":"AUTUMN","type":"percentage","value":10,
             "minSubtotalCents":500000,"startsAt":1000,"endsAt":2000}
            """))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.error").isEmpty())
            .andExpect(jsonPath("$.data.promotionId").value("promotion-1"))
            .andExpect(jsonPath("$.data.code").value("AUTUMN"));

        ArgumentCaptor<AdminInsightsService.PromotionCommand> command =
            ArgumentCaptor.forClass(AdminInsightsService.PromotionCommand.class);
        verify(insights).createPromotion(command.capture(), nullable(AuthPrincipal.class), nullable(String.class));
        org.assertj.core.api.Assertions.assertThat(command.getValue()).isEqualTo(
            new AdminInsightsService.PromotionCommand("Autumn sale", null, "AUTUMN", "percentage",
                10, 500_000, null, null, 1000, 2000));
    }
}

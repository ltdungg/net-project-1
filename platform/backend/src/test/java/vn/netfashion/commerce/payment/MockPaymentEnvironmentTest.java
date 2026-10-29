package vn.netfashion.commerce.payment;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.simple.JdbcClient;
import tools.jackson.databind.ObjectMapper;
import vn.netfashion.commerce.auth.JwtService;
import vn.netfashion.commerce.common.ApiException;
import vn.netfashion.commerce.config.AppProperties;

class MockPaymentEnvironmentTest {
    @Test void simulationIsDisabledOutsideLocalBeforeReadingOrWritingPaymentData() {
        var properties = mock(AppProperties.class);
        var jdbc = mock(JdbcClient.class);
        var service = new PaymentService(jdbc, new ObjectMapper(), properties, mock(JwtService.class));
        for (String environment : new String[] { "production", "staging" }) {
            when(properties.environment()).thenReturn(environment);
            assertThat(service.mockEnabled()).isFalse();
            for (String outcome : new String[] { "succeeded", "failed" }) {
                assertThatThrownBy(() -> service.simulateMockPayment("test", null, null, outcome))
                    .isInstanceOfSatisfying(ApiException.class, error -> assertThat(error.code()).isEqualTo("LOCAL_ONLY"));
            }
        }
        verifyNoInteractions(jdbc);
    }
}

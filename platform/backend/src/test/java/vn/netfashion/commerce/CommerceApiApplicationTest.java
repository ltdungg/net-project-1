package vn.netfashion.commerce;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.security.autoconfigure.UserDetailsServiceAutoConfiguration;

class CommerceApiApplicationTest {
    @Test
    void excludesGeneratedDevelopmentUserAutoConfiguration() {
        SpringBootApplication configuration = CommerceApiApplication.class
            .getAnnotation(SpringBootApplication.class);

        assertThat(configuration).isNotNull();
        assertThat(configuration.exclude()).contains(UserDetailsServiceAutoConfiguration.class);
    }
}

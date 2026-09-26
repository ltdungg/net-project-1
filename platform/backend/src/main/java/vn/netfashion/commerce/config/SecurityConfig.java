package vn.netfashion.commerce.config;

import java.util.List;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import vn.netfashion.commerce.auth.JwtAuthenticationFilter;
import vn.netfashion.commerce.auth.OriginValidationFilter;
import vn.netfashion.commerce.auth.SecurityResponseWriter;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {
    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    SecurityFilterChain securityFilterChain(
        HttpSecurity http,
        JwtAuthenticationFilter jwtFilter,
        OriginValidationFilter originFilter,
        SecurityResponseWriter errors
    ) throws Exception {
        return http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> {})
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .exceptionHandling(exceptions -> exceptions
                .authenticationEntryPoint((request, response, exception) -> errors.write(
                    response,
                    401,
                    "AUTH_REQUIRED",
                    "Bạn cần đăng nhập."
                ))
                .accessDeniedHandler((request, response, exception) -> errors.write(
                    response,
                    403,
                    "FORBIDDEN",
                    "Bạn không có quyền thực hiện thao tác này."
                )))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/actuator/health/**", "/api/health").permitAll()
                .requestMatchers(HttpMethod.OPTIONS, "/api/**").permitAll()
                .requestMatchers(HttpMethod.POST,
                    "/api/auth/register",
                    "/api/auth/verify-email",
                    "/api/auth/resend-verification",
                    "/api/auth/login",
                    "/api/auth/forgot-password",
                    "/api/auth/reset-password",
                    "/api/auth/refresh",
                    "/api/auth/logout"
                ).permitAll()
                .requestMatchers(HttpMethod.GET, "/api/auth/me").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/products/**", "/api/assets/**").permitAll()
                .requestMatchers("/api/cart/**", "/api/vouchers/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/orders", "/api/payments/webhook", "/api/payments/mock/confirm").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/orders/*/guest").permitAll()
                .requestMatchers("/api/admin/**").hasAnyRole("STAFF", "MANAGER", "ADMIN")
                .requestMatchers("/api/account/**", "/api/orders/**").authenticated()
                .anyRequest().denyAll())
            .addFilterBefore(originFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
            .build();
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource(AppProperties properties) {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of(properties.publicOrigin()));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Content-Type", "Authorization", "X-Correlation-Id", "Idempotency-Key"));
        configuration.setExposedHeaders(List.of("X-Correlation-Id", "Content-Disposition"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", configuration);
        return source;
    }
}

package vn.netfashion.commerce.auth;

import java.nio.charset.StandardCharsets;
import java.sql.Timestamp;
import java.time.Duration;
import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.netfashion.commerce.common.ApiException;
import vn.netfashion.commerce.config.AppProperties;

@Service
public class AuthService {
    private static final Duration VERIFY_EMAIL_TTL = Duration.ofHours(24);
    private static final Duration PASSWORD_RESET_TTL = Duration.ofMinutes(30);

    private final JdbcClient jdbc;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AppProperties properties;

    public AuthService(JdbcClient jdbc, PasswordEncoder passwordEncoder, JwtService jwtService, AppProperties properties) {
        this.jdbc = jdbc;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.properties = properties;
    }

    @Transactional
    public Registration register(
        String emailValue,
        String password,
        String fullName,
        String phone,
        boolean marketingConsent
    ) {
        validatePasswordBytes(password, false);
        String email = normalizeEmail(emailValue);
        ExistingUser existing = jdbc.sql("""
            select id,password_hash,status from users where lower(email)=:email
            """)
            .param("email", email)
            .query((rs, rowNum) -> new ExistingUser(
                rs.getString("id"),
                rs.getString("password_hash"),
                rs.getString("status")
            ))
            .optional()
            .orElse(null);
        if (existing != null && !isClaimableLocalPlaceholder(existing, email)) {
            throw new ApiException(HttpStatus.CONFLICT, "EMAIL_EXISTS", "Email đã được sử dụng.");
        }

        String userId = existing == null ? UUID.randomUUID().toString() : existing.id();
        if (existing == null) {
            jdbc.sql("""
                insert into users(id,email,password_hash,full_name,phone,status,marketing_consent)
                values (:id,:email,:password,:name,:phone,'pending',:marketingConsent)
                """)
                .param("id", userId)
                .param("email", email)
                .param("password", passwordEncoder.encode(password))
                .param("name", fullName.trim())
                .param("phone", phone.trim())
                .param("marketingConsent", marketingConsent)
                .update();
        } else {
            jdbc.sql("""
                update users set password_hash=:password,full_name=:name,phone=:phone,
                  status='pending',email_verified_at=null,marketing_consent=:marketingConsent,
                  updated_at=now()
                where id=:id and password_hash is null
                """)
                .param("id", userId)
                .param("password", passwordEncoder.encode(password))
                .param("name", fullName.trim())
                .param("phone", phone.trim())
                .param("marketingConsent", marketingConsent)
                .update();
        }
        jdbc.sql("""
            insert into user_roles(user_id,role_id)
            select :userId,id from roles where code='customer'
            on conflict do nothing
            """)
            .param("userId", userId)
            .update();
        assignConfiguredBackofficeRoles(userId, email);

        IssuedActionToken verification = issueActionToken(userId, email, "verify_email", VERIFY_EMAIL_TTL);
        publishAuthEvent(userId, email, "user.registered", verification.id());
        return new Registration(
            userId,
            email,
            true,
            localDevelopmentToken(verification.rawToken()),
            VERIFY_EMAIL_TTL.toSeconds()
        );
    }

    @Transactional
    public Tokens verifyEmail(String rawToken) {
        TokenOwner owner = consumeActionToken(rawToken, "verify_email", "VERIFY_TOKEN_INVALID", "Liên kết xác minh không hợp lệ hoặc đã hết hạn.");
        jdbc.sql("""
            update users
            set status='active',email_verified_at=coalesce(email_verified_at,now()),updated_at=now()
            where id=:id and status in ('pending','active')
            """).param("id", owner.userId()).update();
        publishAuthEvent(owner.userId(), owner.email(), "user.email_verified", owner.tokenId());
        return issue(loadPrincipal(owner.userId()));
    }

    @Transactional
    public Action resendVerification(String emailValue) {
        String email = normalizeEmail(emailValue);
        PendingUser user = jdbc.sql("""
            select id,email from users
            where lower(email)=:email and status='pending' and email_verified_at is null
            """)
            .param("email", email)
            .query((rs, rowNum) -> new PendingUser(rs.getString("id"), rs.getString("email")))
            .optional()
            .orElse(null);
        if (user == null) return genericEmailAction(null, VERIFY_EMAIL_TTL);

        invalidateActionTokens(user.id(), "verify_email");
        IssuedActionToken verification = issueActionToken(user.id(), user.email(), "verify_email", VERIFY_EMAIL_TTL);
        publishAuthEvent(user.id(), user.email(), "user.verification_requested", verification.id());
        return genericEmailAction(verification.rawToken(), VERIFY_EMAIL_TTL);
    }

    @Transactional
    public Tokens login(String emailValue, String password) {
        validatePasswordBytes(password, true);
        String email = normalizeEmail(emailValue);
        UserPassword row = jdbc.sql("""
            select id,password_hash,status,email_verified_at,locked_until
            from users where lower(email)=:email
            """)
            .param("email", email)
            .query((rs, rowNum) -> new UserPassword(
                rs.getString("id"),
                rs.getString("password_hash"),
                rs.getString("status"),
                rs.getTimestamp("email_verified_at") == null ? null : rs.getTimestamp("email_verified_at").toInstant(),
                rs.getTimestamp("locked_until") == null ? null : rs.getTimestamp("locked_until").toInstant()
            ))
            .optional()
            .orElseThrow(AuthService::invalidCredentials);

        if (row.passwordHash() == null || !passwordEncoder.matches(password, row.passwordHash())) {
            throw invalidCredentials();
        }
        if ("pending".equals(row.status()) || row.emailVerifiedAt() == null) {
            throw new ApiException(HttpStatus.FORBIDDEN, "EMAIL_NOT_VERIFIED", "Bạn cần xác minh email trước khi đăng nhập.");
        }
        if ("locked".equals(row.status()) && row.lockedUntil() != null && row.lockedUntil().isAfter(Instant.now())) {
            throw new ApiException(HttpStatus.LOCKED, "ACCOUNT_LOCKED", "Tài khoản đang tạm khóa. Vui lòng thử lại sau.");
        }
        if (!"active".equals(row.status()) && !("locked".equals(row.status()) && isLockExpired(row.lockedUntil()))) {
            throw invalidCredentials();
        }

        jdbc.sql("""
            update users
            set status='active',locked_until=null,last_login_at=now(),updated_at=now()
            where id=:id
            """).param("id", row.id()).update();
        publishAuthEvent(row.id(), email, "user.logged_in", null);
        return issue(loadPrincipal(row.id()));
    }

    @Transactional
    public Action forgotPassword(String emailValue) {
        String email = normalizeEmail(emailValue);
        PendingUser user = jdbc.sql("""
            select id,email from users
            where lower(email)=:email and email_verified_at is not null and status in ('active','locked')
            """)
            .param("email", email)
            .query((rs, rowNum) -> new PendingUser(rs.getString("id"), rs.getString("email")))
            .optional()
            .orElse(null);
        if (user == null) return genericEmailAction(null, PASSWORD_RESET_TTL);

        invalidateActionTokens(user.id(), "password_reset");
        IssuedActionToken reset = issueActionToken(user.id(), user.email(), "password_reset", PASSWORD_RESET_TTL);
        publishAuthEvent(user.id(), user.email(), "user.password_reset_requested", reset.id());
        return genericEmailAction(reset.rawToken(), PASSWORD_RESET_TTL);
    }

    @Transactional
    public Action resetPassword(String rawToken, String newPassword) {
        validatePasswordBytes(newPassword, false);
        TokenOwner owner = consumeActionToken(
            rawToken,
            "password_reset",
            "RESET_TOKEN_INVALID",
            "Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn."
        );
        int changed = jdbc.sql("""
            update users
            set password_hash=:password,status='active',locked_until=null,updated_at=now()
            where id=:id and email_verified_at is not null and status in ('active','locked')
            """)
            .param("password", passwordEncoder.encode(newPassword))
            .param("id", owner.userId())
            .update();
        if (changed != 1) {
            throw new ApiException(
                HttpStatus.UNPROCESSABLE_ENTITY,
                "RESET_TOKEN_INVALID",
                "Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn."
            );
        }
        jdbc.sql("update refresh_tokens set revoked_at=now() where user_id=:id and revoked_at is null")
            .param("id", owner.userId())
            .update();
        invalidateActionTokens(owner.userId(), "password_reset");
        publishAuthEvent(owner.userId(), owner.email(), "user.password_reset", owner.tokenId());
        return new Action("Mật khẩu đã được cập nhật. Bạn có thể đăng nhập lại.", null, 0);
    }

    @Transactional
    public Tokens refresh(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "REFRESH_EXPIRED", "Phiên đăng nhập đã hết hạn.");
        }
        String hash = jwtService.hash(rawToken);
        String userId = jdbc.sql("""
            select rt.user_id from refresh_tokens rt
            join users u on u.id=rt.user_id
            where rt.token_hash=:hash and rt.revoked_at is null and rt.expires_at>now()
              and u.status='active' and u.email_verified_at is not null
            for update of rt
            """)
            .param("hash", hash)
            .query(String.class)
            .optional()
            .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "REFRESH_EXPIRED", "Phiên đăng nhập đã hết hạn."));
        jdbc.sql("update refresh_tokens set revoked_at=now() where token_hash=:hash")
            .param("hash", hash)
            .update();
        return issue(loadPrincipal(userId));
    }

    public void logout(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) return;
        jdbc.sql("update refresh_tokens set revoked_at=now() where token_hash=:hash and revoked_at is null")
            .param("hash", jwtService.hash(rawToken))
            .update();
    }

    public AuthPrincipal loadPrincipal(String userId) {
        AuthPrincipalBase user = jdbc.sql("""
            select id,email,coalesce(full_name,email) full_name from users
            where id=:id and status='active' and email_verified_at is not null
            """)
            .param("id", userId)
            .query((rs, rowNum) -> new AuthPrincipalBase(rs.getString("id"), rs.getString("email"), rs.getString("full_name")))
            .optional()
            .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "ACCOUNT_DISABLED", "Tài khoản không khả dụng."));
        Set<String> roles = new LinkedHashSet<>(jdbc.sql("""
            select r.code from roles r join user_roles ur on ur.role_id=r.id where ur.user_id=:id
            """).param("id", userId).query(String.class).list());
        if (roles.isEmpty()) roles.add("customer");
        return new AuthPrincipal(user.id(), user.email(), user.fullName(), Set.copyOf(roles));
    }

    private Tokens issue(AuthPrincipal principal) {
        String refresh = jwtService.randomRefreshToken();
        jdbc.sql("""
            insert into refresh_tokens(id,user_id,token_hash,expires_at)
            values (:id,:userId,:hash,:expiresAt)
            """)
            .param("id", UUID.randomUUID().toString())
            .param("userId", principal.id())
            .param("hash", jwtService.hash(refresh))
            .param("expiresAt", Timestamp.from(Instant.now().plus(properties.refreshTokenTtl())))
            .update();
        return new Tokens(jwtService.accessToken(principal), refresh, principal);
    }

    private IssuedActionToken issueActionToken(String userId, String email, String type, Duration ttl) {
        String id = UUID.randomUUID().toString();
        String rawToken = jwtService.randomRefreshToken();
        jdbc.sql("""
            insert into auth_tokens(id,user_id,type,token_hash,expires_at)
            values (:id,:userId,:type,:tokenHash,:expiresAt)
            """)
            .param("id", id)
            .param("userId", userId)
            .param("type", type)
            .param("tokenHash", jwtService.hash(rawToken))
            .param("expiresAt", Timestamp.from(Instant.now().plus(ttl)))
            .update();
        return new IssuedActionToken(id, rawToken, email);
    }

    private TokenOwner consumeActionToken(String rawToken, String type, String errorCode, String errorMessage) {
        if (rawToken == null || rawToken.isBlank()) {
            throw new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, errorCode, errorMessage);
        }
        TokenOwner token = jdbc.sql("""
            select t.id,t.user_id,u.email
            from auth_tokens t join users u on u.id=t.user_id
            where t.token_hash=:hash and t.type=:type and t.consumed_at is null and t.expires_at>now()
            for update of t
            """)
            .param("hash", jwtService.hash(rawToken))
            .param("type", type)
            .query((rs, rowNum) -> new TokenOwner(rs.getString("id"), rs.getString("user_id"), rs.getString("email")))
            .optional()
            .orElseThrow(() -> new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, errorCode, errorMessage));
        jdbc.sql("update auth_tokens set consumed_at=now() where id=:id")
            .param("id", token.tokenId())
            .update();
        return token;
    }

    private void invalidateActionTokens(String userId, String type) {
        jdbc.sql("""
            update auth_tokens set consumed_at=now()
            where user_id=:userId and type=:type and consumed_at is null
            """)
            .param("userId", userId)
            .param("type", type)
            .update();
    }

    private void publishAuthEvent(String userId, String email, String eventType, String tokenId) {
        jdbc.sql("""
            insert into outbox_events(id,aggregate_type,aggregate_id,event_type,payload_json)
            values (:id,'user',:userId,:eventType,
              jsonb_build_object('userId',:userId,'email',:email,'tokenId',:tokenId))
            """)
            .param("id", UUID.randomUUID().toString())
            .param("userId", userId)
            .param("eventType", eventType)
            .param("email", email == null ? "" : email)
            .param("tokenId", tokenId == null ? "" : tokenId)
            .update();
    }

    private void assignConfiguredBackofficeRoles(String userId, String email) {
        boolean admin = properties.adminEmails() != null
            && properties.adminEmails().stream().anyMatch(email::equalsIgnoreCase);
        boolean manager = admin || (properties.managerEmails() != null
            && properties.managerEmails().stream().anyMatch(email::equalsIgnoreCase));
        if (!manager) return;
        Set<String> roles = admin ? Set.of("staff", "manager", "admin") : Set.of("staff", "manager");
        jdbc.sql("""
            insert into user_roles(user_id,role_id)
            select :userId,id from roles where code in (:roles)
            on conflict do nothing
            """)
            .param("userId", userId)
            .param("roles", roles)
            .update();
    }

    private Action genericEmailAction(String rawToken, Duration ttl) {
        return new Action(
            "Nếu email hợp lệ, hướng dẫn sẽ được gửi trong ít phút.",
            localDevelopmentToken(rawToken),
            ttl.toSeconds()
        );
    }

    private String localDevelopmentToken(String rawToken) {
        return "local".equalsIgnoreCase(properties.environment()) ? rawToken : null;
    }

    private boolean isClaimableLocalPlaceholder(ExistingUser user, String email) {
        return "local".equalsIgnoreCase(properties.environment())
            && user.passwordHash() == null
            && user.id().equals("local-" + email)
            && Set.of("active", "blocked").contains(user.status());
    }

    private String normalizeEmail(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }

    private boolean isLockExpired(Instant lockedUntil) {
        return lockedUntil == null || !lockedUntil.isAfter(Instant.now());
    }

    private static ApiException invalidCredentials() {
        return new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS", "Email hoặc mật khẩu không đúng.");
    }

    private void validatePasswordBytes(String password, boolean login) {
        if (password != null && password.getBytes(StandardCharsets.UTF_8).length <= 72) return;
        if (login) throw invalidCredentials();
        throw new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, "PASSWORD_TOO_LONG", "Mật khẩu không được vượt quá 72 byte.");
    }

    public record Tokens(String accessToken, String refreshToken, AuthPrincipal user) {}
    public record Registration(String userId, String email, boolean verificationRequired, String developmentVerificationToken, long expiresInSeconds) {}
    public record Action(String message, String developmentToken, long expiresInSeconds) {}
    private record IssuedActionToken(String id, String rawToken, String email) {}
    private record TokenOwner(String tokenId, String userId, String email) {}
    private record PendingUser(String id, String email) {}
    private record UserPassword(String id, String passwordHash, String status, Instant emailVerifiedAt, Instant lockedUntil) {}
    private record ExistingUser(String id, String passwordHash, String status) {}
    private record AuthPrincipalBase(String id, String email, String fullName) {}
}

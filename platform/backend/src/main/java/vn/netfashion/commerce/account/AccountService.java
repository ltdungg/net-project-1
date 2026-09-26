package vn.netfashion.commerce.account;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.netfashion.commerce.auth.AuthPrincipal;
import vn.netfashion.commerce.common.ApiException;
import vn.netfashion.commerce.common.Maps;

@Service
public class AccountService {
    private final JdbcClient jdbc;

    public AccountService(JdbcClient jdbc) { this.jdbc = jdbc; }

    @Transactional
    public Map<String, Object> profile(AuthPrincipal principal) {
        ensure(principal);
        return loadProfile(principal.id());
    }

    @Transactional
    public Map<String, Object> updateProfile(AuthPrincipal principal, String fullName, String phone, boolean marketingConsent) {
        ensure(principal);
        jdbc.sql("""
            update users set full_name=:name,phone=:phone,marketing_consent=:consent,updated_at=now() where id=:id
            """).params(Map.of("name", fullName, "phone", phone, "consent", marketingConsent, "id", principal.id())).update();
        return loadProfile(principal.id());
    }

    public List<Map<String, Object>> addresses(AuthPrincipal principal) {
        ensure(principal);
        return jdbc.sql("""
            select *,extract(epoch from created_at)*1000 created_ms,extract(epoch from updated_at)*1000 updated_ms from addresses
            where user_id=:userId order by is_default desc,created_at desc
            """).param("userId", principal.id()).query(this::addressMap).list();
    }

    @Transactional
    public Map<String, Object> createAddress(AuthPrincipal principal, AddressInput input) {
        ensure(principal);
        lockAddressBook(principal.id());
        boolean makeDefault = input.isDefault() || !jdbc.sql("select exists(select 1 from addresses where user_id=:userId)")
            .param("userId", principal.id()).query(Boolean.class).single();
        if (makeDefault) jdbc.sql("update addresses set is_default=false,updated_at=now() where user_id=:userId").param("userId", principal.id()).update();
        String id = UUID.randomUUID().toString();
        jdbc.sql("""
            insert into addresses(id,user_id,label,recipient_name,phone,line1,ward,district,city,postal_code,is_default)
            values(:id,:userId,:label,:name,:phone,:line1,:ward,:district,:city,:postal,:isDefault)
            """).params(Maps.of(
                "id", id, "userId", principal.id(), "label", input.label(), "name", input.recipientName(), "phone", input.phone(),
                "line1", input.line1(), "ward", input.ward(), "district", input.district(), "city", input.province(),
                "postal", input.postalCode(), "isDefault", makeDefault
            )).update();
        return address(id, principal.id());
    }

    @Transactional
    public Map<String, Object> updateAddress(String id, AuthPrincipal principal, AddressInput input) {
        ensure(principal);
        lockAddressBook(principal.id());
        ensureAddress(id, principal.id());
        if (input.isDefault()) jdbc.sql("update addresses set is_default=false,updated_at=now() where user_id=:userId and id<>:id")
            .params(Map.of("userId", principal.id(), "id", id)).update();
        jdbc.sql("""
            update addresses set label=:label,recipient_name=:name,phone=:phone,line1=:line1,ward=:ward,
              district=:district,city=:city,postal_code=:postal,is_default=:isDefault,updated_at=now()
            where id=:id and user_id=:userId
            """).params(Maps.of(
                "label", input.label(), "name", input.recipientName(), "phone", input.phone(), "line1", input.line1(),
                "ward", input.ward(), "district", input.district(), "city", input.province(), "postal", input.postalCode(),
                "isDefault", input.isDefault(), "id", id, "userId", principal.id()
            )).update();
        boolean hasDefault = jdbc.sql("select exists(select 1 from addresses where user_id=:userId and is_default=true)")
            .param("userId", principal.id()).query(Boolean.class).single();
        if (!hasDefault) {
            jdbc.sql("update addresses set is_default=true,updated_at=now() where id=:id and user_id=:userId")
                .params(Map.of("id", id, "userId", principal.id())).update();
        }
        return address(id, principal.id());
    }

    @Transactional
    public Map<String, Object> deleteAddress(String id, AuthPrincipal principal) {
        ensure(principal);
        lockAddressBook(principal.id());
        Map<String, Object> current = address(id, principal.id());
        jdbc.sql("delete from addresses where id=:id and user_id=:userId").params(Map.of("id", id, "userId", principal.id())).update();
        if (Boolean.TRUE.equals(current.get("isDefault"))) {
            jdbc.sql("""
                update addresses set is_default=true,updated_at=now() where id=(
                  select id from addresses where user_id=:userId order by created_at desc limit 1
                )
                """).param("userId", principal.id()).update();
        }
        return Maps.of("deleted", true, "id", id);
    }

    @Transactional
    public void ensure(AuthPrincipal principal) {
        if (principal == null) throw new ApiException(HttpStatus.UNAUTHORIZED, "AUTH_REQUIRED", "Bạn cần đăng nhập.");
        jdbc.sql("""
            insert into users(id,email,full_name,status,last_login_at)
            values(:id,:email,:name,'active',now()) on conflict(id) do nothing
            """).params(Map.of("id", principal.id(), "email", principal.email(), "name", principal.fullName())).update();
        for (String role : principal.roles()) {
            jdbc.sql("""
                insert into user_roles(user_id,role_id) select :userId,id from roles where code=:role on conflict do nothing
                """).params(Map.of("userId", principal.id(), "role", role)).update();
        }
    }

    private Map<String, Object> loadProfile(String id) {
        return jdbc.sql("""
            select id,email,full_name,phone,marketing_consent,extract(epoch from created_at)*1000 created_ms
            from users where id=:id
            """).param("id", id).query((rs, rowNum) -> Maps.of(
                "id", rs.getString("id"), "email", rs.getString("email"), "fullName", rs.getString("full_name"),
                "phone", rs.getString("phone"), "marketingConsent", rs.getBoolean("marketing_consent"),
                "createdAt", rs.getBigDecimal("created_ms").longValue()
            )).single();
    }

    private Map<String, Object> address(String id, String userId) {
        return jdbc.sql("select *,extract(epoch from created_at)*1000 created_ms,extract(epoch from updated_at)*1000 updated_ms from addresses where id=:id and user_id=:userId")
            .params(Map.of("id", id, "userId", userId)).query(this::addressMap).optional()
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ADDRESS_NOT_FOUND", "Không tìm thấy địa chỉ."));
    }

    private void ensureAddress(String id, String userId) { address(id, userId); }

    private void lockAddressBook(String userId) {
        jdbc.sql("select pg_advisory_xact_lock(hashtextextended(cast(:key as text),0))")
            .param("key", "address-book:" + userId)
            .query((rs, rowNumber) -> Boolean.TRUE)
            .single();
    }

    private Map<String, Object> addressMap(ResultSet rs, int rowNum) throws SQLException {
        return Maps.of(
            "id", rs.getString("id"), "label", rs.getString("label"), "recipientName", rs.getString("recipient_name"),
            "phone", rs.getString("phone"), "line1", rs.getString("line1"), "ward", rs.getString("ward"),
            "district", rs.getString("district"), "province", rs.getString("city"), "postalCode", rs.getString("postal_code"),
            "isDefault", rs.getBoolean("is_default"), "createdAt", rs.getBigDecimal("created_ms").longValue(),
            "updatedAt", rs.getBigDecimal("updated_ms").longValue()
        );
    }

    public record AddressInput(String label,String recipientName,String phone,String line1,String ward,String district,String province,String postalCode,boolean isDefault) {}
}

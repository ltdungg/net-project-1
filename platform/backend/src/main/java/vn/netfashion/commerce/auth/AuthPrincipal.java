package vn.netfashion.commerce.auth;

import java.util.Collection;
import java.util.Set;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

public record AuthPrincipal(String id, String email, String fullName, Set<String> roles) implements UserDetails {
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return roles.stream().map(role -> new SimpleGrantedAuthority("ROLE_" + role.toUpperCase())).toList();
    }

    @Override public String getPassword() { return ""; }
    @Override public String getUsername() { return email; }
}

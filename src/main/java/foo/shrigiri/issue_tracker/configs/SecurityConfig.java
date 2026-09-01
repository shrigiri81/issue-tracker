package foo.shrigiri.issue_tracker.configs;

import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.source.ImmutableJWKSet;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.core.annotation.Order;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.stereotype.Component;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.NoSuchAlgorithmException;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;

@Component
@EnableWebSecurity
@Slf4j
public class SecurityConfig {

    // ─── Web (Thymeleaf) Filter Chain — Order 1 (higher priority) ───────────────
    @Bean
    @Order(1)
    SecurityFilterChain webFilterChain(HttpSecurity http) {
        log.info("Configuring web (session-based) security filter chain");
        SecurityFilterChain chain = http
                .securityMatcher("/", "/login", "/register", "/dashboard", "/projects/**", "/issues/**",
                        "/profile", "/profile/**",
                        "/logout", "/css/**", "/js/**", "/images/**", "/error")
                .csrf(csrf -> csrf.ignoringRequestMatchers("/register")) // allow POST before session exists
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/login", "/register", "/css/**", "/js/**", "/images/**", "/error")
                        .permitAll()
                        .anyRequest().authenticated())
                .formLogin(form -> form
                        .loginPage("/login")
                        .loginProcessingUrl("/login")
                        .defaultSuccessUrl("/dashboard", true)
                        .failureUrl("/login?error")
                        .permitAll())
                .logout(logout -> logout
                        .logoutUrl("/logout")
                        .logoutSuccessUrl("/login?logout")
                        .invalidateHttpSession(true)
                        .deleteCookies("JSESSIONID")
                        .permitAll())
                .build();
        log.info("Web security filter chain configured successfully");
        return chain;
    }

    // ─── API (JWT / stateless) Filter Chain — Order 2 ────────────────────────────
    @Bean
    @Order(2)
    SecurityFilterChain apiFilterChain(HttpSecurity http) {
        log.info("Configuring API (JWT) security filter chain");
        SecurityFilterChain chain = http
                .securityMatcher("/api/**", "/actuator/**")
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(s ->
                        s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/actuator/health", "/api/login", "/api/register")
                        .permitAll()
                        .anyRequest().authenticated())
//                .httpBasic(basic -> {})
                .oauth2ResourceServer(oauth2 -> oauth2.jwt(jwt -> {}))
                .build();
        log.info("API security filter chain configured successfully");
        return chain;
    }

    @Bean
    AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) {
        log.info("Initializing AuthenticationManager");
        return authConfig.getAuthenticationManager();
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        log.info("Initializing password encoder");
        return PasswordEncoderFactories.createDelegatingPasswordEncoder();
    }

    @Bean
    RSAKey rsaKey() throws NoSuchAlgorithmException {
        log.info("Generating RSA key pair");
        KeyPair keyPair = KeyPairGenerator.getInstance("RSA").generateKeyPair();
        log.info("RSA key pair generated successfully");
        return new RSAKey.Builder((RSAPublicKey) keyPair.getPublic())
                .privateKey((RSAPrivateKey) keyPair.getPrivate())
                .build();
    }

    @Bean
    JwtEncoder jwtEncoder(RSAKey rsaKey) {
        log.info("Initializing JWT encoder");
        return new NimbusJwtEncoder(new ImmutableJWKSet<>(new JWKSet(rsaKey)));
    }

    @Bean
    JwtDecoder jwtDecoder(RSAKey rsaKey) throws JOSEException {
        log.info("Initializing JWT decoder");
        return NimbusJwtDecoder
                .withPublicKey(rsaKey.toRSAPublicKey())
                .build();
    }
}

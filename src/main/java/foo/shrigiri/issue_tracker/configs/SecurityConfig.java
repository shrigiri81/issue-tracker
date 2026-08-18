package foo.shrigiri.issue_tracker.configs;

import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.source.ImmutableJWKSet;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.*;
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

    @Bean
    SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        log.info("Configuring security filter chain");
        SecurityFilterChain chain = http
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(s ->
                        s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/", "/register", "/login", "/actuator/health")
                        .permitAll()
                        .anyRequest().authenticated())
                .httpBasic(basic -> {})
                .oauth2ResourceServer(oauth2 -> oauth2.jwt(jwt -> {}))
                .build();
        log.info("Security filter chain configured successfully");
        return chain;
    }

    @Bean
    AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
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

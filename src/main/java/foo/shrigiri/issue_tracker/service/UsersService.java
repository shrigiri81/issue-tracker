package foo.shrigiri.issue_tracker.service;

import foo.shrigiri.issue_tracker.dto.LoginRequest;
import foo.shrigiri.issue_tracker.model.Users;
import foo.shrigiri.issue_tracker.repository.UsersRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
@Slf4j
public class UsersService {

    private final UsersRepository usersRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtEncoder jwtEncoder;
    private final AuthenticationManager authenticationManager;

    public UsersService(UsersRepository usersRepository,
                        PasswordEncoder passwordEncoder,
                        JwtEncoder jwtEncoder,
                        AuthenticationManager authenticationManager) {
        this.usersRepository = usersRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtEncoder = jwtEncoder;
        this.authenticationManager = authenticationManager;
        log.info("UsersService initialized");
    }

    public List<Users> getAllUsers() {
        log.debug("Retrieving all users from database");
        List<Users> users = usersRepository.findAll();
        log.info("Retrieved {} users from database", users.size());
        return users;
    }

    public Optional<Users> getUserById(Integer id) {
        log.debug("Retrieving user with id: {}", id);
        Optional<Users> user = usersRepository.findById(id);
        if (user.isPresent()) {
            log.info("User found with id: {}", id);
        } else {
            log.warn("User not found with id: {}", id);
        }
        return user;
    }

    public Users register(Users user) {
        log.info("Registering new user: {}", user.getUsername());
        String encodedPassword = passwordEncoder.encode(user.getPassword());
        user.setHashedPassword(encodedPassword);
        user.setPassword(null);

        Users savedUser = usersRepository.save(user);
        savedUser.setPassword(null);
        log.info("User registered successfully: {}", user.getUsername());
        return savedUser;
    }

    public String issue(Authentication authentication) {
        log.info("Issuing JWT token for user: {}", authentication.getName());
        Instant now = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("issue-tracker")
                .issuedAt(now)
                .expiresAt(now.plusSeconds(3600))
                .subject(authentication.getName())
                .build();
        String token = jwtEncoder.encode(JwtEncoderParameters.from(claims)).getTokenValue();
        log.info("JWT token issued successfully for user: {}", authentication.getName());
        return token;
    }

    public Authentication verify(LoginRequest loginRequest) {
        log.debug("Verifying credentials for user: {}", loginRequest.getUsername());
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword())
        );
        log.info("Credentials verified for user: {}", loginRequest.getUsername());
        return authentication;
    }

    public String deleteUser(Integer id) {
        log.info("Deleting user with id: {}", id);
        if (usersRepository.existsById(id)) {
            usersRepository.deleteById(id);
            log.info("User deleted successfully with id: {}", id);
            return "Deleted Successfully";
        }

        log.warn("Delete failed — user not found with id: {}", id);
        return "User not found";
    }

    public Users updateUser(Integer id, Users user) {
        log.info("Updating user with id: {}", user.getUserId());
        if (user.getPassword() != null && !user.getPassword().isBlank()) {
            log.debug("Re-hashing password for user with id: {}", user.getUserId());
            user.setHashedPassword(passwordEncoder.encode(user.getPassword()));
            user.setPassword(null);
        }

        Users user1 = usersRepository.findById(id).orElseThrow();
        user1.setUsername(user.getUsername());
        user1.setRole(user.getRole());
        user1.setEnabled(user.isEnabled());

        Users savedUser = usersRepository.save(user1);
        savedUser.setPassword(null);
        log.info("User updated successfully with id: {}", savedUser.getUserId());
        return savedUser;
    }
}

package foo.shrigiri.issue_tracker.service;

import foo.shrigiri.issue_tracker.model.Users;
import foo.shrigiri.issue_tracker.repository.UsersRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class UsersDetailsService implements UserDetailsService {

    private final UsersRepository repo;

    public UsersDetailsService(UsersRepository repo) {
        this.repo = repo;
        log.info("UsersDetailsService initialized");
    }

    @Override
    public UserDetails loadUserByUsername(String username) {
        log.debug("Loading user details for username: {}", username);
        Users user = repo.findByUsername(username);

        if (user == null) {
            log.warn("User not found: {}", username);
            throw new UsernameNotFoundException("Username " + username + " not found.");
        }

        log.info("User details loaded successfully for username: {}", username);
        return User
                .withUsername(user.getUsername())
                .password(user.getHashedPassword())
                .authorities(user.getRole())
                .disabled(!user.isEnabled())
                .build();
    }
}

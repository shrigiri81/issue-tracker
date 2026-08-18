package foo.shrigiri.issue_tracker.controller;

import foo.shrigiri.issue_tracker.dto.LoginRequest;
import foo.shrigiri.issue_tracker.model.Users;
import foo.shrigiri.issue_tracker.service.UsersService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@Slf4j
public class UsersController {

    private final UsersService usersService;

    public UsersController(UsersService usersService) {
        this.usersService = usersService;
        log.info("UsersController initialized");
    }

    @GetMapping("/api/users")
    public List<Users> getAllUsers() {
        log.info("Fetching all users");
        List<Users> users = usersService.getAllUsers();
        log.info("Successfully fetched {} users", users.size());
        return users;
    }

    @GetMapping("/api/users/{id}")
    public Optional<Users> getUserById(@PathVariable Integer id) {
        log.info("Fetching user with id: {}", id);
        Optional<Users> user = usersService.getUserById(id);
        log.info("User found for id {}: {}", id, user.isPresent());
        return user;
    }

    @PostMapping("/login")
    public String login(@RequestBody LoginRequest loginRequest) {
        log.info("Login attempt for username: {}", loginRequest.getUsername());
        Authentication authentication = usersService.verify(loginRequest);
        String token = usersService.issue(authentication);
        log.info("Login successful for username: {}", loginRequest.getUsername());
        return token;
    }

    @PostMapping("/register")
    public Users register(@RequestBody Users user) {
        log.info("Registering new user: {}", user.getUsername());
        Users registeredUser = usersService.register(user);
        log.info("Successfully registered user: {}", user.getUsername());
        return registeredUser;
    }

    @DeleteMapping("/api/users/{id}")
    public String deleteUser(@PathVariable Integer id) {
        log.info("Deleting user with id: {}", id);
        String result = usersService.deleteUser(id);
        log.info("User with id {} deleted", id);
        return result;
    }
}

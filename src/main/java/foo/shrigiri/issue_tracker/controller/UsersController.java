package foo.shrigiri.issue_tracker.controller;

import foo.shrigiri.issue_tracker.dto.LoginRequest;
import foo.shrigiri.issue_tracker.model.Users;
import foo.shrigiri.issue_tracker.service.UsersService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
    public ResponseEntity<List<Users>> getAllUsers() {
        log.info("Fetching all users");
        List<Users> users = usersService.getAllUsers();
        log.info("Successfully fetched {} users", users.size());
        return ResponseEntity.ok(users);
    }

    @GetMapping("/api/users/{id}")
    public ResponseEntity<Users> getUserById(@PathVariable Integer id) {
        log.info("Fetching user with id: {}", id);
        Optional<Users> user = usersService.getUserById(id);
        log.info("User found for id {}: {}", id, user.isPresent());
        return user.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/api/login")
    public ResponseEntity<String> login(@RequestBody LoginRequest loginRequest) {
        log.info("Login attempt for username: {}", loginRequest.getUsername());
        Authentication authentication = usersService.verify(loginRequest);
        String token = usersService.issue(authentication);
        log.info("Login successful for username: {}", loginRequest.getUsername());
        return ResponseEntity.ok(token);
    }

    @PostMapping("/api/register")
    public ResponseEntity<Users> register(@RequestBody Users user) {
        log.info("Registering new user: {}", user.getUsername());
        Users registeredUser = usersService.register(user);
        log.info("Successfully registered user: {}", user.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body(registeredUser);
    }

    @DeleteMapping("/api/users/{id}")
    public ResponseEntity<String> deleteUser(@PathVariable Integer id) {
        log.info("Deleting user with id: {}", id);
        String result = usersService.deleteUser(id);
        log.info("User with id {} deleted", id);
        return ResponseEntity.ok(result);
    }

    @PutMapping("/api/users/{id}")
    public ResponseEntity<Users> updateUser(@PathVariable Integer id, @RequestBody Users user) {
        log.info("Updating user with id: {}", user.getUserId());
        Users updated = usersService.updateUser(id, user);
        log.info("User updated successfully for id: {}", updated.getUserId());
        return ResponseEntity.ok(updated);
    }

    @PatchMapping("/api/users/{id}/password")
    public ResponseEntity<String> updatePassword(@PathVariable Integer id, @RequestBody String currentPassword, @RequestBody String newPassword) {
        log.info("Updating password for user id {}", id);
        String result = usersService.updatePassword(id, currentPassword, newPassword);
        log.info("Updating password: Password updated successfully");
        return ResponseEntity.ok(result);
    }
}

package foo.shrigiri.issue_tracker.repository;

import foo.shrigiri.issue_tracker.model.Users;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UsersRepository extends JpaRepository<Users, Integer> {
    Users findByUsername(String username);

    List<Users> findByUsernameContainsIgnoreCase(String q);
}

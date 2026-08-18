package foo.shrigiri.issue_tracker.model;

import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class Users {

    @Id
    private Integer userId;
    private String username;
    private String email;
    private String password;
    private String hashed_password;
    private String role;
}

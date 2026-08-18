package foo.shrigiri.issue_tracker.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
public class Projects {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer projId;
    private String projTitle;
    private String proj_desc;
    private Date createdAt;
    private Date updatedAt;
    private Integer ownerId;
}

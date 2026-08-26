package foo.shrigiri.issue_tracker.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CurrentTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.util.Date;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
public class Issues {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer issueId;
    private String issueTitle;
    private String issueDesc;
    private String status; // issue status: open, close, merged...etc
    private String priority;

    @CurrentTimestamp
    private Date createdAt;
    @UpdateTimestamp
    private Date updatedAt;

    private Integer projectId;
    private Integer createdBy;
    private Integer assignedTo;
}

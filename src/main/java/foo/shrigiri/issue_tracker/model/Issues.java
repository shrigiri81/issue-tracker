package foo.shrigiri.issue_tracker.model;

import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class Issues {

    @Id
    private Integer issueId;
    private String issueTitle;
    private String issueDesc;
    private String status;
    private String priority;
    private Date createdAt;
    private Date updatedAt;
    private Integer projectId;
    private Integer createdBy;
    private Integer assignedTo;
}

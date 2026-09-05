package foo.shrigiri.issue_tracker.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CurrentTimestamp;

import java.util.Date;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
public class Comments {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer commentId;
    private String commentData;

    @CurrentTimestamp
    private Date createdAt;
    @CurrentTimestamp
    private Date modifiedAt;

    @ManyToOne
    @JoinColumn(name = "comment_author")
    private Users commentAuthor;

    @ManyToOne
    @JoinColumn(name = "issue_id")
    private Issues issue;
}

package foo.shrigiri.issue_tracker.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CommentRequest {

    private String commentContent;
    private Integer repliedTo;
}

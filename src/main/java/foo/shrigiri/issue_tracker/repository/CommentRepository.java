package foo.shrigiri.issue_tracker.repository;

import foo.shrigiri.issue_tracker.model.Comments;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comments, Integer> {
    List<Comments> findByIssue_IssueId(Integer issueId);
}

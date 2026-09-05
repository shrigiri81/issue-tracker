package foo.shrigiri.issue_tracker.repository;

import foo.shrigiri.issue_tracker.model.Comments;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CommentRepository extends JpaRepository<Comments, Integer> {
}

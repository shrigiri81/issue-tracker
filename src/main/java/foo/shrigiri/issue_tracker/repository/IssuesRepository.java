package foo.shrigiri.issue_tracker.repository;

import foo.shrigiri.issue_tracker.model.Issues;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface IssuesRepository extends JpaRepository<Issues, Integer> {

    List<Issues> findByIssueTitleContainsIgnoreCase(String q);

    List<Issues> findByProject_ProjId(Integer projectId);
}

package foo.shrigiri.issue_tracker.repository;

import foo.shrigiri.issue_tracker.model.Projects;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectRepository extends JpaRepository<Projects, Integer> {

    List<Projects> findByProjTitleContainsIgnoreCase(String q);
}

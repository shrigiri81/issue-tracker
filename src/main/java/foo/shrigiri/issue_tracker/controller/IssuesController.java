package foo.shrigiri.issue_tracker.controller;

import foo.shrigiri.issue_tracker.model.Issues;
import foo.shrigiri.issue_tracker.service.IssuesService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@Slf4j
public class IssuesController {

    private final IssuesService issuesService;

    public IssuesController(IssuesService issuesService) {
        this.issuesService = issuesService;
        log.info("IssuesController initialized");
    }

    @GetMapping("/api/issues")
    public ResponseEntity<List<Issues>> getAllIssues() {
        log.debug("Fetching all issues");
        List<Issues> issues = issuesService.getAllIssues();
        log.info("Fetched {} issues", issues.size());
        return ResponseEntity.ok(issues);
    }

    @GetMapping("/api/issues/{id}")
    public ResponseEntity<Issues> getIssueById(Integer id) {
        log.debug("Fetching issue with id: {}", id);
        Optional<Issues> issue = issuesService.getIssueById(id);
        if (issue.isPresent()) {
            log.info("Issue found for id: {}", id);
        } else {
            log.warn("Issue not found for id: {}", id);
        }
        return issue.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/api/issues")
    public ResponseEntity<String> addIssue(@RequestBody Issues issue) {
        log.info("Adding new issue: {}", issue.getIssueTitle());
        String result = issuesService.addIssue(issue);
        log.info("Add issue result: {}", result);
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    @PutMapping("/api/issues/{id}")
    public ResponseEntity<Issues> updateIssue(@RequestBody Issues issue) {
        log.info("Updating issue with id: {}", issue.getIssueId());
        Issues updated = issuesService.updateIssue(issue);
        log.info("Issue updated successfully for id: {}", updated.getIssueId());
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/api/issues/{id}/")
    public ResponseEntity<String> deleteIssue(@PathVariable Integer id) {
        log.info("Deleting issue with id: {}", id);
        String response = issuesService.deleteIssue(id);
        log.info("Issue deleted successfully for id {}", id);
        return ResponseEntity.ok(response);
    }
}

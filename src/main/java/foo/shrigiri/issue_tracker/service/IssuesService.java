package foo.shrigiri.issue_tracker.service;

import foo.shrigiri.issue_tracker.model.Issues;
import foo.shrigiri.issue_tracker.repository.IssuesRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@Slf4j
public class IssuesService {

    private final IssuesRepository issuesRepository;

    public IssuesService(IssuesRepository issuesRepository) {
        this.issuesRepository = issuesRepository;
        log.info("IssuesService initialized");
    }

    public List<Issues> getAllIssues() {
        log.debug("Retrieving all issues from database");
        List<Issues> issues = issuesRepository.findAll();
        log.info("Retrieved {} issues from database", issues.size());
        return issues;
    }

    public Optional<Issues> getIssueById(Integer id) {
        log.debug("Retrieving issue with id: {}", id);
        Optional<Issues> issue = issuesRepository.findById(id);
        if (issue.isPresent()) {
            log.info("Issue found with id: {}", id);
        } else {
            log.warn("Issue not found with id: {}", id);
        }
        return issue;
    }

    public String addIssue(Issues issue) {
        log.info("Saving new issue: {}", issue.getIssueTitle());
        try {
            issuesRepository.save(issue);
            log.info("Issue saved successfully: {}", issue.getIssueTitle());
            return "Issue added succesfully";
        } catch (Exception e) {
            log.error("Failed to save issue: {}", e.getMessage(), e);
            return "Failed to add issue." + e.getMessage();
        }
    }

    public Issues updateIssue(Issues issue) {
        log.info("Updating issue with id: {}", issue.getIssueId());
        Issues updated = issuesRepository.save(issue);
        log.info("Issue updated successfully with id: {}", updated.getIssueId());
        return updated;
    }

    public List<Issues> getIssuesByProjectId(Integer projectId) {
        log.debug("Retrieving issues for project id: {}", projectId);
        List<Issues> issues = issuesRepository.findByProject_ProjId(projectId);
        log.info("Retrieved {} issues for project id: {}", issues.size(), projectId);
        return issues;
    }

    public String deleteIssue(Integer id) {
        try {
            log.info("Deleting issue with id: {}", id);
            issuesRepository.deleteById(id);
            log.info("Issue deleted successfully for id {}", id);
            return "Issue deleted successfully.";
        } catch (Exception e) {
            log.error("Failed to delete issue for id: {}. ERROR: {}", id, e.getMessage(), e);
            return "Failed to delete issue." + e.getMessage();
        }
    }
}

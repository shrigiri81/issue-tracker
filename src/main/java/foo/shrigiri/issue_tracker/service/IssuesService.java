package foo.shrigiri.issue_tracker.service;

import foo.shrigiri.issue_tracker.model.Issues;
import foo.shrigiri.issue_tracker.repository.IssuesRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class IssuesService {

    private final IssuesRepository issuesRepository;

    public IssuesService(IssuesRepository issuesRepository) {
        this.issuesRepository = issuesRepository;
    }

    public List<Issues> getAllIssues() {
        return issuesRepository.findAll();
    }

    public Optional<Issues> getIssueById(Integer id) {
        return issuesRepository.findById(id);
    }

    public String addIssue(Issues issue) {
        try {
            issuesRepository.save(issue);
            return "Issue added succesfully";
        } catch (Exception e) {
            return "Failed to add issue." + e.getMessage();
        }
    }

    public Issues updateIssue(Issues issue) {
        return issuesRepository.save(issue);
    }
}

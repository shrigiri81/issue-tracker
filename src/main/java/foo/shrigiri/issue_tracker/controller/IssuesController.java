package foo.shrigiri.issue_tracker.controller;

import foo.shrigiri.issue_tracker.model.Issues;
import foo.shrigiri.issue_tracker.service.IssuesService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Optional;

@RestController
public class IssuesController {

    private final IssuesService issuesService;

    public IssuesController(IssuesService issuesService) {
        this.issuesService = issuesService;
    }

    @GetMapping("/api/issues")
    public List<Issues> getAllIssues() {
        return issuesService.getAllIssues();
    }

    @GetMapping("/api/issues/{id}")
    public Optional<Issues> getIssueById(Integer id) {
        return issuesService.getIssueById(id);
    }

    @PostMapping("/api/issues")
    public String addIssue(@RequestBody Issues issue) {
        return issuesService.addIssue(issue);
    }

    @PostMapping("/api/issues/{id}")
    public Issues updateIssue(@RequestBody Issues issue) {
        return issuesService.updateIssue(issue);
    }
}

package foo.shrigiri.issue_tracker.service;

import foo.shrigiri.issue_tracker.controller.SearchController;
import foo.shrigiri.issue_tracker.repository.IssuesRepository;
import foo.shrigiri.issue_tracker.repository.ProjectRepository;
import foo.shrigiri.issue_tracker.repository.UsersRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@Slf4j
public class SearchService {

    private final UsersRepository usersRepository;
    private final ProjectRepository projectRepository;
    private final IssuesRepository issuesRepository;

    public SearchService(UsersRepository usersRepository, ProjectRepository projectRepository, IssuesRepository issuesRepository) {
        this.usersRepository = usersRepository;
        this.projectRepository = projectRepository;
        this.issuesRepository = issuesRepository;
        log.info("SearchService initialized");
    }

    public List<SearchController.SearchResponse> search(String q) {
        log.debug("Searching across users, projects, and issues with query: '{}'", q);

        List<SearchController.SearchResponse> results = new ArrayList<>();

        var userMatches = usersRepository.findByUsernameContainsIgnoreCase(q);
        userMatches.forEach(user ->
                results.add(new SearchController.SearchResponse(user.getUserId(), "USER", user.getUsername()))
        );
        log.debug("Found {} user match(es) for query '{}'", userMatches.size(), q);

        var projectMatches = projectRepository.findByProjTitleContainsIgnoreCase(q);
        projectMatches.forEach(proj ->
                results.add(new SearchController.SearchResponse(proj.getProjId(), "PROJECT", proj.getProjTitle()))
        );
        log.debug("Found {} project match(es) for query '{}'", projectMatches.size(), q);

        var issueMatches = issuesRepository.findByIssueTitleContainsIgnoreCase(q);
        issueMatches.forEach(issue ->
                results.add(new SearchController.SearchResponse(issue.getIssueId(), "ISSUE", issue.getIssueTitle()))
        );
        log.debug("Found {} issue match(es) for query '{}'", issueMatches.size(), q);

        log.info("Search for '{}' completed with {} total result(s)", q, results.size());
        return results;
    }
}

package foo.shrigiri.issue_tracker.service;

import foo.shrigiri.issue_tracker.controller.SearchController;
import foo.shrigiri.issue_tracker.repository.IssuesRepository;
import foo.shrigiri.issue_tracker.repository.ProjectRepository;
import foo.shrigiri.issue_tracker.repository.UsersRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class SearchService {

    private final UsersRepository usersRepository;
    private final ProjectRepository projectRepository;
    private final IssuesRepository issuesRepository;

    public SearchService(UsersRepository usersRepository, ProjectRepository projectRepository, IssuesRepository issuesRepository) {
        this.usersRepository = usersRepository;
        this.projectRepository = projectRepository;
        this.issuesRepository = issuesRepository;
    }

    public List<SearchController.SearchResponse> search(String q) {

        List<SearchController.SearchResponse> results = new ArrayList<>();

        usersRepository.findByUsernameContainsIgnoreCase(q)
                .forEach(user ->
                        results.add(new SearchController.SearchResponse(
                                user.getUserId(),
                                "USER",
                                user.getUsername()
                        ))
                );

        projectRepository.findByProjTitleContainsIgnoreCase(q)
                .forEach(user ->
                        results.add(new SearchController.SearchResponse(
                                user.getProjId(),
                                "PROJECT",
                                user.getProjTitle()
                        ))
                );

        issuesRepository.findByIssueTitleContainsIgnoreCase(q)
                .forEach(user ->
                        results.add(new SearchController.SearchResponse(
                                user.getIssueId(),
                                "ISSUE",
                                user.getIssueTitle()
                        ))
                );

        return results;
    }
}

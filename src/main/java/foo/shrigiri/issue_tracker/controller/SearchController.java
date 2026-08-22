package foo.shrigiri.issue_tracker.controller;

import foo.shrigiri.issue_tracker.service.SearchService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/search")
public class SearchController {

    private final SearchService searchService;

    public SearchController(SearchService searchService) {
        this.searchService = searchService;
    }

    public record SearchResponse(
            Integer id,
            String type,
            String name
    ) {}

    @GetMapping
    public List<SearchResponse> search(@RequestParam("query") String query) {
        return searchService.search(query);
    }
}

package foo.shrigiri.issue_tracker.controller;

import foo.shrigiri.issue_tracker.service.SearchService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/search")
@Slf4j
public class SearchController {

    private final SearchService searchService;

    public SearchController(SearchService searchService) {
        this.searchService = searchService;
        log.info("SearchController initialized");
    }

    public record SearchResponse(
            Integer id,
            String type,
            String name
    ) {}

    @GetMapping
    public ResponseEntity<List<SearchResponse>> search(@RequestParam("query") String query) {
        log.debug("Search request with query: '{}'", query);
        List<SearchResponse> results = searchService.search(query);
        log.info("Search for '{}' returned {} result(s)", query, results.size());
        return ResponseEntity.ok(results);
    }
}

package foo.shrigiri.issue_tracker.controller;

import foo.shrigiri.issue_tracker.model.Comments;
import foo.shrigiri.issue_tracker.service.CommentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
public class CommentController {

    private final CommentService commentService;

    public CommentController(CommentService commentService) {
        this.commentService = commentService;
    }

    @GetMapping("/api/issues/{issueId}/comments")
    public ResponseEntity<List<Comments>> getAllComments() {
        List<Comments> response = commentService.getAllComments();

        return ResponseEntity.ok(response);
    }

    @GetMapping("/api/issues/{issueId}/comments/{commentId}")
    public ResponseEntity<?> getCommentById(@PathVariable Integer commentId) {
        Optional<Comments> response = commentService.getCommentById(commentId);

        if (response.isPresent()) {
            return ResponseEntity.ok(response);
        }

        return ResponseEntity.notFound().build();
    }

    @PostMapping("/api/issues/{issueId}/comments")
    public ResponseEntity<Comments> addComment(@RequestBody Comments comment) {
        Comments response = commentService.addComment(comment);

        return ResponseEntity.accepted().body(response);
    }

    @PatchMapping("/api/issues/{issue_id}/comments/{commentId}")
    public ResponseEntity<Comments> updateCommentContent(@PathVariable Integer commentId, @RequestBody String commentData) {
        Comments response = commentService.updateCommentContent(commentId, commentData);

        return ResponseEntity.accepted().body(response);
    }

    @DeleteMapping("/api/issues/{issue_id}/comments/{commentId}")
    public ResponseEntity<String> deleteComment(@PathVariable Integer commentId) {
        String response = commentService.deleteComment(commentId);

        return ResponseEntity.ok(response);
    }
}

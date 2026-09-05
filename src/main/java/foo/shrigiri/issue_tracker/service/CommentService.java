package foo.shrigiri.issue_tracker.service;

import foo.shrigiri.issue_tracker.model.Comments;
import foo.shrigiri.issue_tracker.repository.CommentRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class CommentService {

    private final CommentRepository commentRepository;

    public CommentService(CommentRepository commentRepository) {
        this.commentRepository = commentRepository;
    }

    public List<Comments> getAllComments() {
        return commentRepository.findAll();
    }

    public Optional<Comments> getCommentById(Integer commentId) {
        return commentRepository.findById(commentId);
    }

    public Comments addComment(Comments comment) {
        return commentRepository.save(comment);
    }

    public Comments updateCommentContent(Integer commentId, String commentData) {
        Comments response = commentRepository.findById(commentId).orElseThrow(() -> new RuntimeException("Comment not found"));
        response.setCommentData(commentData);
        commentRepository.save(response);

        return response;
    }

    public String deleteComment(Integer commentId) {
        if (commentRepository.existsById(commentId)) {
            commentRepository.deleteById(commentId);
            return "Comment deleted successfully";
        }
        return "Failed to delete comment.";
    }
}

package foo.shrigiri.issue_tracker.service;

import foo.shrigiri.issue_tracker.dto.CommentRequest;
import foo.shrigiri.issue_tracker.model.Comments;
import foo.shrigiri.issue_tracker.model.Issues;
import foo.shrigiri.issue_tracker.model.Users;
import foo.shrigiri.issue_tracker.repository.CommentRepository;
import foo.shrigiri.issue_tracker.repository.IssuesRepository;
import foo.shrigiri.issue_tracker.repository.UsersRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class CommentService {

    private final CommentRepository commentRepository;
    private final UsersRepository usersRepository;
    private final IssuesRepository issuesRepository;

    public CommentService(CommentRepository commentRepository, UsersRepository usersRepository, IssuesRepository issuesRepository) {
        this.commentRepository = commentRepository;
        this.usersRepository = usersRepository;
        this.issuesRepository = issuesRepository;
    }

    public List<Comments> getAllComments() {
        return commentRepository.findAll();
    }

    public List<Comments> getCommentsByIssueId(Integer issueId) {
        return commentRepository.findByIssue_IssueId(issueId);
    }

    public Optional<Comments> getCommentById(Integer commentId) {
        return commentRepository.findById(commentId);
    }

    public Comments addComment(Integer issueId, CommentRequest commentRequest, String username) {
        Users author = usersRepository.findByUsername(username);
        Issues issue = issuesRepository.findById(issueId).orElseThrow(() -> new RuntimeException("Issue not found"));

        Comments comment = new Comments();
        comment.setCommentData(commentRequest.getCommentContent());
        comment.setCommentAuthor(author);
        comment.setIssue(issue);

        if (commentRequest.getRepliedTo() != null) {
            Comments parent = commentRepository.findById(
                    commentRequest.getRepliedTo()).orElseThrow(() -> new RuntimeException("OP Comment not found"));

            comment.setRepliedTo(parent);
        }

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

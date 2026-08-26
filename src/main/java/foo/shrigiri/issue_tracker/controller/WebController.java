package foo.shrigiri.issue_tracker.controller;

import foo.shrigiri.issue_tracker.model.Issues;
import foo.shrigiri.issue_tracker.model.Projects;
import foo.shrigiri.issue_tracker.model.Users;
import foo.shrigiri.issue_tracker.service.IssuesService;
import foo.shrigiri.issue_tracker.service.ProjectService;
import foo.shrigiri.issue_tracker.service.UsersService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Controller
@Slf4j
public class WebController {

    private final ProjectService projectService;
    private final IssuesService issuesService;
    private final UsersService usersService;

    public WebController(ProjectService projectService,
                         IssuesService issuesService,
                         UsersService usersService) {
        this.projectService = projectService;
        this.issuesService = issuesService;
        this.usersService = usersService;
        log.info("WebController initialized");
    }

    // ─── Root ────────────────────────────────────────────────────────────────────

    @GetMapping("/")
    public String root() {
        return "redirect:/dashboard";
    }

    // ─── Login / Register ────────────────────────────────────────────────────────

    @GetMapping("/login")
    public String loginPage() {
        return "login";
    }

    @GetMapping("/register")
    public String registerPage(Model model) {
        model.addAttribute("user", new Users());
        return "register";
    }

    @PostMapping("/register")
    public String register(@ModelAttribute Users user, RedirectAttributes redirectAttributes) {
        log.info("Web registration attempt for username: {}", user.getUsername());
        try {
            usersService.register(user);
            redirectAttributes.addFlashAttribute("success", "Account created! Please log in.");
            return "redirect:/login";
        } catch (Exception e) {
            log.error("Registration failed: {}", e.getMessage());
            redirectAttributes.addFlashAttribute("error", "Registration failed: " + e.getMessage());
            return "redirect:/register";
        }
    }

    // ─── Dashboard ───────────────────────────────────────────────────────────────

    @GetMapping("/dashboard")
    public String dashboard(Model model, Authentication authentication) {
        log.debug("Loading dashboard");
        List<Projects> projects = projectService.getAllProjects();

        // Build issue count map: projectId -> count
        Map<Integer, Long> issueCountMap = projects.stream()
                .collect(Collectors.toMap(
                        Projects::getProjId,
                        p -> (long) issuesService.getIssuesByProjectId(p.getProjId()).size()
                ));

        model.addAttribute("projects", projects);
        model.addAttribute("issueCountMap", issueCountMap);
        model.addAttribute("currentUser", authentication != null ? authentication.getName() : "");
        model.addAttribute("newProject", new Projects());
        log.info("Dashboard loaded with {} projects", projects.size());
        return "dashboard";
    }

    @PostMapping("/projects")
    public String createProject(@ModelAttribute Projects project,
                                Authentication authentication,
                                RedirectAttributes redirectAttributes) {
        log.info("Creating project: {}", project.getProjTitle());
        try {
            // Resolve owner from logged-in user
            Users owner = usersService.findByUsername(authentication.getName());
            if (owner != null) {
                project.setOwnerId(owner.getUserId());
            }
            projectService.addProject(project);
            redirectAttributes.addFlashAttribute("success", "Project created successfully.");
        } catch (Exception e) {
            log.error("Failed to create project: {}", e.getMessage());
            redirectAttributes.addFlashAttribute("error", "Failed to create project.");
        }
        return "redirect:/dashboard";
    }

    // ─── Project Detail ──────────────────────────────────────────────────────────

    @GetMapping("/projects/{id}")
    public String projectDetail(@PathVariable Integer id, Model model, Authentication authentication) {
        log.debug("Loading project detail for id: {}", id);
        Optional<Projects> projectOpt = projectService.getProjectById(id);
        if (projectOpt.isEmpty()) {
            return "redirect:/dashboard";
        }

        Projects project = projectOpt.get();
        List<Issues> issues = issuesService.getIssuesByProjectId(id);

        // Resolve user IDs to usernames
        List<Users> allUsers = usersService.getAllUsers();
        Map<Integer, String> userMap = allUsers.stream()
                .collect(Collectors.toMap(Users::getUserId, Users::getUsername));

        // Resolve owner username
        String ownerName = userMap.getOrDefault(project.getOwnerId(), "Unknown");

        model.addAttribute("project", project);
        model.addAttribute("issues", issues);
        model.addAttribute("userMap", userMap);
        model.addAttribute("ownerName", ownerName);
        model.addAttribute("allUsers", allUsers);
        model.addAttribute("currentUser", authentication != null ? authentication.getName() : "");
        model.addAttribute("newIssue", new Issues());
        log.info("Project detail loaded: {} issues for project {}", issues.size(), project.getProjTitle());
        return "project-detail";
    }

    @PostMapping("/projects/{id}/issues")
    public String createIssue(@PathVariable Integer id,
                              @ModelAttribute Issues issue,
                              Authentication authentication,
                              RedirectAttributes redirectAttributes) {
        log.info("Creating issue '{}' for project {}", issue.getIssueTitle(), id);
        try {
            issue.setProjectId(id);
            Users creator = usersService.findByUsername(authentication.getName());
            if (creator != null) {
                issue.setCreatedBy(creator.getUserId());
            }
            if (issue.getStatus() == null || issue.getStatus().isBlank()) {
                issue.setStatus("OPEN");
            }
            if (issue.getPriority() == null || issue.getPriority().isBlank()) {
                issue.setPriority("MEDIUM");
            }
            issuesService.addIssue(issue);
            redirectAttributes.addFlashAttribute("success", "Issue created successfully.");
        } catch (Exception e) {
            log.error("Failed to create issue: {}", e.getMessage());
            redirectAttributes.addFlashAttribute("error", "Failed to create issue.");
        }
        return "redirect:/projects/" + id;
    }

    // ─── Issue Detail ────────────────────────────────────────────────────────────

    @GetMapping("/issues/{id}")
    public String issueDetail(@PathVariable Integer id, Model model, Authentication authentication) {
        log.debug("Loading issue detail for id: {}", id);
        Optional<Issues> issueOpt = issuesService.getIssueById(id);
        if (issueOpt.isEmpty()) {
            return "redirect:/dashboard";
        }

        Issues issue = issueOpt.get();
        Optional<Projects> projectOpt = projectService.getProjectById(issue.getProjectId());

        List<Users> allUsers = usersService.getAllUsers();
        Map<Integer, String> userMap = allUsers.stream()
                .collect(Collectors.toMap(Users::getUserId, Users::getUsername));

        String createdByName = userMap.getOrDefault(issue.getCreatedBy(), "Unknown");
        String assignedToName = userMap.getOrDefault(issue.getAssignedTo(), "Unassigned");
        String projectName = projectOpt.map(Projects::getProjTitle).orElse("Unknown Project");

        model.addAttribute("issue", issue);
        model.addAttribute("projectName", projectName);
        model.addAttribute("projectId", issue.getProjectId());
        model.addAttribute("createdByName", createdByName);
        model.addAttribute("assignedToName", assignedToName);
        model.addAttribute("allUsers", allUsers);
        model.addAttribute("currentUser", authentication != null ? authentication.getName() : "");
        log.info("Issue detail loaded for issue id: {}", id);
        return "issue-detail";
    }

    @PostMapping("/issues/{id}/update")
    public String updateIssue(@PathVariable Integer id,
                              @ModelAttribute Issues issue,
                              RedirectAttributes redirectAttributes) {
        log.info("Updating issue id: {}", id);
        try {
            Issues existing = issuesService.getIssueById(id).orElseThrow();
            existing.setIssueTitle(issue.getIssueTitle());
            existing.setIssueDesc(issue.getIssueDesc());
            existing.setStatus(issue.getStatus());
            existing.setPriority(issue.getPriority());
            existing.setAssignedTo(issue.getAssignedTo());
            issuesService.updateIssue(existing);
            redirectAttributes.addFlashAttribute("success", "Issue updated successfully.");
        } catch (Exception e) {
            log.error("Failed to update issue: {}", e.getMessage());
            redirectAttributes.addFlashAttribute("error", "Failed to update issue.");
        }
        return "redirect:/issues/" + id;
    }
}

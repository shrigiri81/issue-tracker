package foo.shrigiri.issue_tracker.controller;

import foo.shrigiri.issue_tracker.model.Projects;
import foo.shrigiri.issue_tracker.service.ProjectService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
public class ProjectController {

    private final ProjectService projectService;

    public ProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }

    @GetMapping("/api/projects")
    public List<Projects> getAllProjects() {
        return projectService.getAllProjects();
    }

    @GetMapping("/api/projects/{id}")
    public Optional<Projects> getProjectById(@PathVariable Integer id) {
        return projectService.getProjectById(id);
    }

    @PostMapping("/api/projects")
    public Projects addProject(@RequestBody Projects project) {
        return projectService.addProject(project);
    }

    @DeleteMapping("/api/projects/{id}")
    public String deleteProject(@PathVariable Integer id) {
        return projectService.deleteProject(id);
    }

    @PostMapping("/api/projects/{id}")
    public Projects updateProject(@RequestBody Projects projects) {
        return projectService.updateProject(projects);
    }
}

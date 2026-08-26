package foo.shrigiri.issue_tracker.controller;

import foo.shrigiri.issue_tracker.model.Projects;
import foo.shrigiri.issue_tracker.service.ProjectService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@Slf4j
public class ProjectController {

    private final ProjectService projectService;

    public ProjectController(ProjectService projectService) {
        this.projectService = projectService;
        log.info("ProjectController initialized");
    }

    @GetMapping("/api/projects")
    public ResponseEntity<List<Projects>> getAllProjects(Model model) {
        log.debug("Fetching all projects");
        List<Projects> projects = projectService.getAllProjects();
        log.info("Fetched {} projects", projects.size());
        return ResponseEntity.ok(projects);
    }

    @GetMapping("/api/projects/{id}")
    public ResponseEntity<Projects> getProjectById(@PathVariable Integer id) {
        log.debug("Fetching project with id: {}", id);
        Optional<Projects> project = projectService.getProjectById(id);
        if (project.isPresent()) {
            log.info("Project found for id: {}", id);
        } else {
            log.warn("Project not found for id: {}", id);
        }
        return project.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/api/projects")
    public ResponseEntity<Projects> addProject(@RequestBody Projects project) {
        log.info("Adding new project: {}", project.getProjTitle());
        Projects saved = projectService.addProject(project);
        log.info("Project added successfully with id: {}", saved.getProjId());
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @DeleteMapping("/api/projects/{id}")
    public ResponseEntity<String> deleteProject(@PathVariable Integer id) {
        log.info("Deleting project with id: {}", id);
        String result = projectService.deleteProject(id);
        log.info("Delete project result for id {}: {}", id, result);
        return ResponseEntity.ok(result);
    }

    @PutMapping("/api/projects/{id}")
    public ResponseEntity<Projects> updateProject(@PathVariable Integer id, @RequestBody Projects project) {
        log.info("Updating project with id: {}", project.getProjId());
        Projects updated = projectService.updateProject(id, project);
        log.info("Project updated successfully for id: {}", updated.getProjId());
        return ResponseEntity.ok(updated);
    }
}

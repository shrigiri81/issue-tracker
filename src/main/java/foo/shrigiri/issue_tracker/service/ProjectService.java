package foo.shrigiri.issue_tracker.service;

import foo.shrigiri.issue_tracker.model.Projects;
import foo.shrigiri.issue_tracker.repository.ProjectRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ProjectService {

    private final ProjectRepository projectRepository;

    public ProjectService(ProjectRepository projectRepository) {
        this.projectRepository = projectRepository;
    }

    public List<Projects> getAllProjects() {
        return projectRepository.findAll();
    }

    public Optional<Projects> getProjectById(Integer id) {
        return projectRepository.findById(id);
    }

    public Projects addProject(Projects project) {
        return projectRepository.save(project);
    }

    public String deleteProject(Integer id) {
        try {
            projectRepository.deleteById(id);
            return "Project Deleted Successfully";
        } catch (Exception e) {
            return "Failed to delete Project, something went wrong." + e.getMessage();
        }
    }

    public Projects updateProject(Projects projects) {
        return projectRepository.save(projects);
    }
}

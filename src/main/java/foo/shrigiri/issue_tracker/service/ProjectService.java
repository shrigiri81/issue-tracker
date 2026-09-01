package foo.shrigiri.issue_tracker.service;

import foo.shrigiri.issue_tracker.model.Projects;
import foo.shrigiri.issue_tracker.model.Users;
import foo.shrigiri.issue_tracker.repository.ProjectRepository;
import foo.shrigiri.issue_tracker.repository.UsersRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Slf4j
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final UsersRepository usersRepository;

    public ProjectService(ProjectRepository projectRepository, UsersRepository usersRepository) {
        this.projectRepository = projectRepository;
        this.usersRepository = usersRepository;
        log.info("ProjectService initialized");
    }

    public List<Projects> getAllProjects(String username) {
        Users user1 = usersRepository.findByUsername(username);
        List<Projects> projects = null;
        log.debug("Retrieving all projects from database");
        if (user1.getRole().equals("ADMIN")) {
            log.debug("Retrieving all projects for role 'ADMIN'");
            projects = projectRepository.findAll();
        } else {
            log.debug("Retrieving all projects for role 'USER'");
            projects = projectRepository.findByProjectMembersUsername(username);
        }
        log.info("Retrieved {} projects from database", projects.size());
        return projects;
    }

    public Optional<Projects> getProjectById(Integer id) {
        log.debug("Retrieving project with id: {}", id);
        Optional<Projects> project = projectRepository.findById(id);
        if (project.isPresent()) {
            log.info("Project found with id: {}", id);
        } else {
            log.warn("Project not found with id: {}", id);
        }
        return project;
    }

    public Projects addProject(Projects project, List<Integer> projectMembersUserIds) {
        log.info("Saving new project: {}", project.getProjTitle());
        List<Users> projectMembers = projectMembersUserIds.stream()
                .map(user -> usersRepository.findById(user)
                        .orElseThrow(() -> new RuntimeException("User not found"))
                ).collect(Collectors.toList());
        project.setProjectMembers(projectMembers);
        Projects saved = projectRepository.save(project);
        log.info("Project saved successfully with id: {}", saved.getProjId());
        return saved;
    }

    public String deleteProject(Integer id) {
        log.info("Deleting project with id: {}", id);
        try {
            if (projectRepository.existsById(id)) {
                projectRepository.deleteById(id);
                log.info("Project deleted successfully with id: {}", id);
                return "Project Deleted Successfully";
            }
            return "Project not found";
        } catch (Exception e) {
            log.error("Failed to delete project with id {}: {}", id, e.getMessage(), e);
            return "Failed to delete Project, something went wrong." + e.getMessage();
        }
    }

    public Projects updateProject(Integer id, Projects project, List<Integer> projectMembersUserIds) {
        log.info("Updating project with id: {}", id);
        log.info("Getting current project with id: {}", id);
        Projects project1 = projectRepository.findById(id).orElseThrow(() -> new RuntimeException("Project not found"));
        List<Users> projectMembers = projectMembersUserIds.stream()
                        .map(userId -> usersRepository.findById(userId)
                                .orElseThrow(() -> new RuntimeException("User not found"))
                        ).collect(Collectors.toList());
        log.info("Preparing project object to be updated");
        project1.setProjTitle(project.getProjTitle());
        project1.setProjDesc(project.getProjDesc());
        project1.setOwnerId(project.getOwnerId());
        project1.setProjectMembers(projectMembers);

        Projects updated = projectRepository.save(project1);
        log.info("Project updated successfully with id: {}", id);
        return updated;
    }
}

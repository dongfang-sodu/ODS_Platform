package com.dongfangsodu.ods.trace.service;

import com.dongfangsodu.ods.repository.KnowledgeNodeRepository;
import com.dongfangsodu.ods.repository.PmoProjectRepository;
import com.dongfangsodu.ods.repository.ProjectRepository;
import com.dongfangsodu.ods.repository.TicketRepository;
import com.dongfangsodu.ods.repository.TrainingCourseRepository;
import com.dongfangsodu.ods.repository.VehicleSalesRecordRepository;
import com.dongfangsodu.ods.repository.VideoGuidelineRepository;
import java.util.Locale;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class ArtifactSourceRegistry {
    private final ProjectRepository projects;
    private final PmoProjectRepository pmoProjects;
    private final VehicleSalesRecordRepository sales;
    private final TrainingCourseRepository courses;
    private final KnowledgeNodeRepository knowledge;
    private final VideoGuidelineRepository videos;
    private final TicketRepository tickets;

    public ArtifactSourceRegistry(ProjectRepository projects, PmoProjectRepository pmoProjects,
                                  VehicleSalesRecordRepository sales, TrainingCourseRepository courses,
                                  KnowledgeNodeRepository knowledge, VideoGuidelineRepository videos,
                                  TicketRepository tickets) {
        this.projects = projects;
        this.pmoProjects = pmoProjects;
        this.sales = sales;
        this.courses = courses;
        this.knowledge = knowledge;
        this.videos = videos;
        this.tickets = tickets;
    }

    public boolean exists(String sourceModule, String sourceObjectId) {
        String module = sourceModule.toUpperCase(Locale.ROOT);
        if (module.equals("TRACE_LOCAL")) {
            return true;
        }
        UUID id;
        try {
            id = UUID.fromString(sourceObjectId);
        } catch (IllegalArgumentException exception) {
            return false;
        }
        return switch (module) {
            case "PROJECT" -> projects.existsById(id);
            case "PMO" -> pmoProjects.existsById(id);
            case "VEHICLE_MARKET" -> sales.existsById(id);
            case "ACADEMY" -> courses.existsById(id);
            case "KNOWLEDGE" -> knowledge.existsById(id);
            case "VIDEO_GUIDELINE" -> videos.existsById(id);
            case "WORKSPACE" -> tickets.existsById(id);
            default -> false;
        };
    }
}

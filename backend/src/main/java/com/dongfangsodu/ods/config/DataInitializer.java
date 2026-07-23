package com.dongfangsodu.ods.config;

import com.dongfangsodu.ods.domain.KnowledgeNode;
import com.dongfangsodu.ods.domain.NodeType;
import com.dongfangsodu.ods.domain.Role;
import com.dongfangsodu.ods.domain.Ticket;
import com.dongfangsodu.ods.domain.TicketPriority;
import com.dongfangsodu.ods.domain.TrainingCourse;
import com.dongfangsodu.ods.domain.UserAccount;
import com.dongfangsodu.ods.domain.VehicleSalesRecord;
import com.dongfangsodu.ods.domain.VideoGuideline;
import com.dongfangsodu.ods.repository.KnowledgeNodeRepository;
import com.dongfangsodu.ods.repository.TicketRepository;
import com.dongfangsodu.ods.repository.TrainingCourseRepository;
import com.dongfangsodu.ods.repository.UserAccountRepository;
import com.dongfangsodu.ods.repository.VehicleSalesRecordRepository;
import com.dongfangsodu.ods.repository.VideoGuidelineRepository;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Set;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@ConditionalOnProperty(name = "ods.seed.enabled", havingValue = "true")
public class DataInitializer implements ApplicationRunner {
    private final UserAccountRepository users;
    private final TicketRepository tickets;
    private final TrainingCourseRepository courses;
    private final VehicleSalesRecordRepository sales;
    private final VideoGuidelineRepository videos;
    private final KnowledgeNodeRepository knowledge;
    private final PasswordEncoder passwordEncoder;
    private final String seedPassword;

    public DataInitializer(UserAccountRepository users, TicketRepository tickets,
                           TrainingCourseRepository courses, VehicleSalesRecordRepository sales,
                           VideoGuidelineRepository videos, KnowledgeNodeRepository knowledge,
                           PasswordEncoder passwordEncoder,
                           @Value("${ods.seed.password}") String seedPassword) {
        this.users = users;
        this.tickets = tickets;
        this.courses = courses;
        this.sales = sales;
        this.videos = videos;
        this.knowledge = knowledge;
        this.passwordEncoder = passwordEncoder;
        if (seedPassword == null || seedPassword.length() < 12) {
            throw new IllegalStateException(
                    "ODS_SEED_PASSWORD must contain at least 12 characters when seed data is enabled");
        }
        this.seedPassword = seedPassword;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        seedUsers();
        seedTickets();
        seedCourses();
        seedSales();
        seedVideos();
        seedKnowledge();
    }

    private void seedUsers() {
        if (users.count() > 0) {
            return;
        }
        String password = passwordEncoder.encode(seedPassword);
        users.save(new UserAccount("admin", "admin@ods.local", password, "ODS Administrator",
                Set.of(Role.ADMIN, Role.TPJM, Role.LPM, Role.COORDINATOR, Role.USER)));
        users.save(new UserAccount("tpjm", "tpjm@ods.local", password, "Lead Project Manager",
                Set.of(Role.TPJM, Role.USER)));
        users.save(new UserAccount("lpm", "lpm@ods.local", password, "Lead PMO Manager",
                Set.of(Role.LPM, Role.PJM, Role.USER)));
        users.save(new UserAccount("demo", "demo@ods.local", password, "Demo User", Set.of(Role.USER)));
    }

    private void seedTickets() {
        if (tickets.count() > 0) {
            return;
        }
        tickets.save(new Ticket("ODS-101", "Complete project milestone review", "demo", "ODS",
                TicketPriority.HIGH, LocalDate.now().plusDays(2)));
        tickets.save(new Ticket("ODS-102", "Validate CAAM product mappings", "demo", "MARKET",
                TicketPriority.MEDIUM, LocalDate.now().plusDays(5)));
    }

    private void seedCourses() {
        if (courses.count() > 0) {
            return;
        }
        courses.save(new TrainingCourse("ODS project management onboarding", Instant.now().plus(7, ChronoUnit.DAYS),
                Instant.now().plus(7, ChronoUnit.DAYS).plus(2, ChronoUnit.HOURS), "Academy Trainer",
                "EDS Academy", "XC-AS team", "EDS", null, "Project workflow and role training", "admin"));
    }

    private void seedSales() {
        if (sales.count() > 0) {
            return;
        }
        sales.save(new VehicleSalesRecord(2024, 11, "OEM Alpha", "A1", 10100, null, "CAAM"));
        sales.save(new VehicleSalesRecord(2024, 11, "OEM Beta", "B1", 8700, null, "CAAM"));
        sales.save(new VehicleSalesRecord(2024, 12, "OEM Alpha", "A1", 11200, null, "CAAM"));
        sales.save(new VehicleSalesRecord(2024, 12, "OEM Beta", "B1", 9200, null, "CAAM"));
        sales.save(new VehicleSalesRecord(2024, 12, "OEM Gamma", "G1", 4100, null, "CAAM"));
    }

    private void seedVideos() {
        if (videos.count() > 0) {
            return;
        }
        videos.save(new VideoGuideline("How to create a project", "Project Management",
                "Create a QG4 project and understand required fields", "https://example.invalid/videos/create-project",
                null, 10));
        videos.save(new VideoGuideline("How to filter projects", "Project Management",
                "Use project filters and keyword search", "https://example.invalid/videos/filter-projects",
                null, 20));
    }

    private void seedKnowledge() {
        if (knowledge.count() > 0) {
            return;
        }
        KnowledgeNode root = knowledge.save(new KnowledgeNode("EDS Knowledge Base", NodeType.CATEGORY,
                null, null, "Central learning resources", 10));
        knowledge.save(new KnowledgeNode("Project Management Guide", NodeType.LINK, root,
                "https://example.invalid/knowledge/project-management", "Project management handbook", 10));
    }
}

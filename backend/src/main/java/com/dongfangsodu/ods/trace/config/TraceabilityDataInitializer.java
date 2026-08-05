package com.dongfangsodu.ods.trace.config;

import com.dongfangsodu.ods.domain.KnowledgeNode;
import com.dongfangsodu.ods.domain.Ticket;
import com.dongfangsodu.ods.domain.TrainingCourse;
import com.dongfangsodu.ods.domain.VideoGuideline;
import com.dongfangsodu.ods.repository.KnowledgeNodeRepository;
import com.dongfangsodu.ods.repository.TicketRepository;
import com.dongfangsodu.ods.repository.TrainingCourseRepository;
import com.dongfangsodu.ods.repository.VideoGuidelineRepository;
import com.dongfangsodu.ods.trace.domain.Artifact;
import com.dongfangsodu.ods.trace.domain.ArtifactType;
import com.dongfangsodu.ods.trace.domain.ArtifactVersion;
import com.dongfangsodu.ods.trace.domain.PropagationMode;
import com.dongfangsodu.ods.trace.domain.RelationTypeDefinition;
import com.dongfangsodu.ods.trace.domain.TraceRelation;
import com.dongfangsodu.ods.trace.repository.ArtifactRepository;
import com.dongfangsodu.ods.trace.repository.ArtifactTypeRepository;
import com.dongfangsodu.ods.trace.repository.ArtifactVersionRepository;
import com.dongfangsodu.ods.trace.repository.RelationTypeRepository;
import com.dongfangsodu.ods.trace.repository.TraceRelationRepository;
import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Order(20)
@ConditionalOnProperty(name = "ods.seed.enabled", havingValue = "true")
public class TraceabilityDataInitializer implements ApplicationRunner {
    private final ArtifactTypeRepository artifactTypes;
    private final RelationTypeRepository relationTypes;
    private final ArtifactRepository artifacts;
    private final ArtifactVersionRepository versions;
    private final TraceRelationRepository relations;
    private final TrainingCourseRepository courses;
    private final KnowledgeNodeRepository knowledge;
    private final VideoGuidelineRepository videos;
    private final TicketRepository tickets;

    public TraceabilityDataInitializer(ArtifactTypeRepository artifactTypes,
                                       RelationTypeRepository relationTypes,
                                       ArtifactRepository artifacts,
                                       ArtifactVersionRepository versions,
                                       TraceRelationRepository relations,
                                       TrainingCourseRepository courses,
                                       KnowledgeNodeRepository knowledge,
                                       VideoGuidelineRepository videos,
                                       TicketRepository tickets) {
        this.artifactTypes = artifactTypes;
        this.relationTypes = relationTypes;
        this.artifacts = artifacts;
        this.versions = versions;
        this.relations = relations;
        this.courses = courses;
        this.knowledge = knowledge;
        this.videos = videos;
        this.tickets = tickets;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (artifactTypes.count() == 0) {
            seedArtifactTypes();
        }
        if (relationTypes.count() == 0) {
            seedRelationTypes();
        }
        if (artifacts.count() == 0) {
            seedAebGraph();
        }
    }

    private void seedArtifactTypes() {
        List.of(
                new ArtifactType("GOAL", "目标"),
                new ArtifactType("REQUIREMENT", "需求"),
                new ArtifactType("PARAMETER", "算法参数"),
                new ArtifactType("HARDWARE", "硬件配置"),
                new ArtifactType("ALGORITHM", "算法设计"),
                new ArtifactType("VEHICLE_CONFIG", "车辆与ADAS配置"),
                new ArtifactType("TEST", "测试工件"),
                new ArtifactType("MARKET_CONTENT", "市场分析说明"),
                new ArtifactType("TRAINING", "培训课程"),
                new ArtifactType("KNOWLEDGE", "知识节点"),
                new ArtifactType("GUIDELINE", "操作指南"),
                new ArtifactType("PROJECT", "项目与任务"),
                new ArtifactType("TICKET", "处理工单")
        ).forEach(artifactTypes::save);
    }

    private void seedRelationTypes() {
        List.of(
                relation("DECOMPOSES", "分解", "上层目标指向下层要求", PropagationMode.FORWARD, "0.85"),
                relation("CONSTRAINS", "约束", "约束条件指向受约束设计", PropagationMode.FORWARD, "1.00"),
                relation("CONFIGURES", "配置", "配置项指向被配置功能", PropagationMode.FORWARD, "0.95"),
                relation("IMPLEMENTED_BY", "实现", "需求指向实现或设计", PropagationMode.FORWARD, "0.90"),
                relation("VERIFIED_BY", "验证", "被验证对象指向测试工件", PropagationMode.FORWARD, "0.85"),
                relation("DEPENDS_ON", "依赖", "依赖对象指向前置对象", PropagationMode.REVERSE, "0.90"),
                relation("DESCRIBED_BY", "说明", "技术对象指向说明材料", PropagationMode.FORWARD, "0.75"),
                relation("TRIGGERS_TASK", "触发任务", "受影响工件指向处理工单", PropagationMode.FORWARD, "0.60")
        ).forEach(relationTypes::save);
    }

    private RelationTypeDefinition relation(String code, String name, String direction,
                                              PropagationMode mode, String weight) {
        return new RelationTypeDefinition(code, name, direction, mode, new BigDecimal(weight));
    }

    private void seedAebGraph() {
        Map<String, ArtifactVersion> nodes = new LinkedHashMap<>();
        addLocal(nodes, "GOAL_DISTANCE", "GOAL", "安全制动距离目标", "AEB-GOAL-001");
        addLocal(nodes, "REQ_AEB", "REQUIREMENT", "AEB触发功能要求", "AEB-REQ-001");
        addLocal(nodes, "REQ_WARNING", "REQUIREMENT", "碰撞预警要求", "AEB-REQ-002");
        addLocal(nodes, "PARAM_TTC", "PARAMETER", "TTC触发阈值 2.0 s", "AEB-PARAM-TTC");
        addLocal(nodes, "PARAM_DECEL", "PARAMETER", "目标减速度参数", "AEB-PARAM-DECEL");
        addLocal(nodes, "HW_RADAR", "HARDWARE", "前向雷达基础配置", "AEB-HW-RADAR");
        addLocal(nodes, "HW_CAMERA", "HARDWARE", "前视摄像头配置", "AEB-HW-CAMERA");
        addLocal(nodes, "HW_BRAKE", "HARDWARE", "制动执行器配置", "AEB-HW-BRAKE");
        addLocal(nodes, "ALGO_FUSION", "ALGORITHM", "目标融合算法配置", "AEB-ALGO-FUSION");
        addLocal(nodes, "ALGO_DECISION", "ALGORITHM", "AEB决策算法", "AEB-ALGO-DECISION");
        addLocal(nodes, "ALGO_CONTROL", "ALGORITHM", "自动制动控制策略", "AEB-ALGO-CONTROL");
        addLocal(nodes, "VEHICLE_A1", "VEHICLE_CONFIG", "A1车型AEB配置说明", "AEB-VEHICLE-A1");
        addLocal(nodes, "VEHICLE_B1", "VEHICLE_CONFIG", "B1车型AEB配置说明", "AEB-VEHICLE-B1");
        addLocal(nodes, "TEST_TTC", "TEST", "TTC阈值边界测试", "AEB-TEST-TTC");
        addLocal(nodes, "TEST_RADAR", "TEST", "雷达探测距离测试", "AEB-TEST-RADAR");
        addLocal(nodes, "TEST_FOV", "TEST", "雷达视场角测试", "AEB-TEST-FOV");
        addLocal(nodes, "TEST_LATENCY", "TEST", "感知链路延迟测试", "AEB-TEST-LATENCY");
        addLocal(nodes, "TEST_BRAKE", "TEST", "安全制动距离测试", "AEB-TEST-BRAKE");
        addLocal(nodes, "MARKET_A1", "MARKET_CONTENT", "A1车型ADAS市场说明", "AEB-MARKET-A1");
        addLocal(nodes, "MARKET_B1", "MARKET_CONTENT", "B1车型ADAS市场说明", "AEB-MARKET-B1");
        addLocal(nodes, "PROJECT", "PROJECT", "AEB功能演示项目", "AEB-PROJECT-DEMO");
        addLocal(nodes, "KNOWLEDGE_TTC", "KNOWLEDGE", "TTC概念知识条目", "AEB-KNOWLEDGE-TTC");
        addLocal(nodes, "GUIDE_DRIVER", "GUIDELINE", "AEB驾驶员使用说明", "AEB-GUIDE-DRIVER");
        addLocal(nodes, "TRAINING_SERVICE", "TRAINING", "AEB售后培训材料", "AEB-TRAINING-SERVICE");
        addLocal(nodes, "TEST_REGRESSION", "TEST", "AEB回归测试集合", "AEB-TEST-REGRESSION");
        addExistingCourse(nodes);
        addExistingKnowledge(nodes);
        addExistingVideo(nodes);
        addExistingTicket(nodes);
        addLocal(nodes, "MARKET_POLICY", "MARKET_CONTENT", "AEB能力口径说明", "AEB-MARKET-POLICY");

        link(nodes, "GOAL_DISTANCE", "REQ_AEB", "DECOMPOSES");
        link(nodes, "REQ_AEB", "REQ_WARNING", "DECOMPOSES");
        link(nodes, "REQ_AEB", "PARAM_TTC", "IMPLEMENTED_BY");
        link(nodes, "REQ_AEB", "ALGO_DECISION", "IMPLEMENTED_BY");
        link(nodes, "GOAL_DISTANCE", "ALGO_CONTROL", "CONSTRAINS");
        link(nodes, "PARAM_TTC", "ALGO_DECISION", "CONFIGURES");
        link(nodes, "HW_RADAR", "ALGO_FUSION", "CONFIGURES");
        link(nodes, "HW_CAMERA", "ALGO_FUSION", "CONFIGURES");
        link(nodes, "ALGO_FUSION", "HW_RADAR", "DEPENDS_ON");
        link(nodes, "ALGO_DECISION", "ALGO_FUSION", "DEPENDS_ON");
        link(nodes, "ALGO_CONTROL", "HW_BRAKE", "DEPENDS_ON");
        link(nodes, "ALGO_DECISION", "ALGO_CONTROL", "CONFIGURES");
        link(nodes, "PARAM_DECEL", "ALGO_CONTROL", "CONFIGURES");
        link(nodes, "PARAM_TTC", "TEST_TTC", "VERIFIED_BY");
        link(nodes, "HW_RADAR", "TEST_RADAR", "VERIFIED_BY");
        link(nodes, "HW_RADAR", "TEST_FOV", "VERIFIED_BY");
        link(nodes, "ALGO_FUSION", "TEST_LATENCY", "VERIFIED_BY");
        link(nodes, "GOAL_DISTANCE", "TEST_BRAKE", "VERIFIED_BY");
        link(nodes, "ALGO_DECISION", "TEST_REGRESSION", "VERIFIED_BY");
        link(nodes, "ALGO_DECISION", "VEHICLE_A1", "CONSTRAINS");
        link(nodes, "ALGO_DECISION", "VEHICLE_B1", "CONSTRAINS");
        link(nodes, "VEHICLE_A1", "MARKET_A1", "DESCRIBED_BY");
        link(nodes, "VEHICLE_B1", "MARKET_B1", "DESCRIBED_BY");
        link(nodes, "VEHICLE_A1", "MARKET_POLICY", "DESCRIBED_BY");
        link(nodes, "PARAM_TTC", "KNOWLEDGE_TTC", "DESCRIBED_BY");
        link(nodes, "VEHICLE_A1", "COURSE_EXISTING", "DESCRIBED_BY");
        link(nodes, "PARAM_TTC", "KNOWLEDGE_EXISTING", "DESCRIBED_BY");
        link(nodes, "VEHICLE_A1", "VIDEO_EXISTING", "DESCRIBED_BY");
        link(nodes, "VEHICLE_A1", "GUIDE_DRIVER", "DESCRIBED_BY");
        link(nodes, "VEHICLE_A1", "TRAINING_SERVICE", "DESCRIBED_BY");
        link(nodes, "PROJECT", "REQ_AEB", "DECOMPOSES");
        link(nodes, "VIDEO_EXISTING", "TICKET_EXISTING", "TRIGGERS_TASK");
    }

    private void addExistingCourse(Map<String, ArtifactVersion> nodes) {
        TrainingCourse course = courses.findAll().stream().findFirst().orElse(null);
        add(nodes, "COURSE_EXISTING", "TRAINING", course == null ? "TRACE_LOCAL" : "ACADEMY",
                "TRAINING_COURSE", course == null ? "AEB-COURSE" : course.getId().toString(),
                course == null ? "AEB基础培训课程" : course.getTopic());
    }

    private void addExistingKnowledge(Map<String, ArtifactVersion> nodes) {
        KnowledgeNode node = knowledge.findAll().stream().findFirst().orElse(null);
        add(nodes, "KNOWLEDGE_EXISTING", "KNOWLEDGE", node == null ? "TRACE_LOCAL" : "KNOWLEDGE",
                "KNOWLEDGE_NODE", node == null ? "AEB-KNOWLEDGE" : node.getId().toString(),
                node == null ? "AEB知识节点" : node.getName());
    }

    private void addExistingVideo(Map<String, ArtifactVersion> nodes) {
        VideoGuideline video = videos.findAll().stream().findFirst().orElse(null);
        add(nodes, "VIDEO_EXISTING", "GUIDELINE", video == null ? "TRACE_LOCAL" : "VIDEO_GUIDELINE",
                "VIDEO_GUIDELINE", video == null ? "AEB-VIDEO" : video.getId().toString(),
                video == null ? "AEB视频指南" : video.getTitle());
    }

    private void addExistingTicket(Map<String, ArtifactVersion> nodes) {
        Ticket ticket = tickets.findAll().stream().findFirst().orElse(null);
        add(nodes, "TICKET_EXISTING", "TICKET", ticket == null ? "TRACE_LOCAL" : "WORKSPACE",
                "TICKET", ticket == null ? "AEB-TICKET" : ticket.getId().toString(),
                ticket == null ? "AEB复核工单" : ticket.getSummary());
    }

    private void addLocal(Map<String, ArtifactVersion> nodes, String key, String type,
                          String displayName, String sourceObjectId) {
        add(nodes, key, type, "TRACE_LOCAL", type, sourceObjectId, displayName);
    }

    private void add(Map<String, ArtifactVersion> nodes, String key, String typeCode, String sourceModule,
                     String sourceObjectType, String sourceObjectId, String displayName) {
        ArtifactType type = artifactTypes.findByCodeIgnoreCase(typeCode).orElseThrow();
        Artifact artifact = artifacts.save(new Artifact(sourceModule, sourceObjectType, sourceObjectId, type));
        ArtifactVersion version = versions.save(new ArtifactVersion(artifact, "V1", displayName, "CURRENT",
                "admin", "用于AEB追溯与影响分析Demo的固定种子工件", null, null));
        artifact.useCurrentVersion(version.getId());
        nodes.put(key, version);
    }

    private void link(Map<String, ArtifactVersion> nodes, String sourceKey, String targetKey, String typeCode) {
        RelationTypeDefinition type = relationTypes.findByCodeIgnoreCase(typeCode).orElseThrow();
        relations.save(new TraceRelation(nodes.get(sourceKey), nodes.get(targetKey), type,
                "固定AEB种子关系", "seed"));
    }
}

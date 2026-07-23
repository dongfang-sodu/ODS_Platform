FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /workspace
COPY pom.xml .
RUN mvn -B dependency:go-offline
COPY src src
RUN mvn -B verify

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -S ods && adduser -S ods -G ods
COPY --from=build /workspace/target/ods-platform-api-0.1.0-SNAPSHOT.jar app.jar
RUN chown -R ods:ods /app
USER ods
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]

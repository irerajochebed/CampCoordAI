# Stage 1: Build using Maven and Java 17
FROM maven:3.9-eclipse-temurin-17 AS builder
WORKDIR /app

COPY pom.xml .
COPY src ./src

# Skip compiling and running test sources during Docker build
RUN mvn clean package -Dmaven.test.skip=true

# Stage 2: Runtime image
FROM eclipse-temurin:17-jre
WORKDIR /app

COPY --from=builder /app/target/*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
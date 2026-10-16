FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /build
COPY pom.xml .
RUN --mount=type=cache,target=/root/.m2 mvn dependency:go-offline -B
COPY src src
RUN --mount=type=cache,target=/root/.m2 mvn package -DskipTests -B
RUN java -Djarmode=tools -jar target/seatsnap-0.0.1-SNAPSHOT.jar extract --layers --destination extracted

FROM eclipse-temurin:21-jre-alpine
RUN addgroup -S seatsnap && adduser -S seatsnap -G seatsnap
WORKDIR /app
COPY --from=build /build/extracted/dependencies/ ./
COPY --from=build /build/extracted/spring-boot-loader/ ./
COPY --from=build /build/extracted/snapshot-dependencies/ ./
COPY --from=build /build/extracted/application/ ./
USER seatsnap
EXPOSE 8080
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "seatsnap-0.0.1-SNAPSHOT.jar"]

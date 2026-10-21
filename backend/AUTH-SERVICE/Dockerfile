# syntax=docker/dockerfile:1
# ─── FisioMarca · AUTH-SERVICE (puerto 8099) ─────────────────────
# Etapa 1 compila con Maven + JDK 17; etapa 2 ejecuta solo con JRE 17
# Alpine (~190 MB en vez de ~500 MB). Las dependencias de Maven quedan en
# una caché de BuildKit compartida por todos los micros: el primer build
# las descarga y los siguientes solo recompilan.

# ── 1. Compilación ───────────────────────────────────────────────────
FROM maven:3.9.9-eclipse-temurin-17-alpine AS build
WORKDIR /build
COPY pom.xml .
COPY src ./src
RUN --mount=type=cache,id=fisiomarca-m2,target=/root/.m2,sharing=locked \
    mvn -B -q -DskipTests package && cp target/*.jar /build/app.jar

# ── 2. Ejecución ─────────────────────────────────────────────────────
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
RUN addgroup -S spring && adduser -S spring -G spring
COPY --from=build /build/app.jar app.jar
USER spring
# TZ: el backend trabaja en hora de Lima (igual que en Windows); el JDBC
# guarda en UTC con serverTimezone=UTC. Arranque rápido y poca RAM:
# compilación JIT C1 y GC serial, heap al 50 % del límite (256 MB con 512 MB, como el .bat).
ENV TZ=America/Lima \
    JAVA_OPTS="-XX:MaxRAMPercentage=50 -XX:+UseSerialGC -XX:TieredStopAtLevel=1 -Xss512k"
EXPOSE 8099
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -Duser.timezone=$TZ -jar app.jar"]

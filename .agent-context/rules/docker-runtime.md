# Docker Runtime Strategy (Dynamic Generation Required)

Use this rule when Docker is enabled in project context.

## 1. Dynamic Generation Only
- Do not copy generic Docker templates blindly.
- Generate Docker assets based on actual stack, package manager, and runtime dependencies in the repository.
- Re-evaluate Docker instructions when dependencies, build tools, or runtime assumptions change.

## 2. Separate Development and Production Lanes
- Development lane and production lane are separate concerns.
- Development lane priorities: fast rebuild, hot reload support, debugger-friendly startup, local volume strategy.
- Production lane priorities: minimal image size, reproducible build, non-root runtime, strict startup command.

## 3. Security and Supply Chain
- Use minimal trusted base images with explicit versions.
- Use multi-stage builds for production images when possible.
- Avoid baking secrets into image layers.
- Keep runtime image free from build-only tooling.

## 4. Operational Clarity
- Docker instructions must document expected entrypoint and exposed ports.
- Local development command and production deployment command must be explicit.
- If Docker is not selected for the project, do not force containerization tasks.

## 5. Review Requirements
- Verify the generated Docker workflow matches selected runtime environment (Linux/WSL, Windows, macOS).
- Verify development and production instructions are not mixed into one unsafe image path.
- Ensure API and service health checks are compatible with container startup behavior.

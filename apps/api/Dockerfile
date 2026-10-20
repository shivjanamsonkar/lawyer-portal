FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1
WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app ./app
COPY migrations ./migrations
COPY alembic.ini .
COPY main.py .

# NOTE: Do NOT bake a .env file into the image. `.env` is git-ignored, so it is
# never present in a git-based build, and committing secrets is unsafe. All
# configuration (DATABASE_URL, JWT_SECRET_KEY, APP_ENVIRONMENT, ...) must be
# provided as environment variables in the Render dashboard.

USER 10001:10001
EXPOSE 8000
CMD ["sh", "-c", "python -m alembic upgrade head && python -m app.core.bootstrap_hosted_admin && exec uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]

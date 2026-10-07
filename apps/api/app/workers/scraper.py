from app.workers.celery_app import celery_app


@celery_app.task(name="ecourts.sync_case")
def sync_case_from_ecourts(case_id: str, cnr_number: str) -> dict[str, str]:
    from app.core.config import settings

    if not settings.ecourts_search_url:
        raise RuntimeError("ECOURTS_SEARCH_URL must be configured before court sync can run")

    raise NotImplementedError(
        "The eCourts search URL and page selectors must be verified for the target court before enabling automated updates."
    )
from fastapi import APIRouter, HTTPException
from backend.core.jobs import get_job_record, cancel_job

router = APIRouter(tags=["jobs"])


@router.get("/api/jobs/{job_id}")
def get_job_status(job_id: str):
    job = get_job_record(job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Job '{job_id}' not found.")
    return job


@router.post("/api/jobs/{job_id}/cancel")
def cancel_job_endpoint(job_id: str):
    success = cancel_job(job_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Job '{job_id}' not found.")
    return {"success": True, "job_id": job_id, "status": "cancelled"}

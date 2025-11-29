"""
Supervisor Agent
Handles telemetry, logging, and error tracking for the generation pipeline.
"""
import logging
import time
from typing import Dict, Any

logger = logging.getLogger("bpmappr.supervisor")

class Supervisor:
    def __init__(self):
        self.metrics = {
            "steps": [],
            "start_time": None,
            "end_time": None,
            "duration": 0
        }
        
    def start_trace(self):
        self.metrics["start_time"] = time.time()
        logger.info("Starting generation pipeline")
        
    def log_step(self, step_name: str, status: str = "success", meta: Dict[str, Any] = None):
        logger.info(f"Step {step_name}: {status}")
        self.metrics["steps"].append({
            "name": step_name,
            "status": status,
            "timestamp": time.time(),
            "meta": meta or {}
        })
        
    def end_trace(self):
        self.metrics["end_time"] = time.time()
        self.metrics["duration"] = self.metrics["end_time"] - self.metrics["start_time"]
        logger.info(f"Pipeline finished in {self.metrics['duration']:.2f}s")
        return self.metrics

"""
Logging configuration for ProcessLab API

Provides structured JSON logging with request_id support.
"""

import logging
import logging.config
import json
import sys
from typing import Any, Dict
from datetime import datetime


class StructuredFormatter(logging.Formatter):
    """
    Custom formatter that outputs logs as structured JSON.
    Includes timestamp, level, logger name, message, and extra fields.
    """
    
    def format(self, record: logging.LogRecord) -> str:
        # Base log structure
        log_data: Dict[str, Any] = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        
        # Add extra fields from record
        if hasattr(record, "request_id"):
            log_data["request_id"] = record.request_id
        
        # Add exception info if present
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)
        
        # Add any custom fields passed via extra={}
        for key, value in record.__dict__.items():
            if key not in [
                "name", "msg", "args", "created", "filename", "funcName",
                "levelname", "lineno", "module", "msecs", "message", 
                "pathname", "process", "processName", "relativeCreated",
                "thread", "threadName", "exc_info", "exc_text", "stack_info",
                "request_id"  # Already handled above
            ]:
                log_data[key] = value
        
        return json.dumps(log_data)


def setup_logging(log_level: str = "INFO", json_logs: bool = True) -> None:
    """
    Configure logging for the application.
    
    Args:
        log_level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        json_logs: If True, use structured JSON logs. If False, use text logs.
    """
    
    # Determine formatter
    if json_logs:
        formatter_class = StructuredFormatter
        format_string = ""  # Not used by StructuredFormatter
    else:
        formatter_class = logging.Formatter
        format_string = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    
    # Logging configuration
    logging_config = {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "default": {
                "()": formatter_class,
                "format": format_string,
            }
        },
        "handlers": {
            "console": {
                "class": "logging.StreamHandler",
                "level": log_level,
                "formatter": "default",
                "stream": sys.stdout,
            }
        },
        "root": {
            "level": log_level,
            "handlers": ["console"],
        },
        "loggers": {
            # Reduce noise from third-party libraries
            "uvicorn": {"level": "INFO"},
            "uvicorn.access": {"level": "WARNING"},  # We have our own request logging
            "sqlalchemy.engine": {"level": "WARNING"},
            "botocore": {"level": "WARNING"},
            "urllib3": {"level": "WARNING"},
        }
    }
    
    logging.config.dictConfig(logging_config)
    
    # Log startup message
    logger = logging.getLogger(__name__)
    logger.info(f"Logging configured: level={log_level}, json_logs={json_logs}")


def get_logger(name: str) -> logging.Logger:
    """
    Get a logger instance.
    Convenience function for consistent logger creation.
    """
    return logging.getLogger(name)

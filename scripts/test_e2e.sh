#!/bin/bash
set -e

# Base URL
API_URL="http://localhost:8000/api/v1"

echo "========================================"
echo "  ProcessLab E2E Test: Full Flow        "
echo "  (Ingest -> Generate -> Edit)          "
echo "========================================"

# 1. Register User
echo -e "\n[1/5] Registering test user (test_e2e@processlab.io)..."
curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"test_e2e@processlab.io","password":"Test123!","full_name":"Test User"}' > /dev/null || true
echo "User registration step completed."

# 2. Login
echo -e "\n[2/5] Logging in to get Access Token..."
RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=test_e2e@processlab.io&password=Test123!")

TOKEN=$(echo $RESPONSE | jq -r .access_token)

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
    echo "❌ Login failed. Response:"
    echo $RESPONSE
    exit 1
fi

echo "✅ Token obtained successfully."

# 3. Upload File
echo -e "\n[3/5] Uploading data/sample.txt..."
if [ ! -f "data/sample.txt" ]; then
    echo "❌ File data/sample.txt not found!"
    exit 1
fi

UPLOAD_RESPONSE=$(curl -s -X POST -F "files=@data/sample.txt" \
  -H "Authorization: Bearer $TOKEN" \
  "$API_URL/ingest/upload")

ARTIFACT_ID=$(echo $UPLOAD_RESPONSE | jq -r '.uploaded[0].id')

if [ "$ARTIFACT_ID" == "null" ] || [ -z "$ARTIFACT_ID" ]; then
    echo "❌ Upload failed. Response:"
    echo $UPLOAD_RESPONSE
    exit 1
fi

echo "✅ Artifact uploaded. ID: $ARTIFACT_ID"

# 4. Wait for Processing (Sprint 2)
echo -e "\n[4/5] Waiting for artifact indexing..."
MAX_RETRIES=30
COUNT=0
STATUS="processing"

while [ "$STATUS" != "ready" ] && [ $COUNT -lt $MAX_RETRIES ]; do
    sleep 2
    STATUS_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "$API_URL/ingest/status/$ARTIFACT_ID")
    STATUS=$(echo $STATUS_RESPONSE | jq -r .status)
    echo "   Status: $STATUS"
    
    if [ "$STATUS" == "failed" ]; then
        echo "❌ Processing failed!"
        echo $STATUS_RESPONSE
        exit 1
    fi
    
    COUNT=$((COUNT+1))
done

if [ "$STATUS" != "ready" ]; then
    echo "❌ Timeout waiting for artifact processing."
    exit 1
fi

echo "✅ Artifact indexed successfully."

# 5. Generate BPMN (Sprint 3)
echo -e "\n[5/6] Generating BPMN Process..."
GENERATE_PAYLOAD=$(jq -n \
                  --arg id "$ARTIFACT_ID" \
                  '{artifact_ids: [$id], process_name: "E2E Test Process", options: {apply_layout: true}}')

GENERATE_RESPONSE=$(curl -s -X POST "$API_URL/generate/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$GENERATE_PAYLOAD")

MODEL_VERSION_ID=$(echo $GENERATE_RESPONSE | jq -r .model_version_id)

if [ "$MODEL_VERSION_ID" == "null" ] || [ -z "$MODEL_VERSION_ID" ]; then
    echo "❌ Generation failed. Response:"
    echo $GENERATE_RESPONSE
    exit 1
fi

echo "✅ BPMN Generated. Version ID: $MODEL_VERSION_ID"
METRICS=$(echo $GENERATE_RESPONSE | jq .metrics)
echo "   Metrics: $METRICS"

# 6. Edit BPMN (Sprint 4)
echo -e "\n[6/6] Testing Copilot Edit..."
EDIT_PAYLOAD=$(jq -n \
              --arg id "$MODEL_VERSION_ID" \
              '{model_version_id: $id, command: "add a task called Review Approval"}')

EDIT_RESPONSE=$(curl -s -X POST "$API_URL/edit/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$EDIT_PAYLOAD")

NEW_VERSION_ID=$(echo $EDIT_RESPONSE | jq -r .versionId)

if [ "$NEW_VERSION_ID" == "null" ] || [ -z "$NEW_VERSION_ID" ]; then
    echo "❌ Edit failed. Response:"
    echo $EDIT_RESPONSE
    exit 1
fi

echo "✅ Edit applied successfully."
echo "   New Version ID: $NEW_VERSION_ID"
CHANGES=$(echo $EDIT_RESPONSE | jq .changes)
echo "   Changes: $CHANGES"

echo -e "\n========================================"
echo "✅ FULL E2E TEST SUITE PASSED"
echo "========================================"

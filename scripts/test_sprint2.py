import requests
import time
import sys
import json

API_URL = "http://localhost:8000/api/v1"

def test_flow():
    # 1. Upload
    print("Uploading file...")
    files = {'file': ('test.txt', b'This is a test document for ProcessLab RAG system.', 'text/plain')}
    try:
        res = requests.post(f"{API_URL}/ingest/", files=files)
    except requests.exceptions.ConnectionError:
        print("Could not connect to API. Is it running?")
        sys.exit(1)
        
    if res.status_code != 201:
        print(f"Upload failed: {res.text}")
        sys.exit(1)
    
    data = res.json()
    artifact_id = data['artifactId']
    print(f"Uploaded artifact: {artifact_id}")
    
    # 2. Wait for processing
    print("Waiting for processing (5s)...")
    time.sleep(5)
    
    # 3. Search
    print("Searching...")
    search_payload = {"query": "ProcessLab RAG", "limit": 1}
    res = requests.post(f"{API_URL}/search/", json=search_payload)
    if res.status_code != 200:
        print(f"Search failed: {res.text}")
        sys.exit(1)
        
    results = res.json()
    print(f"Search results: {json.dumps(results, indent=2)}")
    
    if len(results) > 0 and "ProcessLab" in results[0]['text']:
        print("SUCCESS: Found relevant text!")
    else:
        print("FAILURE: Did not find relevant text.")

if __name__ == "__main__":
    test_flow()

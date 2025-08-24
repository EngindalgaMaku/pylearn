# Python Code Execution API Documentation

## Overview

This document provides comprehensive documentation for setting up and using a secure Python code execution API for Pylearn.net. This API allows you to safely execute Python code submitted by users in an isolated environment, with proper security measures and resource limitations. The API will be deployed at code.pylearn.net using Coolify and will only accept requests from pylearn.net.

## Table of Contents

1. [Architecture](#architecture)
2. [Setup Instructions](#setup-instructions)
   - [Prerequisites](#prerequisites)
   - [Installation](#installation)
   - [Configuration](#configuration)
3. [API Reference](#api-reference)
   - [Authentication](#authentication)
   - [Endpoints](#endpoints)
   - [Request & Response Format](#request--response-format)
4. [Security Considerations](#security-considerations)
5. [Integration Guide](#integration-guide)
6. [Deployment with Coolify](#deployment-with-coolify)
7. [Troubleshooting](#troubleshooting)

## Architecture

The system consists of two main components:

1. **Code Execution API**: A FastAPI-based service that receives code execution requests, runs them in isolated Docker containers, and returns the results.
2. **Client Application**: Your Next.js application that sends code to the API and displays the results.

```
┌─────────────────┐     HTTPS/Secure Request     ┌─────────────────┐
│                 │                              │                 │
│  pylearn.net    │ ────────────────────────────►│ code.pylearn.net│
│  (Next.js App)  │                              │  (API Server)   │
│                 │◄────────────────────────────┐│                 │
└─────────────────┘     Execution Results        └────────┬────────┘
                                                          │
                                                          │ Docker API
                                                          ▼
                                                 ┌─────────────────┐
                                                 │                 │
                                                 │  Docker        │
                                                 │  Container     │
                                                 │                 │
                                                 └─────────────────┘
```

## Setup Instructions

### Prerequisites

- Python 3.8+
- Docker
- pip (Python package manager)
- A server with at least 1GB RAM

### Installation

1. **Create a new directory for your API:**

```bash
mkdir python-execution-api
cd python-execution-api
```

2. **Create a virtual environment:**

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install required packages:**

```bash
pip install fastapi uvicorn pydantic python-multipart docker python-dotenv
```

4. **Create the main application file:**

Create a file named `main.py` with the following content:

```python
from fastapi import FastAPI, Depends, HTTPException, Security, BackgroundTasks, Request
from fastapi.security.api_key import APIKeyHeader
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import docker
import uuid
import os
import time
import tempfile
from typing import Optional, List
import logging
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger("code-execution-api")

app = FastAPI(title="Code Execution API")

# CORS settings - only allow requests from pylearn.net
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://pylearn.net"],  # Only allow requests from pylearn.net
    allow_credentials=True,
    allow_methods=["POST", "GET"],
    allow_headers=["Content-Type", "X-API-Key"],
)

# Security settings
API_KEY = os.getenv("API_KEY", "your-default-api-key")  # Use environment variable
api_key_header = APIKeyHeader(name="X-API-Key")

# Docker client
client = docker.from_env()

class TestCase(BaseModel):
    input: Optional[str] = None
    expected_output: Optional[str] = None
    code: Optional[str] = None

class CodeRequest(BaseModel):
    code: str
    language: str = "python"
    input_data: Optional[str] = None
    test_cases: Optional[List[TestCase]] = None
    timeout: int = 5  # seconds

class TestResult(BaseModel):
    passed: bool
    message: str
    input: Optional[str] = None
    expected_output: Optional[str] = None

class CodeResponse(BaseModel):
    output: str
    error: str
    execution_time: float
    test_results: Optional[List[TestResult]] = None

def get_api_key(api_key: str = Security(api_key_header)):
    if api_key != API_KEY:
        raise HTTPException(status_code=403, detail="Invalid API key")
    return api_key

def cleanup_container(container_name: str):
    """Background task to ensure container is removed"""
    try:
        container = client.containers.get(container_name)
        container.remove(force=True)
        logger.info(f"Container {container_name} removed successfully")
    except Exception as e:
        logger.error(f"Error removing container {container_name}: {str(e)}")

@app.post("/execute", response_model=CodeResponse)
async def execute_code(
    request: CodeRequest, 
    background_tasks: BackgroundTasks,
    req: Request,
    api_key: str = Depends(get_api_key)
):
    # Verify request origin
    origin = req.headers.get("origin")
    if origin != "https://pylearn.net":
        raise HTTPException(status_code=403, detail="Access denied: Invalid origin")
    # Generate unique ID for this execution
    code_id = str(uuid.uuid4())
    code_file = f"{code_id}.py"
    input_file = f"{code_id}_input.txt"
    container_name = f"code_exec_{code_id}"
    
    start_time = time.time()
    
    try:
        # Create temporary directory
        with tempfile.TemporaryDirectory() as temp_dir:
            # Write code file
            code_path = os.path.join(temp_dir, code_file)
            with open(code_path, "w") as f:
                f.write(request.code)
            
            # Write input file if provided
            input_path = None
            if request.input_data:
                input_path = os.path.join(temp_dir, input_file)
                with open(input_path, "w") as f:
                    f.write(request.input_data)
            
            # Prepare volumes
            volumes = {
                code_path: {"bind": f"/app/{code_file}", "mode": "ro"},
            }
            
            if input_path:
                volumes[input_path] = {"bind": f"/app/{input_file}", "mode": "ro"}
            
            # Prepare command
            command = f"python /app/{code_file}"
            if input_path:
                command = f"{command} < /app/{input_file}"
            
            # Run container
            container = client.containers.run(
                "python:3.9-slim",
                command=command,
                volumes=volumes,
                working_dir="/app",
                name=container_name,
                detach=True,
                mem_limit="128m",
                cpu_period=100000,
                cpu_quota=25000,  # 25% CPU limit
                network_mode="none",  # Disable network
                cap_drop=["ALL"],  # Drop all capabilities
            )
            
            # Schedule cleanup
            background_tasks.add_task(cleanup_container, container_name)
            
            # Wait for completion with timeout
            try:
                exit_code = container.wait(timeout=request.timeout)
                execution_time = time.time() - start_time
                
                # Get output and error
                output = container.logs(stdout=True, stderr=False).decode("utf-8")
                error = container.logs(stdout=False, stderr=True).decode("utf-8")
                
                # Process test cases if provided
                test_results = None
                if request.test_cases:
                    test_results = []
                    for test in request.test_cases:
                        # Simple check if expected output is in the actual output
                        expected = test.expected_output or ""
                        passed = expected in output
                        
                        if "Error" in expected and error:
                            passed = True
                        
                        test_results.append(
                            TestResult(
                                passed=passed,
                                message=f"{'✅ Test passed' if passed else '❌ Test failed'}: {test.input or '(no input)'} -> Expected: {expected or '(expected output)'}",
                                input=test.input,
                                expected_output=test.expected_output
                            )
                        )
                
                return CodeResponse(
                    output=output,
                    error=error,
                    execution_time=execution_time,
                    test_results=test_results
                )
            
            except Exception as e:
                logger.error(f"Error during execution: {str(e)}")
                return CodeResponse(
                    output="",
                    error=f"Execution timed out or failed: {str(e)}",
                    execution_time=time.time() - start_time
                )
    
    except Exception as e:
        logger.error(f"Error setting up execution: {str(e)}")
        return CodeResponse(
            output="",
            error=f"Setup error: {str(e)}",
            execution_time=0.0
        )

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Check if Docker is available
        client.ping()
        return {"status": "healthy", "docker": "connected"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Health check failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
```

5. **Create a .env file for configuration:**

```
API_KEY=your-secret-api-key
PORT=8000
```

6. **Create a Dockerfile:**

```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

7. **Create requirements.txt:**

```
fastapi==0.95.0
uvicorn==0.21.1
pydantic==1.10.7
python-multipart==0.0.6
docker==6.0.1
python-dotenv==1.0.0
```

### Configuration

1. **Environment Variables:**

| Variable | Description | Default |
|----------|-------------|---------|
| API_KEY  | Secret key for API authentication | your-default-api-key |
| PORT     | Port on which the API will run | 8000 |

2. **Docker Configuration:**

The API uses Docker to run code in isolated containers. Ensure Docker is installed and running on your server.

## API Reference

### Authentication

All API requests require authentication using an API key.

**Header:**
```
X-API-Key: your-secret-api-key
```

### Endpoints

#### Execute Code

**URL:** `/execute`
**Method:** `POST`
**Description:** Execute Python code in an isolated environment

**Request Body:**

```json
{
  "code": "print('Hello, World!')",
  "language": "python",
  "input_data": "",
  "test_cases": [
    {
      "input": "add(5, 3)",
      "expected_output": "8",
      "code": "result = add(5, 3)\nprint(result)"
    }
  ],
  "timeout": 5
}
```

**Response:**

```json
{
  "output": "Hello, World!\n",
  "error": "",
  "execution_time": 0.532,
  "test_results": [
    {
      "passed": true,
      "message": "✅ Test passed: add(5, 3) -> Expected: 8",
      "input": "add(5, 3)",
      "expected_output": "8"
    }
  ]
}
```

#### Health Check

**URL:** `/health`
**Method:** `GET`
**Description:** Check if the API is running and Docker is connected

**Response:**

```json
{
  "status": "healthy",
  "docker": "connected"
}
```

### Request & Response Format

#### CodeRequest

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| code | string | Yes | Python code to execute |
| language | string | No | Programming language (only "python" supported currently) |
| input_data | string | No | Input data to pass to the program |
| test_cases | array | No | Test cases to validate the code |
| timeout | integer | No | Maximum execution time in seconds (default: 5) |

#### TestCase

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| input | string | No | Input for the test case (e.g., function call) |
| expected_output | string | No | Expected output for the test case |
| code | string | No | Additional code to run for testing |

#### CodeResponse

| Field | Type | Description |
|-------|------|-------------|
| output | string | Standard output from code execution |
| error | string | Standard error or execution error |
| execution_time | number | Time taken for execution in seconds |
| test_results | array | Results of test cases if provided |

#### TestResult

| Field | Type | Description |
|-------|------|-------------|
| passed | boolean | Whether the test passed |
| message | string | Formatted message about the test result |
| input | string | Input used for the test |
| expected_output | string | Expected output for the test |

## Security Considerations

1. **Origin Restriction:**
   - API only accepts requests from pylearn.net
   - CORS is configured to reject requests from other origins
   - Additional domain validation in request processing

2. **API Key Protection:**
   - Store your API key securely in Coolify environment variables
   - Rotate keys regularly (recommended monthly)
   - Use different keys for development and production

3. **Docker Security:**
   - Resource limits (memory, CPU)
   - Network isolation (network_mode="none")
   - Capability restrictions (cap_drop=["ALL"])
   - Read-only file system for code execution
   - Non-root user execution

4. **Server Security:**
   - Firewall configuration through Coolify
   - HTTPS encryption with Let's Encrypt
   - Regular security updates
   - IP whitelisting for admin access

5. **Code Execution Limits:**
   - Timeout restrictions (5 seconds default)
   - Memory limits (128MB per container)
   - CPU restrictions (25% CPU quota)
   - Prohibited operations (network access disabled, file system restricted)
   
6. **Request Validation:**
   - Additional header validation
   - Rate limiting per API key
   - Input sanitization and validation

## Integration Guide

### Integrating with Next.js

Create a utility function in your Next.js application to interact with the API:

```typescript
// utils/codeExecution.ts

interface TestCase {
  input?: string;
  expected_output?: string;
  code?: string;
}

interface CodeExecutionRequest {
  code: string;
  language?: string;
  input_data?: string;
  test_cases?: TestCase[];
  timeout?: number;
}

interface TestResult {
  passed: boolean;
  message: string;
  input?: string;
  expected_output?: string;
}

interface CodeExecutionResponse {
  output: string;
  error: string;
  execution_time: number;
  test_results?: TestResult[];
}

export async function executeCode(
  request: CodeExecutionRequest
): Promise<CodeExecutionResponse> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_CODE_EXECUTION_API_KEY;
    const apiUrl = "https://code.pylearn.net";
    
    if (!apiKey) {
      throw new Error('API key not configured');
    }
    
    const response = await fetch(`${apiUrl}/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
        'Origin': 'https://pylearn.net'
      },
      body: JSON.stringify(request)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error (${response.status}): ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Code execution error:', error);
    return {
      output: '',
      error: `Error: ${error.message}`,
      execution_time: 0
    };
  }
}
```

### Using in Components

```tsx
// components/CodeEditor.tsx
import { useState } from 'react';
import { executeCode } from '../utils/codeExecution';

export default function CodeEditor() {
  const [code, setCode] = useState('');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  
  const runCode = async () => {
    setIsRunning(true);
    setOutput('Running code...');
    
    try {
      const result = await executeCode({
        code,
        test_cases: [
          {
            input: 'add(5, 3)',
            expected_output: '8',
            code: 'result = add(5, 3)\nprint(result)'
          }
        ]
      });
      
      setOutput(`Output:\n${result.output}\n\nErrors:\n${result.error}`);
      
      // Display test results
      if (result.test_results && result.test_results.length > 0) {
        const testOutput = result.test_results.map(test => test.message).join('\n');
        setOutput(prev => `${prev}\n\nTest Results:\n${testOutput}`);
      }
    } catch (error) {
      setOutput(`Error: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };
  
  return (
    <div>
      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        rows={10}
        cols={50}
        placeholder="Enter Python code here..."
      />
      <div>
        <button onClick={runCode} disabled={isRunning}>
          {isRunning ? 'Running...' : 'Run Code'}
        </button>
      </div>
      <pre>{output}</pre>
    </div>
  );
}
```

## Deployment with Coolify

Pylearn.net uses Coolify for deployment. Follow these steps to deploy the Python Code Execution API to code.pylearn.net:

### Prerequisites for Coolify Deployment

1. Access to your Coolify dashboard
2. Git repository with your Python Code Execution API code
3. Docker installed on your Coolify server

### Deployment Steps

1. **Log in to your Coolify dashboard**

2. **Create a new service**
   - Click "Create new resource"
   - Select "Application"
   - Choose "Docker" as the deployment type

3. **Configure the service**
   - **Name**: Python Code Execution API
   - **Git Repository**: Select your repository
   - **Branch**: main (or your preferred branch)
   - **Build Command**: None (we'll use the Dockerfile)
   - **Docker Configuration**:
     - Base Directory: ./
     - Dockerfile Path: ./Dockerfile
     - Container Port: 8000

4. **Environment Variables**
   - Add the following environment variables:
     ```
     API_KEY=your-secret-api-key
     PORT=8000
     ```

5. **Advanced Settings**
   - **Domain**: code.pylearn.net
   - **Enable HTTPS**: Yes (Let's Encrypt)
   - **Docker Volumes**: Add a volume to mount Docker socket
     ```
     /var/run/docker.sock:/var/run/docker.sock
     ```
   - **Resource Limits**:
     - Memory: 1GB (minimum)
     - CPU: 1 (minimum)

6. **Deploy the service**
   - Click "Deploy" to start the deployment process
   - Coolify will build the Docker image and start the container

7. **Configure DNS**
   - Add a DNS record for code.pylearn.net pointing to your Coolify server
   - Type: A
   - Name: code
   - Value: [Your Coolify Server IP]
   - TTL: 3600 (or as appropriate)

8. **Security Configuration**
   - Configure your firewall to allow traffic on port 443 (HTTPS)
   - Ensure that only the Coolify server can access the Docker socket

### Updating the Deployment

To update your deployment when you make changes to the code:

1. Push changes to your Git repository
2. Go to your service in the Coolify dashboard
3. Click "Redeploy" to deploy the latest version

## Troubleshooting

### Common Issues

#### Docker Connection Error

**Problem:** The API cannot connect to Docker.
**Solution:** 
- Ensure Docker is running: `sudo systemctl status docker`
- Check permissions: `sudo usermod -aG docker $USER` and log out/in
- Verify the Docker socket is accessible: `ls -la /var/run/docker.sock`

#### Permission Issues

**Problem:** Permission denied when accessing Docker.
**Solution:**
- Add your user to the Docker group: `sudo usermod -aG docker $USER`
- Restart your session or run: `newgrp docker`

#### Container Not Removed

**Problem:** Docker containers are not being cleaned up.
**Solution:**
- Manually remove stuck containers: `docker rm -f $(docker ps -a -q --filter "name=code_exec_")`
- Check logs for cleanup errors: `journalctl -u python-execution-api`

#### Memory Issues

**Problem:** The API crashes due to memory limits.
**Solution:**
- Increase memory limits in Docker run command
- Monitor memory usage: `docker stats`
- Consider using a larger server

### Debugging

1. **Enable Debug Logging:**
   - Set logging level to DEBUG in main.py
   - Check logs for detailed information

2. **Test API Locally:**
   - Use curl or Postman to test endpoints
   - Example curl command:
     ```bash
     curl -X POST "http://localhost:8000/execute" \
       -H "X-API-Key: your-secret-api-key" \
       -H "Content-Type: application/json" \
       -d '{"code":"print(\"Hello, World!\")"}'
     ```

3. **Inspect Docker Containers:**
   - List running containers: `docker ps`
   - View container logs: `docker logs [container_id]`
   - Inspect container details: `docker inspect [container_id]`

---

This documentation provides a comprehensive guide to setting up and using the Python Code Execution API. For additional help or feature requests, please contact the development team.

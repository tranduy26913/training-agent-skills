$ErrorActionPreference = 'Stop'

$base = 'http://localhost:3000/api'
$loginBody = @{ email = 'admin@app.com'; password = 'admin123' } | ConvertTo-Json

try {
  $auth = Invoke-RestMethod -Method Post -Uri "$base/auth/login" -ContentType 'application/json' -Body $loginBody
} catch {
  Set-Location d:\training\server
  npm run -s seed | Out-Host
  $auth = Invoke-RestMethod -Method Post -Uri "$base/auth/login" -ContentType 'application/json' -Body $loginBody
}

$token = $auth.token
if (-not $token) {
  throw 'Login failed: missing token'
}

$headers = @{ Authorization = "Bearer $token"; 'Content-Type' = 'application/json' }
$authOnly = @{ Authorization = "Bearer $token" }

$wsName = "smoke-ws-$([DateTimeOffset]::UtcNow.ToUnixTimeSeconds())"
$workspace = Invoke-RestMethod -Method Post -Uri "$base/notebooklm/workspaces" -Headers $headers -Body (@{ name = $wsName; description = 'smoke-run' } | ConvertTo-Json)
$workspaceId = [int]$workspace.id

$updatedWorkspace = Invoke-RestMethod -Method Put -Uri "$base/notebooklm/workspaces/$workspaceId" -Headers $headers -Body (@{ name = "$wsName-upd"; description = 'smoke-updated' } | ConvertTo-Json)

$contentBytes = [Text.Encoding]::UTF8.GetBytes("Smoke test doc $(Get-Date -Format o)")
$uploadPayload = @{
  filename = 'smoke.txt'
  mimeType = 'text/plain'
  fileSize = $contentBytes.Length
  fileDataBase64 = [Convert]::ToBase64String($contentBytes)
} | ConvertTo-Json

$uploadResult = Invoke-RestMethod -Method Post -Uri "$base/notebooklm/workspaces/$workspaceId/documents" -Headers $headers -Body $uploadPayload
$documentId = [int]$uploadResult.documentId
$ingestJobId = [int]$uploadResult.jobId

function Wait-JobDone {
  param(
    [int]$JobId,
    [string]$ApiBase,
    [hashtable]$Headers,
    [string]$WorkerName
  )

  $last = $null
  for ($i = 0; $i -lt 80; $i++) {
    if ($WorkerName) {
      & d:/training/.venv/Scripts/python.exe d:/training/python-services/run_worker_live.py --worker $WorkerName --once | Out-Null
    }
    $last = Invoke-RestMethod -Method Get -Uri "$ApiBase/notebooklm/jobs/$JobId" -Headers $Headers
    if ($last.status -in @('done', 'failed', 'dead_letter')) {
      return $last
    }
  }

  return $last
}

$ingestJob = Wait-JobDone -JobId $ingestJobId -ApiBase $base -Headers $authOnly -WorkerName 'ingestion'
$documentsAfterUpload = Invoke-RestMethod -Method Get -Uri "$base/notebooklm/workspaces/$workspaceId/documents" -Headers $authOnly

$deleteResult = Invoke-RestMethod -Method Delete -Uri "$base/notebooklm/workspaces/$workspaceId/documents/$documentId" -Headers $authOnly
$deleteJobId = [int]$deleteResult.jobId
$deleteJob = Wait-JobDone -JobId $deleteJobId -ApiBase $base -Headers $authOnly -WorkerName 'delete'
$documentsAfterDelete = Invoke-RestMethod -Method Get -Uri "$base/notebooklm/workspaces/$workspaceId/documents" -Headers $authOnly

[PSCustomObject]@{
  workspaceId = $workspaceId
  workspaceNameBefore = $workspace.name
  workspaceNameAfter = $updatedWorkspace.name
  documentId = $documentId
  ingestJobId = $ingestJobId
  ingestStatus = $ingestJob.status
  deleteJobId = $deleteJobId
  deleteStatus = $deleteJob.status
  documentStatusAfterUpload = ($documentsAfterUpload | Where-Object { $_.id -eq $documentId } | Select-Object -First 1).status
  documentStatusAfterDelete = ($documentsAfterDelete | Where-Object { $_.id -eq $documentId } | Select-Object -First 1).status
} | ConvertTo-Json -Depth 4

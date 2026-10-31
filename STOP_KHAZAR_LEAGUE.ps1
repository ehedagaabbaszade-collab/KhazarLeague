param(
    [int[]]$Ports = @(3000, 4173, 5173)
)

Write-Host "=========================================="
Write-Host "Khazar League - Stopping Servers"
Write-Host "=========================================="
Write-Host ""

Write-Host "Searching for Khazar League Node.js processes..."

foreach ($port in $Ports) {
    $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    foreach ($conn in $connections) {
        $process = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
        if ($process -and $process.ProcessName -eq 'node') {
            Write-Host "Stopping Node.js process on port $port (PID: $($process.Id))..."
            Stop-Process -Id $process.Id -Force
        }
    }
}

Write-Host "All Khazar League servers stopped."
Write-Host "=========================================="
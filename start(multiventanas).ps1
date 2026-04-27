[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
chcp 65001 | Out-Null

$root = Split-Path -Parent $MyInvocation.MyCommand.Path

function Kill-ProcessByPort {
    param($Port)
    $connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    foreach ($conn in $connections) {
        $procId = $conn.OwningProcess
        if ($procId -and $procId -ne 0) {
            try {
                $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue
                if ($proc -and $proc.ProcessName -ne "Idle") {
                    Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
                }
            } catch {}
        }
    }
}

try {
    Write-Host "Limpiando puertos 3001/3003..." -ForegroundColor Yellow
    Kill-ProcessByPort -Port 3001
    Kill-ProcessByPort -Port 3003
    Start-Sleep -Seconds 1

    Write-Host "Iniciando servidor y collector..." -ForegroundColor Green
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\server'; node index.js"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\collector'; node index.js"

    Write-Host "Esperando 8 segundos..." -ForegroundColor Cyan
    Start-Sleep -Seconds 8

    Write-Host "OK - Abre http://localhost:3001 en Chrome" -ForegroundColor Green
    Write-Host "En produccion el frontend se sirve desde el servidor en :3001" -ForegroundColor Gray
} catch {
    Write-Host "ERROR: $_" -ForegroundColor Red
} finally {
    Read-Host "Presiona Enter para salir"
}
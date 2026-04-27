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
                    Write-Host "  Matado proceso $procId ($($proc.ProcessName)) en puerto $Port" -ForegroundColor DarkGray
                }
            } catch {}
        }
    }
}

try {
    Write-Host "Limpiando procesos previos en puertos 3000/3001..." -ForegroundColor Yellow
    Kill-ProcessByPort -Port 3000
    Kill-ProcessByPort -Port 3001
    Start-Sleep -Seconds 1

    Write-Host "Iniciando servicios en ventanas separadas..." -ForegroundColor Green

    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\server'; yarn dev"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\frontend'; yarn dev"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\collector'; yarn dev"

    Write-Host "Esperando 10 segundos a que los servicios levanten..." -ForegroundColor Cyan
    Start-Sleep -Seconds 10

    Write-Host "`n OK Todo listo. Abre http://localhost:3000 en Chrome" -ForegroundColor Green
    Write-Host "Cierra las ventanas de cada servicio para detenerlos." -ForegroundColor Gray
} catch {
    Write-Host "`n ERROR: $_" -ForegroundColor Red
} finally {
    Read-Host "`nPresiona Enter para salir"
}
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
 $OutputEncoding = [System.Text.Encoding]::UTF8
chcp 65001 | Out-Null

 $root = Split-Path -Parent $MyInvocation.MyCommand.Path

function Kill-ProcessByPort {
    param($Port)
    Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | ForEach-Object {
        $procId = $_.OwningProcess
        if ($procId -and $procId -ne 0) {
            Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
        }
    }
}

Write-Host "Limpiando puertos 3001/3003..." -ForegroundColor Yellow
Kill-ProcessByPort -Port 3001
Kill-ProcessByPort -Port 3003
Start-Sleep -Seconds 1

Write-Host "Iniciando servidor y collector..." -ForegroundColor Green

# Carpeta para logs
 $logsDir = "$root\.logs"
New-Item -ItemType Directory -Path $logsDir -Force | Out-Null

# Iniciar procesos ocultos
 $serverProc = Start-Process -FilePath "node" -ArgumentList "index.js" `
    -WorkingDirectory "$root\server" -WindowStyle Hidden `
    -RedirectStandardOutput "$logsDir\server.log" `
    -RedirectStandardError "$logsDir\server-err.log" -PassThru

 $collectorProc = Start-Process -FilePath "node" -ArgumentList "index.js" `
    -WorkingDirectory "$root\collector" -WindowStyle Hidden `
    -RedirectStandardOutput "$logsDir\collector.log" `
    -RedirectStandardError "$logsDir\collector-err.log" -PassThru

Start-Sleep -Seconds 8

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  OK - http://localhost:3001" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "SERVER PID: $($serverProc.Id) | COLLECTOR PID: $($collectorProc.Id)" -ForegroundColor Gray
Write-Host ""
Write-Host "=== Logs en tiempo real (Ctrl+C para detener) ===" -ForegroundColor Yellow
Write-Host "------------------------------------------------" -ForegroundColor DarkGray

# Runspaces para leer logs
 $rsScript = {
    param($logFile, $errFile, $prefix, $color)
    $lastPos = 0
    $lastErrPos = 0
    try {
        while ($true) {
            Start-Sleep -Milliseconds 400
            
            # Stdout
            if (Test-Path $logFile) {
                $content = Get-Content $logFile -Raw -ErrorAction SilentlyContinue
                if ($content -and $content.Length -gt $lastPos) {
                    $newLines = $content.Substring($lastPos) -split "`n"
                    $lastPos = $content.Length
                    foreach ($line in $newLines) {
                        if ($line.Trim()) { Write-Host "[$prefix] $line" -ForegroundColor $color }
                    }
                }
            }
            
            # Stderr
            if (Test-Path $errFile) {
                $errContent = Get-Content $errFile -Raw -ErrorAction SilentlyContinue
                if ($errContent -and $errContent.Length -gt $lastErrPos) {
                    $newErrLines = $errContent.Substring($lastErrPos) -split "`n"
                    $lastErrPos = $errContent.Length
                    foreach ($line in $newErrLines) {
                        if ($line.Trim()) { Write-Host "[$prefix-ERR] $line" -ForegroundColor Red }
                    }
                }
            }
        }
    } catch {}
}

 $rs1 = [powershell]::Create().AddScript($rsScript).AddArgument("$logsDir\server.log").AddArgument("$logsDir\server-err.log").AddArgument("SERVER").AddArgument("Cyan")
 $rs2 = [powershell]::Create().AddScript($rsScript).AddArgument("$logsDir\collector.log").AddArgument("$logsDir\collector-err.log").AddArgument("COLLECTOR").AddArgument("Magenta")

 $rs1.BeginInvoke() | Out-Null
 $rs2.BeginInvoke() | Out-Null

# Esperar tecla
 $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# Cleanup
 $rs1.Stop(); $rs2.Stop()
 $rs1.Dispose(); $rs2.Dispose()
Stop-Process -Id $serverProc.Id -Force -ErrorAction SilentlyContinue
Stop-Process -Id $collectorProc.Id -Force -ErrorAction SilentlyContinue
Write-Host "`nProcesos detenidos." -ForegroundColor Yellow
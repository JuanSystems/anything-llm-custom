# sync-and-deploy.ps1
# Configuración de rutas críticas
$criticalFiles = @(
    "frontend/src/components/Sidebar/index.jsx",
    "frontend/src/components/Sidebar/ActiveWorkspaces/index.jsx",
    "frontend/src/components/Sidebar/ActiveWorkspaces/ThreadContainer/index.jsx"
)

Write-Host "--- [1/5] Resguardando cambios locales ---" -ForegroundColor Cyan
git stash # Guarda cambios temporales para evitar errores de checkout

Write-Host "--- [2/5] Sincronizando rama Main con Upstream ---" -ForegroundColor Cyan
git checkout main
git pull upstream master
git push origin main

Write-Host "--- [3/5] Integrando actualizaciones en mi-interfaz ---" -ForegroundColor Cyan
git checkout mi-interfaz
$rebaseStatus = git rebase main

if ($LASTEXITCODE -ne 0) {
    Write-Host "!!! [CRÍTICO] Conflicto de Git detectado. Resuelve manualmente y luego ejecuta 'git rebase --continue'" -ForegroundColor Red
    exit
}

# Verificación de integridad de archivos críticos
foreach ($file in $criticalFiles) {
    if (-not (Test-Path $file)) {
        Write-Host "!!! [ERROR] Archivo desaparecido: $file" -ForegroundColor Red
        exit
    }
}
Write-Host "[OK] Integridad de archivos confirmada." -ForegroundColor Green

Write-Host "--- [4/5] Iniciando Compilación con Yarn ---" -ForegroundColor Cyan
cd frontend
# Ejecutamos yarn para asegurar que las dependencias de la v1.12.1 estén presentes
yarn install 
yarn build
if ($LASTEXITCODE -ne 0) {
    Write-Host "!!! [ERROR] La compilación falló." -ForegroundColor Red
    cd ..
    exit
}
cd ..

Write-Host "--- [5/5] Desplegando assets al servidor ---" -ForegroundColor Cyan
# Limpieza preventiva del destino para evitar archivos huérfanos
Remove-Item "server\public\*" -Recurse -Force -ErrorAction SilentlyContinue
# Copia de nuevos archivos de compilación
Copy-Item "frontend\dist\*" "server\public\" -Recurse -Force

Write-Host "--- PROCESO COMPLETADO EXITOSAMENTE ---" -ForegroundColor Green
Write-Host "Capa de UI actualizada y sincronizada con v1.12.1" -ForegroundColor Gray
git stash pop # Recupera tus cambios si los había
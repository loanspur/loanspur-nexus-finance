@echo off
echo ========================================
echo Loan Migration to Unified System
echo ========================================
echo.

echo Choose migration mode:
echo 1. Dry Run (test without making changes)
echo 2. Live Migration (apply changes)
echo 3. Force Migration (overwrite existing)
echo 4. Exit
echo.

set /p choice="Enter your choice (1-4): "

if "%choice%"=="1" (
    echo.
    echo Running DRY RUN migration...
    echo This will show what would be changed without making any changes.
    echo.
    node scripts/migrate-existing-loans.js --dry-run
) else if "%choice%"=="2" (
    echo.
    echo Running LIVE migration...
    echo This will apply changes to your database.
    echo.
    set /p confirm="Are you sure you want to proceed? (y/N): "
    if /i "%confirm%"=="y" (
        node scripts/migrate-existing-loans.js
    ) else (
        echo Migration cancelled.
    )
) else if "%choice%"=="3" (
    echo.
    echo Running FORCE migration...
    echo This will overwrite existing migrated loans.
    echo.
    set /p confirm="Are you sure you want to force migration? (y/N): "
    if /i "%confirm%"=="y" (
        node scripts/migrate-existing-loans.js --force
    ) else (
        echo Force migration cancelled.
    )
) else if "%choice%"=="4" (
    echo Exiting...
    exit /b 0
) else (
    echo Invalid choice. Please run the script again.
    exit /b 1
)

echo.
echo Migration completed!
pause

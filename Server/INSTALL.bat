@echo off
echo ========================================
echo LeadForge MongoDB Setup
echo ========================================
echo.

echo [1/4] Installing dependencies...
call npm install

echo.
echo [2/4] Checking .env file...
if not exist .env (
    echo Creating .env file from .env.example...
    copy .env.example .env
    echo.
    echo ⚠️  IMPORTANT: Please update MONGODB_URI in .env file!
    echo    - For local: mongodb://localhost:27017/leadforge
    echo    - For Atlas: mongodb+srv://username:password@cluster.mongodb.net/leadforge
    echo.
) else (
    echo .env file already exists
)

echo.
echo [3/4] Setup complete!
echo.
echo [4/4] Next steps:
echo    1. Update MONGODB_URI in .env file
echo    2. Make sure MongoDB is running
echo    3. Run: npm start
echo.
echo ========================================
echo Installation Complete! 🎉
echo ========================================
pause

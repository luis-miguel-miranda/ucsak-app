import os
import subprocess
from pathlib import Path
from hatchling.builders.hooks.plugin.interface import BuildHookInterface

def cleanup_directory(directory: Path):
    """Recursively remove all contents of a directory"""
    if directory.exists():
        for item in directory.iterdir():
            if item.is_file():
                item.unlink()
            elif item.is_dir():
                cleanup_directory(item)
                item.rmdir()

class CustomBuildHook(BuildHookInterface):
    def initialize(self, version, build_data):
        """Initialize the build hook"""
        self.build_frontend()
        self.build_backend()

    def build_frontend(self):
        """Build the frontend React application"""
        print("Building frontend...")
        frontend_dir = Path(".")
        
        # Install frontend dependencies
        subprocess.run(["npm", "install"], cwd=frontend_dir, check=True)
        
        # Build frontend
        subprocess.run(["npm", "run", "build"], cwd=frontend_dir, check=True)
        
        # Copy build files to api/static
        static_dir = Path("api/static")
        static_dir.mkdir(exist_ok=True)
        
        # Clean up existing static files recursively
        cleanup_directory(static_dir)
        
        # Copy new build files
        build_dir = frontend_dir / "build"
        for item in build_dir.glob("*"):
            if item.is_file():
                subprocess.run(["cp", "-r", str(item), str(static_dir)], check=True)
            elif item.is_dir():
                subprocess.run(["cp", "-r", str(item), str(static_dir)], check=True)

    def build_backend(self):
        """Build the backend FastAPI application"""
        print("Building backend...")
        api_dir = Path("api")
        
        # Create __init__.py if it doesn't exist
        init_file = api_dir / "__init__.py"
        if not init_file.exists():
            init_file.touch()

def build():
    """Main build function"""
    hook = CustomBuildHook()
    hook.build_frontend()
    hook.build_backend()
    print("Build complete!")

if __name__ == "__main__":
    build() 
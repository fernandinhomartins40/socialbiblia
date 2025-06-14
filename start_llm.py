#!/usr/bin/env python3
"""
Script to start the Local LLM Server
Run this to enable local AI capabilities for BibliaConnect
"""

import subprocess
import sys
import os

def main():
    print("🚀 Starting BibliaConnect Local LLM Server...")
    print("📚 Model: Phi-2 Biblical AI (2.7B-quantized)")
    print("🔗 Server will be available at: http://localhost:8080")
    print()
    
    # Change to server directory
    server_path = os.path.join(os.path.dirname(__file__), 'server')
    
    try:
        # Start the LLM server
        subprocess.run([
            sys.executable, 
            os.path.join(server_path, 'local_llm.py')
        ], check=True)
    except KeyboardInterrupt:
        print("\n🛑 LLM Server stopped by user")
    except Exception as e:
        print(f"❌ Error starting LLM server: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
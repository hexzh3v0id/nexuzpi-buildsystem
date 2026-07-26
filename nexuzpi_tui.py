#!/usr/bin/env python3
"""
NexuzPi OS - Terminal User Interface (TUI)
Futuristic Dark Neon Textual Interface for Metanexuz.de / Nexuzcode.de
Raspberry Pi 5 (BCM2712) Firmware & RootFS Build System
"""

import os
import sys
import time
import shutil
import subprocess
from pathlib import Path

# ANSI Neon Colors
CYAN = "\033[38;2;0;243;255m"
MAGENTA = "\033[38;2;217;70;239m"
GREEN = "\033[38;2;16;185;129m"
YELLOW = "\033[38;2;250;204;21m"
BLUE = "\033[38;2;59;130;246m"
BG_DARK = "\033[48;2;15;23;42m"
BOLD = "\033[1m"
DIM = "\033[2m"
RESET = "\033[0m"

BANNER = f"""{CYAN}{BOLD}
  _  _ _____  ___   _ _____ ___   ___  ___  
 | \\| | __\\ \\/ / | | |_  / | _ \\|_ _|/ _ \\ 
 | .` | _| >  <| |_| |/ /| |  _/ | || (_) |
 |_|\\_|___/_/\\_\\\\___/___|_|_|  |___|\\___/  
{MAGENTA}  [ RASPBERRY PI 5 - BCM2712 LINUX FIRMWARE BUILDER ]
{YELLOW}  Organisaton: Metanexuz.de / Nexuzcode.de{RESET}
"""

def draw_header():
    os.system("clear" if os.name != "nt" else "cls")
    print(BANNER)
    print(f"{CYAN}━" * 70 + f"{RESET}")

def render_progress(percent, status):
    width = 40
    filled = int(width * (percent / 100))
    bar = f"{GREEN}█" * filled + f"{DIM}░" * (width - filled) + f"{RESET}"
    print(f"\r[{bar}] {CYAN}{percent:3d}%{RESET} {MAGENTA}{status[:35]:<35}{RESET}", end="", flush=True)

def main():
    draw_header()
    print(f"\n{BOLD}{CYAN}Willkommen im NexuzPi OS Firmware Builder{RESET}")
    print(f"{DIM}Wählen Sie das FHS Layout und die Toolchain für das RPi 5 (BCM2712 ARM64):{RESET}\n")

    print(f"1) {GREEN}Standard FHS Layout{RESET} (/bin, /etc, /lib, /usr, /var, /home, /dev, /proc, /tmp...)")
    print(f"2) {MAGENTA}Immutable / Read-Only FHS Layout{RESET} (System-Verzeichnisse RO, /var & /tmp RW OverlayFS)\n")
    
    choice_fhs = input(f"{YELLOW}Auswahl FHS Layout [1/2] (Default 1): {RESET}").strip()
    fhs = "readonly" if choice_fhs == "2" else "standard"

    print(f"\n{BOLD}{CYAN}Wähle die Cross-Toolchain C-Bibliothek:{RESET}")
    print(f"1) {GREEN}GNU Toolchain{RESET} (aarch64-linux-gnu-)")
    print(f"2) {MAGENTA}Musl Toolchain{RESET} (aarch64-linux-musl-)")
    print(f"3) {YELLOW}uClibc Toolchain{RESET} (aarch64-buildroot-linux-uclibc-)\n")

    choice_tc = input(f"{YELLOW}Auswahl Toolchain [1/2/3] (Default 1): {RESET}").strip()
    toolchain = "musl" if choice_tc == "2" else ("uclibc" if choice_tc == "3" else "gnu")

    print(f"\n{CYAN}━" * 70 + f"{RESET}")
    print(f"{BOLD}{GREEN}Starte Build mit:{RESET}")
    print(f"  • FHS Layout: {BOLD}{fhs.upper()}{RESET}")
    print(f"  • Toolchain:  {BOLD}{toolchain.upper()}{RESET}")
    print(f"  • Zielpfad:   {BOLD}$HOME/nexuzpi-development/work/build/rootfs{RESET}\n")

    cmd = [
        sys.executable,
        str(Path(__file__).parent / "nexuzpi_engine.py"),
        "--fhs", fhs,
        "--toolchain", toolchain
    ]

    try:
        proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
        for line in proc.stdout:
            line = line.strip()
            if line.startswith("__NEXUZ_EVENT__"):
                import json
                try:
                    data = json.loads(line.replace("__NEXUZ_EVENT__", ""))
                    if data.get("progress") is not None:
                        render_progress(data["progress"], data.get("message", ""))
                except Exception:
                    pass
            elif line.startswith("__NEXUZ_LOG__"):
                import json
                try:
                    data = json.loads(line.replace("__NEXUZ_LOG__", ""))
                    print(f"\n{DIM}[{data.get('timestamp')}] {data.get('line')}{RESET}")
                except Exception:
                    pass
            else:
                print(f"{DIM}{line}{RESET}")

        proc.wait()
        print(f"\n\n{BOLD}{GREEN}✔ BUILD-PROZESS ABGESCHLOSSEN!{RESET}\n")
    except KeyboardInterrupt:
        print(f"\n{RED}Build abgebrochen.{RESET}")

if __name__ == "__main__":
    main()

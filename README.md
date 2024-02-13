# Explanation
![windows-build](https://github.com/williamyang98/VirtualJoystickCpp/actions/workflows/windows.yml/badge.svg)

[uWebsockets](https://github.com/uNetworking/uWebSockets) C++ server communicates with [vJoy](https://github.com/njz3/vJoy) to emulate a virtual joystick over a websocket.

## Instructions for use
1. Download release from [releases section](https://github.com/williamyang98/VirtualJoystickCpp/releases)
2. Unzip the folder
3. Install ```vJoySetup-*.exe```
4. Setup your controller by running ```vJoyConf.exe``` which was just installed
5. Start the server by running ```main.exe```
6. Open http://localhost:3000 in your browser
7. Select a controller layout

## Example UI
Click [here](https://fiendchain.github.io/VirtualJoystickCpp/msfs.html) for a demo of the UI 

### Microsoft Flight Simulator 2020
![alt text](docs/gui_msfs_2020.png "Microsoft Flight Simulator 2020")

### Kerbal Space Program
![alt text](docs/gui_ksp.png "Kerbal Space Program")

### Changing UI
UI is written in native javascript and basic HTML. Use the existing webpages in ```static/*.html``` as a starting guide.

## Instructions for building
### Dependencies
- uWebsocket 20.11.0
- vJoy 2.2.1

### Build environment
- Visual Studio 2020
- C++17 compiler
- vcpkg 
- cmake

### Steps
1. Initialise your x64 C++ development environment by running ```vcvars64.bat```
2. Configure cmake: ```cmake . -B build -DCMAKE_BUILD_TYPE=Release -DCMAKE_TOOLCHAIN_FILE=C:\tools\vcpkg\scripts\buildsystems\vcpkg.cmake```
3. Build: ```cmake --build build --config Release```
4. Run: ```.\build\Release\main.exe```

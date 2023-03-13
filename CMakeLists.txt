cmake_minimum_required(VERSION 3.21)
project(main)

find_package(ZLIB REQUIRED)
find_package(unofficial-libuv CONFIG REQUIRED)
# Header only
find_path(UWEBSOCKETS_INCLUDE_DIRS "uwebsockets/App.h")
# Fetch dependencies
find_library(USOCKETS_LIB uSockets)
find_library(LIBUV_LIB libuv)

set(vjoy_DIR ${CMAKE_CURRENT_LIST_DIR}/vendor/vJoyCpp)
find_package(vjoy CONFIG REQUIRED)

macro(install_dlls target)
add_custom_command(
    TARGET ${target}
    POST_BUILD 
    COMMAND ${CMAKE_COMMAND} -E copy 
    $<TARGET_RUNTIME_DLLS:${target}> 
    $<TARGET_FILE_DIR:${target}>
    COMMAND_EXPAND_LISTS
)
endmacro()

set(SRC_DIR ${CMAKE_CURRENT_LIST_DIR}/src)
add_library(server STATIC
    ${SRC_DIR}/server/run_server.cpp
    ${SRC_DIR}/server/create_websocket.cpp
    ${SRC_DIR}/server/get_mime_type.cpp
)
target_include_directories(server PRIVATE ${SRC_DIR} ${SRC_DIR}/server ${UWEBSOCKETS_INCLUDE_DIRS})
set_target_properties(server PROPERTIES CXX_STANDARD 17)
target_link_libraries(server PRIVATE ZLIB::ZLIB ${USOCKETS_LIB} ${LIBUV_LIB})

add_library(controller STATIC
    ${SRC_DIR}/controller/controller_packet_handler.cpp
)
target_include_directories(controller PRIVATE ${SRC_DIR} ${SRC_DIR}/controller)
set_target_properties(controller PROPERTIES CXX_STANDARD 17)
target_link_libraries(controller PUBLIC vjoy)

add_executable(main ${SRC_DIR}/main.cpp)
target_include_directories(main PRIVATE ${SRC_DIR})
set_target_properties(main PROPERTIES CXX_STANDARD 17)
target_link_libraries(main PRIVATE server controller)
install_dlls(main)
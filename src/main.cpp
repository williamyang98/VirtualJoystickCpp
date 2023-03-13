#include <stdio.h>
#include "vjoy.hpp"
#include "server/run_server.hpp"
#include "controller/controller_packet_handler.hpp"

#define OPTPARSE_IMPLEMENTATION
#include "utility/optparse.h"

struct ArgumentParser {
    int port;
    const char* static_filepath;
};

class HandlerFactory: public PacketHandlerFactory {
public:
    std::unique_ptr<PacketHandler> create_handler(void) {
        return std::make_unique<ControllerPacketHandler>();
    }
};

void vjoy_api_print_info(void);
void convert_utf16_to_ascii(const char16_t* src, char* dst, const int N);
void print_usage(void);
ArgumentParser parse_arguments(int argc, char** argv);

int main(int argc, char** argv) {
    const auto args = parse_arguments(argc, argv);
    if (!vjoy::api_is_enabled()) {
        printf("vjoy is not enabled\n");
        return 1;
    }
    vjoy_api_print_info();
    HandlerFactory handler_factory;
    run_server(args.port, args.static_filepath, &handler_factory);

    // NOTE: run_server is blocking if the server starts correctly
    fprintf(
        stderr,
        "Failed to start server on port=%d static-filepath='%s'\n", 
        args.port, args.static_filepath
    );
    return 0;
}

void print_usage(void) {
    fprintf(stderr, 
        "main, Launch a http server with websocket vJoy interface\n\n"
        "\t[--port <port>                (default: 3000)]\n"
        "\t[--static-filepath <filepath> (default: './static')]\n"
        "\t[--help                       (show usage)]\n"
    );
}

ArgumentParser parse_arguments(int argc, char** argv) {
    ArgumentParser parser;
    parser.port = 3000;
    parser.static_filepath = "./static";

    struct optparse options;
    optparse_init(&options, argv);
    struct optparse_long longopts[] = {
        {"port",            'p', OPTPARSE_REQUIRED},
        {"static-filepath", 'd', OPTPARSE_REQUIRED},
        {"help",            'h', OPTPARSE_NONE},
    };

    while (true) {
        const int code = optparse_long(&options, longopts, nullptr);
        if (code == -1) break;
        switch (code) {
        case 'p':
            parser.port = atoi(options.optarg);
            break;
        case 'd':
            parser.static_filepath = options.optarg;
            break;
        case 'h':
        case '?':
            print_usage();
            exit(1);
            break;
        }
    }

    return parser;
}

void vjoy_api_print_info(void) {
    const uint16_t version_number = vjoy::api_get_version();
    const char16_t* product_str = vjoy::api_get_product_string();
    const char16_t* manufacturer_str = vjoy::api_get_manufacturer_string();
    const char16_t* serial_number_str = vjoy::api_get_serial_number_string();
    int total_existing_devices = 0;
    int max_total_devices = 0;
    vjoy::api_get_total_existing_devices(&total_existing_devices);
    vjoy::api_get_max_total_devices(&max_total_devices);

    // We need to convert utf16 to ascii
    constexpr int N = 64;
    char buf[N];

    printf("Version Number:  0x%04X\n", version_number);
    convert_utf16_to_ascii(product_str, buf, N);
    printf("Product ID:      '%s'\n", buf);
    convert_utf16_to_ascii(manufacturer_str, buf, N);
    printf("Manufacturer ID: '%s'\n", buf);
    convert_utf16_to_ascii(serial_number_str, buf, N);
    printf("Serial Number:   '%s'\n", buf);
    printf("Total devices:   %d/%d\n", total_existing_devices, max_total_devices);
}

void convert_utf16_to_ascii(const char16_t* src, char* dst, const int N) {
    constexpr char16_t ASCII_MASK = 0x007F;
    for (int i = 0; i < N; i++) {
        dst[i] = char(src[i] & ASCII_MASK);
        if (dst[i] == 0x00) break;
    }
    dst[N-1] = 0x00;
}
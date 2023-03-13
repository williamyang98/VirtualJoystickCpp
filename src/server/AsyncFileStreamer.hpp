#pragma once

#include <filesystem>
#include <memory>
#include "get_mime_type.hpp"

struct AsyncFileStreamer {

    std::map<std::string, std::unique_ptr<AsyncFileReader>, std::less<>> asyncFileReaders;
    std::string root;

    AsyncFileStreamer(std::string root) : root(root) {
        // for all files in this path, init the map of AsyncFileReaders
        updateRootCache();
    }

    void updateRootCache() {
        // todo: if the root folder changes, we want to reload the cache
        for(auto &p : std::filesystem::recursive_directory_iterator(root)) {
            if (!std::filesystem::is_regular_file(p)) {
                continue;
            }

            std::string absolute_filepath = p.path().string();
            std::string relative_filepath = absolute_filepath.substr(root.length());
            std::replace(relative_filepath.begin(), relative_filepath.end(), '\\', '/');

            std::cout << "Cached file: " << relative_filepath << std::endl;
            asyncFileReaders[std::move(relative_filepath)] = std::make_unique<AsyncFileReader>(std::move(absolute_filepath));
        }
    }

    template <bool SSL>
    void streamFile(uWS::HttpResponse<SSL> *res, std::string_view url) {
        auto it = asyncFileReaders.find(url);
        if (it == asyncFileReaders.end()) {
            std::cout << "Did not find file: " << url << std::endl;
            res->writeStatus("404 Not Found");
            res->end();
            return;
        } 

        res->writeStatus(uWS::HTTP_200_OK);
        const auto mime_type = get_mime_type(url);
        if (!mime_type.empty()) {
            res->writeHeader("Content-Type", mime_type);
        }
        streamFile(res, it->second.get());
    }

    template <bool SSL>
    static void streamFile(uWS::HttpResponse<SSL> *res, AsyncFileReader *asyncFileReader) {
        /* Peek from cache */
        std::string_view chunk = asyncFileReader->peek(int(res->getWriteOffset()));
        if (!chunk.length() || res->tryEnd(chunk, asyncFileReader->getFileSize()).first) {
            /* Request new chunk */
            // todo: we need to abort this callback if peer closed!
            // this also means Loop::defer needs to support aborting (functions should embedd an atomic boolean abort or something)

            // Loop::defer(f) -> integer
            // Loop::abort(integer)

            // hmm? no?

            // us_socket_up_ref eftersom vi delar ägandeskapet

            if (chunk.length() < asyncFileReader->getFileSize()) {
                asyncFileReader->request(int(res->getWriteOffset()), [res, asyncFileReader](std::string_view chunk) {
                    // check if we were closed in the mean time
                    //if (us_socket_is_closed()) {
                        // free it here
                        //return;
                    //}

                    /* We were aborted for some reason */
                    if (!chunk.length()) {
                        // todo: make sure to check for is_closed internally after all callbacks!
                        res->close();
                    } else {
                        AsyncFileStreamer::streamFile(res, asyncFileReader);
                    }
                });
            }
        } else {
            /* We failed writing everything, so let's continue when we can */
            res->onWritable([res, asyncFileReader](size_t offset) {

                // här kan skiten avbrytas!

                AsyncFileStreamer::streamFile(res, asyncFileReader);
                // todo: I don't really know what this is supposed to mean?
                return false;
            })->onAborted([]() {
                std::cout << "ABORTED!" << std::endl;
            });
        }
    }

    inline bool hasExt(std::string_view file, std::string_view ext) {
        if (ext.size() > file.size()) {
            return false;
        }
        return std::equal(ext.rbegin(), ext.rend(), file.rbegin());
    }
};

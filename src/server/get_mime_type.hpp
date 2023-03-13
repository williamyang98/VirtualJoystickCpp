#pragma once
#include <string_view>

// For an extension give the associated mimetype
// This is because browsers don't check the extension, but rather the Content-Type
// E.g. filename='script.js', mime-type='text/javascript'
std::string_view get_mime_type(std::string_view filename);
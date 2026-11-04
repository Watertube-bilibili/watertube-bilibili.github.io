# Windows bridge runtime notices

The original bridge source is MIT licensed (LICENSE).

The supplied Windows x64 executable was built using MinGW-w64 GCC 14.2.0 with static GCC/libstdc++ runtime linkage and MinGW-w64 runtime components. GCC runtime code is covered by the GCC Runtime Library Exception where applicable. MinGW-w64 runtime portions have their own notices, including permissive notices for winpthreads. The distribution notices from the exact Debian build packages are retained in `licenses/`.

Build packages (Debian trixie, amd64):

- g++-mingw-w64-x86-64-posix / gcc-mingw-w64-x86-64-posix / gcc-mingw-w64-x86-64-posix-runtime / gcc-mingw-w64-base: 14.2.0-19+27+b1
- mingw-w64-common / mingw-w64-x86-64-dev: 12.0.0-5
- binutils-mingw-w64-x86-64: 2.44-3+12+b1

Package archives were retrieved from https://deb.debian.org/debian/ and checked against the SHA-256 values in the distribution's package index. The executable imports only Windows system DLLs and does not need a separate MinGW runtime installation.

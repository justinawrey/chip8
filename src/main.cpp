#include <iostream>
#include <string>
#include "../inc/chip8.h"

std::string usage() {
    return "usage: chip8 <rom-name>";
}

int main(int argc, char* argv[]) {
    if (argc != 2) {
        std::cout << usage() << std::endl;
        return -1;   
    }

    Chip8 chip8;
    chip8.load_rom(argv[1]);
    try {
        chip8.run(); // run interpreter at 60 fps
    } catch (const std::invalid_argument& e) {
        std::cout << "caught exception: " << e.what() << std::endl; 
    }

    return 0;
}

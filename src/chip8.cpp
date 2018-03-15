#include <fstream>
#include <iostream>
#include <bitset>
#include <map>
#include <cmath>
#include <unistd.h>
#include <stdexcept>
#include <sstream>

#include "../inc/chip8.h"
#include "../inc/display.h"

/** Static members **/

const int Chip8::_ram_size = 4096;
const int Chip8::_rom_offset = 512;
const uint8_t Chip8::_char_data[80] = {
0xF0, 0x90, 0x90, 0x90, 0xF0, // bits representation of 0
0x20, 0x60, 0x20, 0x20, 0x70, // 1
0xF0, 0x10, 0xF0, 0x80, 0xF0, // 2
0xF0, 0x10, 0xF0, 0x10, 0xF0, // 3
0x90, 0x90, 0xF0, 0x10, 0x10, // 4
0xF0, 0x80, 0xF0, 0x10, 0xF0, // 5
0xF0, 0x80, 0xF0, 0x90, 0xF0, // 6
0xF0, 0x10, 0x20, 0x40, 0x40, // 7
0xF0, 0x90, 0xF0, 0x90, 0xF0, // 8
0xF0, 0x90, 0xF0, 0x10, 0xF0, // 9
0xF0, 0x90, 0xF0, 0x90, 0x90, // A
0xE0, 0x90, 0xE0, 0x90, 0xE0, // B
0xF0, 0x80, 0x80, 0x80, 0xF0, // C
0xE0, 0x90, 0x90, 0x90, 0xE0, // D
0xF0, 0x80, 0xF0, 0x80, 0xF0, // E
0xF0, 0x80, 0xF0, 0x80, 0x80  // F
}; // 80 bytes of character data
 
const std::map<uint16_t, Instruction> Chip8::_instr_map = {
    {0x1234, Instruction::sys_addr}
};

/** Static functions **/
uint16_t Chip8::apply_mask(uint16_t mask, uint16_t opcode) {
    std::bitset<16> bits_mask(mask);
    std::bitset<16> bits_opcode(opcode);
    bits_opcode &= bits_mask;
    while (!bits_opcode[0]) {
        bits_opcode >>= 1;
    }
    return bits_opcode.to_ulong();
}


/******************* Private functions *************************/

/** 
 *  see instruction details in chip8.h
 *  compiler will optimize this big switch statement
 *  to an array of function pointers
 * **/
void Chip8::exec_opcode(uint16_t opcode) {
    Instruction instr = _instr_map.find(opcode)->second;
    switch(instr) {
        case Instruction::cls:
            cls(opcode); break;
        case Instruction::ret:
            ret(opcode); break;
        case Instruction::jp_addr:
            jp_addr(opcode); break;
        case Instruction::call_addr:
            call_addr(opcode); break;
        case Instruction::se_vx_byte:
            se_vx_byte(opcode); break;
        case Instruction::sne_vx_byte:
            sne_vx_byte(opcode); break;
        case Instruction::se_vx_vy:
            se_vx_vy(opcode); break;
        case Instruction::ld_vx_byte:
            ld_vx_byte(opcode); break;
        case Instruction::add_vx_byte:
            add_vx_byte(opcode); break;
        case Instruction::ld_vx_vy:
            ld_vx_vy(opcode); break;
        case Instruction::or_vx_vy:
            or_vx_vy(opcode); break;
        case Instruction::and_vx_vy:
            and_vx_vy(opcode); break;
        case Instruction::xor_vx_vy:
            xor_vx_vy(opcode); break;
        case Instruction::add_vx_vy:
            add_vx_vy(opcode); break;
        case Instruction::sub_vx_vy:
            sub_vx_vy(opcode); break;
        case Instruction::shr_vx:
            shr_vx(opcode); break;
        case Instruction::subn_vx_vy:
            subn_vx_vy(opcode); break;
        case Instruction::shl_vx:
            shl_vx(opcode); break;
        case Instruction::sne_vx_vy:
            sne_vx_vy(opcode); break;
        case Instruction::ld_i_addr:
            ld_i_addr(opcode); break;
        case Instruction::jp_v0_addr:
            jp_v0_addr(opcode); break;
        case Instruction::rnd_vx_byte:
            rnd_vx_byte(opcode); break;
        case Instruction::drw_vx_vy_nib:
            drw_vx_vy_nib(opcode); break;
        case Instruction::skp_vx:
            skp_vx(opcode); break;
        case Instruction::sknp_vx:
            sknp_vx(opcode); break;
        case Instruction::ld_vx_dt:
            ld_vx_dt(opcode); break;
        case Instruction::ld_vx_k:
            ld_vx_k(opcode); break;
        case Instruction::ld_dt_vx:
            ld_dt_vx(opcode); break;
        case Instruction::ld_st_vx:
            ld_st_vx(opcode); break;
        case Instruction::add_i_vx:
            add_i_vx(opcode); break;
        case Instruction::ld_f_vx:
            ld_f_vx(opcode); break;
        case Instruction::ld_b_vx:
            ld_b_vx(opcode); break;
        case Instruction::ld_start_at_i_vx:
            ld_start_at_i_vx(opcode); break;
        case Instruction::ld_vs_start_at_i:
            ld_vs_start_at_i(opcode); break;
        default:
            std::stringstream stream;
            stream << std::hex << opcode;
            throw std::invalid_argument("tried to execute invalid opcode: 0x" + stream.str());
    }
}

void Chip8::decrement_st() {    
    if(_st > 0) _st--;
}

void Chip8::decrement_dt() {
    if(_dt > 0) _dt--;
}


void Chip8::clear_registers() {
    for (int i = 0; i < 16; i++) { // 16 general 8 bit registers
        _v[i] = 0x0;
    }
    _st = 0x0; 
    _dt = 0x0; 
    _vi = 0x0; 
    _pc = 0x0; 
    while (!_sp.empty()) _sp.pop(); 
}

void Chip8::load_character_data() const {
    for (int i = 0; i < 80; i++) { // 80 bytes of character data
        _ram[i] = _char_data[i];
    }
}

void Chip8::sys_addr(uint16_t opcode) const {
    ; // this function only had use in legacy chip-8 machines.
      // it is included here purely for completeness and is ignored
      // in this implementation
}

void Chip8::cls(uint16_t opcode) {
    _display.clear_all_pixels();
    _pc++;
}

void Chip8::ret(uint16_t opcode) {
    _pc = _sp.top();
    _sp.pop();
}

void Chip8::jp_addr(uint16_t opcode) {
    _pc = apply_mask(0x0FFF, opcode);
}

void Chip8::call_addr(uint16_t opcode) {
    _sp.push(_pc);
    _pc = apply_mask(0x0FFF, opcode);
}

void Chip8::se_vx_byte(uint16_t opcode) {
    int x = apply_mask(0x0F00, opcode);
    int byte = apply_mask(0x00FF, opcode);
    _v[x] == byte ? _pc += 2 : _pc++;
}

void Chip8::sne_vx_byte(uint16_t opcode) {
    int x = apply_mask(0x0F00, opcode);
    int byte = apply_mask(0x00FF, opcode);
    _v[x] != byte ? _pc += 2 : _pc++;
}

void Chip8::se_vx_vy(uint16_t opcode) {
    int x = apply_mask(0x0F00, opcode);
    int y = apply_mask(0x00F0, opcode);
    _v[x] == _v[y] ? _pc += 2 : _pc++;
}

void Chip8::ld_vx_byte(uint16_t opcode) {
    int x = apply_mask(0x0F00, opcode);
    _v[x] = apply_mask(0x00FF, opcode);
    _pc++;    
}

void Chip8::add_vx_byte(uint16_t opcode) {
    int x  = apply_mask(0x0F00, opcode);
    _v[x] += apply_mask(0x00FF, opcode);
    _pc++;        
}

void Chip8::ld_vx_vy(uint16_t opcode) {
    int x = apply_mask(0x0F00, opcode);
    int y = apply_mask(0x00F0, opcode);
    _v[x] = _v[y];        
    _pc++;    
}

void Chip8::or_vx_vy(uint16_t opcode) {
    int x = apply_mask(0x0F00, opcode);
    int y = apply_mask(0x00F0, opcode);
    _v[x] |= _v[y];    
    _pc++;     
}

void Chip8::and_vx_vy(uint16_t opcode) {
    int x = apply_mask(0x0F00, opcode);
    int y = apply_mask(0x00F0, opcode);
    _v[x] &= _v[y];    
    _pc++;     
}

void Chip8::xor_vx_vy(uint16_t opcode) {
    int x = apply_mask(0x0F00, opcode);
    int y = apply_mask(0x00F0, opcode);
    _v[x] ^= _v[y];
    _pc++;     
}

void Chip8::add_vx_vy(uint16_t opcode) {
    int x = apply_mask(0x0F00, opcode);
    int y = apply_mask(0x00F0, opcode);
    unsigned int total = static_cast<unsigned int>(_v[x]) + static_cast<unsigned int>(_v[y]);
    total > 255 ? _v[0xF] = 1 : _v[0xF] = 0; // flag any overflows
    _v[x] = total;
    _pc++;
}

void Chip8::sub_vx_vy(uint16_t opcode) {
    int x = apply_mask(0x0F00, opcode);
    int y = apply_mask(0x00F0, opcode);
    _v[x] > _v[y] ? _v[0xF] = 1 : _v[0xF] = 0; // flag any overflows
    _v[x] -= _v[y];
    _pc++;
}

void Chip8::shr_vx(uint16_t opcode) {
    int x = apply_mask(0x0F00, opcode);
    _v[x] & 1 ? _v[0xF] = 1 : _v[0xF] = 0; // flag any overflows
    _v[x] /= 2;
    _pc++;
}

void Chip8::subn_vx_vy(uint16_t opcode) {
    int x = apply_mask(0x0F00, opcode);
    int y = apply_mask(0x00F0, opcode);
    _v[y] > _v[x] ? _v[0xF] = 1 : _v[0xF] = 0;
    _v[x] = _v[y] - _v[x];
    _pc++;
}

void Chip8::shl_vx(uint16_t opcode) {
    int x = apply_mask(0x0F00, opcode);
    _v[x] & 0x80 ? _v[0xF] = 1 : _v[0xF] = 0; // flag any overflows
    _v[x] *= 2;
    _pc++;
}

void Chip8::sne_vx_vy(uint16_t opcode) {
    int x = apply_mask(0x0F00, opcode);
    int y = apply_mask(0x00F0, opcode);
    _v[x] != _v[y] ? _pc += 2 : _pc++;
}

void Chip8::ld_i_addr(uint16_t opcode) {
    _vi = apply_mask(0x0FFF, opcode);
    _pc++;
}

void Chip8::jp_v0_addr(uint16_t opcode) {
    _pc = _v[0] + apply_mask(0x0FFF, opcode);
}

void Chip8::rnd_vx_byte(uint16_t opcode) {
    int x = apply_mask(0x0F00, opcode);
    int byte = apply_mask(0x00FF, opcode);
    _v[x] = (rand() % 256) & byte;
    _pc++;
}

void Chip8::drw_vx_vy_nib(uint16_t opcode) {
    int x = apply_mask(0x0F00, opcode);
    int y = apply_mask(0x00F0, opcode);
    int num_bytes = apply_mask(0x000F, opcode);
    bool unset = false;
    for (int i = 0; i < num_bytes; i++) {
        unset = unset || _display.set_byte(x, y + i, _ram[_vi + i]);
    }
    unset ? _v[0xF] = 1 : _v[0xF] = 0;
    _pc++;
}

void Chip8::skp_vx(uint16_t opcode) {

}

void Chip8::sknp_vx(uint16_t opcode) {

}

void Chip8::ld_vx_dt(uint16_t opcode) {
    int x = apply_mask(0x0F00, opcode);
    _v[x] = _dt;
    _pc++;
}

void Chip8::ld_vx_k(uint16_t opcode) {

}

void Chip8::ld_dt_vx(uint16_t opcode) {
    int x = apply_mask(0x0F00, opcode);
    _dt = _v[x];
    _pc++;
}

void Chip8::ld_st_vx(uint16_t opcode) {
    int x = apply_mask(0x0F00, opcode);
    _st = _v[x];
    _pc++;
}

void Chip8::add_i_vx(uint16_t opcode) {
    int x = apply_mask(0x0F00, opcode);
    _vi += _v[x];
    _pc++;
}

void Chip8::ld_f_vx(uint16_t opcode) {
    int x = apply_mask(0x0F00, opcode);
    _vi = 5 * x; // each hex sprite is 5 bytes long
    _pc++;
}

void Chip8::ld_b_vx(uint16_t opcode) {
    int x = apply_mask(0x0F00, opcode);
    int bcd = _v[x];
    for (int i = 2; i >= 0; i--) {
        int digit = bcd % 10;
        _ram[_vi + i] = digit;
        bcd /= 10; // integer division
    }
    _pc++;    
}

void Chip8::ld_start_at_i_vx(uint16_t opcode) {
    int x = apply_mask(0x0F00, opcode);
    for (int i = 0; i <= x; i++) {
        _ram[_vi + i] = _v[x];
    }
    _pc++;    
}

void Chip8::ld_vs_start_at_i(uint16_t opcode) {
    int x = apply_mask(0x0F00, opcode);
    for (int i = 0; i <= x; i++) {
        _v[x] = _ram[_vi + i];
    }
    _pc++;    
}

/******************* Public functions **************************/

Chip8::Chip8() : _ram(new uint8_t[_ram_size]), 
                 _display(Display(64, 32, new sf::RenderWindow(sf::VideoMode(1200, 600), "CHIP8"))) {
    clear_registers();
    load_character_data();
    srand(time(NULL));
}

Chip8::~Chip8() { 
    delete[] _ram; 
}

void Chip8::load_rom(const std::string& file_name) {
    std::ifstream in_stream;
    in_stream.open(file_name, std::ifstream::in | std::ifstream::binary);
    if (in_stream) {
        in_stream.seekg(0, in_stream.end);
        int length = in_stream.tellg();
        in_stream.seekg(0, in_stream.beg);    
        in_stream.read(reinterpret_cast<char*>(_ram) + _rom_offset, length);
    }
    in_stream.close();
}

void Chip8::dump_ram() const {
    std::cout << "chip8 ram start..." << std::endl;
    for (int i = 0; i < _ram_size; i++) {
        if (i == 0x200) std::cout << std::endl << std::endl << "chip8 program start..." << std::endl;
        if (i % 8 == 0) std::cout << std::endl;
        std::cout << std::bitset<8>{_ram[i]} << " ";
    }
    std::cout << std::endl;
}

void Chip8::dump_registers() const {
    for (int i = 0; i < 16; i++) { // there are 16 general purpose chip8 registers
        std::cout << "v" << std::hex << i << ": 0x" << static_cast<unsigned int>(_v[i]) << std::endl;
    }
    std::cout << "st: 0x" << std::hex << static_cast<unsigned int>(_st) << std::endl;
    std::cout << "dt: 0x" << std::hex << static_cast<unsigned int>(_dt) << std::endl;
    std::cout << "vi: 0x" << std::hex << static_cast<unsigned int>(_vi) << std::endl;
    std::cout << "pc: 0x" << std::hex << static_cast<unsigned int>(_pc) << std::endl; 
    std::cout << "sp: 0x" << std::hex << static_cast<unsigned int>(_sp.top()) << std::endl << std::endl;
}

void Chip8::run() {
    sf::RenderWindow* r_wind = _display.get_render_window();
    float micros_period = (1.0 / 60.0) * 1000000;    

    while (r_wind->isOpen())
    {
        // sleep to simulate 60 fps - here we are assuming
        // that code in the loop is executed instantaneously
        // to simplify calculation.
        // in reality, we are running a tiny bit under 60fps.
        usleep(micros_period);

        uint16_t opcode = _ram[_pc];
        exec_opcode(opcode);
        decrement_st();
        decrement_dt();
        
        // check all the window's events that were triggered since the last iteration of the loop
        sf::Event event;
        while (r_wind->pollEvent(event))
        {
            // "close requested" event: we close the window
            if (event.type == sf::Event::Closed)
                r_wind->close();
        }
    }
 }
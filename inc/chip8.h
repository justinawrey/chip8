#ifndef _CHIP8_H
#define _CHIP8_H

#include <cstdint>
#include <string>
#include <map>
#include <stack>

#include "display.h"

// Instruction descriptions taken from Cowgods Chip-8 techinal reference
// http://devernay.free.fr/hacks/chip8/C8TECH10.HTM#2.2
enum class Instruction {
    sys_addr,
    // 0nnn - SYS addr
    // Jump to a machine code routine at nnn.
    // This instruction is only used on the old computers on which 
    // Chip-8 was originally implemented. It is ignored by modern interpreters.
    
    cls,
    // 00E0 - CLS
    // Clear the display.
    
    ret,
    // 00EE - RET
    // Return from a subroutine.
    // The interpreter sets the program counter to the address at the top of the 
    // stack, then subtracts 1 from the stack pointer.
    
    jp_addr,
    // 1nnn - JP addr
    // Jump to location nnn.
    // The interpreter sets the program counter to nnn.
    
    call_addr,
    // 2nnn - CALL addr
    // Call subroutine at nnn.
    // The interpreter increments the stack pointer, then puts the current PC on
    // the top of the stack. The PC is then set to nnn.
    
    se_vx_byte,
    // 3xkk - SE Vx, byte
    // Skip next instruction if Vx = kk.
    // The interpreter compares register Vx to kk, and if they are equal, 
    // increments the program counter by 2.
    
    sne_vx_byte,
    // 4xkk - SNE Vx, byte
    // Skip next instruction if Vx != kk.
    // The interpreter compares register Vx to kk, and if they are not equal, 
    // increments the program counter by 2.
    
    se_vx_vy,
    // 5xy0 - SE Vx, Vy
    // Skip next instruction if Vx = Vy.
    // The interpreter compares register Vx to register Vy, and if they are equal, 
    // increments the program counter by 2.

    ld_vx_byte,
    // 6xkk - LD Vx, byte
    // Set Vx = kk.
    // The interpreter puts the value kk into register Vx.
    
    add_vx_byte,
    // 7xkk - ADD Vx, byte
    // Set Vx = Vx + kk.
    // Adds the value kk to the value of register Vx, then stores the result in Vx. 
    
    ld_vx_vy,
    // 8xy0 - LD Vx, Vy
    // Set Vx = Vy.
    // Stores the value of register Vy in register Vx.
    
    or_vx_vy,
    // 8xy1 - OR Vx, Vy
    // Set Vx = Vx OR Vy.
    // Performs a bitwise OR on the values of Vx and Vy, then stores the result in Vx. 
    // A bitwise OR compares the corresponding bits from two values, and if either bit is 1,
    // then the same bit in the result is also 1. Otherwise, it is 0. 
    
    and_vx_vy,
    // 8xy2 - AND Vx, Vy
    // Set Vx = Vx AND Vy.
    // Performs a bitwise AND on the values of Vx and Vy, then stores the result in Vx. 
    // A bitwise AND compares the corrseponding bits from two values, and if both bits are 1, 
    // then the same bit in the result is also 1. Otherwise, it is 0. 
    
    xor_vx_vy,
    // 8xy3 - XOR Vx, Vy
    // Set Vx = Vx XOR Vy.
    // Performs a bitwise exclusive OR on the values of Vx and Vy, then stores the result in Vx. 
    // An exclusive OR compares the corrseponding bits from two values, and if the bits are not
    // both the same, then the corresponding bit in the result is set to 1. Otherwise, it is 0. 
    
    add_vx_vy,
    // 8xy4 - ADD Vx, Vy
    // Set Vx = Vx + Vy, set VF = carry.
    // The values of Vx and Vy are added together. If the result is greater than 8 bits (i.e., > 255,) 
    // VF is set to 1, otherwise 0. Only the lowest 8 bits of the result are kept, and stored in Vx.
    
    sub_vx_vy,
    // 8xy5 - SUB Vx, Vy
    // Set Vx = Vx - Vy, set VF = NOT borrow.
    // If Vx > Vy, then VF is set to 1, otherwise 0. Then Vy is subtracted from Vx, and the results stored in Vx.
    
    shr_vx,
    // 8xy6 - SHR Vx {, Vy}
    // Set Vx = Vx SHR 1.
    // If the least-significant bit of Vx is 1, then VF is set to 1, otherwise 0. Then Vx is divided by 2.
    
    subn_vx_vy,
    // 8xy7 - SUBN Vx, Vy
    // Set Vx = Vy - Vx, set VF = NOT borrow.
    // If Vy > Vx, then VF is set to 1, otherwise 0. Then Vx is subtracted from Vy, and the results stored in Vx.
    
    shl_vx,
    // 8xyE - SHL Vx {, Vy}
    // Set Vx = Vx SHL 1.
    // If the most-significant bit of Vx is 1, then VF is set to 1, otherwise to 0. Then Vx is multiplied by 2.
    
    sne_vx_vy,
    // 9xy0 - SNE Vx, Vy
    // Skip next instruction if Vx != Vy.
    // The values of Vx and Vy are compared, and if they are not equal, the program counter is increased by 2.
    
    ld_i_addr,
    // Annn - LD I, addr
    // Set I = nnn.
    // The value of register I is set to nnn.
    
    jp_v0_addr,
    // Bnnn - JP V0, addr
    // Jump to location nnn + V0.
    // The program counter is set to nnn plus the value of V0.
    
    rnd_vx_byte,
    // Cxkk - RND Vx, byte
    // Set Vx = random byte AND kk.
    // The interpreter generates a random number from 0 to 255, which is then ANDed with the value kk. 
    // The results are stored in Vx. See instruction 8xy2 for more information on AND.
    
    drw_vx_vy_nib,
    // Dxyn - DRW Vx, Vy, nibble
    // Display n-byte sprite starting at memory location I at (Vx, Vy), set VF = collision.
    // The interpreter reads n bytes from memory, starting at the address stored in I. These bytes are 
    // then displayed as sprites on screen at coordinates (Vx, Vy). Sprites are XORed onto the existing screen. 
    // If this causes any pixels to be erased, VF is set to 1, otherwise it is set to 0. If the sprite is positioned 
    // so part of it is outside the coordinates of the display, it wraps around to the opposite side of the screen. 
    
    skp_vx,
    // Ex9E - SKP Vx
    // Skip next instruction if key with the value of Vx is pressed.
    // Checks the keyboard, and if the key corresponding to the value of Vx is currently in the down position, PC is increased by 2.
    
    sknp_vx,
    // ExA1 - SKNP Vx
    // Skip next instruction if key with the value of Vx is not pressed.
    // Checks the keyboard, and if the key corresponding to the value of Vx is currently in the up position, PC is increased by 2.
    
    ld_vx_dt,
    // Fx07 - LD Vx, DT
    // Set Vx = delay timer value.
    // The value of DT is placed into Vx.
    
    ld_vx_k,
    // Fx0A - LD Vx, K
    // Wait for a key press, store the value of the key in Vx.
    // All execution stops until a key is pressed, then the value of that key is stored in Vx.
    
    ld_dt_vx,
    // Fx15 - LD DT, Vx
    // Set delay timer = Vx.
    // DT is set equal to the value of Vx.
    
    ld_st_vx,
    // Fx18 - LD ST, Vx
    // Set sound timer = Vx.
    // ST is set equal to the value of Vx.
    
    add_i_vx,
    // Fx1E - ADD I, Vx
    // Set I = I + Vx.
    // The values of I and Vx are added, and the results are stored in I.
    
    ld_f_vx,
    // Fx29 - LD F, Vx
    // Set I = location of sprite for digit Vx.
    // The value of I is set to the location for the hexadecimal sprite corresponding to the value of Vx.
    
    ld_b_vx,
    // Fx33 - LD B, Vx
    // Store BCD representation of Vx in memory locations I, I+1, and I+2.
    // The interpreter takes the decimal value of Vx, and places the hundreds digit 
    // in memory at location in I, the tens digit at location I+1, and the ones digit at location I+2.
    
    ld_start_at_i_vx,
    // Fx55 - LD [I], Vx
    // Store registers V0 through Vx in memory starting at location I.
    // The interpreter copies the values of registers V0 through Vx into memory, starting at the address in I.
    
    ld_vs_start_at_i,
    // Fx65 - LD Vx, [I]
    // Read registers V0 through Vx from memory starting at location I.
    // The interpreter reads values from memory starting at location I into registers V0 through Vx.
};

class Chip8 {
private:
    const static int       _ram_size;      // generally 4096 bytes for legacy chip8
    const static int       _rom_offset;    // chip8 game roms start at byte 512 (0x200) 
    const static uint8_t   _char_data[80]; // char data stored in first 512 bytes of memory
    const static std::map<uint16_t, Instruction> _instr_map;
    static uint16_t apply_mask(uint16_t mask, uint16_t opcode);

    uint8_t* const _ram;
    uint8_t  _v[16]; // chip8 has 16 general purpose 8-bit registers labelled v0-vF
    uint16_t _vi;  // a 16 bit register for storing memory addresses
    uint8_t  _st;  // an 8 bit sound timer
    uint8_t  _dt;  // an 8 bit delay timer
    uint8_t  _sp;  // an 8 bit stack pointer - allow up to 16 levels of subroutine nesting
    uint16_t _pc;  // a 16 bit program counter
    Display _display; // class using sfml to draw to screen

    void clear_registers();
    void load_character_data() const;
    void exec_opcode(uint16_t opcode);
    inline void decrement_st();
    inline void decrement_dt();

    /** instruction functions **/
    inline void sys_addr(uint16_t opcode) const;
    inline void cls(uint16_t opcode);
    inline void ret(uint16_t opcode);
    inline void jp_addr(uint16_t opcode);
    inline void call_addr(uint16_t opcode);
    inline void se_vx_byte(uint16_t opcode);
    inline void sne_vx_byte(uint16_t opcode);
    inline void se_vx_vy(uint16_t opcode);
    inline void ld_vx_byte(uint16_t opcode);
    inline void add_vx_byte(uint16_t opcode);
    inline void ld_vx_vy(uint16_t opcode);
    inline void or_vx_vy(uint16_t opcode);
    inline void and_vx_vy(uint16_t opcode);
    inline void xor_vx_vy(uint16_t opcode);
    inline void add_vx_vy(uint16_t opcode);
    inline void sub_vx_vy(uint16_t opcode);
    inline void shr_vx(uint16_t opcode);
    inline void subn_vx_vy(uint16_t opcode);
    inline void shl_vx(uint16_t opcode);
    inline void sne_vx_vy(uint16_t opcode);
    inline void ld_i_addr(uint16_t opcode);
    inline void jp_v0_addr(uint16_t opcode);
    inline void rnd_vx_byte(uint16_t opcode);
    inline void drw_vx_vy_nib(uint16_t opcode);
    inline void skp_vx(uint16_t opcode);
    inline void sknp_vx(uint16_t opcode);
    inline void ld_vx_dt(uint16_t opcode);
    inline void ld_vx_k(uint16_t opcode);
    inline void ld_dt_vx(uint16_t opcode);
    inline void ld_st_vx(uint16_t opcode);
    inline void add_i_vx(uint16_t opcode);
    inline void ld_f_vx(uint16_t opcode);
    inline void ld_b_vx(uint16_t opcode);
    inline void ld_start_at_i_vx(uint16_t opcode);
    inline void ld_vs_start_at_i(uint16_t opcode);

public:
    Chip8();
    virtual ~Chip8(); // ensure extensibility - super-chip8 in the future
    void load_rom(const std::string& file_name);
    void dump_ram() const;
    void dump_registers() const;
    void run();
};

#endif
#ifndef _SCREEN_H
#define _SCREEN_H

#include <vector>
#include <SFML/Graphics.hpp>

class Display {
private:
    // we need to store pixel in order to be able to correctly set vf
    // flags when erasing a pixel by drawing on top of it as per chip8 spec
    std::vector<bool> _px_data; // 64 x 32 px data for normal chip8
    const int _x_res;
    const int _y_res;
    sf::RenderWindow *  _render_window;
    
    void set_px_to_display(int x, int y,
        sf::Color& color) const;
        
public:
    Display(int x_res, int y_res, sf::RenderWindow* render_window);
    ~Display();
    
    // sets pixel on the screen at coordinates x, y
    // returns true if pixel was already set before setting again
    bool set_pixel(int x, int y);
    void clear_all_pixels() const;
    sf::RenderWindow* get_render_window() const;
};

#endif
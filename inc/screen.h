#ifndef _SCREEN_H
#define _SCREEN_H

#include <vector>
#include <SFML/Graphics.hpp>

class Screen {
private:
    // we need to store pixel in order to be able to correctly set vf
    // flags when erasing a pixel by drawing on top of it as per chip8 spec
    std::vector<bool> _px_data; // 64 x 32 px data for normal chip8
    const int _x_res;
    const int _y_res;
    sf::RenderWindow *  _render_window;
    
    void set_px_to_screen(const int& x, const int& y,
        sf::Color& color) const;
        
public:
    Screen(const int& x_res, const int& y_res, sf::RenderWindow* render_window);
    ~Screen();
    
    // sets pixel on the screen at coordinates x, y
    // returns true if pixel was already set before setting again
    bool set_pixel(const int& x, const int& y);
    void clear_all_pixels() const;
    sf::RenderWindow* get_render_window() const;
};

#endif
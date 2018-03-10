#include <SFML/Graphics.hpp>
#include <bitset>

#include "../inc/display.h"

Display::Display(int x_res, int y_res, sf::RenderWindow* render_window) : 
    _px_data(std::vector<bool>(x_res * y_res, false)), _x_res(x_res), _y_res(y_res),
    _render_window(render_window) {}

Display::~Display() {
    delete _render_window;
}
    
/*************** PRIVATE FUNCTIONS *************************/

void Display::set_px_to_display(int x, int y, sf::Color& color) const {
    sf::Vector2u window_size = _render_window->getSize();
    double px_size_x = window_size.x / _x_res; 
    double px_size_y = window_size.y / _y_res;   
    sf::RectangleShape pixel(sf::Vector2f(px_size_x, px_size_y));
    pixel.setFillColor(color);
    pixel.setPosition(x * px_size_x, y * px_size_y);
    _render_window->draw(pixel);
}

/**************** PUBLIC FUNCTIONS *************************/
bool Display::set_pixel(int x, int y) {
    int y_loc = (y - 1) < 0 ? 0 : y - 1;
    int px_loc = y_loc * _x_res + x;     
    bool already_set =_px_data[px_loc];
    _px_data[px_loc] = _px_data[px_loc] != true; // logical xor
    if (already_set) {
        sf::Color black = sf::Color(sf::Color::Black);
        set_px_to_display(x, y, black);
    } else {
        sf::Color white = sf::Color(sf::Color::White);        
        set_px_to_display(x, y, white);
    }
    return already_set;
}

bool Display::set_byte(int x, int y, uint8_t byte) {
    std::bitset<8> byte_to_set(byte);
    bool unset = false;
    for (int i = 0; i < 8; i++) {
        if (byte_to_set[7 - i]) {
            unset = unset || set_pixel(x + i, y);
        }
    }
    return unset;
}

void Display::clear_all_pixels() const {
    _render_window->clear();
    for (bool&& px : _px_data) {
        px = false;
    }
}

sf::RenderWindow* Display::get_render_window() const {
    return _render_window;
}
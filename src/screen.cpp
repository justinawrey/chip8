#include <SFML/Graphics.hpp>
#include "../inc/screen.h"

Screen::Screen(const int& x_res, const int& y_res, sf::RenderWindow* render_window) : 
    _px_data(std::vector<bool>(x_res * y_res, false)), _x_res(x_res), _y_res(y_res),
    _render_window(render_window) {}

Screen::~Screen() {
    delete _render_window;
}
    
/*************** PRIVATE FUNCTIONS *************************/

void Screen::set_px_to_screen(const int& x, const int& y, sf::Color& color) const {
    sf::Vector2u window_size = _render_window->getSize();
    double px_size_x = window_size.x / _x_res; 
    double px_size_y = window_size.y / _y_res;   
    sf::RectangleShape pixel(sf::Vector2f(px_size_x, px_size_y));
    pixel.setFillColor(color);
    pixel.setPosition(x * px_size_x, y * px_size_y);
    _render_window->draw(pixel);
}

/**************** PUBLIC FUNCTIONS *************************/
bool Screen::set_pixel(const int& x, const int& y) {
    int y_loc = (y - 1) < 0 ? 0 : y - 1;
    int px_loc = y_loc * _x_res + x;     
    bool already_set =_px_data[px_loc];
    _px_data[px_loc] = _px_data[px_loc] != true; // logical xor
    if (already_set) {
        sf::Color black = sf::Color(sf::Color::Black);
        set_px_to_screen(x, y, black);
    } else {
        sf::Color white = sf::Color(sf::Color::White);        
        set_px_to_screen(x, y, white);
    }
    return already_set;
}

void Screen::clear_all_pixels() const {
    _render_window->clear();
    for (bool&& px : _px_data) {
        px = false;
    }
}

sf::RenderWindow* Screen::get_render_window() const {
    return _render_window;
}
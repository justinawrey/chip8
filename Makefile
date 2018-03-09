# place in root

CC=g++
CPP_FLAGS=-std=c++11 -Wall
SFML_LIBS=-lsfml-graphics -lsfml-window -lsfml-system

SRC = $(wildcard src/*.cpp)
OBJ = $(patsubst src/%.cpp, obj/%.o, $(SRC))

all: $(OBJ)
	$(CC) $(CPP_FLAGS) $(OBJ) -o bin/chip8 $(SFML_LIBS) 

obj/%.o: src/%.cpp
	$(CC) $(CPP_FLAGS) -c $< -o $@

clean:	
	rm obj/*.o bin/chip8 

Link to website: https://lifesimulationer.netlify.app

This life simulation is my experiment with creating neural networks. Each organism has its own brain, in which input, internal, and output neurons are randomly generated to decide the organism's movement. 

Although this is an extremely simple simulation, this took a lot of work to create, as it is my first time creating a neural network. I spent a bunch of time learning about neural networks and applied that knowledge to create this project!


# Facts about the project
## Seasons
There are 4 seasons: Spring, Summer, Fall Winter.
- Spring: The food spawn rate is set to 10%, and it costs 1 hunger to move (default)
- Summer: The food spawn rate is 5%
- Fall: The food spawn rate is back to 10%
- Winter: The food spawn rate is 0%, and it costs 2 hunger points to move around

## Reproduction
Parents pass down DNA to their children. 

In this project, DNA is represented by a small set of hexadecimal genomes that code for specific neurons. Each organism has 10 genomes, meaning that each organism has 10 connections from one neuron to another. In the beginning, organisms are given random genomes; if the organism survives 10 ticks and has 5 hunger points, then it is able to reproduce. 

There is a 10% chance of a mutation occuring. A mutation simply means that one letter/number in the organism's genome is randomly changed. Mutations are relatively common in order to promote genetic diversity.

## Neurons
### Input Neurons
- Age: The amount of time (measured in ticks) an organism has existed for
- Rnd: A random number between 0 and 1
- Ble: Detects whether there is an organism on its left
- Bri: Detects whether there is an organism on its right
- Bup: Detects whether there is an organism above itself
- Bdo: Detects whether there is an organism below itself
- Lx: The x-position of the organism
- Ly: The y-position of the organism
- Hun: How hungry the orgnaism is
- Pdf: How many organisms are above itself
- Ple: How many organisms are to the left of itself
- Pri: How many organisms are to the right of itself

### Internal Neurons
- N0
- N1

These have no direct purpose- they exist merely to add complexity (another layer) to my neural network.

### Output Neurons
- MX: Encourages the organism to move left/right
- MY: Encourages the organism to move up/down
- MTF: Encourages the organism to move to the nearest food
- Kill: Encourages the organism to move to the nearest organism so that it can kill for food
- Mrv: Encourages the organism to move in the opposite direction
- MTG: Encourages the organism to move to the nearest organism

How movement works:
After the organism parses through its entire neural network, it moves to the most encouraged direction. For instance, if the organism is encouraged to move left more than any other direction, the organism moves one cell to the left.

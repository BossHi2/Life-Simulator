const inputNeurons = ["Age","Ble","Bri","Bup","Bdo","Lx","Ly", "Hun", "Rnd", "Pfd", "Ple", "Pri"]
const internalNeurons = ["N0", "N1"]
const outputNeurons = ["MX", "MY", "MTF", "Kill", "Mrv", "MTG"]
const possibleGenomes = "abcdef0123456789"
const seasons = ["Spring", "Summer", "Fall", "Winter"]

const grid = document.getElementById("grid")
var userScreenHeight = window.innerHeight
var userScreenWidth = window.innerWidth
const rows = Math.floor((userScreenHeight)/13)-4
const cols = Math.floor((userScreenWidth)/13)-4


const featureSection = document.getElementById("features")
const graphButton = document.getElementById("popGraph")
const displayStats = document.getElementById("traitList")

var graphData = []
var chart
var hasClicked = false
var secondsPassed = 0
var speciesColors = ['blue', 'orange', 'yellowgreen', 'violet', 'green', 'Chartreuse', 'Aqua', "Chocolate", "Aquamarine", "blueviolet", "brown", "cadetblue"]

var species = {} // speciesName: [aggression (+- .3), exploration (+- .3), population]

var idGenerator = 0
var organismsGrid = []

var foodSpawnRate = 10
var tickSpeed = 3

var seasonLength = [80,100,70,60]
var currSeason = 0
var energyToMove = 1





class Organism{
    //variables to track hunger and thirst to see when they die
    row
    col
    age
    LifeExpectancy //when reached lifeExpectancy, organism dies
    geneHex

    hunger
    reproductionRate
    reproductionTimer
    lookDirection = "" //a string, either: up, down, left, right

    geneBinary
    neurons =  new Map()

    Intervals
    numOfGenes

    traits = [0, 0]  //[0] = color ex: "rgb(120,44,236); [1] = strength (higher = more less killable)"

    stats = [0,0]   //[0] = strength    [1] = exploration

    id

    isInfected


    constructor(r, c, lE, gH, nG, repRate, i, isInf){
        this.age = 0
        this.row = r
        this.col = c
        this.lifeExpectancy = lE
        this.geneHex = gH + ""
        this.geneBinary = this.hexToBinary(this.geneHex)
        this.numOfGenes = nG
        this.reproductionRate = repRate
        this.reproductionTimer = repRate
        this.readGene()
        this.id = i

        this.hunger = 15

        this.isInfected = isInf

        if(this.isInfected){
            this.traits[0] = "green"
        } else{
            this.traits[0] = "blue"
        }
        
            
    }
    hexToBinary(hex) {
        return hex  
            .split('')
            .map(d => parseInt(d, 16).toString(2).padStart(4,'0'))
            .join('')
    }
    readGene(){
        for(var i = 0; i<this.geneBinary.length; i+= 32){
            var weightVal = new Int16Array([parseInt(this.geneBinary.substring(i+16, i+32))])[0]/10000
            var tempNeurons = []

            if(parseInt(this.geneBinary.substring(i, i+1)) == 0)
                tempNeurons[0] = new InputNeuron(inputNeurons[parseInt(this.geneBinary.substring(i+1, i+8), 2)%inputNeurons.length], this, weightVal)
            else
                tempNeurons[0] = new InternalNeuron(internalNeurons[parseInt(this.geneBinary.substring(i+1, i+8), 2)%internalNeurons.length])

            if(parseInt(this.geneBinary.substring(i + 8, i+9)) == 0){
                tempNeurons[1] = new OutputNeuron(outputNeurons[parseInt(this.geneBinary.substring(i+9,i+16), 2)%outputNeurons.length],this)
            }
                
            else
                tempNeurons[1] = new InternalNeuron(internalNeurons[parseInt(this.geneBinary.substring(i+9,i+16), 2)%internalNeurons.length])
            
            this.neurons.set(tempNeurons[0], tempNeurons[1])
        }


             

        
    }

    doAction(){
        this.age++
        this.hunger -= energyToMove
        this.reproductionTimer--

        if(this.isInfected){
            this.traits[0] = "green"

            this.infectOthers()
        }

        if(this.reproductionTimer <= 0 && this.hunger >= 5){
            var seeIfMutation = Math.floor(Math.random() * 10) + 1
            var newGeneHex = this.geneHex

            if(seeIfMutation == 5){
                var randIndex = Math.floor(Math.random() * (this.geneHex.length-2)) + 1
                newGeneHex = this.geneHex.substring(0, randIndex) + possibleGenomes[Math.floor(Math.random()*possibleGenomes.length)] + this.geneHex.substring(randIndex+1)
            }

            // Check if adjacent cells are empty (not Food and not Organism)
            if(organismsGrid[this.row] && organismsGrid[this.row][this.col-1] === null){
                organismsGrid[this.row][this.col-1] = new Organism(this.row,this.col-1,this.lifeExpectancy,newGeneHex, this.numOfGenes,this.reproductionRate, idGenerator, this.isInfected)
                idGenerator++
                this.reproductionTimer = this.reproductionRate
            } else if(organismsGrid[this.row] && organismsGrid[this.row][this.col+1] === null){
                organismsGrid[this.row][this.col+1] = new Organism(this.row,this.col+1,this.lifeExpectancy,newGeneHex, this.numOfGenes,this.reproductionRate, idGenerator, this.isInfected)
                idGenerator++
                this.reproductionTimer = this.reproductionRate
            } else if(organismsGrid[this.row+1] && organismsGrid[this.row+1][this.col] === null){
                organismsGrid[this.row+1][this.col] = new Organism(this.row+1,this.col,this.lifeExpectancy,newGeneHex, this.numOfGenes,this.reproductionRate, idGenerator, this.isInfected)
                idGenerator++
                this.reproductionTimer = this.reproductionRate
            } else if(organismsGrid[this.row-1] && organismsGrid[this.row-1][this.col] === null){
                organismsGrid[this.row-1][this.col] = new Organism(this.row-1,this.col,this.lifeExpectancy,newGeneHex, this.numOfGenes,this.reproductionRate, idGenerator, this.isInfected)
                idGenerator++
                this.reproductionTimer = this.reproductionRate
            }
        }
        
        if(this.age >= this.lifeExpectancy||this.hunger <= 0){
            organismsGrid[this.row][this.col] = null
            return true
        }
        for(const[key, value] of this.neurons){
            value.sum =0
            if(key instanceof InputNeuron)
                key.calculateData()
        }  

        for(const[key, value] of this.neurons){
            if(key instanceof InputNeuron){
                value.sum += key.data
            }
                
        } 
        for(const[key, value] of this.neurons){
            if(key instanceof InputNeuron){
                value.sum *= key.connectionWeight
            }
        } 
        for(const[key, value] of this.neurons){
            if(key instanceof InternalNeuron){
                value.sum += key.sum
            }
        }
        var movement = [0,0]    //[0] = encourage X; [1] = encourageY
        for(const[key, value] of this.neurons){
            if(value instanceof OutputNeuron){
                if(value.name == "Kill"){
                    this.stats[0] = 100
                    this.traits[1] = value.exportSum()
                } else if(value.name == "MTF"){
                    this.stats[1] = Math.abs(value.exportSum())/1
                } else if(value.name == "MX" || value.name == "MY" || value.name == "Mrv"){
                    this.stats[1] -= Math.abs(value.exportSum())/1
                }
                var tempArr = value.doSomething()
                
                
                if(tempArr[0] != 0  || tempArr[1] != 0){
                    movement[0] += tempArr[0]
                    movement[1] += tempArr[1]
                }

                if(tempArr[2] == true)
                    return true
                if(tempArr[3] == true)
                    return null
            }
        }
        
        if(Math.abs(movement[0]) > Math.abs(movement[1])){
            if(movement[0] > 0){
                if(organismsGrid[this.row] && organismsGrid[this.row][this.col+1] instanceof Food){
                    organismsGrid[this.row][this.col+1] = null
                    this.hunger += 5
                    if(this.isInfected)
                        this.hunger -= 4
                } else if(organismsGrid[this.row] && organismsGrid[this.row][this.col+1] instanceof Organism){
                    var otherOrganism = organismsGrid[this.row][this.col + 1]
                    if(otherOrganism != null && otherOrganism.traits[1] < this.traits[1]){
                        if(this.isInfected){
                            organismsGrid[this.row][this.col + 1].isInfected = true
                        }
                        
                        this.hunger += 20
                        if(this.isInfected)
                            this.hunger -= 19
                        clearInterval(this.Intervals)
                        this.col++
                        organismsGrid[this.row][this.col-1] = null
                        organismsGrid[this.row][this.col] = this
                    }
                } else if(organismsGrid[this.row] && organismsGrid[this.row][this.col+1] === null) {
                    this.move("right")
                }
                
            } else if(movement[0] < 0){
                if(organismsGrid[this.row] && organismsGrid[this.row][this.col-1] instanceof Food){
                    organismsGrid[this.row][this.col-1] = null
                    this.hunger += 5
                    if(this.isInfected)
                        this.hunger -= 4
                } else if(organismsGrid[this.row] && organismsGrid[this.row][this.col-1] instanceof Organism){
                    var otherOrganism = organismsGrid[this.row][this.col -1]
                    if(otherOrganism != null && otherOrganism.traits[1] < this.traits[1]){
                        if(this.isInfected){
                            organismsGrid[this.row][this.col -1].isInfected = true
                        }
                        
                        this.hunger += 20
                        if(this.isInfected)
                            this.hunger -= 19
                        clearInterval(this.Intervals)
                        this.col--
                        organismsGrid[this.row][this.col+1] = null
                        organismsGrid[this.row][this.col] = this
                    }
                } else if(organismsGrid[this.row] && organismsGrid[this.row][this.col-1] === null) {
                    this.move("left")
                }
                
            }
        } else if(Math.abs(movement[0]) < Math.abs(movement[1])){
            if(movement[1] > 0){
                if(organismsGrid[this.row+1] && organismsGrid[this.row+1][this.col] instanceof Food){
                    organismsGrid[this.row+1][this.col] = null
                    this.hunger += 5
                    if(this.isInfected)
                        this.hunger -= 4
                } else if(organismsGrid[this.row+1] && organismsGrid[this.row+1][this.col] instanceof Organism){
                    var otherOrganism = organismsGrid[this.row + 1][this.col]
                    if(otherOrganism != null && otherOrganism.traits[1] < this.traits[1]){
                        if(this.isInfected){
                            organismsGrid[this.row+1][this.col].isInfected = true
                        }
                        
                        this.hunger += 20
                        if(this.isInfected)
                            this.hunger -= 19
                        clearInterval(this.Intervals)
                        this.row++
                        organismsGrid[this.row-1][this.col] = null
                        organismsGrid[this.row][this.col] = this
                    }
                } else if(organismsGrid[this.row+1] && organismsGrid[this.row+1][this.col] === null) {
                    this.move("up")
                }
                
            } else if(movement[1] < 0){
                if(organismsGrid[this.row-1] && organismsGrid[this.row-1][this.col] instanceof Food){
                    organismsGrid[this.row-1][this.col] = null
                    this.hunger += 5
                    if(this.isInfected)
                        this.hunger -= 4
                } else if(organismsGrid[this.row-1] && organismsGrid[this.row-1][this.col] instanceof Organism){
                    var otherOrganism = organismsGrid[this.row - 1][this.col]
                    if(otherOrganism != null && otherOrganism.traits[1] < this.traits[1]){
                        if(this.isInfected){
                            organismsGrid[this.row-1][this.col].isInfected = true
                        }
                        
                        this.hunger += 20
                        if(this.isInfected)
                            this.hunger -= 19
                        clearInterval(this.Intervals)
                        this.row--
                        organismsGrid[this.row+1][this.col] = null
                        organismsGrid[this.row][this.col] = this
                    }
                } else if(organismsGrid[this.row-1] && organismsGrid[this.row-1][this.col] === null) {
                    this.move("down")
                }
                
            }
        } else if((movement[0] != 0 && movement[1] != 0) && (Math.abs(movement[0]) == Math.abs(movement[1]))){
            if(Math.round(Math.random()) == 1){
                if(Math.round(Math.random()) == 1){
                    if(organismsGrid[this.row+1] && organismsGrid[this.row+1][this.col] instanceof Food){
                        organismsGrid[this.row+1][this.col] = null
                        this.hunger += 5
                        if(this.isInfected)
                            this.hunger -= 4
                    }
                    if(organismsGrid[this.row+1] && organismsGrid[this.row+1][this.col] === null){
                        this.move("up")
                    }
                    
                } else{
                    if(organismsGrid[this.row-1] && organismsGrid[this.row-1][this.col] instanceof Food){
                        organismsGrid[this.row-1][this.col] = null
                        this.hunger += 5
                        if(this.isInfected)
                            this.hunger -= 4
                    }
                    if(organismsGrid[this.row-1] && organismsGrid[this.row-1][this.col] === null){
                        this.move("down")
                    }
                    
                }
            } else{
                if(Math.round(Math.random()) == 1){
                    if(organismsGrid[this.row] && organismsGrid[this.row][this.col+1] instanceof Food){
                        organismsGrid[this.row][this.col+1] = null
                        this.hunger += 5
                        if(this.isInfected)
                            this.hunger -= 4
                    }
                    if(organismsGrid[this.row] && organismsGrid[this.row][this.col+1] === null){
                        this.move("right")
                    }
                    
                } else{
                    if(organismsGrid[this.row] && organismsGrid[this.row][this.col-1] instanceof Food){
                        organismsGrid[this.row][this.col-1] = null
                        this.hunger += 5
                        if(this.isInfected)
                            this.hunger -= 4
                    }
                    if(organismsGrid[this.row] && organismsGrid[this.row][this.col-1] === null){
                        this.move("left")
                    }
                    
                }
            }
        }
        

        return false
    }

    move(dir){
        if(dir == "up"){
            if(this.isInfected && organismsGrid[this.row+1] && organismsGrid[this.row+1][this.col] instanceof Organism){
                organismsGrid[this.row+1][this.col].isInfected = true
            }
            this.row += 1
            this.hunger -= energyToMove
            this.lookDirection = "up"
            organismsGrid[this.row-1][this.col] = null
            organismsGrid[this.row][this.col] = this
        } else if(dir == "down"){
            if(this.isInfected && organismsGrid[this.row-1] && organismsGrid[this.row-1][this.col] instanceof Organism){
                organismsGrid[this.row-1][this.col].isInfected = true
            }
            this.row -= 1
            this.hunger -= energyToMove
            this.lookDirection = "down"
            organismsGrid[this.row+1][this.col] = null
            organismsGrid[this.row][this.col] = this
        } else if(dir == "left"){
            if(this.isInfected && organismsGrid[this.row] && organismsGrid[this.row][this.col-1] instanceof Organism){
                organismsGrid[this.row][this.col-1].isInfected = true
            }
            this.col -= 1
            this.hunger -= energyToMove
            this.lookDirection = "left"
            organismsGrid[this.row][this.col+1] = null
            organismsGrid[this.row][this.col] = this
        } else if(dir == "right"){
            if(this.isInfected && organismsGrid[this.row] && organismsGrid[this.row][this.col+1] instanceof Organism){
                organismsGrid[this.row][this.col+1].isInfected = true
            }
            this.col += 1
            this.hunger -= energyToMove
            this.lookDirection = "right"
            organismsGrid[this.row][this.col-1] = null
            organismsGrid[this.row][this.col] = this
        }
    }

    infectOthers(){
        if(organismsGrid[this.row] && organismsGrid[this.row][this.col+1] instanceof Organism){
            organismsGrid[this.row][this.col + 1].isInfected = true
        } if(organismsGrid[this.row] && organismsGrid[this.row][this.col-1] instanceof Organism){
            organismsGrid[this.row][this.col - 1].isInfected = true
        } if(organismsGrid[this.row+1] && organismsGrid[this.row+1][this.col] instanceof Organism){
            organismsGrid[this.row+1][this.col].isInfected = true
        } if(organismsGrid[this.row-1] && organismsGrid[this.row-1][this.col] instanceof Organism){
            organismsGrid[this.row-1][this.col].isInfected = true
        }
    }
}
class InternalNeuron{
    sum = 0
    name
    constructor(n){
        this.name = n
    }
}

class InputNeuron{
    name
    data //a number between 0 and 1
    OrganismRow
    OrganismCol
    connectionWeight
    Organism

    constructor(n, organism, weight){
        this.name = n
        this.OrganismRow = organism.row
        this.OrganismCol = organism.col
        this.connectionWeight = weight
        this.Organism = organism
        
        this.calculateData()
    }

    calculateData(){
        if(this.name == "Age")
            this.data = this.Organism.age/this.Organism.lifeExpectancy
        else if(this.name == "Ble"){
            // Check left cell
            if(organismsGrid[this.OrganismRow] && organismsGrid[this.OrganismRow][this.OrganismCol-1] instanceof Organism){
                this.data = 1 //there is an organism on the left
            } else {
                this.data = 0 //there is no organism on left side
            }
        } else if (this.name == "Bri"){
            // Check right cell
            if(organismsGrid[this.OrganismRow] && organismsGrid[this.OrganismRow][this.OrganismCol+1] instanceof Organism){
                this.data = 1 //there is an organism on the right
            } else {
                this.data = 0 //there is no organism on right side
            }
        } else if(this.name == "Bup"){
            // Check up cell
            if(organismsGrid[this.OrganismRow+1] && organismsGrid[this.OrganismRow+1][this.OrganismCol] instanceof Organism){
                this.data = 1 //there is an organism on the up
            } else {
                this.data = 0 //there is no organism on up
            }
        }  else if(this.name == "Bdo"){
            // Check down cell
            if(organismsGrid[this.OrganismRow-1] && organismsGrid[this.OrganismRow-1][this.OrganismCol] instanceof Organism){
                this.data = 1 //there is an organism on the down
            } else {
                this.data = 0 //there is no organism on down
            }
        } else if(this.name == "Lx"){
            this.data = this.OrganismCol/cols
        } else if(this.name == "Ly"){
            this.data = this.OrganismRow/rows
        } else if(this.name == "Hun"){
            this.data = (100-this.Organism.hunger)/100
        } else if(this.name == "Rnd"){
            this.data = Math.random()
        } else if(this.name == "Pfd"){
            var numOfOrganisms = 0
            for(var i = 1; i<6; i++){
                if(this.Organism.lookDirection == "up" && organismsGrid[this.Organism.row + i] && organismsGrid[this.Organism.row + i][this.Organism.col] instanceof Organism){
                    numOfOrganisms++
                } else if(this.Organism.lookDirection == "down" && organismsGrid[this.Organism.row - i] && organismsGrid[this.Organism.row - i][this.Organism.col] instanceof Organism){
                    numOfOrganisms++
                } else if(this.Organism.lookDirection == "right" && organismsGrid[this.Organism.row] && organismsGrid[this.Organism.row][this.Organism.col + i] instanceof Organism){
                    numOfOrganisms++
                } else if(this.Organism.lookDirection == "left" && organismsGrid[this.Organism.row] && organismsGrid[this.Organism.row][this.Organism.col - i] instanceof Organism){
                    numOfOrganisms++
                }
            }

            this.data = numOfOrganisms/5
        } else if(this.name == "Ple"){
            var numOfOrganisms = 0
            for(var i = 1; i<6; i++){
                if(this.Organism.lookDirection == "left" && organismsGrid[this.Organism.row] && organismsGrid[this.Organism.row][this.Organism.col - i] instanceof Organism){
                    numOfOrganisms++
                }
            }
            this.data = numOfOrganisms/5
        } else if(this.name == "Pri"){
            var numOfOrganisms = 0
            for(var i = 1; i<6; i++){
                if(this.Organism.lookDirection == "right" && organismsGrid[this.Organism.row] && organismsGrid[this.Organism.row][this.Organism.col + i] instanceof Organism){
                    numOfOrganisms++
                }
            }

            this.data = numOfOrganisms/5
        }
    }
}

class OutputNeuron{
    name
    sum = 0
    organism
    constructor(n, org){
        this.name = n
        this.organism = org
    }

    exportSum(){
        return Math.tanh(this.sum)
    }

    doSomething(){
        var movementEncourage = [0,0, false, false] //[0] = encourage X; [1] = encourage Y; [2] = didKill; [3] = didSleep;
        if(this.name == "MX"){
            if(organismsGrid[this.organism.row] && this.exportSum() > 0 && organismsGrid[this.organism.row][this.organism.col+1] === null)    //if it's positive, move right. negative = move left
            {
                movementEncourage[0] += this.exportSum() + 1
            } else if(organismsGrid[this.organism.row] && this.exportSum() <= 0 && organismsGrid[this.organism.row][this.organism.col-1] === null){
                movementEncourage[0] -= this.exportSum() - 1
            }
        }else if(this.name == "MY"){
            if(organismsGrid[this.organism.row+1] && this.exportSum() > 0 && organismsGrid[this.organism.row+1][this.organism.col] === null)    //if it's positive, move up. negative = move down
            {
                movementEncourage[1] += this.exportSum() + 1
            } else if(organismsGrid[this.organism.row-1] && this.exportSum() <= 0 && organismsGrid[this.organism.row-1][this.organism.col] === null){
                movementEncourage[1] -= this.exportSum() - 1
            }
        } else if(this.name == "MTF"){
            var tempArray = this.foodNearby(this.exportSum() * 3 + 1)
            if(tempArray[0]){
                if(tempArray[1] != 0)
                    movementEncourage[1] += tempArray[1] * 5
                else if(tempArray[2] != 0)
                    movementEncourage[0] += tempArray[2] * 5
            }
        } else if(this.name == "Kill"){
            if(organismsGrid[this.organism.row] && organismsGrid[this.organism.row][this.organism.col+1] instanceof Organism){
                var otherOrganism = organismsGrid[this.organism.row][this.organism.col + 1]
                if(otherOrganism != null && otherOrganism.traits[1] < this.organism.traits[1]){
                    if(this.organism.isInfected){
                        organismsGrid[this.organism.row][this.organism.col+1].isInfected = true
                    }
                    
                    this.organism.hunger += 20
                    if(this.organism.isInfected)
                        this.organism.hunger -= 19
                    clearInterval(this.organism.Intervals)
                    this.organism.col++
                    organismsGrid[this.organism.row][this.organism.col -1] = null
                    organismsGrid[this.organism.row][this.organism.col] = this.organism
                    movementEncourage[0] += this.exportSum() * 5
                    movementEncourage[1] /= 5
                    movementEncourage[2] = true
                }
                
                
            } else if(organismsGrid[this.organism.row] && organismsGrid[this.organism.row][this.organism.col-1] instanceof Organism){
                var otherOrganism = organismsGrid[this.organism.row][this.organism.col - 1]
                if(otherOrganism.traits[1] < this.organism.traits[1]){
                    if(this.organism.isInfected){
                        organismsGrid[this.organism.row][this.organism.col-1].isInfected = true
                    }
                    
                    this.organism.hunger += 20
                    this.organism.hunger += 20
                    if(this.organism.isInfected)
                        this.organism.hunger -= 19
                    clearInterval(this.organism.Intervals)
                    this.organism.col--
                    organismsGrid[this.organism.row][this.organism.col +1] = null
                    organismsGrid[this.organism.row][this.organism.col] = this.organism
                    movementEncourage[0] -= this.exportSum() * 5
                    movementEncourage[1] /=5
                    movementEncourage[2] = true
                }
                
                
            } else if(organismsGrid[this.organism.row+1] && organismsGrid[this.organism.row+1][this.organism.col] instanceof Organism){
                var otherOrganism = organismsGrid[this.organism.row+1][this.organism.col]
                if(otherOrganism.traits[1] < this.organism.traits[1]){
                    if(this.organism.isInfected){
                        organismsGrid[this.organism.row+1][this.organism.col].isInfected = true
                    }
                    
                    this.organism.hunger += 20
                    this.organism.hunger += 20
                    if(this.organism.isInfected)
                        this.organism.hunger -= 19
                    clearInterval(this.organism.Intervals)
                    this.organism.row++
                    organismsGrid[this.organism.row-1][this.organism.col] = null
                    organismsGrid[this.organism.row][this.organism.col] = this.organism
                    movementEncourage[0] /= 5
                    movementEncourage[1] += this.exportSum() * 5
                    movementEncourage[2] = true
                }
                
            } else if(organismsGrid[this.organism.row-1] && organismsGrid[this.organism.row-1][this.organism.col] instanceof Organism){
                var otherOrganism = organismsGrid[this.organism.row-1][this.organism.col]
                if(otherOrganism instanceof Organism && otherOrganism.traits[1] < this.organism.traits[1]){
                    if(this.organism.isInfected){
                        organismsGrid[this.organism.row-1][this.organism.col].isInfected = true
                    }
                        
                    
                    this.organism.hunger += 20
                    this.organism.hunger += 20
                    if(this.organism.isInfected)
                        this.organism.hunger -= 19
                    clearInterval(this.organism.Intervals)
                    
                    this.organism.row--
                    organismsGrid[this.organism.row+1][this.organism.col] = null
                    organismsGrid[this.organism.row][this.organism.col] = this.organism
                    movementEncourage[0] /= 5
                    movementEncourage[1] -= this.exportSum() * 5
                    movementEncourage[2] = true
                }
                
            }
        } else if(this.name == "Mrv"){
            if(this.organism.lookDirection == "up"){
                movementEncourage[1] += this.exportSum() * 2 +1
            } else if(this.organism.lookDirection == "down"){
                movementEncourage[1] -= this.exportSum() * 2 -1
             }else if(this.organism.lookDirection == "left"){
                movementEncourage[0] -= this.exportSum() * 2 -1
            } else if(this.organism.lookDirection == "right"){
                movementEncourage[0] += this.exportSum() * 2 +1
            } 
        } else if(this.name == "MTG"){
            var tempArray = this.organismNearby(this.exportSum() * 3 + 1)
            if(tempArray[0]){
                if(tempArray[1] != 0)
                    movementEncourage[1] += tempArray[1] * 2
                else if(tempArray[2] != 0)
                    movementEncourage[0] += tempArray[2] * 2
            }
        }

        if(movementEncourage[0] == undefined || movementEncourage[0] == null)
            console.log("woah")
        return movementEncourage
    }

    foodNearby(radius){
        for(var i = 1; i<=radius; i++){
            if(organismsGrid[this.organism.row + i] && organismsGrid[this.organism.row + i][this.organism.col] instanceof Food){
                return [true, i, 0]
            } else if(organismsGrid[this.organism.row - i] && organismsGrid[this.organism.row - i][this.organism.col] instanceof Food){
                return [true, -i, 0]
            } else if(organismsGrid[this.organism.row] && organismsGrid[this.organism.row][this.organism.col + i] instanceof Food){
                return [true, 0, i]
            }  else if(organismsGrid[this.organism.row] && organismsGrid[this.organism.row][this.organism.col - i] instanceof Food){
                return [true, 0, -i]
            }
        }
        return [false, 0, 0]
        
    }

    organismNearby(radius){
        for(var i = 1; i<=radius; i++){
            if(organismsGrid[this.organism.row + i] && organismsGrid[this.organism.row + i][this.organism.col] instanceof Organism){
                return [true, i, 0]
            } else if(organismsGrid[this.organism.row - i] && organismsGrid[this.organism.row - i][this.organism.col] instanceof Organism){
                return [true, -i, 0]
            } else if(organismsGrid[this.organism.row] && organismsGrid[this.organism.row][this.organism.col + i] instanceof Organism){
                return [true, 0, i]
            }  else if(organismsGrid[this.organism.row] && organismsGrid[this.organism.row][this.organism.col - i] instanceof Organism){
                return [true, 0, -i]
            }
        }
        return [false, 0, 0]
        
    }
}

class Food{
    decay
    constructor(decayTimer){
        this.decay = decayTimer
    }

    changeTimer(){
        this.decay -= 1
    }
}

function drawGraph(){
    if(hasClicked == false){
        const canvas = document.createElement("canvas")
        canvas.style.width = "300"
        canvas.style.height = "400"
        canvas.id = "chart"
        featureSection.appendChild(canvas)


        
        chart = new Chart(canvas, {
            type: "scatter",
            data: {
                datasets: [{
                    label: "Population",
                    data: graphData,
                    backgroundColor: 'rgb(255, 255, 255)'
                }]
            },
            options: {
                legend: {display: false},
                scales: {
                    x: {
                        type: 'linear',
                        position: 'bottom',
                        title: {
                            display: true,
                            text: 'Seconds'
                        },
                    },
                    y:{
                        type: 'linear',
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Population'
                        }
                    },
                },
                elements: {
                    point: {
                        radius: 8,
                    }
                },
            }
        })

        hasClicked = true
    } else{
        document.getElementById("chart").remove()
        hasClicked = false
    }
    
}



function initiateAction(){
    secondsPassed++
    if(secondsPassed % seasonLength[currSeason] == 0){
        currSeason++
        if(currSeason == 4)
            currSeason = 0
        document.getElementById("seasonLabel").innerHTML = "Season: " + seasons[currSeason]
        if(seasons[currSeason] == "Spring"){
            foodSpawnRate = 10
            energyToMove = 1
        } else if(seasons[currSeason] == "Summer"){
            foodSpawnRate = 5
            energyToMove = 2
        } else if(seasons[currSeason] == "Fall"){
            foodSpawnRate = 10
            energyToMove = 1
        } else if(seasons[currSeason] == "Winter"){
            foodSpawnRate = 0
            energyToMove = 3
        }
    }

    

   
    var numOfOrganisms = 0
    for(var r = 0; r<rows; r++){
        for(var c = 0; c<cols; c++){
            
            if(organismsGrid[r][c] != null && organismsGrid[r][c] instanceof Organism){
                numOfOrganisms++

                organismsGrid[r][c].doAction()
            }
                
        }
    }
    for(let r = 0; r<rows; r++){
        for(let c = 0; c<cols; c++){
            if(organismsGrid[r][c] == null){
                var randNum = Math.floor(Math.random()*1000) + 1
                if(randNum <=foodSpawnRate){
                    organismsGrid[r][c] = new Food(100)
                }
            }
            if(organismsGrid[r][c] instanceof Food){
                organismsGrid[r][c].changeTimer()
                if(organismsGrid[r][c].decay <= 0){
                    organismsGrid[r][c] = null
                }
            }
            
        }
    }
    
    for(var r = 0; r<rows; r++){
        for(var c = 0; c<cols; c++){
            if(organismsGrid[r][c] != null){
                if(organismsGrid[r][c] instanceof Organism){
                    document.getElementById(r + "-" + c).classList.add("cellAlive")
                    if(organismsGrid[r][c].isInfected)
                        document.getElementById(r + "-" + c).classList.add("cellInfected")
                } else if(organismsGrid[r][c] instanceof Food){
                    document.getElementById(r + "-" + c).classList.add("cellFood")
                }
            } else{
                document.getElementById(r + "-" + c).className = ""
            }
        }
        
    }
    
    var tempJSON = {x: secondsPassed, y:numOfOrganisms}
    graphData.push(tempJSON)
    if(document.getElementById("chart") != null)
        chart.update()

    seeStats()
    

        Object.keys(species).forEach((key) => {
        let element = document.getElementById(key)
        if(element){
            element.innerHTML = "strength: " + Math.round(species[key][0] * 1000)/1000 + 
                              " | exploration: " + Math.round(species[key][1] * 1000)/1000 + 
                              " | population: " + species[key][2]
        } else {
            var list = document.createElement("li")
            list.id = key
            list.innerHTML = "strength: " + Math.round(species[key][0] * 1000)/1000 + 
                           " | exploration: " + Math.round(species[key][1] * 1000)/1000 + 
                           " | population: " + species[key][2]
            displayStats.appendChild(list)
        }
    })
    
}

function printAllNeuralNetworks(){
    console.log("printallneuralnetworks method called")
}

function seeStats(){
    

    Object.keys(species).forEach((key) => {
        species[key][2] = 0
    })
    
    for(var r = 0; r<organismsGrid.length; r++){
        for(var c = 0; c<organismsGrid[r].length; c++){
            if(organismsGrid[r][c] != null && organismsGrid[r][c] instanceof Organism){
                let found = false
                let organism = organismsGrid[r][c]
                
                for(let key in species){
                    let arr = species[key]
                    if((organism.stats[0] < (arr[0] + .5)) && 
                       (organism.stats[0] > (arr[0] - .5)) && 
                       (organism.stats[1] < (arr[1] + .5)) && 
                       (organism.stats[1] > (arr[1] - .5))){
                        species[key][2]++
                        found = true
                        break
                    }
                }
                
                if(!found){
                    let newKey = Object.keys(species).length + 1 + ""
                    species[newKey] = [organism.stats[0], organism.stats[1], 1]
                }
            }
        }
    }
    
    let extinctSpecies = []
    Object.keys(species).forEach((key) => {
        if(species[key][2] == 0){
            extinctSpecies.push(key)
            let element = document.getElementById(key)
            if(element) element.remove()
        }
    })
    
    extinctSpecies.forEach(key => {
        delete species[key]
    })

    
}


var intervalid = null

function start(){
    grid.style.gridTemplateColumns = "repeat(" + cols + ", 12px)"
    grid.style.gridTemplateRows = "repeat(" + rows + ", 12px)"
    for(let r = 0; r<rows; r++){
        organismsGrid[r] = []
        for(let c = 0; c<cols; c++){
            organismsGrid[r][c] = null
            const cell = document.createElement("div")
            cell.className = "cell"
            cell.id = r + "-" + c
            

            var randNum = Math.floor(Math.random()*20) + 1
            if(randNum == 5){
                organismsGrid[r][c] = new Food(100)
                cell.classList.add("cellFood")
            }
            grid.appendChild(cell)
        }
        
    }


    var numOfGenesForOrganism = 10
    for(let i = 0; i<500; i++){
        var randomGenome = ""
        for(let r = 0; r<numOfGenesForOrganism*8; r++){
            randomGenome += possibleGenomes.charAt(Math.floor(Math.random() * possibleGenomes.length))
        }
        var r = Math.floor(Math.random() * (rows))
        var c = Math.floor(Math.random() * (cols))
        while(document.getElementById(r + "-" + c).classList.contains("cellAlive")){
            r = Math.floor(Math.random() * (rows))
            c = Math.floor(Math.random() * (cols))
        }

        var x = new Organism(r, c, 100, randomGenome, numOfGenesForOrganism, 10, idGenerator, false)
        organismsGrid[r][c] = x
        idGenerator++
    }

    seeStats()
    


    intervalid = setInterval(initiateAction, 1000/tickSpeed)
}

function updateValues(){
    tickSpeed = document.getElementById("tickSpeed").value
    clearInterval(intervalid)
    intervalid = setInterval(initiateAction, 1000/tickSpeed)
}

function spreadVirus(){
    var r = Math.floor(Math.random() * (rows))
    var c = Math.floor(Math.random() * (cols))
    while(!(organismsGrid[r][c] instanceof Organism)){
        r = Math.floor(Math.random() * (rows))
        c = Math.floor(Math.random() * (cols))
    }
    organismsGrid[r][c].isInfected = true
}

start()

function print(){
    console.log(organismsGrid)
}
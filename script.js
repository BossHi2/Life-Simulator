const inputNeurons = ["Age","Ble","Bri","Bup","Bdo","Lx","Ly", "Hun", "Rnd", "Pfd", "Ple", "Pri"]
const internalNeurons = ["N0", "N1"]
const outputNeurons = ["MX", "MY", "MTF", "Kill", "Mrv"]
const possibleGenomes = "abcdef0123456789"

const grid = document.getElementById("grid")
var userScreenHeight = window.innerHeight
var userScreenWidth = window.innerWidth
const rows = Math.floor((userScreenHeight)/13)-3
const cols = Math.floor((userScreenWidth)/13)


const featureSection = document.getElementById("features")
const graphButton = document.getElementById("popGraph")
const displayStats = document.getElementById("traitList")

var graphData = []
var chart
var hasClicked = false
var secondsPassed = 0
var speciesColors = ['blue', 'orange', 'yellowgreen', 'violet', 'green', 'Chartreuse', 'Aqua', "Chocolate", "Aquamarine", "blueviolet", "brown", "cadetblue"]

var organisms = []
var species = {} // speciesName: [aggression (+- .3), exploration (+- .3), population]

var idGenerator = 0





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


    constructor(r, c, lE, gH, nG, repRate, t, i){
        this.age = 0
        this.row = r
        this.col = c
        this.lifeExpectancy = lE
        this.geneHex = gH + ""
        this.geneBinary = this.hexToBinary(this.geneHex)
        this.hunger = 20
        this.numOfGenes = nG
        this.reproductionRate = repRate
        this.reproductionTimer = repRate
        document.getElementById(this.row + "-" + this.col).classList.add("cellAlive")
        this.readGene()
        this.id = i


        this.traits[0] = t[0]

        document.getElementById(this.row + "-" + this.col).style.backgroundColor = this.traits[0]
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

            if(parseInt(this.geneBinary.substring(i + 8, i+9)) == 0)
                tempNeurons[1] = new OutputNeuron(outputNeurons[parseInt(this.geneBinary.substring(i+9,i+16), 2)%outputNeurons.length],this)
            else
                tempNeurons[1] = new InternalNeuron(internalNeurons[parseInt(this.geneBinary.substring(i+9,i+16), 2)%internalNeurons.length])
            
            this.neurons.set(tempNeurons[0], tempNeurons[1])
        }


             

        
    }

    doAction(){
        
        if(this.age >= this.lifeExpectancy||this.hunger <= 0){
            //clearInterval(this.Intervals)
            document.getElementById(this.row + "-" + this.col).classList.remove("cellAlive")
            document.getElementById(this.row + "-" + this.col).style.backgroundColor = "white"
            for(var i = 0; i<organisms.length; i++){
                var val = organisms[i]
                if(val.id == this.id){
                    organisms.splice(i, 1)
                    break;
                }
            }
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
                    this.stats[0] = Math.abs(value.exportSum())/1
                    this.traits[1] = Math.abs(value.exportSum())/1
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
            }
        }
        if(Math.abs(movement[0]) > Math.abs(movement[1])){
            if(movement[0] > 0){
                if(document.getElementById(this.row + "-" + (this.col+1)) != null && document.getElementById(this.row + "-" + (this.col+1)).classList.contains("cellFood")){
                    document.getElementById(this.row + "-" + (this.col+1)).classList.remove("cellFood")
                    this.hunger += 5
                }
                if(document.getElementById(this.row + "-" + (this.col+1)) != null && !document.getElementById(this.row + "-" + (this.col+1)).classList.contains("cellAlive")){
                    document.getElementById(this.row + "-" + this.col).style.backgroundColor = "white"
                    document.getElementById(this.row + "-" + this.col).classList.remove("cellAlive")
                    document.getElementById(this.row + "-" + (this.col+1)).classList.add("cellAlive")
                    document.getElementById(this.row + "-" + (this.col+1)).style.backgroundColor = this.traits[0]
                    this.col += 1
                    this.lookDirection = "right"
                }
                
            } else if(movement[0] < 0){
                if(document.getElementById(this.row + "-" + (this.col-1)).classList.contains("cellFood")){
                    document.getElementById(this.row + "-" + (this.col-1)).classList.remove("cellFood")
                    this.hunger += 5
                }
                if(!document.getElementById(this.row + "-" + (this.col-1)).classList.contains("cellAlive")){
                    document.getElementById(this.row + "-" + this.col).style.backgroundColor = "white"
                    document.getElementById(this.row + "-" + this.col).classList.remove("cellAlive")
                    document.getElementById(this.row + "-" + (this.col-1)).classList.add("cellAlive")
                    document.getElementById(this.row + "-" + (this.col-1)).style.backgroundColor = this.traits[0]
                    this.col -= 1
                    this.lookDirection = "left"
                }
                
            }
        } else if(Math.abs(movement[0]) < Math.abs(movement[1])){
            if(movement[1] > 0){
                if(document.getElementById((this.row+1) + "-" + this.col) != null && document.getElementById((this.row+1) + "-" + this.col).classList.contains("cellFood")){
                    document.getElementById((this.row+1) + "-" + this.col).classList.remove("cellFood")
                    this.hunger += 5
                }
                if(document.getElementById((this.row+1) + "-" + this.col) != null && !document.getElementById((this.row+1) + "-" + this.col).classList.contains("cellAlive")){
                    document.getElementById(this.row + "-" + this.col).style.backgroundColor = "white"
                    document.getElementById(this.row + "-" + this.col).classList.remove("cellAlive")
                    document.getElementById((this.row+1) + "-" + this.col).classList.add("cellAlive")
                    document.getElementById((this.row+1) + "-" + this.col).style.backgroundColor = this.traits[0]
                    this.row += 1
                    this.lookDirection = "up"
                }
                
            } else if(movement[1] < 0){
                if(document.getElementById((this.row-1) + "-" + this.col).classList.contains("cellFood")){
                    document.getElementById((this.row-1) + "-" + this.col).classList.remove("cellFood")
                    this.hunger += 5
                }
                if(!document.getElementById((this.row-1) + "-" + this.col).classList.contains("cellAlive")){
                    document.getElementById(this.row + "-" + this.col).style.backgroundColor = "white"
                    document.getElementById(this.row + "-" + this.col).classList.remove("cellAlive")
                    document.getElementById((this.row-1) + "-" + this.col).classList.add("cellAlive")
                    document.getElementById((this.row-1) + "-" + this.col).style.backgroundColor = this.traits[0]
                    this.row -= 1
                    this.lookDirection = "down"
                }
                
            }
        } else if((movement[0] != 0 && movement[1] != 0) && (Math.abs(movement[0]) == Math.abs(movement[1]))){
            if(Math.round(Math.random()) == 1){
                if(Math.round(Math.random()) == 1){
                    if(document.getElementById((this.row+1) + "-" + this.col) != null ){
                        if(document.getElementById((this.row+1) + "-" + this.col).classList.contains("cellFood")){
                            document.getElementById((this.row+1) + "-" + this.col).classList.remove("cellFood")
                            this.hunger += 5
                        }
                        if(!document.getElementById((this.row+1) + "-" + this.col).classList.contains("cellAlive")){
                            document.getElementById(this.row + "-" + this.col).style.backgroundColor = "white"
                            document.getElementById(this.row + "-" + this.col).classList.remove("cellAlive")
                            document.getElementById((this.row+1) + "-" + this.col).classList.add("cellAlive")
                            document.getElementById((this.row+1) + "-" + this.col).style.backgroundColor = this.traits[0]
                            this.row += 1
                            this.lookDirection = "up"
                        }
                        
                    }
                    
                } else{
                    if(document.getElementById((this.row-1) + "-" + this.col) != null){
                        if(document.getElementById((this.row-1) + "-" + this.col).classList.contains("cellFood")){
                            document.getElementById((this.row-1) + "-" + this.col).classList.remove("cellFood")
                            this.hunger += 5
                        }
                        if(!document.getElementById((this.row-1) + "-" + this.col).classList.contains("cellAlive")){
                            document.getElementById(this.row + "-" + this.col).style.backgroundColor = "white"
                            document.getElementById(this.row + "-" + this.col).classList.remove("cellAlive")
                            document.getElementById((this.row-1) + "-" + this.col).classList.add("cellAlive")
                            document.getElementById((this.row-1) + "-" + this.col).style.backgroundColor = this.traits[0]
                            this.row -= 1
                            this.lookDirection = "down"
                        }
                        
                    }
                    
                }
            } else{
                if(Math.round(Math.random()) == 1){
                    if(document.getElementById(this.row + "-" + (this.col+1))!= null){
                        if(document.getElementById(this.row + "-" + (this.col+1)).classList.contains("cellFood")){
                            document.getElementById(this.row + "-" + (this.col+1)).classList.remove("cellFood")
                            this.hunger += 5
                        }
                        if(!document.getElementById(this.row + "-" + (this.col+1)).classList.contains("cellAlive")){
                            document.getElementById(this.row + "-" + this.col).style.backgroundColor = "white"
                            document.getElementById(this.row + "-" + this.col).classList.remove("cellAlive")
                            document.getElementById(this.row + "-" + (this.col+1)).classList.add("cellAlive")
                            document.getElementById(this.row + "-" + (this.col+1)).style.backgroundColor = this.traits[0]
                            this.col += 1
                            this.lookDirection = "right"
                        }
                        
                    }
                    
                } else{
                    if(document.getElementById(this.row + "-" + (this.col-1)) != null){
                        if(document.getElementById(this.row + "-" + (this.col-1)).classList.contains("cellFood")){
                            document.getElementById(this.row + "-" + (this.col-1)).classList.remove("cellFood")
                            this.hunger += 5
                        }
                        if(!document.getElementById(this.row + "-" + (this.col-1)).classList.contains("cellAlive")){
                            document.getElementById(this.row + "-" + this.col).style.backgroundColor = "white"
                            document.getElementById(this.row + "-" + this.col).classList.remove("cellAlive")
                            document.getElementById(this.row + "-" + (this.col-1)).classList.add("cellAlive")
                            document.getElementById(this.row + "-" + (this.col-1)).style.backgroundColor = this.traits[0]
                            this.col -= 1
                            this.lookDirection = "left"
                        }
                        
                    }
                    
                }
            }
        }
        

        return false
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
            if(document.getElementById(this.OrganismRow + "-" + (this.OrganismCol-1)) != null && document.getElementById(this.OrganismRow + "-" + (this.OrganismCol-1)).classList.contains("cellAlive")){
                this.data = 1 //there is an organism on the left
            } else if(document.getElementById(this.OrganismRow + "-" + (this.OrganismCol-1)) != null){
                this.data = 0 //there is no organism on left side
            } else{
                this.data = 1
            }
        } else if (this.name == "Bri"){
            if(document.getElementById(this.OrganismRow + "-" + (this.OrganismCol+1)) != null && document.getElementById(this.OrganismRow + "-" + (this.OrganismCol+1)).classList.contains("cellAlive")){
                this.data = 1 //there is an organism on the right
            } else if (document.getElementById(this.OrganismRow + "-" + (this.OrganismCol+1)) != null){
                this.data = 0 //there is no organism on right side
            } else{
                this.data = 1
            }
        } else if(this.name == "Bup"){
            if(document.getElementById((this.OrganismRow+1) + "-" + this.OrganismCol) != null && document.getElementById((this.OrganismRow+1) + "-" + this.OrganismCol).classList.contains("cellAlive")){
                this.data = 1 //there is an organism on the up
            } else if(document.getElementById((this.OrganismRow+1) != null)){
                this.data = 0 //there is no organism on up
            } else{
                this.data = 1
            }
        }  else if(this.name == "Bdo"){
            if(document.getElementById((this.OrganismRow-1) + "-" + this.OrganismCol) != null && document.getElementById((this.OrganismRow-1) + "-" + this.OrganismCol).classList.contains("cellAlive")){
                this.data = 1 //there is an organism on the down
            } else if(document.getElementById((this.OrganismRow-1) != null)){
                this.data = 0 //there is no organism on down
            } else{
                this.data = 1
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
                if(this.Organism.lookDirection == "up" && document.getElementById((this.Organism.row + i) + "-" + this.Organism.col) != null && document.getElementById((this.Organism.row + i) + "-" + this.Organism.col).classList.contains("cellAlive")){
                    numOfOrganisms++
                } else if(this.Organism.lookDirection == "down" && document.getElementById((this.Organism.row - i) + "-" + this.Organism.col) != null && document.getElementById((this.Organism.row - i) + "-" + this.Organism.col).classList.contains("cellAlive")){
                    numOfOrganisms++
                } else if(this.Organism.lookDirection == "right" && document.getElementById(this.Organism.row + "-" + (this.Organism.col+i)) != null && document.getElementById(this.Organism.row + "-" + (this.Organism.col+i)).classList.contains("cellAlive")){
                    numOfOrganisms++
                } else if(this.Organism.lookDirection == "left" && document.getElementById(this.Organism.row + "-" + (this.Organism.col-i)) != null && document.getElementById(this.Organism.row + "-" + (this.Organism.col-i)).classList.contains("cellAlive")){
                    numOfOrganisms++
                }
            }

            this.data = numOfOrganisms/5
        } else if(this.name == "Ple"){
            var numOfOrganisms = 0
            for(var i = 1; i<6; i++){
                if(this.Organism.lookDirection == "left" && document.getElementById(this.Organism.row + "-" + (this.Organism.col-i)) != null && document.getElementById(this.Organism.row + "-" + (this.Organism.col-i)).classList.contains("cellAlive")){
                    numOfOrganisms++
                }
            }
            this.data = numOfOrganisms/5
        } else if(this.name == "Pri"){
            var numOfOrganisms = 0
            for(var i = 1; i<6; i++){
                if(this.Organism.lookDirection == "right" && document.getElementById(this.Organism.row + "-" + (this.Organism.col+i)) != null && document.getElementById(this.Organism.row + "-" + (this.Organism.col+i)).classList.contains("cellAlive")){
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
        var movementEncourage = [0,0, false] //[0] = encourage X; [1] = encourage Y; [2] = didKill
        if(this.name == "MX"){
            
            if(document.getElementById(this.organism.row + "-" + (this.organism.col+1)) != null && this.exportSum() > 0 && !document.getElementById(this.organism.row + "-" + (this.organism.col+1)).classList.contains("cellAlive"))    //if it's positive, move right. negative = move left
            {
                movementEncourage[0] += this.exportSum() + 1
            } else if(document.getElementById(this.organism.row + "-" + (this.organism.col-1)) != null && this.exportSum() <= 0 && !document.getElementById(this.organism.row + "-" + (this.organism.col-1)).classList.contains("cellAlive")){
                movementEncourage[0] -= this.exportSum() - 1
            }
        }else if(this.name == "MY"){
            if(document.getElementById((this.organism.row+1) + "-" + this.organism.col) != null && this.exportSum() > 0 && !document.getElementById((this.organism.row+1) + "-" + this.organism.col).classList.contains("cellAlive"))    //if it's positive, move up. negative = move down
            {
                movementEncourage[1] += this.exportSum() + 1
            } else if(document.getElementById((this.organism.row-1) + "-" + this.organism.col) != null && this.exportSum() <= 0 && !document.getElementById((this.organism.row-1) + "-" + this.organism.col).classList.contains("cellAlive")){
                movementEncourage[1] -= this.exportSum() - 1
            }
        } else if(this.name == "MTF"){
            var tempArray = this.foodNearby(this.exportSum() * 3 + 1)
            if(tempArray[0]){
                if(tempArray[1] != 0)
                    movementEncourage[1] += tempArray[1] * 2
                else if(tempArray[2] != 0)
                    movementEncourage[0] += tempArray[2] * 2
            }
        } else if(this.name == "Kill"){
            if(document.getElementById(this.organism.row + "-" + (this.organism.col+1)) != null && document.getElementById(this.organism.row + "-" + (this.organism.col+1)).classList.contains("cellAlive")){
                var otherOrganism
                var iVal
                for(var i = 0; i<organisms.length; i++){
                    var val = organisms[i]
                    if(val.row == this.organism.row && (val.col) == (this.organism.col + 1)){
                        otherOrganism = organisms[i]
                        iVal = i
                        break;
                    }
                }
                if(otherOrganism.traits[1] < this.organism.traits[1]){
                    document.getElementById(this.organism.row + "-" + (this.organism.col+1)).style.backgroundColor = this.organism.traits[0]
                    document.getElementById(this.organism.row + "-" + this.organism.col).style.backgroundColor = "white"
                    document.getElementById(this.organism.row + "-" + this.organism.col).classList.remove("cellAlive")
                    
                    this.organism.hunger += 10
                    clearInterval(this.organism.Intervals)
                    organisms.splice(iVal, 1)
                    this.organism.col++
                    movementEncourage[2] = true
                }
                
                
            } else if(document.getElementById(this.organism.row + "-" + (this.organism.col-1)) != null && document.getElementById(this.organism.row + "-" + (this.organism.col-1)).classList.contains("cellAlive")){
                var otherOrganism
                var iVal
                for(var i = 0; i<organisms.length; i++){
                    var val = organisms[i]
                    if(val.row == this.organism.row && val.col == (this.organism.col - 1)){
                        otherOrganism = organisms[i]
                        iVal = i
                        break;
                    }
                }
                if(otherOrganism.traits[1] < this.organism.traits[1]){
                    document.getElementById(this.organism.row + "-" + (this.organism.col-1)).style.backgroundColor = this.organism.traits[0]
                    document.getElementById(this.organism.row + "-" + this.organism.col).style.backgroundColor = "white"
                    document.getElementById(this.organism.row + "-" + this.organism.col).classList.remove("cellAlive")
                    
                    this.organism.hunger += 10
                    clearInterval(this.organism.Intervals)
                    organisms.splice(iVal, 1)
                    this.organism.col--
                    movementEncourage[2] = true
                }
                
                
            } else if(document.getElementById((this.organism.row+1) + "-" + this.organism.col) != null && document.getElementById((this.organism.row+1) + "-" + this.organism.col).classList.contains("cellAlive")){
                var otherOrganism
                var iVal
                for(var i = 0; i<organisms.length; i++){
                    var val = organisms[i]
                    if(val.row == (this.organism.row+1) && val.col == this.organism.col){
                        otherOrganism = organisms[i]
                        iVal = i
                        break;
                    }
                }
                if(otherOrganism.traits[1] < this.organism.traits[1]){
                    document.getElementById((this.organism.row+1) + "-" + this.organism.col).style.backgroundColor = this.organism.traits[0]
                    document.getElementById(this.organism.row + "-" + this.organism.col).style.backgroundColor = "white"
                    document.getElementById(this.organism.row + "-" + this.organism.col).classList.remove("cellAlive")
                    
                    this.organism.hunger += 10
                    clearInterval(this.organism.Intervals)
                    organisms.splice(iVal, 1)
                    this.organism.row++
                    movementEncourage[2] = true
                }
                
            } else if(document.getElementById((this.organism.row-1) + "-" + this.organism.col) != null && document.getElementById((this.organism.row-1) + "-" + this.organism.col).classList.contains("cellAlive")){
                var otherOrganism
                var iVal
                for(var i = 0; i<organisms.length; i++){
                    var val = organisms[i]
                    if(val.row == (this.organism.row-1) && val.col == this.organism.col){
                        otherOrganism = organisms[i]
                        iVal = i
                        break;
                    }
                }
                if(otherOrganism.traits[1] < this.organism.traits[1]){
                    document.getElementById((this.organism.row-1) + "-" + this.organism.col).style.backgroundColor = this.organism.traits[0]
                    document.getElementById(this.organism.row + "-" + this.organism.col).style.backgroundColor = "white"
                    document.getElementById(this.organism.row + "-" + this.organism.col).classList.remove("cellAlive")
                    
                    this.organism.hunger += 10
                    clearInterval(this.organism.Intervals)
                    organisms.splice(iVal, 1)
                    
                    this.organism.row--
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
        }

        return movementEncourage
    }

    foodNearby(radius){
        for(var i = 1; i<=radius; i++){
            if(document.getElementById((this.organism.row+i) + "-" + this.organism.col) != null && document.getElementById((this.organism.row+i) + "-" + this.organism.col).classList.contains("cellFood")){
                return [true, i, 0]
            } else if(document.getElementById((this.organism.row-i) + "-" + this.organism.col) != null && document.getElementById((this.organism.row-i) + "-" + this.organism.col).classList.contains("cellFood")){
                return [true, -i, 0]
            } else if(document.getElementById(this.organism.row + "-" + (this.organism.col+i)) != null && document.getElementById(this.organism.row + "-" + (this.organism.col+i)).classList.contains("cellFood")){
                return [true, 0, i]
            }  else if(document.getElementById(this.organism.row + "-" + (this.organism.col-i)) != null && document.getElementById(this.organism.row + "-" + (this.organism.col-i)).classList.contains("cellFood")){
                return [true, 0, -i]
            }
        }
        return false
        
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
                    backgroundColor: 'rgb(0, 0, 0)'
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
    for(let r = 0; r<rows; r++){
        for(let c = 0; c<cols; c++){
            if(document.getElementById(r + "-" + c) != null && !document.getElementById(r + "-" + c).classList.contains("cellAlive")){
                var randNum = Math.floor(Math.random()*1000) + 1
                if(randNum == 5){
                    document.getElementById(r + "-" + c).classList.add("cellFood")
                }
            }
            
        }
    }
    for(var i = 0; i<organisms.length; i++){
        var isDead = false;
        if(document.getElementById(organisms[i].row + "-" + organisms[i].col).backgroundColor == "white"){
            console.log("found")
            document.getElementById(organisms[i].row + "-" + organisms[i].col).remove("cellAlive")
            organisms.splice(i,1)
            isDead = true;
        }
        
        if(isDead == false){
            isDead = organisms[i].doAction()
            if(isDead == false){
                organisms[i].age++
                organisms[i].hunger--
                organisms[i].reproductionTimer--
                if(organisms[i].reproductionTimer <= 0 && organisms[i].hunger >= 10){
                    var seeIfMutation = Math.floor(Math.random() * 10) + 1
                    var newGeneHex = organisms[i].geneHex
                    var newTraits = organisms[i].traits

                    if(seeIfMutation == 5){
                        var randIndex = Math.floor(Math.random() * (organisms[i].geneHex.length-2)) + 1
                        newGeneHex = organisms[i].geneHex.substring(0, randIndex) + possibleGenomes[Math.floor(Math.random()*possibleGenomes.length)] + organisms[i].geneHex.substring(randIndex+1)
                    }

                    if(document.getElementById(organisms[i].row + "-" + (organisms[i].col-1)) != null && !document.getElementById(organisms[i].row + "-" + (organisms[i].col-1)).classList.contains("cellFood") && !document.getElementById(organisms[i].row + "-" + (organisms[i].col-1)).classList.contains("cellAlive")){
                        document.getElementById(organisms[i].row + "-" + (organisms[i].col-1)).classList.add("cellAlive")
                        organisms.push(new Organism(organisms[i].row,organisms[i].col-1,organisms[i].lifeExpectancy,newGeneHex, organisms[i].numOfGenes,organisms[i].reproductionRate, newTraits, idGenerator))
                        idGenerator++
                        organisms[i].reproductionTimer = organisms[i].reproductionRate
                    } else if(document.getElementById(organisms[i].row + "-" + (organisms[i].col+1)) != null && !document.getElementById(organisms[i].row + "-" + (organisms[i].col+1)).classList.contains("cellFood") && !document.getElementById(organisms[i].row + "-" + (organisms[i].col+1)).classList.contains("cellAlive")){
                        document.getElementById(organisms[i].row + "-" + (organisms[i].col+1)).classList.add("cellAlive")
                        organisms.push(new Organism(organisms[i].row,organisms[i].col+1,organisms[i].lifeExpectancy,newGeneHex, organisms[i].numOfGenes,organisms[i].reproductionRate, newTraits, idGenerator))
                        idGenerator++
                        organisms[i].reproductionTimer = organisms[i].reproductionRate
                    } else if(document.getElementById((organisms[i].row+1) + "-" + organisms[i].col) != null && !document.getElementById((organisms[i].row+1) + "-" + organisms[i].col).classList.contains("cellFood") && !document.getElementById((organisms[i].row+1) + "-" + organisms[i].col).classList.contains("cellAlive")){
                        document.getElementById((organisms[i].row+1) + "-" + organisms[i].col).classList.add("cellAlive")
                        organisms.push(new Organism(organisms[i].row+1,organisms[i].col,organisms[i].lifeExpectancy,newGeneHex, organisms[i].numOfGenes,organisms[i].reproductionRate, newTraits, idGenerator))
                        idGenerator++
                        organisms[i].reproductionTimer = organisms[i].reproductionRate
                    } else if(document.getElementById((organisms[i].row-1) + "-" + organisms[i].col) != null && !document.getElementById((organisms[i].row-1) + "-" + organisms[i].col).classList.contains("cellFood") && !document.getElementById((organisms[i].row-1) + "-" + organisms[i].col).classList.contains("cellAlive")){
                        document.getElementById((organisms[i].row-1) + "-" + organisms[i].col).classList.add("cellAlive")
                        organisms.push(new Organism(organisms[i].row-1,organisms[i].col,organisms[i].lifeExpectancy,newGeneHex, organisms[i].numOfGenes,organisms[i].reproductionRate, newTraits, idGenerator))
                        idGenerator++
                        organisms[i].reproductionTimer = organisms[i].reproductionRate
                    }
                }
            }
            }
            
        if(isDead)
            i--
        }
    var tempJSON = {x: secondsPassed, y:organisms.length}
    graphData.push(tempJSON)
    if(document.getElementById("chart") != null)
        chart.update()

    seeStats()
    Object.keys(species).forEach(([key]) =>{
        if(species[key][2] == 0){
            if(document.getElementById(key) != null){
                document.getElementById(key).remove()
            }
            delete species[key]
        } else{
            if(document.getElementById(key) == null){
                var list = document.createElement("li")
                list.id = key
                list.innerHTML = key + "- strength: " + Math.round(species[key][0] * 1000)/1000 + " | exploration: " + Math.round(species[key][1] * 1000)/1000 + " | population: " + species[key][2]
                displayStats.appendChild(list)
            } else{
                document.getElementById(key).innerHTML = key + "- strength: " + Math.round(species[key][0] * 1000)/1000 + " | exploration: " + Math.round(species[key][1] * 1000)/1000 + " | population: " + species[key][2]
            }
            

        }
        
        
    })
    
}

function printAllNeuralNetworks(){
    for(var i = 0; i<organisms.length; i++){
        console.log(organisms[i].neurons)
    }
}

function seeStats(){
    Object.keys(species).forEach(([key]) => {
        var tempArr = species[key + ""]
        if(tempArr[2] != undefined)
            tempArr[2] = 0
    })
    for(let i = 0; i<organisms.length; i++){
        if(Object.keys(species).length == 0){
            species["1"] = [organisms[i].stats[0], organisms[i].stats[1], 1]
        } else{
            var didFindSpecies = false
            Object.keys(species).forEach(([key]) => {
                var arr = species[key]
                
                if(didFindSpecies == false && ((organisms[i].stats[0] < (arr[0] + .5)) && (organisms[i].stats[0] > (arr[0] - .5)) && (organisms[i].stats[1] < (arr[1] + .5)) && (organisms[i].stats[1] > (arr[1] - .5)))){
                    didFindSpecies = true
                    organisms[i].traits[0] = speciesColors[parseInt(key)-1]
                    species[key][2] += 1
                }
            })

            if(didFindSpecies == false){
                species[Object.keys(species).length + 1 + ""] = [organisms[i].stats[0], organisms[i].stats[1], 1]
            }
        }
    }

    
}


function start(){
    grid.style.gridTemplateColumns = "repeat(" + cols + ", 12px)"
    grid.style.gridTemplateRows = "repeat(" + rows + ", 12px)"
    for(let r = 0; r<rows; r++){
        for(let c = 0; c<cols; c++){
            const cell = document.createElement("div")
            cell.className = "cell"
            cell.id = r + "-" + c
            

            var randNum = Math.floor(Math.random()*20) + 1
            if(randNum == 5){
                cell.classList.add("cellFood")
            }
            grid.appendChild(cell)
        }
        
    }


    var numOfGenesForOrganism = 10
    for(let i = 0; i<200; i++){
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
        organisms.push(new Organism(r, c, 100, randomGenome, numOfGenesForOrganism, 20, ["rgb(0, 0, 255)"], idGenerator))
        idGenerator++
    }

    seeStats()
    


    const intervalId = setInterval(initiateAction, 1000)
}

start()
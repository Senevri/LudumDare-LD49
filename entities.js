let gridsize={x:16, y:16}

class Entity{
    constructor(name) {
        //console.log("base entity", name)
        this.name = name
    }
    name = null
    asset = null
    type = null
    position = {x:0, y:0}
    zorder = 1
    draw=()=>{}
    checkCollision = ()=>false
    update = ()=>{}
    remove = ()=>{
        entities = entities.filter(e=>e!=this)
    }
}
class ImageEntity extends Entity{
    visible = true
    draw = this.drawImage
    constructor(name, attributes){
        super(name)
        for (var key in attributes) {
            this[key] = attributes[key]
        }
    }
    drawImage(){
        if (!this.asset) return;
        ctx.imageSmoothingEnabled = false
        ctx.drawImage(this.asset,
            this.position.x,this.position.y,
            this.asset.height, this.asset.width)
    }
}

class TiledEntity extends ImageEntity{
    draw = (x,y) => {
        let pattern = ctx.createPattern(this.asset, "repeat")
        ctx.fillStyle = pattern
        ctx.fillRect(0,0,canvas.width, canvas.height)
    }
}

class ReactiveEntity extends ImageEntity{
    constructor(name, attributes) {
        super(name, attributes)
        console.log("reactive entity", name, attributes)
    }
    behaviors = []

    removeBehavior(behavior) {
        this.behaviors = this.behaviors.filter((b)=>b!= behavior)
    }

    checkCollision = (x,y,w,h) => {

        if (x >= this.position.x &&
            x<=this.position.x+this.asset.width) {
            if (y>=this.position.y &&
                y<=this.position.y+this.asset.height) {
                //console.log(x,y,this)
                return true
            }
            return false
        }

    }

    update = ()=>{
        if (this.behaviors){
            this.behaviors.forEach((behavior)=>{
                behavior.update(this, behavior) //kludgey, but can pass temp data via behavior
            })
        }
    }
}

class Creature extends ReactiveEntity{
    // stats = {
    //     //might be different?
    // }
    constructor(name, attributes){
        super(name, attributes)
    }
}

class SelectMarker extends Entity{
    constructor(name){
        super(name)
    }
    color = {r:0, g:255, b:0, a:0}
    visible = false

    square = {width:16, height:16}
    selection = {x:0, y:0, width:0, height:0}
    draw = this.drawSelection

    setColor(r,g,b,a){
        this.color = {r:r, g:g, b:b, a:a}
    }

    getColor() {
        let cols = [this.color.r, this.color.g, this.color.b, this.color.a]
        return "rgba("+ cols.join(",")  +")"
    }

    isVisible(set) {
        this.color.a = 255
    }

    update = ()=>{
        this.visible = this.color.a == 0
    }

    drawSelection(){
        ctx.strokeStyle=this.getColor()
        let r = this.square
        let s = this.selection
        let c = {
            x: this.position.x + (gridsize.x*s.x),
            y: this.position.y + (gridsize.y*s.y),
            width: r.width * s.width,
            height: r.width * s.width
        } //coords
        ctx.strokeRect(c.x, c.y, r.width, r.height)
    }
}


function getEntity(attributes){
    result = entities.find((entity)=>{
        let _result = []
        for (key in attributes){
            //console.log(entity[key], key, attributes[key])
            _result.push(entity[key] == attributes[key])
        }
        return _result.every(x=>x==true)
    })
    return result
}

function getEntitiesInGrid(pos){
    return entities.filter((ent)=>ent.checkCollision(pos.x, pos.y, 16, 16))
}

let entities = (function(){
    let gridsize={x:16, y:16}

    return [
        //new TiledEntity(resources["test.png"]),
        new Creature("test", {
            asset:resources["stik_smol.png"],
            base_speed:1
        }),
        new Creature("player", {
            asset:resources["thegirl.png"],
            position:{x:7*gridsize.x, y:5*gridsize.y},
            base_speed:2,
            attack:{range:16, effect:(ent)=>{
                console.log("attack!", ent)
                ent.stats.health -= 10

                if (ent.stats.health <= 0) {
                    entities.push(new ReactiveEntity("food", {
                        asset: resources["food.png"],
                        position:ent.position,
                        stats:{
                            nutrition: ent.stats.nutrition + ent.stats.health
                        }

                    }))
                    ent.remove()
                }
                }
            },
            getTemperString: (pc)=>{
                let descriptions =[
                    "Chill",
                    "Cranky",
                    "Angry",
                    "Raging",
                ]
                let mood = descriptions[
                    Math.floor(pc.stats.temper/100*descriptions.length)]

                return (pc.stats.satiety > 0 || pc.stats.temper < 100) ?
                mood != undefined ?
                    mood
                    : "!!!!!"
                : "Hangry!!"
            },
            stats:{
                temper:0,
                satiety:100
            }
        }),
        new SelectMarker("selection"),
    ]

})()
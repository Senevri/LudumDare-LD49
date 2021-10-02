(function(){
    function setattributes(element, attrs) {
        for (attr in attrs){
            element.setAttribute(attr, attrs[attr])
        }
    }


    function draw(){
        //ctx.fillStyle = "#000000"
        //  ctx.fillRect(0,0,canvas.width, canvas.height)
        ctx.clearRect(0,0,canvas.width,canvas.height)
        entities.forEach((entity)=>{
            entity.draw()
        })
        crosshairs.draw()
    }

    class Behavior{
        constructor(name){
            this.name = name
        }

        update = ()=>{}
    }


    function update() {
        entities.forEach((entity)=>{
            entity.update()
            if (entity.behaviors){
                entity.behaviors.forEach((behavior)=>{
                    behavior.update(entity)
                })
            }
        })
    }


    let fps = 15

    function translateCursor(event, offset={x:0, y:0}){
        rect = canvas.getBoundingClientRect()
        let x = (event.clientX-rect.x)/scale.x + offset.x
        let y = (event.clientY-rect.y)/scale.y + offset.y
        return {x,y}
    }

    function getGridPos(pos){
        return {
            x:Math.floor(pos.x/16),
            y:Math.floor(pos.y/16)
        }
    }

    function getPixelPos(pos){
        return {
            x:pos.x*16,
            y:pos.y*16
        }
    }

    let scale = {x:3, y:3}

    function movetotarget(entity, target){
        //entity = attrs.entity
        //target = attrs.target
        let speed = 1
        let p = entity.position
        dx = (target.x-p.x)
        dy = (target.y-p.y)
        // vector length
        l = Math.sqrt(dx*dx+dy*dy)
        if (!entity.speed) {
            entity.speed = {}
            entity.speed.x = speed * dx/l
            entity.speed.y = speed * dy/l
        }
        //pathfinding? maybe later.
        if (Math.abs(target.x-p.x) <1 &&
            Math.abs(target.y-p.y) <1) {
            entity.behaviors = []
            entity.speed = {x:0, y:0}
        }
        console.log("speed", entity.speed)
        p.x = p.x + entity.speed.x
        p.y = p.y + entity.speed.y


    }


    function mousedownhandler (event){
        var collision = false
        entities.forEach((entity)=>{
            pos = translateCursor(event)
            gpos = getGridPos(pos)
            let moveto = new Behavior("moveto")
            moveto.update = (()=>{
                return (ent)=>{
                    t = getPixelPos(gpos)
                    movetotarget(ent, t)}
            })()
            let pc = getEntity({name:"player"})
            pc.speed = null
            pc.behaviors = pc.behaviors.filter((b)=>{
                console.log(b.name)
                return b.name != "moveto"
            })
            pc.behaviors.push(moveto)
            console.log(pc.behaviors)

            if (entity.checkCollision(pos.x,pos.y)) {
                collision = true
            }
            if (entity.name=="selection") {
                entity.isVisible(true)
                entity.position.x = gpos.x*16
                entity.position.y = gpos.y*16
            }


        })
        let ent = getEntity({name:"selection"})

        if (collision) {
            ent.setColor(255,255,0,255)
        } else {
            ent.setColor(0,255,0,255)
        }
    }

    crosshairs = new ImageEntity("crosshairs", {
        asset:resources["crosshairs.png"]})
    function mousemovehandler(event) {
        crosshairs.position = translateCursor(event,{x:-8, y:-8})
        crosshairs.draw()
    }
    //entities.push(crosshairs)

    function setup() {
        ent = getEntity({name:"test"})
        //console.log(ent)
        ent.position = getPixelPos({x:7, y:8})
        player_character = getEntity("player")
    }

    window.onload=()=>{
        setup()
        cibtauber = (function setupCanvas() {
            let container = document.createElement("div")
            let canvas = document.createElement("canvas")
            container.append(canvas)
            setattributes(canvas, {
                "width": "768",
                "height": "512",
                "id": "screen"
            })
            setattributes(container, {
                "id": "box"
            })


            return {
                container: container,
                canvas: canvas
            }
        })()

        canvas = cibtauber.canvas
        ctx = canvas.getContext('2d')
        ctx.setTransform(
            scale.x,0,0,scale.y,0,0)
        ctx.filter=null

        canvas.addEventListener("mousedown", mousedownhandler)
        canvas.addEventListener("mousemove", mousemovehandler)

        document.getElementsByTagName("body")[0].appendChild(cibtauber.container)
        let heartbeat = window.setInterval(()=>{
            draw()
            update()
        }, 1000/fps)

    }
   })()
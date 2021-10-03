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
            this.created = + new Date()
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
            x:Math.floor(pos.x/gridsize.x),
            y:Math.floor(pos.y/gridsize.y)
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
        var done = false
        let speed = entity.base_speed
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
            entity.speed = {x:0, y:0}
            p.x = target.x
            p.y = target.y
            //entity.speed = null
            //entity.behaviors=[]
            done = true
        }
        //console.log("speed", entity.speed)
        if (entity.speed) {
            p.x = p.x + entity.speed.x
            p.y = p.y + entity.speed.y
        }
        return done
    }

    function onlyEntIsPlayer(entities){
        result = entities.length == 0 ||
            (entities.length == 1 &&
            "player" == entities[0].name) ||
            entities.length > 1
        return result
    }

    function mousedownhandler (event){
        var collision = false
        entities.forEach((entity)=>{
            let pos = translateCursor(event)
            var gpos = getGridPos(pos)
            let t={}
            let ents = getEntitiesInGrid(pos)
            let pc = getEntity({name:"player"})

            //FIXME is buggy but is good enough.
            if (!onlyEntIsPlayer(ents)){
                let curpos = getGridPos(pc.position)
                let dx = gpos.x-curpos.x
                let dy = gpos.y-curpos.y
                // shift by 1 if necessary
                let x1 = dx!=0 ? dx/Math.abs(dx):0
                let y1 = dy!=0 ? dy/Math.abs(dy):0
                //console.log(gpos)
                gpos = {
                    x:gpos.x-x1,
                    y:gpos.y-y1
                }
                //console.log(dx, dy, x1, y1, gpos)
            }

            let moveto = new Behavior("moveto")
            moveto.update = (ent)=>{
                t = getPixelPos(gpos)
                done = movetotarget(ent, t)
                if (done) {
                    ent.removeBehavior(moveto)
                }
            }

            let attack = new Behavior("attack")
            attack.update = (attacker)=>{
                console.log(attacker.name, attack)
                let range = 1+pc.attack.range
                let xdistance = Math.abs(attacker.position.x-entity.position.x)
                let ydistance = Math.abs(attacker.position.y-entity.position.y)
                console.log("attack?", xdistance, ydistance )
                if (xdistance<=range &&
                    ydistance<=range){
                        attacker.attack.effect(entity)
                        attacker.removeBehavior(attack)
                    }
            }

            pc.speed = null
            pc.behaviors = pc.behaviors.filter((b)=>{
                //console.log(b.name)
                return (!["moveto"].includes(b.name) )
            })
            pc.behaviors.push(moveto)
            // console.log(pc.behaviors)

            if (entity.checkCollision(pos.x,pos.y)) {
                console.log(entity, pos)
                if (entity.name!="player") {
                    pc.behaviors.push(attack)
                }
                console.log(pc.behaviors)
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
        console.log("setup")
        ent = getEntity({name:"test"})
        ent.behaviors=[]
        //console.log(ent)
        ent.position = getPixelPos({x:7, y:8})
        let wanderbehavior = new Behavior("wander")
        wanderbehavior.update = (ent)=>{
            function getNewTarget(){
                let pos = ent.position
                let tpos = {}
                let ran_mul = 3
                tpos.x = 1+pos.x-gridsize.x*ran_mul+(2*gridsize.x*ran_mul*Math.random())
                tpos.y = 1+pos.y-gridsize.y*ran_mul+(2*gridsize.y*ran_mul*Math.random())
                tpos.x = tpos.x<0 ? 0 : tpos.x > 15*gridsize.x ? 15*gridsize.x : tpos.x
                tpos.y = tpos.y<0 ? 0 : tpos.y > 11*gridsize.y ? 11*gridsize.y : tpos.y
                t = getPixelPos(getGridPos(tpos))
                //console.log("new target",t, ent.position)
                return t
            }

            if (!ent.speed || (ent.speed.x == 0 && ent.speed.y == 0)) {
                let t = getNewTarget()
                done = movetotarget(ent,t)
            }
            done=movetotarget(ent,t)
            if (done){
                ent.speed=null
            }

        }
        ent.behaviors.push(wanderbehavior)
        console.log(ent.behaviors)
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
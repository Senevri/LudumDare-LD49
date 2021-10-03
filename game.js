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
        var pc = getEntity({name:"player"})
        entities.forEach((entity)=>{
            entity.draw()
        })
        crosshairs.draw()
        ctx.fillStyle = "#FFFFFF"
        ctx.font = "8px Courier New"
        ctx.fillText("Satiety:"+pc.stats.satiety, 4,8)
        ctx.fillText("Mood:"+pc.getTemperString(pc), 4,gridsize.y*1)
    }

    function director(){
        //check enemies in entities
        let enemies = entities.filter(e=>e.name=="enemy")
        if (enemies.length<1 || enemies.length<20 && Math.random()>0.9){
            console.log("make enemies")
            let suggestedPosition = getPixelPos({x:1,y:Math.floor(10*Math.random())})
            let ents = getEntitiesInGrid(suggestedPosition).filter(e=>e.name=="enemy")
            if (ents.length == 0) {
                let enemy = new Creature("enemy", {
                    base_speed:1,
                    asset:resources["enemy.png"],
                    position:suggestedPosition,
                    stats:{
                        health: 100, nutrition: 100
                    },
                    attack:{
                        range: 20
                    }
                })
                enemy.behaviors.push(new behaviors.Behavior("wander"))
                let hunt = new behaviors.Behavior("hunt")
                hunt.target = getEntity({name:"player"})
                hunt.target.stats.temper++
                console.log(hunt.target)

                function removeByName(name) {
                    enemy.behaviors = enemy.behaviors.filter(b=>b.name != name)
                }

                hunt.update = (enemy, behavior)=>{

                    dist = behaviors.func.getDistance(enemy.position, hunt.target.position)
                    //console.log("hunt", dist)
                    let is_wandering = enemy.behaviors.filter(b=>b.name=="wander").length>0
                    let in_attack_distance = Math.floor(dist.distance/gridsize.x)<3
                    if (is_wandering && in_attack_distance) {
                        removeByName("wander")
                        //console.log("should stop moving")
                        movtoatk=new behaviors.Behavior("movetoatk")
                        movtoatk.update = (enemy, b)=>{
                            behaviors.func.moveToTarget(enemy, hunt.target.position)
                        }
                        enemy.speed=null
                        enemy.behaviors.push(movtoatk)
                    }
                    if (dist.distance<enemy.attack.range) {
                        console.log("in range")
                        enemy.behaviors = enemy.behaviors.filter(b=>b.name!="movtoatk")
                        hunt.target.stats.temper += 1
                    }
                    if (!is_wandering && !in_attack_distance) {
                        enemy.speed=null
                        enemy.behaviors.push(new behaviors.Behavior("wander"))
                    }
                }
                enemy.behaviors.push(hunt)
                console.log(enemy)
                entities.push(enemy)
            }


            //console.log(entities)

        }
    }





    function update() {
        entities.forEach((entity)=>{
            entity.update()
        })
        director()
    }


    let fps = 15

    function translateCursor(event, offset={x:0, y:0}){
        //console.log(event)
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

    window.translateCursor = translateCursor
    window.getPixelPos = getPixelPos
    window.getGridPos = getGridPos

    let scale = {x:3, y:3}

    function onlyCreatureIsPlayer(entities){
        result = entities.length == 0 ||
            (entities.length == 1 &&
            "player" == entities[0].name) ||
            entities.length > 1
        return result && entities.every((e)=>e.constructor.name="Creature")
    }

    function mouseToGridPos(pc, pos) {
        var gpos = getGridPos(pos)
        let ents = getEntitiesInGrid(pos)

        //FIXME is buggy but is good enough.
        if (!onlyCreatureIsPlayer(ents)){
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
        return gpos
    }

    function mousedownhandler (event){
        var collision = false
        window.mouse = event
        console.log(entities)
        let pc = getEntity({name:"player"})
        let pos = window.translateCursor(event)

        let gpos = mouseToGridPos(pc, pos)
        entities.forEach((entity)=>{

            pc.speed = null
            pc.behaviors = pc.behaviors.filter((b)=>{
                //console.log(b.name)
                return (!["moveto"].includes(b.name) )
            })
            let moveto = new behaviors.Behavior("moveto")
            moveto.gpos = gpos
            pc.behaviors.push(moveto)
            // console.log(pc.behaviors)

            if (entity.checkCollision(pos.x,pos.y)) {
                console.log(entity.constructor.name, pos)
                if (!["player", "food"].includes(entity.name)) {
                    let attack = new behaviors.Behavior("attack")
                    attack.target = entity
                    pc.behaviors.push(attack)
                }
                if ("food" == entity.name){
                    pc.stats.satiety += entity.stats.nutrition
                    entity.remove()
                }
                //console.log(pc.behaviors)
                collision = true
            }
            if (entity.name=="selection") {
                entity.isVisible(true)
                entity.position.x = gpos.x*16
                entity.position.y = gpos.y*16
            }
            console.log(entity.stats)

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
        ent.behaviors.push(new behaviors.Behavior("wander"))
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
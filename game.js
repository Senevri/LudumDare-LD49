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
        var enemies = 0
        entities.forEach((entity)=>{
            entity.draw()
            if (entity.name=="enemy"){
                //console.log(entity.position)
                enemies++
            }
        })
        crosshairs.draw()
        ctx.fillStyle = "#FFFFFF"
        ctx.font = "8px Courier New"
        ctx.fillText("Satiety:"+Math.floor(pc.stats.satiety), 4,8)
        ctx.fillText("Mood:"+pc.getTemperString(pc) + " - " + Math.floor(pc.stats.temper), 4,gridsize.y*1)
        ctx.fillText("Enemies:" + enemies, 4, gridsize.y*9)

    }

    function removeByName(entity, name) {
        entity.behaviors = entity.behaviors.filter(b=>b.name != name)
    }

    function addOnlyOneByName(entity, name){
        removeByName(entity, name)
        entity.behaviors.push(new behaviors.Behavior(name))

    }


    function director(){
        //check enemies in entities
        let max_enemies =3
        let enemies = entities.filter(e=>e.name=="enemy")
        if (enemies.length<1 || enemies.length<3 && Math.random()>0.95){
            //console.log("make enemies")
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
                //console.log(hunt.target)


                hunt.update = (enemy, behavior)=>{

                    dist = behaviors.func.getDistance(enemy.position, hunt.target.position)
                    //console.log("hunt", dist)
                    let is_wandering = enemy.behaviors.filter(b=>b.name=="wander").length>0
                    let in_attack_distance = Math.floor(dist.distance/gridsize.x)<3
                    if (is_wandering && in_attack_distance) {
                        removeByName(enemy, "wander")

                        //console.log("should stop moving")
                        movtoatk=new behaviors.Behavior("movetoatk")
                        movtoatk.update = (enemy, b)=>{
                            enemy.speed=null
                            behaviors.func.moveToTarget(enemy, hunt.target.position)
                        }
                        enemy.speed=null
                        enemy.behaviors.push(movtoatk)
                    }
                    if (dist.distance<enemy.attack.range) {
                        //console.log("in range")
                        enemy.behaviors = enemy.behaviors.filter(b=>b.name!="movtoatk")
                        hunt.target.stats.temper += 1
                    }
                    if (!is_wandering && !in_attack_distance) {
                        enemy.speed=null
                        enemy.behaviors.push(new behaviors.Behavior("wander"))
                    }
                }
                enemy.behaviors.push(hunt)
                //console.log(enemy)
                entities.push(enemy)
            }
        }
    }





    function update() {
        entities.forEach((entity)=>{
            entity.update()
        })
        director()
    }


    let fps = 24

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
        let pc = getEntity({name:"player"})
        let pos = window.translateCursor(event)

        let gpos = mouseToGridPos(pc, pos)
        //console.log(pos, gpos)
        pc.behaviors = pc.behaviors.filter((b)=>{
            //console.log(b.name)
            return (!["moveto"].includes(b.name) )
        })
        pc.speed = null
        let moveto = new behaviors.Behavior("moveto")
            moveto.gpos = gpos
            pc.behaviors.push(moveto)

        entities.forEach((entity)=>{
            if (entity.checkCollision(pos.x,pos.y)) {
                if (!["player", "food"].includes(entity.name)) {
                    let attack = new behaviors.Behavior("attack")
                    attack.target = entity
                    pc.behaviors.push(attack)
                }
                // NO eating with an attack ! Kinda like the idea of destroying it though
                if ("food" != entity.name){ // shouldn't collide with food anyway though?
                    collision = true
                }
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

    let keycodes = {
        SHIFT: 16,
        CTRL: 17
    }

    function handleKeys(event, keyhandlers){
        console.log(event.key, keyhandlers)
        if (Object.keys(keyhandlers).includes(event.key)) {
			//console.log(event, keyhandlers[event.key])
			keyhandlers[event.key]()
		}
		else {

			console.log("no handler for", event.keyCode, event.key);
		}
    }

    function keyuplistener(event) {
        let player = getEntity({name:"player"})

		let keyhandlers = {
            "Shift": ()=>{removeByName(player, "stop"); player.base_speed = player.old_speed},
            "Control": ()=>{player.base_speed = 2}
         }
         handleKeys(event, keyhandlers)
         console.log("speed", player.base_speed)
    }

    function keydownlistener(event) {
        let player = getEntity({name:"player"})
		let keyhandlers = {
	        "Shift": ()=>{addOnlyOneByName(player, "stop")},
            "Control": ()=>{player.base_speed = 4; player.stats.satiety -= 1}
		}
        handleKeys(event, keyhandlers)
        console.log("speed", player.base_speed)

    }

    crosshairs = new ImageEntity("crosshairs", {
        asset:resources["crosshairs.png"]})

    function mousemovehandler(event) {
        ctx.clearRect(crosshairs.position.x, crosshairs.position.y, crosshairs.asset.width, crosshairs.asset.height)
        crosshairs.position = translateCursor(event,{x:-8, y:-8})
        crosshairs.draw()
    }
    //entities.push(crosshairs)

    function setup() {
        console.log("setup")
        //ent = getEntity({name:"test"})
        //ent.behaviors=[]
        //console.log(ent)
        //ent.position = getPixelPos({x:7, y:8})
        //ent.behaviors.push(new behaviors.Behavior("wander"))
        //console.log(ent.behaviors)
        pc = getEntity({name:"player"})
        pc.behaviors.push(new behaviors.Behavior("eat"))
        pc.atk_options = [
            {range: gridsize.x, power: 10, resource: resources["atk_1.png"]},
            {range: gridsize.x*3, power: 30, resource: resources["atk_2.png"]},
            {range: gridsize.x*10, power: 90, resource: resources["atk_3.png"]},
        ]
        entities.push(new ImageEntity("current_attack", {
            asset: pc.atk_options[0].resource,
            position: {x: gridsize.x * 7, y: gridsize.y * 8, },
            update: ()=> {
                let self = getEntity({name:"current_attack"})
                let atk = pc.getAtkChoice(pc)
                self.asset = atk.resource
            }
        }))

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
        document.addEventListener("keydown", keydownlistener)
        document.addEventListener("keyup", keyuplistener)


        document.getElementsByTagName("body")[0].appendChild(cibtauber.container)
        let heartbeat = window.setInterval(()=>{
            draw()
            update()
        }, 1000/fps)

    }
   })()
behaviors = (function(){
    class Behavior{
        constructor(name, attrs){
            this.name = name
            this.created = + new Date()
            if (Object.keys(builtin).includes(name)){
                this.update = builtin[name]
            } else {
                if (attrs){
                    for (attr in attrs){
                        this[attr]=attrs[attr]
                    }
                }
                this.update = ()=>{}
            }

        }
    }

    function getDistance(p, target){
        dx = (target.x-p.x)
        dy = (target.y-p.y)
        // vector length
        l = Math.sqrt(dx*dx+dy*dy)
        return {distance:l, dx:dx, dy:dy}
    }

    function getBump(dx, dy){
        return {
            x: dx!=0 ? dx/Math.abs(dx) : 0,
            y: dy!=0 ? dy/Math.abs(dy) : 0
        }

    }

    function removeMarkerForEntity(ent) {
        entities = entities.filter(e=>!(e.name=="marker"&& e.forEntity == ent))
    }

    function moveToTarget(entity, target){
        //entity = attrs.entity
        //target = attrs.target
        var done = false
        let speed = entity.base_speed
        let p = entity.position
        dist = getDistance(p, target)
        dx = dist.dx
        dy = dist.dy
        l = dist.distance
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

        if (entity.speed) {
            p.x = p.x + entity.speed.x
            p.y = p.y + entity.speed.y
        }
        return done
    }

    let builtin = {
        moveto: (ent, behavior)=>{
            t = getPixelPos(behavior.gpos)
            done = moveToTarget(ent, t)
            if (done) {
                ent.removeBehavior(behavior)
            }
        },

        eat: (ent, behavior) => {
            let foods = entities.filter(e=>e.name=="food")
            foods.forEach((food)=>{
                if (getDistance(food.position, ent.position).distance < 16) {
                    console.log(ent.stats, food.stats)
                    ent.stats.satiety += food.stats.nutrition
                    ent.stats.temper = Math.abs(ent.stats.temper - food.stats.nutrition/2.5)
                    food.remove()
                }})
        },

        attack: (attacker, behavior)=>{
            new behaviors.Behavior("attack")
            let target = behavior.target
            let range = 1+attacker.attack.range
            let xdistance = Math.abs(attacker.position.x-target.position.x)
            let ydistance = Math.abs(attacker.position.y-target.position.y)
            //console.log("attack?", xdistance, ydistance )
            let strokestyles = {
                10:"#FF6A00",
                30:"#1100FF",
                90:"¤FF4400"

            }
            if (xdistance<=range &&
                ydistance<=range){
                    canvas = document.getElementById("screen")
                    ctx = canvas.getContext('2d')
                    ctx.strokeStyle = strokestyles[attacker.attack.power]
                    ctx.beginPath();
                    ctx.moveTo(8+attacker.position.x, 8+attacker.position.y);
                    ctx.lineTo(8+target.position.x, 8+target.position.y);
                    ctx.stroke();
                    attacker.satiety-=attacker.attack.power/10
                    attacker.attack.effect(target, attacker.attack)
                    attacker.removeBehavior(behavior)
                }
        },

        wander: (ent, behavior)=>{
            function createMarker(){
                marker = new SelectMarker("marker",{
                    visible: true,
                    position: t,
                    forEntity: ent,
                })
                marker.isVisible(true)
                marker.setColor(255,0,0,127)
                entities.push(marker)
            }

            function getNewTarget(){
                let pos = ent.position
                let tpos = {}
                let ran_mul = 1
                tpos.x = gridsize.x + Math.random()*gridsize.x*14
                tpos.y = gridsize.y + Math.random()*gridsize.y*8
                t = getPixelPos(getGridPos(tpos))
                entities = entities.filter(e=>!(e.name=="marker"&& e.forEntity == ent))
                createMarker()
                ent.target = t
                console.log("new target",t, ent.position)
                return t
            }

            var done = false
            let p = ent.position
            if (ent.position.x<0 ||ent.position.y<0 ||
                ent.position.x > gridsize.x*15 ||ent.position.y>gridsize.y*9) {
                let dx = (gridsize.x*8-p.x)
                let dy = (gridsize.y*5-p.y)
                bump = getBump(dx,dy)
                ent.position.x = p.x + bump.x*4
                ent.position.y = p.y + bump.y*4
                ent.speed=null

                let t = getNewTarget()
                done = moveToTarget(ent,t)
            }


            if (ent.target && getDistance(ent.position, ent.target).distance < 1) {
                ent.speed=null
            }

            if (!ent.speed || (ent.speed.x == 0 && ent.speed.y == 0)){
                let t = getNewTarget()
                ent.target = t
                done = moveToTarget(ent,t)
            }
            done = moveToTarget(ent,t)

            if (done){ // does not work
                ent.speed=null
            }
        }
    }



    return {
        Behavior: Behavior,
        builtin: builtin,
        func:{
            moveToTarget: moveToTarget,
            getDistance: getDistance

        }
    }
})()
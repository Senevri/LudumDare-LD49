behaviors = (function(){
    class Behavior{
        constructor(name){
            this.name = name
            this.created = + new Date()
            if (Object.keys(builtin).includes(name)){
                this.update = builtin[name]
            } else {
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
        //console.log("speed", entity.speed)
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

        attack: (attacker, behavior)=>{
            attacker.stats.satiety--
            new behaviors.Behavior("attack")
            let target = behavior.target
            let range = 1+attacker.attack.range
            let xdistance = Math.abs(attacker.position.x-target.position.x)
            let ydistance = Math.abs(attacker.position.y-target.position.y)
            //console.log("attack?", xdistance, ydistance )
            if (xdistance<=range &&
                ydistance<=range){
                    canvas = document.getElementById("screen")
                    ctx = canvas.getContext('2d')
                    ctx.strokeStyle = "#ff0000"
                    ctx.beginPath();
                    ctx.moveTo(8+attacker.position.x, 8+attacker.position.y);
                    ctx.lineTo(8+target.position.x, 8+target.position.y);
                    ctx.stroke();

                    console.log(target.stats)
                    attacker.attack.effect(target)
                    attacker.removeBehavior(behavior)
                    console.log(target.stats)
                }
        },

        wander: (ent, behavior)=>{
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
                done = moveToTarget(ent,t)
            }
            done=moveToTarget(ent,t)
            if (done){
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
let resources = (function(){
    let resources = {}

    let typehandlers = {
        png: (fname)=> {
            img = new Image()
            img.src = "./assets/"+fname
            return img
        }
    }

    let res_strings = [
        "test.png",
        "stik.png",
        "stik_smol.png",
        "enemy.png",
        "thegirl.png",
        "crosshairs.png"
    ].forEach((asset)=>{
        let type = asset.substring(asset.length-3)
        resources[asset] = (typehandlers[type](asset))
        //console.log(resources[asset])
    })

    function getResource(res_string) {

    }
    return resources
})()
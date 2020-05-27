//此处定义全局变量，所以页面之间共享
const schema = require("../config/schema");
const contract = require("./Contract");
const utils = require("../service/utilService")
const fileService = require("../service/fileService")
const imageBase = process.env.IMAGEBASE

const file_base = "./public/images/"

const infoSchema = schema.info.name;

let Global = {
    dbService: null,
    infos: {},
    setDBService: function (db) {
        this.dbService = db;
    },
    getInfoByType: function (typeId) {
        let key = "" + typeId
        return this.infos[key]
    },
    saveInfoByType: async function (typeId, info) {
        let _infos = {
            typeId,
            ...info
        }
        try{
            let r = await this.dbService.save(infoSchema, _infos)
            if(r) {
                console.log("\x1b[32m类型信息保存数据库成功:" + typeId + "\x1b[0m")
                this.infos["" + typeId] = info
            }
        }catch(err) {
            console.log(err)
        }
    },
    //从数据库中恢复
    init: async function () {
        let allInfos = await this.dbService.find(infoSchema, {}, {}, {
            sort: {
                typeId: -1
            }
        })
        for (let info of allInfos) {
            let _infos = {
                name: info["name"],
                description: info["description"],
                image: info["image"]
            }
            this.infos["" + info["typeId"]] = _infos
        }
        this.getAndSaveInfos()
    },
    getAndSaveInfos: async function () {
        if(!contract) {
            return;
        }
        try{
            let nonce = await contract.nonce()
            nonce = +nonce
            let ids = []
            for (let i = 1; i <= nonce; i++) {
                if (!this.getInfoByType(i)) {
                    ids.push(i)
                }
            }
            this.updateFromChain(ids)
            this.listen()
        }catch(err) {
            console.log(err)
        }
    },
    updateFromChain: function (ids) {
        if(!contract) {
            return;
        }
        if (ids.length === 0) {
            console.log("\x1b[32m不需要更新纪念币图标.\x1b[0m")
            return
        }
        
        let all_promise = []
        for (let i = 0; i < ids.length; i++) {
            all_promise.push(contract.getTypeSVG(ids[i]))
        }
        let self = this
        Promise.all(all_promise).catch(e => {}).then(r => {
            if(!r) {
                return 
            }
            for (let j = 0; j < r.length; j++) {
                let id = ids[j]
                let svg = r[j]
                let name = utils.getFirstContextByLabel(svg, "name")
                let description = utils.getFirstContextByLabel(svg, "desc")
                let info = {
                    name,
                    description,
                    image: imageBase + "/" + id + ".svg"
                }
                fileService.writeTxt(file_base + id + ".svg",svg).then( msg => {
                    self.saveInfoByType(id, info)
                }).catch(e => {console.log(e)})
            }
        })
    },
    listen:function() {
        let self = this
        console.log("\x1b[32m创建纪念币监听中...\x1b[0m")
        contract.on("CreateToken",(creator,typeId,event) => {
            let id = utils.convertTypeIdToBase(typeId)
            console.log("监听到新纪念币创建事件，类型为: " + id)
            if(!self.getInfoByType(id)) {
                let ids = [id]
                self.updateFromChain(ids)
            }
        })
    }
};
module.exports = Global;
/**
 * Created by radarzhhua on 2020/04/08.
 */

var Schema = {
    /**
     纪念币信息数据结构
     * */
    info: {
        name: "info",
        schema: {
            typeId: {type: Number, unique: true, required: true, index: true},
            name: {type: String, required: true},
            description: {type: String, required: true},
            image: {type: String, required: true}
        }
    }
};
if (typeof module != "undefined") module.exports = Schema;

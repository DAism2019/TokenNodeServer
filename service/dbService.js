/*************************************************
 *Copyright (C),2018-2022
 *Filename:  dbService.js
 *Author: radarzhhua     Version:   1.0     Date: 2018.10.20
 *Description:   此JS是应用于Node.js上的使用mongoose来连接mongodb数据库,
 *               封装常用的数据库操作,外部调用一律使用async/await而不是使用回调函数,
 *               支持条件操作符和原子操作符,支持多个数据库同时连接,
 *               部分支持略去$set 和 $inc 操作符
 *               需要提前定义好schema,
 *               需要node.js 7.6 以上,
 *               需要mongoose 5.3.4 以上,
 *               需要mongodb 3.4 以上.
 *               此为js版本
 *email:radarzhhua@gmail.com
 *************************************************/
//定义mongoose相关对象
const mongoose =require("mongoose") ;
const Schema = mongoose.Schema;

//创建数据库管理对象
function DBService() {
    this.allModels = {};
    this.conn = null;
}
let proto = DBService.prototype;
/**
 * 连接数据库
 * @param
 * url  数据库url
 * schemas    所有需要使用的表对象
 * @return 返回一个mongoose连接，如果出错返回null
 * */
proto.connect = async function(url, schemas,callback,target) {
    try {
        this.conn = await mongoose.createConnection(url, {
            useNewUrlParser: true,       //使用新URL（含有端口号）
            useCreateIndex: true,       //打开以免冲突
            autoIndex:true,             //自动索引
            autoCreate:false,           //自动创建表
            useUnifiedTopology: true,
            useFindAndModify:false      //使用findOneAndUpdate
        });
        if (this.conn)
            console.log("\x1b[32mDatabase connect success!\x1b[0m");
        else {
            console.log("\x1b[31mDatabase connect failed!\x1b[0m");
            return null;
        }
    } catch (err) {
        console.log("\x1b[31mDatabase connect failed!\x1b[0m");
        console.log("\x1b[31mError:", err, "\x1b[0m");
        return null;
    }
    //初始化各model
    for (let key in schemas) {
        let name = schemas[key]['name'];
        if (!this.allModels[name])
            //注意这里表名在实际数据库中会转化为小写复数形式
            this.allModels[name] = this.conn.model(name, new Schema(schemas[key]['schema']), name);
        }
    console.log("\x1b[32mSchemas init over \x1b[0m");
    // return this.conn;
    if(callback) {
        callback.call(target)
    }
};

/***************
* 创建数据相关方法
***************/

/**
 * 存储一条数据
 * @param
 * tableName  表名
 * params     存储的数据 格式:{name:"mongodb"}
 * options 可选项 主要用法示例 {validateBeforeSave:true}     //是否在存储前验证 还有一个safe属性，改写schema的安全选项比较复杂很少用
 * @return 返回保存的document
 */
proto.save = async function(tableName, params,options) {
    let doc = new this.allModels[tableName](params);
    let result = await doc.save(options);
    doc = null;
    return result;
};

/**
 * 存储一条或者多条数据
 * 其本质和save一样,都是创建document并保存
 * 它每一条记录都会存储一次，可能会影响效率，可以使用insertMany方法
 * @param
 * tableName  表名
 * params     存储的数据对象 格式:{name:"mongodb"},可以是一个spread,多个对象用逗号分开,也可以是一个对象数组,推荐使用数组
 * options  用来传递给save的options 使用这个参数时params必须为数组
 * @return 返回一个包含所有创建的document的数组
 */
proto.create = async function(tableName, params, options) {
    let result = await this.allModels[tableName].create(params, options);
    return result;
}
/**
 * 存储一条或者多条数据
 * 其本质和save一样,都是创建document并保存
 * 它一次存储多条记录
 * @param
 * tableName  表名
 * docs     存储的数据对象,单个对象或者对象数组
 * options  一些额外参数，主要有 ordered,默认为false，
 * 当为true时，如果有一条记录存储出错，后面的就不能存储，为false时，会存储所有记录后再给出错误
 * @return 返回一个包含所有创建的document的数组(如果document不能通过验证，不会被创建，会给出一个error)
 */
proto.insertMany = async function(tableName, docs, options) {
    let result = await this.allModels[tableName].insertMany(docs, options);
    return result;
};

/***************
* 查询数据相关方法
***************/

//查找符合条件的第一个数据
/**
 * @param
 * tableName  表名
 * query     查询的条件
 * projection 选择的字段 字符串或者对象 可选项
 * options 额外条件，如sort limit等可选项
 * 参数不能跳过，如果有options参数，projection必须存在，要选择所有字段，请输入{}
 * 参数示例:findOne('player',{},{},{sort:{age:-1,name:1},lean:true});
 * @return 返回一个document或者js对象
 */
proto.findOne = async function(tableName, query, projection,options) {
    let model = this.allModels[tableName];
    let result = await model.findOne(query, projection,options).exec();
    return result;
};

//查找符合条件的所有数据
/**
 * @param
 * tableName  表名
 * query     查询的条件
 * projection 选择的字段   字符串或者对象 可选项
 * options 额外条件，如sort limit等可选项
 * 参数不能跳过，如果有options参数，projection必须存在，要选择所有字段，请输入{}
 * 参数示例:find('player',{},{},{sort:{age:-1,name:1}});
 * @return 返回一个包含所有document或者js对象的数组
 */
proto.find = async function(tableName, query,projection, options) {
    let model = this.allModels[tableName];
    let list = await model.find(query, projection, options).exec();
    return list;
};

//根据_id查找一个数据
/**
 * @param
 * tableName  表名
 * id     查询的_id
 * projection  选择的字段 字符串或者对象 可选项  示例: 'name age' '-name' {name:1,age:-1}
 * options 额外条件, 比如 lean:true表示返回的是js对象，不是document
 * 参数不能跳过，如果有options参数，projection必须存在，要选择所有字段，请输入{}
 * @return 返回一条数据(document或者对象)
 */
proto.findById = async function(tableName, id, projection, options) {
    let model = this.allModels[tableName];
    let result = await model.findById(id, projection, options).exec();
    return result;
};

/***************
* 更新数据相关方法
***************/

//更新符合条件的第一个数据
/**
 * @param
 * tableName  表名
 * query     更新的条件
 * update     更新的内容,见 findOneAndUpdate
 * options    额外参数，setOptions() 见上
 * isInc      是值增加还是重新设置, true为增加  只能作用于数字型字段
 *（自己增加的参数 这是为了方便update中不写$set 或者 $inc）
 * @return 返回一个操作记录对象 { n: 1, nModified: 1, ok: 1 }
 * n:符合条件的记录个数   用来判断对象是否存在
 * nModified:更新的数量
 * ok:操作结果          用来判断执行是否成功
 */
proto.updateOne = async function(tableName, query, update, isInc,options) {
    update = _convertUpdate(update, isInc);
    let model = this.allModels[tableName];
    let result = await model.updateOne(query, update,options);
    return result;
};

//更新符合条件的所有数据
/**
 * @param
 * tableName  表名
 * query     更新的条件
 * update     更新的内容,更新的内容,见 findOneAndUpdate
 * isInc      同updateOne   只能作用于数字型字段
 * options    同updateOne
 * @return 返回一个操作记录对象 { n: 1, nModified: 1, ok: 1 }
 * n:符合条件的记录个数   用来判断对象是否存在
 * nModified:更新的数量
 * ok:操作结果          用来判断执行是否成功
 */
proto.updateMany = async function(tableName, query, update, isInc,options) {
    update = _convertUpdate(update, isInc);
    let model = this.allModels[tableName];
    let result = await model.updateMany(query, update,options);
    return result;
};

//查找一个符合条件的数据并更新，然后返回更新后的数据
/**
 * @param
 * tableName  表名
 * query     更新的条件    可选参数
 * update     更新的内容   可选参数
 * 可以使用{$set:{name:'mongodb'}} 格式
 * 也可以不使用$set，直接使用{name:'mongodb'} 格式
 * isInc      是值追加还是重新设置  可选参数 ,只能作用于数字型字段
 * options  同updateOne
 * @return 返回一个document或者js对象
 */
proto.findOneAndUpdate = async function(tableName, query, update, isInc, options) {
    update = _convertUpdate(update, isInc);
    let model = this.allModels[tableName];
    if (!options)
        options = {
            new: true
        };
    else
        options['new'] = true;
    let result = await model.findOneAndUpdate(query, update, options);
    return result;
};

//查找一个符合条件的数据并更新，然后返回更新后的数据 findOneAndUpdate({id:_id})相等

/**
 * @param
 * tableName  表名
 * id     该打记录的_id
 * update     更新的内容 可选参数
 * 可以使用{$set:{name:'mongodb'}} 格式
 * 也可以不使用$set，直接使用{name:'mongodb'} 格式
 * isInc      是值追加还是重新设置 可选参数 只能作用于数字型字段
 * options  同updateOne
 * @return 返回一个document或者js对象
 */
proto.findByIdAndUpdate = async function(tableName, id, update, isInc,options) {
    update = _convertUpdate(update, isInc);
    let model = this.allModels[tableName];
    if (!options)
        options = {
            new: true
        };
    else
        options['new'] = true;
    let result = await model.findByIdAndUpdate(id, update, options);
    return result;
};

/***************
* 删除数据相关方法
***************/

//删除符合条件的第一条数据,注意是第一条
/**
 * @param
 * tableName  表名
 * query     删除的条件
 * @return 返回一个操作记录对象 { n: 1, ok: 1 }
 * 它和findOneAndDelete的区别是它不返回找到的数据对象，只负责删除
 */
proto.deleteOne = async function(tableName, query) {
    let model = this.allModels[tableName];
    let result = await model.deleteOne(query);
    return result;
};

//删除符合条件的所有数据
/**
 * @param
 * tableName  表名
 * query     删除的条件
 * options  同updateOne,主要有skip limit等
 * @return 返回一个操作记录对象 { n: 1, ok: 1 }
 */
proto.deleteMany = async function(tableName, query,options) {
    let model = this.allModels[tableName];
    let result = await model.deleteMany(query,options);
    return result;
};

//找到并删除符合条件的第一条数据,并返回该数据
/**
 * @param
 * tableName  表名
 * query     删除的条件
 * options  同updateOne
 * @return 返回找到并删除的数据对象 如果找不到，返回null
 */
proto.findOneAndDelete = async function(tableName, query,options) {
    let model = this.allModels[tableName];
    let result = await model.findOneAndDelete(query,options);
    return result;
}

//根据_id查找一个数据并删除，并返回该数据
/**
 * @param
 * tableName  表名
 * id     查询的_id ,如果没有这个参数，返回null
 * options query.setOptions 比如 lean:true表示返回的是js对象，不是document
 * @return 返回被删除的数据,如果找不到，返回null
 */
proto.findByIdAndDelete = async function(tableName, id, options) {
    let model = this.allModels[tableName];
    let result = await model.findByIdAndDelete(id, options);
    return result;
}

/***************
* 其它相关方法
***************/

//更新或新建一条记录
//如果不存在，新建，如果存在，就更新,
//支持使用或者不使用$set 和$inc
/**
 * @param
 * tableName  表名
 * query     更新的条件
 * update 更新的内容
 * isInc 是否增加还是新设   只能作用于数字型字段
 * options 同updateOne
 * 这里需要说明，如果是没有记录，新建时即使是$inc操作符，也相当于$set，相当于在0的基础上增加
 * @return 返回一个数据记录document
 */
proto.updateOrSave = async function(tableName, query, update,isInc,options) {
    if(!options){
        options = {
            new: true,
            upsert: true
        };
    }else{
        options['new'] = true;
        options['upsert'] = true;
    }
    let result = await this.findOneAndUpdate(tableName, query, update, isInc,options );
    return result;
};

/**计数功能，返回符合条件的document数量，
* 如果你需要统计一个很大的集合里的所有数据(例如查询条件为{})，请使用countAll方法
* 因为它不会使用索引
*/
/**
 * @param
 * tableName  表名
 * query   查询条件
 * @return 返回查询到的数据总数
 */
proto.count = async function(tableName, query) {
    let model = this.allModels[tableName];
    let result = await model.countDocuments(query);
    return result;
};

/**
 * 查询条件为{}
 * @param
 * tableName  表名
 * options 选项,比如skip,limit等 一般不用
 * @return 返回表中的数据总数，
 */
proto.countAll = async function(tableName, options) {
    let model = this.allModels[tableName];
    let result = await model.estimatedDocumentCount(options);
    return result;
};

//分页查询
//这个自己写的方法方便自己使用，参数不能跳过，
/**
 * @param
 * tableName  表名
 * query   查询条件
 * pagesize 每页大小
 * pages  查询页
 * projection 选择字段，可选项
 * sortOption 排序选项 可选项  这里已经将sort包装好,可以使用sort或者不使用.这里单独将sort字段排了出来，如果不需要请输入null
 * 参数不能跳过，如果有sortOption参数，projection必须存在，要选择所有字段，请输入{}
 * options 其它额外选项，同updateOne 可选项包括skip,limit等
 * @return 返回查询到的document或者js对象数组
 */
proto.findByPage = async function(tableName, query, pagesize, pages,projection,sortOption,options) {
    if( pages < 1)
        pages = 1;
    if(!options)
        options = {};
    options["skip"] = (pages - 1) * pagesize;
    options["limit"] = pagesize;
    if(sortOption){
        if(sortOption["sort"])
            options["sort"] = sortOption["sort"];
        else
            options["sort"] = sortOption;
    }
    let model = this.allModels[tableName];
    let list = await model.find(query,projection,options);
    return list;
};

//对表进行聚合操作,使用管道模式
/**
 * @param
 * tableName  表名
 * options   聚合选项，是一个对象数组，分别为match stage 和 group stage
 * match stage 代表过滤条件,示例: { $match: { age: { $gte: 21 }}}
 * group stage 代表统计操作,示例: {$group:{_id:"$currency",counter:{$sum:1}}}
 * 这里面的第一个属性_id是固定的，必须存在，代表依据表的哪个字段进行分类。后面的统计可以自己定义属性，如果要使用表中的值，使用$fieldname
 * mongo shell中示例如下:
  db.betHistory3.aggregate([{$group:{_id:"$currency",次数:{$sum:1},投注总额:{$sum:"$bet"}}}]);
  代表根据currency分类统计各货币投注的次数和投注的总额，注意统计次数时直接累加1;

  db.betHistory3.aggregate([{$match:{currency:"etc"},{$group:{_id:null,次数:{$sum:1},投注总额:{$sum:"$bet"}}}]);
  代表只统计etc的投注次数和投注总额;

 * @return 返回一个js的统计对象的数组,对象的字段和group有关。
 */
proto.aggregate = async function(tableName,options){
    let model = this.allModels[tableName];
    let result = await model.aggregate(options).exec();
    return result;
};




//删除数据库中的一个表，记住除非必须请勿使用
/**
 * @param
 * tableName  表名
 * clearModel   是否销毁Model
 * @return 操作成功还是失败
 */
proto.dropCollection = async function(tableName,clearModel) {
    let result = await this.conn.db.dropCollection(tableName);
    if(clearModel)
        delete this.allModels[tableName];
    return result;
}

//删除整个数据库，记住除非必须请勿使用
/**
 * @param
 * clearModel   是否销毁所有Model
 * @return 操作成功还是失败
 */
proto.dropDatabase = async function(clearModel) {
    let result = await this.conn.db.dropDatabase();
    if(clearModel)
        this.allModels = {};
    return result;
}




//用来处理用户update时不输入$set or $inc的情况，手动加上,
//本方法仅用来处理 $set和 $inc 操作,如果有$操作符则不会改变
/**
 * @param
 * update  待处理的更新对象
 * isInc   是值增加加还是重新设置  只能作用于数字型字段
 * @return 返回处理后的更新对象，如果不需要处理，返回原数据
 */
function _convertUpdate(update, isInc) {
    if (!update)
        return null;
    let msg = isInc
        ? '$inc'
        : '$set';
    let keys = Object.keys(update);
    if (keys.length) {
        let key = keys[0].toString();
        if (key.substring(0, 1) !== '$') {
            let result = {};
            result[msg] = update;
            return result;
        }
    }
    return update;
}

module.exports = DBService;

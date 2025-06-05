const { escape, unescape } = require('html-escaper');

class Helpers {
    encode(data) {
        if(typeof data == 'object') {
            for(let key in data) {
                data[key] = this.encode(data[key])
            }
        }
        if(typeof data == 'string') data = escape(data);
        return data;
    }
    decode(str, type = 'html') {
        let res = '';
        if(str) res = type == 'text' ? str.replaceAll('\n', '<br/>') : unescape(str);
        return res;
    }
    filterObj(obj, ...allwoedFields) {
        const newObj = {};
        Object.keys(obj).forEach(el => {
            if(allwoedFields.includes(el)) {
                newObj[el] = obj[el]
            }
        });
        return newObj;
    }
    getDate(dateStrISO, type = 'full') {
        // date object
        let date = new Date(dateStrISO);
        // data of date
        let year = date.getFullYear(),
            month = date.getMonth() + 1,
            day = date.getDate(),
            hours = date.getHours(),
            minutes = date.getMinutes(),
            seconds = date.getSeconds();
    
        // add 0
        if (day < 10) day = '0' + day;
        if (month < 10) month = '0' + month;
        if (hours < 10) hours = '0' + hours;
        if (minutes < 10) minutes = '0' + minutes;
        if (seconds < 10) seconds = '0' + seconds;
    
        // result
        let result;
        if (type == 'full') {
            result = `${day}.${month}.${year}`;
        }
        if (type == 'date') {
            result = `${day}.${month}.${year}`;
        }
        if (type == 'hours') {
            result = `${hours}:${minutes}:${seconds}`;
        }
        return result;
    }
    async filterPromises(table, nameUsed) {
        const filePromises = table.map(async (key) => {
            const files = await File.findAll({
                where: {
                    name_used: nameUsed,
                    row_id: key.id,
                }
            });
            key.dataValues.files = files;
        });
    
        await Promise.all(filePromises);
    }
}

module.exports = new Helpers();


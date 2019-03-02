const fs = require('fs');
const path = require('path');

function IdGenerator(onErrorFn) {
    let currentId;
    const fileName = path.join(__dirname, '.id');

    function done(err, data) {
        console.debug(`done(..., ${data})`);
        if (err) currentId = 0;
        if (typeof data !== 'number') {
            console.debug('Returned data not a number');
            try {
                currentId = parseInt(data);
            } catch (e) {
                console.error(`Failed to parse returned data (${data}):`, e);
                currentId = 0;
            }
        } else {
            currentId = data;
        }
        if (Number.isNaN(currentId)) currentId = 0;
        console.debug('Finished init. Current id: ', currentId);
    }

    fs.readFile(fileName, { encoding: 'utf8' }, function (err, data) {
        let loadedData;
        console.debug('Finished reading file: ', data);

        if (err) {
            console.error('Failed to read file', err);
            if (onErrorFn) {
                return onErrorFn(err, done);
            } else {
                loadedData = 0;
            }
        } else {
            loadedData = data;
        }
        return done(null, loadedData);
    });

    function saveFile(id) {
        console.debug(`Saving id '${id}' to file.`);
        fs.writeFile(fileName, id, {
            flag: 'w'
        }, function (err) {
            if (err) console.error('Failed to save id file: ', err);
        });
    }

    function nextId() {
        ++currentId;
        console.debug('Generating new id: ', currentId);
        saveFile(currentId);
        return currentId;
    }

    return {
        nextId
    }
}

module.exports = IdGenerator;
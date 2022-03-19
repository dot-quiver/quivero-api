import fs from 'fs';

/**
 * @abstract saves json to file
 *
 * @param {Array} path
 * @param {Object} json_object
 * @param {String} name
 */
export const saveJSONtoFile = (path, json_object, name) => {
  // convert JSON object to string
  const json_str = JSON.stringify(json_object, null, 2);

  // write JSON string to a file
  fs.writeFile(`${name}.json`, json_str, (err) => {
    if (err) {
      throw err;
    }

    console.log('JSON data is saved.');
  });
};

/**
 * @abstract loads json to file
 *
 * @param {Array} path
 * @param {Object} name
 */
export const loadJSONfromFile = (path, name) => {
  const filedata = fs.readFileSync(`${path + name}.json`, 'utf8', (error, data) => {
    if (error) {
      console.log(error);
    }
  });

  return JSON.parse(filedata);
};

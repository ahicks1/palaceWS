var colors = require('colors');

exports.error = (tag,msg) => {
  console.log(tag.bold+" "+msg.red);
}

exports.warn = (tag,msg) => {
  console.log(tag.bold+" "+msg.orange);
}

exports.info = (tag,msg) => {
  console.log(tag.bold+" "+msg.green);
}
